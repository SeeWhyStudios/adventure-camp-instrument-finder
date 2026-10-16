# Publish Airtable changes to the finder

Source: TRYO Adventure Summer Camp 2027, Instrument Status and Instrument Families. GitHub hosts a saved public snapshot; visitors do not access Airtable.

## One-time connection

1. At https://airtable.com/create/tokens create a token named **Adventure Camp GitHub publisher**. Give it only **data.records:read** scope and access only to **TRYO Adventure Summer Camp 2027**.
2. Open https://github.com/SeeWhyStudios/adventure-camp-instrument-finder/settings/secrets/actions and add a repository secret named **AIRTABLE_TOKEN**, with the token as its value. Do not put the token into code or chat.
3. Open https://github.com/SeeWhyStudios/adventure-camp-instrument-finder/actions/workflows/publish-airtable.yml. Choose **Run workflow**, branch **main**, and leave the publish checkbox unchecked. Run it. Success confirms source access without changing the website. With no approved records, it reports zero Ready to Publish instruments.

The connected ChatGPT Airtable account cannot supply a reusable GitHub credential, and the connected GitHub API cannot administer repository secrets or start this workflow. These setup steps must be completed in the account settings.

## Publish a batch

1. Review the Junior/Senior status and blurb for each instrument. Blank fields retain their published values. For a new instrument, a missing status is Unverified and a missing blurb displays an explicit unconfirmed-requirements message. Keep main Junior blurbs short; put ancillary expectations in Junior Level Details and check Junior Show Level Details to display them. For Senior Trumpet, Violin 1, Flute and Clarinet, extra first/solo-part guidance is enabled as level details. Existing specialist main requirements are preserved.
2. Check **Ready to Publish** for every instrument that should appear in the public snapshot. This is a complete replacement snapshot: unchecked or archived instruments will be omitted. Keep previously approved records checked if they should stay on the website.
3. Run the workflow with the publish checkbox unchecked first to validate the selection.
4. Run it with the publish checkbox checked to update the finder. A changed snapshot is committed and deployed; unchanged content skips deployment. Failed validation preserves the previous website.

Current source: 31 active instruments are Ready to Publish; the archived historical instrument remains excluded. Authorised source-guidance copy filled 27 empty Junior blurbs and 23 empty Senior blurbs; previously populated blurbs and all statuses were preserved. The 27 new Junior blurbs were then shortened, with ancillary guidance moved to enabled Junior details. Junior vocals remain Not Offered.

## What is public

Instrument/family names and order, independent camp availability, camp blurbs, and enabled Junior/Senior level details. No legacy notes, registration/contact fields, credentials, or Airtable record IDs are included in the snapshot. Source identifiers in workflow configuration are identifiers, not access credentials.

## Troubleshooting

- Missing token: add AIRTABLE_TOKEN in repository Actions secrets.
- HTTP 401/403: check the token scope and selected base access.
- Zero approved instruments: check Ready to Publish for reviewed records; an actual publish refuses an empty snapshot.
- Blank blurb/status: the published value is retained; a new instrument uses honest unconfirmed text/Unverified status. Blank is not a delete command.
- Camp details: true displays supplied text or retains prior text on blank; false (or unchecked) hides details. Enabled blank details without prior text are omitted with a warning. Not Offered always suppresses its requirements.
- New instrument missing a name/family, an invalid nonblank status, or an invalid family link: correct that structural source value before publication; the last snapshot stays intact.
- Git push rejected: repository rules may require changing this publication workflow to a data-only pull request.

References: [Airtable personal access tokens](https://support.airtable.com/articles/9934989703-creating-personal-access-tokens), [GitHub Actions secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets).

## Stable merge identity

The public snapshot contains opaque instrument keys derived from source identity, with Junior and Senior merged separately. The initial snapshot without keys migrates by its unique instrument names; later renames keep their published camp values. Raw Airtable record IDs are never published. Blank name/family/order values on an existing item retain its prior values where available. Ready to Publish and Archived remain inclusion controls, not mergeable content fields.

Requirements were paraphrased from https://www.tryo.com.au/animatedcamp at the organiser's request. Only general skill guidance was adopted; no old event dates/prices/availability were copied, and existing instrument-specific requirements were retained.

Selected Senior parts (Trumpet, Violin 1, Flute, Clarinet) have concise main requirements and enabled first/solo-part and sight-reading guidance. Violin 1 retains its existing Grade 5 AMEB-or-equivalent minimum; the other three show Grade 3 specifically for second/third parts, with Grade 4–5+ first/solo guidance expanded. The introductory “For orchestral parts:” prefix was removed from the 19 newly filled instrumental Senior blurbs.

The generic Senior sight-reading recommendation was moved from 16 further main blurbs into enabled Senior Level Details. Existing specialist sight-reading requirements in populated custom blurbs were retained. In this batch Junior details are enabled for 27 offered instrumental records and Senior details for 20 records; Not Offered Junior vocal cells remain suppressed.
