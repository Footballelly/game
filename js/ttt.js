/* Football Legends — TIKI-TAKA-TOE : morpion foot en 1 contre 1.
   Chaque case croise deux clubs de Premier League : il faut citer un joueur passé par les deux.
   Bonne réponse = la case est à toi. Mauvaise réponse ou temps écoulé = la main passe. 3 cases alignées = victoire.
   Contre l'ordi (sur l'appareil) ou contre un pote (salon à code, même canal temps réel que les autres salons). */
"use strict";

const TT_TURN = 30;                 // secondes par tour
const TT_LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
const TT_BOT = {easy:{t:"Facile", know:0.45, d:"Il connaît les grands noms"}, normal:{t:"Moyen", know:0.65, d:"Un vrai fan de PL"}, hard:{t:"Difficile", know:0.85, d:"Une encyclopédie"}};
let T = null, TL = {cell:null, msg:null, code:"", err:null, busy:false}, TT_NET = null, TT_HOST = false, TT_TIMER = null, TT_BOT_T = null;

/* ---------- grille : 3 clubs en ligne × 3 en colonne, au moins 2 réponses par case */
const TT_BYCLUB = (() => { const m = {}; P.forEach((p, i) => new Set(p.s.map(x => x[0])).forEach(c => (m[c] ||= new Set()).add(i))); return m; })();
const ttBoth = (a, b) => [...TT_BYCLUB[a]].filter(i => TT_BYCLUB[b].has(i));
function ttGrid(r){
  const clubs = Object.keys(TT_BYCLUB).filter(c => TT_BYCLUB[c].size >= 40);
  for(let tries=0; tries<800; tries++){
    const pick = [...clubs].sort(() => r()-0.5).slice(0, 6), rows = pick.slice(0, 3), cols = pick.slice(3);
    const ans = rows.flatMap(a => cols.map(b => ttBoth(a, b)));
    if(ans.every(x => x.length >= 2)) return {rows, cols};
  }
  return {rows:["Arsenal","Chelsea","Liverpool"], cols:["Man Utd","Man City","Tottenham"]};
}
const ttValid = (k, i) => { const r = T.grid.rows[Math.floor(k/3)], c = T.grid.cols[k%3]; return TT_BYCLUB[r].has(i) && TT_BYCLUB[c].has(i); };
function ttWinner(cells){ for(const [a,b,c] of TT_LINES){ if(cells[a] && cells[b] && cells[c] && cells[a].by===cells[b].by && cells[b].by===cells[c].by) return {by:cells[a].by, line:[a,b,c]}; } return null; }

/* ---------- démarrage */
function ttNew(players, solo, diff){
  const seed = Date.now() % 1e9, r = rng(seed);
  return {seed, grid:ttGrid(r), cells:Array(9).fill(null), used:[], players, turn:Math.floor(r()*2), phase:"play", winner:null, line:null, solo:!!solo, diff:diff||null, deadlineAt:Date.now()+TT_TURN*1000, last:null, misses:[0,0], gameNo:(T?.gameNo||0)+1};
}
function startTttSolo(diff){
  ttLeave(); TT_HOST = true;
  T = ttNew([{id:ME.id, name:PROFILE.name || "Toi"}, {id:"bot", name:"L'Ordi", bot:true}], true, diff);
  TL = {cell:null, msg:null, code:"", err:null}; VIEW = "ttt"; ttArm(); render(true); ttBotMaybe();
}
async function ttCreate(){
  TL.busy = true; TL.err = null; render(true);
  try{
    const code = Math.random().toString(36).slice(2, 6).toUpperCase(); ttLeave(); TT_HOST = true;
    TT_NET = await connect("ttt"+code, ttOnMsg);
    T = {code, phase:"lobby", players:[{id:ME.id, name:PROFILE.name || "Joueur 1"}], gameNo:0};
    VIEW = "ttt"; TL.busy = false; ttPush();
  }catch(e){ TL.busy = false; TL.err = e.message || "Connexion impossible."; render(true); }
}
async function ttJoin(code){
  code = String(code||"").trim().toUpperCase(); if(code.length !== 4){ TL.err = "Le code fait 4 caractères."; return render(true); }
  TL.busy = true; TL.err = null; render(true);
  try{
    ttLeave(); TT_HOST = false; TT_NET = await connect("ttt"+code, ttOnMsg);
    VIEW = "ttt"; T = {code, phase:"joining", players:[]}; TL.busy = false;
    TT_NET.send({t:"ttjoin", id:ME.id, name:PROFILE.name || "Joueur 2"}); render(true);
    setTimeout(() => { if(T && T.phase==="joining"){ TL.err = "Personne dans ce salon. Vérifie le code."; render(true); } }, 6000);
  }catch(e){ TL.busy = false; TL.err = e.message || "Connexion impossible."; render(true); }
}
function ttLeave(){ clearTimeout(TT_TIMER); clearTimeout(TT_BOT_T); if(TT_NET){ try{ TT_NET.close(); }catch(e){} } TT_NET = null; T = null; }

