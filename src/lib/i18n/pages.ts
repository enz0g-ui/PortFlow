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
    "Sécurisés via Stripe. Cycle mensuel ou annuel, annulation possible à tout moment depuis ton espace facturation.",
  "pricing.note.label": "Paiements :",
  "pricing.vatNotice":
    "Prix nets. TVA non applicable — art. 293 B du CGI (franchise en base).",
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
  "precision.stat.broadcast.hintN":
    "ETA armateur · {n} voyages avec broadcast valide",
  "precision.stat.broadcast.insufficient": "—",
  "precision.stat.broadcast.disclaimer":
    "Pas assez de voyages avec ETA broadcast pour un RMSE significatif ({n}/{min}). Beaucoup d'armateurs ne diffusent pas leur ETA — pattern attendu sur les routes Asie/Moyen-Orient.",
  "precision.stat.advantage": "Avantage modèle",
  "precision.stat.gap": "Écart",
  "precision.stat.our.hint": "MAE {mae} · {n} voyages",
  "precision.stat.delta.beats": "Plus précis que l'ETA broadcast",
  "precision.stat.delta.behind": "Moins précis que l'ETA broadcast",
  "precision.stat.delta.notEnough": "Comparaison disponible après quelques voyages",
  "precision.stat.delta.waiting":
    "Comparaison en attente d'un échantillon broadcast significatif",
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
    "Voyage = première observation en approche/mouillage → arrivée à quai, dérivée du statut de navigation et du mouvement.",
  "precision.method.b3":
    "Modèle ETA : distance / SOG corrigé par médiane glissante (calibration multi-axes) avec fallback hiérarchique + pénalité congestion live. Rafraîchi en continu. Roadmap : modèle tidal + tirant d'eau.",
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

  // /welcome (onboarding 3-step)
  "welcome.skip": "Passer →",
  "welcome.setup": "Setup · {step}/3",
  "welcome.step1.title": "Bienvenue sur Port Flow 👋",
  "welcome.step1.lead":
    "En 90 secondes, on configure ton dashboard pour qu'il te soit utile dès aujourd'hui.",
  "welcome.step1.b1":
    "Choisis tes 3 ports prioritaires (Free) — ils seront tes favoris dès le dashboard",
  "welcome.step1.b2":
    "Découvre les features clés — précision ETA, demurrage risk, alertes",
  "welcome.step1.b3":
    "Tu saisiras une API key + alerte dès que tu upgrade",
  "welcome.step1.cta": "Démarrer →",
  "welcome.step1.skip": "Aller direct au dashboard",
  "welcome.step2.title": "Tes 3 ports prioritaires",
  "welcome.step2.lead":
    "Le plan Free te donne accès à 3 ports. Choisis les plus pertinents pour ton activité — tu pourras les modifier à tout moment depuis le sélecteur de port.",
  "welcome.step2.selection": "Sélection : {n}/3",
  "welcome.step2.suggestionsTitle": "Suggestions stratégiques",
  "welcome.step2.allPortsToggle": "Voir les 51 ports disponibles",
  "welcome.step2.ctaEmpty": "Choisis au moins 1 port",
  "welcome.step2.ctaNext": "Suivant — {n} port{s} →",
  "welcome.step2.back": "← Retour",
  "welcome.step3.title": "Tu es prêt 🚀",
  "welcome.step3.lead": "Voilà ce que tu peux faire dès maintenant :",
  "welcome.step3.card1.title": "Tracker un navire",
  "welcome.step3.card1.body":
    "Clique l'icône 📌 sur n'importe quelle ligne de la table Voyages actifs. Il apparaît dans /fleet.",
  "welcome.step3.card1.cta": "Aller au dashboard →",
  "welcome.step3.card2.title": "Mesurer la précision",
  "welcome.step3.card2.body":
    "La page /precision publie le RMSE 30j vs ETA broadcast — ce qu'aucun concurrent ne fait.",
  "welcome.step3.card2.cta": "Voir /precision →",
  "welcome.step3.card3.title": "Évaluer un risque",
  "welcome.step3.card3.body":
    "Sur la fiche d'un navire à quai, le score demurrage estime la proba de retard.",
  "welcome.step3.card3.cta": "Comprendre l'algo →",
  "welcome.step3.card4.title": "Quand tu seras prêt",
  "welcome.step3.card4.body":
    "Plan Starter (129 €) débloque alertes Slack/Telegram/email + API + 25 navires watchlist.",
  "welcome.step3.card4.cta": "Voir les tarifs →",
  "welcome.step3.cta": "Lancer le dashboard →",
  "welcome.skipped": "Setup ignoré.",
  "welcome.suggest.rotterdam": "Hub ARA n°1 — pétrochimie + LNG",
  "welcome.suggest.antwerp": "Hub ARA — chemicals + container",
  "welcome.suggest.hormuz": "Chokepoint pétrolier critique",
  "welcome.suggest.singapore": "Hub bunkering + transbordement Asie",
  "welcome.suggest.fujairah": "Bunkering Moyen-Orient + STS zone",
  "welcome.suggest.rasLaffan": "Export LNG n°1 mondial",
  "welcome.suggest.houston": "Crude + product US Gulf",
  "welcome.suggest.shanghai": "Container n°1 mondial",

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
    "Combinaison des signaux shipType AIS et d'une heuristique textuelle (nom, destination déclarée) pour assigner une classe de cargaison — calibrée par port et profil de flotte. Cas limite : métadonnées AIS minimales → classe générique en fallback.",
  "methodology.voyages.title": "Détection de voyages",
  "methodology.voyages.open":
    "Ouverture : un voyage s'ouvre quand un navire de classe trackable (tanker / container / bulk / general / RoRo) est observé en approche ou mouillage avec mouvement mesurable, après une grace period au démarrage du worker.",
  "methodology.voyages.arrival":
    "Arrivée : transition vers l'état moored dans une zone de quai, dérivée du statut de navigation et du mouvement.",
  "methodology.voyages.departure":
    "Départ : après l'arrivée, retour à l'état underway combiné à un seuil de distance du centre du port.",
  "methodology.voyages.falsePositives":
    "Faux positifs : tugs, pilotes et fishing exclus du tracking — la classe cargaison sert de filtre.",
  "methodology.eta.title": "Modèle ETA",
  "methodology.eta.naive":
    "Estimation naïve : distance / SOG où distance est le grand cercle entre la position courante et le centre du port. Rafraîchie en continu par voyage actif.",
  "methodology.eta.seasonal":
    "Correction saisonnière : médiane glissante de l'erreur (predicted − actual) bucketée par heure d'arrivée. Fallback sur la médiane globale si le bucket est trop maigre. Recompute régulier.",
  "methodology.eta.broadcast":
    "Référence comparée : champ ETA broadcast extrait des messages ShipStaticData (saisi manuellement par l'équipage du navire — souvent imprécis et tardif).",
  "methodology.eta.metrics":
    "Métriques : RMSE et MAE en heures, sur les voyages clos avec ETA prédit ET ETA broadcast disponibles. Mises à jour à chaque voyage clos.",
  "methodology.eta.roadmap":
    "Roadmap modèle : intégration congestion, marées, météo, vitesse moyenne historique du navire spécifique.",
  "methodology.anomalies.title": "Détection d'anomalies",
  "methodology.anomalies.intro":
    "v1 : seuils absolus de dwell au mouillage, ajustés par classe de cargaison.",
  "methodology.anomalies.tanker":
    "Tankers (crude/product/chemical/LNG/LPG) — fenêtre de dwell la plus longue acceptable.",
  "methodology.anomalies.container":
    "Containers — fenêtre de dwell la plus serrée (classe critique à la rotation).",
  "methodology.anomalies.other":
    "Autres classes — fenêtre de dwell intermédiaire.",
  "methodology.anomalies.roadmap":
    "Roadmap : seuils dérivés de la distribution historique par (port, cargo) ; détection de déviation de route filée ; détection de loitering hors zone connue (signal « dark fleet »).",
  "methodology.persistence.title": "Persistance & lineage",
  "methodology.persistence.storage":
    "Stockage SQL relationnel avec lignage horodaté. Chaque métrique est traçable à ses positions sources.",
  "methodology.persistence.timestamps":
    "Chaque ligne métrique et voyage porte le port et le timestamp. Reproductibilité totale d'une métrique à un instant donné.",
  "methodology.persistence.snapshot":
    "Snapshot des positions : écritures rate-limitées par navire. Permet le backtesting et la rejouabilité du modèle.",
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
    "Détection point-in-bbox en continu sur une fenêtre glissante de positions AIS.",
  "methodology.chokepoints.dedup":
    "Dédup via cooldown pour absorber le jitter GPS sans doubler les transits.",
  "methodology.chokepoints.snapshot":
    "Snapshot de l'état sanctionné au moment de l'entrée — un navire radié ultérieurement reste forensiquement marqué pour ce transit-là.",
  "methodology.chokepoints.coverage":
    "Couverture par AIS terrestre — fiabilité optimale sur les chokepoints côtiers (Hormuz, Bab el-Mandeb, Malacca, Singapour, Bosphore, Pas-de-Calais, Gibraltar, Suez, Panama). Zones plus offshore (Cap de Bonne-Espérance, Magellan, Méditerranée centrale) : détection au passage des stations côtières. Couverture satellite continue via BYO key Spire / Orbcomm (Pro+).",
  "methodology.chokepoints.alertPrefix": "Alerte composable",
  "methodology.chokepoints.alertSuffix":
    ": déclenchée au moment exact où un navire sous sanctions entre dans une de ces zones.",
  "methodology.emissions.title":
    "Estimation des émissions CO₂ — méthode in-house",
  "methodology.emissions.intro":
    "Approche bottom-up dérivée de l'IMO Fourth GHG Study (2020), intégrée sur le flux AIS sans dépendance externe.",
  "methodology.emissions.power":
    "Puissance installée et vitesse de service par défaut tirées des tables IMO Annex 1, par classe de cargaison (tanker / container / LNG / vrac …).",
  "methodology.emissions.skip":
    "Périodes à quai ou au mouillage exclues du comptage (la consommation auxiliaire stationnaire n'est pas modélisée en v1). Les segments hors couverture AIS terrestre sont également exclus — voir limitations de couverture.",
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
    "Filtrage sanctions multi-régime intégré (UKSL + OFAC + UN-SC + EU) — voir page méthodologie. Le client peut aussi superposer ses propres listes via l'API.",
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
  "legal.privacy.controller": "Responsable de traitement",
  "legal.privacy.entityName":
    "Laurent Guglielmetti — entrepreneur individuel (micro-entreprise)",
  "legal.privacy.entityTrade":
    "Nom commercial : octopodus · Marque exploitée : Port Flow",
  "legal.privacy.entityAddress":
    "Siège : 21 rue Hippolyte Noiret, 08300 Rethel, France",
  "legal.privacy.entityIds":
    "SIREN 491 489 654 · SIRET 491 489 654 00047 · APE 6201Z",
  "legal.privacy.entityVat":
    "TVA non applicable — art. 293 B du CGI (franchise en base)",
  "legal.privacy.contactLine": "Contact :",
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
    "La plateforme rapproche automatiquement les navires de quatre listes officielles publiques (UK Sanctions List, OFAC SDN, UN Security Council Consolidated List, EU Consolidated FSF) — voir la page méthodologie pour la couverture détaillée et les fréquences de mise à jour.",
  "legal.sanctions.b2":
    "Le client utilisateur (trader, assureur, freight forwarder) reste responsable de l'application de ses propres listes et procédures de screening complémentaires (KYC, EDD, listes propriétaires).",
  "legal.sanctions.b3":
    "La plateforme est neutre commercialement : aucun navire n'est masqué sur des critères autres que les listes officielles publiques citées ci-dessus.",
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
    "Secured via Stripe. Monthly or yearly cycle, cancel anytime from your billing portal.",
  "pricing.note.label": "Billing:",
  "pricing.vatNotice":
    "Net prices. VAT not applicable — French CGI art. 293 B (small-business exemption).",
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
  "precision.stat.broadcast.hintN":
    "Carrier-declared ETA · {n} voyages with valid broadcast",
  "precision.stat.broadcast.insufficient": "—",
  "precision.stat.broadcast.disclaimer":
    "Not enough voyages with broadcast ETA to compute a meaningful RMSE ({n}/{min}). Many carriers do not broadcast their ETA — expected pattern on Asia/Middle-East routes.",
  "precision.stat.advantage": "Model advantage",
  "precision.stat.gap": "Gap",
  "precision.stat.our.hint": "MAE {mae} · {n} voyages",
  "precision.stat.delta.beats": "More accurate than broadcast ETA",
  "precision.stat.delta.behind": "Less accurate than broadcast ETA",
  "precision.stat.delta.notEnough": "Comparison available after a few voyages",
  "precision.stat.delta.waiting":
    "Comparison pending a meaningful broadcast sample",
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
    "Voyage = first observation in approach/anchorage → moored at berth, derived from navigation state and motion.",
  "precision.method.b3":
    "ETA model: distance / SOG corrected by rolling median (multi-axis calibration) with hierarchical fallback + live congestion penalty. Refreshed continuously. Roadmap: tide-aware + draught-aware refinement.",
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

  // /welcome (onboarding 3-step)
  "welcome.skip": "Skip →",
  "welcome.setup": "Setup · {step}/3",
  "welcome.step1.title": "Welcome to Port Flow 👋",
  "welcome.step1.lead":
    "In 90 seconds, we'll configure your dashboard to make it useful from day one.",
  "welcome.step1.b1":
    "Pick your 3 priority ports (Free) — they'll be your dashboard favourites",
  "welcome.step1.b2":
    "Discover key features — ETA precision, demurrage risk, alerts",
  "welcome.step1.b3":
    "Add an API key + alerts when you upgrade",
  "welcome.step1.cta": "Start →",
  "welcome.step1.skip": "Go straight to dashboard",
  "welcome.step2.title": "Your 3 priority ports",
  "welcome.step2.lead":
    "The Free plan gives you access to 3 ports. Pick the most relevant to your activity — you can change them anytime from the port selector.",
  "welcome.step2.selection": "Selection: {n}/3",
  "welcome.step2.suggestionsTitle": "Strategic suggestions",
  "welcome.step2.allPortsToggle": "See all 51 available ports",
  "welcome.step2.ctaEmpty": "Pick at least 1 port",
  "welcome.step2.ctaNext": "Next — {n} port{s} →",
  "welcome.step2.back": "← Back",
  "welcome.step3.title": "You're set 🚀",
  "welcome.step3.lead": "Here's what you can do right now:",
  "welcome.step3.card1.title": "Track a vessel",
  "welcome.step3.card1.body":
    "Click the 📌 icon on any row of the Active Voyages table. It will appear in /fleet.",
  "welcome.step3.card1.cta": "Go to dashboard →",
  "welcome.step3.card2.title": "Measure precision",
  "welcome.step3.card2.body":
    "The /precision page publishes the 30-day RMSE vs broadcast ETA — something no competitor does.",
  "welcome.step3.card2.cta": "See /precision →",
  "welcome.step3.card3.title": "Score a risk",
  "welcome.step3.card3.body":
    "On a moored vessel's detail card, the demurrage score estimates delay probability.",
  "welcome.step3.card3.cta": "Understand the algo →",
  "welcome.step3.card4.title": "When you're ready",
  "welcome.step3.card4.body":
    "Starter plan (€129) unlocks Slack/Telegram/email alerts + API + 25-vessel watchlist.",
  "welcome.step3.card4.cta": "See pricing →",
  "welcome.step3.cta": "Launch dashboard →",
  "welcome.skipped": "Setup skipped.",
  "welcome.suggest.rotterdam": "ARA hub #1 — petrochemicals + LNG",
  "welcome.suggest.antwerp": "ARA hub — chemicals + container",
  "welcome.suggest.hormuz": "Critical oil chokepoint",
  "welcome.suggest.singapore": "Bunkering hub + Asia transshipment",
  "welcome.suggest.fujairah": "Middle East bunkering + STS zone",
  "welcome.suggest.rasLaffan": "World #1 LNG export",
  "welcome.suggest.houston": "US Gulf crude + product",
  "welcome.suggest.shanghai": "World #1 container",

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
    "Combination of AIS shipType signals and a textual heuristic (vessel name, declared destination) to assign a cargo class — tuned per port and fleet profile. Edge case: minimal AIS metadata falls back to a generic class.",
  "methodology.voyages.title": "Voyage detection",
  "methodology.voyages.open":
    "Open: a voyage opens when a trackable-class vessel (tanker / container / bulk / general / RoRo) is observed approaching or anchoring with measurable motion, after a worker startup grace period.",
  "methodology.voyages.arrival":
    "Arrival: transition to the moored state within a berth zone, derived from navigation status and motion.",
  "methodology.voyages.departure":
    "Departure: after arrival, transition back to underway combined with a distance threshold from port center.",
  "methodology.voyages.falsePositives":
    "False positives: tugs, pilots and fishing vessels excluded from tracking — cargo class acts as a filter.",
  "methodology.eta.title": "ETA model",
  "methodology.eta.naive":
    "Naive estimate: distance / SOG where distance is the great circle between current position and port center. Refreshed continuously per active voyage.",
  "methodology.eta.seasonal":
    "Seasonal correction: rolling median of error (predicted − actual) bucketed by arrival hour. Falls back to the global median when the bucket sample is too thin. Recomputed regularly.",
  "methodology.eta.broadcast":
    "Comparison reference: ETA broadcast field extracted from ShipStaticData messages (entered manually by the vessel's crew — often imprecise and late).",
  "methodology.eta.metrics":
    "Metrics: RMSE and MAE in hours, computed over closed voyages with both predicted ETA AND broadcast ETA available. Updated on each closed voyage.",
  "methodology.eta.roadmap":
    "Model roadmap: congestion integration, tides, weather, vessel-specific historical average speed.",
  "methodology.anomalies.title": "Anomaly detection",
  "methodology.anomalies.intro":
    "v1: absolute dwell-at-anchor thresholds, tuned by cargo class.",
  "methodology.anomalies.tanker":
    "Tankers (crude/product/chemical/LNG/LPG) — longest acceptable dwell window.",
  "methodology.anomalies.container":
    "Containers — tightest dwell window (turnover-critical class).",
  "methodology.anomalies.other":
    "Other classes — intermediate dwell window.",
  "methodology.anomalies.roadmap":
    "Roadmap: thresholds derived from the historical (port, cargo) distribution; route-deviation detection; out-of-zone loitering detection (\"dark fleet\" signal).",
  "methodology.persistence.title": "Persistence & lineage",
  "methodology.persistence.storage":
    "Relational SQL storage with timestamped lineage. Every metric is traceable to its source positions.",
  "methodology.persistence.timestamps":
    "Every metric and voyage row carries the port id and a timestamp. Full reproducibility of any metric at a given instant.",
  "methodology.persistence.snapshot":
    "Position snapshots: per-vessel rate-limited writes. Enables backtesting and replayability of the model.",
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
    "Continuous point-in-bbox detection over a rolling AIS window.",
  "methodology.chokepoints.dedup":
    "Dedup via a cooldown window to absorb GPS jitter without doubling transits.",
  "methodology.chokepoints.snapshot":
    "Sanctioned-state snapshot at entry — a vessel later delisted remains forensically marked for that transit.",
  "methodology.chokepoints.coverage":
    "Coverage via terrestrial AIS — best reliability on coastal chokepoints (Hormuz, Bab el-Mandeb, Malacca, Singapore, Bosphorus, Dover, Gibraltar, Suez, Panama). Deeper-ocean zones (Cape of Good Hope, Magellan, central Mediterranean) rely on coastal-station passes. Continuous satellite coverage via BYO Spire / Orbcomm key (Pro+).",
  "methodology.chokepoints.alertPrefix": "Composable alert",
  "methodology.chokepoints.alertSuffix":
    ": fired the moment a sanctioned vessel enters one of these zones.",
  "methodology.emissions.title":
    "CO₂ emissions estimation — in-house method",
  "methodology.emissions.intro":
    "Bottom-up approach derived from the IMO Fourth GHG Study (2020), integrated over the AIS feed with no external dependency.",
  "methodology.emissions.power":
    "Installed power and design service speed defaults from IMO Annex 1 tables, by cargo class (tanker / container / LNG / bulk / etc.).",
  "methodology.emissions.skip":
    "Periods at berth or at anchor are excluded from the count (stationary auxiliary load is not modelled in v1). Segments outside terrestrial AIS coverage are also excluded — see coverage limits.",
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
    "Multi-regime sanctions screening built in (UKSL + OFAC + UN-SC + EU) — see methodology page. Customers can also layer their own lists via the API.",
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
  "legal.privacy.controller": "Data controller",
  "legal.privacy.entityName":
    "Laurent Guglielmetti — French sole proprietorship (entrepreneur individuel, micro-entreprise regime)",
  "legal.privacy.entityTrade":
    "Trade name: octopodus · Operating brand: Port Flow",
  "legal.privacy.entityAddress":
    "Registered office: 21 rue Hippolyte Noiret, 08300 Rethel, France",
  "legal.privacy.entityIds":
    "SIREN 491 489 654 · SIRET 491 489 654 00047 · NAF/APE 6201Z",
  "legal.privacy.entityVat":
    "VAT not applicable — French CGI art. 293 B (small-business exemption)",
  "legal.privacy.contactLine": "Contact:",
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
    "The platform automatically reconciles vessels against four public official lists (UK Sanctions List, OFAC SDN, UN Security Council Consolidated List, EU Consolidated FSF) — see the methodology page for detailed coverage and refresh cadence.",
  "legal.sanctions.b2":
    "The customer (trader, insurer, freight forwarder) remains responsible for applying its own complementary lists and screening procedures (KYC, EDD, proprietary watchlists).",
  "legal.sanctions.b3":
    "The platform is commercially neutral: no vessel is hidden on criteria other than the public official lists cited above.",
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
    "Beveiligd via Stripe. Maandelijkse of jaarlijkse cyclus, opzegging op elk moment vanuit je facturatieportaal.",
  "pricing.note.label": "Facturatie:",
  "pricing.vatNotice":
    "Netto prijzen. Btw niet van toepassing — Franse CGI art. 293 B (kleinondernemersregeling).",
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
    "Reis = eerste observatie in nadering/ankerage → afgemeerd aan kade, afgeleid uit navigatiestatus en beweging.",
  "precision.method.b3":
    "ETA-model: afstand / SOG met glijdende mediaan-correctie + live congestie-penalty. Continu ververst. Roadmap: tij- en diepgang-bewuste verfijning.",
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
    "Combinatie van AIS shipType-signalen en een tekstuele heuristiek (naam, gedeclareerde bestemming) om een lading-klasse toe te wijzen — gekalibreerd per haven en vlootprofiel. Randgeval: minimale AIS-metadata valt terug op een generieke klasse.",
  "methodology.voyages.title": "Reizen-detectie",
  "methodology.voyages.open":
    "Opening: een reis opent wanneer een schip van trackbare klasse (tanker / container / bulk / general / RoRo) waargenomen wordt in nadering of ankering met meetbare beweging, na een grace-periode na worker-start.",
  "methodology.voyages.arrival":
    "Aankomst: overgang naar de moored-staat in een ligplaats-zone, afgeleid van navigatie-status en beweging.",
  "methodology.voyages.departure":
    "Vertrek: na aankomst, terugkeer naar underway gecombineerd met een afstandsdrempel vanaf het havencentrum.",
  "methodology.voyages.falsePositives":
    "Valse positieven: tugs, loodsen en visserij uitgesloten van tracking — de cargo-klasse dient als filter.",
  "methodology.eta.title": "ETA-model",
  "methodology.eta.naive":
    "Naïeve schatting: afstand / SOG waar afstand de groothoek is tussen huidige positie en havencentrum. Continu ververst per actieve reis.",
  "methodology.eta.seasonal":
    "Seizoenscorrectie: glijdende mediaan van de fout (predicted − actual) gebucketeerd per aankomstuur. Fallback op globale mediaan als de bucket te dun is. Regelmatige recompute.",
  "methodology.eta.broadcast":
    "Vergeleken referentie: ETA-broadcast veld geëxtraheerd uit ShipStaticData berichten (handmatig ingevoerd door bemanning — vaak onnauwkeurig en verlaat).",
  "methodology.eta.metrics":
    "Metrieken: RMSE en MAE in uren, op afgesloten reizen met zowel voorspelde als broadcast ETA beschikbaar. Bijgewerkt bij elke afgesloten reis.",
  "methodology.eta.roadmap":
    "Model-roadmap: integratie congestie, getijden, weer, historische gemiddelde snelheid van het specifieke schip.",
  "methodology.anomalies.title": "Anomalie-detectie",
  "methodology.anomalies.intro":
    "v1: absolute drempels van dwell op anker, aangepast per cargo-klasse.",
  "methodology.anomalies.tanker":
    "Tankers (crude/product/chemical/LNG/LPG) — langste aanvaardbare dwell-venster.",
  "methodology.anomalies.container":
    "Containers — strakste dwell-venster (klasse kritiek voor turnover).",
  "methodology.anomalies.other":
    "Andere klassen — tussenliggend dwell-venster.",
  "methodology.anomalies.roadmap":
    "Roadmap: drempels afgeleid van historische verdeling per (haven, cargo); detectie van koersafwijking; loitering-detectie buiten bekende zones (\"dark fleet\" signaal).",
  "methodology.persistence.title": "Persistentie & lineage",
  "methodology.persistence.storage":
    "Relationele SQL-opslag met getimestampte lineage. Elke metric is traceerbaar naar zijn bronposities.",
  "methodology.persistence.timestamps":
    "Elke metric- en reis-rij draagt de haven en het tijdstempel. Volledige reproduceerbaarheid van een metric op een gegeven moment.",
  "methodology.persistence.snapshot":
    "Positie-snapshot: rate-limited schrijfacties per schip. Maakt backtesting en model-replay mogelijk.",
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
    "Continue point-in-bbox detectie over een glijdend AIS-venster.",
  "methodology.chokepoints.dedup":
    "Dedup via een cooldown-venster om GPS-jitter te absorberen zonder transits te verdubbelen.",
  "methodology.chokepoints.snapshot":
    "Sanctie-status snapshot bij binnenkomst — een schip dat later van de lijst wordt gehaald blijft forensisch gemarkeerd voor die transit.",
  "methodology.chokepoints.coverage":
    "Dekking via terrestrische AIS — beste betrouwbaarheid op kust-chokepoints (Hormuz, Bab el-Mandeb, Malacca, Singapore, Bosporus, Nauw van Calais, Gibraltar, Suez, Panama). Diepere-oceaan zones (Kaap de Goede Hoop, Magellaan, centrale Middellandse Zee): detectie bij passage van kuststations. Continue satellietdekking via BYO Spire/Orbcomm-sleutel (Pro+).",
  "methodology.chokepoints.alertPrefix": "Composeerbare alert",
  "methodology.chokepoints.alertSuffix":
    ": geactiveerd op het moment dat een gesanctioneerd schip een van deze zones binnenkomt.",
  "methodology.emissions.title":
    "CO₂-emissieschatting — in-house methode",
  "methodology.emissions.intro":
    "Bottom-up benadering afgeleid van IMO Fourth GHG Study (2020), geïntegreerd over de AIS-feed zonder externe afhankelijkheid.",
  "methodology.emissions.power":
    "Geïnstalleerd vermogen en design-snelheid standaard uit IMO Annex 1 tabellen, per cargo-klasse (tanker / container / LNG / bulk …).",
  "methodology.emissions.skip":
    "Periodes aan ligplaats of voor anker worden uitgesloten van de telling (stationaire hulpbelasting wordt in v1 niet gemodelleerd). Segmenten buiten terrestrische AIS-dekking worden eveneens uitgesloten — zie dekkingsbeperkingen.",
  "methodology.emissions.precision":
    "Indicatieve precisie ±25% — voldoende voor vloot-ranking, reisvergelijking, chartering screening. Voor regelgeving rapportage, kruis met EU MRV (toekomstig).",
  "methodology.emissions.endpointPrefix": "Endpoint",
  "methodology.emissions.endpointMid": "(per schip) en",
  "methodology.emissions.endpointSuffix": "(gebruiker watchlist aggregaat).",
  "methodology.compliance.legalIntro": "Volledige details op de pagina",
  "methodology.compliance.legalLabel": "Juridische vermelding",

  // /legal
  "legal.backLink": "← terug",
  "legal.methodologyLink": "Methodologie →",
  "legal.title": "Juridische vermeldingen",
  "legal.lead":
    "Deze pagina bundelt data-attributies, gebruiksvoorwaarden, privacy, compliance en beperkingen. Verwezen vanuit de footer van elke pagina.",
  "legal.maritime.title": "Maritieme kennisgeving",
  "legal.maritime.notForNav": "Not for navigation.",
  "legal.maritime.body":
    "Posities, ETA's, anomalieën en indicatoren gepubliceerd door Port Flow zijn afgeleid van publieke AIS-signalen, weerdata en satellietbeelden. Ze kunnen fouten, vertragingen en omissies bevatten. Dit platform vervangt op geen enkele wijze een gecertificeerd navigatiesysteem of een operationele loodsdienst. Gebruik voor maritieme veiligheid, loodsen of kritieke operationele besluiten is uitdrukkelijk uitgesloten.",
  "legal.tos.title": "Gebruiksvoorwaarden",
  "legal.tos.b1":
    "Platform geleverd \"as is\", zonder garantie van beschikbaarheid, juistheid of geschiktheid voor een bepaald doel.",
  "legal.tos.b2.intro": "Service-toezeggingen gedetailleerd op de",
  "legal.tos.b2.linkLabel": "methodologiepagina",
  "legal.tos.b2.outro": " (SLA v1).",
  "legal.tos.b3":
    "Weergegeven data kan afgeleid en getransformeerd zijn. Het platform is geen reseller van ruwe AIS-data.",
  "legal.tos.b4":
    "Elk commercieel gebruik vereist naleving van de voorwaarden van bronleveranciers (met name betaling Spire / MarineTraffic / Orbcomm indien geactiveerd).",
  "legal.privacy.title": "Privacybeleid (AVG)",
  "legal.privacy.controller": "Verwerkingsverantwoordelijke",
  "legal.privacy.entityName":
    "Laurent Guglielmetti — Franse eenmanszaak (entrepreneur individuel, micro-entreprise-regime)",
  "legal.privacy.entityTrade":
    "Handelsnaam: octopodus · Geëxploiteerd merk: Port Flow",
  "legal.privacy.entityAddress":
    "Statutaire zetel: 21 rue Hippolyte Noiret, 08300 Rethel, Frankrijk",
  "legal.privacy.entityIds":
    "SIREN 491 489 654 · SIRET 491 489 654 00047 · APE 6201Z",
  "legal.privacy.entityVat":
    "Btw niet van toepassing — Franse CGI art. 293 B (kleinondernemersregeling)",
  "legal.privacy.contactLine": "Contact:",
  "legal.privacy.intro":
    "Deze sectie beschrijft de verzamelde persoonsgegevens, hun doeleinden en de rechten van de gebruiker conform de AVG (EU) 2016/679. Voor EU-klanten is een ondertekenbaar DPA beschikbaar op aanvraag bij privacy@portflow.uk.",
  "legal.privacy.dpaBold": "Ondertekenbaar DPA",
  "legal.privacy.dataTitle": "Verzamelde data en doeleinden",
  "legal.privacy.col.data": "Data",
  "legal.privacy.col.purpose": "Doel",
  "legal.privacy.col.basis": "Rechtsgrond",
  "legal.privacy.col.retention": "Bewaring",
  "legal.privacy.row1.data": "E-mail + Clerk-ID",
  "legal.privacy.row1.purpose": "Authenticatie, support",
  "legal.privacy.row1.basis": "Contractuele uitvoering",
  "legal.privacy.row1.retention": "Zolang account actief + 12 maanden",
  "legal.privacy.row2.data": "Stripe klant-ID + betalingsgeschiedenis",
  "legal.privacy.row2.purpose": "Facturatie, abonnement",
  "legal.privacy.row2.basis": "Contractuele uitvoering",
  "legal.privacy.row2.retention": "10 jaar (boekhoudkundige verplichting)",
  "legal.privacy.row3.data":
    "Webhook-URL's Slack/Discord/Telegram, alert-e-mail",
  "legal.privacy.row3.purpose": "Verzenden van door u geconfigureerde alerts",
  "legal.privacy.row3.basis": "Expliciete toestemming (UI-invoer)",
  "legal.privacy.row3.retention": "Tot verwijdering door gebruiker",
  "legal.privacy.row4.data":
    "Externe API-sleutels (Spire/VIIRS/Orbcomm) AES-256-GCM-versleuteld",
  "legal.privacy.row4.purpose": "BYO key-integratie",
  "legal.privacy.row4.basis": "Expliciete toestemming (UI-invoer)",
  "legal.privacy.row4.retention": "Tot verwijdering door gebruiker",
  "legal.privacy.row5.data": "Watchlist (MMSI schepen, port-IDs)",
  "legal.privacy.row5.purpose": "Dashboard-personalisatie",
  "legal.privacy.row5.basis": "Contractuele uitvoering",
  "legal.privacy.row5.retention": "Zolang account actief",
  "legal.privacy.row6.data": "API-logs (timestamp, key prefix, endpoint)",
  "legal.privacy.row6.purpose": "Audit, beveiliging, anti-misbruik",
  "legal.privacy.row6.basis": "Gerechtvaardigd belang",
  "legal.privacy.row6.retention": "90 dagen rolling",
  "legal.privacy.subTitle": "Verwerkers (sub-processors)",
  "legal.privacy.sub.clerk":
    "Clerk Inc. (VS) — gebruikersauthenticatie · clerk.com (DPA beschikbaar)",
  "legal.privacy.sub.stripe":
    "Stripe Inc. (VS) — facturatie · stripe.com (DPA + SCCs beschikbaar)",
  "legal.privacy.sub.do":
    "DigitalOcean LLC (Frankfurt EU regio) — hosting · digitalocean.com (DPA)",
  "legal.privacy.sub.cloudflare":
    "Cloudflare Inc. (VS) — DNS + DDoS · cloudflare.com (DPA + SCCs)",
  "legal.privacy.sub.resend":
    "Resend Inc. (VS) — verzending alert-e-mails (indien geactiveerd) · resend.com (DPA)",
  "legal.privacy.sub.aisstream":
    "aisstream.io — publieke AIS-feed (geen persoonsgegevens van gebruiker doorgegeven)",
  "legal.privacy.sub.copernicus":
    "Copernicus Data Space (ESA) — Sentinel-1-satellietbeelden (publiek)",
  "legal.privacy.transfersTitle": "Overdrachten buiten EU",
  "legal.privacy.transfersBody":
    "Clerk, Stripe, Cloudflare en Resend opereren vanuit de VS. Allemaal beschikken over Standard Contractual Clauses (SCCs) EU-VS. AIS- en havenonderdata (publiek van aard) vormen geen overgedragen persoonsgegevens.",
  "legal.privacy.rightsTitle": "Uw rechten",
  "legal.privacy.rights.access":
    "Toegang, rectificatie — alles is zichtbaar in /account, direct aanpasbaar",
  "legal.privacy.rights.delete":
    "Verwijdering — verwijder uw account via Clerk (de API-sleutels + watchlist + alerts cascaderen)",
  "legal.privacy.rights.portability":
    "Overdraagbaarheid — CSV-export van uw watchlist/vloot beschikbaar via /fleet (Starter+)",
  "legal.privacy.rights.opt":
    "Verzet, intrekking van toestemming — alerts deactiveren of sleutels intrekken op elk moment in /account en /sources",
  "legal.privacy.rights.complaint":
    "Klacht — bij de AP (Nederland), CNIL (Frankrijk) of een andere Europese toezichthouder",
  "legal.privacy.securityTitle": "Technische beveiliging",
  "legal.privacy.security.tls":
    "HTTPS TLS 1.3 verplicht (Let's Encrypt). HTTP omgeleid.",
  "legal.privacy.security.encryption":
    "At-rest-versleuteling van gebruikersgeheimen (externe API-sleutels): AES-256-GCM met server-master key",
  "legal.privacy.security.passwords":
    "Wachtwoorden beheerd door Clerk (PBKDF2/Argon2id, nooit in plaintext)",
  "legal.privacy.security.audit":
    "Auditeerbare logs (audit_log-tabel) bij abonnementswijzigingen en API-toegang",
  "legal.privacy.security.mmsi":
    "Weergegeven MMSI's = scheepsidentificatoren toegekend door de ITU aan de vlag — geen persoonsidentificatoren",
  "legal.privacy.security.cookies":
    "Geen tracking cookies van derden. De enige lokale opslag is de browsercache voor tab-resilience, leegbaar.",
  "legal.dpa.title": "Data Processing Agreement (DPA) — samenvatting",
  "legal.dpa.intro":
    "Voor elke EU-zakelijke klant die Port Flow gebruikt voor data-verwerking in een B2B-context, is een DPA conform artikel 28 AVG beschikbaar.",
  "legal.dpa.role":
    "Port Flow handelt als verwerker voor data verwerkt in het kader van de service (watchlist, alerts, API-sleutels)",
  "legal.dpa.noSecondary":
    "Geen secundaire verwerking: geen reclame, doorverkoop, commerciële profilering",
  "legal.dpa.breach": "Melding van elke datalek binnen 72 uur",
  "legal.dpa.audits":
    "Medewerking aan jaarlijkse audits van de klant (op 30 dagen vooraankondiging)",
  "legal.dpa.endOfContract":
    "Verwijdering of teruggave van data aan het einde van het contract (CSV-export + DB-purge op verzoek)",
  "legal.dpa.subList":
    "Lijst van verwerkers hierboven, wijzigbaar met 30 dagen vooraankondiging",
  "legal.dpa.outro": "DPA ondertekend op aanvraag bij",
  "legal.dpa.outroSuffix": " — indicatieve doorlooptijd 48 werkuren.",
  "legal.sanctions.title": "Sancties & compliance",
  "legal.sanctions.b1":
    "Het platform reconciliëert automatisch schepen tegen vier publieke officiële lijsten (UK Sanctions List, OFAC SDN, UN Security Council Consolidated List, EU Consolidated FSF) — zie methodologiepagina voor gedetailleerde dekking en refresh-cadens.",
  "legal.sanctions.b2":
    "De klant (trader, verzekeraar, expediteur) blijft verantwoordelijk voor toepassing van zijn eigen aanvullende lijsten en screeningsprocedures (KYC, EDD, eigen watchlists).",
  "legal.sanctions.b3":
    "Het platform is commercieel neutraal: geen schip wordt verborgen op andere criteria dan de hierboven aangehaalde publieke officiële lijsten.",
  "legal.citation.title": "Academische citatie",
  "legal.citation.body":
    "Indien u Port Flow citeert in een publicatie, vermeld dan:",

  // /guide
  "guide.backLink": "← terug naar dashboard",
  "guide.methodologyLink": "Methodologie →",
  "guide.title": "Gebruikershandleiding",
  "guide.lead":
    "Port Flow biedt een realtime overzicht van maritieme stromen op 51 strategische havens (ARA, bunkering, LNG export). Deze pagina legt uit hoe u het dashboard leest, wie er waarde uithaalt, en hoe u de data integreert in uw pipelines.",
  "guide.audience.title": "Voor wie is dit?",
  "guide.audience.traders":
    "Grondstoffenhandelaren (olie, LNG, chemie) — nauwkeurige ETA en congestie-indicatoren voeden prijsmodellen. Primaire doelgroep van het platform.",
  "guide.audience.forwarders":
    "Expediteurs — anticipatie van demurrage-overschrijdingen, routing-keuzes.",
  "guide.audience.insurers":
    "Maritieme verzekeraars — anomaliedetectie (loitering, abnormale dwell), risk pricing.",
  "guide.audience.quants":
    "Data scientists / quants — historische feed voor backtesting van macro-strategieën (havenactiviteit = economische proxy).",
  "guide.dashboard.title": "Het dashboard lezen in 30 seconden",
  "guide.dashboard.portSelector":
    "Havenselector rechtsboven — wijzigt de geobserveerde haven. De native naam verschijnt tussen haakjes als de actieve taal verschilt (bv. Antwerpen, Hamburg, الفجيرة).",
  "guide.dashboard.langSelector":
    "Taalselector ernaast — 8 zakelijke talen: FR, EN, NL, DE, ES, AR (met automatische RTL), ZH, JA.",
  "guide.dashboard.toggle":
    "Toggle Alle / Tankers — filtert direct de kaart en tellers tot de 5 tanker-subklassen (crude, product, chemical, LNG, LPG).",
  "guide.dashboard.kpis":
    "KPI-rij — totaal schepen, stationair (congestie-proxy), in vaart, aan ligplaats, binnenkomenden/u, actieve gevolgde reizen.",
  "guide.dashboard.map":
    "Kaart — kleur = AIS-categorie, grootte = state. De gestippelde rechthoeken zijn de benoemde zones (anchorage, berth, channel).",
  "guide.dashboard.voyages":
    "Actieve reizen — tabel gesorteerd op voorspelde ETA. De kolom \"ETA broadcast\" is het tijdstip dat de bemanning heeft ingevoerd; vergelijk met de afwijkingen van het model.",
  "guide.dashboard.precision":
    "ETA precision — RMSE van ons model vs RMSE van ETA broadcast. Dit is de belangrijkste kwaliteitsindicator.",
  "guide.dashboard.anomalies":
    "Anomalieën — schepen abnormaal lang aan anker voor hun klasse. Cruciaal te bewaken voor congestie of operationele bijzonderheden.",
  "guide.dashboard.flow":
    "Flux 6 u — binnenkomenden / uitgaanden / stationair over de laatste 6 uur. Korte trend.",
  "guide.precision.title": "ETA precision pagina",
  "guide.precision.body":
    "Toegankelijk via de ETA precision-knop of /precision. Publieke weergave bedoeld om aan prospects de kwaliteit van het model te demonstreren. Drie sleutelindicatoren: RMSE model, RMSE broadcast, afwijking in %. Lijst van 50 laatste afgesloten reizen met fout in uren (groen < 1 u, amber < 3 u, rood daarboven). Methodologie onderaan pagina. Filter op venster 7/30/90 dagen.",
  "guide.api.title": "API-integratie",
  "guide.api.intro": "Publieke API onder /api/v1, geauthenticeerd door bearer token. OpenAPI-specificatie op",
  "guide.api.endpoints":
    "Beschikbare endpoints: /ports, /ports/{id}/snapshot, /ports/{id}/vessels, /ports/{id}/voyages/active, /ports/{id}/voyages/closed, /ports/{id}/anomalies, /webhooks.",
  "guide.webhooks.title": "Webhooks (alerts)",
  "guide.webhooks.intro":
    "Abonneer op een event om een HMAC-SHA256-getekende POST te ontvangen wanneer een drempel wordt overschreden.",
  "guide.webhooks.headers":
    "Headers geleverd op elke aflevering: X-Port-Flow-Event en X-Port-Flow-Signature: t=<ts>,v1=<hex> (HMAC-SHA256 van de payload met timestamp prefix). Verificatie aan ontvangerszijde: hmac_sha256(secret, \"{ts}.{body}\").",
  "guide.webhooks.events":
    "Ondersteunde events: congestion.threshold / congestion.cleared, anomaly.detected, voyage.arrived.",
  "guide.limits.title": "Bekende beperkingen",
  "guide.limits.coverage":
    "Zwakke AIS-dekking Middellandse Zee en Perzische Golf met aisstream.io (community-netwerk). Algeciras, Fujairah, Ras Laffan tonen vaak weinig of geen schepen in v1. Oplossing: overstappen naar commerciële provider (Spire, Orbcomm) — op de roadmap.",
  "guide.limits.classification":
    "Cargo-classificatie ~85% (tankers) / ~95% (containers). Valse positieven op niet-benoemde schepen.",
  "guide.limits.grace":
    "Bij worker-start voorkomt een 60s grace-periode dat reeds aanwezige schepen als \"binnenkomenden\" worden geteld. KPIs binnenkomenden/u kalibreren zich daarna natuurlijk.",
  "guide.limits.eta":
    "ETA-model v2 (afstand/SOG + seizoenscorrectie + congestie + weer). Verslaat de broadcast-ETA op reizen > 6 u; minder voorsprong op korte reizen.",
  "guide.limits.sanctions":
    "Multi-regime sanctie-screening ingebouwd (UKSL + OFAC + UN-SC + EU) — zie methodologiepagina. Klanten kunnen ook eigen lijsten via de API leggen.",
  "guide.checklist.title": "Deployment-checklist",
  "guide.checklist.s1": "Maak een",
  "guide.checklist.s2":
    "cp .env.example .env.local, vul AISSTREAM_API_KEY en PORT_API_TOKENS in.",
  "guide.checklist.s3": "npm install && npm run dev.",
  "guide.checklist.s4":
    "Verifieer de AIS Live banner rechtsboven (groen = inkomende feed).",
  "guide.checklist.s5":
    "Wacht 60s + enkele minuten om reizen te zien openen (afhankelijk van het verkeer).",
  "guide.checklist.s6":
    "De /precision pagina toont cijfers nadat de eerste reizen zijn afgesloten (voorspelde ETA + werkelijke aankomst).",
};

