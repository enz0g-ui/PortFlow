# Port Flow — Plan Go-to-Market (v1, mai 2026)

> Playbook opérationnel solo-founder. 30 min / jour d'outbound, pas un plan
> corporate. Objectif : 10 clients payants en 90 jours.

---

## TL;DR

- **Cible primaire** : ICP 1 (traders tanker indé / mid-market) — meilleur
  ratio fit × cycle × ARR pour un solo. ICP 4 (underwriters) en secondaire.
- **Canal** : LinkedIn DM > Cold email > Référence. Pas de paid acquisition
  avant 20 clients.
- **Volume** : 10 leads / jour qualifiés sur LinkedIn, 3 cold emails / jour
  ultra-personnalisés. ≈ 200 touches / mois.
- **Funnel attendu** : 200 touches → 30 réponses → 10 démos → 3 clients =
  ~1.5% conversion brute. ARR moyen 3500 € (mix Starter/Pro annuel).
- **Différenciateur unique** : 100x moins cher que Kpler, méthodologie
  publique sur `/precision`, pas de lock-in (Stripe Customer Portal).

---

## 1. État actuel (snapshot mai 2026)

### Produit
- 51 ports stratégiques (ARA + bunkering + LNG export + chokepoints).
- ETA v2 (médiane par cargo × heure × jour + pénalité congestion +
  attribution météo).
- Sanctions multi-régime : UKSL + OFAC + UN-SC (1 989 + 1 480 + 20 navires).
- Détection chokepoint avec snapshot sanctioned + alerte composable.
- Estimation CO₂ in-house par AIS (IMO 4th GHG Study).
- Dark fleet detection (Welch et al. 2022 — coupures AIS suspectes).
- Webhooks Slack / Discord / Telegram / Email natifs.
- 5 plans : Free (3 ports / 5 navires) → Starter (15 ports, 129 €/mo) →
  Professional (199 €) → Pro (499 €) → Enterprise (custom).
- Yearly -25 % + Founder code -30 % à vie (premier 100 clients).

### Stack légal / financier
- Octopode en cours de création (URSSAF + INPI). SIRET attendu 2-3 sem.
- Stripe en mode test → bascule Live dès SIRET.
- Clerk en dev → Production keys idem.

### Preuves publiques activées
- `/precision` : RMSE modèle vs ETA broadcast, 984 voyages clos comparés.
- `/methodology` : sources, formules, licences. Confiance ingénieur.
- `/sources` : licence par flux, rappel public-domain / CC-BY.
- `/api-docs` : surface OpenAPI publique.
- `/status` : healthcheck temps réel.

---

## 2. ICP priorisation

| # | ICP | ARR target | Cycle | Fit produit | Priorité |
|---|---|---|---|---|---|
| 1 | Trader tanker indé / mid-market | 4 200–6 000 € | 1-2 sem | ★★★★★ | **A** |
| 4 | Underwriter Hull & P&I | 4 200–10 000 € | 4-6 sem | ★★★★ | **A** |
| 3 | Compliance / P&I club | 4 200–6 000 € | 6-8 sem | ★★★★ | B |
| 5 | Port agent ME / Asie | 1 500–4 200 € | 2-4 sem | ★★★ | B |
| 2 | Freight forwarder bulk | 1 500–4 200 € | 3-5 sem | ★★★ | C |

**Logique** : ICP 1 (traders) ont le pain le plus aigu (Kpler 55 k$/an) et
le cycle le plus court (décision individuelle ou pair, pas de comité). ICP 4
a le plus gros ARR mais cycle long ; on parallélise. ICP 3 vient après
SIRET + DPA signé. ICP 2 et 5 = plus tard, après PMF confirmé.

### Les 3 questions disqualifiantes (early)
1. **Combien tu paies aujourd'hui ?** Si réponse "rien, je regarde sur
   MarineTraffic Free" → on parle plus tard, pas le bon profil.
2. **Sur quels ports / régions tu prends tes décisions ?** Si pas dans nos
   51 → on note pour roadmap mais pas de close maintenant.
3. **Tu décides seul ou il y a un comité achats ?** Si comité → on cale
   un appel de découverte ; si individuel → on push au close.

---

## 3. Outbound — playbook quotidien (30 min)

### Sources de leads (gratuit, légal)
- **LinkedIn Sales Navigator** (1 mois trial gratuit puis 99 $/mo) —
  filtres : industrie "Maritime / Oil & Gas Trading", titre "Trader,
  Analyst, Chartering Manager", géo Europe + UAE + Singapour, taille
  société 11-200.
- **Equasis registry** (gratuit) — pour identifier opérateurs qui matchent
  un MMSI / IMO sanctionné. Bon hook pour ICP 3.
- **AIS Hub forum + r/maritimedispatchers** — outreach communautaire low-key.
- **Conférences** : Sea Asia, IP Week (Londres), TankerOps Singapour.
  Programme 2026 → liste de speakers + participants visible.

