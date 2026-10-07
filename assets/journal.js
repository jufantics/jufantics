(function(){
'use strict';
const tabs=Array.from(document.querySelectorAll('[data-journal]'));
function select(key,focus){
const chosen=tabs.find(t=>t.dataset.journal===key)||tabs[0];
tabs.forEach(t=>{const active=t===chosen;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;document.getElementById('panel-'+t.dataset.journal).hidden=!active;});
if(focus)chosen.focus();
}
tabs.forEach((tab,i)=>{
tab.addEventListener('click',()=>{history.replaceState(null,'','#'+tab.dataset.journal);select(tab.dataset.journal,false);});
tab.addEventListener('keydown',e=>{let n;if(e.key==='ArrowRight')n=(i+1)%tabs.length;if(e.key==='ArrowLeft')n=(i+tabs.length-1)%tabs.length;if(e.key==='Home')n=0;if(e.key==='End')n=tabs.length-1;if(n!==undefined){e.preventDefault();tabs[n].click();tabs[n].focus();}});
});
window.addEventListener('hashchange',()=>select(location.hash.slice(1),false));select(location.hash.slice(1),false);

const poetryTabs=Array.from(document.querySelectorAll('[data-poetry]'));
function selectPoetry(key,focus){
const chosen=poetryTabs.find(t=>t.dataset.poetry===key)||poetryTabs[0];
poetryTabs.forEach(t=>{const active=t===chosen;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;const panel=document.getElementById('poetry-'+t.dataset.poetry);if(panel)panel.hidden=!active;});
if(focus&&chosen)chosen.focus();
}
poetryTabs.forEach((tab,i)=>{
tab.addEventListener('click',()=>selectPoetry(tab.dataset.poetry,false));
tab.addEventListener('keydown',e=>{let n;if(e.key==='ArrowRight')n=(i+1)%poetryTabs.length;if(e.key==='ArrowLeft')n=(i+poetryTabs.length-1)%poetryTabs.length;if(e.key==='Home')n=0;if(e.key==='End')n=poetryTabs.length-1;if(n!==undefined){e.preventDefault();selectPoetry(poetryTabs[n].dataset.poetry,true);}});
});
if(poetryTabs.length)selectPoetry('1992',false);
})();
