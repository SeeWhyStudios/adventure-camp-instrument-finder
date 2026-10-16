# Replace the header iframe with a custom element

**New JavaScript Server URL:**  
https://seewhystudios.github.io/adventure-camp-instrument-finder/adventure-camp-navigation.js

**New tag:** `adventure-camp-navigation`  
**Navigation/tap-test demo:** https://seewhystudios.github.io/adventure-camp-instrument-finder/navigation.html

This is a separate component. The instrument finder's existing JS, tag, data and styling are unchanged.

## Why this removes the closed-menu tap area

The old iframe must keep a rectangle large enough for its open menu; making its contents transparent or changing child pointer events does not remove that rectangle. This replacement is a custom element with no inner iframe on the published page. On mobile its closed host measures only the header (70px by default). The menu is `hidden` and `inert`, so it has no closed layout/hit rectangle and neither its tabs nor Register Now link can receive focus. Open height is measured from actual content, including wrapping labels/fonts; there is no hard-coded 350px open height.

The dropdown uses **normal page flow** and is right-aligned in the source's brown/gold palette. Its open height is real content height, rather than a transparent overlay. It explicitly updates its own host height. **That does not prove a fixed Wix parent/header will reflow or shrink.** The parent must reserve only the real component height and expand when needed. A stale tall Wix container or the original iframe can still intercept taps even when this new component is correct.

## Exact migration for your supplied page

Your page uses animated section containers, not a Wix multistate box:

| Key | Visible label | Existing section |
| --- | --- | --- |
| `instruments` | 1. Instruments | `#sectionCharacters` |
| `program` | 2. Program | `#sectionProgram` |
| `venue` | 3. Venue | `#sectionVenue` |
| `schedule` | 4. Schedule | `#sectionSchedule` |
| `pricing` | 5. Fees | `#sectionPricing` |

The FAQ mapping remains in your page but is not added as a header tab. No state IDs are guessed.

1. Add a Wix **Custom Element**, choose **Server URL**, paste the new JS URL and set the new tag above. After removing/replacing the old header iframe, reuse its Wix element ID **`#headerTabs`**. Do not leave the old transparent iframe above the page. The ID `headerTabs` and the tag `adventure-camp-navigation` are different settings.
2. In Wix Public Code, add **`custom-header-navigation.js`** and paste the supplied helper. It uses the custom element's documented `on()` and `setAttribute()` methods.
3. Use the supplied **full revised `navigation-page-code.js` artifact**, or make only these header changes to your existing page:

```js
import { setupCustomHeaderNavigation } from "public/custom-header-navigation";
```

Replace the old `public/header-tab-menu` import, then replace its setup call inside your existing onReady, after `initializeSectionContainers()`:

```js
await setupCustomHeaderNavigation($w, {
  headerTabsId: HEADER_TABS_ID,
  defaultStateId: DEFAULT_STATE_ID,
  tabMenu: HEADER_TAB_MENU,
  onChange: switchToSection,
  getCurrentStateId: () => currentSectionId
});
```

Keep `HEADER_TAB_MENU`, `SECTION_CONTAINER_IDS`, `initializeSectionContainers`, `switchToSection` and the animation queue. The full revised artifact also performs your approved cleanup: it removes the old instrument CMS loader imports/function/call and splitBroker construction/wiring. Music/mute, Home, overlay and all section animation functions remain unchanged. The hosted instrument custom element loads its own bundled public snapshot. Do not run both old and new header setup calls.

The helper registers handlers once per element, passes choices to your existing queued switch function, and syncs the actual returned/current section when it settles. Earlier queued completions cannot overwrite a newer navigation choice. On callback failure it restores the highlight to the current section and logs the error; it does not rewrite your animation queue or invent content transitions.

## Wix layout and real-device test

Set the custom element to fill its intended width. The desktop header starts at 85px; mobile starts at 70px. The component adjusts its host height, so do not retain a fixed 350px iframe-sized wrapper or a min-height that reserves invisible space. In Studio, place it and following content in a vertical stack/auto-height section where available; avoid a large invisible header/container overlapping the Instruments section. If the existing site header is fixed-height, move the expandable navigation to a content-fitting section or adjust that layout before relying on open-menu page flow. No z-index or child pointer-events trick can fix an oversized parent hit box.

