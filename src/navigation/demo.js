// Browser demo only: displays selected state; it does not guess Wix state IDs
// or replace the Velo bridge. The instrument finder is the unmodified widget.
const nav=document.querySelector('adventure-camp-navigation');
nav.addEventListener('nl-nav-change',event=>{
  document.querySelector('#demo-selection').textContent='Selected demo section: '+event.detail.label;
});
let outsideClicks=0;
document.querySelector('#outside-action').addEventListener('click',()=>{
  document.querySelector('#outside-result').textContent=`Outside action received ${++outsideClicks} click(s).`;
});