### Cadence quotidienne (30 min)

```
M lundi : 10 nouveaux prospects LinkedIn (recherche + connection request)
M mardi : 3 cold emails ultra-perso (ICP 1 ou 4)
M mercredi : 5 follow-ups LinkedIn DM (J+3 sur les connections acceptées)
M jeudi : 3 cold emails (autre ICP)
M vendredi : revue funnel + ajustement messaging
```

### Sequence type (ICP 1)
1. **J0** — Connection request LinkedIn, message ≤ 300 chars : voir
   `OUTBOUND_TEMPLATES.md` ICP 1 LinkedIn DM.
2. **J3** (si accepté, pas de réponse) — Follow-up DM 1 ligne :
   "[Prénom], 5 min cette semaine ? Je peux te montrer Hormuz live."
3. **J7** (si toujours pas de réponse) — Cold email perso (autre canal).
4. **J14** — Soft close : "Pas le bon timing, je te recontacte dans 3 mois."
   Mettre dans pipeline "à recontacter Q3".

### Personnalisation obligatoire
Chaque message DOIT citer **un fait spécifique** sur le prospect : un post
récent, un trade public, une transaction Bloomberg, un déplacement à une
conf. Sans ça, taux de réponse < 2 %.

---

## 4. Démo / appel de découverte (15-25 min)

### Structure (script timing)

```
0–2 min   Contexte : "Tu paies X aujourd'hui, c'est ça le sujet ?"
2–7 min   Démo live sur LEUR port d'intérêt (via /?port=hormuz)
            - Montre l'ETA prédit vs broadcast
            - Montre la table voyages actifs avec drill-down
            - Montre les sanctions (badge rouge sur tankers IRGC-flagged)
7–12 min  Use case concret : "Tu reçois ce navire dans 3h, le quai libre
            est dans 6h, le démurrage commence à 4h post-arrivée. Voilà
            le calcul tarifaire qui justifie 1 800 €/voyage."
12–15 min Pricing : 499 €/mo Pro = 1 voyage de démurrage évité par mois
            payé 12x en RMI. Founder code = -30 % à vie sur les 100
            premiers clients (compteur public sur /pricing).
15–25 min Q&A, reformulation des objections, close ou next-step.
```

### Objections récurrentes + réponses

| Objection | Réponse |
|---|---|
| "Notre ETA broadcast suffit" | Métrique publique sur `/precision` : RMSE broadcast 5.17h, RMSE Port Flow 5.17h pour les voyages que les armateurs ont déclarés. Pour les autres (≈70 %), broadcast = RIEN, on est la seule source. |
| "Kpler a plus de données" | C'est vrai, mais 80 % des desks utilisent Kpler à 30 % de capacité. Tu paies 55 k$ pour 17 k$ de valeur réelle. Démarre Pro chez nous, garde Kpler 6 mois pour validation, puis tu coupes. |
| "On va internaliser avec un dev junior" | Coût dev Junior 60 k€/an + maintenance + AIS feed 12 k€/an = 72 k€ minimum, sans la précision ETA v2. Tu rentres dans tes coûts en 18 mois. Chez nous : 6 k€/an. |
| "Vous êtes nouveaux, pas de track record" | Méthodologie publique, RMSE mesurable, GitHub OS ouvert pour les ingestors. Founder code = paris communs. |

---

## 5. Pricing au moment du close

### Levers à utiliser (ordre de priorité)
1. **Founder code 30 % à vie** — premier 100 clients. Crée urgence.
2. **Yearly -25 %** sur top du Founder code → -45 % effectif vs monthly
   list.
3. **Trial 14 jours gratuit** sur Pro. Self-serve. Pas de carte demandée.
4. **2-month-free pour referral** : un client = 2 mois offerts si il en
   amène un autre qui reste 3 mois.

### Plans recommandés par ICP

| ICP | Plan starter | Upsell path |
|---|---|---|
| 1 (trader) | Pro 499 €/mo | Pro yearly avec founder code = ~3 500 €/an |
| 4 (underwriter) | Pro 499 €/mo | Enterprise après 3 mois (5+ users) |
| 3 (compliance) | Professional 199 €/mo | Pro après ajout 2 users |
| 5 (port agent) | Starter 129 €/mo | Stable à Starter, upsell rare |

### Don't
- Ne **jamais** discount au-delà du Founder code. Sinon on cannibalise.
- Ne **jamais** vendre sans demander la carte. La friction perdue =
  client non engagé = churn à 3 mois.

---

## 6. Inbound — assets à activer (parallèle à l'outbound)

### Court terme (mai-juin 2026)
- ✅ `/precision` avec OG image dynamique → partages LinkedIn / Twitter
  high-engagement.
- ✅ `/methodology` documenté → confiance ingé senior.
- 🟡 **Article LinkedIn** — "Comment on mesure l'ETA tanker à 5h près
  pour 1/100ème du prix de Kpler". Cible 50 connexions, viser 5 réponses.
