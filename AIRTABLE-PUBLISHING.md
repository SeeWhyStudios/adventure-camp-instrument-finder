# Publish Airtable changes to the finder

Source: TRYO Adventure Summer Camp 2027, Instrument Status and Instrument Families. GitHub hosts a saved public snapshot; visitors do not access Airtable.

## One-time connection

1. At https://airtable.com/create/tokens create a token named **Adventure Camp GitHub publisher**. Give it only **data.records:read** scope and access only to **TRYO Adventure Summer Camp 2027**.
2. Open https://github.com/SeeWhyStudios/adventure-camp-instrument-finder/settings/secrets/actions and add a repository secret named **AIRTABLE_TOKEN**, with the token as its value. Do not put the token into code or chat.
3. Open https://github.com/SeeWhyStudios/adventure-camp-instrument-finder/actions/workflows/publish-airtable.yml. Choose **Run workflow**, branch **main**, and leave the publish checkbox unchecked. Run it. Success confirms source access without changing the website. With no approved records, it reports zero Ready to Publish instruments.

The connected ChatGPT Airtable account cannot supply a reusable GitHub credential, and the connected GitHub API cannot administer repository secrets or start this workflow. These setup steps must be completed in the account settings.

## Publish a batch

1. Review the Junior/Senior status and blurb for each instrument. Each camp needs a blurb unless its status is Not Offered. Turn on Show Level Details only when the matching details text is ready.
2. Check **Ready to Publish** for every instrument that should appear in the public snapshot. This is a complete replacement snapshot: unchecked or archived instruments will be omitted. Keep previously approved records checked if they should stay on the website.
3. Run the workflow with the publish checkbox unchecked first to validate the selection.
4. Run it with the publish checkbox checked to update the finder. A changed snapshot is committed and deployed; unchanged content skips deployment. Failed validation preserves the previous website.

Current source check: 31 active instruments, one archived historical instrument, zero Ready to Publish. Several required blurbs are blank. No approval boxes or source text were changed while connecting the system.

## What is public

Instrument/family names and order, independent camp availability, camp blurbs, and enabled level details. No legacy notes, registration/contact fields, credentials, or Airtable record IDs are included in the snapshot. Source identifiers in workflow configuration are identifiers, not access credentials.

## Troubleshooting

- Missing token: add AIRTABLE_TOKEN in repository Actions secrets.
- HTTP 401/403: check the token scope and selected base access.
- Zero approved instruments: check Ready to Publish for reviewed records; an actual publish refuses an empty snapshot.
- Missing public summary/details: finish the named camp's public text or turn off its optional details checkbox, then run the check again.
- Git push rejected: repository rules may require changing this publication workflow to a data-only pull request.

References: [Airtable personal access tokens](https://support.airtable.com/articles/9934989703-creating-personal-access-tokens), [GitHub Actions secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets).