/* ---------- réseau : l'hôte tient la partie et la diffuse */
function ttPush(){ if(!TT_HOST || !T) return; if(TT_NET){ try{ TT_NET.send({t:"ttstate", s:T}); }catch(e){} } render(true); }
function ttOnMsg(m){
  if(!m) return;
  if(m.t==="ttstate" && !TT_HOST){ const before = T && T.cells ? T.cells.filter(Boolean).length : 0; T = m.s; if(T.cells && T.cells.filter(Boolean).length > before) mcSfx && mcSfx("coin"); render(true); return; }
  if(!TT_HOST || !T) return;
  if(m.t==="ttjoin" && T.phase==="lobby" && T.players.length < 2 && !T.players.some(p => p.id===m.id)){ T.players.push({id:m.id, name:String(m.name||"Joueur 2").slice(0, 18)}); ttPush(); }
  else if(m.t==="ttjoin" && T.phase!=="lobby") ttPush();
  if(m.t==="ttmove") ttMove(m.id, m.cell, m.name);
}
function ttArm(){ clearTimeout(TT_TIMER); if(T.phase!=="play") return; T.deadlineAt = Date.now() + TT_TURN*1000; TT_TIMER = setTimeout(() => { if(T && T.phase==="play"){ T.last = {by:T.turn, txt:"⏱️ Temps écoulé", ok:false}; ttPass(); } }, TT_TURN*1000 + 300); }
function ttPass(){ T.turn = 1 - T.turn; ttArm(); ttPush(); ttBotMaybe(); }

/* ---------- un coup (joué par l'hôte, pour lui ou pour l'invité) */
function ttMove(id, k, name){
  if(!T || T.phase!=="play") return;
  const pi = T.players.findIndex(p => p.id===id); if(pi!==T.turn || T.cells[k]) return;
  const hits = findPlayers(name || "");
  const good = hits.find(i => ttValid(k, i) && !T.used.includes(i));
  if(good!=null){
    T.cells[k] = {by:pi, n:P[good].n}; T.used.push(good); T.last = {by:pi, txt:`✅ ${P[good].n}`, ok:true, k};
    const w = ttWinner(T.cells);
    if(w){ T.phase = "end"; T.winner = w.by; T.line = w.line; clearTimeout(TT_TIMER); return ttEnd(); }
    if(T.cells.every(Boolean)){ T.phase = "end"; T.winner = null; clearTimeout(TT_TIMER); return ttEnd(); }
  } else {
    const used = hits.find(i => ttValid(k, i) && T.used.includes(i));
    T.last = {by:pi, txt: used!=null ? `🔁 ${P[used].n} est déjà pris` : hits.length ? `❌ ${P[hits[0]].n} n'a pas joué pour les deux` : `❌ « ${String(name||"").slice(0, 24)} » : inconnu`, ok:false, k};
    T.misses[pi]++;
  }
  ttPass();
}
function ttEnd(){
  ttPush();
  const me = T.players.findIndex(p => p.id===ME.id), won = T.winner===me;
  if(won && typeof celebrate==="function") celebrate("gold");
  if(typeof recordGame==="function"){ const r = {mode:"ttt", solo:T.solo, score:won ? 3 : T.winner==null ? 1 : 0, total:null, won, found:[], pepites:[]};
    L.summary = Object.assign(recordGame(r), {r, coins:null, bonus:null});
    if(won) (async () => { const s = L.summary, coins = await rewardGame(r.score, true); if(L.summary!==s) return; s.coins = coins; render(true); })(); }
  if(T.solo && won){ const k = "ttt_"+T.diff; PROFILE.best[k] = (PROFILE.best[k]||0) + 1; saveProfile(); }
  render(true);
}

