/* Separate Wix custom element: adventure-camp-navigation.
   Source HTML/CSS are bundled at build time; no iframe or parent postMessage.
   Default keys match the supplied Wix page; config can replace them without rebuilding. */
(() => {
"use strict";
const CSS=/*__NAV_CSS__*/ null;
const HTML=/*__NAV_HTML__*/ null;
const DEFAULT_TABS=[
  {id:"instruments",label:"1. Instruments"},
  {id:"program",label:"2. Program"},
  {id:"venue",label:"3. Venue"},
  {id:"schedule",label:"4. Schedule"},
  {id:"pricing",label:"5. Fees"}
];
let fontsPromise;
function loadFonts() {
  if (fontsPromise) return fontsPromise;
  fontsPromise=new Promise((resolve,reject)=>{
    let link=document.getElementById("adventure-navigation-fonts");
    if(link?.sheet){resolve();return;}
    if(!link){link=document.createElement("link");link.id="adventure-navigation-fonts";link.rel="stylesheet";link.href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&display=swap";link.addEventListener("load",resolve,{once:true});link.addEventListener("error",reject,{once:true});document.head.append(link);}
    else{link.addEventListener("load",resolve,{once:true});link.addEventListener("error",reject,{once:true});}
  }).then(()=>document.fonts.load('700 20px "Rajdhani"')).catch(()=>{});
  return fontsPromise;
}
class AdventureCampNavigation extends HTMLElement {
  static get observedAttributes(){return ["config","selected-state"];}
  constructor(){
    super();this.attachShadow({mode:"open"});
    this._tabs=DEFAULT_TABS.map(tab=>({...tab}));this._active="instruments";
    this._mobile=null;this._open=false;this._frame=0;this._height=-1;
    this._schedule=()=>{if(this.isConnected&&!this._frame)this._frame=requestAnimationFrame(()=>{this._frame=0;this._measure();});};
  }
  connectedCallback(){
    if(!this.shadowRoot.firstChild){
      const style=document.createElement("style");style.textContent=CSS;
      const template=document.createElement("template");template.innerHTML=HTML;
      this.shadowRoot.append(style,template.content.cloneNode(true));
      this._shell=this.shadowRoot.querySelector(".shell");this._panel=this.shadowRoot.querySelector(".nav");this._list=this.shadowRoot.querySelector(".tabs");this._toggle=this.shadowRoot.querySelector(".toggle");this._register=this.shadowRoot.querySelector(".register");
    }
    this._abort=new AbortController();const signal=this._abort.signal;
    this._toggle.addEventListener("click",()=>this._setOpen(!this._open,true),{signal});
    this.shadowRoot.querySelector(".previous").addEventListener("click",()=>this._cycle(-1),{signal});
    this.shadowRoot.querySelector(".next").addEventListener("click",()=>this._cycle(1),{signal});
    this.ownerDocument.addEventListener("keydown",event=>{if(event.key==="Escape"&&this._mobile&&this._open){event.preventDefault();this._setOpen(false,true);}},{signal});
    this.ownerDocument.addEventListener("click",event=>{if(this._mobile&&this._open&&!event.composedPath().includes(this))this._setOpen(false,false);},{capture:true,signal});
    this._renderTabs();this._measure();
    this._observer=new ResizeObserver(this._schedule);this._observer.observe(this);this._observer.observe(this._shell);
    loadFonts().then(this._schedule);document.fonts?.ready.then(this._schedule);
    this._emit("nl-nav-ready",{stateId:this._active});
  }
  disconnectedCallback(){this._abort?.abort();this._observer?.disconnect();if(this._frame)cancelAnimationFrame(this._frame);this._frame=0;}
  attributeChangedCallback(name,oldValue,value){
    if(value===oldValue||value===null)return;
    if(name==="config"){
      try{
        const config=JSON.parse(value);if(!Array.isArray(config.tabs)||!config.tabs.length||config.tabs.length>50)throw Error("config.tabs must contain 1–50 entries");
        const tabs=config.tabs.map(t=>({id:String(t.id||t.stateId||"").trim(),label:String(t.label||t.id||t.stateId||"").trim()}));
        if(tabs.some(t=>!t.id||!t.label||t.id.length>160||t.label.length>160)||new Set(tabs.map(t=>t.id)).size!==tabs.length)throw Error("Tab IDs must be unique, nonempty strings with labels");
        this._tabs=tabs;const requested=config.activeStateId||config.stateId||config.id||this.getAttribute("selected-state")||this._active;
        this._active=tabs.some(t=>t.id===requested)?requested:tabs[0].id;
        if(this._list){this._renderTabs();this._sync();this._schedule();}
      }catch(error){this._emit("nl-nav-error",{message:error.message});}
    }else this._select(value,false,false);
  }
  _renderTabs(){
    this._list.replaceChildren();
    this._tabs.forEach(tab=>{
      const button=document.createElement("button");button.className="tab";button.type="button";button.setAttribute("role","tab");button.dataset.stateId=tab.id;button.textContent=tab.label;
      button.addEventListener("click",()=>this._select(tab.id,true,true));
      button.addEventListener("keydown",event=>{
        if(["ArrowLeft","ArrowUp","ArrowRight","ArrowDown","Home","End"].includes(event.key)){
          event.preventDefault();const index=this._tabs.findIndex(t=>t.id===tab.id);
          const next=event.key==="Home"?0:event.key==="End"?this._tabs.length-1:(index+(["ArrowLeft","ArrowUp"].includes(event.key)?-1:1)+this._tabs.length)%this._tabs.length;
          this._select(this._tabs[next].id,true,false);this._list.children[next].focus();
        }
      });this._list.append(button);
    });this._sync();
  }
  _select(id,emit=false,close=false){
    const tab=this._tabs.find(tab=>tab.id===id);if(!tab)return;
    this._active=id;if(this._list)this._sync();
    if(close&&this._mobile)this._setOpen(false,true);
    if(emit)this._emit("nl-nav-change",{id,section:id,stateId:id,label:tab.label});
  }
  _cycle(direction){const index=this._tabs.findIndex(t=>t.id===this._active);const next=(index+direction+this._tabs.length)%this._tabs.length;this._select(this._tabs[next].id,true,false);this._list.children[next].focus();}
  _setOpen(open,moveFocus){
    this._open=Boolean(this._mobile&&open);this._sync();this._measure();
    if(moveFocus){if(this._open){const index=this._tabs.findIndex(t=>t.id===this._active);this._list.children[index]?.focus();}else this._toggle.focus();}
  }
  _sync(){
    if(!this._panel)return;
    const closed=this._mobile&&!this._open;
    this._panel.hidden=Boolean(closed);this._panel.inert=Boolean(closed);this._panel.setAttribute("aria-hidden",closed?"true":"false");
    this._shell.classList.toggle("is-open",this._open);
    this._toggle.setAttribute("aria-expanded",String(this._open));this._toggle.setAttribute("aria-label",this._open?"Close section menu":"Open section menu");
    this._register.hidden=!this._mobile;
    this._list.setAttribute("aria-orientation",this._mobile?"vertical":"horizontal");
    [...this._list.children].forEach(button=>{const active=button.dataset.stateId===this._active;button.setAttribute("aria-selected",String(active));button.tabIndex=!closed&&active?0:-1;});
  }
  _measure(){
    if(!this.isConnected||!this._shell)return;
    const mobile=this.getBoundingClientRect().width<=750;
    if(this._mobile!==mobile){const hadMenuFocus=this._panel.contains(this.shadowRoot.activeElement);this._mobile=mobile;this._open=false;this._sync();if(mobile&&hadMenuFocus)this._toggle.focus();}
    const height=Math.ceil(this._shell.getBoundingClientRect().height);
    if(this.style.height!==`${height}px`)this.style.height=`${height}px`;
    if(height!==this._height){this._height=height;this._emit("nl-nav-height",{height,open:this._open,mobile:this._mobile});}
  }
  _emit(type,detail){this.dispatchEvent(new CustomEvent(type,{detail,bubbles:true,composed:true}));}
}
if(!customElements.get("adventure-camp-navigation"))customElements.define("adventure-camp-navigation",AdventureCampNavigation);
})();
