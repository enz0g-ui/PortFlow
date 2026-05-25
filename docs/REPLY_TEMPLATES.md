# Reply templates — Port Flow outbound

Three response templates for the V1 cold outreach campaign (mails sent
Tuesday 26 May 2026, 09:00 BST / IST per prospect).

All replies go FROM `laurent@portflow.uk` (via Gmail "Send mail as"
alias → Zoho SMTP relay, DKIM/SPF/DMARC PASS). The "Standard portflow"
Gmail signature is auto-applied (no GDPR Art. 14 mention — that
obligation is only for first-contact / cold).

Variables to fill before sending: `{FirstName}`, `{ClerkMagicLink}`,
`{Company}` (where mentioned). All other text is verbatim.

---

## A. Welcome reply — prospect wants permanent account

**Trigger**: Prospect replies "yes, my email is xxx@company.com" (with
or without code redemption beforehand).

**Action sequence on receipt**:

1. Open Clerk dashboard → Users → Create user
2. Email: the address they provided
3. Choose "Send invitation email" (Clerk emails the magic link)
4. Copy the invitation URL from Clerk (or rely on Clerk's own email)
5. Paste the reply below into Gmail, fill `{FirstName}` and
   `{ClerkMagicLink}`, send

**Subject** (auto-applied as Re:): same as original cold mail

**Body**:

```
Hi {FirstName},

Account is being set up now. You'll receive a separate email from
Clerk (clerk.portflow.uk) with a link to set your password — should
land in 1–2 minutes. If you don't see it, check spam (new domain,
some filters are aggressive the first week).

Once you're in, Free tier opens the full read-only view: live AIS
on 51 ports, predicted ETA with confidence intervals, sanctions
screening (visual), 12 chokepoint dashboards, public RMSE on
/precision. No expiration on Free.

Reply when you've had a chance to poke around (a day or two is
usually enough) and I'll flip your account to Pro+ for 14 days at
no charge — that unlocks 250-vessel watchlist, API access,
multi-regime sanctions matching with audit trail, dark fleet
detection (AIS-off vessels), and SAR fusion.

I'll check in Thursday either way.

Best,
The Port Flow team
```

---

## B. J+3 follow-up — no response by Friday 29 May 2026

**Trigger**: No reply 3 business days after the original send.
Target send: Friday 29 May 2026, 10:00 BST / 09:00 IST per prospect.

**Subject** (new thread or reply with prefix):

- New: `Quick follow-up on Tuesday's note`
- Reply prefix: keep `Re: <original subject>` (better deliverability —
  same thread)

**Body** (per-prospect code is filled in):

```
Hi {FirstName},

Quick bump in case Tuesday's note got buried — happens to all of us.

The 30-min Pro+ preview at https://portflow.uk/demo with code
{ProspectCode} is still active if you want to try it on your desk
this week. Takes one click, no account creation.

If it's not a fit right now, no problem — reply STOP and I'll close
the loop on my side (contact deleted within 24 h, per the GDPR
mention on the original mail).

Best,
The Port Flow team
```

**Codes for reference**:

- Jason Gladysz → `JASON-26`
- Alex Hill → `ALEX-26`
- Marek Jezierski → `MAREK-26`
- Manish Mathur → `MANISH-26`

---

## C. Decline / unsubscribe reply — polite close

**Trigger**: Prospect replies negatively ("not interested", "not
relevant", "please stop", "STOP", or any clear declination).

**Action sequence on receipt**:

1. Mark contact as `declined` in your prospect tracker
2. Send the reply below
3. **Within 24 h**: delete their email from any tool that stored it
   (Hunter cache, NeverBounce history, Gmail contacts, the V1
   prospects spreadsheet)
4. **Within 30 days**: confirm full deletion (Clerk if account was
   created, mailing tool history, archive BCC mirror in personal
   Gmail). Log the deletion date in a tracker for GDPR audit.

**Subject** (reply prefix): keep `Re: <original subject>`

**Body**:

```
Hi {FirstName},

Understood — thanks for the quick reply, that's the most useful
answer for both of us.

I'll remove your address from our outbound list immediately and
confirm full deletion within 30 days per the GDPR notice on the
original mail. You won't hear from me again.

If anything changes on your desk down the line, portflow.uk is
the home — no signup needed to read the public methodology pages
(/methodology, /precision, /sources).

All the best with the rest of your week.

The Port Flow team
```

---

## Important rules (apply to all 3 templates)

- Display name on outgoing must show `Port Flow` (not "Laurent
  Guglielmetti") — already configured on the alias as of 2026-05-24
- Do NOT add the GDPR Art. 14 mention to replies. It belongs only on
  first cold contact. Reply correspondence is opt-in by the prospect
  the moment they engage
- Do NOT add a separate sign-off above "The Port Flow team" — keep
  the team voice consistent with the cold mail
- BCC `guglielmetti.laurent@gmail.com` for personal archive on
  EVERY reply (same convention as cold mails)
- Do not embed tracking pixels or UTM-tagged links. The bounce on a
  flagged-as-marketing reply costs the new portflow.uk domain
  reputation in a window where it's still building trust
