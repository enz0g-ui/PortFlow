# Port Flow — i18n status (mai 2026)

État de la couverture de traduction par page et par locale. Source de vérité :
`src/lib/i18n/pages.ts`. Le fallback de la fonction `tp()` est : locale demandée
→ EN → key brute. Donc les cellules vides ci-dessous = page rendue en EN pour
ces utilisateurs (UX dégradé mais fonctionnel).

## Couverture actuelle (clés par locale × page)

| Page | fr | en | nl | de | es | ar | zh | ja |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| /pricing | 45 | 45 | 30 | 30 | 30 | 30 | 30 | 30 |
| /precision | 30 | 30 | 30 | 30 | 30 | 30 | 30 | 30 |
| /methodology | 73 | 73 | 73 | 73 | 73 | 73 | 73 | 73 |
| /legal | 87 | 87 | **87** | **87** | **87** | — | — | — |
| /guide | 41 | 41 | **41** | **41** | **41** | — | — | — |
| /sources | 49 | 49 | — | — | — | — | — | — |
| /status | 38 | 38 | — | — | — | — | — | — |
| /widget | hardcodé en composant | | | | | | | |
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| /fleet | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

Légende :
- nombres : nombre de clés présentes dans le bloc (manquantes = fallback EN via `tp()`)
- — : pas encore traduit, fallback EN
- **gras** : ajouté dans cette session

Légende :
- ✅ traduit
- ⏳ fallback EN (UX dégradé mais fonctionnel)
- ⚠️ partiel (FR a 30 clés, EN a 69 — 39 clés manquantes côté FR à rattraper)
- ❓ inconnu / hardcodé en page (pas dans pages.ts)

## Priorité de complétion

| Pas | Action | Effort | Justification |
|---|---|---|---|
| 1 | /sources : sync FR sur les 39 clés EN manquantes | ~30 min | Page B2B, prospects la lisent pour vérifier les licences |
| 2 | /guide : NL/DE/ES | ~1h | Onboarding pour clients européens |
| 3 | /status : NL/DE/ES (light, status est très technique) | ~30 min | Pas critique mais user-facing |
| 4 | /widget : audit (probablement hardcodé) | 30 min | À investiguer |
| 5 | /legal : AR/ZH/JA | ~1h | Bas priorité — EN authoritative pour B2B international |
| 6 | /guide /status : AR/ZH/JA | ~2h | Bas priorité — EN suffisant |

## Notes de méthodologie (pour les futurs traducteurs)

- **Termes techniques maritimes** (AIS, MMSI, IMO, RoRo, SOG, NavStatus, RMSE,
  MAE, SLA, GDPR, KYC, EDD) restent en anglais dans toutes les locales — ce sont
  des standards internationaux.
- **Marques et URLs** restent intactes : Spire, MarineTraffic, Orbcomm, Stripe,
  Clerk, Cloudflare, DigitalOcean, Resend, aisstream.io, Copernicus.
- **Tonalité** : B2B technique professionnel. Pas de marketing speak.
- **Clés `b1/b2/b3` etc.** sont des bullets de listes — garder phrases courtes.
- **Attention** : les pages `/legal` contiennent du texte engageant (DPA,
  RGPD). En cas de doute lors de la traduction, garder la formulation EN/FR
  comme référence et ajouter "Authoritative version is FR/EN" en pied de page.

## Mise à jour

Mettre à jour ce tableau au moment de chaque nouvelle traduction. La commande
de comptage par page :

```bash
for prefix in pricing precision methodology legal guide sources status widget; do
  for spec in "fr 10 540" "en 540 1130" "nl 1130 1490" "de 1490 1840" "es 1840 2200" "ar 2200 2570" "zh 2570 2920" "ja 2920 3270"; do
    set -- $spec
    n=$(sed -n "$2,$3 p" src/lib/i18n/pages.ts | grep -c "\"${prefix}\\.")
    [ "$n" -gt 0 ] && echo "$prefix.$1: $n"
  done
done
```

Dernière mise à jour : 2026-05-10 (commit avec /methodology + /legal NL/DE/ES).