- 🟡 **Post comparatif** Port Flow vs Kpler vs MarineTraffic vs Sinay —
  tableau public, pas de FUD, juste les faits. Bon viral potential.
- 🟡 **Demo vidéo Loom** 4 min — embarquer dans cold email + LinkedIn.
  Boost taux de réponse +30 % d'après benchmarks.

### Moyen terme (été 2026)
- **SEO / blog** : 1 article / mois sur "Hormuz transit times Q2 2026"
  type, avec data Port Flow. Long-tail, 2-3 ans de payoff.
- **Webinar mensuel** "Tanker market tour" — 30 min, gratuit, lead-gen.
- **Open-source ingestors** sur GitHub — UKSL parser, OFAC parser, UN-SC
  parser. Crée trust technique + backlinks SEO.

### Long terme
- **API publique freemium** — 100 req/jour gratuites avec attribution.
  Acquisition viral chez les devs maritime.
- **Partner programs** : intégration native dans Vortexa-like / shipbroker
  CRMs. Revenue share 20 %.

---

## 7. Métriques & objectifs 90 jours

### Funnel cible
| Étape | Volume / mois | Conversion | Source |
|---|---|---|---|
| Touches outbound | 200 | — | LinkedIn 150 + email 50 |
| Réponses positives | 30 | 15 % | Personnalisation + proof |
| Démos calées | 12 | 40 % | Sequence J3/J7/J14 |
| Démos faites | 10 | 83 % | Réminders + Calendly |
| Closes | 3 | 30 % | Founder code + trial |

### KPIs hebdo (à logger dans Notion / sheet)
- Connections envoyées : objectif 50 / sem
- Connections acceptées : objectif 25 / sem (50 %)
- DMs envoyés : 10 / sem (sur connections acceptées)
- Réponses reçues : 3-5 / sem
- Démos calées : 1-2 / sem
- Démos faites : 1 / sem
- Closes : 1 toutes les 3 sem (objectif 90j = 12 closes)

### Cible 90 jours
- **12 clients payants** (mix Starter/Pro)
- **MRR 6 000 €** (ARR 72 k€)
- **Churn < 10 %** sur les 6 premiers
- **NPS > 40** sur premier batch
- **3 témoignages publics** signés (LinkedIn ou page dédiée)

---

## 8. Risques & alternatives

### Risque 1 — Réponse outbound < 2 %
**Symptôme** : 200 touches, < 4 réponses positives en mois 1.
**Pivot** : passer à 100 touches / mois mais ultra-perso (vidéo Loom +
réf à un fait public spécifique). Tester sur 3 semaines avant de juger.

### Risque 2 — Cycle de vente plus long que prévu (4-6 sem au lieu de 1-2)
**Symptôme** : démos faites mais closes différés.
**Pivot** : trial 30 jours au lieu de 14, ajouter onboarding live 30 min.
Permet d'allonger la phase d'engagement sans perdre le lead.

### Risque 3 — Concurrents baissent leurs prix
**Symptôme** : Kpler annonce un plan à 5 k$/mo.
**Pivot** : verrouiller sur la méthodologie publique + open-source. Si
Kpler doit s'ouvrir, on est déjà devant. Différenciation par licence
(notre stack 100 % redistributable, eux non).

### Risque 4 — Octopode SIRET retardé
**Symptôme** : INPI bloqué > 4 sem.
**Pivot** : continuer outbound en mode "early access waitlist" — pas de
paiement encore, mais collecte de leads + intent. Switch dès SIRET reçu.

---

## 9. Checklist mensuelle de revue

À faire le 1er du mois, 30 min :
- [ ] Rapport funnel (réelle vs cible)
- [ ] Top 5 leads en hot pipeline (à closer ce mois)
- [ ] 3 leads churned ou perdus → analyse cause
- [ ] 1 ajustement messaging (test A/B sur ICP 1 par exemple)
- [ ] 1 nouveau asset inbound publié (article / post / video)
- [ ] Update du CRM (Notion / Airtable / Pipedrive)

---

## Annexe — Outils recommandés (solo-founder budget)

| Outil | Prix | Usage |
|---|---|---|
| LinkedIn Sales Navigator | 99 $/mo (1er mois free) | Sourcing leads |
| Calendly | Free → 8 €/mo | Démos auto-bookées |
| Loom | Free → 8 €/mo | Démos vidéo asynchrones |
| Notion / Airtable | Free | CRM léger |
| Resend | Free → 20 $/mo | Cold emails (sender repute > Gmail) |
| Hunter.io | Free → 49 $/mo | Email finder pour cold outbound |

Total stack outbound : ~150 €/mois. À déduire du budget marketing dès
mois 2.

---

**Dernière mise à jour : 2026-05-10. À revoir à la fin du mois 1 (juin).**
