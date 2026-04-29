/**
 * Page-level translations. Kept separate from messages.ts to avoid bloating
 * the main UI translation file. Pipe-delimited strings for arrays of features.
 */

import type { Locale } from "./messages";

type PageMessages = Record<string, string>;

const fr: PageMessages = {
  // Common
  "nav.back": "← retour",

  // /pricing
  "pricing.title": "Tarifs",
  "pricing.subtitle":
    "AIS multi-port · ETA prédite · fusion SAR · screening sanctions · 51 ports stratégiques",
  "pricing.note":
    "Les paiements sont opérationnels uniquement quand STRIPE_SECRET_KEY et STRIPE_PRICE_* sont définis. Sinon le bouton renvoie une erreur 503.",
  "pricing.note.label": "Note technique :",
  "pricing.checkout.error": "Stripe Checkout indisponible",
  "pricing.tier.free.name": "Free",
  "pricing.tier.free.price": "0 €",
  "pricing.tier.free.period": "",
  "pricing.tier.free.features":
    "3 ports stratégiques|Dashboard live, 7 j d'historique|Pas d'API publique",
  "pricing.tier.free.cta": "Démarrer",
  "pricing.tier.starter.name": "Starter",
  "pricing.tier.starter.price": "99 €",
  "pricing.tier.starter.period": "/ mois",
  "pricing.tier.starter.features":
    "15 ports|API publique 5 k req/j|Alertes webhook|Export CSV|30 j d'historique|25 navires en watchlist",
  "pricing.tier.starter.cta": "Choisir Starter",
  "pricing.tier.pro.name": "Pro",
  "pricing.tier.pro.price": "499 €",
  "pricing.tier.pro.period": "/ mois",
  "pricing.tier.pro.features":
    "Les 51 ports|API 600 req/min|ETA precision détaillée + attribution des retards|Fusion AIS + SAR Sentinel-1|Détection dark fleet|Screening sanctions OFAC + UK OFSI|Émissions CO2 par voyage|90 j d'historique|250 navires en watchlist",
  "pricing.tier.pro.cta": "Choisir Pro",
  "pricing.tier.enterprise.name": "Enterprise",
  "pricing.tier.enterprise.price": "Sur devis",
  "pricing.tier.enterprise.period": "",
  "pricing.tier.enterprise.features":
    "Tout Pro +|Connecteurs Spire / MarineTraffic / Orbcomm|SLA 99,9 % contractuel|365 j+ d'historique + backfill|White-label & dédié|Support dédié",
  "pricing.tier.enterprise.cta": "Nous contacter",

  // /precision
  "precision.title": "Précision ETA",
  "precision.lead":
    "Nous prédisons l'heure d'arrivée des navires à {port} à partir de leur position AIS, puis comparons à l'arrivée réelle et à l'ETA déclarée par les armateurs. Public, recalculé en continu, reproductible.",
  "precision.window": "fenêtre",
  "precision.stat.our": "Notre RMSE",
  "precision.stat.broadcast": "RMSE ETA broadcast",
  "precision.stat.broadcast.hint": "Référence : ETA déclarée par les armateurs",
  "precision.stat.advantage": "Avantage modèle",
  "precision.stat.gap": "Écart",
  "precision.stat.our.hint": "MAE {mae} · {n} voyages",
  "precision.stat.delta.beats": "Plus précis que l'ETA broadcast",
  "precision.stat.delta.behind": "Moins précis que l'ETA broadcast",
  "precision.stat.delta.notEnough": "Comparaison disponible après quelques voyages",
  "precision.table.title": "50 derniers voyages clos",
  "precision.table.errHelp": "err = predicted − actual",
  "precision.table.col.mmsi": "MMSI",
  "precision.table.col.cargo": "Cargo",
  "precision.table.col.arrival": "Arrivée",
  "precision.table.col.errModel": "Erreur modèle",
  "precision.table.col.errBroadcast": "Erreur broadcast",
  "precision.table.empty":
    "Pas encore de voyages clos sur la fenêtre. La table se remplit dès qu'un navire suivi se met à quai.",
  "precision.method.title": "Méthodologie",
  "precision.method.b1":
    "Source : flux AIS aisstream.io filtré sur la bbox du port (incluant les zones de mouillage offshore).",
  "precision.method.b2":
    "Voyage = première observation en approche/mouillage → arrivée à quai (NavStatus moored ou SOG < 0,3 kn dans une zone de quai).",
  "precision.method.b3":
    "Modèle ETA v1 : distance / SOG recalculé toutes les 5 minutes. Modèles plus avancés (saisonnier, congestion-aware, tide-aware) en roadmap.",
  "precision.method.b4":
    "Référence : champ ETA broadcast extrait des messages ShipStaticData (saisi par l'équipage).",
  "precision.method.b5":
    "Métriques : RMSE et MAE sur les voyages clos avec ETA prédit et ETA broadcast disponibles.",
  "precision.cta.title": "Mesurez vos propres voyages",
  "precision.cta.lead":
    "Ouvrez un compte Free, ajoutez vos navires en watchlist et suivez leur précision ETA dans tous nos ports.",
  "precision.cta.button": "Voir les tarifs",
  "precision.cta.dashboard": "Ouvrir le dashboard",
};