Test a Wix **published test site**, because Wix Editor/Preview wraps custom elements in an iframe and may differ:

- Closed: tap Strings immediately beneath the header. It must toggle on the first tap, including after scrolling.
- Open: hamburger changes to close, the menu is fully visible and following content moves down. Close it again: host/header shrink and Strings remains clickable.
- Choose every tab; verify the correct existing section and highlight after the animation queue completes. Try rapid choices and the desktop previous/next arrows.
- Keyboard: Tab reaches the toggle while closed, not hidden tabs/Register Now. Open supports arrow keys, Home/End and Enter/Space. Escape closes and returns focus to the toggle. Clicking outside closes without suppressing the outside target's click.
- Rotate/resize: the **component-width** breakpoint is 750px. Google Fonts settling must not leave extra blank height.

Outside-click handling uses the event's composed path, so it recognises shadow-DOM clicks. Editor iframe isolation may prevent detecting clicks in the surrounding editor page; published in-page behaviour needs the test above. No live Wix changes were performed by this delivery.

## Source and interface

Readable source: `src/navigation/navigation.html`, `src/navigation/styles.css`, `src/navigation/widget.js`. Edit sizing at the top of the nav CSS. `npm run build` produces the new standalone `dist/adventure-camp-navigation.js` and separate `navigation.html` demo without changing the instrument bundle. Push approved changes to main to deploy through the existing Pages workflow.

| Direction | API | Behaviour |
| --- | --- | --- |
| Wix → element | `setAttribute('config', JSON.stringify({tabs:[{id,label}], activeStateId}))` | Set arbitrary real section keys and labels |
| Wix → element | `setAttribute('selected-state', id)` | Sync highlight without emitting a change |
| Element → Wix | `.on('nl-nav-change', event)` | `detail` contains `id`, `section`, `stateId`, `label` |
| Element → Wix | `.on('nl-nav-ready', ...)` | Once per instance; reports retained configValue/selectedState so the helper only resends missing or changed attributes |
| Element → Wix | `.on('nl-nav-height', ...)` | Diagnostic `{height, open, mobile}`; not a request to set a nonexistent Velo height property |
| Element → Wix | `.on('nl-nav-error', ...)` | Invalid config; last valid tabs retained |

Registration remains a normal top-level link to https://nextlevelcamp.au/registration. Rajdhani 600/700 is explicitly loaded through Google Fonts for the shadow styles, with system fallbacks. No private credentials, `window.parent.postMessage`, or global `NextLevelNav` object is used.

Official Wix references: [custom-element events](https://dev.wix.com/docs/velo/velo-only-apis/%24w/custom-element/handle-events), [working on()/setAttribute() example](https://dev.wix.com/docs/coding-examples/getting-started/hello-world/hello-custom-element), [setAttribute](https://dev.wix.com/docs/velo/velo-only-apis/%24w/custom-element/set-attribute), [custom-element setup/limitations](https://support.wix.com/en/article/studio-editor-adding-a-custom-element).

## Approved old instrument-loader cleanup

The replacement page no longer imports `backend/wix-instruments-retriever`, `public/instrument-selector-helpers` or `public/instrument-selector-split-v2`. It also no longer imports the old iframe header helper `public/header-tab-menu`. After searching **all Wix project references**, these unused files can be removed if no other page/module needs them. The old backend reads the Import1/Import2 CMS collections; this change does **not** delete those collections or prove they are unused elsewhere.

Review old split-broker HTML elements (`#instrumentTopbarEmbed`, `#instrumentSelectorEmbed`, `#instrumentSelectorInfoEmbed`, `#instrumentPortraitEmbed`, `#instrumentPortraitMobileEmbed`, `#instrumentInfoEmbed`) before removing any that are still on the page. Keep the current hosted instrument finder. Keep `wix-window`, `wix-location`, the section containers, classes/transitions, Home and all sound/overlay elements. No live Wix code, modules, elements or collections were deleted by this delivery.

## Reconnect stability

The helper suppresses identical attribute writes and records each write before calling the host. This prevents a ready → config → host reconnect → ready feedback loop. A new component reports its retained attributes so a replacement that lost configuration still receives it. Reconnecting an existing component preserves tab nodes and does not emit another ready event. This addresses a reproduced reconnect model; periodic Wix Preview reloads were not reproduced in the standalone browser.
