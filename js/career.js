/* Football Legends — Parcours de carrière (solo), en 3 difficultés. Les clubs du joueur tombent un par un ; moins d'indices = plus de points.
   Facile : joueurs connus, 2 clubs d'entrée et 4 propositions. Normal : saisie libre, poste et initiales en derniers indices. Expert : seulement les clubs, sans les années. */
"use strict";

const CAR_N = 10;
const nClubs = p => new Set(p.s.map(x => x[0])).size;
const plSeasons = p => p.s.reduce((a,[,x,y]) => a + y - x + 1, 0);
const FAMOUS = new Set([...CARDS.filter(c => c.r!=="common").map(c => c.n), ...GOALS.map(g => g.n)]);
const CAR_OK = i => !P[i].x;   // parcours complets uniquement
const CAR = {
  easy:  {max:3,  start:2, pool:P.map((p,i) => i).filter(i => CAR_OK(i) && nClubs(P[i])>=2 && (FAMOUS.has(P[i].n) || plSeasons(P[i])>=10)), extra:true,  years:true,  coins:f => Math.ceil(f*0.6), d:"Joueurs connus · 2 clubs d'entrée · 4 propositions"},
  normal:{max:5,  start:1, pool:P.map((p,i) => i).filter(i => CAR_OK(i) && nClubs(P[i])>=3), extra:true,  years:true,  coins:f => f,   d:"Tu tapes le nom · poste et initiales en derniers recours"},
  hard:  {max:10, start:1, pool:P.map((p,i) => i).filter(i => CAR_OK(i) && nClubs(P[i])>=3), extra:false, years:false, coins:f => f*2, d:"Seulement les clubs, sans les années · points doublés"}
};
const careerRecKey = d => d==="normal" || !d ? "career" : `career_${d}`;
const carMaxTotal = d => CAR[d].max * CAR_N;
const yrs = (a,b) => a===b ? `${a}` : `${a}–${String(b).slice(-2)}`;
const careerSig = i => [...P[i].s].sort((x,y) => x[1]-y[1]).map(x => x[0]).join(">");
/* indices dans l'ordre : chaque club (chronologique), puis le poste, puis les initiales (sauf en Expert) */
function careerClues(i, d){
  const p = P[i], cf = CAR[d], st = [...p.s].sort((x,y) => x[1]-y[1]);
  const clubs = st.map(([c,a,b]) => ({k:"club", c, y:cf.years ? yrs(a,b) : "Club n°"}));
  clubs.forEach((x,k) => { if(!cf.years) x.y = `${k+1}${k?"e":"er"} club`; });
  return cf.extra ? [...clubs, {k:"pos", t:POS_FR[p.p]}, {k:"ini", t:p.n.split(" ").map(w => w[0]+".").join(" ")}] : clubs;
}
/* 3 leurres plausibles : même poste, au moins un club en commun si possible */
function careerOptions(i, r){
  const t = P[i], clubs = new Set(t.s.map(x => x[0])), sig = careerSig(i);
  const ok = j => j!==i && careerSig(j)!==sig && P[j].p===t.p;
  const near = P.map((_,j) => j).filter(j => ok(j) && P[j].s.some(x => clubs.has(x[0])));
  const far = P.map((_,j) => j).filter(j => ok(j) && !near.includes(j));
  const pick = arr => arr.splice(Math.floor(r()*arr.length), 1)[0];
  const out = [i]; while(out.length<4 && near.length) out.push(pick(near)); while(out.length<4 && far.length) out.push(pick(far));
  for(let k=out.length-1;k>0;k--){ const j = Math.floor(r()*(k+1)); [out[k],out[j]] = [out[j],out[k]]; }
  return out;
}
function startCareer(d){
  d = CAR[d] ? d : (L.car && L.car.diff) || PROFILE.carDiff || "normal";
  PROFILE.carDiff = d; saveProfile();
  leaveGame(false, true);
  const r = rng(Date.now() % 1e9), pool = [...CAR[d].pool];
  for(let k=pool.length-1;k>0;k--){ const j = Math.floor(r()*(k+1)); [pool[k],pool[j]] = [pool[j],pool[k]]; }
  L.car = {diff:d, ids:pool.slice(0, CAR_N), cur:0, shown:CAR[d].start, phase:"ask", hist:[], msg:null, wrong:[], opts:null, r};
  if(d==="easy") L.car.opts = careerOptions(L.car.ids[0], r);
  VIEW = "career"; render(true);
}
const carPoints = c => { const cf = CAR[c.diff], used = c.shown - cf.start; return c.diff==="hard" ? Math.max(2, cf.max - 2*used) : Math.max(1, cf.max - used); };
const isTarget = (c, j) => j===c.ids[c.cur] || careerSig(j)===careerSig(c.ids[c.cur]);
function careerFound(){ const c = L.car; c.hist.push(carPoints(c)); c.phase = "found"; c.msg = null; buzz(30); render(true); }
function careerGuess(input){
  const c = L.car; if(!c || c.phase!=="ask") return;
  const raw = input.value.trim(); if(!raw) return;
  const hits = findPlayers(raw);
  if(!hits.length){ c.msg = {t:`« ${raw} » : on ne le trouve pas, vérifie l'orthographe.`}; input.value = ""; return render(true); }
  if(hits.some(j => isTarget(c, j))) return careerFound();
  input.value = ""; careerHint(`Non, ce n'est pas ${P[hits[0]].n}.`);
}
function careerChoose(j){
  const c = L.car; if(!c || c.phase!=="ask" || c.wrong.includes(j)) return;
  if(isTarget(c, j)) return careerFound();
  c.wrong.push(j); careerHint(`Non, ce n'est pas ${P[j].n}.`);
}
function careerHint(msg){
  const c = L.car, clues = careerClues(c.ids[c.cur], c.diff);
  if(c.shown<clues.length){ c.shown++; c.msg = msg ? {t:msg+" Nouvel indice."} : null; }
  else if(c.diff==="easy" && msg && c.wrong.length<3){ c.msg = {t:msg+" Plus d'indice : il reste "+(3-c.wrong.length)+" proposition"+(c.wrong.length<2?"s":"")+"."}; }
  else { c.hist.push(0); c.phase = "missed"; c.msg = null; buzz([20,40,20]); }
  render(true);
}
function careerNext(){
  const c = L.car; if(!c) return;
  if(c.cur<CAR_N-1){ c.cur++; c.shown = CAR[c.diff].start; c.phase = "ask"; c.msg = null; c.wrong = [];
    if(c.diff==="easy") c.opts = careerOptions(c.ids[c.cur], c.r); return render(true); }
  c.phase = "end";
  const found = c.hist.filter(x => x>0).length, points = c.hist.reduce((a,b) => a+b, 0);
  const r = {mode:"career", solo:true, diff:c.diff, max:carMaxTotal(c.diff), score:found, total:CAR_N, points, detail:[...c.hist], found:c.ids.filter((_,k) => c.hist[k]>0).map(i => P[i].n), pepites:[]};
  L.summary = Object.assign(recordGame(r), {r, coins:null, bonus:null});
  if(L.summary.rec.length) setTimeout(() => celebrate("gold"), 250);
  render(true);
  (async () => { const s = L.summary, coins = await rewardGame(CAR[c.diff].coins(found), false); if(L.summary!==s) return; s.coins = coins; render(true); })();
}
const CAR_EMO = (x, d="normal") => { const m = CAR[d].max; return !x ? "⬛" : x>=m ? "🟩" : x>=m*0.6 ? "🟨" : "🟧"; };

