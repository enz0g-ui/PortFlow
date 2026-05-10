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
    "Réservé aux {max} premiers clients. Code {code} — encore {remaining}/{max} places. À coller dans Stripe Checkout (champ « Code promo »).",
  "pricing.founder.bodyUnlimited":
    "Code {code} appliqué dans Stripe Checkout (champ « Code promo ») — réduction {percent}% à vie.",
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

  // Dark fleet events panel
  "darkEvents.title": "Dark fleet — coupures AIS suspectes",
  "darkEvents.count": "événement(s)",
  "darkEvents.open": "ouvert(s)",
  "darkEvents.empty":
    "Aucun événement dark fleet sur la fenêtre. Algorithme : silence AIS ≥ 12 h en mer (dérivé de Welch et al. 2022).",
  "darkEvents.statusOpen": "ouvert",
  "darkEvents.silenceFrom": "Silence AIS depuis {age}",
  "darkEvents.tooltipClick": "clic pour centrer la carte",

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
    "Sanctions : la plateforme rapproche automatiquement les navires de quatre listes officielles (UKSL, OFAC, UN-SC, EU) — voir la section dédiée plus haut. Le client peut superposer ses propres listes propriétaires via webhooks ou export.",
  // ─── New sections (sanctions screening / chokepoints / emissions) ───
  "methodology.sanctionsScreening.title":
    "Sanctions screening — couverture multi-régime",
  "methodology.sanctionsScreening.intro":
    "Les navires sont rapprochés de quatre listes officielles, mises à jour quotidiennement et réconciliées sur IMO/MMSI :",
  "methodology.sanctionsScreening.uksl":
    "UK Sanctions List (UKSL) — FCDO, Open Government Licence v3.0. ~600 navires (Russie, Iran). Source autoritative depuis le retrait de l'OFSI Consolidated List le 28 janvier 2026.",
  "methodology.sanctionsScreening.ofac":
    "OFAC SDN — US Treasury, domaine public (17 USC §105). ~1 500 navires. Plus large couverture mondiale, principalement Iran / Russie / Venezuela / Cuba / Corée du Nord.",
  "methodology.sanctionsScreening.un":
    "UN Security Council Consolidated List — information publique ONU, libre réutilisation. Coverage RPDC, Libye, Iran historique.",
  "methodology.sanctionsScreening.eu":
    "EU Consolidated FSF — Commission européenne, EC Reuse Decision 2011/833/EU. Russie post-2022 shadow fleet, Belarus, Syrie. Activé sur configuration (jeton EU webgate requis).",
  "methodology.sanctionsScreening.note":
    "Match sur IMO 7 chiffres en priorité (autoritatif), MMSI en fallback. Indicateur visuel rouge sur la carte et badge 🚫 dans les listes voyages.",
  "methodology.chokepoints.title":
    "Détection de transit aux chokepoints maritimes",
  "methodology.chokepoints.intro":
    "12 zones suivies en continu : Suez, Hormuz, Bab el-Mandeb, Malacca, Singapour, Bosphore-Dardanelles, Gibraltar, Skagerrak-Kattegat, Détroit du Pas-de-Calais, Panama, Cap de Bonne-Espérance, Magellan.",
  "methodology.chokepoints.detection":
    "Détection point-in-bbox toutes les 5 minutes sur la fenêtre glissante des 10 dernières minutes de positions AIS reçues.",
  "methodology.chokepoints.dedup":
    "Dédup par cooldown 6 h pour absorber le jitter GPS sans doubler les transits.",
  "methodology.chokepoints.snapshot":
    "Snapshot de l'état sanctionné au moment de l'entrée — un navire radié ultérieurement reste forensiquement marqué pour ce transit-là.",
  "methodology.chokepoints.alertPrefix": "Alerte composable",
  "methodology.chokepoints.alertSuffix":
    ": déclenchée au moment exact où un navire sous sanctions entre dans une de ces zones.",
  "methodology.emissions.title":
    "Estimation des émissions CO₂ — méthode in-house",
  "methodology.emissions.intro":
    "Approche bottom-up dérivée de l'IMO Fourth GHG Study (2020), intégrée sur le flux AIS sans dépendance externe. Pour chaque paire de positions consécutives :",
  "methodology.emissions.power":
    "Puissance installée et vitesse de service par défaut tirées des tables IMO Annex 1, par classe de cargaison (tanker / container / LNG / vrac …).",
  "methodology.emissions.skip":
    "Pas de comptage des paires en gap >6 h ou à vitesse <0.5 kn (navire à quai ou ancré — la consommation auxiliaire stationnaire n'est pas modélisée en v1).",
  "methodology.emissions.precision":
    "Précision indicative ±25 % — suffisant pour ranking flotte, comparaison voyages, dépistage chartering. Pour reporting réglementaire, croiser avec EU MRV (à venir).",
  "methodology.emissions.endpointPrefix": "Endpoint",
  "methodology.emissions.endpointMid": "(par navire) et",
  "methodology.emissions.endpointSuffix": "(agrégat watchlist utilisateur).",
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
    "First {max} customers only. Code {code} — {remaining}/{max} slots left. Paste it in Stripe Checkout (\"Promo code\" field).",
  "pricing.founder.bodyUnlimited":
    "Code {code} applied in Stripe Checkout (\"Promo code\" field) — {percent}% lifetime discount.",
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

  // Dark fleet events panel
  "darkEvents.title": "Dark fleet — suspicious AIS gaps",
  "darkEvents.count": "event(s)",
  "darkEvents.open": "open",
  "darkEvents.empty":
    "No dark-fleet events in window. Algorithm: AIS silence ≥ 12h while underway (derived from Welch et al. 2022).",
  "darkEvents.statusOpen": "open",
  "darkEvents.silenceFrom": "AIS silent for {age}",
  "darkEvents.tooltipClick": "click to recenter map",

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
    "Sanctions: the platform automatically reconciles vessels against four official lists (UKSL, OFAC, UN-SC, EU) — see dedicated section above. Clients can layer their own proprietary lists via webhooks or export.",
  "methodology.compliance.legalIntro": "Full details on the",
  "methodology.compliance.legalLabel": "Legal page",
  // ─── New sections (sanctions screening / chokepoints / emissions) ───
  "methodology.sanctionsScreening.title":
    "Sanctions screening — multi-regime coverage",
  "methodology.sanctionsScreening.intro":
    "Vessels are reconciled against four official lists, refreshed daily and matched on IMO/MMSI:",
  "methodology.sanctionsScreening.uksl":
    "UK Sanctions List (UKSL) — FCDO, Open Government Licence v3.0. ~600 vessels (Russia, Iran). Authoritative source since the OFSI Consolidated List was retired on 28 January 2026.",
  "methodology.sanctionsScreening.ofac":
    "OFAC SDN — US Treasury, public domain (17 USC §105). ~1,500 vessels. Broadest global coverage, primarily Iran / Russia / Venezuela / Cuba / DPRK.",
  "methodology.sanctionsScreening.un":
    "UN Security Council Consolidated List — UN public information, free reuse. Coverage of DPRK, Libya, historical Iran.",
  "methodology.sanctionsScreening.eu":
    "EU Consolidated FSF — European Commission, EC Reuse Decision 2011/833/EU. Russian post-2022 shadow fleet, Belarus, Syria. Activated on configuration (EU webgate token required).",
  "methodology.sanctionsScreening.note":
    "Match on 7-digit IMO first (authoritative), MMSI as fallback. Red halo on the map and 🚫 badge in voyage tables.",
  "methodology.chokepoints.title":
    "Maritime chokepoint transit detection",
  "methodology.chokepoints.intro":
    "12 zones tracked continuously: Suez, Hormuz, Bab el-Mandeb, Malacca, Singapore, Bosphorus-Dardanelles, Gibraltar, Skagerrak-Kattegat, Dover Strait, Panama, Cape of Good Hope, Magellan.",
  "methodology.chokepoints.detection":
    "Point-in-bbox detection every 5 minutes over the trailing 10-minute window of received AIS positions.",
  "methodology.chokepoints.dedup":
    "Dedup via 6-hour cooldown to absorb GPS jitter without doubling transits.",
  "methodology.chokepoints.snapshot":
    "Sanctioned-state snapshot at entry — a vessel later delisted remains forensically marked for that transit.",
  "methodology.chokepoints.alertPrefix": "Composable alert",
  "methodology.chokepoints.alertSuffix":
    ": fired the moment a sanctioned vessel enters one of these zones.",
  "methodology.emissions.title":
    "CO₂ emissions estimation — in-house method",
  "methodology.emissions.intro":
    "Bottom-up approach derived from the IMO Fourth GHG Study (2020), integrated over the AIS feed with no external dependency. For each consecutive position pair:",
  "methodology.emissions.power":
    "Installed power and design service speed defaults from IMO Annex 1 tables, by cargo class (tanker / container / LNG / bulk / etc.).",
  "methodology.emissions.skip":
    "Pairs with gap >6h or speed <0.5kn skipped (vessel at berth or anchored — stationary auxiliary load is not modelled in v1).",
  "methodology.emissions.precision":
    "Indicative precision ±25% — sufficient for fleet ranking, voyage comparison, chartering screening. For regulatory reporting, cross with EU MRV (upcoming).",
  "methodology.emissions.endpointPrefix": "Endpoint",
  "methodology.emissions.endpointMid": "(per vessel) and",
  "methodology.emissions.endpointSuffix": "(user watchlist aggregate).",

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

  // /methodology
  "methodology.backLink": "← Terug naar precisie",
  "methodology.title": "Methodologie & SLA",
  "methodology.lead":
    "Deze pagina documenteert nauwkeurig de databronnen, modellen, persistentie en service-toezeggingen van het platform. Dit is het document dat data-teams van B2B-afnemers (traders, verzekeraars, expediteurs) onderzoeken vóór ondertekening.",
  "methodology.sources.title": "Databronnen",
  "methodology.sources.aisLive":
    "Realtime feed via aisstream.io (gemeenschapsnetwerk). Uitstekende dekking Europa / VS, lager in Middellandse Zee / Perzische Golf.",
  "methodology.sources.aisStatic":
    "ShipStaticData (Type, Naam, Bestemming, Diepgang, ETA broadcast) — uitgezonden elke ~6 minuten per schip.",
  "methodology.sources.geo":
    "bbox + zones (ankergebieden, ligplaatsen, vaargeulen) handmatig per haven gedefinieerd. Catalogus v1: 51 havens incl. ARA, Hamburg, Algeciras, Fujairah, Singapore, Houston, Sabine Pass, Ras Laffan.",
  "methodology.sources.proprietary":
    "Geen geïntegreerde proprietary data in v1 — het platform leunt uitsluitend op publieke AIS. Premium bronnen (Spire, Orbcomm) staan op de roadmap voor zwakke dekkingszones.",
  "methodology.cargoClass.title": "Lading-classificatie",
  "methodology.cargoClass.body":
    "Combinatie van AIS shipType (codes 70-89) en trefwoord-heuristiek (naam, bestemming) om een klasse toe te wijzen uit: crude, product, chemical, LNG, LPG, container, dry-bulk, general-cargo, ro-ro, passenger, fishing, tug, other. Bekende beperkingen: een slecht benoemd schip of met lege bestemming valt terug op de generieke shipType. Verwachte precisie ~85% op tankers en ~95% op containers.",
  "methodology.voyages.title": "Reizen-detectie",
  "methodology.voyages.open":
    "Opening: een reis opent wanneer een schip (van trackbare klasse: tanker / container / bulk / general / RoRo) waargenomen wordt in nadering/ankering met SOG ≥ 1 kn, na de grace-periode van 60s na worker-start.",
  "methodology.voyages.arrival":
    "Aankomst: overgang naar state = moored in een ligplaats-zone (NavStatus 5 of SOG < 0,3 kn in de berth-zone).",
  "methodology.voyages.departure":
    "Vertrek: na aankomst gaat het schip terug naar state = underway en afstand > 8 nm van het havencentrum.",
  "methodology.voyages.falsePositives":
    "Valse positieven: tugs, loodsen en visserij uitgesloten van tracking — de cargo-klasse dient als filter.",
  "methodology.eta.title": "ETA-model",
  "methodology.eta.naive":
    "Naïeve schatting: afstand / SOG waar afstand de groothoek is tussen huidige positie en havencentrum. Herberekend elke 5 minuten per actieve reis.",
  "methodology.eta.seasonal":
    "Seizoenscorrectie: mediaan van de fout (predicted − actual) berekend over de laatste 90 dagen, per UTC-aankomstuur. Fallback op globale mediaan als de uur-bucket minder dan 3 samples heeft. Recompute elke 30 min.",
  "methodology.eta.broadcast":
    "Vergeleken referentie: ETA-broadcast veld geëxtraheerd uit ShipStaticData berichten (handmatig ingevoerd door bemanning — vaak onnauwkeurig en verlaat).",
  "methodology.eta.metrics":
    "Metrieken: RMSE en MAE in uren, op afgesloten reizen met zowel voorspelde als broadcast ETA beschikbaar. Bijgewerkt bij elke afgesloten reis. Standaard venster: 30 dagen.",
  "methodology.eta.roadmap":
    "Model-roadmap: integratie congestie, getijden, weer, historische gemiddelde snelheid van het specifieke schip.",
  "methodology.anomalies.title": "Anomalie-detectie",
  "methodology.anomalies.intro":
    "v1: absolute drempels van dwell op anker, aangepast per cargo-klasse.",
  "methodology.anomalies.tanker":
    "Tankers (crude/product/chemical/LNG/LPG): warn ≥ 12 u, critical ≥ 48 u.",
  "methodology.anomalies.container":
    "Containers: warn ≥ 6 u, critical ≥ 24 u.",
  "methodology.anomalies.other": "Andere: warn ≥ 18 u, critical ≥ 72 u.",
  "methodology.anomalies.roadmap":
    "Roadmap: drempels afgeleid van historische verdeling per (haven, cargo); detectie van koersafwijking; loitering-detectie buiten bekende zones (\"dark fleet\" signaal).",
  "methodology.persistence.title": "Persistentie & lineage",
  "methodology.persistence.storage":
    "SQLite-opslag via node:sqlite (built-in Node 22+). Tabellen: kpi_snapshots, static_ships, positions, voyages, webhook_subscriptions, webhook_deliveries.",
  "methodology.persistence.timestamps":
    "Elke kpi_snapshots- en voyages-rij draagt de haven en het tijdstempel. Volledige reproduceerbaarheid van een metric op een gegeven moment.",
  "methodology.persistence.snapshot":
    "Positie-snapshot: 1 entry per minuut per schip (rate-limited). Maakt backtesting en model-replay mogelijk.",
  "methodology.persistence.export":
    "Roadmap: dagelijkse Parquet-export naar S3 / GCS voor klant data scientists.",
  "methodology.sla.title": "Service-toezeggingen (SLA v1)",
  "methodology.sla.uptime": "Platform-beschikbaarheid",
  "methodology.sla.uptimeValue": "99,5% / maand (MVP)",
  "methodology.sla.latencyLive": "Live posities latentie",
  "methodology.sla.latencyLiveValue": "< 30s (P95)",
  "methodology.sla.latencyKpi": "KPI's / reizen latentie",
  "methodology.sla.latencyKpiValue": "< 90s (P95)",
  "methodology.sla.webhook": "Webhook-aflevering",
  "methodology.sla.webhookValue": "1 retry op 60s · log 90 d",
  "methodology.sla.retention": "Historiek-retentie",
  "methodology.sla.retentionValue":
    "7 dagen KPI's in-memory · onbeperkt in SQLite (compactie 90 d)",
  "methodology.sla.backfill": "Backfill",
  "methodology.sla.backfillValue":
    "Op contractuele aanvraag (replay van persistente posities)",
  "methodology.compliance.title": "Compliance",
  "methodology.compliance.solas":
    "AIS-data: open, uitgezonden door schepen volgens SOLAS-conventie. Geen persoonlijke bemanningsdata.",
  "methodology.compliance.gdpr":
    "AVG: geen verwerking van persoonsgegevens. MMSI's zijn scheepsidentificatoren, geen persoonsidentificatoren.",
  "methodology.compliance.sanctions":
    "Sancties: het platform reconciliëert automatisch schepen tegen vier officiële lijsten (UKSL, OFAC, UN-SC, EU) — zie aparte sectie hierboven. Klanten kunnen eigen proprietary lijsten erop leggen via webhooks of export.",
  "methodology.sanctionsScreening.title":
    "Sanctie-screening — multi-regime dekking",
  "methodology.sanctionsScreening.intro":
    "Schepen worden gereconcilieerd tegen vier officiële lijsten, dagelijks ververst en gematcht op IMO/MMSI:",
  "methodology.sanctionsScreening.uksl":
    "UK Sanctions List (UKSL) — FCDO, Open Government Licence v3.0. ~600 schepen (Rusland, Iran). Autoritatieve bron sinds de OFSI Consolidated List op 28 januari 2026 werd ingetrokken.",
  "methodology.sanctionsScreening.ofac":
    "OFAC SDN — US Treasury, publiek domein (17 USC §105). ~1.500 schepen. Breedste mondiale dekking, voornamelijk Iran / Rusland / Venezuela / Cuba / DPRK.",
  "methodology.sanctionsScreening.un":
    "UN Security Council Consolidated List — VN publieke informatie, vrij hergebruik. Dekking DPRK, Libië, historisch Iran.",
  "methodology.sanctionsScreening.eu":
    "EU Consolidated FSF — Europese Commissie, EC Reuse Decision 2011/833/EU. Russische post-2022 shadow fleet, Belarus, Syrië. Geactiveerd op configuratie (EU webgate token vereist).",
  "methodology.sanctionsScreening.note":
    "Match op 7-cijferige IMO eerst (autoritatief), MMSI als fallback. Rode halo op de kaart en 🚫-badge in reizen-tabellen.",
  "methodology.chokepoints.title":
    "Maritieme chokepoint-transit detectie",
  "methodology.chokepoints.intro":
    "12 zones continu gevolgd: Suez, Hormuz, Bab el-Mandeb, Malacca, Singapore, Bosporus-Dardanellen, Gibraltar, Skagerrak-Kattegat, Nauw van Calais, Panama, Kaap de Goede Hoop, Magellaan.",
  "methodology.chokepoints.detection":
    "Point-in-bbox detectie elke 5 minuten over het glijdend venster van de laatste 10 minuten ontvangen AIS-posities.",
  "methodology.chokepoints.dedup":
    "Dedup via 6-uur cooldown om GPS-jitter te absorberen zonder transits te verdubbelen.",
  "methodology.chokepoints.snapshot":
    "Sanctie-status snapshot bij binnenkomst — een schip dat later van de lijst wordt gehaald blijft forensisch gemarkeerd voor die transit.",
  "methodology.chokepoints.alertPrefix": "Composeerbare alert",
  "methodology.chokepoints.alertSuffix":
    ": geactiveerd op het moment dat een gesanctioneerd schip een van deze zones binnenkomt.",
  "methodology.emissions.title":
    "CO₂-emissieschatting — in-house methode",
  "methodology.emissions.intro":
    "Bottom-up benadering afgeleid van IMO Fourth GHG Study (2020), geïntegreerd over de AIS-feed zonder externe afhankelijkheid. Voor elk paar opeenvolgende posities:",
  "methodology.emissions.power":
    "Geïnstalleerd vermogen en design-snelheid standaard uit IMO Annex 1 tabellen, per cargo-klasse (tanker / container / LNG / bulk …).",
  "methodology.emissions.skip":
    "Paren met gap >6u of snelheid <0,5 kn worden overgeslagen (schip aan ligplaats of verankerd — stationaire hulpbelasting wordt in v1 niet gemodelleerd).",
  "methodology.emissions.precision":
    "Indicatieve precisie ±25% — voldoende voor vloot-ranking, reisvergelijking, chartering screening. Voor regelgeving rapportage, kruis met EU MRV (toekomstig).",
  "methodology.emissions.endpointPrefix": "Endpoint",
  "methodology.emissions.endpointMid": "(per schip) en",
  "methodology.emissions.endpointSuffix": "(gebruiker watchlist aggregaat).",
  "methodology.compliance.legalIntro": "Volledige details op de pagina",
  "methodology.compliance.legalLabel": "Juridische vermelding",
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

  // /methodology
  "methodology.backLink": "← Zurück zur Präzision",
  "methodology.title": "Methodik & SLA",
  "methodology.lead":
    "Diese Seite dokumentiert präzise die Datenquellen, Modelle, Persistenz und Service-Verpflichtungen der Plattform. Es ist das Dokument, das die Datenteams von B2B-Käufern (Trader, Versicherer, Spediteure) vor einer Unterzeichnung prüfen.",
  "methodology.sources.title": "Datenquellen",
  "methodology.sources.aisLive":
    "Echtzeit-Feed via aisstream.io (Community-Netzwerk). Hervorragende Abdeckung Europa / USA, geringer Mittelmeer / Persischer Golf.",
  "methodology.sources.aisStatic":
    "ShipStaticData (Typ, Name, Bestimmungsort, Tiefgang, ETA-Broadcast) — alle ~6 Minuten pro Schiff gesendet.",
  "methodology.sources.geo":
    "bbox + Zonen (Ankergebiete, Liegeplätze, Fahrrinnen) manuell pro Hafen definiert. Katalog v1: 51 Häfen inkl. ARA, Hamburg, Algeciras, Fujairah, Singapur, Houston, Sabine Pass, Ras Laffan.",
  "methodology.sources.proprietary":
    "Keine integrierten proprietären Daten in v1 — die Plattform stützt sich ausschließlich auf öffentliches AIS. Premium-Quellen (Spire, Orbcomm) stehen auf der Roadmap für Zonen mit schwacher Abdeckung.",
  "methodology.cargoClass.title": "Frachtklassifizierung",
  "methodology.cargoClass.body":
    "Kombination aus AIS shipType (Codes 70-89) und Schlüsselwort-Heuristik (Name, Bestimmungsort) zur Zuordnung einer Klasse aus: crude, product, chemical, LNG, LPG, container, dry-bulk, general-cargo, ro-ro, passenger, fishing, tug, other. Bekannte Einschränkungen: ein schlecht benanntes Schiff oder mit leerem Bestimmungsort fällt auf den generischen shipType zurück. Erwartete Präzision ~85% bei Tankern und ~95% bei Containern.",
  "methodology.voyages.title": "Reisenerkennung",
  "methodology.voyages.open":
    "Öffnung: eine Reise öffnet sich, wenn ein Schiff (verfolgbarer Klasse: tanker / container / bulk / general / RoRo) im Anflug/Ankern mit SOG ≥ 1 kn beobachtet wird, nach der 60s-Karenzzeit nach Worker-Start.",
  "methodology.voyages.arrival":
    "Ankunft: Übergang zu state = moored in einer Liegeplatzzone (NavStatus 5 oder SOG < 0,3 kn in der berth-Zone).",
  "methodology.voyages.departure":
    "Abfahrt: nach der Ankunft kehrt das Schiff zu state = underway zurück und Distanz > 8 nm vom Hafenzentrum.",
  "methodology.voyages.falsePositives":
    "Falsch-Positive: Tugs, Lotsen und Fischerei vom Tracking ausgeschlossen — die Frachtklasse dient als Filter.",
  "methodology.eta.title": "ETA-Modell",
  "methodology.eta.naive":
    "Naive Schätzung: Distanz / SOG, wobei Distanz der Großkreis zwischen aktueller Position und Hafenzentrum ist. Alle 5 Minuten pro aktiver Reise neu berechnet.",
  "methodology.eta.seasonal":
    "Saisonkorrektur: Median des Fehlers (predicted − actual) berechnet über 90 gleitende Tage, pro UTC-Ankunftsstunde. Fallback auf globalen Median, wenn der Stunden-Bucket weniger als 3 Samples hat. Recompute alle 30 Min.",
  "methodology.eta.broadcast":
    "Vergleichsreferenz: ETA-Broadcast-Feld aus ShipStaticData-Nachrichten (manuell von der Schiffsbesatzung eingegeben — oft ungenau und verspätet).",
  "methodology.eta.metrics":
    "Metriken: RMSE und MAE in Stunden, auf abgeschlossenen Reisen mit verfügbaren prognostizierten UND Broadcast-ETAs. Bei jeder abgeschlossenen Reise aktualisiert. Standardfenster: 30 Tage.",
  "methodology.eta.roadmap":
    "Modell-Roadmap: Integration Stau, Gezeiten, Wetter, historische durchschnittliche Geschwindigkeit des spezifischen Schiffs.",
  "methodology.anomalies.title": "Anomalieerkennung",
  "methodology.anomalies.intro":
    "v1: absolute Schwellenwerte für Dwell beim Ankern, angepasst nach Frachtklasse.",
  "methodology.anomalies.tanker":
    "Tanker (crude/product/chemical/LNG/LPG): warn ≥ 12 h, critical ≥ 48 h.",
  "methodology.anomalies.container":
    "Container: warn ≥ 6 h, critical ≥ 24 h.",
  "methodology.anomalies.other": "Andere: warn ≥ 18 h, critical ≥ 72 h.",
  "methodology.anomalies.roadmap":
    "Roadmap: Schwellenwerte abgeleitet aus historischer Verteilung pro (Hafen, Fracht); Erkennung von Routenabweichungen; Loitering-Erkennung außerhalb bekannter Zonen (\"dark fleet\"-Signal).",
  "methodology.persistence.title": "Persistenz & Lineage",
  "methodology.persistence.storage":
    "SQLite-Speicherung via node:sqlite (built-in Node 22+). Tabellen: kpi_snapshots, static_ships, positions, voyages, webhook_subscriptions, webhook_deliveries.",
  "methodology.persistence.timestamps":
    "Jede kpi_snapshots- und voyages-Zeile trägt den Hafen und den Zeitstempel. Vollständige Reproduzierbarkeit einer Metrik zu einem gegebenen Zeitpunkt.",
  "methodology.persistence.snapshot":
    "Positionen-Snapshot: 1 Eintrag pro Minute pro Schiff (rate-limited). Ermöglicht Backtesting und Modell-Replay.",
  "methodology.persistence.export":
    "Roadmap: täglicher Parquet-Export nach S3 / GCS für Kunden-Datenwissenschaftler.",
  "methodology.sla.title": "Service-Verpflichtungen (SLA v1)",
  "methodology.sla.uptime": "Plattform-Verfügbarkeit",
  "methodology.sla.uptimeValue": "99,5% / Monat (MVP)",
  "methodology.sla.latencyLive": "Live-Positionen Latenz",
  "methodology.sla.latencyLiveValue": "< 30s (P95)",
  "methodology.sla.latencyKpi": "KPIs / Reisen Latenz",
  "methodology.sla.latencyKpiValue": "< 90s (P95)",
  "methodology.sla.webhook": "Webhook-Lieferung",
  "methodology.sla.webhookValue": "1 Retry bei 60s · Log 90 T",
  "methodology.sla.retention": "Historie-Aufbewahrung",
  "methodology.sla.retentionValue":
    "7 Tage KPIs in-memory · unbegrenzt in SQLite (Kompaktion 90 T)",
  "methodology.sla.backfill": "Backfill",
  "methodology.sla.backfillValue":
    "Auf vertragliche Anfrage (Replay persistierter Positionen)",
  "methodology.compliance.title": "Compliance",
  "methodology.compliance.solas":
    "AIS-Daten: offen, von Schiffen gemäß SOLAS-Konvention übertragen. Keine personenbezogenen Besatzungsdaten.",
  "methodology.compliance.gdpr":
    "DSGVO: keine Verarbeitung personenbezogener Daten. MMSIs sind Schiffsidentifikatoren, keine Personenidentifikatoren.",
  "methodology.compliance.sanctions":
    "Sanktionen: die Plattform gleicht automatisch Schiffe gegen vier offizielle Listen ab (UKSL, OFAC, UN-SC, EU) — siehe gewidmeter Abschnitt oben. Kunden können eigene proprietäre Listen via Webhooks oder Export überlagern.",
  "methodology.sanctionsScreening.title":
    "Sanktions-Screening — Multi-Regime-Abdeckung",
  "methodology.sanctionsScreening.intro":
    "Schiffe werden gegen vier offizielle Listen abgeglichen, täglich aktualisiert und auf IMO/MMSI gematcht:",
  "methodology.sanctionsScreening.uksl":
    "UK Sanctions List (UKSL) — FCDO, Open Government Licence v3.0. ~600 Schiffe (Russland, Iran). Autoritative Quelle seit Rückzug der OFSI Consolidated List am 28. Januar 2026.",
  "methodology.sanctionsScreening.ofac":
    "OFAC SDN — US Treasury, Public Domain (17 USC §105). ~1.500 Schiffe. Breiteste globale Abdeckung, hauptsächlich Iran / Russland / Venezuela / Kuba / Nordkorea.",
  "methodology.sanctionsScreening.un":
    "UN Security Council Consolidated List — UN-Öffentlichkeitsinformation, freie Wiederverwendung. Abdeckung Nordkorea, Libyen, historisch Iran.",
  "methodology.sanctionsScreening.eu":
    "EU Consolidated FSF — Europäische Kommission, EC Reuse Decision 2011/833/EU. Russische Post-2022 Shadow Fleet, Belarus, Syrien. Aktiviert auf Konfiguration (EU-Webgate-Token erforderlich).",
  "methodology.sanctionsScreening.note":
    "Match auf 7-stelliger IMO zuerst (autoritativ), MMSI als Fallback. Roter Halo auf der Karte und 🚫-Badge in Reisen-Tabellen.",
  "methodology.chokepoints.title":
    "Maritime Chokepoint-Transit-Erkennung",
  "methodology.chokepoints.intro":
    "12 Zonen kontinuierlich verfolgt: Suez, Hormuz, Bab el-Mandeb, Malakka, Singapur, Bosporus-Dardanellen, Gibraltar, Skagerrak-Kattegat, Straße von Dover, Panama, Kap der Guten Hoffnung, Magellan.",
  "methodology.chokepoints.detection":
    "Point-in-bbox-Erkennung alle 5 Minuten über das gleitende Fenster der letzten 10 Minuten empfangener AIS-Positionen.",
  "methodology.chokepoints.dedup":
    "Dedup via 6-Stunden-Cooldown zur Absorption von GPS-Jitter ohne Transits zu verdoppeln.",
  "methodology.chokepoints.snapshot":
    "Sanktions-Status-Snapshot bei Eintritt — ein später delistetes Schiff bleibt forensisch für diesen Transit markiert.",
  "methodology.chokepoints.alertPrefix": "Composable Alert",
  "methodology.chokepoints.alertSuffix":
    ": ausgelöst in dem Moment, in dem ein sanktioniertes Schiff eine dieser Zonen betritt.",
  "methodology.emissions.title":
    "CO₂-Emissionsschätzung — In-House-Methode",
  "methodology.emissions.intro":
    "Bottom-up-Ansatz abgeleitet aus IMO Fourth GHG Study (2020), integriert über den AIS-Feed ohne externe Abhängigkeit. Für jedes Paar aufeinanderfolgender Positionen:",
  "methodology.emissions.power":
    "Installierte Leistung und Design-Geschwindigkeit Defaults aus IMO Annex 1 Tabellen, pro Frachtklasse (tanker / container / LNG / bulk …).",
  "methodology.emissions.skip":
    "Paare mit Gap >6h oder Geschwindigkeit <0,5 kn übersprungen (Schiff am Liegeplatz oder verankert — stationäre Hilfslast wird in v1 nicht modelliert).",
  "methodology.emissions.precision":
    "Indikative Präzision ±25% — ausreichend für Flotten-Ranking, Reisenvergleich, Chartering-Screening. Für regulatorisches Reporting, mit EU MRV abgleichen (kommend).",
  "methodology.emissions.endpointPrefix": "Endpoint",
  "methodology.emissions.endpointMid": "(pro Schiff) und",
  "methodology.emissions.endpointSuffix": "(Nutzer-Watchlist-Aggregat).",
  "methodology.compliance.legalIntro": "Vollständige Details auf der Seite",
  "methodology.compliance.legalLabel": "Impressum",
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

  // /methodology
  "methodology.backLink": "← Volver a precisión",
  "methodology.title": "Metodología y SLA",
  "methodology.lead":
    "Esta página documenta con precisión las fuentes de datos, modelos, persistencia y compromisos de servicio de la plataforma. Es el documento que los equipos de datos de los compradores B2B (traders, aseguradoras, transitarios) examinan antes de firmar.",
  "methodology.sources.title": "Fuentes de datos",
  "methodology.sources.aisLive":
    "Flujo en tiempo real vía aisstream.io (red comunitaria). Excelente cobertura Europa / EE. UU., menor en Mediterráneo / Golfo Pérsico.",
  "methodology.sources.aisStatic":
    "ShipStaticData (Tipo, Nombre, Destino, Calado, ETA broadcast) — emitido cada ~6 minutos por buque.",
  "methodology.sources.geo":
    "bbox + zonas (fondeaderos, atraques, canales) definidas manualmente por puerto. Catálogo v1: 51 puertos incluyendo ARA, Hamburgo, Algeciras, Fujairah, Singapur, Houston, Sabine Pass, Ras Laffan.",
  "methodology.sources.proprietary":
    "Sin datos propietarios integrados en v1 — la plataforma se basa exclusivamente en AIS público. Fuentes premium (Spire, Orbcomm) en la roadmap para zonas de baja cobertura.",
  "methodology.cargoClass.title": "Clasificación de carga",
  "methodology.cargoClass.body":
    "Combinación del shipType AIS (códigos 70-89) y heurística de palabras clave (nombre, destino) para asignar una clase entre: crude, product, chemical, LNG, LPG, container, dry-bulk, general-cargo, ro-ro, passenger, fishing, tug, other. Limitaciones conocidas: un buque mal nombrado o con destino vacío recae en el shipType genérico. Precisión esperada ~85% en tankers y ~95% en containers.",
  "methodology.voyages.title": "Detección de viajes",
  "methodology.voyages.open":
    "Apertura: un viaje se abre cuando un buque (de clase trackeable: tanker / container / bulk / general / RoRo) es observado en aproximación/fondeo con SOG ≥ 1 kn, después del periodo de gracia de 60s tras el inicio del worker.",
  "methodology.voyages.arrival":
    "Llegada: transición a state = moored en una zona de muelle (NavStatus 5 o SOG < 0,3 kn en la zona berth).",
  "methodology.voyages.departure":
    "Salida: tras la llegada, el buque vuelve a state = underway y distancia > 8 nm del centro del puerto.",
  "methodology.voyages.falsePositives":
    "Falsos positivos: tugs, prácticos y pesca excluidos del tracking — la clase de carga sirve de filtro.",
  "methodology.eta.title": "Modelo ETA",
  "methodology.eta.naive":
    "Estimación naive: distancia / SOG donde distancia es el círculo máximo entre la posición actual y el centro del puerto. Recalculado cada 5 minutos por viaje activo.",
  "methodology.eta.seasonal":
    "Corrección estacional: mediana del error (predicted − actual) calculada sobre los últimos 90 días, por hora UTC de llegada. Fallback a la mediana global si el bucket horario tiene menos de 3 muestras. Recompute cada 30 min.",
  "methodology.eta.broadcast":
    "Referencia comparada: campo ETA broadcast extraído de los mensajes ShipStaticData (introducido manualmente por la tripulación — frecuentemente impreciso y tardío).",
  "methodology.eta.metrics":
    "Métricas: RMSE y MAE en horas, sobre viajes cerrados con ETA prevista Y broadcast disponibles. Actualizado en cada viaje cerrado. Ventana por defecto: 30 días.",
  "methodology.eta.roadmap":
    "Roadmap del modelo: integración congestión, mareas, meteorología, velocidad media histórica del buque específico.",
  "methodology.anomalies.title": "Detección de anomalías",
  "methodology.anomalies.intro":
    "v1: umbrales absolutos de dwell en fondeo, ajustados por clase de carga.",
  "methodology.anomalies.tanker":
    "Tankers (crude/product/chemical/LNG/LPG): warn ≥ 12 h, critical ≥ 48 h.",
  "methodology.anomalies.container":
    "Containers: warn ≥ 6 h, critical ≥ 24 h.",
  "methodology.anomalies.other": "Otros: warn ≥ 18 h, critical ≥ 72 h.",
  "methodology.anomalies.roadmap":
    "Roadmap: umbrales derivados de la distribución histórica por (puerto, carga); detección de desviación de ruta; detección de loitering fuera de zonas conocidas (señal \"dark fleet\").",
  "methodology.persistence.title": "Persistencia y lineage",
  "methodology.persistence.storage":
    "Almacenamiento SQLite vía node:sqlite (built-in Node 22+). Tablas: kpi_snapshots, static_ships, positions, voyages, webhook_subscriptions, webhook_deliveries.",
  "methodology.persistence.timestamps":
    "Cada fila kpi_snapshots y voyages lleva el puerto y el timestamp. Reproducibilidad total de una métrica en un instante dado.",
  "methodology.persistence.snapshot":
    "Snapshot de posiciones: 1 entrada por minuto por buque (rate-limited). Permite backtesting y replay del modelo.",
  "methodology.persistence.export":
    "Roadmap: export Parquet diario a S3 / GCS para los data scientists del cliente.",
  "methodology.sla.title": "Compromisos de servicio (SLA v1)",
  "methodology.sla.uptime": "Disponibilidad de la plataforma",
  "methodology.sla.uptimeValue": "99,5% / mes (MVP)",
  "methodology.sla.latencyLive": "Latencia posiciones live",
  "methodology.sla.latencyLiveValue": "< 30s (P95)",
  "methodology.sla.latencyKpi": "Latencia KPIs / viajes",
  "methodology.sla.latencyKpiValue": "< 90s (P95)",
  "methodology.sla.webhook": "Entrega de webhook",
  "methodology.sla.webhookValue": "1 retry a 60s · log 90 d",
  "methodology.sla.retention": "Retención histórica",
  "methodology.sla.retentionValue":
    "7 días KPIs in-memory · ilimitado en SQLite (compactación 90 d)",
  "methodology.sla.backfill": "Backfill",
  "methodology.sla.backfillValue":
    "Bajo solicitud contractual (replay de posiciones persistidas)",
  "methodology.compliance.title": "Cumplimiento",
  "methodology.compliance.solas":
    "Datos AIS: abiertos, transmitidos por buques en cumplimiento del convenio SOLAS. Sin datos personales de tripulación.",
  "methodology.compliance.gdpr":
    "RGPD: sin tratamiento de datos personales. Los MMSI son identificadores de buque, no de persona.",
  "methodology.compliance.sanctions":
    "Sanciones: la plataforma reconcilia automáticamente buques contra cuatro listas oficiales (UKSL, OFAC, UN-SC, EU) — ver sección dedicada arriba. El cliente puede superponer sus propias listas propietarias vía webhooks o export.",
  "methodology.sanctionsScreening.title":
    "Screening de sanciones — cobertura multi-régimen",
  "methodology.sanctionsScreening.intro":
    "Los buques son reconciliados contra cuatro listas oficiales, actualizadas diariamente y matched sobre IMO/MMSI:",
  "methodology.sanctionsScreening.uksl":
    "UK Sanctions List (UKSL) — FCDO, Open Government Licence v3.0. ~600 buques (Rusia, Irán). Fuente autoritaria desde la retirada de la OFSI Consolidated List el 28 de enero de 2026.",
  "methodology.sanctionsScreening.ofac":
    "OFAC SDN — US Treasury, dominio público (17 USC §105). ~1.500 buques. Cobertura mundial más amplia, principalmente Irán / Rusia / Venezuela / Cuba / Corea del Norte.",
  "methodology.sanctionsScreening.un":
    "UN Security Council Consolidated List — información pública ONU, libre reutilización. Cobertura RPDC, Libia, Irán histórico.",
  "methodology.sanctionsScreening.eu":
    "EU Consolidated FSF — Comisión Europea, EC Reuse Decision 2011/833/EU. Shadow fleet rusa post-2022, Bielorrusia, Siria. Activado en configuración (token EU webgate requerido).",
  "methodology.sanctionsScreening.note":
    "Match sobre IMO 7 dígitos prioritario (autoritario), MMSI como fallback. Halo rojo en el mapa y badge 🚫 en las tablas de viajes.",
  "methodology.chokepoints.title":
    "Detección de tránsito en chokepoints marítimos",
  "methodology.chokepoints.intro":
    "12 zonas vigiladas continuamente: Suez, Hormuz, Bab el-Mandeb, Malaca, Singapur, Bósforo-Dardanelos, Gibraltar, Skagerrak-Kattegat, Estrecho de Dover, Panamá, Cabo de Buena Esperanza, Magallanes.",
  "methodology.chokepoints.detection":
    "Detección point-in-bbox cada 5 minutos sobre la ventana deslizante de los últimos 10 minutos de posiciones AIS recibidas.",
  "methodology.chokepoints.dedup":
    "Dedup vía cooldown de 6 h para absorber el jitter GPS sin duplicar tránsitos.",
  "methodology.chokepoints.snapshot":
    "Snapshot del estado sancionado al momento de la entrada — un buque retirado posteriormente queda forensicamente marcado para ese tránsito.",
  "methodology.chokepoints.alertPrefix": "Alerta composable",
  "methodology.chokepoints.alertSuffix":
    ": disparada en el momento exacto en que un buque sancionado entra en una de estas zonas.",
  "methodology.emissions.title":
    "Estimación de emisiones CO₂ — método in-house",
  "methodology.emissions.intro":
    "Enfoque bottom-up derivado del IMO Fourth GHG Study (2020), integrado sobre el feed AIS sin dependencia externa. Para cada par de posiciones consecutivas:",
  "methodology.emissions.power":
    "Potencia instalada y velocidad de servicio default tomadas de las tablas IMO Annex 1, por clase de carga (tanker / container / LNG / bulk …).",
  "methodology.emissions.skip":
    "Pares con gap >6 h o velocidad <0,5 kn omitidos (buque atracado o fondeado — la consumo auxiliar estacionario no se modela en v1).",
  "methodology.emissions.precision":
    "Precisión indicativa ±25% — suficiente para ranking de flota, comparación de viajes, screening de chartering. Para reporting regulatorio, cruzar con EU MRV (próximo).",
  "methodology.emissions.endpointPrefix": "Endpoint",
  "methodology.emissions.endpointMid": "(por buque) y",
  "methodology.emissions.endpointSuffix": "(agregado de watchlist usuario).",
  "methodology.compliance.legalIntro": "Detalles completos en la página",
  "methodology.compliance.legalLabel": "Aviso legal",
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

  // /methodology
  "methodology.backLink": "← العودة إلى الدقة",
  "methodology.title": "المنهجية واتفاقية مستوى الخدمة",
  "methodology.lead":
    "توثّق هذه الصفحة بدقة مصادر البيانات والنماذج والمحافظة والتزامات الخدمة للمنصة. هذه هي الوثيقة التي تفحصها فرق البيانات لدى المشترين B2B (التجار، شركات التأمين، وكلاء الشحن) قبل التوقيع.",
  "methodology.sources.title": "مصادر البيانات",
  "methodology.sources.aisLive":
    "تدفق فوري عبر aisstream.io (شبكة مجتمعية). تغطية ممتازة في أوروبا / الولايات المتحدة، أضعف في البحر المتوسط / الخليج العربي.",
  "methodology.sources.aisStatic":
    "ShipStaticData (النوع، الاسم، الوجهة، الغاطس، ETA المُذاع) — يُرسَل كل ~6 دقائق لكل سفينة.",
  "methodology.sources.geo":
    "bbox + مناطق (المراسي، أحواض الرسو، القنوات) محددة يدوياً لكل ميناء. الكتالوج v1: 51 ميناء بما فيها ARA، هامبورغ، الجزيرة الخضراء، الفجيرة، سنغافورة، هيوستن، Sabine Pass، رأس لفان.",
  "methodology.sources.proprietary":
    "لا توجد بيانات حصرية مدمجة في v1 — تعتمد المنصة فقط على AIS العام. مصادر premium (Spire، Orbcomm) في خارطة الطريق لمناطق التغطية الضعيفة.",
  "methodology.cargoClass.title": "تصنيف الحمولة",
  "methodology.cargoClass.body":
    "مزيج من shipType الخاص بـ AIS (الرموز 70-89) واستدلال بالكلمات المفتاحية (الاسم، الوجهة) لتعيين فئة من بين: crude, product, chemical, LNG, LPG, container, dry-bulk, general-cargo, ro-ro, passenger, fishing, tug, other. القيود المعروفة: سفينة بتسمية سيئة أو وجهة فارغة تعود إلى shipType العام. الدقة المتوقعة ~85% للناقلات و~95% للحاويات.",
  "methodology.voyages.title": "اكتشاف الرحلات",
  "methodology.voyages.open":
    "الفتح: تُفتَح رحلة عند رصد سفينة (من فئة قابلة للتتبع: ناقلة / حاوية / صب / عام / RoRo) في الاقتراب/الرسو بسرعة SOG ≥ 1 عقدة، بعد فترة السماح 60 ث من بدء الـworker.",
  "methodology.voyages.arrival":
    "الوصول: انتقال إلى state = moored في منطقة رصيف (NavStatus 5 أو SOG < 0.3 عقدة في منطقة الرصيف).",
  "methodology.voyages.departure":
    "المغادرة: بعد الوصول، تعود السفينة إلى state = underway ومسافة > 8 ميل بحري من مركز الميناء.",
  "methodology.voyages.falsePositives":
    "الإيجابيات الكاذبة: القاطرات والمرشدون والصيد مستبعدة من التتبع — فئة الحمولة تعمل كمرشّح.",
  "methodology.eta.title": "نموذج ETA",
  "methodology.eta.naive":
    "تقدير ساذج: المسافة / SOG حيث المسافة هي الدائرة العظمى بين الموضع الحالي ومركز الميناء. يُعاد حسابها كل 5 دقائق لكل رحلة نشطة.",
  "methodology.eta.seasonal":
    "تصحيح موسمي: وسيط الخطأ (predicted − actual) محسوب على مدى 90 يوماً متحركاً، حسب ساعة الوصول UTC. fallback إلى الوسيط العام إذا كان دلو الساعة يحتوي على أقل من 3 عينات. recompute كل 30 دقيقة.",
  "methodology.eta.broadcast":
    "المرجع المقارَن: حقل ETA broadcast المستخرج من رسائل ShipStaticData (يُدخَل يدوياً من قبل طاقم السفينة — غالباً غير دقيق ومتأخر).",
  "methodology.eta.metrics":
    "المقاييس: RMSE وMAE بالساعات، على الرحلات المغلقة التي تتوفر فيها ETA متوقعة وbroadcast. تُحدَّث عند كل رحلة مغلقة. النافذة الافتراضية: 30 يوماً.",
  "methodology.eta.roadmap":
    "خارطة طريق النموذج: دمج الازدحام، المد والجزر، الطقس، متوسط السرعة التاريخية للسفينة المحددة.",
  "methodology.anomalies.title": "اكتشاف الشذوذ",
  "methodology.anomalies.intro":
    "v1: عتبات مطلقة لـdwell عند الرسو، معدّلة حسب فئة الحمولة.",
  "methodology.anomalies.tanker":
    "الناقلات (crude/product/chemical/LNG/LPG): warn ≥ 12 س، critical ≥ 48 س.",
  "methodology.anomalies.container":
    "الحاويات: warn ≥ 6 س، critical ≥ 24 س.",
  "methodology.anomalies.other": "أخرى: warn ≥ 18 س، critical ≥ 72 س.",
  "methodology.anomalies.roadmap":
    "خارطة الطريق: عتبات مشتقّة من التوزيع التاريخي حسب (الميناء، الحمولة)؛ اكتشاف انحراف المسار؛ اكتشاف loitering خارج المناطق المعروفة (إشارة \"dark fleet\").",
  "methodology.persistence.title": "الاحتفاظ والـlineage",
  "methodology.persistence.storage":
    "تخزين SQLite عبر node:sqlite (مدمج في Node 22+). الجداول: kpi_snapshots، static_ships، positions، voyages، webhook_subscriptions، webhook_deliveries.",
  "methodology.persistence.timestamps":
    "كل سطر kpi_snapshots وvoyages يحمل الميناء والـtimestamp. قابلية إعادة إنتاج كاملة لمقياس في لحظة معطاة.",
  "methodology.persistence.snapshot":
    "snapshot المواقع: مدخل واحد في الدقيقة لكل سفينة (rate-limited). يسمح بـbacktesting وإعادة تشغيل النموذج.",
  "methodology.persistence.export":
    "خارطة الطريق: تصدير Parquet يومي إلى S3 / GCS لعلماء بيانات العميل.",
  "methodology.sla.title": "التزامات الخدمة (SLA v1)",
  "methodology.sla.uptime": "توافر المنصة",
  "methodology.sla.uptimeValue": "99.5% / شهر (MVP)",
  "methodology.sla.latencyLive": "تأخير المواقع المباشرة",
  "methodology.sla.latencyLiveValue": "< 30 ث (P95)",
  "methodology.sla.latencyKpi": "تأخير KPIs / الرحلات",
  "methodology.sla.latencyKpiValue": "< 90 ث (P95)",
  "methodology.sla.webhook": "تسليم Webhook",
  "methodology.sla.webhookValue": "محاولة واحدة بعد 60 ث · سجل 90 يوماً",
  "methodology.sla.retention": "الاحتفاظ بالتاريخ",
  "methodology.sla.retentionValue":
    "7 أيام KPIs in-memory · غير محدود في SQLite (تضغيط 90 يوماً)",
  "methodology.sla.backfill": "Backfill",
  "methodology.sla.backfillValue":
    "بناءً على طلب تعاقدي (إعادة تشغيل المواقع المحفوظة)",
  "methodology.compliance.title": "الامتثال",
  "methodology.compliance.solas":
    "بيانات AIS: مفتوحة، مرسَلة من السفن وفقاً لاتفاقية SOLAS. لا توجد بيانات شخصية للطاقم.",
  "methodology.compliance.gdpr":
    "GDPR: لا توجد معالجة لبيانات شخصية. MMSIs هي معرّفات سفينة، وليست شخصية.",
  "methodology.compliance.sanctions":
    "العقوبات: تطابق المنصة تلقائياً السفن مع أربع قوائم رسمية (UKSL, OFAC, UN-SC, EU) — انظر القسم المخصص أعلاه. يمكن للعميل إضافة قوائمه الحصرية الخاصة عبر webhooks أو export.",
  "methodology.sanctionsScreening.title":
    "فحص العقوبات — تغطية متعددة الأنظمة",
  "methodology.sanctionsScreening.intro":
    "تتم مطابقة السفن مع أربع قوائم رسمية، تُحدَّث يومياً وتُطابَق على IMO/MMSI:",
  "methodology.sanctionsScreening.uksl":
    "UK Sanctions List (UKSL) — FCDO، Open Government Licence v3.0. ~600 سفينة (روسيا، إيران). مصدر معتمَد منذ سحب OFSI Consolidated List في 28 يناير 2026.",
  "methodology.sanctionsScreening.ofac":
    "OFAC SDN — US Treasury، ملك عام (17 USC §105). ~1,500 سفينة. أوسع تغطية عالمية، خاصة إيران / روسيا / فنزويلا / كوبا / كوريا الشمالية.",
  "methodology.sanctionsScreening.un":
    "UN Security Council Consolidated List — معلومات الأمم المتحدة العامة، إعادة استخدام حرة. تغطية كوريا الشمالية، ليبيا، إيران تاريخياً.",
  "methodology.sanctionsScreening.eu":
    "EU Consolidated FSF — المفوضية الأوروبية، EC Reuse Decision 2011/833/EU. أسطول الظل الروسي ما بعد 2022، بيلاروسيا، سوريا. مفعّل عند التهيئة (يتطلب رمز EU webgate).",
  "methodology.sanctionsScreening.note":
    "المطابقة على IMO من 7 أرقام كأولوية (معتمَد)، MMSI كfallback. هالة حمراء على الخريطة وشارة 🚫 في جداول الرحلات.",
  "methodology.chokepoints.title":
    "اكتشاف العبور في نقاط الاختناق البحرية",
  "methodology.chokepoints.intro":
    "12 منطقة مراقَبة باستمرار: السويس، هرمز، باب المندب، ملقا، سنغافورة، البوسفور-الدردنيل، جبل طارق، Skagerrak-Kattegat، مضيق دوفر، بنما، رأس الرجاء الصالح، ماجلان.",
  "methodology.chokepoints.detection":
    "اكتشاف point-in-bbox كل 5 دقائق على نافذة منزلقة من آخر 10 دقائق من مواقع AIS المستلمة.",
  "methodology.chokepoints.dedup":
    "Dedup عبر cooldown لمدة 6 ساعات لاستيعاب jitter GPS دون مضاعفة الانتقالات.",
  "methodology.chokepoints.snapshot":
    "snapshot لحالة العقوبات عند الدخول — سفينة تُحذَف لاحقاً تظل موسومة جنائياً لذلك العبور.",
  "methodology.chokepoints.alertPrefix": "تنبيه قابل للتركيب",
  "methodology.chokepoints.alertSuffix":
    ": يُطلَق في اللحظة التي تدخل فيها سفينة خاضعة للعقوبات إحدى هذه المناطق.",
  "methodology.emissions.title":
    "تقدير انبعاثات CO₂ — منهج داخلي",
  "methodology.emissions.intro":
    "نهج bottom-up مستمد من IMO Fourth GHG Study (2020)، مدمج على تدفق AIS بدون تبعية خارجية. لكل زوج من المواقع المتتالية:",
  "methodology.emissions.power":
    "الطاقة المثبَّتة وسرعة الخدمة الافتراضية مستمدة من جداول IMO Annex 1، حسب فئة الحمولة (tanker / container / LNG / bulk …).",
  "methodology.emissions.skip":
    "الأزواج بفجوة >6 س أو سرعة <0.5 عقدة تُتخطى (سفينة عند الرصيف أو راسية — الحمل الإضافي الثابت غير مُنمذَج في v1).",
  "methodology.emissions.precision":
    "دقة إرشادية ±25% — كافية لترتيب الأسطول، مقارنة الرحلات، فحص الـchartering. للتقارير التنظيمية، تقاطع مع EU MRV (قادم).",
  "methodology.emissions.endpointPrefix": "Endpoint",
  "methodology.emissions.endpointMid": "(لكل سفينة) و",
  "methodology.emissions.endpointSuffix": "(تجميع watchlist للمستخدم).",
  "methodology.compliance.legalIntro": "التفاصيل الكاملة في صفحة",
  "methodology.compliance.legalLabel": "الإشعار القانوني",
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

  // /methodology
  "methodology.backLink": "← 返回精度",
  "methodology.title": "方法论与 SLA",
  "methodology.lead":
    "本页面精确记录平台的数据源、模型、持久化和服务承诺。这是 B2B 买方（交易员、保险公司、货运代理）的数据团队在签约前审查的文档。",
  "methodology.sources.title": "数据源",
  "methodology.sources.aisLive":
    "通过 aisstream.io 的实时数据流（社区网络）。欧洲/美国覆盖优秀，地中海/波斯湾覆盖较弱。",
  "methodology.sources.aisStatic":
    "ShipStaticData（类型、名称、目的地、吃水、ETA broadcast）— 每艘船每约 6 分钟发送一次。",
  "methodology.sources.geo":
    "bbox + 区域（锚地、泊位、航道）按港口手动定义。v1 目录：51 个港口，包括 ARA、汉堡、阿尔赫西拉斯、富查伊拉、新加坡、休斯顿、Sabine Pass、拉斯拉凡。",
  "methodology.sources.proprietary":
    "v1 中无集成的专有数据 — 平台仅依赖公共 AIS。高级数据源（Spire、Orbcomm）在路线图中，用于覆盖薄弱区域。",
  "methodology.cargoClass.title": "货物分类",
  "methodology.cargoClass.body":
    "结合 AIS shipType（代码 70-89）和关键词启发式（名称、目的地）来分配以下类别之一：crude、product、chemical、LNG、LPG、container、dry-bulk、general-cargo、ro-ro、passenger、fishing、tug、other。已知限制：命名不当或目的地为空的船舶会回退到通用 shipType。预期精度：油轮约 85%，集装箱约 95%。",
  "methodology.voyages.title": "航次检测",
  "methodology.voyages.open":
    "开启：当一艘船（可跟踪类别：tanker / container / bulk / general / RoRo）在 worker 启动后 60 秒宽限期之后，被观察到以 SOG ≥ 1 节接近/锚泊时，航次开启。",
  "methodology.voyages.arrival":
    "到达：在泊位区域过渡到 state = moored（NavStatus 5 或 berth 区域内 SOG < 0.3 节）。",
  "methodology.voyages.departure":
    "离开：到达后，船舶返回 state = underway 且距港口中心 > 8 海里。",
  "methodology.voyages.falsePositives":
    "误报：拖船、引航员和渔船排除在跟踪之外 — 货物类别用作过滤器。",
  "methodology.eta.title": "ETA 模型",
  "methodology.eta.naive":
    "朴素估算：距离 / SOG，其中距离是当前位置与港口中心之间的大圆距离。每个活跃航次每 5 分钟重新计算。",
  "methodology.eta.seasonal":
    "季节性校正：在过去 90 天滑动窗口内按 UTC 到达小时计算的误差中位数（predicted − actual）。如果小时桶样本少于 3 个，则回退到全局中位数。每 30 分钟重新计算。",
  "methodology.eta.broadcast":
    "比较参考：从 ShipStaticData 消息中提取的 ETA broadcast 字段（由船员手动输入 — 通常不准确且滞后）。",
  "methodology.eta.metrics":
    "指标：以小时为单位的 RMSE 和 MAE，针对同时具有预测 ETA 和 broadcast ETA 的已关闭航次。每个已关闭航次更新。默认窗口：30 天。",
  "methodology.eta.roadmap":
    "模型路线图：集成拥堵、潮汐、天气、特定船舶的历史平均速度。",
  "methodology.anomalies.title": "异常检测",
  "methodology.anomalies.intro":
    "v1：锚泊停留的绝对阈值，按货物类别调整。",
  "methodology.anomalies.tanker":
    "油轮（crude/product/chemical/LNG/LPG）：warn ≥ 12 小时，critical ≥ 48 小时。",
  "methodology.anomalies.container":
    "集装箱：warn ≥ 6 小时，critical ≥ 24 小时。",
  "methodology.anomalies.other": "其他：warn ≥ 18 小时，critical ≥ 72 小时。",
  "methodology.anomalies.roadmap":
    "路线图：从 (港口, 货物) 历史分布派生的阈值；航线偏离检测；已知区域外的徘徊检测（\"dark fleet\" 信号）。",
  "methodology.persistence.title": "持久化与谱系",
  "methodology.persistence.storage":
    "通过 node:sqlite（Node 22+ 内置）的 SQLite 存储。表：kpi_snapshots、static_ships、positions、voyages、webhook_subscriptions、webhook_deliveries。",
  "methodology.persistence.timestamps":
    "每条 kpi_snapshots 和 voyages 行都携带港口和时间戳。给定时刻的指标完全可重现。",
  "methodology.persistence.snapshot":
    "位置快照：每艘船每分钟一条记录（速率限制）。允许回测和模型重放。",
  "methodology.persistence.export":
    "路线图：每日 Parquet 导出到 S3 / GCS，供客户数据科学家使用。",
  "methodology.sla.title": "服务承诺（SLA v1）",
  "methodology.sla.uptime": "平台可用性",
  "methodology.sla.uptimeValue": "99.5% / 月（MVP）",
  "methodology.sla.latencyLive": "实时位置延迟",
  "methodology.sla.latencyLiveValue": "< 30 秒（P95）",
  "methodology.sla.latencyKpi": "KPIs / 航次延迟",
  "methodology.sla.latencyKpiValue": "< 90 秒（P95）",
  "methodology.sla.webhook": "Webhook 投递",
  "methodology.sla.webhookValue": "60 秒后 1 次重试 · 90 天日志",
  "methodology.sla.retention": "历史保留",
  "methodology.sla.retentionValue":
    "7 天 KPIs in-memory · SQLite 中无限（90 天压缩）",
  "methodology.sla.backfill": "Backfill",
  "methodology.sla.backfillValue":
    "根据合同请求（持久化位置的重放）",
  "methodology.compliance.title": "合规",
  "methodology.compliance.solas":
    "AIS 数据：开放，由船舶按照 SOLAS 公约传输。无船员个人数据。",
  "methodology.compliance.gdpr":
    "GDPR：无个人数据处理。MMSIs 是船舶标识符，非个人标识符。",
  "methodology.compliance.sanctions":
    "制裁：平台自动将船舶与四个官方名单（UKSL、OFAC、UN-SC、EU）核对 — 见上方专门部分。客户可通过 webhooks 或导出叠加自己的专有名单。",
  "methodology.sanctionsScreening.title":
    "制裁筛查 — 多机制覆盖",
  "methodology.sanctionsScreening.intro":
    "船舶与四个官方名单核对，每日刷新并按 IMO/MMSI 匹配：",
  "methodology.sanctionsScreening.uksl":
    "UK Sanctions List (UKSL) — FCDO，Open Government Licence v3.0。约 600 艘船（俄罗斯、伊朗）。自 2026 年 1 月 28 日 OFSI Consolidated List 退出以来的权威来源。",
  "methodology.sanctionsScreening.ofac":
    "OFAC SDN — 美国财政部，公共领域（17 USC §105）。约 1,500 艘船。最广泛的全球覆盖，主要伊朗 / 俄罗斯 / 委内瑞拉 / 古巴 / 朝鲜。",
  "methodology.sanctionsScreening.un":
    "UN Security Council Consolidated List — 联合国公开信息，免费再利用。覆盖朝鲜、利比亚、历史上的伊朗。",
  "methodology.sanctionsScreening.eu":
    "EU Consolidated FSF — 欧盟委员会，EC Reuse Decision 2011/833/EU。2022 年后俄罗斯影子舰队、白俄罗斯、叙利亚。需配置激活（需要 EU webgate token）。",
  "methodology.sanctionsScreening.note":
    "优先匹配 7 位 IMO（权威），MMSI 作为后备。地图上红色光环和航次表中的 🚫 徽章。",
  "methodology.chokepoints.title":
    "海上咽喉点过境检测",
  "methodology.chokepoints.intro":
    "持续跟踪 12 个区域：苏伊士、霍尔木兹、曼德海峡、马六甲、新加坡、博斯普鲁斯-达达尼尔、直布罗陀、Skagerrak-Kattegat、多佛海峡、巴拿马、好望角、麦哲伦。",
  "methodology.chokepoints.detection":
    "每 5 分钟在最近 10 分钟接收的 AIS 位置滑动窗口上进行 point-in-bbox 检测。",
  "methodology.chokepoints.dedup":
    "通过 6 小时冷却期去重，吸收 GPS 抖动而不重复过境。",
  "methodology.chokepoints.snapshot":
    "进入时的制裁状态快照 — 之后被取消列表的船舶仍为该次过境保留法证标记。",
  "methodology.chokepoints.alertPrefix": "可组合警报",
  "methodology.chokepoints.alertSuffix":
    "：在制裁船舶进入这些区域之一的瞬间触发。",
  "methodology.emissions.title":
    "CO₂ 排放估算 — 内部方法",
  "methodology.emissions.intro":
    "源自 IMO Fourth GHG Study (2020) 的 bottom-up 方法，集成在 AIS 数据流上，无外部依赖。对于每对连续位置：",
  "methodology.emissions.power":
    "默认安装功率和服务速度取自 IMO Annex 1 表格，按货物类别（tanker / container / LNG / bulk …）。",
  "methodology.emissions.skip":
    "间隔 >6 小时或速度 <0.5 节的对被跳过（船舶停泊或锚泊 — v1 中不建模静态辅助负载）。",
  "methodology.emissions.precision":
    "指示性精度 ±25% — 足以用于船队排名、航次比较、租船筛查。监管报告请与 EU MRV 交叉验证（即将推出）。",
  "methodology.emissions.endpointPrefix": "Endpoint",
  "methodology.emissions.endpointMid": "（每船）和",
  "methodology.emissions.endpointSuffix": "（用户 watchlist 聚合）。",
  "methodology.compliance.legalIntro": "完整详情见页面",
  "methodology.compliance.legalLabel": "法律声明",
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

  // /methodology
  "methodology.backLink": "← 精度に戻る",
  "methodology.title": "方法論と SLA",
  "methodology.lead":
    "このページは、プラットフォームのデータソース、モデル、永続化、サービスコミットメントを正確に記述しています。B2B 購買者（トレーダー、保険会社、フォワーダー）のデータチームが署名前に審査するドキュメントです。",
  "methodology.sources.title": "データソース",
  "methodology.sources.aisLive":
    "aisstream.io（コミュニティネットワーク）経由のリアルタイムフィード。欧州 / 米国は優れたカバレッジ、地中海 / ペルシア湾はやや低め。",
  "methodology.sources.aisStatic":
    "ShipStaticData（タイプ、名前、目的地、喫水、ETA broadcast）— 各船から約 6 分ごとに送信。",
  "methodology.sources.geo":
    "bbox + ゾーン（錨地、バース、航路）を港ごとに手動定義。v1 カタログ：ARA、ハンブルク、アルヘシラス、フジャイラ、シンガポール、ヒューストン、Sabine Pass、ラスラファンを含む 51 港。",
  "methodology.sources.proprietary":
    "v1 では独自データの統合なし — プラットフォームは公開 AIS のみに依存。プレミアムソース（Spire、Orbcomm）はカバレッジ薄弱地域用にロードマップ上にあります。",
  "methodology.cargoClass.title": "カーゴ分類",
  "methodology.cargoClass.body":
    "AIS shipType（コード 70-89）とキーワードヒューリスティック（名前、目的地）を組み合わせて、次のいずれかのクラスを割り当てます：crude、product、chemical、LNG、LPG、container、dry-bulk、general-cargo、ro-ro、passenger、fishing、tug、other。既知の制限：命名が悪いか目的地が空の船舶は汎用 shipType にフォールバックします。期待精度：タンカー約 85%、コンテナ約 95%。",
  "methodology.voyages.title": "航海検出",
  "methodology.voyages.open":
    "オープン：船舶（追跡可能クラス：tanker / container / bulk / general / RoRo）が SOG ≥ 1 ノットでアプローチ/錨泊中に観測されたとき、worker 起動後 60 秒の猶予期間後に航海がオープンします。",
  "methodology.voyages.arrival":
    "到着：バースゾーン内で state = moored への遷移（NavStatus 5 または berth ゾーン内 SOG < 0.3 ノット）。",
  "methodology.voyages.departure":
    "出発：到着後、船舶が state = underway に戻り、港中心から距離 > 8 海里。",
  "methodology.voyages.falsePositives":
    "誤検出：タグ、パイロット、漁業は追跡から除外 — カーゴクラスがフィルターとして機能。",
  "methodology.eta.title": "ETA モデル",
  "methodology.eta.naive":
    "ナイーブ推定：距離 / SOG（距離は現在位置と港中心間の大圏距離）。アクティブ航海ごとに 5 分ごとに再計算。",
  "methodology.eta.seasonal":
    "季節補正：UTC 到着時刻ごとに、過去 90 日間のスライディングウィンドウで計算された誤差中央値（predicted − actual）。時間バケットのサンプルが 3 未満の場合、グローバル中央値にフォールバック。30 分ごとに再計算。",
  "methodology.eta.broadcast":
    "比較参照：ShipStaticData メッセージから抽出された ETA broadcast フィールド（船員が手動入力 — しばしば不正確で遅延）。",
  "methodology.eta.metrics":
    "メトリクス：時間単位の RMSE と MAE、予測 ETA と broadcast ETA の両方が利用可能なクローズ済み航海について。クローズ済み航海ごとに更新。デフォルトウィンドウ：30 日。",
  "methodology.eta.roadmap":
    "モデルロードマップ：混雑、潮汐、天候、特定船舶の履歴平均速度の統合。",
  "methodology.anomalies.title": "異常検出",
  "methodology.anomalies.intro":
    "v1：錨泊での絶対 dwell 閾値、カーゴクラスごとに調整。",
  "methodology.anomalies.tanker":
    "タンカー（crude/product/chemical/LNG/LPG）：warn ≥ 12 時間、critical ≥ 48 時間。",
  "methodology.anomalies.container":
    "コンテナ：warn ≥ 6 時間、critical ≥ 24 時間。",
  "methodology.anomalies.other": "その他：warn ≥ 18 時間、critical ≥ 72 時間。",
  "methodology.anomalies.roadmap":
    "ロードマップ：(港、カーゴ) ごとの履歴分布から導出された閾値；ルート逸脱検出；既知ゾーン外のロイタリング検出（\"dark fleet\" シグナル）。",
  "methodology.persistence.title": "永続化と系統",
  "methodology.persistence.storage":
    "node:sqlite（Node 22+ 内蔵）経由の SQLite ストレージ。テーブル：kpi_snapshots、static_ships、positions、voyages、webhook_subscriptions、webhook_deliveries。",
  "methodology.persistence.timestamps":
    "各 kpi_snapshots と voyages 行は港とタイムスタンプを保持。特定時点のメトリクスの完全な再現性。",
  "methodology.persistence.snapshot":
    "ポジションスナップショット：船舶ごとに 1 分間に 1 エントリ（レート制限）。バックテストとモデル再生を可能にします。",
  "methodology.persistence.export":
    "ロードマップ：S3 / GCS への日次 Parquet エクスポート、クライアントデータサイエンティスト用。",
  "methodology.sla.title": "サービスコミットメント（SLA v1）",
  "methodology.sla.uptime": "プラットフォーム可用性",
  "methodology.sla.uptimeValue": "99.5% / 月（MVP）",
  "methodology.sla.latencyLive": "ライブポジション遅延",
  "methodology.sla.latencyLiveValue": "< 30 秒（P95）",
  "methodology.sla.latencyKpi": "KPIs / 航海遅延",
  "methodology.sla.latencyKpiValue": "< 90 秒（P95）",
  "methodology.sla.webhook": "Webhook 配信",
  "methodology.sla.webhookValue": "60 秒で 1 リトライ · 90 日ログ",
  "methodology.sla.retention": "履歴保持",
  "methodology.sla.retentionValue":
    "7 日 KPIs in-memory · SQLite で無制限（90 日コンパクション）",
  "methodology.sla.backfill": "Backfill",
  "methodology.sla.backfillValue":
    "契約上のリクエストに応じて（永続化ポジションの再生）",
  "methodology.compliance.title": "コンプライアンス",
  "methodology.compliance.solas":
    "AIS データ：オープン、SOLAS 条約に従って船舶から送信。船員の個人データなし。",
  "methodology.compliance.gdpr":
    "GDPR：個人データの処理なし。MMSIs は船舶識別子であり、個人識別子ではありません。",
  "methodology.compliance.sanctions":
    "制裁：プラットフォームは自動的に船舶を 4 つの公式リスト（UKSL、OFAC、UN-SC、EU）と照合 — 上記の専用セクションを参照。クライアントは webhooks またはエクスポート経由で独自の独自リストを重ねることができます。",
  "methodology.sanctionsScreening.title":
    "制裁スクリーニング — マルチレジームカバレッジ",
  "methodology.sanctionsScreening.intro":
    "船舶は 4 つの公式リストと照合され、毎日リフレッシュされ、IMO/MMSI でマッチングされます：",
  "methodology.sanctionsScreening.uksl":
    "UK Sanctions List (UKSL) — FCDO、Open Government Licence v3.0。約 600 隻（ロシア、イラン）。2026 年 1 月 28 日の OFSI Consolidated List 廃止以来の権威ある情報源。",
  "methodology.sanctionsScreening.ofac":
    "OFAC SDN — 米国財務省、パブリックドメイン（17 USC §105）。約 1,500 隻。最も広範なグローバルカバレッジ、主にイラン / ロシア / ベネズエラ / キューバ / 北朝鮮。",
  "methodology.sanctionsScreening.un":
    "UN Security Council Consolidated List — 国連公開情報、自由再利用。北朝鮮、リビア、歴史的にイランをカバー。",
  "methodology.sanctionsScreening.eu":
    "EU Consolidated FSF — 欧州委員会、EC Reuse Decision 2011/833/EU。2022 年以降のロシアシャドウフリート、ベラルーシ、シリア。設定で有効化（EU webgate トークン必要）。",
  "methodology.sanctionsScreening.note":
    "7 桁 IMO の優先マッチ（権威）、MMSI をフォールバック。マップ上の赤いハロとボイヤージュテーブルの 🚫 バッジ。",
  "methodology.chokepoints.title":
    "海上チョークポイント通過検出",
  "methodology.chokepoints.intro":
    "12 ゾーンを継続的に追跡：スエズ、ホルムズ、バブ・エル・マンデブ、マラッカ、シンガポール、ボスポラス・ダーダネルス、ジブラルタル、Skagerrak-Kattegat、ドーバー海峡、パナマ、喜望峰、マゼラン。",
  "methodology.chokepoints.detection":
    "受信した AIS ポジションの直近 10 分のスライディングウィンドウで、5 分ごとの point-in-bbox 検出。",
  "methodology.chokepoints.dedup":
    "GPS ジッターを吸収しながら通過を二重化しないよう、6 時間のクールダウンによる重複排除。",
  "methodology.chokepoints.snapshot":
    "エントリ時の制裁状態スナップショット — 後にリストから外された船舶もその通過に対しては法医学的にマークされたままです。",
  "methodology.chokepoints.alertPrefix": "コンポーザブルアラート",
  "methodology.chokepoints.alertSuffix":
    "：制裁対象船舶がこれらのゾーンの 1 つに入った瞬間にトリガーされます。",
  "methodology.emissions.title":
    "CO₂ 排出量推定 — 自社メソッド",
  "methodology.emissions.intro":
    "IMO Fourth GHG Study (2020) から派生したボトムアップアプローチ、外部依存なしで AIS フィード上で統合。連続するポジションの各ペアについて：",
  "methodology.emissions.power":
    "デフォルトの取付出力とサービス速度は IMO Annex 1 テーブルから、カーゴクラスごと（tanker / container / LNG / bulk …）。",
  "methodology.emissions.skip":
    "ギャップ >6 時間または速度 <0.5 ノットのペアはスキップ（バースまたは錨泊中の船舶 — 静止補助負荷は v1 ではモデル化されていません）。",
  "methodology.emissions.precision":
    "指示精度 ±25% — フリートランキング、航海比較、チャーターリングスクリーニングに十分。規制報告には EU MRV と相互参照（近日提供）。",
  "methodology.emissions.endpointPrefix": "Endpoint",
  "methodology.emissions.endpointMid": "（船舶ごと）と",
  "methodology.emissions.endpointSuffix": "（ユーザー watchlist 集計）。",
  "methodology.compliance.legalIntro": "詳細はページで",
  "methodology.compliance.legalLabel": "法的通知",
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
