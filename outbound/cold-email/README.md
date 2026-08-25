# Cold-email sequence — MeasureWise

Written for **Jessica R. Smith, BSN** → **FQHC Quality / QI Directors**.

## Who to target (ICP)
- Title: Quality Director, QI Manager, Director of Clinical Quality, Compliance Officer, COO
- Org: HRSA-funded FQHC, FQHC Look-Alike, or PCA-affiliated CHC
- Size: 5K–60K patients (sweet spot 15K–40K)
- Signals: due for HRSA OSV in next 12 months, recent UDS data quality flag, posted a QI job in last 60 days, recent 330(e) award

## Cadence
| Day | Email | Subject A | Subject B |
|---|---|---|---|
| 0 | `01-intro-osv-binder.md` | `{{first_name}}, your OSV binder question` | `audit-ready in 11 months — {{health_center}}` |
| 4 | `02-evidence-drop.md` | `the 10-page binder reviewers actually open` | `sample HRSA evidence packet (no signup)` |
| 11 | `03-breakup.md` | `close the loop?` | `last note from MeasureWise` |

Send 9am–11am recipient-local, Tue/Wed/Thu only. Skip Mondays and Fridays.

## Merge fields
- `{{first_name}}` — required
- `{{health_center}}` — required (e.g. "Delta Health Center")
- `{{state}}` — required
- `{{recent_signal}}` — optional ("you posted a QI Manager role last month", "your last UDS report flagged CMS122…")

## Sender
- From: `Jessica R. Smith, BSN <jessica@measurewise.org>`
- Reply-to: same
- Signature is included in each template — do not double-add.

## Compliance
- CAN-SPAM: physical mailing address in signature, one-click unsubscribe link required if sending >100/day. The current sequence assumes manual/low-volume outreach (<50/day). If you scale past that, route through Instantly / Smartlead and rely on their built-in unsubscribe.
- HIPAA: never reference a specific patient or PHI. Aggregate measure names (CMS124, CMS122, etc.) are fine.

## Tracking
- Use UTM `?utm_source=cold-email&utm_medium=email&utm_campaign=osv-q1-2026&utm_content=<email-id>` on every link to measurewise.org.
- Replies go to `jessica@measurewise.org`. Tag in your CRM as `source = cold-email-osv-q1`.

## Expected math (rough)
- 500 sent → 35% open → 4% reply → ~20 conversations → ~3 demos → ~1 paid.
- This isn't optional. List quality drives all of these — 500 hand-curated FQHC contacts beats 5,000 scraped.