const en: PageMessages = {
  "nav.back": "← back",

  "pricing.title": "Pricing",
  "pricing.subtitle":
    "Multi-port AIS · predicted ETA · SAR fusion · sanctions screening · 51 strategic ports",
  "pricing.note":
    "Payments only work once STRIPE_SECRET_KEY and STRIPE_PRICE_* are set. Otherwise the button returns a 503 error.",
  "pricing.note.label": "Tech note:",
  "pricing.checkout.error": "Stripe Checkout unavailable",
  "pricing.tier.free.name": "Free",
  "pricing.tier.free.price": "€0",
  "pricing.tier.free.period": "",
  "pricing.tier.free.features":
    "3 strategic ports|Live dashboard, 7-day history|No public API",
  "pricing.tier.free.cta": "Get started",
  "pricing.tier.starter.name": "Starter",
  "pricing.tier.starter.price": "€99",
  "pricing.tier.starter.period": "/ month",
  "pricing.tier.starter.features":
    "15 ports|Public API, 5k req/day|Webhook alerts|CSV export|30-day history|25 vessels in watchlist",
  "pricing.tier.starter.cta": "Choose Starter",
  "pricing.tier.pro.name": "Pro",
  "pricing.tier.pro.price": "€499",
  "pricing.tier.pro.period": "/ month",
  "pricing.tier.pro.features":
    "All 51 ports|API 600 req/min|Detailed ETA precision + delay attribution|AIS + SAR Sentinel-1 fusion|Dark fleet detection|OFAC + UK OFSI sanctions screening|CO2 emissions per voyage|90-day history|250 vessels in watchlist",
  "pricing.tier.pro.cta": "Choose Pro",
  "pricing.tier.enterprise.name": "Enterprise",
  "pricing.tier.enterprise.price": "On request",
  "pricing.tier.enterprise.period": "",
  "pricing.tier.enterprise.features":
    "Everything in Pro, plus|Spire / MarineTraffic / Orbcomm connectors|99.9% contractual SLA|365+ days history + backfill|White-label & dedicated|Dedicated support",
  "pricing.tier.enterprise.cta": "Contact sales",

  // /precision
  "precision.title": "ETA precision",
  "precision.lead":
    "We predict vessel arrival times at {port} from AIS position, speed and course, then compare against the actual arrival and against the ETA declared by carriers. Public, continuously recomputed, reproducible.",
  "precision.window": "window",
  "precision.stat.our": "Our RMSE",
  "precision.stat.broadcast": "Broadcast ETA RMSE",
  "precision.stat.broadcast.hint": "Reference: ETA declared by carriers",
  "precision.stat.advantage": "Model advantage",
  "precision.stat.gap": "Gap",
  "precision.stat.our.hint": "MAE {mae} · {n} voyages",
  "precision.stat.delta.beats": "More accurate than broadcast ETA",
  "precision.stat.delta.behind": "Less accurate than broadcast ETA",
  "precision.stat.delta.notEnough": "Comparison available after a few voyages",
  "precision.table.title": "Last 50 closed voyages",
  "precision.table.errHelp": "err = predicted − actual",
  "precision.table.col.mmsi": "MMSI",
  "precision.table.col.cargo": "Cargo",
  "precision.table.col.arrival": "Arrival",
  "precision.table.col.errModel": "Model error",
  "precision.table.col.errBroadcast": "Broadcast error",
  "precision.table.empty":
    "No closed voyages in the window yet. The table fills as soon as a tracked vessel moors.",
  "precision.method.title": "Methodology",
  "precision.method.b1":
    "Source: aisstream.io AIS feed filtered to the port bbox (including offshore anchorages).",
  "precision.method.b2":
    "Voyage = first observation in approach/anchorage → moored at berth (NavStatus moored or SOG < 0.3 kn in a berth zone).",
  "precision.method.b3":
    "ETA model v1: distance / SOG recomputed every 5 minutes. Roadmap: seasonal, congestion-aware, tide-aware models.",
  "precision.method.b4":
    "Reference: broadcast ETA field extracted from ShipStaticData messages (entered by the crew).",
  "precision.method.b5":
    "Metrics: RMSE and MAE on closed voyages with both predicted and broadcast ETA available.",
  "precision.cta.title": "Track your own voyages",
  "precision.cta.lead":
    "Open a Free account, add your vessels to a watchlist and monitor ETA precision across every port we cover.",
  "precision.cta.button": "See pricing",
  "precision.cta.dashboard": "Open dashboard",
};

