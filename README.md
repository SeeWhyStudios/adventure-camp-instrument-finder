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

The configured source is **TRYO Adventure Summer Camp 2027 → Instrument Status**, with linked names/order from **Instrument Families**. `config/airtable-publication.json` maps only the verified public fields. Independent Junior/Senior statuses, blurbs and optional level details are exported; legacy fields are excluded. Archived instruments/families are excluded. Only instruments whose **Ready to Publish** checkbox is checked are included. Not Offered cells omit requirements and details. Approving the mapping does not approve any record: staff still control Ready to Publish. The current website keeps its saved sample snapshot until a successful publication.

One repository Actions secret is required: **AIRTABLE_TOKEN**. Create a token with `data.records:read` and access only to this base, then save it in repository Settings → Secrets and variables → Actions. The workflow contains the verified source IDs; no other secrets are required. The connected ChatGPT Airtable account is separate from the credential used by GitHub Actions.

Open **Actions → Publish approved Airtable snapshot → Run workflow** on `main`:

- Leave **Publish reviewed Ready to Publish records to the live finder** unchecked to check the connection and validate approved records without updating the website. Zero approved records is a successful connection check.
- Check that option to publish the reviewed records. Empty or invalid exports stop before changing the snapshot. If public content is unchanged, no commit or deployment is made.

A successful real publication sets `sampleData:false`. There is no schedule, per-edit automation or per-visitor Airtable access. The token is used only by the trusted exporter and never bundled into the site. Free text still needs staff review. See [AIRTABLE-PUBLISHING.md](AIRTABLE-PUBLISHING.md) for setup and daily use.

The workflow explicitly calls deployment after a changed snapshot because commits made with `GITHUB_TOKEN` do not trigger a second push workflow automatically. No-change runs skip both commit and deployment. Branch protections may require adapting this maintainer publication workflow to open a data-only PR instead of pushing directly.

## Senior-only vocals

Every vocal part has Junior Status **Not Offered** and its Junior Show Level Details checkbox off. Stored Junior text is retained in Airtable, but the snapshot exporter omits it for Not Offered cells. The public widget displays “Not offered in Junior Camp” without Junior requirement/detail controls, while retaining the Senior cell. Not Offered is distinct from Full and Closed. Current Senior vocal source values remain Unverified, and the sample preview also shows Unverified.

The mapper/renderer supports the source choices Open, Limited, Full, Closed, Second Instruments Only, Not Offered and Unverified without conflating them.

## Edit sizes and surrounding copy

The widget contains only its accessible accordion system. Introductory/disclaimer/footer copy belongs in Wix; toggling `sampleData` does not insert surrounding text. Existing sample/unverified data labels and truthful statuses remain unchanged.

Edit the clearly marked **EDIT SIZES HERE** custom properties at the top of [`src/styles.css`](src/styles.css). Desktop and `-mobile` values cover headings, body/level/status/detail text, panel padding, row spacing and family gaps. The 680 px component-width container breakpoint is marked separately. See [the short editing guide](EDITING.md). Build and preview before releasing to main; do not edit generated `dist` files.

## Separate header navigation custom element

The header iframe replacement is a separate component: **`adventure-camp-navigation`**, built to `adventure-camp-navigation.js`. It keeps only a 70px host while its mobile menu is closed, with no hidden menu hit/focus area. Open height follows content, not a fixed iframe size. The instrument finder is unchanged.

See [navigation setup and Velo bridge](NAVIGATION.md), [readable navigation CSS](src/navigation/styles.css), [helper for Wix Public Code](wix/custom-header-navigation.js), and [the navigation/Strings tap-test demo](https://seewhystudios.github.io/adventure-camp-instrument-finder/navigation.html). Actual Wix parent/header layout still needs a test-site check; no Wix files or settings were edited remotely.