/* ---------- l'ordinateur : choisit une case (gagnante, sinon bloquante, sinon au hasard) et répond juste avec une certaine probabilité */
function ttBotMaybe(){
  clearTimeout(TT_BOT_T);
  if(!T || !T.solo || T.phase!=="play" || !T.players[T.turn].bot) return;
  TT_BOT_T = setTimeout(() => {
    if(!T || T.phase!=="play" || !T.players[T.turn].bot) return;
    const free = T.cells.map((c,k) => c ? -1 : k).filter(k => k>=0), bi = T.turn;
    const wins = who => free.find(k => TT_LINES.some(l => l.includes(k) && l.filter(x => x!==k).every(x => T.cells[x] && T.cells[x].by===who)));
    let k = wins(bi); if(k==null) k = wins(1-bi); if(k==null) k = free.includes(4) && Math.random()<0.6 ? 4 : free[Math.floor(Math.random()*free.length)];
    const opts = P.map((_, i) => i).filter(i => ttValid(k, i) && !T.used.includes(i));
    const knows = Math.random() < TT_BOT[T.diff].know && opts.length;
    const pick = knows ? opts[Math.floor(Math.random()*opts.length)] : null;
    ttMove("bot", k, pick!=null ? P[pick].n : ["Zidane","Messi","Pelé"][Math.floor(Math.random()*3)]);
  }, 1600 + Math.random()*1800);
}