const nl: PageMessages = {
  "nav.back": "← terug",

  "pricing.title": "Tarieven",
  "pricing.subtitle":
    "Multi-haven AIS · voorspelde ETA · SAR-fusie · sanctie-screening · 51 strategische havens",
  "pricing.note":
    "Betalingen werken alleen wanneer STRIPE_SECRET_KEY en STRIPE_PRICE_* zijn ingesteld. Anders geeft de knop een 503-fout.",
  "pricing.note.label": "Technische noot:",
  "pricing.checkout.error": "Stripe Checkout niet beschikbaar",
  "pricing.tier.free.name": "Free",
  "pricing.tier.free.price": "€0",
  "pricing.tier.free.period": "",
  "pricing.tier.free.features":
    "3 strategische havens|Live dashboard, 7 dagen historie|Geen openbare API",
  "pricing.tier.free.cta": "Beginnen",
  "pricing.tier.starter.name": "Starter",
  "pricing.tier.starter.price": "€99",
  "pricing.tier.starter.period": "/ maand",
  "pricing.tier.starter.features":
    "15 havens|Openbare API, 5k req/dag|Webhook-meldingen|CSV-export|30 dagen historie|25 schepen in watchlist",
  "pricing.tier.starter.cta": "Kies Starter",
  "pricing.tier.pro.name": "Pro",
  "pricing.tier.pro.price": "€499",
  "pricing.tier.pro.period": "/ maand",
  "pricing.tier.pro.features":
    "Alle 51 havens|API 600 req/min|Gedetailleerde ETA-precisie + vertragingsattributie|AIS + SAR Sentinel-1 fusie|Detectie donkere vloot|Sancties OFAC + UK OFSI screening|CO2-emissies per reis|90 dagen historie|250 schepen in watchlist",
  "pricing.tier.pro.cta": "Kies Pro",
  "pricing.tier.enterprise.name": "Enterprise",
  "pricing.tier.enterprise.price": "Op aanvraag",
  "pricing.tier.enterprise.period": "",
  "pricing.tier.enterprise.features":
    "Alles in Pro, plus|Spire / MarineTraffic / Orbcomm-connectoren|99,9% contractuele SLA|365+ dagen historie + backfill|White-label & toegewijd|Toegewijde ondersteuning",
  "pricing.tier.enterprise.cta": "Neem contact op",

  // /precision
  "precision.title": "ETA-precisie",
  "precision.lead":
    "We voorspellen aankomsttijden van schepen in {port} op basis van AIS-positie, snelheid en koers, en vergelijken met de werkelijke aankomst én met de door rederijen opgegeven ETA. Openbaar, continu herberekend, reproduceerbaar.",
  "precision.window": "venster",
  "precision.stat.our": "Onze RMSE",
  "precision.stat.broadcast": "RMSE broadcast-ETA",
  "precision.stat.broadcast.hint": "Referentie: ETA opgegeven door rederijen",
  "precision.stat.advantage": "Modelvoordeel",
  "precision.stat.gap": "Verschil",
  "precision.stat.our.hint": "MAE {mae} · {n} reizen",
  "precision.stat.delta.beats": "Nauwkeuriger dan broadcast-ETA",
  "precision.stat.delta.behind": "Minder nauwkeurig dan broadcast-ETA",
  "precision.stat.delta.notEnough": "Vergelijking beschikbaar na enkele reizen",
  "precision.table.title": "Laatste 50 afgesloten reizen",
  "precision.table.errHelp": "fout = voorspeld − werkelijk",
  "precision.table.col.mmsi": "MMSI",
  "precision.table.col.cargo": "Lading",
  "precision.table.col.arrival": "Aankomst",
  "precision.table.col.errModel": "Modelfout",
  "precision.table.col.errBroadcast": "Broadcast-fout",
  "precision.table.empty":
    "Nog geen afgesloten reizen in dit venster. De tabel vult zich zodra een gevolgd schip aanlegt.",
  "precision.method.title": "Methodologie",
  "precision.method.b1":
    "Bron: aisstream.io AIS-feed gefilterd op de havenbbox (incl. offshore-ankerages).",
  "precision.method.b2":
    "Reis = eerste observatie in nadering/ankerage → afgemeerd aan kade (NavStatus moored of SOG < 0,3 kn in een kadezone).",
  "precision.method.b3":
    "ETA-model v1: afstand / SOG herberekend elke 5 minuten. Roadmap: seizoens-, congestie- en tij-bewuste modellen.",
  "precision.method.b4":
    "Referentie: broadcast-ETA-veld uit ShipStaticData-berichten (door bemanning ingevoerd).",
  "precision.method.b5":
    "Metrieken: RMSE en MAE op afgesloten reizen met zowel voorspelde als broadcast-ETA.",
  "precision.cta.title": "Volg je eigen reizen",
  "precision.cta.lead":
    "Open een Free-account, voeg je schepen toe aan een watchlist en monitor ETA-precisie in al onze havens.",
  "precision.cta.button": "Bekijk tarieven",
  "precision.cta.dashboard": "Open dashboard",
};