function screenCareerPick(){
  const card = d => { const b = PROFILE.best[careerRecKey(d)];
    return `<button class="mode diff-${d}" data-act="career" data-v="${d}"><span class="lgtag">${DIFFS[d].t}</span><b>${d==="easy"?"Échauffement":d==="normal"?"Titulaire":"Ballon d'Or"}</b><small>${CAR[d].d}</small>${b?`<span class="rec">Ton record : ${b}/${carMaxTotal(d)}</span>`:""}</button>`; };
  return {key:"careerPick", html:`
  <div class="subhead"><button class="iconbtn" data-act="nav" data-v="home" aria-label="Retour">${ICON.back}</button><h1>Parcours de carrière</h1></div>
  <p class="muted" style="margin:0 0 14px">Les clubs d'un joueur de Premier League tombent un par un. Trouve-le avec le moins d'indices possible, sur 10 joueurs.</p>
  <div class="pick-list">${card("easy")}${card("normal")}${card("hard")}</div>
  ${tabbar()}`};
}
function screenCareer(){
  const c = L.car; if(!c){ VIEW = "home"; return screenHome(); }
  const total = c.hist.reduce((a,b) => a+b, 0), cf = CAR[c.diff];
  if(c.phase==="end"){
    const found = c.hist.filter(x => x>0).length, s = L.summary;
    return {key:"car-end"+(s&&s.coins), html:`<div class="stack">
     <div class="hero"><span class="eyebrow">Parcours de carrière · ${DIFFS[c.diff].t}</span><h1 class="display" style="font-size:clamp(36px,11vw,52px)">${total} <span>sur ${carMaxTotal(c.diff)}</span></h1>
      <p>${plural(found,"joueur")} retrouvé${found>1?"s":""} sur ${CAR_N} · ${c.hist.map(x => CAR_EMO(x, c.diff)).join("")}</p></div>
     ${summaryBlock()}
     <div><div class="eyebrow" style="margin-bottom:8px">Les ${CAR_N} parcours</div>
      <div class="clist">${c.ids.map((i,k) => `<div class="citem${c.hist[k]?"":" miss"}"><b>${esc(P[i].n)}</b><div class="who"><small>${c.hist[k]?`+${c.hist[k]} pts`:"Raté"}</small></div></div>`).join("")}</div></div>
    </div>
    ${dock(`<button class="btn" data-act="career" data-v="${c.diff}">Rejouer en ${DIFFS[c.diff].t}</button><div class="row2"><button class="btn ghost" data-act="sharegame">${ICON.share} Partager</button><button class="btn ghost" data-act="nav" data-v="careerPick">Changer de niveau</button></div>`)}`};
  }
  const i = c.ids[c.cur], clues = careerClues(i, c.diff), over = c.phase!=="ask", show = over ? clues.length : c.shown;
  const row = (x,k) => k>=show ? `<li class="cl locked"><span class="cl-n">${k+1}</span><span>Indice caché</span></li>`
    : x.k==="club" ? `<li class="cl club${k===show-1&&!over&&k>=cf.start?" fresh":""}">${crest(x.c,30)}<span><b>${esc(x.c)}</b><small>${x.y}</small></span></li>`
    : `<li class="cl info${k===show-1&&!over?" fresh":""}"><span class="cl-n">${x.k==="pos"?ICON.pitch:"Aa"}</span><span><b>${esc(x.t)}</b><small>${x.k==="pos"?"Poste":"Initiales"}</small></span></li>`;
  const pts = carPoints(c), msg = c.msg ? `<div class="chmsg"><span class="ko">${esc(c.msg.t)}</span></div>` : "";
  const input = c.diff==="easy"
    ? `<div class="qcm">${c.opts.map(j => `<button class="btn${c.wrong.includes(j)?" wrong":""}" data-act="carpick" data-v="${j}" ${c.wrong.includes(j)?"disabled":""}>${esc(P[j].n)}</button>`).join("")}</div>${msg}
       <div class="row2" style="margin-top:10px"><button class="btn ghost" data-act="carhint" ${c.shown>=clues.length?"disabled":""}>Indice (−1)</button><button class="btn ghost" data-act="carskip">Je passe</button></div>`
    : `<form class="answer" data-form="career" autocomplete="off" style="margin-top:14px">
     <input id="carguess" autocomplete="off" autocorrect="off" autocapitalize="words" spellcheck="false" enterkeyhint="send" placeholder="Nom du joueur" aria-label="Nom du joueur">
     ${msg}
     <button class="btn ink" type="submit">Valider</button>
     <div class="row2"><button class="btn ghost" type="button" data-act="carhint">Indice (−${c.diff==="hard"?2:1})</button><button class="btn ghost" type="button" data-act="carskip">Je passe</button></div>
    </form>`;
  return {key:`car-${c.diff}-${c.cur}-${c.shown}-${c.phase}-${c.wrong.length}-${c.msg?c.msg.t:""}`, html:`
   ${roundBar(CAR_N, c.cur)}
   ${gameTop(`Joueur ${c.cur+1}/${CAR_N}`, `<span class="chip">${DIFFS[c.diff].t} · ${total} pts</span>`)}
   ${over?`<div class="car-ans ${c.phase}"><span class="mp">${miniFor(P[i], null, 64)}</span><span><small>${c.phase==="found"?`Trouvé · +${c.hist[c.cur]} points`:"Raté, c'était"}</small><b>${esc(P[i].n)}</b></span></div>`
     :`<p class="chhint">Qui a eu ce parcours en Premier League ? <b class="ptsnow">${pts} pt${pts>1?"s":""}</b> en jeu.</p>`}
   <ol class="clues">${clues.map(row).join("")}</ol>
   ${over?dock(`<button class="btn" data-act="carnext">${c.cur<CAR_N-1?"Joueur suivant":"Voir mon score"}</button>`):input}`};
}
