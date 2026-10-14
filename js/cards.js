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

/* illustrations dessinées par Paul : ids listés dans data/art.js, fichiers dans cards/<id>.webp ; sinon mini-joueur généré */
const ART = new Set(window.FL_ART || []);
/* nom court : « Alessandro Del Piero » → « Del Piero » */
const cardName = n => { const w = n.split(" "); return w.length>1 ? w.slice(1).join(" ") : n; };
const RAR = {common:"Commune", rare:"Pépite", legend:"Légende", icon:"Icône"};
const POS_FR = {GK:"Gardien", DEF:"Défenseur", MID:"Milieu", ATT:"Attaquant"};
const POS_AB = {GK:"GB", DEF:"DEF", MID:"MIL", ATT:"ATT"};
const LG_AB = {pl:"PL", l1:"L1", liga:"LIGA", seriea:"SERIE A", europe:"EUROPE"};
/* numéro de collection : Icônes, Légendes, puis Pépites, puis Communes, par nom (même ordre que les fichiers d'illustration) */
const CARD_NO = (() => { const o = {icon:0, legend:1, rare:2, common:3}, m = new Map();
  [...(window.FL_CARDS||[])].sort((a,b) => o[a.r]-o[b.r] || a.n.localeCompare(b.n,"fr")).forEach((c,i) => m.set(c.id, i+1)); return m; })();
function shade(hex, k){ const h = hex.replace("#",""), n = [0,2,4].map(i => parseInt(h.slice(i,i+2),16));
  const t = k<0 ? 0 : 255, a = Math.abs(k); return "#"+n.map(v => Math.round(v+(t-v)*a).toString(16).padStart(2,"0")).join(""); }
function cardVars(club){
  const k = kitOf(club); let c1 = k.s; if(isLight(c1)) c1 = isLight(k.t) ? "#3a4180" : k.t;
  const t = isLight(k.t) ? "rgba(255,255,255,1)" : k.t;
  const motif = k.p==="stripes" ? `repeating-linear-gradient(90deg,${t} 0 9%,transparent 9% 18%)` : k.p==="hoops" ? `repeating-linear-gradient(0deg,${t} 0 7%,transparent 7% 14%)` : k.p==="halves" ? `linear-gradient(90deg,transparent 50%,${t} 50%)` : `repeating-linear-gradient(135deg,${t} 0 2%,transparent 2% 7%)`;
  return `--c1:${c1};--c1l:${shade(c1,.28)};--c1d:${shade(c1,-.55)};--motif:${motif}`;
}
const rarGlyph = r => r==="icon" ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18 5 7l5 5 2-7 2 7 5-5 2 11z" fill="currentColor"/></svg>` : r==="legend" ? ICON.star : r==="rare" ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l4 7-4 13-4-13z M4 9h16" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>` : "";
/* carte de collection (catalogue FL_CARDS) ; locked = pas encore obtenue */
function cardHTML(id, {locked=false, small=false, count=0, tag=""}={}){
  const c = CARD.get(id); if(!c) return "";
  const r = {common:"c", rare:"p", legend:"l", icon:"i"}[c.r], no = String(CARD_NO.get(id)||0).padStart(3,"0"), nm = cardName(c.n);
  if(locked) return `<div class="fcard locked${small?" sm":""}" aria-label="Carte n°${no} pas encore obtenue"><div class="fc-face"><div class="fc-in">
    <div class="fc-art">${miniPlayer(DEFAULT_KIT,{w:70})}</div><span class="fc-q">?</span>
    <div class="fc-pos"><b>${POS_AB[c.p]}</b></div><span class="fc-rk">#${no}</span>
    <div class="fc-plate"><span class="fc-name">???</span><span class="fc-sub">${esc(c.c)}</span></div></div></div></div>`;
  const art = ART.has(id) ? `<img class="fc-img" src="cards/${id}.webp" alt="" loading="lazy" decoding="async">` : miniPlayer(kitOf(c.c),{w:70});
  return `<div class="fcard r-${r}${small?" sm":""}" style="${cardVars(c.c)}" role="img" aria-label="${esc(c.n)}, ${RAR[c.r]}, ${POS_FR[c.p]}, ${esc(c.c)}">${tag}${count>1?`<span class="fc-count">×${count}</span>`:""}
   <div class="fc-face"><div class="fc-in">
    <div class="fc-art">${art}</div>
    <div class="fc-pos"><b>${POS_AB[c.p]}</b><small>${LG_AB[c.lg]||""}</small></div>
    <span class="fc-rk">${rarGlyph(c.r)}#${no}</span>
    <div class="fc-plate"><span class="fc-name${nm.length>11?" long":""}">${esc(nm)}</span><span class="fc-sub">${esc(c.c)}</span></div>
   </div><i class="fc-shine"></i></div></div>`;
}