const de: PageMessages = {
  "nav.back": "← zurück",

  "pricing.title": "Preise",
  "pricing.subtitle":
    "Multi-Hafen-AIS · vorhergesagte ETA · SAR-Fusion · Sanktions-Screening · 51 strategische Häfen",
  "pricing.note":
    "Zahlungen funktionieren nur, wenn STRIPE_SECRET_KEY und STRIPE_PRICE_* gesetzt sind. Andernfalls gibt der Button einen 503-Fehler zurück.",
  "pricing.note.label": "Technischer Hinweis:",
  "pricing.checkout.error": "Stripe Checkout nicht verfügbar",
  "pricing.tier.free.name": "Free",
  "pricing.tier.free.price": "0 €",
  "pricing.tier.free.period": "",
  "pricing.tier.free.features":
    "3 strategische Häfen|Live-Dashboard, 7 Tage Historie|Keine öffentliche API",
  "pricing.tier.free.cta": "Loslegen",
  "pricing.tier.starter.name": "Starter",
  "pricing.tier.starter.price": "99 €",
  "pricing.tier.starter.period": "/ Monat",
  "pricing.tier.starter.features":
    "15 Häfen|Öffentliche API, 5k Req/Tag|Webhook-Benachrichtigungen|CSV-Export|30 Tage Historie|25 Schiffe in der Watchlist",
  "pricing.tier.starter.cta": "Starter wählen",
  "pricing.tier.pro.name": "Pro",
  "pricing.tier.pro.price": "499 €",
  "pricing.tier.pro.period": "/ Monat",
  "pricing.tier.pro.features":
    "Alle 51 Häfen|API 600 Req/Min|Detaillierte ETA-Genauigkeit + Verzögerungs-Attribution|AIS + SAR Sentinel-1 Fusion|Dark-Fleet-Erkennung|OFAC + UK OFSI Sanktions-Screening|CO2-Emissionen pro Reise|90 Tage Historie|250 Schiffe in der Watchlist",
  "pricing.tier.pro.cta": "Pro wählen",
  "pricing.tier.enterprise.name": "Enterprise",
  "pricing.tier.enterprise.price": "Auf Anfrage",
  "pricing.tier.enterprise.period": "",
  "pricing.tier.enterprise.features":
    "Alles aus Pro, plus|Spire / MarineTraffic / Orbcomm-Konnektoren|99,9% vertraglicher SLA|365+ Tage Historie + Backfill|White-Label & dediziert|Dedizierter Support",
  "pricing.tier.enterprise.cta": "Kontaktieren Sie uns",

  // /precision
  "precision.title": "ETA-Genauigkeit",
  "precision.lead":
    "Wir prognostizieren die Ankunftszeiten von Schiffen in {port} aus AIS-Position, Geschwindigkeit und Kurs und vergleichen sie mit der tatsächlichen Ankunft und der von Reedern gemeldeten ETA. Öffentlich, kontinuierlich neu berechnet, reproduzierbar.",
  "precision.window": "Fenster",
  "precision.stat.our": "Unser RMSE",
  "precision.stat.broadcast": "RMSE Broadcast-ETA",
  "precision.stat.broadcast.hint": "Referenz: von Reedern gemeldete ETA",
  "precision.stat.advantage": "Modellvorteil",
  "precision.stat.gap": "Abstand",
  "precision.stat.our.hint": "MAE {mae} · {n} Reisen",
  "precision.stat.delta.beats": "Genauer als Broadcast-ETA",
  "precision.stat.delta.behind": "Ungenauer als Broadcast-ETA",
  "precision.stat.delta.notEnough": "Vergleich nach einigen Reisen verfügbar",
  "precision.table.title": "Letzte 50 abgeschlossene Reisen",
  "precision.table.errHelp": "err = vorhergesagt − tatsächlich",
  "precision.table.col.mmsi": "MMSI",
  "precision.table.col.cargo": "Ladung",
  "precision.table.col.arrival": "Ankunft",
  "precision.table.col.errModel": "Modellfehler",
  "precision.table.col.errBroadcast": "Broadcast-Fehler",
  "precision.table.empty":
    "Noch keine abgeschlossenen Reisen im Fenster. Die Tabelle füllt sich, sobald ein verfolgtes Schiff anlegt.",
  "precision.method.title": "Methodik",
  "precision.method.b1":
    "Quelle: aisstream.io AIS-Feed gefiltert auf die Hafen-Bbox (inkl. Offshore-Ankerplätze).",
  "precision.method.b2":
    "Reise = erste Beobachtung im Anlauf/Ankerplatz → festgemacht am Liegeplatz (NavStatus moored oder SOG < 0,3 kn in einer Liegeplatzzone).",
  "precision.method.b3":
    "ETA-Modell v1: Distanz / SOG alle 5 Minuten neu berechnet. Roadmap: saisonale, stau-bewusste, gezeiten-bewusste Modelle.",
  "precision.method.b4":
    "Referenz: Broadcast-ETA-Feld aus ShipStaticData-Nachrichten (von der Crew eingegeben).",
  "precision.method.b5":
    "Metriken: RMSE und MAE auf abgeschlossenen Reisen mit prognostizierter und Broadcast-ETA.",
  "precision.cta.title": "Verfolgen Sie Ihre eigenen Reisen",
  "precision.cta.lead":
    "Eröffnen Sie ein Free-Konto, fügen Sie Ihre Schiffe zur Watchlist hinzu und überwachen Sie die ETA-Genauigkeit in allen Häfen.",
  "precision.cta.button": "Preise ansehen",
  "precision.cta.dashboard": "Dashboard öffnen",
};

