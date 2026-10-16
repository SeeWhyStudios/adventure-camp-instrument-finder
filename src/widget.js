/* Adventure Camp instrument finder. Build with npm run build.
   Data: data/public-instruments.json; styles: src/styles.css.
   Do not put credentials or private camp/registration data in this repository. */
(() => {
"use strict";
const data=/*__DATA__*/ null;
const CSS=/*__CSS__*/ null;
const MARKUP='<div class="finder" role="region" aria-label="Instrument finder: Junior and Senior Camp"><div id="families"></div></div>';
function render(root,width){
const camps=[{key:"junior",label:"Junior Camp"},{key:"senior",label:"Senior Camp"}];
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
const container=root.getElementById("families");
data.groups.forEach((group,i)=>{
 const family=el("details","family adventure-plain-panel");family.open=i===0;
 const summary=el("summary"),heading=el("h2","",group.name),count=el("span","count",`${group.items.length} ${group.name==="Vocals"?"parts":"instruments"}`),toggle=el("span","toggle");toggle.setAttribute("aria-hidden","true");heading.append(count);summary.append(heading,toggle);family.append(summary);
 const wrap=el("div","family-content"),table=el("table");table.setAttribute("aria-label",`${group.name}: Junior and Senior Camp comparison${data.sampleData?" — unverified sample":""}`);
 const cols=el("colgroup");for(let c=0;c<3;c++)cols.append(el("col"));table.append(cols);
 const head=el("thead"),hr=el("tr");["Instrument",...camps.map(c=>c.label)].forEach(label=>{const th=el("th","",label);th.scope="col";hr.append(th);});head.append(hr);table.append(head);
 const body=el("tbody");group.items.forEach((item,j)=>{
  const row=el("tr"),name=el("th","",item.name);name.scope="row";name.id=`instrument-${i}-${j}`;if(item.note)name.append(el("span","instrument-note",item.note));row.append(name);
  camps.forEach(camp=>{
   const config=item[camp.key]||{},profile=data.profiles[config.profile]||{},cell=el("td"),label=el("span","camp-label",camp.label),line=el("div","level-line");
   const summaryText=config.summary||profile.summary||"Confirm with organisers",status=["Open","Limited","Full","Closed","Second Instruments Only","Not Offered","Unverified"].includes(config.status)?config.status:"Unverified";
   if(status==="Not Offered"){cell.append(label,el("p","not-offered",`Not offered in ${camp.label}`));row.append(cell);return;}
   const pill=el("span","pill"+(["Full","Closed"].includes(status)?" full":status==="Open"?"":status==="Limited"?" limited":" neutral"),status);pill.setAttribute("aria-label",`${data.sampleData?"Sample ":""}${status}`);line.append(el("span","level",summaryText),pill);cell.append(label,line);
   const points=config.details||profile.details;if(points?.length){const more=el("details","level-details"),trigger=el("summary","","Level details");trigger.setAttribute("aria-label",`Level details for ${item.name}, ${camp.label}${data.sampleData?" — examples only":""}`);more.append(trigger);const list=el("ul");points.forEach(point=>list.append(el("li","",point)));more.append(list);cell.append(more);}row.append(cell);
  });body.append(row);
 });table.append(body);wrap.append(table);family.append(wrap);container.append(family);
});

}

// Font faces are registered in the document so shadow styles can use them.
// A stylesheet only in the surrounding Wix page is not relied upon.
// Google Fonts is the only external dependency; controls work while it loads
// or if it is blocked. font-display:swap is requested for readable fallbacks.
let fontPromise;
function loadCampFonts() {
  if (fontPromise) return fontPromise;
  fontPromise = new Promise((resolve, reject) => {
    let link = document.getElementById("adventure-camp-google-fonts");
    if (link?.sheet) { resolve(); return; }
    if (!link) {
      link = document.createElement("link");
      link.id = "adventure-camp-google-fonts";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Rakkas&display=swap";
      link.addEventListener("load", resolve, {once:true});
      link.addEventListener("error", reject, {once:true});
      document.head.append(link);
    } else {
      link.addEventListener("load", resolve, {once:true});
      link.addEventListener("error", reject, {once:true});
    }
  }).then(() => Promise.all([
    document.fonts.load('400 24px "Rakkas"'),
    ...[400,500,600,700].map(weight => document.fonts.load(`${weight} 16px "Rajdhani"`))
  ])).catch(() => { /* Keep readable system fallbacks if fonts are unavailable. */ });
  return fontPromise;
}
class AdventureInstrumentFinder extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode:"open"});
    this._frame = 0;
    this._height = -1;
    this._schedule = () => {
      if (!this.isConnected || this._frame) return;
      this._frame = requestAnimationFrame(() => {
        this._frame = 0;
        this._fitHost();
      });
    };
  }
  connectedCallback() {
    if (!this.shadowRoot.firstChild) {
      const style = document.createElement("style");
      style.textContent = CSS;
      const template = document.createElement("template");
      template.innerHTML = MARKUP; // Static bundled markup; editable data uses textContent.
      this.shadowRoot.append(style, template.content.cloneNode(true));
      render(this.shadowRoot, this.getBoundingClientRect().width);
    }
    // Observe CONTENT rather than the host's height, so shrinking works too.
    // Changing this.style.height informs the Wix custom-element host directly;
    // this is not an invented $w.height setter or an iframe postMessage protocol.
    this._observer = new ResizeObserver(this._schedule);
    this._observer.observe(this.shadowRoot.querySelector(".finder"));
    this.shadowRoot.addEventListener("toggle", this._schedule, true);
    this._schedule();
    loadCampFonts().then(this._schedule);
    document.fonts?.ready.then(this._schedule);
  }
  disconnectedCallback() {
    this._observer?.disconnect();
    this.shadowRoot.removeEventListener("toggle", this._schedule, true);
    if (this._frame) cancelAnimationFrame(this._frame);
    this._frame = 0;
  }
  _fitHost() {
    if (!this.isConnected) return;
    const content = this.shadowRoot.querySelector(".finder");
    const height = Math.ceil(content.getBoundingClientRect().height);
    if (height === this._height && this.style.height === `${height}px`) return;
    this._height = height;
    this.style.height = `${height}px`;
    // Optional diagnostics/integration event. No page-code listener is needed
    // for this component's own sizing. It does not resize Wix ancestors.
    this.dispatchEvent(new CustomEvent("camp-height-change", {
      detail:{height}, bubbles:true, composed:true
    }));
  }
}
if (!customElements.get("adventure-instrument-finder")) {
  customElements.define("adventure-instrument-finder", AdventureInstrumentFinder);
}
})();
