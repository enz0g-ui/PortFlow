export const dynamic = "force-dynamic";

const SPEC = {
  openapi: "3.1.0",
  info: {
    title: "Port Flow API",
    version: "1.0.0",
    description:
      "Multi-port AIS flow indices, predicted ETA, voyage history and anomaly signals.",
    contact: { name: "Port Flow" },
  },
  servers: [{ url: "/api/v1" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "token" },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/ports": {
      get: {
        summary: "List ports tracked by the platform",
        responses: { "200": { description: "Port catalog" } },
      },
    },
    "/ports/{id}/snapshot": {
      get: {
        summary: "Latest KPI snapshot for a port",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "KPI snapshot" },
          "404": { description: "Unknown port" },
        },
      },
    },
    "/ports/{id}/vessels": {
      get: {
        summary: "Live vessels in the port bbox",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          {
            name: "tankersOnly",
            in: "query",
            schema: { type: "string", enum: ["1"] },
          },
        ],
        responses: { "200": { description: "Vessel list" } },
      },
    },
    "/ports/{id}/voyages/active": {
      get: {
        summary: "Active inbound voyages with predicted ETA",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          {
            name: "tankersOnly",
            in: "query",
            schema: { type: "string", enum: ["1"] },
          },
        ],
        responses: { "200": { description: "Active voyages" } },
      },
    },
    "/ports/{id}/voyages/closed": {
      get: {
        summary: "Closed voyages with predicted vs actual arrival times",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          {
            name: "days",
            in: "query",
            schema: { type: "integer", default: 30 },
          },
        ],
        responses: { "200": { description: "Closed voyages + accuracy stats" } },
      },
    },
    "/ports/{id}/anomalies": {
      get: {
        summary: "Active anomalies (long dwell, etc.)",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { "200": { description: "Anomaly list" } },
      },
    },
  },
};

export async function GET() {
  return Response.json(SPEC);
}