/* ---------- écrans */
function screenTttPick(){
  const b = PROFILE.best;
  return {key:"tttPick"+TL.busy+(TL.err||""), html:`
  <div class="subhead"><button class="iconbtn" data-act="nav" data-v="home" aria-label="Retour">${ICON.back}</button><h1>Tiki-Taka-Toe</h1></div>
  <div class="tt-hero"><div class="tt-mini">${["X","","O","","X","O","","",""].map(x => `<i class="${x}">${x==="X"?"✕":x==="O"?"◯":""}</i>`).join("")}</div>
   <p>Un morpion foot : chaque case croise deux clubs de Premier League. Cite un joueur passé par les deux pour la prendre. 3 alignées et c'est gagné.</p></div>
  <div class="sec-title"><h2>Contre un pote</h2><small>chacun sur son téléphone</small></div>
  <div class="card friends">
   <button class="btn ink" data-act="ttcreate" ${TL.busy?"disabled":""}>Créer une partie</button>
   <div class="or">ou rejoindre</div>
   <div class="row"><input class="input code" id="tt-code" maxlength="4" value="${esc(TL.code)}" placeholder="CODE" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Code de la partie">
    <button class="btn" data-act="ttjoin" ${TL.busy?"disabled":""}>Rejoindre</button></div>
   ${TL.err?`<div class="err" role="alert">${esc(TL.err)}</div>`:""}
  </div>
  <div class="sec-title"><h2>Contre l'ordi</h2></div>
  <div class="pick-list">${Object.entries(TT_BOT).map(([k,d]) => `<button class="mode diff-${k}" data-act="ttsolo" data-v="${k}"><span class="lgtag">${d.t}</span><b>${d.d}</b>${b["ttt_"+k]?`<span class="rec">🏆 ${b["ttt_"+k]}</span>`:""}</button>`).join("")}</div>
  ${tabbar()}`};
}
const ttClub = c => `<span class="tt-club" style="--cc:${CLUB[c]||"#2b59c3"}"><i>${esc(initialsOf(c))}</i><b>${esc(c)}</b></span>`;
function screenTtt(){
  if(!T){ VIEW = "tttPick"; return screenTttPick(); }
  const meI = T.players.findIndex(p => p.id===ME.id);
  if(T.phase==="lobby" || T.phase==="joining") return {key:"ttl-"+T.players.length+(TL.err||""), html:`
    <div class="subhead"><button class="iconbtn" data-act="ttquit" aria-label="Quitter">${ICON.back}</button><h1>Tiki-Taka-Toe</h1></div>
    <div class="card tt-lobby"><small>Code de la partie</small><b class="tt-code">${esc(T.code)}</b><p>${T.phase==="joining" ? "Connexion au salon…" : T.players.length < 2 ? "Donne ce code à ton pote. La partie démarre dès qu'il arrive." : `${esc(T.players[1].name)} est là !`}</p>
     <div class="tt-pl">${T.players.map((p,k) => `<span class="m${k}">${k?"◯":"✕"} ${esc(p.name)}</span>`).join("")}</div>
     ${TL.err?`<div class="err" role="alert">${esc(TL.err)}</div>`:""}</div>
    ${TT_HOST && T.players.length===2 ? dock(`<button class="btn" data-act="ttgo">Lancer la partie</button>`) : ""}`};
  const my = T.turn===meI, sel = TL.cell, end = T.phase==="end";
  const left = Math.max(0, Math.ceil((T.deadlineAt - Date.now())/1000));
  return {key:"tt-"+T.gameNo+"-"+T.cells.filter(Boolean).length+"-"+T.turn+"-"+T.phase+"-"+(sel??"")+(T.last?.txt||""), html:`
  <div class="subhead"><button class="iconbtn" data-act="ttquit" aria-label="Quitter">${ICON.back}</button><h1>Tiki-Taka-Toe</h1>${end?"":`<span class="tt-timer${left<=10?" warn":""}" data-live="ttclock">${left}s</span>`}</div>
  <div class="tt-players">${T.players.map((p,k) => `<div class="tt-p m${k}${T.turn===k && !end?" on":""}"><span>${k?"◯":"✕"}</span><b>${esc(k===meI?"Toi":p.name)}</b><small>${T.cells.filter(c => c && c.by===k).length} case${T.cells.filter(c => c && c.by===k).length>1?"s":""}</small></div>`).join("")}</div>
  <p class="tt-say">${end ? (T.winner==null ? "Match nul !" : T.winner===meI ? "🏆 Tu gagnes !" : `${esc(T.players[T.winner].name)} gagne…`) : my ? (sel==null ? "À toi : choisis une case" : "Quel joueur a porté ces deux maillots ?") : `${esc(T.players[T.turn].name)} réfléchit…`}</p>
  <div class="tt-grid">
   <span class="tt-corner">⚽</span>${T.grid.cols.map(c => `<span class="tt-h col">${ttClub(c)}</span>`).join("")}
   ${T.grid.rows.map((r, ri) => `<span class="tt-h row">${ttClub(r)}</span>${[0,1,2].map(ci => { const k = ri*3+ci, c = T.cells[k], win = T.line && T.line.includes(k);
     return `<button class="tt-cell${c?` m${c.by}`:""}${sel===k?" sel":""}${win?" win":""}${T.last && T.last.k===k && !T.last.ok?" miss":""}" ${!c && my && !end ? `data-act="ttcell" data-v="${k}"` : "disabled"}>${c ? `<i>${c.by?"◯":"✕"}</i><small>${esc(cardName ? cardName(c.n) : c.n)}</small>` : ""}</button>`; }).join("")}`).join("")}
  </div>
  ${T.last ? `<p class="tt-last ${T.last.ok?"ok":"ko"}">${esc(T.players[T.last.by]?.name || "")} : ${esc(T.last.txt)}</p>` : ""}
  ${end ? summaryBlock ? `<div style="margin-top:12px">${L.summary && L.summary.r && L.summary.r.mode==="ttt" ? summaryBlock() : ""}</div>` : "" : ""}
  ${end ? dock(T.solo ? `<button class="btn" data-act="ttsolo" data-v="${T.diff}">Rejouer</button><button class="btn ghost" data-act="ttquit">Retour</button>`
      : TT_HOST ? `<button class="btn" data-act="ttgo">Revanche</button><button class="btn ghost" data-act="ttquit">Quitter</button>` : `<button class="btn ghost" data-act="ttquit">Quitter</button>`)
    : my && sel!=null ? dock(`<form class="tt-form" data-form="ttt"><input class="input" id="tt-guess" autocomplete="off" spellcheck="false" placeholder="Nom du joueur" aria-label="Nom du joueur"><button class="btn">Valider</button></form>`) : ""}`};
}
function ttTick(){ document.querySelectorAll('[data-live="ttclock"]').forEach(el => { if(!T || !T.deadlineAt) return; const left = Math.max(0, Math.ceil((T.deadlineAt - Date.now())/1000)); el.textContent = left+"s"; el.classList.toggle("warn", left<=10); }); }
setInterval(ttTick, 250);

/* ---------- actions */
function ttAct(a, v){
  switch(a){
    case "ttsolo": startTttSolo(v); break;
    case "ttcreate": ttCreate(); break;
    case "ttjoin": { const el = document.getElementById("tt-code"); TL.code = el ? el.value : ""; ttJoin(TL.code); break; }
    case "ttgo": if(TT_HOST && T && T.players.length===2){ T = Object.assign(ttNew(T.players, false), {code:T.code, gameNo:(T.gameNo||0)+1}); TL.cell = null; L.summary = null; ttArm(); ttPush(); } break;
    case "ttcell": TL.cell = +v; render(true); { const g = document.getElementById("tt-guess"); if(g) g.focus(); } break;
    case "ttquit": ttLeave(); TL = {cell:null, msg:null, code:"", err:null}; VIEW = "tttPick"; render(true); break;
  }
}
function ttSubmit(){
  const g = document.getElementById("tt-guess"), name = g ? g.value.trim() : ""; if(!name || TL.cell==null || !T) return;
  const k = TL.cell; TL.cell = null;
  if(TT_HOST) ttMove(ME.id, k, name); else if(TT_NET){ try{ TT_NET.send({t:"ttmove", id:ME.id, cell:k, name}); }catch(e){} render(true); }
}