const es: PageMessages = {
  "nav.back": "← volver",

  "pricing.title": "Tarifas",
  "pricing.subtitle":
    "AIS multipuerto · ETA predicha · fusión SAR · screening de sanciones · 51 puertos estratégicos",
  "pricing.note":
    "Los pagos solo funcionan cuando STRIPE_SECRET_KEY y STRIPE_PRICE_* están definidos. De lo contrario, el botón devuelve un error 503.",
  "pricing.note.label": "Nota técnica:",
  "pricing.checkout.error": "Stripe Checkout no disponible",
  "pricing.tier.free.name": "Free",
  "pricing.tier.free.price": "0 €",
  "pricing.tier.free.period": "",
  "pricing.tier.free.features":
    "3 puertos estratégicos|Panel en vivo, 7 días de historial|Sin API pública",
  "pricing.tier.free.cta": "Empezar",
  "pricing.tier.starter.name": "Starter",
  "pricing.tier.starter.price": "99 €",
  "pricing.tier.starter.period": "/ mes",
  "pricing.tier.starter.features":
    "15 puertos|API pública 5k req/día|Alertas webhook|Exportación CSV|30 días de historial|25 buques en watchlist",
  "pricing.tier.starter.cta": "Elegir Starter",
  "pricing.tier.pro.name": "Pro",
  "pricing.tier.pro.price": "499 €",
  "pricing.tier.pro.period": "/ mes",
  "pricing.tier.pro.features":
    "Los 51 puertos|API 600 req/min|Precisión ETA detallada + atribución de retrasos|Fusión AIS + SAR Sentinel-1|Detección de flota oscura|Screening OFAC + UK OFSI|Emisiones CO2 por travesía|90 días de historial|250 buques en watchlist",
  "pricing.tier.pro.cta": "Elegir Pro",
  "pricing.tier.enterprise.name": "Enterprise",
  "pricing.tier.enterprise.price": "Bajo presupuesto",
  "pricing.tier.enterprise.period": "",
  "pricing.tier.enterprise.features":
    "Todo Pro +|Conectores Spire / MarineTraffic / Orbcomm|SLA contractual 99,9%|365+ días de historial + backfill|White-label & dedicado|Soporte dedicado",
  "pricing.tier.enterprise.cta": "Contáctanos",

  // /precision
  "precision.title": "Precisión ETA",
  "precision.lead":
    "Predecimos las horas de llegada de los buques a {port} a partir de su posición AIS, velocidad y rumbo, y comparamos con la llegada real y con la ETA declarada por los armadores. Pública, recalculada en continuo, reproducible.",
  "precision.window": "ventana",
  "precision.stat.our": "Nuestra RMSE",
  "precision.stat.broadcast": "RMSE ETA broadcast",
  "precision.stat.broadcast.hint": "Referencia: ETA declarada por armadores",
  "precision.stat.advantage": "Ventaja del modelo",
  "precision.stat.gap": "Brecha",
  "precision.stat.our.hint": "MAE {mae} · {n} travesías",
  "precision.stat.delta.beats": "Más precisa que la ETA broadcast",
  "precision.stat.delta.behind": "Menos precisa que la ETA broadcast",
  "precision.stat.delta.notEnough": "Comparación disponible tras algunas travesías",
  "precision.table.title": "Últimas 50 travesías cerradas",
  "precision.table.errHelp": "err = prevista − real",
  "precision.table.col.mmsi": "MMSI",
  "precision.table.col.cargo": "Carga",
  "precision.table.col.arrival": "Llegada",
  "precision.table.col.errModel": "Error modelo",
  "precision.table.col.errBroadcast": "Error broadcast",
  "precision.table.empty":
    "Aún sin travesías cerradas en la ventana. La tabla se llena cuando un buque seguido atraca.",
  "precision.method.title": "Metodología",
  "precision.method.b1":
    "Fuente: feed AIS aisstream.io filtrado en la bbox del puerto (incl. fondeaderos offshore).",
  "precision.method.b2":
    "Travesía = primera observación en aproximación/fondeo → atracado (NavStatus moored o SOG < 0,3 kn en zona de muelle).",
  "precision.method.b3":
    "Modelo ETA v1: distancia / SOG recalculado cada 5 minutos. Roadmap: modelos estacional, congestión y mareas.",
  "precision.method.b4":
    "Referencia: campo ETA broadcast extraído de los mensajes ShipStaticData (introducidos por la tripulación).",
  "precision.method.b5":
    "Métricas: RMSE y MAE en travesías cerradas con ETA prevista y broadcast disponibles.",
  "precision.cta.title": "Mide tus propias travesías",
  "precision.cta.lead":
    "Abre una cuenta Free, añade tus buques a una watchlist y monitoriza la precisión ETA en todos nuestros puertos.",
  "precision.cta.button": "Ver tarifas",
  "precision.cta.dashboard": "Abrir el panel",
};

