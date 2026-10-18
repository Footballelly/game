/* Football Legends — deux modes solo :
   BOX2BOX : une grille 3×3 à remplir seul. Lignes = clubs, colonnes = clubs ou critères. 12 essais pour 9 cases.
             Plus le joueur cité est rare (peu de saisons en PL), plus il rapporte. Une grille du jour, et des grilles libres.
   MISSING XI : retrouver de mémoire le onze d'un match ou d'une saison culte, en 3 minutes. */
"use strict";

/* ======================================================================
   BOX2BOX
   ====================================================================== */
const BX_TRIES = 12;
const BX_DIFF = {easy:{t:"Facile", tries:15, mult:1, d:"15 essais · nombre de réponses affiché"}, normal:{t:"Moyen", tries:12, mult:1, d:"12 essais"}, hard:{t:"Difficile", tries:9, mult:1.5, d:"9 essais · toujours un critère · points ×1,5"}};
const bxDiff = () => BX_DIFF[PROFILE.bxDiff] ? PROFILE.bxDiff : "normal";
const BX_CRIT = [
  {id:"gk", t:"Gardien", ic:"🧤", f:p => p.p.includes("GK")},
  {id:"def", t:"Défenseur", ic:"🧱", f:p => p.p.includes("DEF")},
  {id:"att", t:"Attaquant", ic:"⚽", f:p => p.p.includes("ATT")},
  {id:"90s", t:"En PL avant 2000", ic:"📼", f:p => p.s.some(s => s[1] < 2000)},
  {id:"long", t:"10 saisons de PL ou +", ic:"🕰️", f:p => plSeasons(p) >= 10},
  {id:"nomad", t:"4 clubs de PL ou +", ic:"🧳", f:p => nClubs(p) >= 4},
  {id:"recent", t:"En PL depuis 2020", ic:"📱", f:p => p.s.some(s => s[2] >= 2020)}
];
const bxCrit = id => BX_CRIT.find(c => c.id===id);
const BX_SET = {};
function bxSet(h){   // ensemble des joueurs qui valident un en-tête (club ou critère)
  if(BX_SET[h]) return BX_SET[h];
  const c = bxCrit(h);
  return BX_SET[h] = c ? new Set(P.map((p,i) => i).filter(i => c.f(P[i]))) : (TT_BYCLUB[h] || new Set());
}
const bxAns = (a, b) => { const B = bxSet(b); return [...bxSet(a)].filter(i => B.has(i)); };
function bxGrid(r, hard){
  const clubs = Object.keys(TT_BYCLUB).filter(c => TT_BYCLUB[c].size >= 40);
  for(let tries=0; tries<1500; tries++){
    const pick = mcShuffle([...clubs], r).slice(0, 6), rows = pick.slice(0, 3);
    let cols = pick.slice(3);
    if(hard || r() < 0.75){ const cr = BX_CRIT[Math.floor(r()*BX_CRIT.length)]; cols[Math.floor(r()*3)] = cr.id; }
    if(rows.flatMap(a => cols.map(b => bxAns(a, b))).every(x => x.length >= 3)) return {rows, cols};
  }
  return {rows:["Arsenal","Chelsea","Liverpool"], cols:["Man Utd","Man City","Tottenham"]};
}
const bxRare = i => { const n = plSeasons(P[i]); return n <= 2 ? 10 : n <= 5 ? 5 : n <= 9 ? 2 : 0; };
let BX = null;
function startBox(daily){
  const key = todayKey(), seed = daily ? hashStr("box2box"+key) >>> 0 : Date.now() % 1e9, r = rng(seed), diff = daily ? "normal" : bxDiff();
  BX = {daily:!!daily, diff, day:key, seed, grid:bxGrid(r, diff==="hard"), cells:Array(9).fill(null), tries:BX_DIFF[diff].tries, used:[], sel:null, last:null, phase:"play"};
  L.summary = null; VIEW = "box"; render(true);
}
function bxGuess(name){
  const k = BX.sel; if(k==null || BX.cells[k] || BX.phase!=="play") return;
  const hits = findPlayers(name); if(!hits.length){ BX.last = {k, ok:false, t:`« ${name} » : joueur inconnu`}; return render(true); }   // un nom inconnu ne coûte pas d'essai
  const a = BX.grid.rows[Math.floor(k/3)], b = BX.grid.cols[k%3], good = hits.find(i => bxSet(a).has(i) && bxSet(b).has(i));
  BX.tries--;
  if(good==null){ BX.last = {k, ok:false, t:`${cardName(P[hits[0]].n)} ne coche pas les deux cases`}; }
  else if(BX.used.includes(good)){ BX.tries++; BX.last = {k, ok:false, t:`${cardName(P[good].n)} est déjà dans ta grille`}; }
  else { const pts = Math.round((10 + bxRare(good)) * BX_DIFF[BX.diff||"normal"].mult); BX.cells[k] = {i:good, pts}; BX.used.push(good); BX.sel = null;
    BX.last = {k, ok:true, t:`${P[good].n} ✓ +${pts}${pts>=20?" 💎 pépite":""}`}; }
  if(BX.cells.every(Boolean) || BX.tries <= 0) return bxEnd();
  render(true);
}
const bxScore = () => BX.cells.reduce((s,c) => s + (c ? c.pts : 0), 0);
function bxEnd(){
  BX.phase = "end"; BX.sel = null;
  const n = BX.cells.filter(Boolean).length, score = bxScore();
  if(n===9 && typeof celebrate==="function") celebrate("gold");
  const r = {mode:"box", solo:true, score:n, total:9, won:n===9, found:BX.cells.filter(Boolean).map(c => P[c.i].n), pepites:[]};
  L.summary = Object.assign(recordGame(r), {r, coins:null, bonus:null});
  if(score > (PROFILE.best.box||0)){ PROFILE.best.box = score; L.summary.rec.push(`Record Box2Box : ${score} pts`); }
  if(BX.daily){ const b = PROFILE.best.boxDay; if(!b || b.day!==BX.day || score > b.score) PROFILE.best.boxDay = {day:BX.day, score, n}; }
  saveProfile();
  (async () => { const s = L.summary, coins = await rewardGame(n, n===9); if(L.summary!==s) return; s.coins = coins; render(true); })();
  render(true);
}
const bxHead = h => { const c = bxCrit(h); return c ? `<span class="tt-club crit"><i>${c.ic}</i><b>${esc(c.t)}</b></span>` : ttClub(h); };
function bxShare(){
  const g = [0,1,2].map(r => [0,1,2].map(c => { const x = BX.cells[r*3+c]; return !x ? "⬛" : x.pts >= 20 ? "💎" : "🟩"; }).join("")).join("\n");
  const text = `Box2Box ${BX.daily?`du ${fmtDayFr(BX.day)}`:""} · ${BX.cells.filter(Boolean).length}/9 · ${bxScore()} pts\n${g}\n${SITE_URL}`;
  (async () => { try{ if(navigator.share){ await navigator.share({text}); return; } }catch(e){ if(e && e.name==="AbortError") return; }
    try{ await navigator.clipboard.writeText(text); toast("Résultat copié", "ok"); }catch(e){ toast("Copie impossible sur cet appareil."); } })();
}
function screenBoxPick(){
  const b = PROFILE.best, d = b.boxDay && b.boxDay.day===todayKey() ? b.boxDay : null;
  return {key:"boxPick"+(d?d.score:"")+bxDiff(), html:`
  <div class="subhead"><button class="iconbtn" data-act="nav" data-v="home" aria-label="Retour">${ICON.back}</button><h1>Box2Box</h1></div>
  <div class="tt-hero bx-hero"><div class="tt-mini">${["🟩","⬛","💎","🟩","🟩","⬛","⬛","💎","🟩"].map(x => `<i>${x}</i>`).join("")}</div>
   <p>Remplis la grille seul : chaque case croise un club et un club, ou un critère. 12 essais pour 9 cases. Un joueur rare rapporte plus : 💎 = moins de 3 saisons de PL.</p></div>
  <button class="mc-daily" data-act="bxstart" data-v="day"><span>📅</span><span><b>Grille du jour</b><small>La même pour tout le monde · nouvelle grille dans <span data-live="cd">${fmtCountdown(msToTomorrow())}</span></small></span><em>${d?`${d.score} pts`:"Jouer"}</em></button>
  <div class="sec-title"><h2>Grilles libres</h2><small>autant que tu veux</small></div>
  <div class="diffbar" role="group" aria-label="Difficulté">${Object.entries(BX_DIFF).map(([k,d]) => `<button data-act="bxdiff" data-v="${k}" aria-pressed="${bxDiff()===k}"><b>${d.t}</b><small>${d.d}</small></button>`).join("")}</div>
  <div class="pick-list"><button class="mode" data-act="bxstart" data-v="free"><span class="lgtag">${BX_DIFF[bxDiff()].t}</span><b>Grille au hasard</b><small>Une nouvelle grille à chaque fois.</small>${b.box?`<span class="rec">Ton record : ${b.box} pts</span>`:""}</button></div>
  ${tabbar()}`};
}
function screenBox(){
  if(!BX){ VIEW = "boxPick"; return screenBoxPick(); }
  const end = BX.phase==="end", sel = BX.sel;
  return {key:"bx-"+BX.seed+"-"+BX.tries+"-"+(sel??"")+"-"+BX.phase+"-"+(BX.last?.t||"")+"-"+(L.summary&&L.summary.coins), html:`
  <div class="subhead"><button class="iconbtn" data-act="bxquit" aria-label="Quitter">${ICON.back}</button><h1>Box2Box${BX.daily?" du jour":` · ${BX_DIFF[BX.diff].t}`}</h1><span class="tt-timer">${end?`${bxScore()} pts`:`${BX.tries} essais`}</span></div>
  <p class="tt-say">${end ? `${BX.cells.filter(Boolean).length}/9 cases · ${bxScore()} points` : sel==null ? "Choisis une case" : "Un joueur qui coche les deux cases ?"}</p>
  <div class="tt-grid">
   <span class="tt-corner">🧩</span>${BX.grid.cols.map(c => `<span class="tt-h col">${bxHead(c)}</span>`).join("")}
   ${BX.grid.rows.map((rw, ri) => `<span class="tt-h row">${bxHead(rw)}</span>${[0,1,2].map(ci => { const k = ri*3+ci, c = BX.cells[k];
     const hint = end && !c ? bxAns(rw, BX.grid.cols[ci]).filter(i => !BX.used.includes(i)).sort((a,b) => bxRare(b)-bxRare(a))[0] : null;
     return `<button class="tt-cell bx${c?" m0":""}${c && c.pts>=20?" gem":""}${sel===k?" sel":""}${BX.last && BX.last.k===k && !BX.last.ok?" miss":""}" ${!c && !end ? `data-act="bxcell" data-v="${k}"` : "disabled"}>${c ? `<i>${c.pts>=20?"💎":"✓"}</i><small>${esc(cardName(P[c.i].n))}</small><em>+${c.pts}</em>` : hint!=null ? `<small class="bx-miss">${esc(cardName(P[hint].n))}</small>` : BX.diff==="easy" && !end ? `<small class="bx-miss">${bxAns(rw, BX.grid.cols[ci]).length} réponses</small>` : ""}</button>`; }).join("")}`).join("")}
  </div>
  ${BX.last ? `<p class="tt-last ${BX.last.ok?"ok":"ko"}">${esc(BX.last.t)}</p>` : ""}
  ${end ? `<p class="mct-hint" style="color:#fff">Dans les cases vides : une réponse possible.</p><div style="margin-top:10px">${summaryBlock()}</div>` : ""}
  ${end ? dock(`<button class="btn" data-act="bxshare">${ICON.share} Partager</button><button class="btn ghost" data-act="bxstart" data-v="free">Nouvelle grille</button>`)
    : sel!=null ? dock(`<form class="tt-form" data-form="box"><input class="input" id="bx-guess" autocomplete="off" spellcheck="false" placeholder="Nom du joueur" aria-label="Nom du joueur"><button class="btn">Valider</button></form>`)
    : dock(`<button class="btn ghost" data-act="bxgiveup">J'abandonne</button>`)}`};
}

/* ======================================================================
   MISSING XI
   lignes de haut en bas : attaque → gardien. "Nom|surnom;surnom"
   ====================================================================== */
const XI_TIME = 180;
const XI_DIFF = {easy:{t:"Facile", time:300, hints:6, d:"5 min · 6 indices"}, normal:{t:"Moyen", time:180, hints:3, d:"3 min · 3 indices"}, hard:{t:"Difficile", time:120, hints:0, d:"2 min · aucun indice"}};
const xiDiff = () => XI_DIFF[PROFILE.xiDiff] ? PROFILE.xiDiff : "normal";
const XI_MATCHES = [
  {id:"mu99", c:"Man Utd", t:"Man Utd – Bayern", d:"Finale de la Ligue des champions 1999 · 2-1, le triplé", lines:[["Andy Cole","Dwight Yorke"],["Ryan Giggs","David Beckham","Nicky Butt","Jesper Blomqvist"],["Denis Irwin","Jaap Stam","Ronny Johnsen","Gary Neville"],["Peter Schmeichel"]]},
  {id:"lfc05", c:"Liverpool", t:"Liverpool – Milan", d:"Finale de la Ligue des champions 2005 · le miracle d'Istanbul", lines:[["Milan Baroš"],["Harry Kewell"],["John Arne Riise","Xabi Alonso","Steven Gerrard","Luis García"],["Djimi Traoré","Sami Hyypiä","Jamie Carragher","Steve Finnan"],["Jerzy Dudek"]]},
  {id:"che12", c:"Chelsea", t:"Chelsea – Bayern", d:"Finale de la Ligue des champions 2012 · Munich", lines:[["Didier Drogba"],["Ryan Bertrand","Juan Mata","Salomon Kalou"],["Frank Lampard","John Obi Mikel"],["Ashley Cole","Gary Cahill","David Luiz","José Bosingwa"],["Petr Čech"]]},
  {id:"mci12", c:"Man City", t:"Man City – QPR", d:"13 mai 2012 · 3-2, le but d'Agüero à la 93ᵉ", lines:[["Carlos Tevez","Sergio Agüero"],["Samir Nasri","Yaya Touré","Gareth Barry","David Silva"],["Gaël Clichy","Joleon Lescott","Vincent Kompany","Pablo Zabaleta"],["Joe Hart"]]},
  {id:"ars04", c:"Arsenal", t:"Les Invincibles", d:"Arsenal – Leicester, 15 mai 2004 · 49 matchs sans défaite", lines:[["Dennis Bergkamp","Thierry Henry"],["Robert Pirès","Gilberto Silva|gilberto","Patrick Vieira","Freddie Ljungberg"],["Ashley Cole","Kolo Touré|toure","Sol Campbell","Lauren"],["Jens Lehmann"]]},
  {id:"lfc19", c:"Liverpool", t:"Liverpool – Barcelone", d:"Demi-finale de la Ligue des champions 2019 · 4-0 à Anfield", lines:[["Sadio Mané","Divock Origi","Xherdan Shaqiri"],["Fabinho","Jordan Henderson","James Milner"],["Andrew Robertson|andy robertson","Virgil van Dijk|vvd","Joël Matip","Trent Alexander-Arnold|trent;taa"],["Alisson"]]},
  {id:"ars06", c:"Arsenal", t:"Arsenal – Barcelone", d:"Finale de la Ligue des champions 2006 · Paris", lines:[["Thierry Henry"],["Robert Pirès","Alexander Hleb|hleb","Gilberto Silva|gilberto","Cesc Fàbregas|cesc","Freddie Ljungberg"],["Ashley Cole","Sol Campbell","Kolo Touré|toure","Emmanuel Eboué|eboue"],["Jens Lehmann"]]},
  {id:"mu08", c:"Man Utd", t:"Man Utd – Chelsea", d:"Finale de la Ligue des champions 2008 · Moscou", lines:[["Wayne Rooney","Carlos Tevez"],["Cristiano Ronaldo","Michael Carrick","Paul Scholes","Owen Hargreaves"],["Patrice Evra","Nemanja Vidić","Rio Ferdinand","Wes Brown"],["Edwin van der Sar|vds"]]},
  {id:"lei16", c:"Leicester", t:"Leicester champion", d:"Le onze type du titre 2015-16", lines:[["Shinji Okazaki","Jamie Vardy"],["Marc Albrighton","Danny Drinkwater","N'Golo Kanté|kante","Riyad Mahrez"],["Christian Fuchs","Robert Huth","Wes Morgan","Danny Simpson"],["Kasper Schmeichel"]]},
  {id:"new96", c:"Newcastle", t:"The Entertainers", d:"Le onze type de Newcastle 1995-96", lines:[["Peter Beardsley","Les Ferdinand"],["David Ginola","David Batty","Robert Lee|rob lee","Keith Gillespie"],["John Beresford","Darren Peacock","Steve Howey","Warren Barton"],["Pavel Srníček"]]},
  {id:"che05", c:"Chelsea", t:"Le Chelsea de Mourinho", d:"Le onze type du titre 2004-05", lines:[["Damien Duff","Didier Drogba","Arjen Robben"],["Eiður Guðjohnsen|gudjohnsen;eidur","Claude Makélélé|makelele","Frank Lampard"],["William Gallas","Ricardo Carvalho","John Terry","Paulo Ferreira"],["Petr Čech"]]},
  {id:"mci18", c:"Man City", t:"Les Centurions", d:"Le onze type de Man City 2017-18 · 100 points", lines:[["Leroy Sané","Sergio Agüero","Raheem Sterling"],["David Silva","Fernandinho","Kevin De Bruyne|kdb"],["Fabian Delph","Nicolás Otamendi","John Stones","Kyle Walker"],["Ederson"]]}
];
const xiPlayers = m => m.lines.flat().map(s => { const [n, al] = s.split("|"); return {n, al:[norm(n), ...(al ? al.split(";").map(norm) : [])]}; });
let XI = null;
function startXi(id){
  const m = XI_MATCHES.find(x => x.id===id) || XI_MATCHES[0], ps = xiPlayers(m);
  // nom de famille seul accepté s'il est unique dans le onze
  const last = n => norm(n).split(" ").slice(-1)[0], cnt = {}; ps.forEach(p => { const l = last(p.n); cnt[l] = (cnt[l]||0)+1; });
  ps.forEach(p => { const l = last(p.n); if(cnt[l]===1 && l.length > 2) p.al.push(l); const w = norm(p.n).split(" "); if(w.length > 2) p.al.push(w.slice(1).join(" ")); });
  const D = XI_DIFF[xiDiff()];
  XI = {m, ps, diff:xiDiff(), maxH:D.hints, found:[], hints:[], wrong:0, deadlineAt:Date.now() + D.time*1000, phase:"play", last:null};
  L.summary = null; VIEW = "xi"; render(true);
}
function xiGuess(name){
  if(!XI || XI.phase!=="play") return;
  const q = norm(name); if(!q) return;
  let k = XI.ps.findIndex(p => p.al.includes(q));
  if(k < 0 && q.length >= 5){ const tol = q.length >= 8 ? 2 : 1; k = XI.ps.findIndex(p => p.al.some(a => a.length >= 4 && lev(q, a) <= tol)); }
  if(k < 0){ XI.wrong++; XI.last = {ok:false, t:`${name} n'était pas titulaire`}; }
  else if(XI.found.includes(k)) XI.last = {ok:false, t:`${XI.ps[k].n} est déjà trouvé`};
  else { XI.found.push(k); XI.last = {ok:true, t:`${XI.ps[k].n} ✓`, k}; }
  if(XI.found.length===11) return xiEnd();
  render(true);
}
function xiHint(){
  if(XI.hints.length >= XI.maxH) return toast(XI.maxH ? `${XI.maxH} indices maximum.` : "Pas d'indice en Difficile.");
  const left = XI.ps.map((p,k) => k).filter(k => !XI.found.includes(k) && !XI.hints.includes(k));
  if(!left.length) return; XI.hints.push(left[Math.floor(Math.random()*left.length)]); render(true);
}
function xiEnd(){
  if(!XI || XI.phase==="end") return;
  XI.phase = "end";
  const n = XI.found.length, key = "xi_"+XI.m.id;
  if(XI.diff==="hard" && n===11){ PROFILE.best["xih_"+XI.m.id] = 1; }
  if(n===11 && typeof celebrate==="function") celebrate("gold");
  const r = {mode:"xi", solo:true, score:n, total:11, won:n===11, found:XI.found.map(k => XI.ps[k].n), pepites:[]};
  L.summary = Object.assign(recordGame(r), {r, coins:null, bonus:null});
  if(n > (PROFILE.best[key]||0)){ PROFILE.best[key] = n; L.summary.rec.push(`Record sur ce match : ${n}/11`); saveProfile(); }
  (async () => { const s = L.summary, coins = await rewardGame(n, n===11); if(L.summary!==s) return; s.coins = coins; render(true); })();
  render(true);
}
function xiTick(){
  if(!XI || XI.phase!=="play") return;
  const left = Math.max(0, Math.ceil((XI.deadlineAt - Date.now())/1000));
  document.querySelectorAll('[data-live="xiclock"]').forEach(el => { el.textContent = `${Math.floor(left/60)}:${String(left%60).padStart(2,"0")}`; el.classList.toggle("warn", left <= 20); });
  if(left <= 0 && VIEW==="xi") xiEnd();
}
setInterval(xiTick, 250);
function screenXiPick(){
  const b = PROFILE.best;
  return {key:"xiPick"+xiDiff(), html:`
  <div class="subhead"><button class="iconbtn" data-act="nav" data-v="home" aria-label="Retour">${ICON.back}</button><h1>Missing XI</h1></div>
  <p class="muted" style="margin:0 0 12px">Retrouve le onze de départ d'un match ou d'une saison culte. Le nom de famille suffit.</p>
  <div class="diffbar" role="group" aria-label="Difficulté">${Object.entries(XI_DIFF).map(([k,d]) => `<button data-act="xidiff" data-v="${k}" aria-pressed="${xiDiff()===k}"><b>${d.t}</b><small>${d.d}</small></button>`).join("")}</div>
  <div class="pick-list">${XI_MATCHES.map(m => `<button class="mode xi-m" data-act="xistart" data-v="${m.id}" style="--cc:${CLUB[m.c]||"#2b59c3"}"><span class="lgtag">${esc(m.c)}</span><b>${esc(m.t)}</b><small>${esc(m.d)}</small>${b["xi_"+m.id]!=null?`<span class="rec">Ton record : ${b["xi_"+m.id]}/11${b["xih_"+m.id]?" · ⭐ réussi en Difficile":""}</span>`:""}</button>`).join("")}</div>
  ${tabbar()}`};
}
function screenXi(){
  if(!XI){ VIEW = "xiPick"; return screenXiPick(); }
  const end = XI.phase==="end", left = Math.max(0, Math.ceil((XI.deadlineAt - Date.now())/1000));
  let k = 0;
  const rows = XI.m.lines.map(line => `<div class="xi-row">${line.map(() => { const i = k++, p = XI.ps[i], got = XI.found.includes(i), hint = XI.hints.includes(i);
    return `<span class="xi-slot${got?" got":end?" miss":""}${got && XI.last && XI.last.k===i && !end?" new":""}"><i>${got || end ? esc(initialsOf(p.n)) : hint ? esc(initialsOf(p.n)) : "?"}</i><small>${got || end ? esc(cardName(p.n)) : hint ? "indice" : ""}</small></span>`; }).join("")}</div>`).join("");
  return {key:"xi-"+XI.m.id+"-"+XI.found.length+"-"+XI.hints.length+"-"+XI.phase+"-"+(XI.last?.t||"")+"-"+(L.summary&&L.summary.coins), html:`
  <div class="subhead"><button class="iconbtn" data-act="xiquit" aria-label="Quitter">${ICON.back}</button><h1>${esc(XI.m.t)}</h1>${end?"":`<span class="tt-timer" data-live="xiclock">${Math.floor(left/60)}:${String(left%60).padStart(2,"0")}</span>`}</div>
  <p class="tt-say">${esc(XI.m.d)}</p>
  <div class="xi-pitch" style="--cc:${CLUB[XI.m.c]||"#2b59c3"}">${rows}</div>
  <p class="tt-say">${XI.found.length}/11 trouvés</p>
  ${XI.last ? `<p class="tt-last ${XI.last.ok?"ok":"ko"}">${esc(XI.last.t)}</p>` : ""}
  ${end ? `<div style="margin-top:10px">${summaryBlock()}</div>` : ""}
  ${end ? dock(`<button class="btn" data-act="xistart" data-v="${XI.m.id}">Rejouer</button><button class="btn ghost" data-act="nav" data-v="xiPick">Autre match</button>`)
    : dock(`<form class="tt-form" data-form="xi"><input class="input" id="xi-guess" autocomplete="off" spellcheck="false" placeholder="Un titulaire" aria-label="Nom d'un titulaire"><button class="btn">OK</button></form>
      <div class="dock-row">${XI.maxH ? `<button class="btn ghost" data-act="xihint" ${XI.hints.length>=XI.maxH?"disabled":""}>💡 Indice (${XI.maxH-XI.hints.length})</button>` : ""}<button class="btn ghost" data-act="xigiveup">J'arrête</button></div>`)}`};
}

/* ---------- actions et saisies */
function m2Act(a, v){
  switch(a){
    case "bxstart": startBox(v==="day"); break;
    case "bxcell": BX.sel = +v; render(true); { const g = document.getElementById("bx-guess"); if(g) g.focus(); } break;
    case "bxgiveup": bxEnd(); break;
    case "bxshare": bxShare(); break;
    case "bxquit": BX = null; VIEW = "boxPick"; render(true); break;
    case "xistart": startXi(v); setTimeout(() => { const g = document.getElementById("xi-guess"); if(g) g.focus(); }, 50); break;
    case "xihint": xiHint(); break;
    case "bxdiff": PROFILE.bxDiff = v; saveProfile(); render(true); break;
    case "xidiff": PROFILE.xiDiff = v; saveProfile(); render(true); break;
    case "xigiveup": xiEnd(); break;
    case "xiquit": XI = null; VIEW = "xiPick"; render(true); break;
  }
}
function m2Submit(f){
  const id = f==="box" ? "bx-guess" : "xi-guess", el = document.getElementById(id), v = el ? el.value.trim() : "";
  if(!v) return;
  if(f==="box") bxGuess(v); else xiGuess(v);
  const g = document.getElementById(id); if(g){ g.value = ""; g.focus(); }
}
