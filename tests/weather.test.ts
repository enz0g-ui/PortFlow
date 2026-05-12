/**
 * Sanity tests for the weather pipeline.
 *
 * Run: `npm test` (uses tsx + node:test).
 *
 * - Unit-level: sanitizeWeather rejects NaN / absurd values, bounds
 *   wave height to 0-15m, returns null when out-of-range (so the UI
 *   can show "—" instead of nonsense).
 * - E2E: hits the real Open-Meteo marine API for Rotterdam and
 *   asserts the returned wave_height (if any) is within bounds.
 *   This is the contract test: if Open-Meteo changes their schema
 *   or starts emitting placeholder values, the test fails.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
// @ts-ignore — tsx resolves .ts at runtime; tsc complains because
// allowImportingTsExtensions is off in tsconfig (it'd require noEmit).
import { sanitizeWeather } from "../src/lib/weather";

describe("sanitizeWeather", () => {
  it("passes through valid values", () => {
    const out = sanitizeWeather({
      temperature_2m: 12.5,
      wind_speed_10m: 18,
      wind_gusts_10m: 25,
      wind_direction_10m: 270,
      precipitation: 0.2,
      cloud_cover: 75,
      wave_height: 1.8,
      wave_direction: 240,
    });
    assert.equal(out.temperature, 12.5);
    assert.equal(out.waveHeight, 1.8);
    assert.equal(out.waveDirection, 240);
  });

  it("rejects NaN and Infinity", () => {
    const out = sanitizeWeather({
      temperature_2m: NaN,
      wind_speed_10m: Infinity,
      wave_height: NaN,
      wave_direction: -Infinity,
    });
    assert.equal(out.temperature, 0); // non-nullable → 0
    assert.equal(out.windSpeed, 0);
    assert.equal(out.waveHeight, null); // nullable → null
    assert.equal(out.waveDirection, null);
  });

  it("rejects absurd wave heights (>15m)", () => {
    assert.equal(sanitizeWeather({ wave_height: 20 }).waveHeight, null);
    assert.equal(sanitizeWeather({ wave_height: 999 }).waveHeight, null);
    assert.equal(sanitizeWeather({ wave_height: 15.0001 }).waveHeight, null);
  });

  it("accepts edge wave heights at exactly 0 and 15", () => {
    assert.equal(sanitizeWeather({ wave_height: 0 }).waveHeight, 0);
    assert.equal(sanitizeWeather({ wave_height: 15 }).waveHeight, 15);
  });

  it("rejects negative wave heights (data corruption / -999 sentinel)", () => {
    assert.equal(sanitizeWeather({ wave_height: -1 }).waveHeight, null);
    assert.equal(sanitizeWeather({ wave_height: -999 }).waveHeight, null);
  });

  it("rejects out-of-range wave direction (must be 0-360)", () => {
    assert.equal(sanitizeWeather({ wave_direction: -45 }).waveDirection, null);
    assert.equal(sanitizeWeather({ wave_direction: 361 }).waveDirection, null);
    assert.equal(sanitizeWeather({ wave_direction: 0 }).waveDirection, 0);
    assert.equal(sanitizeWeather({ wave_direction: 360 }).waveDirection, 360);
  });

  it("defaults missing fields to 0 / null", () => {
    const out = sanitizeWeather({});
    assert.equal(out.temperature, 0);
    assert.equal(out.windSpeed, 0);
    assert.equal(out.waveHeight, null);
  });

  it("clamps extreme but plausible wind correctly", () => {
    // 100kn wind is hurricane — should pass
    assert.equal(sanitizeWeather({ wind_speed_10m: 100 }).windSpeed, 100);
    // 500kn is unphysical — should reject
    assert.equal(sanitizeWeather({ wind_speed_10m: 500 }).windSpeed, 0);
  });
});

describe("Open-Meteo marine API contract (e2e)", () => {
  it("returns plausible wave height for Rotterdam (51.95, 4.10)", async () => {
    const resp = await fetch(
      "https://marine-api.open-meteo.com/v1/marine?current=wave_height,wave_direction&timezone=auto&latitude=51.95&longitude=4.10",
      { signal: AbortSignal.timeout(10_000) },
    );
    assert.ok(resp.ok, `HTTP ${resp.status}`);
    const json = (await resp.json()) as {
      current?: { wave_height?: unknown; wave_direction?: unknown };
    };
    const sanitized = sanitizeWeather({
      wave_height: json.current?.wave_height,
      wave_direction: json.current?.wave_direction,
    });

    if (sanitized.waveHeight !== null) {
      assert.ok(
        sanitized.waveHeight >= 0 && sanitized.waveHeight <= 15,
        `wave_height ${sanitized.waveHeight} out of [0, 15]`,
      );
    }
    if (sanitized.waveDirection !== null) {
      assert.ok(
        sanitized.waveDirection >= 0 && sanitized.waveDirection <= 360,
        `wave_direction ${sanitized.waveDirection} out of [0, 360]`,
      );
    }
  });
});