const ar: PageMessages = {
  "nav.back": "← رجوع",

  "pricing.title": "الأسعار",
  "pricing.subtitle":
    "AIS متعدد الموانئ · ETA متوقع · دمج SAR · فحص العقوبات · 51 ميناءً استراتيجياً",
  "pricing.note":
    "تعمل المدفوعات فقط عند تعيين STRIPE_SECRET_KEY و STRIPE_PRICE_*. وإلا يُرجع الزر خطأ 503.",
  "pricing.note.label": "ملاحظة تقنية:",
  "pricing.checkout.error": "Stripe Checkout غير متاح",
  "pricing.tier.free.name": "Free",
  "pricing.tier.free.price": "0 €",
  "pricing.tier.free.period": "",
  "pricing.tier.free.features":
    "3 موانئ استراتيجية|لوحة تحكم مباشرة، تاريخ 7 أيام|لا توجد API عامة",
  "pricing.tier.free.cta": "ابدأ",
  "pricing.tier.starter.name": "Starter",
  "pricing.tier.starter.price": "99 €",
  "pricing.tier.starter.period": "/ شهر",
  "pricing.tier.starter.features":
    "15 ميناء|API عامة 5 آلاف طلب/يوم|تنبيهات webhook|تصدير CSV|تاريخ 30 يوماً|25 سفينة في قائمة المراقبة",
  "pricing.tier.starter.cta": "اختر Starter",
  "pricing.tier.pro.name": "Pro",
  "pricing.tier.pro.price": "499 €",
  "pricing.tier.pro.period": "/ شهر",
  "pricing.tier.pro.features":
    "جميع الموانئ الـ 51|API 600 طلب/دقيقة|دقة ETA تفصيلية + توزيع التأخيرات|دمج AIS + SAR Sentinel-1|كشف الأسطول المظلم|فحص عقوبات OFAC + UK OFSI|انبعاثات CO2 لكل رحلة|تاريخ 90 يوماً|250 سفينة في قائمة المراقبة",
  "pricing.tier.pro.cta": "اختر Pro",
  "pricing.tier.enterprise.name": "Enterprise",
  "pricing.tier.enterprise.price": "حسب الطلب",
  "pricing.tier.enterprise.period": "",
  "pricing.tier.enterprise.features":
    "كل ما في Pro +|موصلات Spire / MarineTraffic / Orbcomm|SLA تعاقدي 99.9%|تاريخ 365+ يوم + استرجاع|White-label ومخصص|دعم مخصص",
  "pricing.tier.enterprise.cta": "اتصل بنا",

  // /precision
  "precision.title": "دقة ETA",
  "precision.lead":
    "نتنبأ بأوقات وصول السفن إلى {port} استناداً إلى موقع AIS والسرعة والمسار، ثم نقارنها بالوصول الفعلي وبـ ETA المُعلن من الناقلين. عام، يُعاد حسابه باستمرار، قابل للتكرار.",
  "precision.window": "النافذة",
  "precision.stat.our": "RMSE لدينا",
  "precision.stat.broadcast": "RMSE لـ ETA المُعلن",
  "precision.stat.broadcast.hint": "المرجع: ETA المُعلن من الناقلين",
  "precision.stat.advantage": "ميزة النموذج",
  "precision.stat.gap": "الفجوة",
  "precision.stat.our.hint": "MAE {mae} · {n} رحلات",
  "precision.stat.delta.beats": "أكثر دقة من ETA المُعلن",
  "precision.stat.delta.behind": "أقل دقة من ETA المُعلن",
  "precision.stat.delta.notEnough": "المقارنة متاحة بعد بضع رحلات",
  "precision.table.title": "آخر 50 رحلة مغلقة",
  "precision.table.errHelp": "err = المتوقع − الفعلي",
  "precision.table.col.mmsi": "MMSI",
  "precision.table.col.cargo": "الحمولة",
  "precision.table.col.arrival": "الوصول",
  "precision.table.col.errModel": "خطأ النموذج",
  "precision.table.col.errBroadcast": "خطأ المُعلن",
  "precision.table.empty":
    "لا توجد رحلات مغلقة بعد في هذه النافذة. يمتلئ الجدول عندما ترسو سفينة متابعة.",
  "precision.method.title": "المنهجية",
  "precision.method.b1":
    "المصدر: تدفق AIS من aisstream.io مُصفى على bbox الميناء (بما يشمل المراسي البحرية).",
  "precision.method.b2":
    "الرحلة = أول رصد في الاقتراب/المرسى → الرسو على الرصيف (NavStatus moored أو SOG < 0.3 عقدة في منطقة رصيف).",
  "precision.method.b3":
    "نموذج ETA v1: المسافة / SOG يُعاد حسابه كل 5 دقائق. خارطة الطريق: نماذج موسمية، تتفاعل مع الازدحام والمدّ.",
  "precision.method.b4":
    "المرجع: حقل ETA المُعلن المستخرج من رسائل ShipStaticData (يُدخله الطاقم).",
  "precision.method.b5":
    "المقاييس: RMSE وMAE على الرحلات المغلقة مع توفر ETA متوقع ومُعلن.",
  "precision.cta.title": "تتبع رحلاتك الخاصة",
  "precision.cta.lead":
    "افتح حساباً مجانياً، أضف سفنك إلى قائمة مراقبة وتابع دقة ETA في جميع موانئنا.",
  "precision.cta.button": "عرض الأسعار",
  "precision.cta.dashboard": "فتح اللوحة",
};

