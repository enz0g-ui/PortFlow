# Port Flow — Outbound templates

5 ICP × 2 langues × 2 formats (LinkedIn DM + cold email). Hooks ancrés sur
l'analyse concurrentielle Perplexity (avril 2026) — chaque accroche cite une
lacune réelle des incumbents documentée publiquement.

**Avant d'envoyer :**
- Personnalise les `[BRACKETS]` (nom, port d'intérêt, contexte)
- LinkedIn DM ≤ 300 caractères (limite). Cold email ≤ 120 mots (taux d'ouverture)
- Toujours un seul CTA par message
- Suite à 3 jours, si pas de réponse, envoie le **follow-up** plus court

---

## ICP 1 — Trader pétrolier indépendant / mid-market trading desk

### LinkedIn DM (FR)
```
Bonjour [Prénom], j'ai vu que vous suivez le marché tanker depuis [TradingDesk].

Beaucoup de desks paient 55k$/an à Kpler pour ce qu'ils n'utilisent qu'à 30%.
Port Flow donne l'ETA corrigé par cargo×heure×jour pour 51 ports stratégiques
(Hormuz, Fujairah, Rotterdam, Singapore…) à 499 €/mo, avec alertes Slack.

Ça vous intéresse de comparer 5 minutes ?
```

### LinkedIn DM (EN)
```
Hi [First Name], saw you trade tanker at [TradingDesk].

Most desks pay 55k$/yr to Kpler for what they only use 30% of. Port Flow
delivers cargo×hour×day-corrected ETAs for 51 strategic ports (Hormuz,
Fujairah, Rotterdam, Singapore…) at €499/mo with Slack alerts.

Worth a 5-min compare?
```

### Cold email (FR)
```
Objet : ETA tanker précis sans payer 55k$/an

Bonjour [Prénom],

[TradingDesk] suit probablement les mouvements crude/product sur Hormuz et
Rotterdam comme tout le marché. La question est : à quel prix ?

Kpler facture 55k$/an médiane. MarineTraffic, depuis l'absorption Kpler,
a supprimé ses add-ons flexibles. Sinay est orienté container EU.

Port Flow donne :
· 51 ports stratégiques tanker (incluant chokepoints Moyen-Orient + Asie)
· ETA corrigé par cargo × heure × jour avec pénalité congestion live
· Alertes Slack/Telegram natives sur ta watchlist
· Demurrage risk score live
· 499 €/mois — 100x moins cher que Kpler

RMSE public mesurable sur portflow.uk/precision (pas du marketing).

15 minutes pour te montrer la différence sur tes 5 ports prioritaires ?

[Signature]
portflow.uk
```

### Cold email (EN)
```
Subject: Accurate tanker ETAs without paying 55k$/yr

Hi [First Name],

[TradingDesk] tracks crude/product flows around Hormuz and Rotterdam like
everyone else. The real question: at what price?

Kpler median is 55k$/yr. MarineTraffic, since the Kpler acquisition, has
stripped flexible add-ons. Sinay is EU container-focused.

Port Flow gives you:
· 51 strategic tanker ports (Middle East + Asia chokepoints included)
· Cargo × hour × day-corrected ETA with live congestion penalty
· Native Slack/Telegram alerts on your watchlist
· Live demurrage risk score
· €499/mo — 100x cheaper than Kpler

Public measurable RMSE at portflow.uk/precision (not marketing — math).

15 minutes to show you the diff on your 5 priority ports?

[Signature]
portflow.uk
```

### Follow-up (FR/EN, J+3)
```
[Prénom], si la priorité du moment est ailleurs, je comprends.
1 question : votre desk a-t-il visibilité live sur les anchorages Fujairah ?
C'est le trou typique de MarineTraffic. Sinon je n'insiste pas.
```

---

## ICP 2 — Freight forwarder spécialisé bulk liquid / hydrocarbures

### LinkedIn DM (FR)
```
Bonjour [Prénom],

Beaucoup de forwarders bulk liquid ont quitté MarineTraffic depuis que Kpler
a supprimé les add-ons flexibles. Port Flow donne le score demurrage risk
live sur ta watchlist navires, sans per-vessel fee, à 199 €/mo (plan
Professional).

5 minutes pour voir ?
```

### LinkedIn DM (EN)
```
Hi [First Name],

Lots of bulk liquid forwarders left MarineTraffic after Kpler killed the
flexible add-ons. Port Flow gives live demurrage risk score on your vessel
watchlist, no per-vessel fee, at €199/mo (Professional tier).

Worth 5 min?
```

### Cold email (FR)
```
Objet : demurrage risk live sur ta watchlist sans per-vessel fee

Bonjour [Prénom],

Le calcul demurrage manuel sur Excel à partir de l'ETA broadcast, c'est
typiquement 30 min/jour par opérateur — et toujours en retard sur la
congestion réelle.

Port Flow Professional (199 €/mo) :
· Watchlist illimitée navires + ports
· Demurrage risk score live (probabilité dépassement laytime, basé p50/p75
  historique du port × cargo + congestion live)
· Alertes Slack/Telegram sur arrivée et anomalies
· Export CSV pour ton ERP / Excel
· Screening sanctions OFAC + UK OFSI inclus

Pas de surcoût par navire. Pas de plan Enterprise caché.

15 minutes pour brancher tes 20 navires les plus suivis ?

[Signature]
```

---

## ICP 3 — Compliance officer / P&I club

### LinkedIn DM (FR)
```
Bonjour [Prénom],

29% du dark fleet utilise désormais de faux pavillons (rapport Windward 2025).
Port Flow détecte SAR + VIIRS en BYO key à 499 €/mo, là où Windward facture
un budget Enterprise pour la même capacité comportementale.

Pertinent pour [P&I Club] ?
```

### Cold email (FR)
```
Objet : Detection comportementale SAR+VIIRS sans budget Enterprise

Bonjour [Prénom],

Le P&I market exige désormais un "behavioural layer" pour le vetting de
membres. Windward le fait à un coût budget Enterprise. Pole Star est
orienté screening batch, pas opérationnel self-serve.

Port Flow Pro (499 €/mo) :
· BYO key chiffré côté serveur pour Spire/VIIRS/Orbcomm — utilise tes
  propres abonnements existants
· Fusion AIS + SAR Sentinel-1 (gratuit via Copernicus)
· Detection AIS gap + STS transfer + flag changes
· Screening OFAC + UK OFSI live sur 1 987 entrées indexées
· Alertes natives Slack/email

Tu peux tester ta clé Spire en 30 secondes via /sources, c'est en place.

15 minutes pour te montrer la fusion sur Hormuz ou Rotterdam ?

[Signature]
```

---

## ICP 4 — Underwriter / souscripteur Hull & P&I

### Cold email (FR)
```
Objet : Screening comportemental sanctions OFAC + UK OFSI inclus

Bonjour [Prénom],

OFAC et UK OFSI exigent désormais un screening comportemental, pas seulement
une vérification de liste statique. La guidance OFAC d'avril 2025 sur les
navires iraniens en est l'illustration la plus récente.

Port Flow t'offre la couche de données pour enrichir ta due diligence
underwriting :
· Screening OFAC SDN + UK OFSI (1 987 entrées indexées, refresh 24h)
· VIIRS night detection en BYO key (vessels AIS éteints détectés via lights)
· SAR Sentinel-1 fusion sur les anchorages STS (Hormuz, Strait of
  Singapore, Hormuz)
· API publique pour intégration dans ta stack underwriting
· DPA RGPD signable pour ton service compliance

ROI typique documenté : un seul cas évité finance l'abonnement Pro un an.

15 minutes pour mapper ça à ton workflow ?

[Signature]
```

---

## ICP 5 — Opérateur portuaire / port agent Moyen-Orient & Asie

### LinkedIn DM (FR)
```
Bonjour [Prénom],

La congestion à Fujairah et Singapore évolue à l'heure près. Port Flow
calcule en temps réel le risque demurrage sur ta watchlist navires avec
une pénalité congestion live, et t'alerte sur Telegram avant que le retard
ne devienne irréversible.

199 €/mo, 30 ports stratégiques. Test 5 min ?
```

### Cold email (FR)
```
Objet : Alertes Telegram avant que la congestion devienne irréversible

Bonjour [Prénom],

Pour un port agent à Fujairah ou Jebel Ali, la valeur d'une alerte vient de
sa précocité. Une alerte ETA "+8h" au moment où le navire est déjà bloqué
est inutile.

Port Flow alerte sur :
· Variation predicted_eta dépassant ton seuil (configurable)
· Saut de congestion port (anchored count > seuil)
· Arrivée d'un navire de ta watchlist (typiquement avant les ETA broadcast)
· Anomalie comportementale (AIS gap, sudden zone change, etc.)

Canal de ton choix : Slack, Telegram, email, webhook custom. Pas de
"limit alerts/month" caché.

199 €/mo (Professional). Test depuis Fujairah en 5 minutes ?

[Signature]
```

---

## Cadence et conseil pratique

**Cadence recommandée par prospect :**

| Jour | Canal | Type |
|---|---|---|
| J+0 | LinkedIn | Connection request avec note (pas de DM avant accept) |
| J+1 | LinkedIn DM | Accroche courte |
| J+3 | Email | Long form avec proof points |
| J+8 | LinkedIn DM | Follow-up court |
| J+14 | Email | Follow-up "ferme la loop" + valeur ajoutée gratuite |

**Conseil :** ne pas envoyer la même semaine LinkedIn + email. C'est lu
comme harcèlement. Espacer minimum 3 jours.

**Tracking minimal :** Notion ou Google Sheet avec colonnes :
`prospect | company | ICP | channel | sent_at | replied | tier_interest | next_action`

**Volume cible mois 1 :**
- 60 LinkedIn DMs (3/j × 20 jours ouvrés)
- 20 cold emails (1/j sur les ICPs les plus chauds)
- Cible réaliste : 5-10% reply rate, 1-2% démo book → 1 démo/sem en
  rythme de croisière → 3-5 démos en mois 1

**Outils recommandés :**
- LinkedIn Sales Navigator (Pro tier ~80€/mo)
- Apollo.io ou Hunter.io pour les emails (free tier suffisant au démarrage)
- Calendly pour booker les démos sans friction