const de: PageMessages = {
  "nav.back": "← zurück",

  "pricing.title": "Preise",
  "pricing.subtitle":
    "Multi-Hafen-AIS · vorhergesagte ETA · SAR-Fusion · Sanktions-Screening · 51 strategische Häfen",
  "pricing.note":
    "Sicher via Stripe. Monats- oder Jahreszyklus, jederzeit über das Abrechnungsportal kündbar.",
  "pricing.note.label": "Zahlungen:",
  "pricing.vatNotice":
    "Nettopreise. Umsatzsteuer nicht anwendbar — französ. CGI Art. 293 B (Kleinunternehmerregelung).",
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
    "Reise = erste Beobachtung im Anlauf/Ankerplatz → festgemacht am Liegeplatz, abgeleitet aus Navigationsstatus und Bewegung.",
  "precision.method.b3":
    "ETA-Modell: Distanz / SOG mit gleitender Median-Korrektur + Live-Staupönale. Kontinuierlich aktualisiert. Roadmap: gezeiten- und tiefgang-bewusste Verfeinerung.",
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
    "Kombination aus AIS-shipType-Signalen und einer textuellen Heuristik (Name, deklarierter Bestimmungsort) zur Zuordnung einer Frachtklasse — kalibriert pro Hafen und Flottenprofil. Randfall: minimale AIS-Metadaten fallen auf eine generische Klasse zurück.",
  "methodology.voyages.title": "Reisenerkennung",
  "methodology.voyages.open":
    "Öffnung: eine Reise öffnet sich, wenn ein Schiff verfolgbarer Klasse (tanker / container / bulk / general / RoRo) im Anflug oder Ankern mit messbarer Bewegung beobachtet wird, nach einer Karenzzeit nach Worker-Start.",
  "methodology.voyages.arrival":
    "Ankunft: Übergang zum moored-Status in einer Liegeplatzzone, abgeleitet aus Navigationsstatus und Bewegung.",
  "methodology.voyages.departure":
    "Abfahrt: nach Ankunft, Rückkehr zu underway kombiniert mit einer Distanzschwelle vom Hafenzentrum.",
  "methodology.voyages.falsePositives":
    "Falsch-Positive: Tugs, Lotsen und Fischerei vom Tracking ausgeschlossen — die Frachtklasse dient als Filter.",
  "methodology.eta.title": "ETA-Modell",
  "methodology.eta.naive":
    "Naive Schätzung: Distanz / SOG, wobei Distanz der Großkreis zwischen aktueller Position und Hafenzentrum ist. Kontinuierlich pro aktiver Reise aktualisiert.",
  "methodology.eta.seasonal":
    "Saisonkorrektur: gleitender Median des Fehlers (predicted − actual) gebucketed nach Ankunftsstunde. Fallback auf globalen Median, wenn der Bucket zu dünn ist. Regelmäßige Recompute.",
  "methodology.eta.broadcast":
    "Vergleichsreferenz: ETA-Broadcast-Feld aus ShipStaticData-Nachrichten (manuell von der Schiffsbesatzung eingegeben — oft ungenau und verspätet).",
  "methodology.eta.metrics":
    "Metriken: RMSE und MAE in Stunden, auf abgeschlossenen Reisen mit verfügbaren prognostizierten UND Broadcast-ETAs. Bei jeder abgeschlossenen Reise aktualisiert.",
  "methodology.eta.roadmap":
    "Modell-Roadmap: Integration Stau, Gezeiten, Wetter, historische durchschnittliche Geschwindigkeit des spezifischen Schiffs.",
  "methodology.anomalies.title": "Anomalieerkennung",
  "methodology.anomalies.intro":
    "v1: absolute Schwellenwerte für Dwell beim Ankern, angepasst nach Frachtklasse.",
  "methodology.anomalies.tanker":
    "Tanker (crude/product/chemical/LNG/LPG) — längstes akzeptables Dwell-Fenster.",
  "methodology.anomalies.container":
    "Container — engstes Dwell-Fenster (umschlagskritische Klasse).",
  "methodology.anomalies.other":
    "Andere Klassen — mittleres Dwell-Fenster.",
  "methodology.anomalies.roadmap":
    "Roadmap: Schwellenwerte abgeleitet aus historischer Verteilung pro (Hafen, Fracht); Erkennung von Routenabweichungen; Loitering-Erkennung außerhalb bekannter Zonen (\"dark fleet\"-Signal).",
  "methodology.persistence.title": "Persistenz & Lineage",
  "methodology.persistence.storage":
    "Relationale SQL-Speicherung mit zeitgestempelter Lineage. Jede Metrik ist auf ihre Quellpositionen rückverfolgbar.",
  "methodology.persistence.timestamps":
    "Jede Metrik- und Reisen-Zeile trägt den Hafen und den Zeitstempel. Vollständige Reproduzierbarkeit einer Metrik zu einem gegebenen Zeitpunkt.",
  "methodology.persistence.snapshot":
    "Positionen-Snapshot: rate-limitierte Schreibvorgänge pro Schiff. Ermöglicht Backtesting und Modell-Replay.",
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
    "Kontinuierliche Point-in-bbox-Erkennung über ein gleitendes AIS-Fenster.",
  "methodology.chokepoints.dedup":
    "Dedup via Cooldown-Fenster zur Absorption von GPS-Jitter ohne Transits zu verdoppeln.",
  "methodology.chokepoints.snapshot":
    "Sanktions-Status-Snapshot bei Eintritt — ein später delistetes Schiff bleibt forensisch für diesen Transit markiert.",
  "methodology.chokepoints.coverage":
    "Abdeckung über terrestrisches AIS — beste Zuverlässigkeit an küstennahen Chokepoints (Hormuz, Bab el-Mandeb, Malakka, Singapur, Bosporus, Dover, Gibraltar, Suez, Panama). Tieferen Ozean-Zonen (Kap der Guten Hoffnung, Magellan, zentrales Mittelmeer): Erkennung bei Passage von Küstenstationen. Kontinuierliche Satellitenabdeckung via BYO Spire/Orbcomm-Schlüssel (Pro+).",
  "methodology.chokepoints.alertPrefix": "Composable Alert",
  "methodology.chokepoints.alertSuffix":
    ": ausgelöst in dem Moment, in dem ein sanktioniertes Schiff eine dieser Zonen betritt.",
  "methodology.emissions.title":
    "CO₂-Emissionsschätzung — In-House-Methode",
  "methodology.emissions.intro":
    "Bottom-up-Ansatz abgeleitet aus IMO Fourth GHG Study (2020), integriert über den AIS-Feed ohne externe Abhängigkeit.",
  "methodology.emissions.power":
    "Installierte Leistung und Design-Geschwindigkeit Defaults aus IMO Annex 1 Tabellen, pro Frachtklasse (tanker / container / LNG / bulk …).",
  "methodology.emissions.skip":
    "Zeiten am Liegeplatz oder vor Anker werden von der Zählung ausgenommen (stationäre Hilfslast wird in v1 nicht modelliert). Segmente außerhalb der terrestrischen AIS-Abdeckung werden ebenfalls ausgeschlossen — siehe Abdeckungsgrenzen.",
  "methodology.emissions.precision":
    "Indikative Präzision ±25% — ausreichend für Flotten-Ranking, Reisenvergleich, Chartering-Screening. Für regulatorisches Reporting, mit EU MRV abgleichen (kommend).",
  "methodology.emissions.endpointPrefix": "Endpoint",
  "methodology.emissions.endpointMid": "(pro Schiff) und",
  "methodology.emissions.endpointSuffix": "(Nutzer-Watchlist-Aggregat).",
  "methodology.compliance.legalIntro": "Vollständige Details auf der Seite",
  "methodology.compliance.legalLabel": "Impressum",

  // /legal
  "legal.backLink": "← zurück",
  "legal.methodologyLink": "Methodik →",
  "legal.title": "Rechtliche Hinweise",
  "legal.lead":
    "Diese Seite konsolidiert Datenattributionen, Nutzungsbedingungen, Datenschutz, Compliance und Einschränkungen. Wird im Footer jeder Seite referenziert.",
  "legal.maritime.title": "Maritimer Hinweis",
  "legal.maritime.notForNav": "Not for navigation.",
  "legal.maritime.body":
    "Positionen, ETAs, Anomalien und Indikatoren, die von Port Flow veröffentlicht werden, sind aus öffentlichen AIS-Signalen, Wetterdaten und Satellitenbildern abgeleitet. Sie können Fehler, Verzögerungen und Auslassungen enthalten. Diese Plattform ersetzt in keiner Weise ein zertifiziertes Navigationssystem oder eine operative Lotsenstelle. Die Verwendung für maritime Sicherheit, Lotsenwesen oder kritische operative Entscheidungen ist ausdrücklich ausgeschlossen.",
  "legal.tos.title": "Nutzungsbedingungen",
  "legal.tos.b1":
    "Plattform „as is\" bereitgestellt, ohne Garantie für Verfügbarkeit, Genauigkeit oder Eignung für einen bestimmten Zweck.",
  "legal.tos.b2.intro": "Service-Verpflichtungen detailliert auf der",
  "legal.tos.b2.linkLabel": "Methodik-Seite",
  "legal.tos.b2.outro": " (SLA v1).",
  "legal.tos.b3":
    "Angezeigte Daten können abgeleitet und transformiert sein. Die Plattform ist kein Reseller von rohen AIS-Daten.",
  "legal.tos.b4":
    "Jede kommerzielle Nutzung erfordert die Einhaltung der Bedingungen der Quelllieferanten (insbesondere Zahlung Spire / MarineTraffic / Orbcomm bei Aktivierung).",
  "legal.privacy.title": "Datenschutzrichtlinie (DSGVO)",
  "legal.privacy.controller": "Verantwortlicher",
  "legal.privacy.entityName":
    "Laurent Guglielmetti — französisches Einzelunternehmen (entrepreneur individuel, micro-entreprise-Regime)",
  "legal.privacy.entityTrade":
    "Handelsname: octopodus · Betriebene Marke: Port Flow",
  "legal.privacy.entityAddress":
    "Sitz: 21 rue Hippolyte Noiret, 08300 Rethel, Frankreich",
  "legal.privacy.entityIds":
    "SIREN 491 489 654 · SIRET 491 489 654 00047 · APE 6201Z",
  "legal.privacy.entityVat":
    "Umsatzsteuer nicht anwendbar — französ. CGI Art. 293 B (Kleinunternehmerregelung)",
  "legal.privacy.contactLine": "Kontakt:",
  "legal.privacy.intro":
    "Dieser Abschnitt beschreibt die erhobenen personenbezogenen Daten, ihre Zwecke und die Rechte des Nutzers gemäß DSGVO (EU) 2016/679. Für EU-Kunden ist ein unterschriftsfähiges DPA auf Anfrage unter privacy@portflow.uk verfügbar.",
  "legal.privacy.dpaBold": "Unterschriftsfähiges DPA",
  "legal.privacy.dataTitle": "Erhobene Daten und Zwecke",
  "legal.privacy.col.data": "Daten",
  "legal.privacy.col.purpose": "Zweck",
  "legal.privacy.col.basis": "Rechtsgrundlage",
  "legal.privacy.col.retention": "Aufbewahrung",
  "legal.privacy.row1.data": "E-Mail + Clerk-ID",
  "legal.privacy.row1.purpose": "Authentifizierung, Support",
  "legal.privacy.row1.basis": "Vertragserfüllung",
  "legal.privacy.row1.retention": "Solange Konto aktiv + 12 Monate",
  "legal.privacy.row2.data": "Stripe-Kunden-ID + Zahlungsverlauf",
  "legal.privacy.row2.purpose": "Abrechnung, Abonnement",
  "legal.privacy.row2.basis": "Vertragserfüllung",
  "legal.privacy.row2.retention": "10 Jahre (Buchhaltungspflicht)",
  "legal.privacy.row3.data":
    "Webhook-URLs Slack/Discord/Telegram, Alarm-E-Mail",
  "legal.privacy.row3.purpose": "Versand der von Ihnen konfigurierten Alarme",
  "legal.privacy.row3.basis": "Ausdrückliche Einwilligung (UI-Eingabe)",
  "legal.privacy.row3.retention": "Bis zur Löschung durch Nutzer",
  "legal.privacy.row4.data":
    "Drittanbieter-API-Schlüssel (Spire/VIIRS/Orbcomm) AES-256-GCM-verschlüsselt",
  "legal.privacy.row4.purpose": "BYO-Key-Integration",
  "legal.privacy.row4.basis": "Ausdrückliche Einwilligung (UI-Eingabe)",
  "legal.privacy.row4.retention": "Bis zur Löschung durch Nutzer",
  "legal.privacy.row5.data": "Watchlist (MMSI-Schiffe, Hafen-IDs)",
  "legal.privacy.row5.purpose": "Dashboard-Personalisierung",
  "legal.privacy.row5.basis": "Vertragserfüllung",
  "legal.privacy.row5.retention": "Solange Konto aktiv",
  "legal.privacy.row6.data": "API-Logs (Zeitstempel, Key-Prefix, Endpoint)",
  "legal.privacy.row6.purpose": "Audit, Sicherheit, Anti-Missbrauch",
  "legal.privacy.row6.basis": "Berechtigtes Interesse",
  "legal.privacy.row6.retention": "90 Tage rolling",
  "legal.privacy.subTitle": "Auftragsverarbeiter (Sub-Processors)",
  "legal.privacy.sub.clerk":
    "Clerk Inc. (USA) — Nutzerauthentifizierung · clerk.com (DPA verfügbar)",
  "legal.privacy.sub.stripe":
    "Stripe Inc. (USA) — Abrechnung · stripe.com (DPA + SCCs verfügbar)",
  "legal.privacy.sub.do":
    "DigitalOcean LLC (Frankfurt EU-Region) — Hosting · digitalocean.com (DPA)",
  "legal.privacy.sub.cloudflare":
    "Cloudflare Inc. (USA) — DNS + DDoS · cloudflare.com (DPA + SCCs)",
  "legal.privacy.sub.resend":
    "Resend Inc. (USA) — Versand Alarm-E-Mails (bei Aktivierung) · resend.com (DPA)",
  "legal.privacy.sub.aisstream":
    "aisstream.io — öffentlicher AIS-Feed (keine Nutzer-Personendaten übertragen)",
  "legal.privacy.sub.copernicus":
    "Copernicus Data Space (ESA) — Sentinel-1-Satellitenbilder (öffentlich)",
  "legal.privacy.transfersTitle": "Übertragungen außerhalb EU",
  "legal.privacy.transfersBody":
    "Clerk, Stripe, Cloudflare und Resend operieren aus den USA. Alle verfügen über Standard Contractual Clauses (SCCs) EU-USA. AIS- und Hafendaten (öffentlich von Natur aus) stellen keine übertragenen personenbezogenen Daten dar.",
  "legal.privacy.rightsTitle": "Ihre Rechte",
  "legal.privacy.rights.access":
    "Auskunft, Berichtigung — alles ist in /account sichtbar, direkt änderbar",
  "legal.privacy.rights.delete":
    "Löschung — Konto über Clerk löschen (API-Schlüssel + Watchlist + Alarme kaskadieren)",
  "legal.privacy.rights.portability":
    "Übertragbarkeit — CSV-Export Ihrer Watchlist/Flotte verfügbar über /fleet (Starter+)",
  "legal.privacy.rights.opt":
    "Widerspruch, Widerruf der Einwilligung — Alarme deaktivieren oder Schlüssel jederzeit in /account und /sources entfernen",
  "legal.privacy.rights.complaint":
    "Beschwerde — bei der BfDI (Deutschland), CNIL (Frankreich) oder einer anderen europäischen Aufsichtsbehörde",
  "legal.privacy.securityTitle": "Technische Sicherheit",
  "legal.privacy.security.tls":
    "HTTPS TLS 1.3 obligatorisch (Let's Encrypt). HTTP umgeleitet.",
  "legal.privacy.security.encryption":
    "At-Rest-Verschlüsselung von Nutzergeheimnissen (Drittanbieter-API-Schlüssel): AES-256-GCM mit Server-Master-Key",
  "legal.privacy.security.passwords":
    "Passwörter verwaltet von Clerk (PBKDF2/Argon2id, niemals im Klartext)",
  "legal.privacy.security.audit":
    "Auditfähige Logs (audit_log-Tabelle) bei Abonnementsänderungen und API-Zugriff",
  "legal.privacy.security.mmsi":
    "Angezeigte MMSIs = Schiffsidentifikatoren, von der ITU der Flagge zugewiesen — keine Personenidentifikatoren",
  "legal.privacy.security.cookies":
    "Keine Drittanbieter-Analytics-Cookies. Der einzige lokale Speicher ist der Browser-Cache für Tab-Resilienz, löschbar.",
  "legal.dpa.title": "Data Processing Agreement (DPA) — Zusammenfassung",
  "legal.dpa.intro":
    "Für jeden EU-Geschäftskunden, der Port Flow für die Datenverarbeitung in einem B2B-Kontext nutzt, ist ein DSGVO-Artikel-28-konformes DPA verfügbar.",
  "legal.dpa.role":
    "Port Flow handelt als Auftragsverarbeiter für im Rahmen des Service verarbeitete Daten (Watchlist, Alarme, API-Schlüssel)",
  "legal.dpa.noSecondary":
    "Keine sekundäre Verarbeitung: keine Werbung, kein Weiterverkauf, kein kommerzielles Profiling",
  "legal.dpa.breach": "Meldung jeder Datenschutzverletzung innerhalb 72 Stunden",
  "legal.dpa.audits":
    "Kooperation bei jährlichen Audits des Kunden (mit 30 Tagen Vorankündigung)",
  "legal.dpa.endOfContract":
    "Löschung oder Rückgabe der Daten am Vertragsende (CSV-Export + DB-Purge auf Anfrage)",
  "legal.dpa.subList":
    "Liste der Auftragsverarbeiter oben, änderbar mit 30 Tagen Vorankündigung",
  "legal.dpa.outro": "DPA unterzeichnet auf Anfrage an",
  "legal.dpa.outroSuffix": " — indikative Bearbeitungszeit 48 Geschäftsstunden.",
  "legal.sanctions.title": "Sanktionen & Compliance",
  "legal.sanctions.b1":
    "Die Plattform gleicht automatisch Schiffe gegen vier öffentliche offizielle Listen ab (UK Sanctions List, OFAC SDN, UN Security Council Consolidated List, EU Consolidated FSF) — siehe Methodik-Seite für detaillierte Abdeckung und Aktualisierungsfrequenz.",
  "legal.sanctions.b2":
    "Der Kunde (Trader, Versicherer, Spediteur) bleibt verantwortlich für die Anwendung seiner eigenen ergänzenden Listen und Screening-Verfahren (KYC, EDD, eigene Watchlists).",
  "legal.sanctions.b3":
    "Die Plattform ist kommerziell neutral: kein Schiff wird auf anderen Kriterien als den oben genannten öffentlichen offiziellen Listen versteckt.",
  "legal.citation.title": "Akademische Zitation",
  "legal.citation.body":
    "Wenn Sie Port Flow in einer Publikation zitieren, fügen Sie bitte hinzu:",

  // /guide
  "guide.backLink": "← zurück zum Dashboard",
  "guide.methodologyLink": "Methodik →",
  "guide.title": "Benutzerhandbuch",
  "guide.lead":
    "Port Flow bietet eine Echtzeitansicht der maritimen Ströme über 51 strategische Häfen (ARA, Bunkering, LNG-Export). Diese Seite erklärt, wie Sie das Dashboard lesen, wer davon profitiert und wie Sie die Daten in Ihre Pipelines integrieren.",
  "guide.audience.title": "Für wen ist das?",
  "guide.audience.traders":
    "Rohstoffhändler (Öl, LNG, Chemie) — präzise ETA und Stauindikatoren speisen Preismodelle. Primäre Zielgruppe der Plattform.",
  "guide.audience.forwarders":
    "Spediteure — Antizipation von Demurrage-Überschreitungen, Routing-Entscheidungen.",
  "guide.audience.insurers":
    "Maritime Versicherer — Anomalieerkennung (Loitering, abnormaler Dwell), Risk Pricing.",
  "guide.audience.quants":
    "Data Scientists / Quants — historischer Feed für Backtesting von Makro-Strategien (Hafenaktivität = Wirtschaftsproxy).",
  "guide.dashboard.title": "Das Dashboard in 30 Sekunden lesen",
  "guide.dashboard.portSelector":
    "Hafenselektor oben rechts — wechselt den beobachteten Hafen. Der einheimische Name erscheint in Klammern, wenn die aktive Sprache abweicht (z. B. Antwerpen, Hamburg, الفجيرة).",
  "guide.dashboard.langSelector":
    "Sprachselektor daneben — 8 Geschäftssprachen: FR, EN, NL, DE, ES, AR (mit automatischem RTL), ZH, JA.",
  "guide.dashboard.toggle":
    "Toggle Alle / Tanker — filtert sofort die Karte und Zähler auf die 5 Tanker-Subklassen (crude, product, chemical, LNG, LPG).",
  "guide.dashboard.kpis":
    "KPI-Reihe — Gesamtschiffe, Stationär (Stau-Proxy), in Fahrt, am Liegeplatz, Eingehende/h, aktive verfolgte Reisen.",
  "guide.dashboard.map":
    "Karte — Farbe = AIS-Kategorie, Größe = State. Die gestrichelten Rechtecke sind die benannten Zonen (Anchorage, Berth, Channel).",
  "guide.dashboard.voyages":
    "Aktive Reisen — Tabelle sortiert nach prognostizierter ETA. Die Spalte „ETA Broadcast\" ist die Zeit, die die Besatzung eingegeben hat; mit den Modellabweichungen vergleichen.",
  "guide.dashboard.precision":
    "ETA Precision — RMSE unseres Modells vs. RMSE der ETA Broadcast. Dies ist der Hauptqualitätsindikator.",
  "guide.dashboard.anomalies":
    "Anomalien — Schiffe abnormal lange am Anker für ihre Klasse. Kritisch zu überwachen für Stau oder operative Auffälligkeiten.",
  "guide.dashboard.flow":
    "Flow 6h — Eingehende / Ausgehende / Stationär über die letzten 6 Stunden. Kurzer Trend.",
  "guide.precision.title": "ETA Precision Seite",
  "guide.precision.body":
    "Zugänglich über den ETA Precision-Button oder /precision. Öffentliche Ansicht zur Demonstration der Modellqualität gegenüber Prospects. Drei Schlüsselindikatoren: RMSE Modell, RMSE Broadcast, Abweichung in %. Liste der 50 letzten abgeschlossenen Reisen mit Fehler in Stunden (grün < 1h, bernstein < 3h, rot darüber). Methodik unten auf der Seite. Filter Fenster 7/30/90 Tage.",
  "guide.api.title": "API-Integration",
  "guide.api.intro": "Öffentliche API unter /api/v1, authentifiziert per Bearer Token. OpenAPI-Spezifikation auf",
  "guide.api.endpoints":
    "Verfügbare Endpoints: /ports, /ports/{id}/snapshot, /ports/{id}/vessels, /ports/{id}/voyages/active, /ports/{id}/voyages/closed, /ports/{id}/anomalies, /webhooks.",
  "guide.webhooks.title": "Webhooks (Alarme)",
  "guide.webhooks.intro":
    "Abonnieren Sie ein Event, um einen HMAC-SHA256-signierten POST zu erhalten, wenn ein Schwellenwert überschritten wird.",
  "guide.webhooks.headers":
    "Headers bei jeder Lieferung: X-Port-Flow-Event und X-Port-Flow-Signature: t=<ts>,v1=<hex> (HMAC-SHA256 der Payload mit Timestamp-Präfix). Verifizierung empfängerseitig: hmac_sha256(secret, \"{ts}.{body}\").",
  "guide.webhooks.events":
    "Unterstützte Events: congestion.threshold / congestion.cleared, anomaly.detected, voyage.arrived.",
  "guide.limits.title": "Bekannte Einschränkungen",
  "guide.limits.coverage":
    "Schwache AIS-Abdeckung Mittelmeer und Persischer Golf mit aisstream.io (Community-Netzwerk). Algeciras, Fujairah, Ras Laffan zeigen oft wenig oder keine Schiffe in v1. Lösung: Wechsel zu kommerziellem Anbieter (Spire, Orbcomm) — auf der Roadmap.",
  "guide.limits.classification":
    "Frachtklassifizierung ~85% (Tanker) / ~95% (Container). Falsch-Positive bei nicht benannten Schiffen.",
  "guide.limits.grace":
    "Beim Worker-Start verhindert eine 60s Karenzzeit, dass bereits anwesende Schiffe als „Eingehende\" gezählt werden. KPIs Eingehende/h kalibrieren sich danach natürlich.",
  "guide.limits.eta":
    "ETA-Modell v2 (Distanz/SOG + Saisonkorrektur + Stau + Wetter). Schlägt die Broadcast-ETA bei Reisen > 6h; weniger Vorsprung bei kurzen Reisen.",
  "guide.limits.sanctions":
    "Multi-Regime Sanktions-Screening eingebaut (UKSL + OFAC + UN-SC + EU) — siehe Methodik-Seite. Kunden können auch eigene Listen via API überlagern.",
  "guide.checklist.title": "Deployment-Checklist",
  "guide.checklist.s1": "Erstellen Sie einen",
  "guide.checklist.s2":
    "cp .env.example .env.local, AISSTREAM_API_KEY und PORT_API_TOKENS ausfüllen.",
  "guide.checklist.s3": "npm install && npm run dev.",
  "guide.checklist.s4":
    "Verifizieren Sie das AIS Live Banner oben rechts (grün = eingehender Feed).",
  "guide.checklist.s5":
    "Warten Sie 60s + einige Minuten, um Reisen zu sehen (je nach Verkehr).",
  "guide.checklist.s6":
    "Die /precision Seite zeigt Zahlen nach den ersten abgeschlossenen Reisen (prognostizierte ETA + festgestellte Ankunft).",
};

