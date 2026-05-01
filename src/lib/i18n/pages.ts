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
    "3 ports max (à choisir parmi 51)|Dashboard live · ETA · congestion · sanctions|7 j d'historique voyages|Visualisation seule|Pas de watchlist navires · pas d'alertes · pas d'API · pas d'export CSV",
  "pricing.tier.free.cta": "Démarrer",
  "pricing.cycle.monthly": "Mensuel",
  "pricing.cycle.yearly": "Annuel",
  "pricing.cycle.save": "−25% (3 mois offerts)",
  "pricing.founder.title": "Tarif Founder — −{percent}% à vie",
  "pricing.founder.body":
    "Réservé aux 100 premiers clients. Code {code} — encore {remaining}/{max} places. À coller dans Stripe Checkout (champ « Code promo »).",
  "pricing.tier.starter.name": "Starter",
  "pricing.tier.starter.price": "129 €",
  "pricing.tier.starter.period": "/ mois",
  "pricing.tier.starter.priceYearlyEquiv": "97 €",
  "pricing.tier.starter.priceYearlyTotal": "Facturé 1 161 €/an",
  "pricing.tier.starter.yearlySavings": "Économisez 387 €",
  "pricing.tier.starter.features":
    "15 ports|API publique 5 k req/j|Alertes Slack/Telegram/Email/Discord|Export CSV|30 j d'historique|25 navires en watchlist",
  "pricing.tier.starter.cta": "Choisir Starter",
  "pricing.tier.professional.name": "Professional",
  "pricing.tier.professional.price": "199 €",
  "pricing.tier.professional.period": "/ mois",
  "pricing.tier.professional.priceYearlyEquiv": "149 €",
  "pricing.tier.professional.priceYearlyTotal": "Facturé 1 791 €/an",
  "pricing.tier.professional.yearlySavings": "Économisez 597 €",
  "pricing.tier.professional.features":
    "30 ports stratégiques|API 18 k req/h|Screening sanctions OFAC + UK OFSI|Alertes multi-canal|Demurrage risk score|Export CSV|60 j d'historique|100 navires en watchlist",
  "pricing.tier.professional.cta": "Choisir Professional",
  "pricing.tier.pro.name": "Pro+",
  "pricing.tier.pro.price": "499 €",
  "pricing.tier.pro.period": "/ mois",
  "pricing.tier.pro.priceYearlyEquiv": "374 €",
  "pricing.tier.pro.priceYearlyTotal": "Facturé 4 491 €/an",
  "pricing.tier.pro.yearlySavings": "Économisez 1 497 €",
  "pricing.tier.pro.features":
    "Les 51 ports|API 600 req/min|ETA precision détaillée + attribution des retards|Fusion AIS + SAR Sentinel-1|Détection dark fleet|Screening sanctions OFAC + UK OFSI|Émissions CO2 par voyage|90 j d'historique|250 navires en watchlist",
  "pricing.tier.pro.cta": "Choisir Pro+",
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
    "Modèle ETA v2 : distance / SOG corrigé par médiane (port × jour × heure × cargo) avec fallback hiérarchique + pénalité congestion live (anchored count). Recalculé toutes les 5 minutes. Roadmap : modèle tidal + tirant d'eau.",
  "precision.method.b4":
    "Référence : champ ETA broadcast extrait des messages ShipStaticData (saisi par l'équipage).",
  "precision.method.b5":
    "Métriques : RMSE et MAE sur les voyages clos avec ETA prédit et ETA broadcast disponibles.",
  "precision.cta.title": "Mesurez vos propres voyages",
  "precision.cta.lead":
    "Ouvrez un compte Free, ajoutez vos navires en watchlist et suivez leur précision ETA dans tous nos ports.",
  "precision.cta.button": "Voir les tarifs",
  "precision.cta.dashboard": "Ouvrir le dashboard",

  // /fleet
  "fleet.title": "Ma flotte",
  "fleet.subtitle":
    "Vue cross-port de tes navires suivis. Position live, voyage en cours, dernière activité.",
  "fleet.empty.title": "Aucun navire suivi",
  "fleet.empty.lead":
    "Active le bookmark sur un navire dans le dashboard pour le suivre ici.",
  "fleet.empty.cta": "Ouvrir le dashboard",
  "fleet.col.vessel": "Navire",
  "fleet.col.cargo": "Cargo",
  "fleet.col.currentPort": "Port actuel",
  "fleet.col.voyage": "Voyage en cours",
  "fleet.col.eta": "ETA prédite",
  "fleet.col.last": "Dernière activité",
  "fleet.col.actions": "",
  "fleet.state.open": "approche {port}",
  "fleet.state.atPort": "à {port}",
  "fleet.state.atSea": "en mer",
  "fleet.state.unknown": "—",
  "fleet.last.arrival": "{port} il y a {h}h",
  "fleet.last.none": "—",
  "fleet.action.remove": "Retirer",
  "fleet.action.dashboard": "Voir",
  "fleet.refresh": "Actualisé toutes les 60 s",
  "fleet.signIn": "Connecte-toi pour voir ta flotte",

  // /methodology
  "methodology.backLink": "← Retour précision",
  "methodology.title": "Méthodologie & SLA",
  "methodology.lead":
    "Cette page documente précisément les sources de données, les modèles, la persistance et les engagements de service de la plateforme. C'est le document que les équipes data des acheteurs B2B (traders, assureurs, freight forwarders) examinent avant de signer.",
  "methodology.sources.title": "Sources de données",
  "methodology.sources.aisLive":
    "Flux temps réel via aisstream.io (réseau communautaire). Couverture excellente Europe / US, plus faible Méditerranée / Golfe Persique.",
  "methodology.sources.aisStatic":
    "ShipStaticData (Type, Name, Destination, Draught, ETA broadcast) — émis toutes les ~6 minutes par navire.",
  "methodology.sources.geo":
    "bbox + zones (anchorages, berths, channels) définies à la main par port. Catalogue v1 : 51 ports incluant ARA, Hamburg, Algésiras, Fujairah, Singapour, Houston, Sabine Pass, Ras Laffan.",
  "methodology.sources.proprietary":
    "Pas de données propriétaires intégrées en v1 — la plateforme s'appuie uniquement sur AIS publique. Des sources premium (Spire, Orbcomm) sont sur la roadmap pour combler les zones de couverture faible.",
  "methodology.cargoClass.title": "Classification de cargaison",
  "methodology.cargoClass.body":
    "Combinaison du shipType AIS (codes 70-89) et d'une heuristique mots-clés (nom, destination) pour assigner une classe parmi : crude, product, chemical, LNG, LPG, container, dry-bulk, general-cargo, ro-ro, passenger, fishing, tug, other. Limitations connues : un navire mal nommé ou avec destination vide tombe sur le shipType générique. Précision attendue ~85 % sur tankers et ~95 % sur containers.",
  "methodology.voyages.title": "Détection de voyages",
  "methodology.voyages.open":
    "Ouverture : un voyage s'ouvre quand un navire (de classe trackable : tanker / container / bulk / general / RoRo) est observé en approche/mouillage avec SOG ≥ 1 kn, après la grace period de 60 s suivant le démarrage du worker.",
  "methodology.voyages.arrival":
    "Arrivée : transition vers state = moored dans une zone de quai (NavStatus 5 ou SOG < 0,3 kn dans la zone berth).",
  "methodology.voyages.departure":
    "Départ : après l'arrivée, le navire repasse à state = underway et distance > 8 nm du centre du port.",
  "methodology.voyages.falsePositives":
    "Faux positifs : tugs, pilotes et fishing exclus du tracking — la classe cargaison sert de filtre.",
  "methodology.eta.title": "Modèle ETA",
  "methodology.eta.naive":
    "Estimation naïve : distance / SOG où distance est le grand cercle entre la position courante et le centre du port. Recalculée toutes les 5 minutes par voyage actif.",
  "methodology.eta.seasonal":
    "Correction saisonnière : médiane de l'erreur (predicted − actual) calculée sur les 90 jours glissants, par heure d'arrivée UTC. Fallback sur la médiane globale si le bucket horaire a moins de 3 échantillons. Recompute toutes les 30 min.",
  "methodology.eta.broadcast":
    "Référence comparée : champ ETA broadcast extrait des messages ShipStaticData (saisi manuellement par l'équipage du navire — souvent imprécis et tardif).",
  "methodology.eta.metrics":
    "Métriques : RMSE et MAE en heures, sur les voyages clos avec ETA prédit ET ETA broadcast disponibles. Mises à jour à chaque voyage clos. Fenêtre par défaut : 30 jours.",
  "methodology.eta.roadmap":
    "Roadmap modèle : intégration congestion, marées, météo, vitesse moyenne historique du navire spécifique.",
  "methodology.anomalies.title": "Détection d'anomalies",
  "methodology.anomalies.intro":
    "v1 : seuils absolus de dwell au mouillage, ajustés par classe de cargaison.",
  "methodology.anomalies.tanker":
    "Tankers (crude/product/chemical/LNG/LPG) : warn ≥ 12 h, critical ≥ 48 h.",
  "methodology.anomalies.container":
    "Containers : warn ≥ 6 h, critical ≥ 24 h.",
  "methodology.anomalies.other": "Autres : warn ≥ 18 h, critical ≥ 72 h.",
  "methodology.anomalies.roadmap":
    "Roadmap : seuils dérivés de la distribution historique par (port, cargo) ; détection de déviation de route filée ; détection de loitering hors zone connue (signal « dark fleet »).",
  "methodology.persistence.title": "Persistance & lineage",
  "methodology.persistence.storage":
    "Stockage SQLite via node:sqlite (built-in Node 22+). Tables : kpi_snapshots, static_ships, positions, voyages, webhook_subscriptions, webhook_deliveries.",
  "methodology.persistence.timestamps":
    "Chaque ligne kpi_snapshots et voyages porte le port et le timestamp. Reproductibilité totale d'une métrique à un instant donné.",
  "methodology.persistence.snapshot":
    "Snapshot des positions : 1 entrée par minute par navire (rate limited). Permet le backtesting et la rejouabilité du modèle.",
  "methodology.persistence.export":
    "Roadmap : export Parquet quotidien vers S3 / GCS pour les data scientists clients.",
  "methodology.sla.title": "Engagements de service (SLA v1)",
  "methodology.sla.uptime": "Disponibilité plateforme",
  "methodology.sla.uptimeValue": "99,5 %/mois (MVP)",
  "methodology.sla.latencyLive": "Latence positions live",
  "methodology.sla.latencyLiveValue": "< 30 s (P95)",
  "methodology.sla.latencyKpi": "Latence KPIs / voyages",
  "methodology.sla.latencyKpiValue": "< 90 s (P95)",
  "methodology.sla.webhook": "Webhook delivery",
  "methodology.sla.webhookValue": "1 retry à 60 s · log 90 j",
  "methodology.sla.retention": "Rétention historique",
  "methodology.sla.retentionValue":
    "7 jours KPIs in-memory · illimité en SQLite (compactage 90 j)",
  "methodology.sla.backfill": "Backfill",
  "methodology.sla.backfillValue":
    "Sur demande contractuelle (rejouage des positions persistées)",
  "methodology.compliance.title": "Conformité",
  "methodology.compliance.solas":
    "Données AIS : ouvertes, transmises par les navires en respect de la convention SOLAS. Aucune donnée personnelle de l'équipage.",
  "methodology.compliance.gdpr":
    "RGPD : aucun traitement de données personnelles. Les MMSI sont des identifiants de navire, pas de personne.",
  "methodology.compliance.sanctions":
    "Sanctions : la plateforme ne filtre pas activement les navires sous sanctions (US OFAC, UK OFSI, EU). Le client doit appliquer ses propres listes.",
  "methodology.compliance.legalIntro": "Détails complets sur la page",
  "methodology.compliance.legalLabel": "Mentions légales",

  // /status
  "status.backLink": "← retour",
  "status.title": "System status",
  "status.lead":
    "Disponibilité publique des services Port Flow. Mise à jour automatique toutes les 30 s.",
  "status.loading": "Chargement…",
  "status.ais.title": "AIS terrestre (aisstream.io)",
  "status.ais.connection": "Connexion",
  "status.ais.connectionActive": "active",
  "status.ais.connectionDown": "down",
  "status.ais.lastMessage": "Dernier message",
  "status.ais.cached": "Navires en cache",
  "status.ais.received": "Messages reçus",
  "status.sar.title": "Sentinel-1 SAR scanner",
  "status.sar.enabled": "Activé",
  "status.sar.yes": "oui",
  "status.sar.no": "non",
  "status.sar.copernicusAuth": "Auth Copernicus",
  "status.sar.configured": "configurée",
  "status.sar.missing": "absente",
  "status.sar.demoMode": "Mode démo",
  "status.sar.demoOn": "actif",
  "status.sar.demoOff": "off",
  "status.sar.lastScan": "Dernier scan",
  "status.sanctions.title": "Listes de sanctions (OFAC + UK OFSI)",
  "status.sanctions.indexed": "Entrées indexées",
  "status.sanctions.byImo": "Par IMO",
  "status.sanctions.byMmsi": "Par MMSI",
  "status.sanctions.lastUpdate": "Dernière maj",
  "status.coverage.title": "Couverture ports",
  "status.coverage.tracked": "Ports tracés",
  "status.coverage.active": "Ports actifs (≥1 navire)",
  "status.coverage.activityRate": "Taux d'activité",
  "status.accuracy.title": "Précision ETA — Rotterdam · 30 j",
  "status.accuracy.rmsePF": "RMSE Port Flow",
  "status.accuracy.rmseBroadcast": "RMSE broadcast",
  "status.accuracy.advantage": "Avantage",
  "status.accuracy.closedVoyages": "Voyages clos",
  "status.accuracy.beats":
    "Plus précis que l'ETA déclarée par les armateurs",
  "status.accuracy.behind": "Moins précis — modèle en apprentissage",

  // /guide
  "guide.backLink": "← retour au dashboard",
  "guide.methodologyLink": "Méthodologie →",
  "guide.title": "Guide d'utilisation",
  "guide.lead":
    "Port Flow donne une vue temps réel des flux maritimes sur 51 ports stratégiques (ARA, soutage, LNG export). Cette page explique comment lire le dashboard, qui en tire de la valeur, et comment intégrer les données dans tes pipelines.",
  "guide.audience.title": "À qui ça sert ?",
  "guide.audience.traders":
    "Traders matières premières (pétrole, LNG, chimie) — ETA précise et indices de congestion alimentent les modèles de prix. Cible primaire de la plateforme.",
  "guide.audience.forwarders":
    "Freight forwarders — anticipation des dépassements de séjour (demurrage), choix de routing.",
  "guide.audience.insurers":
    "Assureurs maritimes — détection d'anomalies (loitering, dwell anormal), risk pricing.",
  "guide.audience.quants":
    "Data scientists / quants — feed historique pour backtesting de stratégies macro (activité portuaire = proxy économique).",
  "guide.dashboard.title": "Lire le dashboard en 30 secondes",
  "guide.dashboard.portSelector":
    "Sélecteur de port en haut à droite — change le port observé. Le nom natif s'affiche entre parenthèses si la langue active diffère (ex : Anvers (Antwerpen), Hamburg, الفجيرة).",
  "guide.dashboard.langSelector":
    "Sélecteur de langue à côté — 8 langues métier : FR, EN, NL, DE, ES, AR (avec RTL automatique), ZH, JA.",
  "guide.dashboard.toggle":
    "Toggle Tous / Tankers — filtre instantanément la carte et les compteurs aux 5 sous-classes tanker (crude, product, chemical, LNG, LPG).",
  "guide.dashboard.kpis":
    "Ligne KPI — total navires, stationnaires (proxy congestion), en route, à quai, entrants/h, voyages actifs trackés.",
  "guide.dashboard.map":
    "Carte — couleur = catégorie AIS, taille = état. Les rectangles pointillés sont les zones nommées (anchorage, berth, channel).",
  "guide.dashboard.voyages":
    "Voyages actifs — table triée par ETA prédite. La colonne « ETA broadcast » est l'heure que l'équipage a saisie ; comparer aux écarts du modèle.",
  "guide.dashboard.precision":
    "ETA precision — RMSE de notre modèle vs RMSE de l'ETA broadcast. C'est l'indicateur principal de qualité.",
  "guide.dashboard.anomalies":
    "Anomalies — navires au mouillage anormalement long pour leur classe. Critique à surveiller pour congestion ou bizarreries opérationnelles.",
  "guide.dashboard.flow":
    "Flux 6 h — entrants / sortants / stationnaires sur les 6 dernières heures. Tendance courte.",
  "guide.precision.title": "Page ETA precision",
  "guide.precision.body":
    "Accessible via le bouton ETA precision ou /precision. Vue publique destinée à démontrer aux prospects la qualité du modèle. Trois indicateurs clés : RMSE modèle, RMSE broadcast, écart en %. Liste des 50 derniers voyages clos avec erreur en heures (vert < 1 h, ambre < 3 h, rouge au-delà). Méthodologie en bas de page. Filtre fenêtre 7/30/90 jours.",
  "guide.api.title": "Intégration API",
  "guide.api.intro": "API publique sous /api/v1, authentifiée par bearer token. Spécification OpenAPI à",
  "guide.api.endpoints":
    "Endpoints disponibles : /ports, /ports/{id}/snapshot, /ports/{id}/vessels, /ports/{id}/voyages/active, /ports/{id}/voyages/closed, /ports/{id}/anomalies, /webhooks.",
  "guide.webhooks.title": "Webhooks (alertes)",
  "guide.webhooks.intro":
    "Souscris à un événement pour recevoir un POST signé HMAC-SHA256 quand un seuil est franchi.",
  "guide.webhooks.headers":
    "Headers fournis sur chaque livraison : X-Port-Flow-Event et X-Port-Flow-Signature: t=<ts>,v1=<hex> (HMAC-SHA256 du payload préfixé par le timestamp). Vérification côté receveur : hmac_sha256(secret, \"{ts}.{body}\").",
  "guide.webhooks.events":
    "Événements supportés : congestion.threshold / congestion.cleared, anomaly.detected, voyage.arrived.",
  "guide.limits.title": "Limites connues",
  "guide.limits.coverage":
    "Couverture AIS faible Méditerranée et Golfe Persique avec aisstream.io (réseau communautaire). Algeciras, Fujairah, Ras Laffan affichent souvent peu ou aucun navire en v1. Solution : passer à un fournisseur commercial (Spire, Orbcomm) — sur la roadmap.",
  "guide.limits.classification":
    "Classification cargaison à ~85 % (tankers) / ~95 % (containers). Faux positifs sur les navires non nommés.",
  "guide.limits.grace":
    "Au démarrage du worker, une grace period de 60 s évite de compter les navires déjà présents comme « entrants ». Les KPIs entrants/h se calibrent ensuite naturellement.",
  "guide.limits.eta":
    "Modèle ETA v2 (distance/SOG + correction saisonnière + congestion + météo). Bat l'ETA broadcast quand les voyages sont > 6 h ; moins d'avance sur les voyages courts.",
  "guide.limits.sanctions":
    "Filtrage sanctions intégré (OFAC + UK OFSI) en plan Professional+. Le client peut aussi appliquer ses propres listes via l'API.",
  "guide.checklist.title": "Checklist de déploiement",
  "guide.checklist.s1": "Créer une clé",
  "guide.checklist.s2":
    "cp .env.example .env.local, renseigner AISSTREAM_API_KEY et PORT_API_TOKENS.",
  "guide.checklist.s3": "npm install && npm run dev.",
  "guide.checklist.s4":
    "Vérifier le bandeau AIS Live en haut à droite (vert = flux entrant).",
  "guide.checklist.s5":
    "Attendre 60 s + quelques minutes pour voir les voyages s'ouvrir (selon le trafic).",
  "guide.checklist.s6":
    "La page /precision affichera des chiffres après les premiers voyages clos (ETA prédite + arrivée constatée).",

  // /legal
  "legal.backLink": "← retour",
  "legal.methodologyLink": "Méthodologie →",
  "legal.title": "Mentions légales",
  "legal.lead":
    "Cette page consolide attributions de données, conditions d'utilisation, vie privée, conformité et limites. Elle est référencée depuis le pied de chaque page.",
  "legal.maritime.title": "Avis maritime",
  "legal.maritime.notForNav": "Not for navigation.",
  "legal.maritime.body":
    "Les positions, ETA, anomalies et indicateurs publiés par Port Flow sont dérivés de signaux AIS publics et de données météo et imagerie satellite. Ils peuvent contenir des erreurs, des retards et des omissions. Cette plateforme ne remplace en aucun cas un système de navigation certifié, ni une cellule opérationnelle de pilotage. L'usage à des fins de sécurité maritime, de pilotage ou de décision opérationnelle critique est explicitement exclu.",
  "legal.tos.title": "Conditions d'utilisation",
  "legal.tos.b1":
    "Plateforme fournie « en l'état », sans garantie de disponibilité, d'exactitude ou d'adéquation à un usage particulier.",
  "legal.tos.b2.intro": "Engagements de service détaillés dans la",
  "legal.tos.b2.linkLabel": "page méthodologie",
  "legal.tos.b2.outro": " (SLA v1).",
  "legal.tos.b3":
    "Les données affichées peuvent être dérivées et transformées. La plateforme n'est pas un revendeur de données AIS brutes.",
  "legal.tos.b4":
    "Tout usage commercial nécessite respect des termes des fournisseurs sources (notamment paiement Spire / MarineTraffic / Orbcomm si activés).",
  "legal.privacy.title": "Politique de confidentialité (RGPD)",
  "legal.privacy.controller": "Responsable de traitement :",
  "legal.privacy.contactPrefix": "Port Flow — contact :",
  "legal.privacy.intro":
    "Cette section décrit les données personnelles collectées, leurs finalités et les droits de l'utilisateur conformément au RGPD (UE) 2016/679. Pour les clients EU, un DPA signable est disponible sur demande à privacy@portflow.uk.",
  "legal.privacy.dpaBold": "DPA signable",
  "legal.privacy.dataTitle": "Données collectées et finalités",
  "legal.privacy.col.data": "Donnée",
  "legal.privacy.col.purpose": "Finalité",
  "legal.privacy.col.basis": "Base légale",
  "legal.privacy.col.retention": "Conservation",
  "legal.privacy.row1.data": "Email + identifiant Clerk",
  "legal.privacy.row1.purpose": "Authentification, support",
  "legal.privacy.row1.basis": "Exécution contractuelle",
  "legal.privacy.row1.retention": "Tant que compte actif + 12 mois",
  "legal.privacy.row2.data": "ID client Stripe + historique paiement",
  "legal.privacy.row2.purpose": "Facturation, abonnement",
  "legal.privacy.row2.basis": "Exécution contractuelle",
  "legal.privacy.row2.retention": "10 ans (obligation comptable)",
  "legal.privacy.row3.data":
    "URLs webhook Slack/Discord/Telegram, email alertes",
  "legal.privacy.row3.purpose": "Envoi d'alertes que vous configurez",
  "legal.privacy.row3.basis": "Consentement explicite (saisie UI)",
  "legal.privacy.row3.retention": "Jusqu'à suppression par l'utilisateur",
  "legal.privacy.row4.data":
    "Clés API tierces (Spire/VIIRS/Orbcomm) chiffrées AES-256-GCM",
  "legal.privacy.row4.purpose": "Intégration BYO key",
  "legal.privacy.row4.basis": "Consentement explicite (saisie UI)",
  "legal.privacy.row4.retention": "Jusqu'à suppression par l'utilisateur",
  "legal.privacy.row5.data": "Watchlist (MMSI navires, IDs ports)",
  "legal.privacy.row5.purpose": "Personnalisation dashboard",
  "legal.privacy.row5.basis": "Exécution contractuelle",
  "legal.privacy.row5.retention": "Tant que compte actif",
  "legal.privacy.row6.data": "Logs API (timestamp, key prefix, endpoint)",
  "legal.privacy.row6.purpose": "Audit, sécurité, anti-abus",
  "legal.privacy.row6.basis": "Intérêt légitime",
  "legal.privacy.row6.retention": "90 jours rolling",
  "legal.privacy.subTitle": "Sous-traitants (sub-processors)",
  "legal.privacy.sub.clerk":
    "Clerk Inc. (US) — authentification utilisateur · clerk.com (DPA disponible)",
  "legal.privacy.sub.stripe":
    "Stripe Inc. (US) — facturation · stripe.com (DPA + SCCs disponibles)",
  "legal.privacy.sub.do":
    "DigitalOcean LLC (Frankfurt EU region) — hébergement · digitalocean.com (DPA)",
  "legal.privacy.sub.cloudflare":
    "Cloudflare Inc. (US) — DNS + DDoS · cloudflare.com (DPA + SCCs)",
  "legal.privacy.sub.resend":
    "Resend Inc. (US) — envoi emails d'alertes (si activé) · resend.com (DPA)",
  "legal.privacy.sub.aisstream":
    "aisstream.io — flux AIS public (pas de donnée personnelle utilisateur transmise)",
  "legal.privacy.sub.copernicus":
    "Copernicus Data Space (ESA) — imagerie satellite Sentinel-1 (publique)",
  "legal.privacy.transfersTitle": "Transferts hors UE",
  "legal.privacy.transfersBody":
    "Clerk, Stripe, Cloudflare et Resend opèrent depuis les US. Tous disposent de Standard Contractual Clauses (SCCs) UE-US. Les données AIS et de port (publiques par nature) ne constituent pas des données personnelles transférées.",
  "legal.privacy.rightsTitle": "Vos droits",
  "legal.privacy.rights.access":
    "Accès, rectification — tout est visible dans /account, modifiable directement",
  "legal.privacy.rights.delete":
    "Effacement — supprime ton compte via Clerk (les clés API + watchlist + alertes en cascade)",
  "legal.privacy.rights.portability":
    "Portabilité — export CSV de ta watchlist/flotte disponible depuis /fleet (Starter+)",
  "legal.privacy.rights.opt":
    "Opposition, retrait du consentement — désactivation des alertes ou retrait des clés à tout moment dans /account et /sources",
  "legal.privacy.rights.complaint":
    "Réclamation — auprès de la CNIL (France) ou de toute autorité de contrôle européenne",
  "legal.privacy.securityTitle": "Sécurité technique",
  "legal.privacy.security.tls":
    "HTTPS TLS 1.3 obligatoire (Let's Encrypt). HTTP redirigé.",
  "legal.privacy.security.encryption":
    "Chiffrement at-rest des secrets utilisateur (clés API tierces) : AES-256-GCM avec master key serveur",
  "legal.privacy.security.passwords":
    "Mots de passe gérés par Clerk (PBKDF2/Argon2id, jamais en clair)",
  "legal.privacy.security.audit":
    "Logs auditables (table audit_log) sur changements d'abonnement et accès API",
  "legal.privacy.security.mmsi":
    "MMSI affichés = identifiants de navire, attribués par l'UIT au pavillon — pas des identifiants de personnes",
  "legal.privacy.security.cookies":
    "Aucun cookie d'analytics tiers. Le seul stockage local est le cache navigateur de résilience d'onglet, purgeable.",
  "legal.dpa.title": "Data Processing Agreement (DPA) — résumé",
  "legal.dpa.intro":
    "Pour tout client EU professionnel utilisant Port Flow pour traiter des données dans le cadre d'une activité B2B, un DPA conforme à l'article 28 RGPD est mis à disposition.",
  "legal.dpa.role":
    "Port Flow agit comme sous-traitant pour les données traitées dans le cadre du service (watchlist, alertes, clés API)",
  "legal.dpa.noSecondary":
    "Aucun traitement secondaire : pas de publicité, de revente, de profilage commercial",
  "legal.dpa.breach": "Notification de toute violation de données dans les 72 h",
  "legal.dpa.audits":
    "Coopération aux audits annuels du client (sur préavis 30 jours)",
  "legal.dpa.endOfContract":
    "Suppression ou retour des données à la fin du contrat (export CSV + purge DB sur demande)",
  "legal.dpa.subList":
    "Liste des sous-traitants ci-dessus, modifiable avec préavis 30 jours",
  "legal.dpa.outro": "DPA signé sur demande à",
  "legal.dpa.outroSuffix": " — délai indicatif 48 h ouvrées.",
  "legal.sanctions.title": "Sanctions & conformité",
  "legal.sanctions.b1":
    "La plateforme n'applique pas de filtre OFAC, OFSI, EU ou ONU sur les navires affichés. Les opérateurs sous sanctions peuvent apparaître comme tout autre navire.",
  "legal.sanctions.b2":
    "Il appartient au client utilisateur (trader, assureur, freight forwarder) d'appliquer ses propres listes et procédures de screening.",
  "legal.sanctions.b3":
    "La plateforme est neutre : aucun navire n'est masqué ou marqué sur des critères politiques ou commerciaux.",
  "legal.citation.title": "Citation académique",
  "legal.citation.body":
    "Si vous citez Port Flow dans une publication, merci d'inclure :",

  // /sources
  "sources.backLink": "← retour",
  "sources.methodologyLink": "Méthodologie →",
  "sources.title": "Sources de données",
  "sources.lead":
    "Mix multi-source : AIS terrestre temps réel + radar SAR (gratuit, ~6 jours de revisite) + connecteurs prêts pour les fournisseurs S-AIS payants.",
  "sources.howRead.title": "Comment lire cette page :",
  "sources.howRead.activeBadge": "Actif",
  "sources.howRead.activeDesc":
    "= la source est configurée par l'opérateur et alimente le dashboard pour tous les utilisateurs.",
  "sources.howRead.byoBadge": "votre clé",
  "sources.howRead.byoDesc": "= vous avez ajouté la vôtre (Pro+).",
  "sources.howRead.view": "Visualiser les données dans le dashboard",
  "sources.howRead.viewDesc":
    "est gratuit (limité aux ports de votre plan).",
  "sources.howRead.api": "Accéder via API",
  "sources.howRead.apiDesc": "nécessite le plan Starter+.",
  "sources.howRead.byoOwn": "Apporter votre propre clé (BYO)",
  "sources.howRead.byoOwnDesc": "pour Spire / VIIRS / Orbcomm est réservé Pro+.",
  "sources.tier.aisTerrestrial": "AIS terrestre",
  "sources.tier.aisSatellite": "AIS satellite",
  "sources.tier.sar": "Radar SAR",
  "sources.tier.opticalNight": "Optique nuit",
  "sources.tariff.free": "Gratuit",
  "sources.tariff.freeWithKey": "Gratuit + clé",
  "sources.tariff.paid": "Payant",
  "sources.integration.live": "Intégration live",
  "sources.integration.inProgress": "Intégration en cours",
  "sources.integration.planned": "Intégration planifiée",
  "sources.integration.etaTitle": "ETA d'activation : {eta}",
  "sources.status.active": "Actif",
  "sources.status.configured": "Configuré",
  "sources.status.inactive": "Inactif",
  "sources.status.syncPrefix": "sync :",
  "sources.access.allPorts":
    "Plan {tier} : visible sur tous les 51 ports{apiNote}.",
  "sources.access.partial":
    "Plan {tier} : visible sur {count}/{max} port{plural} favori{plural}{apiNote}.",
  "sources.access.partialNoMax":
    "Plan {tier} : visible sur {count} port{plural} favori{plural}{apiNote}.",
  "sources.access.emptyMax":
    "Plan {tier} : choisis jusqu'à {max} ports favoris (★ dans le sélecteur de port) pour activer le suivi.",
  "sources.access.empty":
    "Plan {tier} : choisis tes ports favoris (★ dans le sélecteur) pour activer le suivi.",
  "sources.access.apiYes": " · API incluse",
  "sources.access.apiNo": " · API non incluse",
  "sources.scenesApi": "scenes API",
  "sources.fixesApi": "fixes API",
  "sources.byo.providedByOp": "fournie par l'opérateur",
  "sources.byo.yourKey": "votre clé",
  "sources.byo.addKey": "+ Coller ma clé",
  "sources.byo.placeholder": "Colle ta clé ici",
  "sources.byo.test": "Tester",
  "sources.recommendation.title": "Recommandation de mix",
  "sources.recommendation.demo":
    "Démo gratuite : aisstream.io (live) + Sentinel-1 (vérité terrain hebdo) — couvre EU/US correctement.",
  "sources.recommendation.production":
    "Production trader : ajouter Spire (geofencé sur chokepoints critiques : Hormuz, Singapour, Bab el-Mandeb) pour combler le trou Golfe Persique.",
  "sources.recommendation.redundancy":
    "Redondance opérationnelle : MarineTraffic ou Orbcomm en fallback — différentes constellations satellites, bascule automatique si une source tombe.",
  "sources.recommendation.darkFleet":
    "Détection dark fleet : VIIRS (lights de nuit) détecte les navires AIS éteints — précieux pour assureurs et sanctions.",
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
    "3 ports max (pick from 51)|Live dashboard · ETA · congestion · sanctions|7-day voyage history|Read-only|No vessel watchlist · no alerts · no API · no CSV export",
  "pricing.tier.free.cta": "Get started",
  "pricing.cycle.monthly": "Monthly",
  "pricing.cycle.yearly": "Yearly",
  "pricing.cycle.save": "−25% (3 months free)",
  "pricing.founder.title": "Founder pricing — −{percent}% lifetime",
  "pricing.founder.body":
    "First 100 customers only. Code {code} — {remaining}/{max} slots left. Paste it in Stripe Checkout (\"Promo code\" field).",
  "pricing.tier.starter.name": "Starter",
  "pricing.tier.starter.price": "€129",
  "pricing.tier.starter.period": "/ month",
  "pricing.tier.starter.priceYearlyEquiv": "€97",
  "pricing.tier.starter.priceYearlyTotal": "Billed €1,161/year",
  "pricing.tier.starter.yearlySavings": "Save €387",
  "pricing.tier.starter.features":
    "15 ports|Public API, 5k req/day|Slack/Telegram/Email/Discord alerts|CSV export|30-day history|25 vessels in watchlist",
  "pricing.tier.starter.cta": "Choose Starter",
  "pricing.tier.professional.name": "Professional",
  "pricing.tier.professional.price": "€199",
  "pricing.tier.professional.period": "/ month",
  "pricing.tier.professional.priceYearlyEquiv": "€149",
  "pricing.tier.professional.priceYearlyTotal": "Billed €1,791/year",
  "pricing.tier.professional.yearlySavings": "Save €597",
  "pricing.tier.professional.features":
    "30 strategic ports|API 18k req/hour|OFAC + UK OFSI sanctions screening|Multi-channel alerts|Demurrage risk score|CSV export|60-day history|100 vessels in watchlist",
  "pricing.tier.professional.cta": "Choose Professional",
  "pricing.tier.pro.name": "Pro+",
  "pricing.tier.pro.price": "€499",
  "pricing.tier.pro.period": "/ month",
  "pricing.tier.pro.priceYearlyEquiv": "€374",
  "pricing.tier.pro.priceYearlyTotal": "Billed €4,491/year",
  "pricing.tier.pro.yearlySavings": "Save €1,497",
  "pricing.tier.pro.features":
    "All 51 ports|API 600 req/min|Detailed ETA precision + delay attribution|AIS + SAR Sentinel-1 fusion|Dark fleet detection|OFAC + UK OFSI sanctions screening|CO2 emissions per voyage|90-day history|250 vessels in watchlist",
  "pricing.tier.pro.cta": "Choose Pro+",
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
    "ETA model v2: distance / SOG corrected by median (port × day × hour × cargo) with hierarchical fallback + live congestion penalty (anchored count). Recomputed every 5 minutes. Roadmap: tide-aware + draught-aware refinement.",
  "precision.method.b4":
    "Reference: broadcast ETA field extracted from ShipStaticData messages (entered by the crew).",
  "precision.method.b5":
    "Metrics: RMSE and MAE on closed voyages with both predicted and broadcast ETA available.",
  "precision.cta.title": "Track your own voyages",
  "precision.cta.lead":
    "Open a Free account, add your vessels to a watchlist and monitor ETA precision across every port we cover.",
  "precision.cta.button": "See pricing",
  "precision.cta.dashboard": "Open dashboard",

  // /fleet
  "fleet.title": "My fleet",
  "fleet.subtitle":
    "Cross-port view of your tracked vessels. Live position, active voyage, last activity.",
  "fleet.empty.title": "No tracked vessels",
  "fleet.empty.lead":
    "Bookmark a vessel from the dashboard to follow it here.",
  "fleet.empty.cta": "Open dashboard",
  "fleet.col.vessel": "Vessel",
  "fleet.col.cargo": "Cargo",
  "fleet.col.currentPort": "Current port",
  "fleet.col.voyage": "Active voyage",
  "fleet.col.eta": "Predicted ETA",
  "fleet.col.last": "Last activity",
  "fleet.col.actions": "",
  "fleet.state.open": "approaching {port}",
  "fleet.state.atPort": "at {port}",
  "fleet.state.atSea": "at sea",
  "fleet.state.unknown": "—",
  "fleet.last.arrival": "{port} {h}h ago",
  "fleet.last.none": "—",
  "fleet.action.remove": "Remove",
  "fleet.action.dashboard": "View",
  "fleet.refresh": "Refreshed every 60s",
  "fleet.signIn": "Sign in to see your fleet",

  // /methodology
  "methodology.backLink": "← Back to precision",
  "methodology.title": "Methodology & SLA",
  "methodology.lead":
    "This page documents the platform's data sources, models, persistence and service commitments. It's the document that B2B buyers' data teams (traders, insurers, freight forwarders) review before signing.",
  "methodology.sources.title": "Data sources",
  "methodology.sources.aisLive":
    "Real-time stream via aisstream.io (community network). Excellent coverage in Europe / US, weaker in the Mediterranean / Persian Gulf.",
  "methodology.sources.aisStatic":
    "ShipStaticData (Type, Name, Destination, Draught, broadcast ETA) — emitted by each vessel every ~6 minutes.",
  "methodology.sources.geo":
    "bbox + zones (anchorages, berths, channels) defined manually per port. v1 catalogue: 51 ports including ARA, Hamburg, Algeciras, Fujairah, Singapore, Houston, Sabine Pass, Ras Laffan.",
  "methodology.sources.proprietary":
    "No proprietary data integrated in v1 — the platform relies solely on public AIS. Premium sources (Spire, Orbcomm) are on the roadmap to fill low-coverage zones.",
  "methodology.cargoClass.title": "Cargo classification",
  "methodology.cargoClass.body":
    "Combination of AIS shipType (codes 70-89) and a keyword heuristic (name, destination) to assign a class from: crude, product, chemical, LNG, LPG, container, dry-bulk, general-cargo, ro-ro, passenger, fishing, tug, other. Known limitations: a poorly named vessel or one with empty destination falls back to generic shipType. Expected accuracy ~85% on tankers and ~95% on containers.",
  "methodology.voyages.title": "Voyage detection",
  "methodology.voyages.open":
    "Open: a voyage opens when a vessel (of trackable class: tanker / container / bulk / general / RoRo) is observed approaching or anchoring with SOG ≥ 1 kn, after the 60-second grace period following worker startup.",
  "methodology.voyages.arrival":
    "Arrival: transition to state = moored within a berth zone (NavStatus 5 or SOG < 0.3 kn within the berth zone).",
  "methodology.voyages.departure":
    "Departure: after arrival, the vessel transitions back to state = underway and distance > 8 nm from the port center.",
  "methodology.voyages.falsePositives":
    "False positives: tugs, pilots and fishing vessels excluded from tracking — cargo class acts as a filter.",
  "methodology.eta.title": "ETA model",
  "methodology.eta.naive":
    "Naive estimate: distance / SOG where distance is the great circle between current position and port center. Recomputed every 5 minutes per active voyage.",
  "methodology.eta.seasonal":
    "Seasonal correction: median error (predicted − actual) computed over a 90-day rolling window, bucketed by UTC arrival hour. Falls back to the global median if the hour bucket has fewer than 3 samples. Recomputed every 30 min.",
  "methodology.eta.broadcast":
    "Comparison reference: ETA broadcast field extracted from ShipStaticData messages (entered manually by the vessel's crew — often imprecise and late).",
  "methodology.eta.metrics":
    "Metrics: RMSE and MAE in hours, computed over closed voyages with both predicted ETA AND broadcast ETA available. Updated on each closed voyage. Default window: 30 days.",
  "methodology.eta.roadmap":
    "Model roadmap: congestion integration, tides, weather, vessel-specific historical average speed.",
  "methodology.anomalies.title": "Anomaly detection",
  "methodology.anomalies.intro":
    "v1: absolute dwell-at-anchor thresholds, tuned by cargo class.",
  "methodology.anomalies.tanker":
    "Tankers (crude/product/chemical/LNG/LPG): warn ≥ 12h, critical ≥ 48h.",
  "methodology.anomalies.container":
    "Containers: warn ≥ 6h, critical ≥ 24h.",
  "methodology.anomalies.other": "Other: warn ≥ 18h, critical ≥ 72h.",
  "methodology.anomalies.roadmap":
    "Roadmap: thresholds derived from the historical (port, cargo) distribution; route-deviation detection; out-of-zone loitering detection (\"dark fleet\" signal).",
  "methodology.persistence.title": "Persistence & lineage",
  "methodology.persistence.storage":
    "SQLite storage via node:sqlite (built-in Node 22+). Tables: kpi_snapshots, static_ships, positions, voyages, webhook_subscriptions, webhook_deliveries.",
  "methodology.persistence.timestamps":
    "Every kpi_snapshots and voyages row carries the port id and a timestamp. Full reproducibility of any metric at a given instant.",
  "methodology.persistence.snapshot":
    "Position snapshots: 1 entry per minute per vessel (rate limited). Enables backtesting and replayability of the model.",
  "methodology.persistence.export":
    "Roadmap: daily Parquet export to S3 / GCS for clients' data scientists.",
  "methodology.sla.title": "Service commitments (SLA v1)",
  "methodology.sla.uptime": "Platform availability",
  "methodology.sla.uptimeValue": "99.5% / month (MVP)",
  "methodology.sla.latencyLive": "Live positions latency",
  "methodology.sla.latencyLiveValue": "< 30s (P95)",
  "methodology.sla.latencyKpi": "KPIs / voyages latency",
  "methodology.sla.latencyKpiValue": "< 90s (P95)",
  "methodology.sla.webhook": "Webhook delivery",
  "methodology.sla.webhookValue": "1 retry at 60s · 90-day delivery log",
  "methodology.sla.retention": "History retention",
  "methodology.sla.retentionValue":
    "7 days in-memory KPIs · unlimited in SQLite (90-day compaction)",
  "methodology.sla.backfill": "Backfill",
  "methodology.sla.backfillValue":
    "On contractual request (replay of persisted positions)",
  "methodology.compliance.title": "Compliance",
  "methodology.compliance.solas":
    "AIS data: open, transmitted by vessels per the SOLAS convention. No crew personal data.",
  "methodology.compliance.gdpr":
    "GDPR: no personal data processing. MMSIs are vessel identifiers, not personal identifiers.",
  "methodology.compliance.sanctions":
    "Sanctions: the platform does not actively filter vessels under sanctions (US OFAC, UK OFSI, EU). Clients must apply their own lists.",
  "methodology.compliance.legalIntro": "Full details on the",
  "methodology.compliance.legalLabel": "Legal page",

  // /status
  "status.backLink": "← back",
  "status.title": "System status",
  "status.lead":
    "Public availability of Port Flow services. Auto-refreshed every 30 s.",
  "status.loading": "Loading…",
  "status.ais.title": "Terrestrial AIS (aisstream.io)",
  "status.ais.connection": "Connection",
  "status.ais.connectionActive": "active",
  "status.ais.connectionDown": "down",
  "status.ais.lastMessage": "Last message",
  "status.ais.cached": "Vessels in cache",
  "status.ais.received": "Messages received",
  "status.sar.title": "Sentinel-1 SAR scanner",
  "status.sar.enabled": "Enabled",
  "status.sar.yes": "yes",
  "status.sar.no": "no",
  "status.sar.copernicusAuth": "Copernicus auth",
  "status.sar.configured": "configured",
  "status.sar.missing": "missing",
  "status.sar.demoMode": "Demo mode",
  "status.sar.demoOn": "on",
  "status.sar.demoOff": "off",
  "status.sar.lastScan": "Last scan",
  "status.sanctions.title": "Sanctions lists (OFAC + UK OFSI)",
  "status.sanctions.indexed": "Indexed entries",
  "status.sanctions.byImo": "By IMO",
  "status.sanctions.byMmsi": "By MMSI",
  "status.sanctions.lastUpdate": "Last refresh",
  "status.coverage.title": "Port coverage",
  "status.coverage.tracked": "Ports tracked",
  "status.coverage.active": "Active ports (≥1 vessel)",
  "status.coverage.activityRate": "Activity rate",
  "status.accuracy.title": "ETA accuracy — Rotterdam · 30d",
  "status.accuracy.rmsePF": "Port Flow RMSE",
  "status.accuracy.rmseBroadcast": "Broadcast RMSE",
  "status.accuracy.advantage": "Advantage",
  "status.accuracy.closedVoyages": "Closed voyages",
  "status.accuracy.beats":
    "More accurate than the broadcast ETA declared by carriers",
  "status.accuracy.behind": "Less accurate — model still learning",

  // /guide
  "guide.backLink": "← back to dashboard",
  "guide.methodologyLink": "Methodology →",
  "guide.title": "User guide",
  "guide.lead":
    "Port Flow gives a real-time view of maritime flows across 51 strategic ports (ARA, bunkering, LNG export). This page explains how to read the dashboard, who benefits, and how to integrate the data into your pipelines.",
  "guide.audience.title": "Who it's for",
  "guide.audience.traders":
    "Commodity traders (oil, LNG, chemicals) — accurate ETAs and congestion indices feed pricing models. The platform's primary target.",
  "guide.audience.forwarders":
    "Freight forwarders — early warning on demurrage exposure, routing decisions.",
  "guide.audience.insurers":
    "Marine insurers — anomaly detection (loitering, abnormal dwell), risk pricing.",
  "guide.audience.quants":
    "Data scientists / quants — historical feed for macro strategy backtesting (port activity = economic proxy).",
  "guide.dashboard.title": "Read the dashboard in 30 seconds",
  "guide.dashboard.portSelector":
    "Port selector top-right — switch the observed port. The native name shows in parentheses when the active language differs (e.g. Antwerp (Antwerpen), Hamburg, الفجيرة).",
  "guide.dashboard.langSelector":
    "Language selector next to it — 8 business languages: FR, EN, NL, DE, ES, AR (with auto RTL), ZH, JA.",
  "guide.dashboard.toggle":
    "All / Tankers toggle — instantly filters the map and counters to the 5 tanker sub-classes (crude, product, chemical, LNG, LPG).",
  "guide.dashboard.kpis":
    "KPI row — total vessels, stationary (congestion proxy), underway, moored, inbound/h, active voyages tracked.",
  "guide.dashboard.map":
    "Map — color = AIS category, size = state. Dashed rectangles are named zones (anchorage, berth, channel).",
  "guide.dashboard.voyages":
    "Active voyages — table sorted by predicted ETA. The \"broadcast ETA\" column is what the crew entered; compare against the model's deltas.",
  "guide.dashboard.precision":
    "ETA precision — our model's RMSE vs the broadcast ETA's RMSE. This is the main quality indicator.",
  "guide.dashboard.anomalies":
    "Anomalies — vessels at anchor abnormally long for their class. Critical to monitor for congestion or operational oddities.",
  "guide.dashboard.flow":
    "6-hour flow — inbound / outbound / stationary over the last 6 hours. Short-term trend.",
  "guide.precision.title": "ETA precision page",
  "guide.precision.body":
    "Accessible via the ETA precision button or /precision. Public view aimed at demonstrating model quality to prospects. Three key indicators: model RMSE, broadcast RMSE, % gap. List of the 50 most recent closed voyages with error in hours (green < 1h, amber < 3h, red beyond). Methodology at the bottom. 7/30/90-day window filter.",
  "guide.api.title": "API integration",
  "guide.api.intro": "Public API at /api/v1, authenticated via bearer token. OpenAPI spec at",
  "guide.api.endpoints":
    "Available endpoints: /ports, /ports/{id}/snapshot, /ports/{id}/vessels, /ports/{id}/voyages/active, /ports/{id}/voyages/closed, /ports/{id}/anomalies, /webhooks.",
  "guide.webhooks.title": "Webhooks (alerts)",
  "guide.webhooks.intro":
    "Subscribe to an event to receive an HMAC-SHA256-signed POST when a threshold is crossed.",
  "guide.webhooks.headers":
    "Headers on every delivery: X-Port-Flow-Event and X-Port-Flow-Signature: t=<ts>,v1=<hex> (HMAC-SHA256 of the timestamp-prefixed payload). Receiver-side verification: hmac_sha256(secret, \"{ts}.{body}\").",
  "guide.webhooks.events":
    "Supported events: congestion.threshold / congestion.cleared, anomaly.detected, voyage.arrived.",
  "guide.limits.title": "Known limitations",
  "guide.limits.coverage":
    "AIS coverage is weak in the Mediterranean and Persian Gulf with aisstream.io (community network). Algeciras, Fujairah, Ras Laffan often show few or no vessels in v1. Fix: switch to a commercial provider (Spire, Orbcomm) — on the roadmap.",
  "guide.limits.classification":
    "Cargo classification at ~85% (tankers) / ~95% (containers). False positives on unnamed vessels.",
  "guide.limits.grace":
    "On worker startup, a 60-second grace period prevents already-present vessels from counting as \"inbound\". Inbound/h KPIs naturally calibrate afterwards.",
  "guide.limits.eta":
    "ETA model v2 (distance/SOG + seasonal correction + congestion + weather). Beats the broadcast ETA on voyages > 6h; less of an edge on short voyages.",
  "guide.limits.sanctions":
    "Built-in sanctions filtering (OFAC + UK OFSI) on Professional+. Customers can also apply their own lists via the API.",
  "guide.checklist.title": "Deployment checklist",
  "guide.checklist.s1": "Create an",
  "guide.checklist.s2":
    "cp .env.example .env.local, fill in AISSTREAM_API_KEY and PORT_API_TOKENS.",
  "guide.checklist.s3": "npm install && npm run dev.",
  "guide.checklist.s4":
    "Check the AIS Live banner top-right (green = stream incoming).",
  "guide.checklist.s5":
    "Wait 60s + a few minutes for voyages to start opening (depending on traffic).",
  "guide.checklist.s6":
    "The /precision page will show numbers after the first closed voyages (predicted ETA + actual arrival).",

  // /legal
  "legal.backLink": "← back",
  "legal.methodologyLink": "Methodology →",
  "legal.title": "Legal notices",
  "legal.lead":
    "This page consolidates data attributions, terms of use, privacy, compliance and limitations. It is linked from the footer of every page.",
  "legal.maritime.title": "Maritime notice",
  "legal.maritime.notForNav": "Not for navigation.",
  "legal.maritime.body":
    "The positions, ETAs, anomalies and indicators published by Port Flow are derived from public AIS signals and from weather and satellite imagery data. They may contain errors, delays and omissions. This platform does not replace any certified navigation system or operational pilot station. Use for maritime safety, pilotage or critical operational decisions is explicitly excluded.",
  "legal.tos.title": "Terms of use",
  "legal.tos.b1":
    "Platform provided \"as is\", without warranty of availability, accuracy or fitness for any particular purpose.",
  "legal.tos.b2.intro": "Service commitments detailed on the",
  "legal.tos.b2.linkLabel": "methodology page",
  "legal.tos.b2.outro": " (SLA v1).",
  "legal.tos.b3":
    "Displayed data may be derived and transformed. The platform is not a reseller of raw AIS data.",
  "legal.tos.b4":
    "Any commercial use requires compliance with the source providers' terms (in particular Spire / MarineTraffic / Orbcomm subscriptions if enabled).",
  "legal.privacy.title": "Privacy policy (GDPR)",
  "legal.privacy.controller": "Data controller:",
  "legal.privacy.contactPrefix": "Port Flow — contact:",
  "legal.privacy.intro":
    "This section describes the personal data collected, its purposes and the user's rights pursuant to GDPR (EU) 2016/679. For EU customers, a signable DPA is available on request at privacy@portflow.uk.",
  "legal.privacy.dpaBold": "signable DPA",
  "legal.privacy.dataTitle": "Data collected and purposes",
  "legal.privacy.col.data": "Data",
  "legal.privacy.col.purpose": "Purpose",
  "legal.privacy.col.basis": "Legal basis",
  "legal.privacy.col.retention": "Retention",
  "legal.privacy.row1.data": "Email + Clerk identifier",
  "legal.privacy.row1.purpose": "Authentication, support",
  "legal.privacy.row1.basis": "Contract performance",
  "legal.privacy.row1.retention": "While account active + 12 months",
  "legal.privacy.row2.data": "Stripe customer ID + payment history",
  "legal.privacy.row2.purpose": "Billing, subscription",
  "legal.privacy.row2.basis": "Contract performance",
  "legal.privacy.row2.retention": "10 years (accounting requirement)",
  "legal.privacy.row3.data":
    "Slack/Discord/Telegram webhook URLs, alert emails",
  "legal.privacy.row3.purpose": "Sending alerts you configure",
  "legal.privacy.row3.basis": "Explicit consent (UI input)",
  "legal.privacy.row3.retention": "Until removed by user",
  "legal.privacy.row4.data":
    "Third-party API keys (Spire/VIIRS/Orbcomm) encrypted AES-256-GCM",
  "legal.privacy.row4.purpose": "BYO key integration",
  "legal.privacy.row4.basis": "Explicit consent (UI input)",
  "legal.privacy.row4.retention": "Until removed by user",
  "legal.privacy.row5.data": "Watchlist (vessel MMSIs, port IDs)",
  "legal.privacy.row5.purpose": "Dashboard personalization",
  "legal.privacy.row5.basis": "Contract performance",
  "legal.privacy.row5.retention": "While account active",
  "legal.privacy.row6.data": "API logs (timestamp, key prefix, endpoint)",
  "legal.privacy.row6.purpose": "Audit, security, anti-abuse",
  "legal.privacy.row6.basis": "Legitimate interest",
  "legal.privacy.row6.retention": "90 days rolling",
  "legal.privacy.subTitle": "Sub-processors",
  "legal.privacy.sub.clerk":
    "Clerk Inc. (US) — user authentication · clerk.com (DPA available)",
  "legal.privacy.sub.stripe":
    "Stripe Inc. (US) — billing · stripe.com (DPA + SCCs available)",
  "legal.privacy.sub.do":
    "DigitalOcean LLC (Frankfurt EU region) — hosting · digitalocean.com (DPA)",
  "legal.privacy.sub.cloudflare":
    "Cloudflare Inc. (US) — DNS + DDoS · cloudflare.com (DPA + SCCs)",
  "legal.privacy.sub.resend":
    "Resend Inc. (US) — alert email delivery (when enabled) · resend.com (DPA)",
  "legal.privacy.sub.aisstream":
    "aisstream.io — public AIS feed (no user personal data transmitted)",
  "legal.privacy.sub.copernicus":
    "Copernicus Data Space (ESA) — Sentinel-1 satellite imagery (public)",
  "legal.privacy.transfersTitle": "Non-EU transfers",
  "legal.privacy.transfersBody":
    "Clerk, Stripe, Cloudflare and Resend operate from the US. All have EU-US Standard Contractual Clauses (SCCs) in place. AIS and port data (public by nature) do not constitute transferred personal data.",
  "legal.privacy.rightsTitle": "Your rights",
  "legal.privacy.rights.access":
    "Access, rectification — everything is visible in /account, editable directly",
  "legal.privacy.rights.delete":
    "Erasure — delete your account via Clerk (cascade to API keys + watchlist + alerts)",
  "legal.privacy.rights.portability":
    "Portability — CSV export of your watchlist/fleet from /fleet (Starter+)",
  "legal.privacy.rights.opt":
    "Objection, withdrawal of consent — disable alerts or remove keys at any time in /account and /sources",
  "legal.privacy.rights.complaint":
    "Complaint — to the CNIL (France) or any European supervisory authority",
  "legal.privacy.securityTitle": "Technical security",
  "legal.privacy.security.tls":
    "HTTPS TLS 1.3 mandatory (Let's Encrypt). HTTP redirected.",
  "legal.privacy.security.encryption":
    "At-rest encryption of user secrets (third-party API keys): AES-256-GCM with server master key",
  "legal.privacy.security.passwords":
    "Passwords managed by Clerk (PBKDF2/Argon2id, never plaintext)",
  "legal.privacy.security.audit":
    "Auditable logs (audit_log table) on subscription changes and API access",
  "legal.privacy.security.mmsi":
    "Displayed MMSIs = vessel identifiers, assigned by ITU to the flag — not personal identifiers",
  "legal.privacy.security.cookies":
    "No third-party analytics cookies. The only local storage is the browser tab-resilience cache, purgeable.",
  "legal.dpa.title": "Data Processing Agreement (DPA) — summary",
  "legal.dpa.intro":
    "For any EU professional customer using Port Flow to process data as part of a B2B activity, a DPA compliant with GDPR Article 28 is provided.",
  "legal.dpa.role":
    "Port Flow acts as a processor for data processed as part of the service (watchlist, alerts, API keys)",
  "legal.dpa.noSecondary":
    "No secondary processing: no advertising, no resale, no commercial profiling",
  "legal.dpa.breach": "Notification of any data breach within 72 hours",
  "legal.dpa.audits":
    "Cooperation with the customer's annual audits (with 30-day notice)",
  "legal.dpa.endOfContract":
    "Deletion or return of data at end of contract (CSV export + DB purge on request)",
  "legal.dpa.subList":
    "Sub-processor list above, modifiable with 30-day notice",
  "legal.dpa.outro": "DPA signed on request at",
  "legal.dpa.outroSuffix": " — typical lead time 48 business hours.",
  "legal.sanctions.title": "Sanctions & compliance",
  "legal.sanctions.b1":
    "The platform does not apply OFAC, OFSI, EU or UN filters on displayed vessels. Sanctioned operators may appear like any other vessel.",
  "legal.sanctions.b2":
    "It is the customer's responsibility (trader, insurer, freight forwarder) to apply their own lists and screening procedures.",
  "legal.sanctions.b3":
    "The platform is neutral: no vessel is hidden or flagged on political or commercial criteria.",
  "legal.citation.title": "Academic citation",
  "legal.citation.body":
    "If you cite Port Flow in a publication, please include:",

  // /sources
  "sources.backLink": "← back",
  "sources.methodologyLink": "Methodology →",
  "sources.title": "Data sources",
  "sources.lead":
    "Multi-source mix: real-time terrestrial AIS + SAR radar (free, ~6-day revisit) + ready-to-go connectors for paid S-AIS providers.",
  "sources.howRead.title": "How to read this page:",
  "sources.howRead.activeBadge": "Active",
  "sources.howRead.activeDesc":
    "= the source is configured by the operator and feeds the dashboard for all users.",
  "sources.howRead.byoBadge": "your key",
  "sources.howRead.byoDesc": "= you've plugged in your own (Pro+).",
  "sources.howRead.view": "Viewing data in the dashboard",
  "sources.howRead.viewDesc":
    "is free (limited to the ports in your plan).",
  "sources.howRead.api": "Accessing via API",
  "sources.howRead.apiDesc": "requires the Starter+ plan.",
  "sources.howRead.byoOwn": "Bringing your own key (BYO)",
  "sources.howRead.byoOwnDesc":
    "for Spire / VIIRS / Orbcomm is Pro+ only.",
  "sources.tier.aisTerrestrial": "Terrestrial AIS",
  "sources.tier.aisSatellite": "Satellite AIS",
  "sources.tier.sar": "SAR radar",
  "sources.tier.opticalNight": "Night optical",
  "sources.tariff.free": "Free",
  "sources.tariff.freeWithKey": "Free + key",
  "sources.tariff.paid": "Paid",
  "sources.integration.live": "Live integration",
  "sources.integration.inProgress": "Integration in progress",
  "sources.integration.planned": "Integration planned",
  "sources.integration.etaTitle": "Activation ETA: {eta}",
  "sources.status.active": "Active",
  "sources.status.configured": "Configured",
  "sources.status.inactive": "Inactive",
  "sources.status.syncPrefix": "sync:",
  "sources.access.allPorts":
    "{tier} plan: visible on all 51 ports{apiNote}.",
  "sources.access.partial":
    "{tier} plan: visible on {count}/{max} favorite port{plural}{apiNote}.",
  "sources.access.partialNoMax":
    "{tier} plan: visible on {count} favorite port{plural}{apiNote}.",
  "sources.access.emptyMax":
    "{tier} plan: pick up to {max} favorite ports (★ in the port selector) to activate tracking.",
  "sources.access.empty":
    "{tier} plan: pick your favorite ports (★ in the selector) to activate tracking.",
  "sources.access.apiYes": " · API included",
  "sources.access.apiNo": " · API not included",
  "sources.scenesApi": "scenes API",
  "sources.fixesApi": "fixes API",
  "sources.byo.providedByOp": "provided by operator",
  "sources.byo.yourKey": "your key",
  "sources.byo.addKey": "+ Paste my key",
  "sources.byo.placeholder": "Paste your key here",
  "sources.byo.test": "Test",
  "sources.recommendation.title": "Recommended mix",
  "sources.recommendation.demo":
    "Free demo: aisstream.io (live) + Sentinel-1 (weekly ground truth) — covers EU/US well.",
  "sources.recommendation.production":
    "Trader production: add Spire (geofenced on critical chokepoints: Hormuz, Singapore, Bab el-Mandeb) to fill the Persian Gulf gap.",
  "sources.recommendation.redundancy":
    "Operational redundancy: MarineTraffic or Orbcomm as fallback — different satellite constellations, automatic failover if one source drops.",
  "sources.recommendation.darkFleet":
    "Dark-fleet detection: VIIRS (nighttime lights) catches AIS-off vessels — valuable for insurers and sanctions.",
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
  "pricing.tier.starter.price": "€129",
  "pricing.tier.starter.period": "/ maand",
  "pricing.tier.starter.features":
    "15 havens|Openbare API, 5k req/dag|Slack/Telegram/Email/Discord-meldingen|CSV-export|30 dagen historie|25 schepen in watchlist",
  "pricing.tier.starter.cta": "Kies Starter",
  "pricing.tier.professional.name": "Professional",
  "pricing.tier.professional.price": "€199",
  "pricing.tier.professional.period": "/ maand",
  "pricing.tier.professional.features":
    "30 strategische havens|API 18k req/uur|OFAC + UK OFSI sanctie-screening|Multi-channel meldingen|Demurrage-risk score|CSV-export|60 dagen historie|100 schepen in watchlist",
  "pricing.tier.professional.cta": "Kies Professional",
  "pricing.tier.pro.name": "Pro+",
  "pricing.tier.pro.price": "€499",
  "pricing.tier.pro.period": "/ maand",
  "pricing.tier.pro.features":
    "Alle 51 havens|API 600 req/min|Gedetailleerde ETA-precisie + vertragingsattributie|AIS + SAR Sentinel-1 fusie|Detectie donkere vloot|Sancties OFAC + UK OFSI screening|CO2-emissies per reis|90 dagen historie|250 schepen in watchlist",
  "pricing.tier.pro.cta": "Kies Pro+",
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

  // /fleet
  "fleet.title": "Mijn vloot",
  "fleet.subtitle":
    "Multi-haven overzicht van je gevolgde schepen. Live positie, lopende reis, laatste activiteit.",
  "fleet.empty.title": "Geen gevolgde schepen",
  "fleet.empty.lead":
    "Bewaar een schip vanuit het dashboard om het hier te volgen.",
  "fleet.empty.cta": "Open dashboard",
  "fleet.col.vessel": "Schip",
  "fleet.col.cargo": "Lading",
  "fleet.col.currentPort": "Huidige haven",
  "fleet.col.voyage": "Actieve reis",
  "fleet.col.eta": "Voorspelde ETA",
  "fleet.col.last": "Laatste activiteit",
  "fleet.col.actions": "",
  "fleet.state.open": "nadering {port}",
  "fleet.state.atPort": "in {port}",
  "fleet.state.atSea": "op zee",
  "fleet.state.unknown": "—",
  "fleet.last.arrival": "{port} {h}u geleden",
  "fleet.last.none": "—",
  "fleet.action.remove": "Verwijderen",
  "fleet.action.dashboard": "Bekijk",
  "fleet.refresh": "Elke 60s vernieuwd",
  "fleet.signIn": "Log in om je vloot te zien",
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
  "pricing.tier.starter.price": "129 €",
  "pricing.tier.starter.period": "/ Monat",
  "pricing.tier.starter.features":
    "15 Häfen|Öffentliche API, 5k Req/Tag|Slack/Telegram/E-Mail/Discord-Benachrichtigungen|CSV-Export|30 Tage Historie|25 Schiffe in der Watchlist",
  "pricing.tier.starter.cta": "Starter wählen",
  "pricing.tier.professional.name": "Professional",
  "pricing.tier.professional.price": "199 €",
  "pricing.tier.professional.period": "/ Monat",
  "pricing.tier.professional.features":
    "30 strategische Häfen|API 18k Req/Stunde|OFAC + UK OFSI Sanktions-Screening|Multi-Channel-Benachrichtigungen|Demurrage-Risk-Score|CSV-Export|60 Tage Historie|100 Schiffe in der Watchlist",
  "pricing.tier.professional.cta": "Professional wählen",
  "pricing.tier.pro.name": "Pro+",
  "pricing.tier.pro.price": "499 €",
  "pricing.tier.pro.period": "/ Monat",
  "pricing.tier.pro.features":
    "Alle 51 Häfen|API 600 Req/Min|Detaillierte ETA-Genauigkeit + Verzögerungs-Attribution|AIS + SAR Sentinel-1 Fusion|Dark-Fleet-Erkennung|OFAC + UK OFSI Sanktions-Screening|CO2-Emissionen pro Reise|90 Tage Historie|250 Schiffe in der Watchlist",
  "pricing.tier.pro.cta": "Pro+ wählen",
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

  // /fleet
  "fleet.title": "Meine Flotte",
  "fleet.subtitle":
    "Hafenübergreifende Sicht auf Ihre verfolgten Schiffe. Live-Position, aktuelle Reise, letzte Aktivität.",
  "fleet.empty.title": "Keine verfolgten Schiffe",
  "fleet.empty.lead":
    "Markieren Sie ein Schiff im Dashboard, um es hier zu verfolgen.",
  "fleet.empty.cta": "Dashboard öffnen",
  "fleet.col.vessel": "Schiff",
  "fleet.col.cargo": "Ladung",
  "fleet.col.currentPort": "Aktueller Hafen",
  "fleet.col.voyage": "Aktive Reise",
  "fleet.col.eta": "Vorhergesagte ETA",
  "fleet.col.last": "Letzte Aktivität",
  "fleet.col.actions": "",
  "fleet.state.open": "Anlauf {port}",
  "fleet.state.atPort": "in {port}",
  "fleet.state.atSea": "auf See",
  "fleet.state.unknown": "—",
  "fleet.last.arrival": "{port} vor {h}h",
  "fleet.last.none": "—",
  "fleet.action.remove": "Entfernen",
  "fleet.action.dashboard": "Anzeigen",
  "fleet.refresh": "Alle 60s aktualisiert",
  "fleet.signIn": "Anmelden, um Ihre Flotte zu sehen",
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
  "pricing.tier.starter.price": "129 €",
  "pricing.tier.starter.period": "/ mes",
  "pricing.tier.starter.features":
    "15 puertos|API pública 5k req/día|Alertas Slack/Telegram/Email/Discord|Exportación CSV|30 días de historial|25 buques en watchlist",
  "pricing.tier.starter.cta": "Elegir Starter",
  "pricing.tier.professional.name": "Professional",
  "pricing.tier.professional.price": "199 €",
  "pricing.tier.professional.period": "/ mes",
  "pricing.tier.professional.features":
    "30 puertos estratégicos|API 18k req/hora|Screening sanciones OFAC + UK OFSI|Alertas multicanal|Score de riesgo demurrage|Exportación CSV|60 días de historial|100 buques en watchlist",
  "pricing.tier.professional.cta": "Elegir Professional",
  "pricing.tier.pro.name": "Pro+",
  "pricing.tier.pro.price": "499 €",
  "pricing.tier.pro.period": "/ mes",
  "pricing.tier.pro.features":
    "Los 51 puertos|API 600 req/min|Precisión ETA detallada + atribución de retrasos|Fusión AIS + SAR Sentinel-1|Detección de flota oscura|Screening OFAC + UK OFSI|Emisiones CO2 por travesía|90 días de historial|250 buques en watchlist",
  "pricing.tier.pro.cta": "Elegir Pro+",
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

  // /fleet
  "fleet.title": "Mi flota",
  "fleet.subtitle":
    "Vista multi-puerto de tus buques seguidos. Posición en vivo, travesía activa, última actividad.",
  "fleet.empty.title": "Sin buques seguidos",
  "fleet.empty.lead":
    "Marca un buque en el panel para seguirlo aquí.",
  "fleet.empty.cta": "Abrir panel",
  "fleet.col.vessel": "Buque",
  "fleet.col.cargo": "Carga",
  "fleet.col.currentPort": "Puerto actual",
  "fleet.col.voyage": "Travesía activa",
  "fleet.col.eta": "ETA predicha",
  "fleet.col.last": "Última actividad",
  "fleet.col.actions": "",
  "fleet.state.open": "aproximación {port}",
  "fleet.state.atPort": "en {port}",
  "fleet.state.atSea": "en mar",
  "fleet.state.unknown": "—",
  "fleet.last.arrival": "{port} hace {h}h",
  "fleet.last.none": "—",
  "fleet.action.remove": "Quitar",
  "fleet.action.dashboard": "Ver",
  "fleet.refresh": "Actualizado cada 60s",
  "fleet.signIn": "Inicia sesión para ver tu flota",
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
  "pricing.tier.starter.price": "129 €",
  "pricing.tier.starter.period": "/ شهر",
  "pricing.tier.starter.features":
    "15 ميناء|API عامة 5 آلاف طلب/يوم|تنبيهات Slack/Telegram/البريد/Discord|تصدير CSV|تاريخ 30 يوماً|25 سفينة في قائمة المراقبة",
  "pricing.tier.starter.cta": "اختر Starter",
  "pricing.tier.professional.name": "Professional",
  "pricing.tier.professional.price": "199 €",
  "pricing.tier.professional.period": "/ شهر",
  "pricing.tier.professional.features":
    "30 ميناء استراتيجي|API 18 ألف طلب/ساعة|فحص عقوبات OFAC + UK OFSI|تنبيهات متعددة القنوات|درجة مخاطر الديموراج|تصدير CSV|تاريخ 60 يوماً|100 سفينة في قائمة المراقبة",
  "pricing.tier.professional.cta": "اختر Professional",
  "pricing.tier.pro.name": "Pro+",
  "pricing.tier.pro.price": "499 €",
  "pricing.tier.pro.period": "/ شهر",
  "pricing.tier.pro.features":
    "جميع الموانئ الـ 51|API 600 طلب/دقيقة|دقة ETA تفصيلية + توزيع التأخيرات|دمج AIS + SAR Sentinel-1|كشف الأسطول المظلم|فحص عقوبات OFAC + UK OFSI|انبعاثات CO2 لكل رحلة|تاريخ 90 يوماً|250 سفينة في قائمة المراقبة",
  "pricing.tier.pro.cta": "اختر Pro+",
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

  // /fleet
  "fleet.title": "أسطولي",
  "fleet.subtitle":
    "عرض متعدد الموانئ لسفنك المتابَعة. الموقع المباشر، الرحلة النشطة، آخر نشاط.",
  "fleet.empty.title": "لا توجد سفن متابَعة",
  "fleet.empty.lead":
    "أضف سفينة إلى المفضلة من اللوحة لمتابعتها هنا.",
  "fleet.empty.cta": "فتح اللوحة",
  "fleet.col.vessel": "السفينة",
  "fleet.col.cargo": "الحمولة",
  "fleet.col.currentPort": "الميناء الحالي",
  "fleet.col.voyage": "رحلة نشطة",
  "fleet.col.eta": "ETA المتوقع",
  "fleet.col.last": "آخر نشاط",
  "fleet.col.actions": "",
  "fleet.state.open": "اقتراب من {port}",
  "fleet.state.atPort": "في {port}",
  "fleet.state.atSea": "في البحر",
  "fleet.state.unknown": "—",
  "fleet.last.arrival": "{port} قبل {h} ساعة",
  "fleet.last.none": "—",
  "fleet.action.remove": "إزالة",
  "fleet.action.dashboard": "عرض",
  "fleet.refresh": "يُحدَّث كل 60 ث",
  "fleet.signIn": "سجّل الدخول لرؤية أسطولك",
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
  "pricing.tier.starter.price": "€129",
  "pricing.tier.starter.period": "/ 月",
  "pricing.tier.starter.features":
    "15 个港口|公共 API 5k 次/天|Slack/Telegram/邮件/Discord 警报|CSV 导出|30 天历史|25 艘船监视列表",
  "pricing.tier.starter.cta": "选择 Starter",
  "pricing.tier.professional.name": "Professional",
  "pricing.tier.professional.price": "€199",
  "pricing.tier.professional.period": "/ 月",
  "pricing.tier.professional.features":
    "30 个战略港口|API 18k 次/小时|OFAC + UK OFSI 制裁筛查|多渠道警报|滞期费风险评分|CSV 导出|60 天历史|100 艘船监视列表",
  "pricing.tier.professional.cta": "选择 Professional",
  "pricing.tier.pro.name": "Pro+",
  "pricing.tier.pro.price": "€499",
  "pricing.tier.pro.period": "/ 月",
  "pricing.tier.pro.features":
    "全部 51 个港口|API 600 次/分|详细 ETA 精度 + 延误归因|AIS + SAR Sentinel-1 融合|暗船队检测|OFAC + UK OFSI 制裁筛查|每次航行 CO2 排放|90 天历史|250 艘船监视列表",
  "pricing.tier.pro.cta": "选择 Pro+",
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

  // /fleet
  "fleet.title": "我的船队",
  "fleet.subtitle":
    "跨港口的跟踪船舶视图。实时位置、活跃航次、最近活动。",
  "fleet.empty.title": "暂无跟踪船舶",
  "fleet.empty.lead": "在仪表板收藏船舶后,即可在此跟踪。",
  "fleet.empty.cta": "打开仪表板",
  "fleet.col.vessel": "船舶",
  "fleet.col.cargo": "货物",
  "fleet.col.currentPort": "当前港口",
  "fleet.col.voyage": "活跃航次",
  "fleet.col.eta": "预测 ETA",
  "fleet.col.last": "最近活动",
  "fleet.col.actions": "",
  "fleet.state.open": "接近 {port}",
  "fleet.state.atPort": "在 {port}",
  "fleet.state.atSea": "海上",
  "fleet.state.unknown": "—",
  "fleet.last.arrival": "{port} {h} 小时前",
  "fleet.last.none": "—",
  "fleet.action.remove": "移除",
  "fleet.action.dashboard": "查看",
  "fleet.refresh": "每 60 秒刷新",
  "fleet.signIn": "登录以查看您的船队",
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
  "pricing.tier.starter.price": "€129",
  "pricing.tier.starter.period": "/ 月",
  "pricing.tier.starter.features":
    "15 港|公開 API 5k リクエスト/日|Slack/Telegram/メール/Discord アラート|CSV エクスポート|30 日履歴|ウォッチリストに 25 隻",
  "pricing.tier.starter.cta": "Starter を選択",
  "pricing.tier.professional.name": "Professional",
  "pricing.tier.professional.price": "€199",
  "pricing.tier.professional.period": "/ 月",
  "pricing.tier.professional.features":
    "30 戦略港|API 18k リクエスト/時|OFAC + UK OFSI 制裁スクリーニング|マルチチャネルアラート|デマレッジリスクスコア|CSV エクスポート|60 日履歴|ウォッチリストに 100 隻",
  "pricing.tier.professional.cta": "Professional を選択",
  "pricing.tier.pro.name": "Pro+",
  "pricing.tier.pro.price": "€499",
  "pricing.tier.pro.period": "/ 月",
  "pricing.tier.pro.features":
    "全 51 港|API 600 リクエスト/分|詳細 ETA 精度 + 遅延要因分析|AIS + SAR Sentinel-1 融合|ダークフリート検出|OFAC + UK OFSI 制裁スクリーニング|航海ごとの CO2 排出量|90 日履歴|ウォッチリストに 250 隻",
  "pricing.tier.pro.cta": "Pro+ を選択",
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

  // /fleet
  "fleet.title": "マイフリート",
  "fleet.subtitle":
    "追跡中の船舶を港横断で表示。ライブ位置、進行中の航海、最終活動。",
  "fleet.empty.title": "追跡中の船舶なし",
  "fleet.empty.lead":
    "ダッシュボードで船舶をブックマークしてここで追跡。",
  "fleet.empty.cta": "ダッシュボードを開く",
  "fleet.col.vessel": "船舶",
  "fleet.col.cargo": "貨物",
  "fleet.col.currentPort": "現在の港",
  "fleet.col.voyage": "進行中の航海",
  "fleet.col.eta": "予測 ETA",
  "fleet.col.last": "最終活動",
  "fleet.col.actions": "",
  "fleet.state.open": "{port} に接近中",
  "fleet.state.atPort": "{port} に在港",
  "fleet.state.atSea": "海上",
  "fleet.state.unknown": "—",
  "fleet.last.arrival": "{port} {h} 時間前",
  "fleet.last.none": "—",
  "fleet.action.remove": "削除",
  "fleet.action.dashboard": "表示",
  "fleet.refresh": "60 秒ごとに更新",
  "fleet.signIn": "ログインしてフリートを表示",
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
