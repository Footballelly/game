/* Football Legends — mini-joueurs (SVG généré) et cartes de collection.
   Le mini-joueur ne ressemble à personne : seules la tenue du club et la rareté le distinguent. */
"use strict";

const DEFAULT_KIT = {s:"#8a90b8", t:"#ffffff", sh:"#ffffff", so:"#8a90b8", p:"plain"};
const kitOf = club => KITS[club] || (CLUB[club] ? {s:CLUB[club], t:"#ffffff", sh:"#ffffff", so:CLUB[club], p:"plain"} : DEFAULT_KIT);
function isLight(hex){ const h = hex.replace("#",""); const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16); return (r*299+g*587+b*114)/1000 > 170; }

/* corps façon Head Soccer : grosse tête de mascotte, petit corps */
function miniPlayer(kit=DEFAULT_KIT, {w=60, label=""}={}){
  const k = kit, band = isLight(k.s) ? k.t : k.s, ink = "#0c1240";
  let torso = `<rect x="38" y="72" width="44" height="34" rx="11" fill="${k.s}"/>`;
  if(k.p==="stripes") torso += `<rect x="46" y="72" width="8" height="34" fill="${k.t}"/><rect x="62" y="72" width="8" height="34" fill="${k.t}"/>`;
  if(k.p==="hoops") torso += `<rect x="38" y="80" width="44" height="7" fill="${k.t}"/><rect x="38" y="94" width="44" height="7" fill="${k.t}"/>`;
  if(k.p==="halves") torso += `<rect x="60" y="72" width="22" height="34" rx="0" fill="${k.t}"/>`;
  const sleeve = k.p==="sleeves" ? k.t : (k.p==="halves" ? k.t : k.s);
  const sleeveL = k.p==="halves" ? k.s : sleeve;
  return `<svg viewBox="0 0 120 150" width="${w}" height="${Math.round(w*1.25)}" ${label?`role="img" aria-label="${esc(label)}"`:`aria-hidden="true"`}>
<ellipse cx="60" cy="143" rx="30" ry="5" fill="rgba(0,0,0,.28)"/>
<rect x="47" y="112" width="10" height="24" rx="3" fill="${k.so}"/><rect x="63" y="112" width="10" height="24" rx="3" fill="${k.so}"/>
<rect x="42" y="133" width="17" height="8" rx="4" fill="${ink}"/><rect x="61" y="133" width="17" height="8" rx="4" fill="${ink}"/>
<rect x="43" y="100" width="34" height="17" rx="5" fill="${k.sh}" stroke="${ink}" stroke-width="1.5"/>
<circle cx="33" cy="96" r="6" fill="#f7f5ef" stroke="${ink}" stroke-width="2.5"/><circle cx="87" cy="96" r="6" fill="#f7f5ef" stroke="${ink}" stroke-width="2.5"/>
<rect x="31" y="76" width="16" height="12" rx="5" fill="${sleeveL}" stroke="${ink}" stroke-width="1.5"/><rect x="73" y="76" width="16" height="12" rx="5" fill="${sleeve}" stroke="${ink}" stroke-width="1.5"/>
<clipPath id="tc"><rect x="38" y="72" width="44" height="34" rx="11"/></clipPath><g clip-path="url(#tc)">${torso}</g>
<rect x="38" y="72" width="44" height="34" rx="11" fill="none" stroke="${ink}" stroke-width="2.5"/>
<circle cx="60" cy="42" r="33" fill="#f7f5ef" stroke="${ink}" stroke-width="3"/>
<path d="M29 33 Q60 12 91 33 L91 38 Q60 18 29 38 Z" fill="${band}" stroke="${ink}" stroke-width="1.2"/>
<ellipse cx="49" cy="46" rx="4" ry="5.5" fill="${ink}"/><ellipse cx="71" cy="46" rx="4" ry="5.5" fill="${ink}"/>
<circle cx="50.5" cy="44" r="1.4" fill="#fff"/><circle cx="72.5" cy="44" r="1.4" fill="#fff"/>
<path d="M52 59 Q60 65 68 59" fill="none" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/></svg>`;
}
const miniFor = (p, club, w) => miniPlayer(kitOf(club || mainClub(p)), {w, label:`Mini-joueur de ${p.n}`});

const RAR = {common:"Commune", rare:"Rare", legend:"Légende"};
const POS_FR = {GK:"Gardien", DEF:"Défenseur", MID:"Milieu", ATT:"Attaquant"};
/* carte de collection (catalogue FL_CARDS) ; locked = pas encore obtenue */
function cardHTML(id, {locked=false, small=false, count=0, tag=""}={}){
  const c = CARD.get(id); if(!c) return "";
  const r = {common:"c", rare:"p", legend:"l"}[c.r];
  if(locked) return `<div class="fcard locked${small?" sm":""}"><div class="fc-art">${miniPlayer({s:"#3a4180",t:"#4a5190",sh:"#3a4180",so:"#3a4180",p:"plain"},{w:small?54:70})}<span class="fc-q">?</span></div>
    <div class="fc-meta"><b>???</b><small>${POS_FR[c.p]}</small></div></div>`;
  return `<div class="fcard r-${r}${small?" sm":""}">${tag}<div class="fc-top"><span class="fc-rar">${c.r==="legend"?ICON.star:""}${RAR[c.r]}</span><span class="fc-yr">${count>1?`×${count}`:({pl:"PL",l1:"L1",liga:"Liga",seriea:"Serie A",europe:"Europe"}[c.lg]||"")}</span></div>
    <div class="fc-art" style="--club:${CLUB[c.c]||"#334"}">${miniPlayer(kitOf(c.c),{w:small?54:70, label:`Mini-joueur de ${c.n}`})}</div>
    <div class="fc-meta"><b>${esc(c.n.split(" ").length>1&&c.n.length>14?c.n.split(" ").slice(-1)[0]:c.n)}</b><small>${esc(c.c)} · ${POS_FR[c.p]}</small></div></div>`;
}