const es: PageMessages = {
  "nav.back": "← volver",

  "pricing.title": "Tarifas",
  "pricing.subtitle":
    "AIS multipuerto · ETA predicha · fusión SAR · screening de sanciones · 51 puertos estratégicos",
  "pricing.note":
    "Asegurados vía Stripe. Ciclo mensual o anual, cancelable en cualquier momento desde el portal de facturación.",
  "pricing.note.label": "Facturación:",
  "pricing.vatNotice":
    "Precios netos. IVA no aplicable — art. 293 B del CGI francés (régimen de franquicia).",
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
    "Travesía = primera observación en aproximación/fondeo → atracado, derivado del estado de navegación y movimiento.",
  "precision.method.b3":
    "Modelo ETA: distancia / SOG corregido por mediana móvil + penalización de congestión en vivo. Refrescado en continuo. Roadmap: refinamiento sensible a mareas y calado.",
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
    "Combinación de señales shipType AIS y una heurística textual (nombre, destino declarado) para asignar una clase de carga — calibrada por puerto y perfil de flota. Caso límite: metadatos AIS mínimos → clase genérica como fallback.",
  "methodology.voyages.title": "Detección de viajes",
  "methodology.voyages.open":
    "Apertura: un viaje se abre cuando un buque de clase trackeable (tanker / container / bulk / general / RoRo) es observado en aproximación o fondeo con movimiento medible, después de un periodo de gracia tras el inicio del worker.",
  "methodology.voyages.arrival":
    "Llegada: transición al estado moored en una zona de muelle, derivada del estado de navegación y el movimiento.",
  "methodology.voyages.departure":
    "Salida: tras la llegada, retorno al estado underway combinado con un umbral de distancia del centro del puerto.",
  "methodology.voyages.falsePositives":
    "Falsos positivos: tugs, prácticos y pesca excluidos del tracking — la clase de carga sirve de filtro.",
  "methodology.eta.title": "Modelo ETA",
  "methodology.eta.naive":
    "Estimación naive: distancia / SOG donde distancia es el círculo máximo entre la posición actual y el centro del puerto. Refrescado en continuo por viaje activo.",
  "methodology.eta.seasonal":
    "Corrección estacional: mediana móvil del error (predicted − actual) bucketeada por hora de llegada. Fallback a la mediana global cuando el bucket es demasiado fino. Recompute regular.",
  "methodology.eta.broadcast":
    "Referencia comparada: campo ETA broadcast extraído de los mensajes ShipStaticData (introducido manualmente por la tripulación — frecuentemente impreciso y tardío).",
  "methodology.eta.metrics":
    "Métricas: RMSE y MAE en horas, sobre viajes cerrados con ETA prevista Y broadcast disponibles. Actualizado en cada viaje cerrado.",
  "methodology.eta.roadmap":
    "Roadmap del modelo: integración congestión, mareas, meteorología, velocidad media histórica del buque específico.",
  "methodology.anomalies.title": "Detección de anomalías",
  "methodology.anomalies.intro":
    "v1: umbrales absolutos de dwell en fondeo, ajustados por clase de carga.",
  "methodology.anomalies.tanker":
    "Tankers (crude/product/chemical/LNG/LPG) — ventana de dwell más larga aceptable.",
  "methodology.anomalies.container":
    "Containers — ventana de dwell más estrecha (clase crítica para rotación).",
  "methodology.anomalies.other":
    "Otras clases — ventana de dwell intermedia.",
  "methodology.anomalies.roadmap":
    "Roadmap: umbrales derivados de la distribución histórica por (puerto, carga); detección de desviación de ruta; detección de loitering fuera de zonas conocidas (señal \"dark fleet\").",
  "methodology.persistence.title": "Persistencia y lineage",
  "methodology.persistence.storage":
    "Almacenamiento SQL relacional con lineage horodatado. Cada métrica es trazable hasta sus posiciones fuente.",
  "methodology.persistence.timestamps":
    "Cada fila de métrica y viaje lleva el puerto y el timestamp. Reproducibilidad total de una métrica en un instante dado.",
  "methodology.persistence.snapshot":
    "Snapshot de posiciones: escrituras rate-limited por buque. Permite backtesting y replay del modelo.",
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
    "Detección point-in-bbox en continuo sobre una ventana deslizante de posiciones AIS.",
  "methodology.chokepoints.dedup":
    "Dedup vía una ventana de cooldown para absorber el jitter GPS sin duplicar tránsitos.",
  "methodology.chokepoints.snapshot":
    "Snapshot del estado sancionado al momento de la entrada — un buque retirado posteriormente queda forensicamente marcado para ese tránsito.",
  "methodology.chokepoints.coverage":
    "Cobertura por AIS terrestre — fiabilidad óptima en chokepoints costeros (Hormuz, Bab el-Mandeb, Malaca, Singapur, Bósforo, Estrecho de Dover, Gibraltar, Suez, Panamá). Zonas más oceánicas (Cabo de Buena Esperanza, Magallanes, Mediterráneo central): detección al paso de estaciones costeras. Cobertura satelital continua vía clave BYO Spire/Orbcomm (Pro+).",
  "methodology.chokepoints.alertPrefix": "Alerta composable",
  "methodology.chokepoints.alertSuffix":
    ": disparada en el momento exacto en que un buque sancionado entra en una de estas zonas.",
  "methodology.emissions.title":
    "Estimación de emisiones CO₂ — método in-house",
  "methodology.emissions.intro":
    "Enfoque bottom-up derivado del IMO Fourth GHG Study (2020), integrado sobre el feed AIS sin dependencia externa.",
  "methodology.emissions.power":
    "Potencia instalada y velocidad de servicio default tomadas de las tablas IMO Annex 1, por clase de carga (tanker / container / LNG / bulk …).",
  "methodology.emissions.skip":
    "Periodos atracado o fondeado excluidos del conteo (el consumo auxiliar estacionario no se modela en v1). Los segmentos fuera de cobertura AIS terrestre también se excluyen — ver límites de cobertura.",
  "methodology.emissions.precision":
    "Precisión indicativa ±25% — suficiente para ranking de flota, comparación de viajes, screening de chartering. Para reporting regulatorio, cruzar con EU MRV (próximo).",
  "methodology.emissions.endpointPrefix": "Endpoint",
  "methodology.emissions.endpointMid": "(por buque) y",
  "methodology.emissions.endpointSuffix": "(agregado de watchlist usuario).",
  "methodology.compliance.legalIntro": "Detalles completos en la página",
  "methodology.compliance.legalLabel": "Aviso legal",

  // /legal
  "legal.backLink": "← volver",
  "legal.methodologyLink": "Metodología →",
  "legal.title": "Aviso legal",
  "legal.lead":
    "Esta página consolida atribuciones de datos, condiciones de uso, privacidad, cumplimiento y limitaciones. Referenciada desde el pie de cada página.",
  "legal.maritime.title": "Aviso marítimo",
  "legal.maritime.notForNav": "Not for navigation.",
  "legal.maritime.body":
    "Las posiciones, ETAs, anomalías e indicadores publicados por Port Flow se derivan de señales AIS públicas, datos meteorológicos e imágenes satelitales. Pueden contener errores, retrasos y omisiones. Esta plataforma no sustituye en ningún caso un sistema de navegación certificado ni una célula operativa de pilotaje. El uso para seguridad marítima, pilotaje o decisiones operativas críticas queda explícitamente excluido.",
  "legal.tos.title": "Condiciones de uso",
  "legal.tos.b1":
    "Plataforma proporcionada \"tal cual\", sin garantía de disponibilidad, exactitud o idoneidad para un propósito particular.",
  "legal.tos.b2.intro": "Compromisos de servicio detallados en la",
  "legal.tos.b2.linkLabel": "página de metodología",
  "legal.tos.b2.outro": " (SLA v1).",
  "legal.tos.b3":
    "Los datos mostrados pueden ser derivados y transformados. La plataforma no es revendedora de datos AIS en bruto.",
  "legal.tos.b4":
    "Cualquier uso comercial requiere el cumplimiento de los términos de los proveedores fuente (en particular pago Spire / MarineTraffic / Orbcomm si están activados).",
  "legal.privacy.title": "Política de privacidad (RGPD)",
  "legal.privacy.controller": "Responsable del tratamiento",
  "legal.privacy.entityName":
    "Laurent Guglielmetti — empresario individual francés (entrepreneur individuel, régimen micro-entreprise)",
  "legal.privacy.entityTrade":
    "Nombre comercial: octopodus · Marca explotada: Port Flow",
  "legal.privacy.entityAddress":
    "Domicilio: 21 rue Hippolyte Noiret, 08300 Rethel, Francia",
  "legal.privacy.entityIds":
    "SIREN 491 489 654 · SIRET 491 489 654 00047 · APE 6201Z",
  "legal.privacy.entityVat":
    "IVA no aplicable — art. 293 B del CGI francés (régimen de franquicia)",
  "legal.privacy.contactLine": "Contacto:",
  "legal.privacy.intro":
    "Esta sección describe los datos personales recopilados, sus finalidades y los derechos del usuario conforme al RGPD (UE) 2016/679. Para clientes UE, un DPA firmable está disponible bajo solicitud a privacy@portflow.uk.",
  "legal.privacy.dpaBold": "DPA firmable",
  "legal.privacy.dataTitle": "Datos recopilados y finalidades",
  "legal.privacy.col.data": "Dato",
  "legal.privacy.col.purpose": "Finalidad",
  "legal.privacy.col.basis": "Base legal",
  "legal.privacy.col.retention": "Conservación",
  "legal.privacy.row1.data": "Email + identificador Clerk",
  "legal.privacy.row1.purpose": "Autenticación, soporte",
  "legal.privacy.row1.basis": "Ejecución contractual",
  "legal.privacy.row1.retention": "Mientras la cuenta esté activa + 12 meses",
  "legal.privacy.row2.data": "ID cliente Stripe + historial de pago",
  "legal.privacy.row2.purpose": "Facturación, suscripción",
  "legal.privacy.row2.basis": "Ejecución contractual",
  "legal.privacy.row2.retention": "10 años (obligación contable)",
  "legal.privacy.row3.data":
    "URLs webhook Slack/Discord/Telegram, email alertas",
  "legal.privacy.row3.purpose": "Envío de alertas que usted configura",
  "legal.privacy.row3.basis": "Consentimiento explícito (entrada UI)",
  "legal.privacy.row3.retention": "Hasta eliminación por el usuario",
  "legal.privacy.row4.data":
    "Claves API de terceros (Spire/VIIRS/Orbcomm) cifradas AES-256-GCM",
  "legal.privacy.row4.purpose": "Integración BYO key",
  "legal.privacy.row4.basis": "Consentimiento explícito (entrada UI)",
  "legal.privacy.row4.retention": "Hasta eliminación por el usuario",
  "legal.privacy.row5.data": "Watchlist (MMSI buques, IDs puertos)",
  "legal.privacy.row5.purpose": "Personalización dashboard",
  "legal.privacy.row5.basis": "Ejecución contractual",
  "legal.privacy.row5.retention": "Mientras la cuenta esté activa",
  "legal.privacy.row6.data": "Logs API (timestamp, key prefix, endpoint)",
  "legal.privacy.row6.purpose": "Auditoría, seguridad, anti-abuso",
  "legal.privacy.row6.basis": "Interés legítimo",
  "legal.privacy.row6.retention": "90 días rolling",
  "legal.privacy.subTitle": "Encargados (sub-processors)",
  "legal.privacy.sub.clerk":
    "Clerk Inc. (EE. UU.) — autenticación de usuario · clerk.com (DPA disponible)",
  "legal.privacy.sub.stripe":
    "Stripe Inc. (EE. UU.) — facturación · stripe.com (DPA + SCCs disponibles)",
  "legal.privacy.sub.do":
    "DigitalOcean LLC (Frankfurt región UE) — alojamiento · digitalocean.com (DPA)",
  "legal.privacy.sub.cloudflare":
    "Cloudflare Inc. (EE. UU.) — DNS + DDoS · cloudflare.com (DPA + SCCs)",
  "legal.privacy.sub.resend":
    "Resend Inc. (EE. UU.) — envío de emails de alerta (si activado) · resend.com (DPA)",
  "legal.privacy.sub.aisstream":
    "aisstream.io — feed AIS público (no se transmite ningún dato personal del usuario)",
  "legal.privacy.sub.copernicus":
    "Copernicus Data Space (ESA) — imágenes satelitales Sentinel-1 (públicas)",
  "legal.privacy.transfersTitle": "Transferencias fuera de UE",
  "legal.privacy.transfersBody":
    "Clerk, Stripe, Cloudflare y Resend operan desde EE. UU. Todos disponen de Standard Contractual Clauses (SCCs) UE-EE. UU. Los datos AIS y de puerto (públicos por naturaleza) no constituyen datos personales transferidos.",
  "legal.privacy.rightsTitle": "Sus derechos",
  "legal.privacy.rights.access":
    "Acceso, rectificación — todo es visible en /account, modificable directamente",
  "legal.privacy.rights.delete":
    "Supresión — elimine su cuenta vía Clerk (las claves API + watchlist + alertas en cascada)",
  "legal.privacy.rights.portability":
    "Portabilidad — export CSV de su watchlist/flota disponible desde /fleet (Starter+)",
  "legal.privacy.rights.opt":
    "Oposición, retirada del consentimiento — desactivación de alertas o retirada de claves en cualquier momento en /account y /sources",
  "legal.privacy.rights.complaint":
    "Reclamación — ante la AEPD (España), CNIL (Francia) o cualquier otra autoridad de control europea",
  "legal.privacy.securityTitle": "Seguridad técnica",
  "legal.privacy.security.tls":
    "HTTPS TLS 1.3 obligatorio (Let's Encrypt). HTTP redirigido.",
  "legal.privacy.security.encryption":
    "Cifrado at-rest de los secretos del usuario (claves API de terceros): AES-256-GCM con master key del servidor",
  "legal.privacy.security.passwords":
    "Contraseñas gestionadas por Clerk (PBKDF2/Argon2id, nunca en texto claro)",
  "legal.privacy.security.audit":
    "Logs auditables (tabla audit_log) sobre cambios de suscripción y acceso API",
  "legal.privacy.security.mmsi":
    "MMSI mostrados = identificadores de buque, atribuidos por la UIT al pabellón — no son identificadores de personas",
  "legal.privacy.security.cookies":
    "Sin cookies de analytics de terceros. El único almacenamiento local es la caché del navegador para resiliencia de pestaña, purgable.",
  "legal.dpa.title": "Data Processing Agreement (DPA) — resumen",
  "legal.dpa.intro":
    "Para todo cliente UE profesional que utilice Port Flow para tratar datos en el marco de una actividad B2B, un DPA conforme al artículo 28 RGPD está disponible.",
  "legal.dpa.role":
    "Port Flow actúa como encargado del tratamiento para los datos procesados en el marco del servicio (watchlist, alertas, claves API)",
  "legal.dpa.noSecondary":
    "Sin tratamiento secundario: sin publicidad, reventa, perfilado comercial",
  "legal.dpa.breach": "Notificación de cualquier violación de datos en 72 h",
  "legal.dpa.audits":
    "Cooperación en auditorías anuales del cliente (con preaviso de 30 días)",
  "legal.dpa.endOfContract":
    "Eliminación o devolución de los datos al final del contrato (export CSV + purge DB bajo solicitud)",
  "legal.dpa.subList":
    "Lista de encargados arriba, modificable con preaviso de 30 días",
  "legal.dpa.outro": "DPA firmado bajo solicitud a",
  "legal.dpa.outroSuffix": " — plazo indicativo 48 h laborables.",
  "legal.sanctions.title": "Sanciones y cumplimiento",
  "legal.sanctions.b1":
    "La plataforma reconcilia automáticamente buques contra cuatro listas oficiales públicas (UK Sanctions List, OFAC SDN, UN Security Council Consolidated List, EU Consolidated FSF) — ver página metodología para cobertura detallada y frecuencia de actualización.",
  "legal.sanctions.b2":
    "El cliente (trader, asegurador, transitario) sigue siendo responsable de aplicar sus propias listas complementarias y procedimientos de screening (KYC, EDD, watchlists propias).",
  "legal.sanctions.b3":
    "La plataforma es comercialmente neutral: ningún buque se oculta en criterios distintos a las listas oficiales públicas citadas arriba.",
  "legal.citation.title": "Cita académica",
  "legal.citation.body":
    "Si cita Port Flow en una publicación, por favor incluya:",

  // /guide
  "guide.backLink": "← volver al dashboard",
  "guide.methodologyLink": "Metodología →",
  "guide.title": "Guía de uso",
  "guide.lead":
    "Port Flow ofrece una vista en tiempo real de los flujos marítimos sobre 51 puertos estratégicos (ARA, búnker, exportación LNG). Esta página explica cómo leer el dashboard, quién obtiene valor de él, y cómo integrar los datos en sus pipelines.",
  "guide.audience.title": "¿A quién sirve?",
  "guide.audience.traders":
    "Traders de materias primas (petróleo, LNG, química) — ETA precisa e índices de congestión alimentan los modelos de precios. Objetivo primario de la plataforma.",
  "guide.audience.forwarders":
    "Transitarios — anticipación de excesos de estancia (demurrage), elección de routing.",
  "guide.audience.insurers":
    "Aseguradoras marítimas — detección de anomalías (loitering, dwell anormal), risk pricing.",
  "guide.audience.quants":
    "Data scientists / quants — feed histórico para backtesting de estrategias macro (actividad portuaria = proxy económico).",
  "guide.dashboard.title": "Leer el dashboard en 30 segundos",
  "guide.dashboard.portSelector":
    "Selector de puerto arriba a la derecha — cambia el puerto observado. El nombre nativo aparece entre paréntesis si la lengua activa difiere (ej. Anvers, Hamburgo, الفجيرة).",
  "guide.dashboard.langSelector":
    "Selector de lengua al lado — 8 lenguas de negocio: FR, EN, NL, DE, ES, AR (con RTL automático), ZH, JA.",
  "guide.dashboard.toggle":
    "Toggle Todos / Tankers — filtra instantáneamente el mapa y los contadores a las 5 sub-clases tanker (crude, product, chemical, LNG, LPG).",
  "guide.dashboard.kpis":
    "Línea KPI — total buques, estacionarios (proxy de congestión), en ruta, atracados, entrantes/h, viajes activos rastreados.",
  "guide.dashboard.map":
    "Mapa — color = categoría AIS, tamaño = state. Los rectángulos punteados son las zonas nombradas (anchorage, berth, channel).",
  "guide.dashboard.voyages":
    "Viajes activos — tabla ordenada por ETA prevista. La columna \"ETA broadcast\" es la hora que la tripulación introdujo; comparar con las desviaciones del modelo.",
  "guide.dashboard.precision":
    "ETA precision — RMSE de nuestro modelo vs RMSE de la ETA broadcast. Es el indicador principal de calidad.",
  "guide.dashboard.anomalies":
    "Anomalías — buques en fondeo anormalmente prolongado para su clase. Crítico vigilar para congestión o particularidades operativas.",
  "guide.dashboard.flow":
    "Flujo 6 h — entrantes / salientes / estacionarios sobre las últimas 6 horas. Tendencia corta.",
  "guide.precision.title": "Página ETA precision",
  "guide.precision.body":
    "Accesible vía el botón ETA precision o /precision. Vista pública destinada a demostrar a los prospects la calidad del modelo. Tres indicadores clave: RMSE modelo, RMSE broadcast, desviación en %. Lista de los 50 últimos viajes cerrados con error en horas (verde < 1 h, ámbar < 3 h, rojo más allá). Metodología al pie de página. Filtro ventana 7/30/90 días.",
  "guide.api.title": "Integración API",
  "guide.api.intro": "API pública bajo /api/v1, autenticada por bearer token. Especificación OpenAPI en",
  "guide.api.endpoints":
    "Endpoints disponibles: /ports, /ports/{id}/snapshot, /ports/{id}/vessels, /ports/{id}/voyages/active, /ports/{id}/voyages/closed, /ports/{id}/anomalies, /webhooks.",
  "guide.webhooks.title": "Webhooks (alertas)",
  "guide.webhooks.intro":
    "Suscríbase a un evento para recibir un POST firmado HMAC-SHA256 cuando se cruza un umbral.",
  "guide.webhooks.headers":
    "Headers proporcionados en cada entrega: X-Port-Flow-Event y X-Port-Flow-Signature: t=<ts>,v1=<hex> (HMAC-SHA256 del payload prefijado por el timestamp). Verificación lado receptor: hmac_sha256(secret, \"{ts}.{body}\").",
  "guide.webhooks.events":
    "Eventos soportados: congestion.threshold / congestion.cleared, anomaly.detected, voyage.arrived.",
  "guide.limits.title": "Limitaciones conocidas",
  "guide.limits.coverage":
    "Cobertura AIS débil Mediterráneo y Golfo Pérsico con aisstream.io (red comunitaria). Algeciras, Fujairah, Ras Laffan muestran a menudo pocos o ningún buque en v1. Solución: pasar a un proveedor comercial (Spire, Orbcomm) — en la roadmap.",
  "guide.limits.classification":
    "Clasificación de carga ~85% (tankers) / ~95% (containers). Falsos positivos en buques no nombrados.",
  "guide.limits.grace":
    "Al inicio del worker, un periodo de gracia de 60 s evita contar los buques ya presentes como \"entrantes\". Los KPIs entrantes/h se calibran después naturalmente.",
  "guide.limits.eta":
    "Modelo ETA v2 (distancia/SOG + corrección estacional + congestión + meteorología). Bate la ETA broadcast en viajes > 6 h; menos ventaja en viajes cortos.",
  "guide.limits.sanctions":
    "Filtrado de sanciones multi-régimen integrado (UKSL + OFAC + UN-SC + EU) — ver página metodología. El cliente puede también superponer sus propias listas vía API.",
  "guide.checklist.title": "Checklist de despliegue",
  "guide.checklist.s1": "Crear una clave",
  "guide.checklist.s2":
    "cp .env.example .env.local, rellenar AISSTREAM_API_KEY y PORT_API_TOKENS.",
  "guide.checklist.s3": "npm install && npm run dev.",
  "guide.checklist.s4":
    "Verificar el banner AIS Live arriba a la derecha (verde = feed entrante).",
  "guide.checklist.s5":
    "Esperar 60 s + algunos minutos para ver los viajes abrirse (según el tráfico).",
  "guide.checklist.s6":
    "La página /precision mostrará cifras tras los primeros viajes cerrados (ETA prevista + llegada constatada).",
};