const zh: PageMessages = {
  "nav.back": "← 返回",

  "pricing.title": "价格",
  "pricing.subtitle":
    "多港口 AIS · ETA 预测 · SAR 融合 · 制裁筛查 · 51 个战略港口",
  "pricing.note":
    "只有在设置了 STRIPE_SECRET_KEY 和 STRIPE_PRICE_* 时,付款才会运行。否则按钮返回 503 错误。",
  "pricing.note.label": "技术说明:",
  "pricing.checkout.error": "Stripe Checkout 不可用",
  "pricing.tier.free.name": "Free",
  "pricing.tier.free.price": "€0",
  "pricing.tier.free.period": "",
  "pricing.tier.free.features":
    "3 个战略港口|实时仪表板,7 天历史|无公共 API",
  "pricing.tier.free.cta": "开始",
  "pricing.tier.starter.name": "Starter",
  "pricing.tier.starter.price": "€99",
  "pricing.tier.starter.period": "/ 月",
  "pricing.tier.starter.features":
    "15 个港口|公共 API 5k 次/天|Webhook 警报|CSV 导出|30 天历史|25 艘船监视列表",
  "pricing.tier.starter.cta": "选择 Starter",
  "pricing.tier.pro.name": "Pro",
  "pricing.tier.pro.price": "€499",
  "pricing.tier.pro.period": "/ 月",
  "pricing.tier.pro.features":
    "全部 51 个港口|API 600 次/分|详细 ETA 精度 + 延误归因|AIS + SAR Sentinel-1 融合|暗船队检测|OFAC + UK OFSI 制裁筛查|每次航行 CO2 排放|90 天历史|250 艘船监视列表",
  "pricing.tier.pro.cta": "选择 Pro",
  "pricing.tier.enterprise.name": "Enterprise",
  "pricing.tier.enterprise.price": "按需报价",
  "pricing.tier.enterprise.period": "",
  "pricing.tier.enterprise.features":
    "Pro 全部内容 +|Spire / MarineTraffic / Orbcomm 连接器|99.9% 合同 SLA|365+ 天历史 + 回填|White-label 与专属|专属支持",
  "pricing.tier.enterprise.cta": "联系我们",

  // /precision
  "precision.title": "ETA 精度",
  "precision.lead":
    "我们基于 AIS 位置、速度和航向预测船舶在 {port} 的到港时间,并与实际到港和承运商申报的 ETA 进行对比。公开、持续重新计算、可复现。",
  "precision.window": "时间窗",
  "precision.stat.our": "我们的 RMSE",
  "precision.stat.broadcast": "广播 ETA RMSE",
  "precision.stat.broadcast.hint": "参考:承运商申报的 ETA",
  "precision.stat.advantage": "模型优势",
  "precision.stat.gap": "差距",
  "precision.stat.our.hint": "MAE {mae} · {n} 个航次",
  "precision.stat.delta.beats": "比广播 ETA 更精确",
  "precision.stat.delta.behind": "比广播 ETA 精度低",
  "precision.stat.delta.notEnough": "需若干航次后才能比较",
  "precision.table.title": "最近 50 个已完成航次",
  "precision.table.errHelp": "err = 预测 − 实际",
  "precision.table.col.mmsi": "MMSI",
  "precision.table.col.cargo": "货物",
  "precision.table.col.arrival": "到港",
  "precision.table.col.errModel": "模型误差",
  "precision.table.col.errBroadcast": "广播误差",
  "precision.table.empty":
    "时间窗内暂无已完成航次。一旦被跟踪的船舶靠泊,表格便会填充。",
  "precision.method.title": "方法论",
  "precision.method.b1":
    "数据源:aisstream.io AIS 流,按港口 bbox 过滤(含海上锚地)。",
  "precision.method.b2":
    "航次 = 首次进入接近区/锚地 → 靠泊(NavStatus moored 或在泊位区域 SOG < 0.3 节)。",
  "precision.method.b3":
    "ETA 模型 v1:每 5 分钟重新计算的距离 / SOG。路线图:季节、拥堵感知、潮汐感知模型。",
  "precision.method.b4":
    "参考:从 ShipStaticData 报文中提取的广播 ETA(船员录入)。",
  "precision.method.b5":
    "指标:RMSE 和 MAE,基于具有预测和广播 ETA 的已完成航次。",
  "precision.cta.title": "跟踪您自己的航次",
  "precision.cta.lead":
    "开通免费账号,将您的船舶加入监视列表,在所有港口监控 ETA 精度。",
  "precision.cta.button": "查看价格",
  "precision.cta.dashboard": "打开仪表板",
};

