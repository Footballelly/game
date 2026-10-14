/* Football Legends — Parcours de carrière (solo). Les clubs du joueur tombent un par un ; moins d'indices = plus de points. */
"use strict";

const CAR_N = 10, CAR_MAX = 5;
const CAR_POOL = P.map((p,i) => i).filter(i => new Set(P[i].s.map(x => x[0])).size>=3);
const yrs = (a,b) => a===b ? `${a}` : `${a}–${String(b).slice(-2)}`;
/* indices dans l'ordre : chaque club (chronologique), puis le poste, puis les initiales */
function careerClues(i){
  const p = P[i], st = [...p.s].sort((x,y) => x[1]-y[1]);
  return [...st.map(([c,a,b]) => ({k:"club", c, y:yrs(a,b)})), {k:"pos", t:POS_FR[p.p]}, {k:"ini", t:p.n.split(" ").map(w => w[0]+".").join(" ")}];
}
function startCareer(){
  leaveGame(false, true);
  const seed = Date.now() % 1e9, r = rng(seed), pool = [...CAR_POOL];
  for(let k=pool.length-1;k>0;k--){ const j = Math.floor(r()*(k+1)); [pool[k],pool[j]] = [pool[j],pool[k]]; }
  L.car = {ids:pool.slice(0, CAR_N), cur:0, shown:1, phase:"ask", hist:[], msg:null, tries:[]};
  VIEW = "career"; render(true);
}
const carPoints = c => Math.max(1, CAR_MAX - (c.shown-1));
function careerGuess(input){
  const c = L.car; if(!c || c.phase!=="ask") return;
  const raw = input.value.trim(); if(!raw) return;
  const target = c.ids[c.cur], hits = findPlayers(raw);
  if(!hits.length){ c.msg = {ok:false, t:`« ${raw} » : on ne le trouve pas, vérifie l'orthographe.`}; input.value = ""; return render(true); }
  if(hits.includes(target) || hits.some(h => norm(P[h].n)===norm(P[target].n))){ c.hist.push(carPoints(c)); c.phase = "found"; c.msg = null; buzz(30); return render(true); }
  c.tries.push(P[hits[0]].n); input.value = "";
  careerHint(`Non, ce n'est pas ${P[hits[0]].n}.`);
}
function careerHint(msg){
  const c = L.car, clues = careerClues(c.ids[c.cur]);
  if(c.shown<clues.length){ c.shown++; c.msg = msg ? {ok:false, t:msg+" Nouvel indice."} : null; }
  else { c.hist.push(0); c.phase = "missed"; c.msg = null; buzz([20,40,20]); }
  render(true);
}
function careerNext(){
  const c = L.car; if(!c) return;
  if(c.cur<CAR_N-1){ c.cur++; c.shown = 1; c.phase = "ask"; c.msg = null; c.tries = []; return render(true); }
  c.phase = "end";
  const found = c.hist.filter(x => x>0).length, points = c.hist.reduce((a,b) => a+b, 0);
  const r = {mode:"career", solo:true, score:found, total:CAR_N, points, detail:[...c.hist], found:c.ids.filter((_,k) => c.hist[k]>0).map(i => P[i].n), pepites:[]};
  L.summary = Object.assign(recordGame(r), {r, coins:null, bonus:null});
  if(L.summary.rec.length) setTimeout(() => celebrate("gold"), 250);
  render(true);
  (async () => { const s = L.summary, coins = await rewardGame(found, false); if(L.summary!==s) return; s.coins = coins; render(true); })();
}
const CAR_EMO = x => x>=5 ? "🟩" : x>=3 ? "🟨" : x>=1 ? "🟧" : "⬛";

function screenCareer(){
  const c = L.car; if(!c){ VIEW = "home"; return screenHome(); }
  const total = c.hist.reduce((a,b) => a+b, 0);
  if(c.phase==="end"){
    const found = c.hist.filter(x => x>0).length, s = L.summary;
    return {key:"car-end"+(s&&s.coins), html:`<div class="stack">
     <div class="hero"><span class="eyebrow">Parcours de carrière</span><h1 class="display" style="font-size:clamp(36px,11vw,52px)">${total} <span>sur ${CAR_N*CAR_MAX}</span></h1>
      <p>${plural(found,"joueur")} retrouvé${found>1?"s":""} sur ${CAR_N} · ${c.hist.map(CAR_EMO).join("")}</p></div>
     ${summaryBlock()}
     <div><div class="eyebrow" style="margin-bottom:8px">Les ${CAR_N} parcours</div>
      <div class="clist">${c.ids.map((i,k) => `<div class="citem${c.hist[k]?"":" miss"}"><b>${esc(P[i].n)}</b><div class="who"><small>${c.hist[k]?`+${c.hist[k]} pts`:"Raté"}</small></div></div>`).join("")}</div></div>
    </div>
    ${dock(`<button class="btn" data-act="career">Rejouer</button><div class="row2"><button class="btn ghost" data-act="sharegame">${ICON.share} Partager</button><button class="btn ghost" data-act="nav" data-v="home">Accueil</button></div>`)}`};
  }
  const i = c.ids[c.cur], clues = careerClues(i), over = c.phase!=="ask", show = over ? clues.length : c.shown;
  const row = (x,k) => k>=show ? `<li class="cl locked"><span class="cl-n">${k+1}</span><span>Indice caché</span></li>`
    : x.k==="club" ? `<li class="cl club${k===show-1&&!over?" fresh":""}">${crest(x.c,30)}<span><b>${esc(x.c)}</b><small>${x.y}</small></span></li>`
    : `<li class="cl info${k===show-1&&!over?" fresh":""}"><span class="cl-n">${x.k==="pos"?ICON.pitch:"Aa"}</span><span><b>${esc(x.t)}</b><small>${x.k==="pos"?"Poste":"Initiales"}</small></span></li>`;
  const pts = carPoints(c);
  return {key:`car-${c.cur}-${c.shown}-${c.phase}-${c.msg?c.msg.t:""}`, html:`
   ${roundBar(CAR_N, c.cur)}
   ${gameTop(`Joueur ${c.cur+1}/${CAR_N}`, `<span class="chip">${total} pts</span>`)}
   ${over?`<div class="car-ans ${c.phase}"><span class="mp">${miniFor(P[i], null, 64)}</span><span><small>${c.phase==="found"?`Trouvé · +${c.hist[c.cur]} points`:"Raté, c'était"}</small><b>${esc(P[i].n)}</b></span></div>`
     :`<p class="chhint">Qui a eu ce parcours en Premier League ? <b class="ptsnow">${pts} pt${pts>1?"s":""}</b> en jeu.</p>`}
   <ol class="clues">${clues.map(row).join("")}</ol>
   ${over?dock(`<button class="btn" data-act="carnext">${c.cur<CAR_N-1?"Joueur suivant":"Voir mon score"}</button>`)
    :`<form class="answer" data-form="career" autocomplete="off" style="margin-top:14px">
     <input id="carguess" autocomplete="off" autocorrect="off" autocapitalize="words" spellcheck="false" enterkeyhint="send" placeholder="Nom du joueur" aria-label="Nom du joueur">
     ${c.msg?`<div class="chmsg"><span class="ko">${esc(c.msg.t)}</span></div>`:""}
     <button class="btn ink" type="submit">Valider</button>
     <div class="row2"><button class="btn ghost" type="button" data-act="carhint">Indice (−1)</button><button class="btn ghost" type="button" data-act="carskip">Je passe</button></div>
    </form>`}`};
}
