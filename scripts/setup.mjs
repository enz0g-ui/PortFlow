#!/usr/bin/env node
/**
 * Port Flow setup wizard. Multilingual (FR/EN/NL/DE/ES).
 * Run with: npm run setup
 *           npm run setup -- --lang fr|en|nl|de|es
 *           npm run setup -- --no-test
 *
 * Walks through each environment variable, shows the current value (masked
 * for secrets), accepts a new value, optionally tests a connection, and
 * writes to .env.local atomically.
 *
 * Pure Node ESM, no third-party dependencies.
 */

import { createInterface } from "node:readline";
import {
  existsSync,
  readFileSync,
  renameSync,
  writeFileSync,
  mkdirSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { randomBytes } from "node:crypto";

const ENV_FILE = resolve(process.cwd(), ".env.local");
const ENV_BAK = resolve(process.cwd(), ".env.local.bak");

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

// ====================== i18n ======================

const LOCALES = ["fr", "en", "nl", "de", "es"];

function detectLocale() {
  const args = process.argv;
  const idx = args.findIndex((a) => a === "--lang" || a === "-l");
  if (idx > -1 && args[idx + 1] && LOCALES.includes(args[idx + 1])) {
    return args[idx + 1];
  }
  const env =
    process.env.LC_ALL ||
    process.env.LC_MESSAGES ||
    process.env.LANG ||
    process.env.LANGUAGE ||
    "";
  const lower = env.toLowerCase();
  for (const loc of LOCALES) {
    if (lower.startsWith(loc)) return loc;
  }
  return "en";
}

const LOCALE = detectLocale();

const T = {
  fr: {
    "wizard.title": "Port Flow — assistant de configuration",
    "wizard.intro":
      "Parcours toutes les variables d'environnement. Appuie sur Entrée\npour conserver la valeur actuelle, tape `-` pour effacer, ou colle\nune nouvelle valeur pour remplacer.",
    "wizard.lang.using": "Langue détectée :",
    "wizard.lang.override":
      "Pour changer : npm run setup -- --lang en|fr|nl|de|es",
    "section.core": "Essentiel (requis)",
    "section.auth": "Authentification (Clerk) — optionnelle, requise pour la facturation",
    "section.billing": "Facturation (Stripe) — optionnelle",
    "section.sentry": "Suivi d'erreurs (Sentry) — optionnel",
    "section.db": "Base de données production — optionnelle",
    "section.sar": "Scanner SAR (Copernicus Data Space) — optionnel, GRATUIT",
    "section.satPaid": "Fournisseurs satellite payants — optionnel",
    "section.runtime": "Exécution — valeurs par défaut habituelles",
    "default.none": "(aucune, Entrée pour passer)",
    "default.required": "(requis)",
    "input.test": "  Tester la connexion ?",
    "input.gen": "  Générer une nouvelle clé bearer PORT_API_TOKENS ?",
    "input.demo": "  Activer le mode démo SAR (détections synthétiques) ?",
    "test.aisstream": "aisstream.io",
    "test.aisstream.ok": "premier message reçu — clé valide",
    "test.aisstream.timeout": "délai dépassé (10s)",
    "test.aisstream.unauthorized": "non autorisé (code {code})",
    "test.aisstream.skipped":
      "module ws non installé — lance d'abord `npm install`",
    "test.copernicus": "copernicus",
    "test.copernicus.ok": "jeton OAuth obtenu",
    "test.stripe": "stripe",
    "test.stripe.ok": "clé authentifiée",
    "test.stripe.unauthorized": "non autorisé",
    "validator.tooShort": "semble trop court pour une vraie clé",
    "generated": "  ✓ Générée :",
    "wrote": "✓ Configuration écrite dans",
    "backup": "  Sauvegarde de l'ancien fichier dans",
    "summary": "Résumé de la configuration",
    "restart":
      "Redémarre le serveur de dev (`npm run dev`) pour prendre en compte les nouvelles valeurs.",
    "label.AISSTREAM_API_KEY": "Clé API aisstream.io",
    "hint.AISSTREAM_API_KEY": "Inscription gratuite : https://aisstream.io",
    "label.PORT_API_TOKENS": "Jetons bearer API (PORT_API_TOKENS)",
    "hint.PORT_API_TOKENS":
      "Liste séparée par virgules. Servent à l'accès /api/v1/*",
    "label.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY": "Clé publishable Clerk",
    "hint.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY":
      "https://dashboard.clerk.com → API keys → Publishable key",
    "label.CLERK_SECRET_KEY": "Clé secrète Clerk",
    "hint.CLERK_SECRET_KEY":
      "Côté serveur uniquement, ne jamais exposer au client",
    "label.STRIPE_SECRET_KEY": "Clé secrète Stripe",
    "hint.STRIPE_SECRET_KEY":
      "https://dashboard.stripe.com/apikeys (commencer par sk_test_…)",
    "label.STRIPE_WEBHOOK_SECRET": "Secret webhook Stripe",
    "hint.STRIPE_WEBHOOK_SECRET":
      "Stripe → Developers → Webhooks → Add endpoint → /api/billing/webhook",
    "label.STRIPE_PRICE_STARTER": "ID prix Stripe Starter",
    "hint.STRIPE_PRICE_STARTER": "price_… pour le produit Starter récurrent",
    "label.STRIPE_PRICE_PRO": "ID prix Stripe Pro",
    "hint.STRIPE_PRICE_PRO": "price_… pour le produit Pro récurrent",
    "label.STRIPE_PRICE_ENTERPRISE": "ID prix Stripe Enterprise",
    "hint.STRIPE_PRICE_ENTERPRISE": "price_… (optionnel, sinon contact-sales)",
    "label.SENTRY_DSN": "DSN Sentry (serveur)",
    "hint.SENTRY_DSN": "Depuis sentry.io",
    "label.NEXT_PUBLIC_SENTRY_DSN": "DSN Sentry (client)",
    "hint.NEXT_PUBLIC_SENTRY_DSN":
      "Peut être le même projet que le DSN serveur",
    "label.DATABASE_URL": "URL Postgres",
    "hint.DATABASE_URL":
      "Chaîne de connexion Postgres (Neon free tier OK). Vide pour rester sur SQLite local.",
    "label.COPERNICUS_CLIENT_ID": "Client ID Copernicus",
    "hint.COPERNICUS_CLIENT_ID":
      "Inscription gratuite : https://dataspace.copernicus.eu → User dashboard → OAuth Clients",
    "label.COPERNICUS_CLIENT_SECRET": "Client secret Copernicus",
    "label.SPIRE_API_TOKEN": "Token Spire Maritime",
    "hint.SPIRE_API_TOKEN": "Spire Maritime — sales@spire.com",
    "label.MARINETRAFFIC_API_KEY": "Clé API MarineTraffic",
    "hint.MARINETRAFFIC_API_KEY":
      "https://www.marinetraffic.com/p/api-services",
    "label.ORBCOMM_API_TOKEN": "Token Orbcomm",
    "label.EOG_LICENSE_KEY": "Clé licence EOG (VIIRS)",
    "hint.EOG_LICENSE_KEY":
      "VIIRS Boat Detection — licence commerciale Payne Institute",
    "label.LOG_FORMAT": "Format des logs",
    "hint.LOG_FORMAT":
      "plain | json — json recommandé pour aggregation production",
    "label.LOG_LEVEL": "Niveau de log",
    "hint.LOG_LEVEL": "info | debug",
    "label.API_RATE_LIMIT": "Rate limit API",
    "hint.API_RATE_LIMIT": "Par défaut 300 req/min/token",
    "summary.AIS feed": "Flux AIS",
    "summary.API tokens": "Jetons API",
    "summary.Auth (Clerk)": "Auth (Clerk)",
    "summary.Billing (Stripe)": "Facturation (Stripe)",
    "summary.Error tracking (Sentry)": "Suivi d'erreurs (Sentry)",
    "summary.Postgres": "Postgres",
    "summary.SAR scanner": "Scanner SAR",
    "summary.Paid sat": "Sat. payants",
  },
  en: {
    "wizard.title": "Port Flow — setup wizard",
    "wizard.intro":
      "Walks through each environment variable. Press Enter to keep the\ncurrent value, type `-` to clear, or paste a new value to override.",
    "wizard.lang.using": "Detected language:",
    "wizard.lang.override":
      "To override: npm run setup -- --lang en|fr|nl|de|es",
    "section.core": "Core (required)",
    "section.auth": "Auth (Clerk) — optional, required for billing",
    "section.billing": "Billing (Stripe) — optional",
    "section.sentry": "Error tracking (Sentry) — optional",
    "section.db": "Production database — optional",
    "section.sar": "SAR scanner (Copernicus Data Space) — optional, FREE",
    "section.satPaid": "Paid satellite providers — optional",
    "section.runtime": "Runtime — usually defaults",
    "default.none": "(none, skip with Enter)",
    "default.required": "(required)",
    "input.test": "  Test the connection?",
    "input.gen": "  Generate a new PORT_API_TOKENS bearer key?",
    "input.demo": "  Enable SAR demo mode (synthetic detections)?",
    "test.aisstream": "aisstream.io",
    "test.aisstream.ok": "received first message — key is valid",
    "test.aisstream.timeout": "timeout (10s)",
    "test.aisstream.unauthorized": "unauthorised (code {code})",
    "test.aisstream.skipped":
      "ws module not installed — run `npm install` first",
    "test.copernicus": "copernicus",
    "test.copernicus.ok": "OAuth token obtained",
    "test.stripe": "stripe",
    "test.stripe.ok": "key authenticates",
    "test.stripe.unauthorized": "unauthorised",
    "validator.tooShort": "looks too short to be a valid key",
    "generated": "  ✓ Generated:",
    "wrote": "✓ Configuration written to",
    "backup": "  Backup of previous file at",
    "summary": "Configuration summary",
    "restart": "Restart the dev server (`npm run dev`) to pick up the new values.",
    "label.AISSTREAM_API_KEY": "aisstream.io API key",
    "hint.AISSTREAM_API_KEY": "Free signup: https://aisstream.io",
    "label.PORT_API_TOKENS": "API bearer tokens (PORT_API_TOKENS)",
    "hint.PORT_API_TOKENS":
      "Comma-separated list of bearer tokens for /api/v1/* access",
    "label.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY": "Clerk publishable key",
    "hint.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY":
      "https://dashboard.clerk.com → API keys → Publishable key",
    "label.CLERK_SECRET_KEY": "Clerk secret key",
    "hint.CLERK_SECRET_KEY":
      "Server-side only, never expose to client",
    "label.STRIPE_SECRET_KEY": "Stripe secret key",
    "hint.STRIPE_SECRET_KEY":
      "https://dashboard.stripe.com/apikeys (use sk_test_… first)",
    "label.STRIPE_WEBHOOK_SECRET": "Stripe webhook secret",
    "hint.STRIPE_WEBHOOK_SECRET":
      "Stripe → Developers → Webhooks → Add endpoint → /api/billing/webhook",
    "label.STRIPE_PRICE_STARTER": "Stripe Starter price ID",
    "hint.STRIPE_PRICE_STARTER":
      "price_… for the Starter recurring product",
    "label.STRIPE_PRICE_PRO": "Stripe Pro price ID",
    "hint.STRIPE_PRICE_PRO": "price_… for the Pro recurring product",
    "label.STRIPE_PRICE_ENTERPRISE": "Stripe Enterprise price ID",
    "hint.STRIPE_PRICE_ENTERPRISE":
      "price_… (optional, otherwise contact-sales)",
    "label.SENTRY_DSN": "Sentry DSN (server)",
    "hint.SENTRY_DSN": "From sentry.io",
    "label.NEXT_PUBLIC_SENTRY_DSN": "Sentry DSN (client)",
    "hint.NEXT_PUBLIC_SENTRY_DSN": "Can be the same project as the server DSN",
    "label.DATABASE_URL": "Postgres URL",
    "hint.DATABASE_URL":
      "Postgres connection string (Neon free tier works). Empty for local SQLite.",
    "label.COPERNICUS_CLIENT_ID": "Copernicus client ID",
    "hint.COPERNICUS_CLIENT_ID":
      "Free signup: https://dataspace.copernicus.eu → User dashboard → OAuth Clients",
    "label.COPERNICUS_CLIENT_SECRET": "Copernicus client secret",
    "label.SPIRE_API_TOKEN": "Spire Maritime token",
    "hint.SPIRE_API_TOKEN": "Spire Maritime — sales@spire.com",
    "label.MARINETRAFFIC_API_KEY": "MarineTraffic API key",
    "hint.MARINETRAFFIC_API_KEY":
      "https://www.marinetraffic.com/p/api-services",
    "label.ORBCOMM_API_TOKEN": "Orbcomm API token",
    "label.EOG_LICENSE_KEY": "EOG license key (VIIRS)",
    "hint.EOG_LICENSE_KEY":
      "VIIRS Boat Detection — Payne Institute commercial license",
    "label.LOG_FORMAT": "Log format",
    "hint.LOG_FORMAT":
      "plain | json — json recommended for production aggregation",
    "label.LOG_LEVEL": "Log level",
    "hint.LOG_LEVEL": "info | debug",
    "label.API_RATE_LIMIT": "API rate limit",
    "hint.API_RATE_LIMIT": "Default 300 req/min/token",
    "summary.AIS feed": "AIS feed",
    "summary.API tokens": "API tokens",
    "summary.Auth (Clerk)": "Auth (Clerk)",
    "summary.Billing (Stripe)": "Billing (Stripe)",
    "summary.Error tracking (Sentry)": "Error tracking (Sentry)",
    "summary.Postgres": "Postgres",
    "summary.SAR scanner": "SAR scanner",
    "summary.Paid sat": "Paid sat",
  },
  nl: {
    "wizard.title": "Port Flow — installatie-assistent",
    "wizard.intro":
      "Doorloopt elke omgevingsvariabele. Druk op Enter om de huidige waarde\nte behouden, typ `-` om te wissen, of plak een nieuwe waarde.",
    "wizard.lang.using": "Gedetecteerde taal:",
    "wizard.lang.override":
      "Aanpassen: npm run setup -- --lang en|fr|nl|de|es",
    "section.core": "Kern (verplicht)",
    "section.auth": "Auth (Clerk) — optioneel, vereist voor facturering",
    "section.billing": "Facturering (Stripe) — optioneel",
    "section.sentry": "Foutmonitoring (Sentry) — optioneel",
    "section.db": "Productie-database — optioneel",
    "section.sar": "SAR-scanner (Copernicus) — optioneel, GRATIS",
    "section.satPaid": "Betaalde satellietleveranciers — optioneel",
    "section.runtime": "Runtime — standaardwaarden",
    "default.none": "(geen, sla over met Enter)",
    "default.required": "(verplicht)",
    "input.test": "  Verbinding testen?",
    "input.gen": "  Nieuwe PORT_API_TOKENS bearer-sleutel genereren?",
    "input.demo": "  SAR demo-modus inschakelen (synthetische detecties)?",
    "test.aisstream": "aisstream.io",
    "test.aisstream.ok": "eerste bericht ontvangen — sleutel geldig",
    "test.aisstream.timeout": "time-out (10s)",
    "test.aisstream.unauthorized": "niet geautoriseerd (code {code})",
    "test.aisstream.skipped":
      "ws-module nog niet geïnstalleerd — voer eerst `npm install` uit",
    "test.copernicus": "copernicus",
    "test.copernicus.ok": "OAuth-token verkregen",
    "test.stripe": "stripe",
    "test.stripe.ok": "sleutel authenticeert",
    "test.stripe.unauthorized": "niet geautoriseerd",
    "validator.tooShort": "lijkt te kort voor een geldige sleutel",
    "generated": "  ✓ Gegenereerd:",
    "wrote": "✓ Configuratie geschreven naar",
    "backup": "  Back-up van vorig bestand op",
    "summary": "Configuratie-overzicht",
    "restart":
      "Herstart de dev-server (`npm run dev`) om de nieuwe waarden te laden.",
    "label.AISSTREAM_API_KEY": "aisstream.io API-sleutel",
    "hint.AISSTREAM_API_KEY": "Gratis aanmelden: https://aisstream.io",
    "label.PORT_API_TOKENS": "API bearer-tokens (PORT_API_TOKENS)",
    "hint.PORT_API_TOKENS":
      "Komma-gescheiden lijst voor /api/v1/* toegang",
    "label.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY": "Clerk publishable key",
    "hint.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY":
      "https://dashboard.clerk.com → API keys",
    "label.CLERK_SECRET_KEY": "Clerk secret key",
    "hint.CLERK_SECRET_KEY": "Alleen server-side, nooit aan client tonen",
    "label.STRIPE_SECRET_KEY": "Stripe secret key",
    "hint.STRIPE_SECRET_KEY":
      "https://dashboard.stripe.com/apikeys (begin met sk_test_…)",
    "label.STRIPE_WEBHOOK_SECRET": "Stripe webhook secret",
    "hint.STRIPE_WEBHOOK_SECRET":
      "Stripe → Webhooks → endpoint /api/billing/webhook",
    "label.STRIPE_PRICE_STARTER": "Stripe Starter price ID",
    "hint.STRIPE_PRICE_STARTER": "price_… voor het Starter abonnement",
    "label.STRIPE_PRICE_PRO": "Stripe Pro price ID",
    "hint.STRIPE_PRICE_PRO": "price_… voor het Pro abonnement",
    "label.STRIPE_PRICE_ENTERPRISE": "Stripe Enterprise price ID",
    "hint.STRIPE_PRICE_ENTERPRISE": "price_… (optioneel)",
    "label.SENTRY_DSN": "Sentry DSN (server)",
    "hint.SENTRY_DSN": "Van sentry.io",
    "label.NEXT_PUBLIC_SENTRY_DSN": "Sentry DSN (client)",
    "hint.NEXT_PUBLIC_SENTRY_DSN":
      "Kan hetzelfde project zijn als de server-DSN",
    "label.DATABASE_URL": "Postgres URL",
    "hint.DATABASE_URL":
      "Postgres connection string (Neon free tier OK). Leeg = lokale SQLite.",
    "label.COPERNICUS_CLIENT_ID": "Copernicus client ID",
    "hint.COPERNICUS_CLIENT_ID":
      "Gratis: https://dataspace.copernicus.eu → OAuth Clients",
    "label.COPERNICUS_CLIENT_SECRET": "Copernicus client secret",
    "label.SPIRE_API_TOKEN": "Spire Maritime token",
    "hint.SPIRE_API_TOKEN": "Spire Maritime — sales@spire.com",
    "label.MARINETRAFFIC_API_KEY": "MarineTraffic API key",
    "hint.MARINETRAFFIC_API_KEY":
      "https://www.marinetraffic.com/p/api-services",
    "label.ORBCOMM_API_TOKEN": "Orbcomm API token",
    "label.EOG_LICENSE_KEY": "EOG licentiesleutel (VIIRS)",
    "hint.EOG_LICENSE_KEY":
      "VIIRS Boat Detection — Payne Institute commerciële licentie",
    "label.LOG_FORMAT": "Log-formaat",
    "hint.LOG_FORMAT":
      "plain | json — json aanbevolen voor productie-aggregatie",
    "label.LOG_LEVEL": "Log-niveau",
    "hint.LOG_LEVEL": "info | debug",
    "label.API_RATE_LIMIT": "API rate limit",
    "hint.API_RATE_LIMIT": "Standaard 300 req/min/token",
    "summary.AIS feed": "AIS feed",
    "summary.API tokens": "API tokens",
    "summary.Auth (Clerk)": "Auth (Clerk)",
    "summary.Billing (Stripe)": "Facturering (Stripe)",
    "summary.Error tracking (Sentry)": "Foutmonitoring (Sentry)",
    "summary.Postgres": "Postgres",
    "summary.SAR scanner": "SAR-scanner",
    "summary.Paid sat": "Betaalde sat.",
  },
  de: {
    "wizard.title": "Port Flow — Einrichtungsassistent",
    "wizard.intro":
      "Geht durch jede Umgebungsvariable. Drücke Enter, um den aktuellen\nWert zu behalten, tippe `-` zum Löschen, oder einen neuen Wert.",
    "wizard.lang.using": "Erkannte Sprache:",
    "wizard.lang.override":
      "Ändern: npm run setup -- --lang en|fr|nl|de|es",
    "section.core": "Kern (erforderlich)",
    "section.auth": "Auth (Clerk) — optional, erforderlich für Abrechnung",
    "section.billing": "Abrechnung (Stripe) — optional",
    "section.sentry": "Fehler-Tracking (Sentry) — optional",
    "section.db": "Produktionsdatenbank — optional",
    "section.sar": "SAR-Scanner (Copernicus) — optional, KOSTENLOS",
    "section.satPaid": "Kostenpflichtige Satellitenanbieter — optional",
    "section.runtime": "Laufzeit — Standardwerte",
    "default.none": "(keine, Enter zum Überspringen)",
    "default.required": "(erforderlich)",
    "input.test": "  Verbindung testen?",
    "input.gen": "  Neuen PORT_API_TOKENS Bearer-Schlüssel generieren?",
    "input.demo":
      "  SAR-Demo-Modus aktivieren (synthetische Erkennungen)?",
    "test.aisstream": "aisstream.io",
    "test.aisstream.ok":
      "erste Nachricht empfangen — Schlüssel ist gültig",
    "test.aisstream.timeout": "Zeitüberschreitung (10s)",
    "test.aisstream.unauthorized": "nicht autorisiert (Code {code})",
    "test.aisstream.skipped":
      "ws-Modul nicht installiert — zuerst `npm install` ausführen",
    "test.copernicus": "copernicus",
    "test.copernicus.ok": "OAuth-Token erhalten",
    "test.stripe": "stripe",
    "test.stripe.ok": "Schlüssel authentifiziert",
    "test.stripe.unauthorized": "nicht autorisiert",
    "validator.tooShort": "scheint zu kurz für einen gültigen Schlüssel",
    "generated": "  ✓ Generiert:",
    "wrote": "✓ Konfiguration geschrieben in",
    "backup": "  Sicherung der vorherigen Datei unter",
    "summary": "Konfigurationsübersicht",
    "restart":
      "Starte den Dev-Server neu (`npm run dev`), um die neuen Werte zu laden.",
    "label.AISSTREAM_API_KEY": "aisstream.io API-Schlüssel",
    "hint.AISSTREAM_API_KEY":
      "Kostenlose Anmeldung: https://aisstream.io",
    "label.PORT_API_TOKENS": "API Bearer-Tokens (PORT_API_TOKENS)",
    "hint.PORT_API_TOKENS":
      "Kommagetrennte Liste für /api/v1/* Zugriff",
    "label.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY": "Clerk Publishable Key",
    "hint.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY": "https://dashboard.clerk.com",
    "label.CLERK_SECRET_KEY": "Clerk Secret Key",
    "hint.CLERK_SECRET_KEY": "Nur server-seitig, niemals an Client zeigen",
    "label.STRIPE_SECRET_KEY": "Stripe Secret Key",
    "hint.STRIPE_SECRET_KEY":
      "https://dashboard.stripe.com/apikeys (mit sk_test_… anfangen)",
    "label.STRIPE_WEBHOOK_SECRET": "Stripe Webhook Secret",
    "hint.STRIPE_WEBHOOK_SECRET":
      "Stripe → Webhooks → Endpunkt /api/billing/webhook",
    "label.STRIPE_PRICE_STARTER": "Stripe Starter Preis-ID",
    "hint.STRIPE_PRICE_STARTER": "price_… für das Starter-Abo",
    "label.STRIPE_PRICE_PRO": "Stripe Pro Preis-ID",
    "hint.STRIPE_PRICE_PRO": "price_… für das Pro-Abo",
    "label.STRIPE_PRICE_ENTERPRISE": "Stripe Enterprise Preis-ID",
    "hint.STRIPE_PRICE_ENTERPRISE": "price_… (optional)",
    "label.SENTRY_DSN": "Sentry DSN (Server)",
    "hint.SENTRY_DSN": "Von sentry.io",
    "label.NEXT_PUBLIC_SENTRY_DSN": "Sentry DSN (Client)",
    "hint.NEXT_PUBLIC_SENTRY_DSN":
      "Kann dasselbe Projekt wie der Server-DSN sein",
    "label.DATABASE_URL": "Postgres URL",
    "hint.DATABASE_URL":
      "Postgres Connection String (Neon free tier OK). Leer = lokale SQLite.",
    "label.COPERNICUS_CLIENT_ID": "Copernicus Client ID",
    "hint.COPERNICUS_CLIENT_ID":
      "Kostenlos: https://dataspace.copernicus.eu → OAuth Clients",
    "label.COPERNICUS_CLIENT_SECRET": "Copernicus Client Secret",
    "label.SPIRE_API_TOKEN": "Spire Maritime Token",
    "hint.SPIRE_API_TOKEN": "Spire Maritime — sales@spire.com",
    "label.MARINETRAFFIC_API_KEY": "MarineTraffic API Key",
    "hint.MARINETRAFFIC_API_KEY":
      "https://www.marinetraffic.com/p/api-services",
    "label.ORBCOMM_API_TOKEN": "Orbcomm API Token",
    "label.EOG_LICENSE_KEY": "EOG Lizenzschlüssel (VIIRS)",
    "hint.EOG_LICENSE_KEY":
      "VIIRS Boat Detection — Payne Institute kommerzielle Lizenz",
    "label.LOG_FORMAT": "Log-Format",
    "hint.LOG_FORMAT":
      "plain | json — json empfohlen für Produktions-Aggregation",
    "label.LOG_LEVEL": "Log-Level",
    "hint.LOG_LEVEL": "info | debug",
    "label.API_RATE_LIMIT": "API Rate Limit",
    "hint.API_RATE_LIMIT": "Standardmäßig 300 req/min/Token",
    "summary.AIS feed": "AIS-Feed",
    "summary.API tokens": "API-Tokens",
    "summary.Auth (Clerk)": "Auth (Clerk)",
    "summary.Billing (Stripe)": "Abrechnung (Stripe)",
    "summary.Error tracking (Sentry)": "Fehler-Tracking (Sentry)",
    "summary.Postgres": "Postgres",
    "summary.SAR scanner": "SAR-Scanner",
    "summary.Paid sat": "Bezahlte Sat.",
  },
  es: {
    "wizard.title": "Port Flow — asistente de configuración",
    "wizard.intro":
      "Recorre cada variable de entorno. Pulsa Enter para mantener el\nvalor actual, escribe `-` para borrar, o pega un nuevo valor.",
    "wizard.lang.using": "Idioma detectado:",
    "wizard.lang.override":
      "Para cambiar: npm run setup -- --lang en|fr|nl|de|es",
    "section.core": "Esenciales (requeridos)",
    "section.auth":
      "Autenticación (Clerk) — opcional, requerida para facturación",
    "section.billing": "Facturación (Stripe) — opcional",
    "section.sentry": "Seguimiento de errores (Sentry) — opcional",
    "section.db": "Base de datos producción — opcional",
    "section.sar": "Escáner SAR (Copernicus) — opcional, GRATIS",
    "section.satPaid": "Proveedores satélite de pago — opcional",
    "section.runtime": "Tiempo de ejecución — valores por defecto",
    "default.none": "(ninguno, Enter para omitir)",
    "default.required": "(requerido)",
    "input.test": "  ¿Probar la conexión?",
    "input.gen": "  ¿Generar nueva clave bearer PORT_API_TOKENS?",
    "input.demo":
      "  ¿Activar modo demo SAR (detecciones sintéticas)?",
    "test.aisstream": "aisstream.io",
    "test.aisstream.ok": "primer mensaje recibido — clave válida",
    "test.aisstream.timeout": "tiempo agotado (10s)",
    "test.aisstream.unauthorized": "no autorizado (código {code})",
    "test.aisstream.skipped":
      "módulo ws no instalado — ejecuta `npm install` primero",
    "test.copernicus": "copernicus",
    "test.copernicus.ok": "token OAuth obtenido",
    "test.stripe": "stripe",
    "test.stripe.ok": "clave autenticada",
    "test.stripe.unauthorized": "no autorizado",
    "validator.tooShort": "parece demasiado corto para una clave válida",
    "generated": "  ✓ Generada:",
    "wrote": "✓ Configuración escrita en",
    "backup": "  Copia de seguridad del archivo anterior en",
    "summary": "Resumen de configuración",
    "restart":
      "Reinicia el servidor de dev (`npm run dev`) para cargar los nuevos valores.",
    "label.AISSTREAM_API_KEY": "Clave API aisstream.io",
    "hint.AISSTREAM_API_KEY": "Registro gratuito: https://aisstream.io",
    "label.PORT_API_TOKENS": "Tokens bearer API (PORT_API_TOKENS)",
    "hint.PORT_API_TOKENS":
      "Lista separada por comas para acceso /api/v1/*",
    "label.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY": "Clave publishable Clerk",
    "hint.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY":
      "https://dashboard.clerk.com → API keys",
    "label.CLERK_SECRET_KEY": "Clave secreta Clerk",
    "hint.CLERK_SECRET_KEY": "Solo lado servidor, nunca exponer al cliente",
    "label.STRIPE_SECRET_KEY": "Clave secreta Stripe",
    "hint.STRIPE_SECRET_KEY":
      "https://dashboard.stripe.com/apikeys (empieza con sk_test_…)",
    "label.STRIPE_WEBHOOK_SECRET": "Webhook secret Stripe",
    "hint.STRIPE_WEBHOOK_SECRET":
      "Stripe → Webhooks → endpoint /api/billing/webhook",
    "label.STRIPE_PRICE_STARTER": "ID precio Stripe Starter",
    "hint.STRIPE_PRICE_STARTER": "price_… del producto Starter recurrente",
    "label.STRIPE_PRICE_PRO": "ID precio Stripe Pro",
    "hint.STRIPE_PRICE_PRO": "price_… del producto Pro recurrente",
    "label.STRIPE_PRICE_ENTERPRISE": "ID precio Stripe Enterprise",
    "hint.STRIPE_PRICE_ENTERPRISE": "price_… (opcional)",
    "label.SENTRY_DSN": "DSN Sentry (servidor)",
    "hint.SENTRY_DSN": "Desde sentry.io",
    "label.NEXT_PUBLIC_SENTRY_DSN": "DSN Sentry (cliente)",
    "hint.NEXT_PUBLIC_SENTRY_DSN":
      "Puede ser el mismo proyecto que el DSN servidor",
    "label.DATABASE_URL": "URL Postgres",
    "hint.DATABASE_URL":
      "Cadena de conexión Postgres (Neon free tier OK). Vacío = SQLite local.",
    "label.COPERNICUS_CLIENT_ID": "Client ID Copernicus",
    "hint.COPERNICUS_CLIENT_ID":
      "Gratis: https://dataspace.copernicus.eu → OAuth Clients",
    "label.COPERNICUS_CLIENT_SECRET": "Client secret Copernicus",
    "label.SPIRE_API_TOKEN": "Token Spire Maritime",
    "hint.SPIRE_API_TOKEN": "Spire Maritime — sales@spire.com",
    "label.MARINETRAFFIC_API_KEY": "Clave API MarineTraffic",
    "hint.MARINETRAFFIC_API_KEY":
      "https://www.marinetraffic.com/p/api-services",
    "label.ORBCOMM_API_TOKEN": "Token Orbcomm",
    "label.EOG_LICENSE_KEY": "Clave licencia EOG (VIIRS)",
    "hint.EOG_LICENSE_KEY":
      "VIIRS Boat Detection — licencia comercial Payne Institute",
    "label.LOG_FORMAT": "Formato de log",
    "hint.LOG_FORMAT":
      "plain | json — json recomendado para agregación producción",
    "label.LOG_LEVEL": "Nivel de log",
    "hint.LOG_LEVEL": "info | debug",
    "label.API_RATE_LIMIT": "Límite de tasa API",
    "hint.API_RATE_LIMIT": "Por defecto 300 req/min/token",
    "summary.AIS feed": "Feed AIS",
    "summary.API tokens": "Tokens API",
    "summary.Auth (Clerk)": "Auth (Clerk)",
    "summary.Billing (Stripe)": "Facturación (Stripe)",
    "summary.Error tracking (Sentry)": "Seguimiento errores (Sentry)",
    "summary.Postgres": "Postgres",
    "summary.SAR scanner": "Escáner SAR",
    "summary.Paid sat": "Sat. de pago",
  },
};

function t(key, params = {}) {
  const dict = T[LOCALE] ?? T.en;
  let value = dict[key] ?? T.en[key] ?? key;
  for (const [k, v] of Object.entries(params)) {
    value = value.replace(`{${k}}`, String(v));
  }
  return value;
}

// ====================== I/O ======================

const rl = createInterface({ input: process.stdin, output: process.stdout });

function ask(q) {
  return new Promise((resolve) => rl.question(q, (a) => resolve(a)));
}

async function askWithDefault(envKey, current, opts = {}) {
  const { secret = false, optional = true, validator } = opts;
  const label = t(`label.${envKey}`);
  const hint = t(`hint.${envKey}`, {});
  const display = current
    ? secret
      ? `${current.slice(0, 4)}…${current.slice(-2)} (${current.length} chars)`
      : current
    : C.gray + (optional ? t("default.none") : t("default.required")) + C.reset;
  const hintLine =
    hint && hint !== `hint.${envKey}` ? `\n  ${C.gray}${hint}${C.reset}` : "";
  const prompt = `${C.bold}${label}${C.reset} [${display}]${hintLine}\n› `;
  const answer = (await ask(prompt)).trim();
  if (!answer) return current ?? "";
  if (answer === "-") return "";
  if (validator) {
    const err = validator(answer);
    if (err) {
      console.log(C.red + "  ✗ " + err + C.reset);
      return askWithDefault(envKey, current, opts);
    }
  }
  return answer;
}

async function askYesNo(labelKey, defaultYes = false) {
  const def = defaultYes ? "Y/n" : "y/N";
  const a = (await ask(`${C.bold}${t(labelKey)}${C.reset} [${def}] › `))
    .trim()
    .toLowerCase();
  if (!a) return defaultYes;
  return a.startsWith("y") || a.startsWith("o") || a.startsWith("j") || a === "1";
}

function readEnv() {
  const env = {};
  if (!existsSync(ENV_FILE)) return env;
  const lines = readFileSync(ENV_FILE, "utf-8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

const GROUPS = [
  { title: "section.core", keys: ["AISSTREAM_API_KEY", "PORT_API_TOKENS"] },
  {
    title: "section.auth",
    keys: [
      "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
      "CLERK_SECRET_KEY",
      "NEXT_PUBLIC_CLERK_SIGN_IN_URL",
      "NEXT_PUBLIC_CLERK_SIGN_UP_URL",
    ],
  },
  {
    title: "section.billing",
    keys: [
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "STRIPE_PRICE_STARTER",
      "STRIPE_PRICE_PRO",
      "STRIPE_PRICE_ENTERPRISE",
    ],
  },
  { title: "section.sentry", keys: ["SENTRY_DSN", "NEXT_PUBLIC_SENTRY_DSN"] },
  { title: "section.db", keys: ["DATABASE_URL"] },
  {
    title: "section.sar",
    keys: ["COPERNICUS_CLIENT_ID", "COPERNICUS_CLIENT_SECRET", "SAR_DEMO"],
  },
  {
    title: "section.satPaid",
    keys: [
      "SPIRE_API_TOKEN",
      "MARINETRAFFIC_API_KEY",
      "ORBCOMM_API_TOKEN",
      "EOG_LICENSE_KEY",
    ],
  },
  {
    title: "section.runtime",
    keys: ["LOG_FORMAT", "LOG_LEVEL", "API_RATE_LIMIT", "NODE_ENV"],
  },
];

function writeEnv(env) {
  mkdirSync(dirname(ENV_FILE), { recursive: true });
  if (existsSync(ENV_FILE)) {
    try {
      renameSync(ENV_FILE, ENV_BAK);
    } catch {
      /* best effort */
    }
  }
  const lines = [
    "# Generated by `npm run setup` — do not edit secrets by hand.",
    `# Last updated: ${new Date().toISOString()}`,
    "",
  ];
  for (const group of GROUPS) {
    const any = group.keys.some((k) => env[k]);
    lines.push(`# ===== ${t(group.title)}${any ? "" : " (skipped)"} =====`);
    for (const k of group.keys) {
      if (env[k]) lines.push(`${k}=${env[k]}`);
      else lines.push(`# ${k}=`);
    }
    lines.push("");
  }
  for (const k of Object.keys(env)) {
    if (!GROUPS.some((g) => g.keys.includes(k))) {
      lines.push(`${k}=${env[k]}`);
    }
  }
  writeFileSync(ENV_FILE, lines.join("\n") + "\n", { mode: 0o600 });
}

// ====================== tests ======================

async function testAisstream(key) {
  if (!key) return null;
  let WSModule = null;
  try {
    WSModule = await import("ws");
  } catch {
    return { ok: null, msg: t("test.aisstream.skipped") };
  }
  const WS = WSModule.default ?? WSModule.WebSocket ?? WSModule;
  return new Promise((resolve) => {
    let resolved = false;
    let ws;
    const finish = (ok, msg) => {
      if (resolved) return;
      resolved = true;
      try {
        ws?.close();
      } catch {
        /* */
      }
      resolve({ ok, msg });
    };
    try {
      ws = new WS("wss://stream.aisstream.io/v0/stream");
      const timer = setTimeout(
        () => finish(false, t("test.aisstream.timeout")),
        10_000,
      );
      ws.on("open", () => {
        ws.send(
          JSON.stringify({
            APIKey: key,
            BoundingBoxes: [[[51.85, 3.5], [52.1, 4.55]]],
            FilterMessageTypes: ["PositionReport"],
          }),
        );
      });
      ws.on("message", () => {
        clearTimeout(timer);
        finish(true, t("test.aisstream.ok"));
      });
      ws.on("error", (err) => {
        clearTimeout(timer);
        finish(false, err.message);
      });
      ws.on("close", (code) => {
        clearTimeout(timer);
        if (code === 1008 || code === 4001) {
          finish(false, t("test.aisstream.unauthorized", { code }));
        }
      });
    } catch (err) {
      finish(false, err.message);
    }
  });
}

async function testCopernicus(id, secret) {
  if (!id || !secret) return null;
  try {
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: id,
      client_secret: secret,
    });
    const r = await fetch(
      "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
      },
    );
    if (!r.ok) return { ok: false, msg: `HTTP ${r.status}` };
    const json = await r.json();
    return json.access_token
      ? { ok: true, msg: t("test.copernicus.ok") }
      : { ok: false, msg: "no access_token in response" };
  } catch (err) {
    return { ok: false, msg: err.message };
  }
}