const ja: PageMessages = {
  "nav.back": "← 戻る",

  "pricing.title": "料金",
  "pricing.subtitle":
    "マルチポート AIS · 予測 ETA · SAR 融合 · 制裁スクリーニング · 51 戦略港",
  "pricing.note":
    "STRIPE_SECRET_KEY と STRIPE_PRICE_* が設定されている場合のみ支払いが機能します。それ以外の場合、ボタンは 503 エラーを返します。",
  "pricing.note.label": "技術メモ:",
  "pricing.checkout.error": "Stripe Checkout 利用不可",
  "pricing.tier.free.name": "Free",
  "pricing.tier.free.price": "€0",
  "pricing.tier.free.period": "",
  "pricing.tier.free.features":
    "3 つの戦略港|ライブダッシュボード、7 日履歴|公開 API なし",
  "pricing.tier.free.cta": "始める",
  "pricing.tier.starter.name": "Starter",
  "pricing.tier.starter.price": "€99",
  "pricing.tier.starter.period": "/ 月",
  "pricing.tier.starter.features":
    "15 港|公開 API 5k リクエスト/日|Webhook アラート|CSV エクスポート|30 日履歴|ウォッチリストに 25 隻",
  "pricing.tier.starter.cta": "Starter を選択",
  "pricing.tier.pro.name": "Pro",
  "pricing.tier.pro.price": "€499",
  "pricing.tier.pro.period": "/ 月",
  "pricing.tier.pro.features":
    "全 51 港|API 600 リクエスト/分|詳細 ETA 精度 + 遅延要因分析|AIS + SAR Sentinel-1 融合|ダークフリート検出|OFAC + UK OFSI 制裁スクリーニング|航海ごとの CO2 排出量|90 日履歴|ウォッチリストに 250 隻",
  "pricing.tier.pro.cta": "Pro を選択",
  "pricing.tier.enterprise.name": "Enterprise",
  "pricing.tier.enterprise.price": "お問い合わせ",
  "pricing.tier.enterprise.period": "",
  "pricing.tier.enterprise.features":
    "Pro のすべて +|Spire / MarineTraffic / Orbcomm コネクタ|99.9% 契約 SLA|365+ 日履歴 + バックフィル|ホワイトラベル & 専用|専用サポート",
  "pricing.tier.enterprise.cta": "お問い合わせ",

  // /precision
  "precision.title": "ETA 精度",
  "precision.lead":
    "AIS の位置・速度・針路から {port} への到着時刻を予測し、実際の到着および船社が申告した ETA と比較します。公開、継続的に再計算、再現可能。",
  "precision.window": "ウィンドウ",
  "precision.stat.our": "当方の RMSE",
  "precision.stat.broadcast": "ブロードキャスト ETA RMSE",
  "precision.stat.broadcast.hint": "参照: 船社が申告した ETA",
  "precision.stat.advantage": "モデルの優位性",
  "precision.stat.gap": "ギャップ",
  "precision.stat.our.hint": "MAE {mae} · {n} 航海",
  "precision.stat.delta.beats": "ブロードキャスト ETA より高精度",
  "precision.stat.delta.behind": "ブロードキャスト ETA より低精度",
  "precision.stat.delta.notEnough": "数件の航海後に比較可能",
  "precision.table.title": "直近 50 件の完了航海",
  "precision.table.errHelp": "err = 予測 − 実際",
  "precision.table.col.mmsi": "MMSI",
  "precision.table.col.cargo": "貨物",
  "precision.table.col.arrival": "到着",
  "precision.table.col.errModel": "モデル誤差",
  "precision.table.col.errBroadcast": "ブロードキャスト誤差",
  "precision.table.empty":
    "ウィンドウ内に完了航海はまだありません。追跡中の船舶が係留すると表に追加されます。",
  "precision.method.title": "方法論",
  "precision.method.b1":
    "ソース: aisstream.io の AIS フィードを港の bbox(沖合錨地含む)でフィルタ。",
  "precision.method.b2":
    "航海 = 接近域/錨地への初観測 → 岸壁係留(NavStatus moored または岸壁ゾーンで SOG < 0.3 ノット)。",
  "precision.method.b3":
    "ETA モデル v1: 5 分ごとに再計算する 距離 / SOG。ロードマップ: 季節・混雑・潮汐モデル。",
  "precision.method.b4":
    "参照: ShipStaticData メッセージから抽出したブロードキャスト ETA(乗組員入力)。",
  "precision.method.b5":
    "指標: 予測 ETA とブロードキャスト ETA が揃う完了航海に対する RMSE と MAE。",
  "precision.cta.title": "ご自身の航海を追跡",
  "precision.cta.lead":
    "Free アカウントを開設し、ウォッチリストに船舶を追加して全港の ETA 精度をモニタリング。",
  "precision.cta.button": "料金を見る",
  "precision.cta.dashboard": "ダッシュボードを開く",
};

export const PAGE_MESSAGES: Record<Locale, PageMessages> = {
  fr,
  en,
  nl,
  de,
  es,
  ar,
  zh,
  ja,
};

export function tp(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>,
): string {
  const dict = PAGE_MESSAGES[locale] ?? PAGE_MESSAGES.en;
  let value = dict[key] ?? PAGE_MESSAGES.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(`{${k}}`, String(v));
    }
  }
  return value;
}

export function tpList(locale: Locale, key: string): string[] {
  return tp(locale, key).split("|");
}
