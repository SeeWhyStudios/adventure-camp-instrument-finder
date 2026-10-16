# Change widget sizes

Open [src/styles.css](https://github.com/SeeWhyStudios/adventure-camp-instrument-finder/blob/main/src/styles.css) and find **EDIT SIZES HERE** at the top. Change the values with `px` units:

| Control | What it changes |
| --- | --- |
| `--family-heading-size` | Family titles in Rakkas |
| `--instrument-heading-size` | Instrument names in Rakkas |
| `--body-size`, `--level-size` | Rajdhani body and required-level text |
| `--status-size`, `--detail-size` | Availability pills and Level details |
| `--camp-heading-size`, `--count-size` | Camp labels and family counts |
| `--panel-inset`, `--panel-heading-pad-*`, `--panel-content-pad-*` | Inner panel space; keep inset at least 9px to clear its double border |
| `--row-pad-block`, `--row-pad-inline` | Space around instrument/camp cells |
| `--accordion-gap` | Space between families |

Each main responsive control has a matching `-mobile` value nearby. Mobile means **component width at or below 680px**, even inside a wider Wix page. The container condition is marked **BREAKPOINT** near the bottom; edit its literal `680px` there. CSS variables cannot replace that condition directly.

The approved initial visual sizes are unchanged. The fixed parchment gradient, double border and shadow remain in the clearly marked branding block. Right/bottom shadow gutters prevent clipping.

Edit **source** files, not generated `dist` files. Run `npm test`, `npm run build`, then `npm run preview` for review. A proposed branch/PR can be reviewed before release; merging/pushing to `main` deploys the approved changes through Pages.

The custom element and demo now show only accordions. Add any introduction, warnings, date or footer text separately in Wix. Removing widget copy does not verify sample data or change its statuses: `sampleData` is still true in the current public snapshot. Sample/non-sample rendering uses the same accordion-only structure. No Airtable values or Wix settings were changed by this presentation update.