async function testStripe(key) {
  if (!key) return null;
  try {
    const r = await fetch("https://api.stripe.com/v1/balance", {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (r.status === 200) return { ok: true, msg: t("test.stripe.ok") };
    if (r.status === 401)
      return { ok: false, msg: t("test.stripe.unauthorized") };
    return { ok: false, msg: `HTTP ${r.status}` };
  } catch (err) {
    return { ok: false, msg: err.message };
  }
}

function generateApiToken() {
  return randomBytes(24).toString("hex");
}

async function section(titleKey) {
  const title = t(titleKey);
  console.log(
    "\n" +
      C.cyan +
      C.bold +
      "── " +
      title +
      " " +
      "─".repeat(Math.max(0, 60 - title.length)) +
      C.reset,
  );
}

async function reportTest(name, result) {
  if (!result) return;
  if (result.ok === null) {
    console.log(C.gray + `  ↺ ${name}: ${result.msg}` + C.reset);
    return;
  }
  if (result.ok)
    console.log(C.green + `  ✓ ${name}: ${result.msg}` + C.reset);
  else console.log(C.red + `  ✗ ${name}: ${result.msg}` + C.reset);
}

async function main() {
  console.log(
    C.bold + C.blue + "\n" + t("wizard.title") + "\n" + C.reset +
      C.gray + t("wizard.intro") + "\n" + C.reset,
  );
  console.log(
    C.gray +
      `${t("wizard.lang.using")} ${LOCALE.toUpperCase()} · ${t("wizard.lang.override")}` +
      C.reset,
  );

  const env = readEnv();
  const skipTests = process.argv.includes("--no-test");

  // Core
  await section("section.core");
  env.AISSTREAM_API_KEY = await askWithDefault(
    "AISSTREAM_API_KEY",
    env.AISSTREAM_API_KEY,
    {
      secret: true,
      optional: false,
      validator: (v) => (v.length < 16 ? t("validator.tooShort") : null),
    },
  );
  if (env.AISSTREAM_API_KEY && !skipTests) {
    if (await askYesNo("input.test", true)) {
      await reportTest(
        t("test.aisstream"),
        await testAisstream(env.AISSTREAM_API_KEY),
      );
    }
  }

  if (!env.PORT_API_TOKENS) {
    if (await askYesNo("input.gen", true)) {
      env.PORT_API_TOKENS = generateApiToken();
      console.log(C.green + `${t("generated")} ${env.PORT_API_TOKENS}` + C.reset);
    }
  }
  env.PORT_API_TOKENS = await askWithDefault(
    "PORT_API_TOKENS",
    env.PORT_API_TOKENS,
    { secret: true },
  );

  // Auth
  await section("section.auth");
  env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = await askWithDefault(
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  );
  env.CLERK_SECRET_KEY = await askWithDefault(
    "CLERK_SECRET_KEY",
    env.CLERK_SECRET_KEY,
    { secret: true },
  );
  if (env.CLERK_SECRET_KEY) {
    env.NEXT_PUBLIC_CLERK_SIGN_IN_URL =
      env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in";
    env.NEXT_PUBLIC_CLERK_SIGN_UP_URL =
      env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/sign-up";
  }

  // Stripe
  await section("section.billing");
  env.STRIPE_SECRET_KEY = await askWithDefault(
    "STRIPE_SECRET_KEY",
    env.STRIPE_SECRET_KEY,
    { secret: true },
  );
  if (env.STRIPE_SECRET_KEY && !skipTests) {
    await reportTest(t("test.stripe"), await testStripe(env.STRIPE_SECRET_KEY));
  }
  env.STRIPE_WEBHOOK_SECRET = await askWithDefault(
    "STRIPE_WEBHOOK_SECRET",
    env.STRIPE_WEBHOOK_SECRET,
    { secret: true },
  );
  env.STRIPE_PRICE_STARTER = await askWithDefault(
    "STRIPE_PRICE_STARTER",
    env.STRIPE_PRICE_STARTER,
  );
  env.STRIPE_PRICE_PRO = await askWithDefault(
    "STRIPE_PRICE_PRO",
    env.STRIPE_PRICE_PRO,
  );
  env.STRIPE_PRICE_ENTERPRISE = await askWithDefault(
    "STRIPE_PRICE_ENTERPRISE",
    env.STRIPE_PRICE_ENTERPRISE,
  );

  // Sentry
  await section("section.sentry");
  env.SENTRY_DSN = await askWithDefault("SENTRY_DSN", env.SENTRY_DSN, {
    secret: true,
  });
  env.NEXT_PUBLIC_SENTRY_DSN = await askWithDefault(
    "NEXT_PUBLIC_SENTRY_DSN",
    env.NEXT_PUBLIC_SENTRY_DSN,
  );

  // DB
  await section("section.db");
  env.DATABASE_URL = await askWithDefault("DATABASE_URL", env.DATABASE_URL, {
    secret: true,
  });

  // SAR
  await section("section.sar");
  env.COPERNICUS_CLIENT_ID = await askWithDefault(
    "COPERNICUS_CLIENT_ID",
    env.COPERNICUS_CLIENT_ID,
  );
  env.COPERNICUS_CLIENT_SECRET = await askWithDefault(
    "COPERNICUS_CLIENT_SECRET",
    env.COPERNICUS_CLIENT_SECRET,
    { secret: true },
  );
  if (env.COPERNICUS_CLIENT_ID && env.COPERNICUS_CLIENT_SECRET && !skipTests) {
    await reportTest(
      t("test.copernicus"),
      await testCopernicus(
        env.COPERNICUS_CLIENT_ID,
        env.COPERNICUS_CLIENT_SECRET,
      ),
    );
  }
  if (!env.COPERNICUS_CLIENT_ID && !env.COPERNICUS_CLIENT_SECRET) {
    if (await askYesNo("input.demo", false)) {
      env.SAR_DEMO = "1";
    }
  } else {
    env.SAR_DEMO = env.SAR_DEMO ?? "0";
  }

  // Paid sat
  await section("section.satPaid");
  env.SPIRE_API_TOKEN = await askWithDefault(
    "SPIRE_API_TOKEN",
    env.SPIRE_API_TOKEN,
    { secret: true },
  );
  env.MARINETRAFFIC_API_KEY = await askWithDefault(
    "MARINETRAFFIC_API_KEY",
    env.MARINETRAFFIC_API_KEY,
    { secret: true },
  );
  env.ORBCOMM_API_TOKEN = await askWithDefault(
    "ORBCOMM_API_TOKEN",
    env.ORBCOMM_API_TOKEN,
    { secret: true },
  );
  env.EOG_LICENSE_KEY = await askWithDefault(
    "EOG_LICENSE_KEY",
    env.EOG_LICENSE_KEY,
    { secret: true },
  );

  // Runtime
  await section("section.runtime");
  env.LOG_FORMAT = await askWithDefault("LOG_FORMAT", env.LOG_FORMAT);
  env.LOG_LEVEL = await askWithDefault("LOG_LEVEL", env.LOG_LEVEL);
  env.API_RATE_LIMIT = await askWithDefault(
    "API_RATE_LIMIT",
    env.API_RATE_LIMIT,
  );

  for (const k of Object.keys(env)) {
    if (!env[k]) delete env[k];
  }
  writeEnv(env);

  console.log(
    "\n" + C.green + C.bold + t("wrote") + " " + ENV_FILE + C.reset,
  );
  console.log(C.gray + t("backup") + " " + ENV_BAK + C.reset);

  console.log("\n" + C.bold + t("summary") + C.reset);
  const summary = [
    ["AIS feed", !!env.AISSTREAM_API_KEY],
    ["API tokens", !!env.PORT_API_TOKENS],
    ["Auth (Clerk)", !!env.CLERK_SECRET_KEY],
    ["Billing (Stripe)", !!env.STRIPE_SECRET_KEY],
    ["Error tracking (Sentry)", !!env.SENTRY_DSN],
    ["Postgres", !!env.DATABASE_URL],
    [
      "SAR scanner",
      !!(env.COPERNICUS_CLIENT_ID && env.COPERNICUS_CLIENT_SECRET) ||
        env.SAR_DEMO === "1",
    ],
    [
      "Paid sat",
      !!(
        env.SPIRE_API_TOKEN ||
        env.MARINETRAFFIC_API_KEY ||
        env.ORBCOMM_API_TOKEN
      ),
    ],
  ];
  for (const [name, on] of summary) {
    const localized = t(`summary.${name}`);
    console.log(
      "  " + (on ? C.green + "●" : C.gray + "○") + " " + localized + C.reset,
    );
  }

  console.log("\n" + C.gray + t("restart") + "\n" + C.reset);

  rl.close();
}

main().catch((err) => {
  console.error(C.red + "\nFatal: " + err.message + C.reset);
  rl.close();
  process.exit(1);
});
