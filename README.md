# Adventure Camp instrument finder

[Repository](https://github.com/SeeWhyStudios/adventure-camp-instrument-finder)

A dependency-free Wix custom element with branded parchment panels, Rakkas headings, Rajdhani information, Junior/Senior comparisons, family accordions and optional level details. Current public content is **sample/unverified**. Approved roster regrouping and label cleanup have been applied. Distinct Violin 1/2 records are retained; draft camp requirements remain unpublished.

## Source and build

- `src/widget.js`: component logic and explicit content-to-host height updates.
- `src/styles.css`: readable component styles, scoped by the shadow root.
- `data/public-instruments.json`: the only bundled public data snapshot. Shared `profiles` reduce repeated wording; each instrument independently assigns Junior and Senior content/status. Per-camp summary/details overrides are supported.
- `scripts/build.mjs`: validates the public schema and produces `dist/adventure-instrument-finder.js`, a single standalone script for Wix. The script embeds CSS/data; visitors do not fetch Airtable or run an API proxy.
- `src/demo.html`: public preview page; the build writes `dist/index.html` and `dist/demo.html`.

Requires Node 22 or newer; no package installation is needed.

```sh
npm run build
npm run preview
```

Open the printed localhost URL. Or open the generated `dist/index.html` directly in a browser. Google Fonts is the only runtime external dependency; Georgia/Arial fallbacks remain usable if it is blocked.

## GitHub Pages release setup

Create a dedicated **public** repository named `adventure-camp-instrument-finder` under the authenticated owner. Push this folder's own new history only; do not copy a parent project's history or unrelated files. Choose **Settings → Pages → Source: GitHub Actions**.

`.github/workflows/pages.yml` builds and deploys `dist` on pushes to `main` or manual invocation. `.github/workflows/check.yml` builds pull requests and attaches a preview artifact without releasing them. No Airtable secrets are needed for the current sample widget.

Once a deployment has succeeded, use its returned Pages URL rather than assuming the owner/path:

- Public preview: `<PAGES_URL>/`
- Wix script: `<PAGES_URL>/adventure-instrument-finder.js`
- Public data snapshot: `<PAGES_URL>/public-instruments.json`

These are endpoint patterns, not proof that hosting has been created. GitHub serves only the generated `dist` artifact as the Pages site. The repository and its history are public, so source files also must never contain secrets or private records.

Official references: [custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [publishing source settings](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Preview before release

1. Make proposed edits on a working branch. Keep `main` as the release branch.
2. Build and inspect the local preview at desktop and phone widths. Open/close families and Level details; confirm the host fits its contents and text does not overflow. Test following-section movement within the actual Wix layout. Keep sample warnings until all public content is verified.
3. Open a pull request when working through GitHub. The check workflow attaches a downloadable static preview artifact. Serve/open its `index.html` with the adjacent JS for review. This is an artifact, not a separately hosted staging site.
4. After approval, merge to `main`. Direct pushes to `main` also deploy, so do not push unfinished content there.
5. Wait for the Pages workflow to succeed; check both the public demo and JavaScript endpoint. GitHub Pages/CDN/browser caches can delay propagation. A freshly opened or hard-refreshed Wix test page is needed to see updates. Publishing here updates the hosted source, not the saved Wix editor code.
6. To revert, revert the relevant commit on `main` and let Pages redeploy. No force-push is required.

## Wix switch — once, after the hosted script is verified

Select the existing Wix Custom Element → Choose Source → **Server URL**; paste the Pages JavaScript URL ending in `adventure-instrument-finder.js`. Keep Tag Name **`adventure-instrument-finder`**. Do not use a GitHub blob, repository or raw-download URL. No Velo Page Code is required for this component's own sizing.

The component measures its content and updates its own host height; it contains no internal scroll window. Its surrounding Wix stack/section still needs a test-site check for reflow. Wix Editor/Preview renders custom elements inside an iframe and is not sufficient to verify published layout. Wix requires an eligible plan, connected domain and no Wix ads for live site custom elements. Do not claim the Wix source was changed merely because Pages was deployed.

See [Wix custom-element setup](https://dev.wix.com/docs/velo/velo-only-apis/%24w/custom-element/add-a-custom-element) and [Wix limitations](https://dev.wix.com/docs/develop-websites/articles/wix-editor-elements/custom-elements/about-custom-elements).

## Airtable: edit in batches, publish only on demand

Staff edit the chosen Airtable base/interface. A publication action reads only explicitly approved public fields, validates them, compares the snapshot, and commits **only if public content changed**. Pages rebuilds the bundled widget after that commit. Visitors only download static Pages assets; their visits never call Airtable. There is no polling or per-visitor quota usage. Changes are visible only after publication/deployment, not immediately after each Airtable edit.

The destination source is TRYO Adventure Summer Camp 2027. Instrument Status now has independent Junior/Senior fields, Show Level Details checkboxes and Ready to Publish; staff camp values are preserved and Ready to Publish remains off. New roster entries start Unverified with blank blurbs. Legacy fields are reference-only and are never exported. The existing sample website snapshot remains unchanged until staff approve new public content. `config/airtable-publication.example.json` is a proposed mapping, **not a modification of Airtable or a claim these fields already exist**. Keep it inert until the final destination/view/fields are approved. Then copy it to `config/airtable-publication.json`, use the confirmed public field names/view, and set `approved:true`. The exporter resolves Instrument Family links through the separate Instrument Families table, reading only its Name, Sort Order and Archived flag. Archived instruments and families are excluded; archived combined percussion requirements remain in Airtable for reference. Linked-record IDs are used only inside the trusted exporter, never published. Details are newline-separated text and are exported only when the camp's Show Level Details checkbox is true. The export only includes records with the mapped Ready to Publish checkbox checked.

Store these as GitHub Actions secrets, never source/browser values:

- `AIRTABLE_TOKEN`: a read-only Airtable token restricted to the selected base, with only record-read scope needed for this export.
- `AIRTABLE_BASE_ID`, `AIRTABLE_TABLE_ID`, `AIRTABLE_FAMILY_TABLE_ID`: the confirmed destination base, Instrument Status table and Instrument Families table IDs.

The manual **Publish approved Airtable snapshot** workflow fails closed while unconfigured. It requests only allowlisted fields, never touches registrations/contact tables, strips record IDs and rejects empty/invalid snapshots before writing. No schema writes occur. Public free text must still be reviewed by staff: an allowlist does not detect private information accidentally typed into a public blurb.

For the first releases, the simplest operation is to ask the maintainer to publish after staff edits, or have an authorised GitHub collaborator run the workflow. GitHub login is needed to run it through Actions. A future Airtable button/automation can invoke an authenticated publication trigger after its exact base/plan and credentials are approved; that may use Airtable automation runs. Do not put a GitHub PAT in a shareable dashboard or unauthenticated URL. No separate admin-login service, write endpoint or paid service is included.

The workflow explicitly calls deployment after a changed snapshot because commits made with `GITHUB_TOKEN` do not trigger a second push workflow automatically. No-change runs skip both commit and deployment. Branch protections may require adapting this maintainer publication workflow to open a data-only PR instead of pushing directly.

## Senior-only vocals

Every vocal part has Junior Status **Not Offered** and its Junior Show Level Details checkbox off. Stored Junior text is retained in Airtable, but the snapshot exporter omits it for Not Offered cells. The public widget displays “Not offered in Junior Camp” without Junior requirement/detail controls, while retaining the Senior cell. Not Offered is distinct from Full and Closed. Current Senior vocal source values remain Unverified, and the sample preview also shows Unverified.

The mapper/renderer supports the source choices Open, Limited, Full, Closed, Second Instruments Only, Not Offered and Unverified without conflating them.

## Edit sizes and surrounding copy

The widget contains only its accessible accordion system. Introductory/disclaimer/footer copy belongs in Wix; toggling `sampleData` does not insert surrounding text. Existing sample/unverified data labels and truthful statuses remain unchanged.

Edit the clearly marked **EDIT SIZES HERE** custom properties at the top of [`src/styles.css`](src/styles.css). Desktop and `-mobile` values cover headings, body/level/status/detail text, panel padding, row spacing and family gaps. The 680 px component-width container breakpoint is marked separately. See [the short editing guide](EDITING.md). Build and preview before releasing to main; do not edit generated `dist` files.