const ar: PageMessages = {
  "nav.back": "← رجوع",

  "pricing.title": "الأسعار",
  "pricing.subtitle":
    "AIS متعدد الموانئ · ETA متوقع · دمج SAR · فحص العقوبات · 51 ميناءً استراتيجياً",
  "pricing.note":
    "آمنة عبر Stripe. دورة شهرية أو سنوية، يمكن الإلغاء في أي وقت من بوابة الفوترة.",
  "pricing.note.label": "الدفع:",
  "pricing.vatNotice":
    "أسعار صافية. ضريبة القيمة المضافة غير مطبَّقة — المادة 293 B من قانون الضرائب العام الفرنسي (نظام الإعفاء الأساسي).",
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
    "الرحلة = أول رصد في الاقتراب/المرسى → الرسو على الرصيف، مُستنتَجاً من حالة الملاحة والحركة.",
  "precision.method.b3":
    "نموذج ETA: المسافة / SOG مع تصحيح بالوسيط المتحرك + عقوبة الازدحام الحية. يُحدَّث باستمرار. خارطة الطريق: تحسين يراعي المدّ والغاطس.",
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
    "مزيج من إشارات shipType الخاصة بـ AIS واستدلال نصّي (الاسم، الوجهة المعلنة) لتعيين فئة الحمولة — معايَر حسب الميناء وملف الأسطول. حالة حدّيّة: بيانات وصفية AIS شحيحة → تراجع إلى فئة عامة.",
  "methodology.voyages.title": "اكتشاف الرحلات",
  "methodology.voyages.open":
    "الفتح: تُفتَح رحلة عند رصد سفينة من فئة قابلة للتتبع (ناقلة / حاوية / صب / عام / RoRo) في الاقتراب أو الرسو مع حركة قابلة للقياس، بعد فترة سماح عقب بدء الـworker.",
  "methodology.voyages.arrival":
    "الوصول: انتقال إلى حالة moored في منطقة رصيف، مُستنتَجاً من حالة الملاحة والحركة.",
  "methodology.voyages.departure":
    "المغادرة: بعد الوصول، العودة إلى حالة underway مع تجاوز عتبة المسافة من مركز الميناء.",
  "methodology.voyages.falsePositives":
    "الإيجابيات الكاذبة: القاطرات والمرشدون والصيد مستبعدة من التتبع — فئة الحمولة تعمل كمرشّح.",
  "methodology.eta.title": "نموذج ETA",
  "methodology.eta.naive":
    "تقدير ساذج: المسافة / SOG حيث المسافة هي الدائرة العظمى بين الموضع الحالي ومركز الميناء. يُحدَّث باستمرار لكل رحلة نشطة.",
  "methodology.eta.seasonal":
    "تصحيح موسمي: وسيط متحرك للخطأ (predicted − actual) مجمَّع حسب ساعة الوصول. fallback إلى الوسيط العام عندما تكون العيّنة في الدلو ضحلة جداً. recompute منتظم.",
  "methodology.eta.broadcast":
    "المرجع المقارَن: حقل ETA broadcast المستخرج من رسائل ShipStaticData (يُدخَل يدوياً من قبل طاقم السفينة — غالباً غير دقيق ومتأخر).",
  "methodology.eta.metrics":
    "المقاييس: RMSE وMAE بالساعات، على الرحلات المغلقة التي تتوفر فيها ETA متوقعة وbroadcast. تُحدَّث عند كل رحلة مغلقة.",
  "methodology.eta.roadmap":
    "خارطة طريق النموذج: دمج الازدحام، المد والجزر، الطقس، متوسط السرعة التاريخية للسفينة المحددة.",
  "methodology.anomalies.title": "اكتشاف الشذوذ",
  "methodology.anomalies.intro":
    "v1: عتبات مطلقة لـdwell عند الرسو، معدّلة حسب فئة الحمولة.",
  "methodology.anomalies.tanker":
    "الناقلات (crude/product/chemical/LNG/LPG) — أوسع نافذة dwell مقبولة.",
  "methodology.anomalies.container":
    "الحاويات — أضيق نافذة dwell (فئة حرجة لدوران المخزون).",
  "methodology.anomalies.other":
    "الفئات الأخرى — نافذة dwell متوسطة.",
  "methodology.anomalies.roadmap":
    "خارطة الطريق: عتبات مشتقّة من التوزيع التاريخي حسب (الميناء، الحمولة)؛ اكتشاف انحراف المسار؛ اكتشاف loitering خارج المناطق المعروفة (إشارة \"dark fleet\").",
  "methodology.persistence.title": "الاحتفاظ والـlineage",
  "methodology.persistence.storage":
    "تخزين SQL علائقي مع lineage موَّقَّت زمنياً. كل مقياس قابل للتتبع وصولاً إلى مواقعه المصدر.",
  "methodology.persistence.timestamps":
    "كل سطر مقياس ورحلة يحمل الميناء والـtimestamp. قابلية إعادة إنتاج كاملة لمقياس في لحظة معطاة.",
  "methodology.persistence.snapshot":
    "snapshot المواقع: كتابات rate-limited لكل سفينة. يسمح بـbacktesting وإعادة تشغيل النموذج.",
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
    "اكتشاف point-in-bbox باستمرار على نافذة منزلقة من مواقع AIS.",
  "methodology.chokepoints.dedup":
    "Dedup عبر نافذة cooldown لاستيعاب jitter GPS دون مضاعفة الانتقالات.",
  "methodology.chokepoints.snapshot":
    "snapshot لحالة العقوبات عند الدخول — سفينة تُحذَف لاحقاً تظل موسومة جنائياً لذلك العبور.",
  "methodology.chokepoints.coverage":
    "التغطية عبر AIS الأرضي — موثوقية مثلى على نقاط الاختناق الساحلية (هرمز، باب المندب، ملقا، سنغافورة، البوسفور، مضيق دوفر، جبل طارق، السويس، بنما). المناطق الأبعد عن السواحل (رأس الرجاء الصالح، ماجلان، وسط البحر المتوسط): الكشف عند مرور المحطات الساحلية. تغطية ساتلية مستمرة عبر مفتاح BYO من Spire/Orbcomm (Pro+).",
  "methodology.chokepoints.alertPrefix": "تنبيه قابل للتركيب",
  "methodology.chokepoints.alertSuffix":
    ": يُطلَق في اللحظة التي تدخل فيها سفينة خاضعة للعقوبات إحدى هذه المناطق.",
  "methodology.emissions.title":
    "تقدير انبعاثات CO₂ — منهج داخلي",
  "methodology.emissions.intro":
    "نهج bottom-up مستمد من IMO Fourth GHG Study (2020)، مدمج على تدفق AIS بدون تبعية خارجية.",
  "methodology.emissions.power":
    "الطاقة المثبَّتة وسرعة الخدمة الافتراضية مستمدة من جداول IMO Annex 1، حسب فئة الحمولة (tanker / container / LNG / bulk …).",
  "methodology.emissions.skip":
    "تُستثنى فترات الرسو عند الرصيف أو على المرساة من الحساب (الحمل الإضافي الثابت غير مُنمذَج في v1). كما تُستثنى الأجزاء خارج تغطية AIS الأرضي — راجع حدود التغطية.",
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
    "通过 Stripe 安全支付。按月或按年计费，可随时从账单门户取消。",
  "pricing.note.label": "支付：",
  "pricing.vatNotice":
    "价格为净额。增值税不适用 — 法国《税法通则》第 293 B 条（小企业免税制度）。",
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
    "航次 = 首次进入接近区/锚地 → 靠泊，由导航状态和运动派生。",
  "precision.method.b3":
    "ETA 模型：距离 / SOG，带滑动中位数校正和实时拥堵惩罚，持续刷新。路线图：潮汐与吃水感知优化。",
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
    "结合 AIS shipType 信号和文本启发式（船名、声明目的地）来分配货物类别 — 按港口和船队结构进行校准。边界情况：AIS 元数据稀少时回退到通用类别。",
  "methodology.voyages.title": "航次检测",
  "methodology.voyages.open":
    "开启：当一艘可跟踪类别船舶（tanker / container / bulk / general / RoRo）在 worker 启动宽限期之后，被观察到以可测量运动接近或锚泊时，航次开启。",
  "methodology.voyages.arrival":
    "到达：在泊位区域过渡到 moored 状态，由导航状态和运动派生。",
  "methodology.voyages.departure":
    "离开：到达后，返回 underway 状态并结合距港口中心的距离阈值。",
  "methodology.voyages.falsePositives":
    "误报：拖船、引航员和渔船排除在跟踪之外 — 货物类别用作过滤器。",
  "methodology.eta.title": "ETA 模型",
  "methodology.eta.naive":
    "朴素估算：距离 / SOG，其中距离是当前位置与港口中心之间的大圆距离。每个活跃航次持续刷新。",
  "methodology.eta.seasonal":
    "季节性校正：按到达小时分桶的误差（predicted − actual）滑动中位数。当桶内样本过少时回退到全局中位数。定期重算。",
  "methodology.eta.broadcast":
    "比较参考：从 ShipStaticData 消息中提取的 ETA broadcast 字段（由船员手动输入 — 通常不准确且滞后）。",
  "methodology.eta.metrics":
    "指标：以小时为单位的 RMSE 和 MAE，针对同时具有预测 ETA 和 broadcast ETA 的已关闭航次。每个已关闭航次更新。",
  "methodology.eta.roadmap":
    "模型路线图：集成拥堵、潮汐、天气、特定船舶的历史平均速度。",
  "methodology.anomalies.title": "异常检测",
  "methodology.anomalies.intro":
    "v1：锚泊停留的绝对阈值，按货物类别调整。",
  "methodology.anomalies.tanker":
    "油轮（crude/product/chemical/LNG/LPG）— 可接受的最长停留窗口。",
  "methodology.anomalies.container":
    "集装箱 — 最紧的停留窗口（周转关键类别）。",
  "methodology.anomalies.other":
    "其他类别 — 中等停留窗口。",
  "methodology.anomalies.roadmap":
    "路线图：从 (港口, 货物) 历史分布派生的阈值；航线偏离检测；已知区域外的徘徊检测（\"dark fleet\" 信号）。",
  "methodology.persistence.title": "持久化与谱系",
  "methodology.persistence.storage":
    "带时间戳谱系的关系型 SQL 存储。每个指标都可追溯到其源位置。",
  "methodology.persistence.timestamps":
    "每条指标和航次行都携带港口和时间戳。给定时刻的指标完全可重现。",
  "methodology.persistence.snapshot":
    "位置快照：按船舶的速率限制写入。允许回测和模型重放。",
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
    "在滑动 AIS 窗口上持续进行 point-in-bbox 检测。",
  "methodology.chokepoints.dedup":
    "通过冷却窗口去重，吸收 GPS 抖动而不重复过境。",
  "methodology.chokepoints.snapshot":
    "进入时的制裁状态快照 — 之后被取消列表的船舶仍为该次过境保留法证标记。",
  "methodology.chokepoints.coverage":
    "通过陆基 AIS 覆盖 — 在沿海咽喉点（霍尔木兹、曼德海峡、马六甲、新加坡、博斯普鲁斯、多佛海峡、直布罗陀、苏伊士、巴拿马）可靠性最佳。更深远洋区域（好望角、麦哲伦、地中海中部）：依赖沿海站点过境时检测。通过 BYO Spire/Orbcomm 密钥（Pro+）获得连续卫星覆盖。",
  "methodology.chokepoints.alertPrefix": "可组合警报",
  "methodology.chokepoints.alertSuffix":
    "：在制裁船舶进入这些区域之一的瞬间触发。",
  "methodology.emissions.title":
    "CO₂ 排放估算 — 内部方法",
  "methodology.emissions.intro":
    "源自 IMO Fourth GHG Study (2020) 的 bottom-up 方法，集成在 AIS 数据流上，无外部依赖。",
  "methodology.emissions.power":
    "默认安装功率和服务速度取自 IMO Annex 1 表格，按货物类别（tanker / container / LNG / bulk …）。",
  "methodology.emissions.skip":
    "停泊或锚泊期间从计算中排除（v1 中不建模静态辅助负载）。陆基 AIS 覆盖范围之外的段也被排除 — 参见覆盖范围限制。",
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
    "Stripe 経由でセキュア。月次または年次サイクル、請求ポータルからいつでもキャンセル可能。",
  "pricing.note.label": "請求：",
  "pricing.vatNotice":
    "表示価格は税抜です。VAT 不適用 — フランス CGI 第 293 B 条（小規模事業者免税）。",
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
    "航海 = 接近域/錨地への初観測 → 岸壁係留、航行ステータスと動きから導出。",
  "precision.method.b3":
    "ETA モデル：距離 / SOG をローリング中央値で補正し、ライブ混雑ペナルティを加算。継続的に更新。ロードマップ：潮汐・喫水を考慮した精緻化。",
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
    "AIS shipType シグナルとテキストヒューリスティック（船名、申告された目的地）を組み合わせてカーゴクラスを割り当て — 港と船隊構成に応じて校正。エッジケース：AIS メタデータが乏しい場合は汎用クラスにフォールバック。",
  "methodology.voyages.title": "航海検出",
  "methodology.voyages.open":
    "オープン：追跡可能クラスの船舶（tanker / container / bulk / general / RoRo）が、worker 起動後の猶予期間を経て、計測可能な動きでアプローチまたは錨泊している様子が観測されたとき、航海がオープンします。",
  "methodology.voyages.arrival":
    "到着：バースゾーン内で moored 状態への遷移、航行ステータスと動きから導出。",
  "methodology.voyages.departure":
    "出発：到着後、underway 状態への復帰と港中心からの距離閾値の組み合わせ。",
  "methodology.voyages.falsePositives":
    "誤検出：タグ、パイロット、漁業は追跡から除外 — カーゴクラスがフィルターとして機能。",
  "methodology.eta.title": "ETA モデル",
  "methodology.eta.naive":
    "ナイーブ推定：距離 / SOG（距離は現在位置と港中心間の大圏距離）。アクティブ航海ごとに継続的に更新。",
  "methodology.eta.seasonal":
    "季節補正：到着時刻ごとにバケット化された誤差（predicted − actual）のローリング中央値。バケットのサンプルが薄い場合はグローバル中央値にフォールバック。定期的に再計算。",
  "methodology.eta.broadcast":
    "比較参照：ShipStaticData メッセージから抽出された ETA broadcast フィールド（船員が手動入力 — しばしば不正確で遅延）。",
  "methodology.eta.metrics":
    "メトリクス：時間単位の RMSE と MAE、予測 ETA と broadcast ETA の両方が利用可能なクローズ済み航海について。クローズ済み航海ごとに更新。",
  "methodology.eta.roadmap":
    "モデルロードマップ：混雑、潮汐、天候、特定船舶の履歴平均速度の統合。",
  "methodology.anomalies.title": "異常検出",
  "methodology.anomalies.intro":
    "v1：錨泊での絶対 dwell 閾値、カーゴクラスごとに調整。",
  "methodology.anomalies.tanker":
    "タンカー（crude/product/chemical/LNG/LPG）— 許容される最長の dwell ウィンドウ。",
  "methodology.anomalies.container":
    "コンテナ — 最も厳しい dwell ウィンドウ（回転率重要クラス）。",
  "methodology.anomalies.other":
    "その他のクラス — 中間の dwell ウィンドウ。",
  "methodology.anomalies.roadmap":
    "ロードマップ：(港、カーゴ) ごとの履歴分布から導出された閾値；ルート逸脱検出；既知ゾーン外のロイタリング検出（\"dark fleet\" シグナル）。",
  "methodology.persistence.title": "永続化と系統",
  "methodology.persistence.storage":
    "タイムスタンプ付き系統を備えたリレーショナル SQL ストレージ。すべてのメトリクスはソースポジションまで遡及可能。",
  "methodology.persistence.timestamps":
    "各メトリクスと航海行は港とタイムスタンプを保持。特定時点のメトリクスの完全な再現性。",
  "methodology.persistence.snapshot":
    "ポジションスナップショット：船舶ごとのレート制限された書き込み。バックテストとモデル再生を可能にします。",
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
    "AIS ポジションのスライディングウィンドウで、point-in-bbox 検出を継続的に実施。",
  "methodology.chokepoints.dedup":
    "GPS ジッターを吸収しながら通過を二重化しないよう、クールダウンウィンドウによる重複排除。",
  "methodology.chokepoints.snapshot":
    "エントリ時の制裁状態スナップショット — 後にリストから外された船舶もその通過に対しては法医学的にマークされたままです。",
  "methodology.chokepoints.coverage":
    "陸上 AIS によるカバレッジ — 沿岸チョークポイント（ホルムズ、バブ・エル・マンデブ、マラッカ、シンガポール、ボスポラス、ドーバー、ジブラルタル、スエズ、パナマ）で最高の信頼性。より深い大洋域（喜望峰、マゼラン、地中海中央部）：沿岸局通過時の検出に依存。BYO Spire/Orbcomm キー（Pro+）で連続衛星カバレッジを実現。",
  "methodology.chokepoints.alertPrefix": "コンポーザブルアラート",
  "methodology.chokepoints.alertSuffix":
    "：制裁対象船舶がこれらのゾーンの 1 つに入った瞬間にトリガーされます。",
  "methodology.emissions.title":
    "CO₂ 排出量推定 — 自社メソッド",
  "methodology.emissions.intro":
    "IMO Fourth GHG Study (2020) から派生したボトムアップアプローチ、外部依存なしで AIS フィード上で統合。",
  "methodology.emissions.power":
    "デフォルトの取付出力とサービス速度は IMO Annex 1 テーブルから、カーゴクラスごと（tanker / container / LNG / bulk …）。",
  "methodology.emissions.skip":
    "バースまたは錨泊中の期間はカウントから除外（静止補助負荷は v1 ではモデル化されていません）。陸上 AIS カバレッジ範囲外のセグメントも除外 — カバレッジ制限を参照。",
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
