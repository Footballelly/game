/* Football Legends — moteur de partie.
   Un « hôte » détient la partie (G) et diffuse un état public (game). En solo, l'hôte est le joueur lui-même, sans réseau.
   En salon, les autres téléphones envoient leurs actions via un canal temps réel Supabase (ou BroadcastChannel en mode test). */
"use strict";

let ME = {id: SS.get("fl-id") || uid(), get name(){ return PROFILE.name || "Joueur"; }}; SS.set("fl-id", ME.id);
let NET = null, CODE = null, IS_HOST = false;
let G = null;          // partie complète (hôte uniquement)
let game = null;       // état public
let deadline = null;   // fin du chrono, heure locale
let hostTimer = null, joinTimer = null, autoTimer = null;
let L = freshLocal();
function freshLocal(){ return {joinCode:"", err:null, busy:false, round:-1, draft:"", tries:0, msg:null, pendingRaw:null, why:null, mine:null,
  pmCur:-1, pmPick:null, ratings:{}, voted:false, ver:0, chGame:-1, chFound:[], chMsg:null, chDone:false, summary:null, summaryFor:null}; }

/* ---------- Réseau ---------- */
async function connect(code, onMsg){
  if(ONLINE){
    const client = sb(); if(!client) throw new Error("Le serveur de jeu est injoignable. Vérifie ta connexion.");
    const ch = client.channel("fl-"+code, {config:{broadcast:{self:false}}});
    ch.on("broadcast", {event:"msg"}, ({payload}) => onMsg(payload));
    await new Promise((res, rej) => { const t = setTimeout(() => rej(new Error("Connexion impossible au serveur de jeu.")), 10000);
      ch.subscribe(st => { if(st==="SUBSCRIBED"){ clearTimeout(t); res(); } else if(st==="CHANNEL_ERROR"||st==="TIMED_OUT"){ clearTimeout(t); rej(new Error("Connexion impossible au serveur de jeu.")); } }); });
    return {send: m => ch.send({type:"broadcast", event:"msg", payload:m}), close: () => client.removeChannel(ch)};
  }
  const bc = new BroadcastChannel("fl-"+code); bc.onmessage = e => onMsg(e.data);
  return {send: m => bc.postMessage(m), close: () => bc.close()};
}

/* ======================================================================
   HÔTE
   ====================================================================== */
function newGame(){ return {code:CODE, host:ME.id, mode:"saison", timer:30, phase:"lobby", players:[{id:ME.id, name:ME.name}],
  rounds:[], round:0, answers:{}, revealed:{}, votes:{}, chain:[], pm:{cur:0, picks:{}, scores:{}, hist:{}, last:null, endless:false},
  deadlineAt:null, pmTheme:"pl", chronoList:"random", chronoTime:90, chrono:null, lastList:null, gameNo:0, solo:false, daily:null}; }
function pub(){
  const s = {...G}; delete s.answers; delete s.votes; s.pm = {...G.pm}; delete s.pm.picks;
  s.answeredIds = Object.keys(G.answers[G.round] || {});
  s.pickedIds = Object.keys(G.pm.picks || {});
  s.votedIds = Object.keys(G.votes || {});
  if(G.phase==="results") s.votes = G.votes;
  if(G.chrono){ s.chrono = {list:G.chrono.list, counts:Object.fromEntries(Object.entries(G.chrono.found).map(([k,v]) => [k, v.length])), doneIds:Object.keys(G.chrono.done)};
    if(G.phase==="chronoResult") s.chrono.found = G.chrono.found; }
  return s;
}
function push(){
  if(!IS_HOST || !G) return;
  if(!G.solo) LS.set("fl-g-"+CODE, G);
  const m = {t:"state", s:pub(), endsIn: G.deadlineAt ? Math.max(0, G.deadlineAt-Date.now()) : null};
  if(NET){ try{ NET.send(m); }catch(e){} }
  onState(m);
}
function armTimer(fn, secs){
  clearTimeout(hostTimer); const s = secs ?? G.timer;
  if(s){ G.deadlineAt = Date.now()+s*1000; hostTimer = setTimeout(fn, s*1000+1200); } else G.deadlineAt = null;
}
function hostHandle(m){
  if(!G || !m || !m.id) return;
  const inGame = G.players.some(p => p.id===m.id);
  switch(m.t){
    case "join":
      if(inGame){ G.players.find(p => p.id===m.id).name = String(m.name||"").slice(0,18) || "Joueur"; }
      else if(G.phase==="lobby" && G.players.length<8){ G.players.push({id:m.id, name:String(m.name||"").slice(0,18) || "Joueur"}); }
      push(); break;
    case "hello": push(); break;
    case "leave": if(G.phase==="lobby"){ G.players = G.players.filter(p => p.id!==m.id); push(); } break;
    case "answer":
      if(G.phase!=="answering" || m.round!==G.round || !inGame) return;
      (G.answers[G.round] ||= {})[m.id] = sanitizeEntry(m.entry);
      if(G.players.every(p => G.answers[G.round][p.id])) endRound(); else push(); break;
    case "pick":
      if(G.phase!=="pmAsk" || m.cur!==G.pm.cur || !inGame || !["plus","moins"].includes(m.choice)) return;
      G.pm.picks[m.id] = m.choice;
      if(G.players.every(p => G.pm.picks[p.id])) endPm(); else push(); break;
    case "found": {
      if(G.phase!=="chronoPlay" || !inGame || !Array.isArray(m.items)) return;
      const n = (listById(G.chrono.list) || {items:[]}).items.length;
      G.chrono.found[m.id] = [...new Set(m.items.filter(i => Number.isInteger(i) && i>=0 && i<n))];
      push(); break; }
    case "chdone":
      if(G.phase!=="chronoPlay" || !inGame) return;
      G.chrono.done[m.id] = true;
      if(G.players.every(p => G.chrono.done[p.id])) endChrono(); else push(); break;
    case "votes":
      if(G.phase!=="voting" || !inGame) return;
      G.votes[m.id] = m.ratings || {};
      if(G.players.every(p => G.votes[p.id])) G.phase = "results";
      push(); break;
  }
}
function sanitizeEntry(e){
  if(!e) return {st:"none"};
  if(e.st==="ok" && Number.isInteger(e.i) && P[e.i]) return {st:"ok", i:e.i};
  if(e.st==="pending") return {st:"pending", raw:String(e.raw||"").slice(0,40)};
  return {st:"none"};
}
function hostStart(){
  clearTimeout(autoTimer);
  G.gameNo = (G.gameNo||0)+1;
  const r = G.daily ? rng("fl-"+G.daily+"-"+G.mode) : Math.random;
  if(G.mode==="chrono"){
    let id = G.chronoList;
    if(id==="random" || !listById(id)){ const pool = LISTS.filter(l => l.id!==G.lastList); id = pool[Math.floor(Math.random()*pool.length)].id; }
    G.lastList = id; G.chrono = {list:id, found:{}, done:{}}; G.phase = "chronoPlay"; armTimer(endChrono, G.chronoTime||90);
  } else if(G.mode==="saison"){
    const ss = shuffle(SEASONS, r); G.rounds = SLOTS.map((s,k) => ({slot:s.id, y:ss[k]}));
    G.round = 0; G.answers = {}; G.revealed = {}; G.votes = {}; G.phase = "answering"; armTimer(endRound);
  } else {
    const endless = G.solo && !G.daily;
    const pool = goalsOf(G.pmTheme);
    G.chain = shuffle(pool.map((g,i) => i), r).slice(0, endless ? pool.length : PM_DUELS+1);
    G.pm = {cur:0, picks:{}, scores:Object.fromEntries(G.players.map(p => [p.id,0])), hist:Object.fromEntries(G.players.map(p => [p.id,[]])), last:null, endless};
    G.votes = {}; G.phase = "pmAsk"; armTimer(endPm, G.solo ? (G.daily ? 20 : 0) : undefined);
  }
  push();
}
function endRound(){
  if(G.phase!=="answering") return; clearTimeout(hostTimer);
  const a = G.answers[G.round] || {};
  G.revealed[G.round] = Object.fromEntries(G.players.map(p => [p.id, a[p.id] || {st:"none"}]));
  G.phase = "roundResult"; G.deadlineAt = null;
  if(G.solo && !Object.values(G.revealed[G.round]).some(e => e.st==="pending")){ autoTimer = setTimeout(hostNext, 1400); }
  push();
}
function endChrono(){ if(G.phase!=="chronoPlay") return; clearTimeout(hostTimer); G.phase = "chronoResult"; G.deadlineAt = null; push(); }
function endPm(){
  if(G.phase!=="pmAsk") return; clearTimeout(hostTimer);
  const GS = goalsOf(G.pmTheme), A = GS[G.chain[G.pm.cur]], B = GS[G.chain[G.pm.cur+1]];
  const right = B.g>A.g ? "plus" : B.g<A.g ? "moins" : "egal";
  const winners = G.players.filter(p => G.pm.picks[p.id] && (right==="egal" || G.pm.picks[p.id]===right)).map(p => p.id);
  winners.forEach(id => G.pm.scores[id] = (G.pm.scores[id]||0)+1);
  G.players.forEach(p => (G.pm.hist[p.id] ||= []).push(winners.includes(p.id)));
  G.pm.last = {right, winners, picks:{...G.pm.picks}};
  G.deadlineAt = null;
  if(G.pm.endless && !winners.length){ G.phase = "pmResult"; G.pm.over = true; push(); autoTimer = setTimeout(() => { G.phase = "results"; push(); }, 1800); return; }
  G.phase = "pmResult";
  if(G.solo) autoTimer = setTimeout(hostNext, 1300);
  push();
}
function hostNext(){
  clearTimeout(autoTimer);
  if(G.phase==="roundResult"){
    if(Object.values(G.revealed[G.round]).some(e => e.st==="pending")) return;
    if(G.round<SLOTS.length-1){ G.round++; G.phase = "answering"; armTimer(endRound); }
    else { G.phase = G.players.length>1 ? "voting" : "results"; G.votes = {}; }
  } else if(G.phase==="pmResult"){
    if(G.pm.cur<G.chain.length-2){ G.pm.cur++; G.pm.picks = {}; G.phase = "pmAsk"; armTimer(endPm, G.solo ? (G.daily ? 20 : 0) : undefined); }
    else G.phase = "results";
  }
  push();
}
function hostForce(){ if(G.phase==="answering") endRound(); else if(G.phase==="pmAsk") endPm(); else if(G.phase==="chronoPlay") endChrono(); else if(G.phase==="voting"){ G.phase = "results"; push(); } }
function hostJudge(r, id, v){ const e = G.revealed[r] && G.revealed[r][id]; if(e && e.st==="pending"){ e.st = v==="ok" ? "agreed" : "refused"; if(G.solo && !Object.values(G.revealed[r]).some(x => x.st==="pending")) autoTimer = setTimeout(hostNext, 900); push(); } }
function hostLobby(){ clearTimeout(hostTimer); clearTimeout(autoTimer); const old = G; G = newGame(); ["players","mode","timer","pmTheme","chronoList","chronoTime","lastList","gameNo"].forEach(k => { if(old[k]!==undefined) G[k] = old[k]; }); push(); }

/* ======================================================================
   CLIENT (tous les téléphones, hôte compris)
   ====================================================================== */
function act(m){ m.id = ME.id; if(IS_HOST) hostHandle(m); else if(NET){ try{ NET.send(m); }catch(e){} } }
function onMsg(m){ if(!m) return; if(m.t==="state"){ if(!IS_HOST) onState(m); return; } if(IS_HOST) hostHandle(m); }
function onState(m){
  if(!m.s || m.s.code!==CODE) return;
  clearTimeout(joinTimer);
  VIEW = "game";
  const prev = game && game.phase;
  game = m.s; deadline = m.endsIn!=null ? Date.now()+m.endsIn : null;
  if(game.phase==="lobby" && prev && prev!=="lobby"){ const keep = L.joinCode; L = freshLocal(); L.joinCode = keep; }
  if(!game.players.some(p => p.id===ME.id) && game.phase!=="lobby"){ L.err = "La partie a déjà commencé sans toi."; leaveGame(true); return; }
  if(["results","chronoResult"].includes(game.phase)) finishGame();
  render();
}
/* ---------- Démarrer ---------- */
function startSolo(mode, opts={}){
  leaveGame(false, true);
  CODE = "SOLO"; IS_HOST = true; NET = null;
  G = newGame(); G.solo = true; G.mode = mode; G.daily = opts.daily || null; G.pmTheme = opts.theme || "pl";
  if(mode==="chrono"){ G.chronoList = opts.list || "random"; G.chronoTime = opts.time || 90; }
  if(mode==="saison"){ G.timer = opts.timer ?? 30; }
  VIEW = "game"; hostStart();
}
async function createGame(){
  L.busy = true; L.err = null; render(true);
  CODE = Array.from({length:4}, () => "ABCDEFGHJKMNPQRSTUVWXYZ"[Math.floor(Math.random()*23)]).join("");
  IS_HOST = true; G = newGame();
  try{ NET = await connect(CODE, onMsg); }catch(e){ L.err = e.message; L.busy = false; IS_HOST = false; G = null; CODE = null; return render(true); }
  SS.set("fl-session", {code:CODE, host:true}); L.busy = false; VIEW = "game"; push();
}
async function joinGame(code){
  code = String(code||"").toUpperCase().replace(/[^A-Z]/g,"");
  if(code.length!==4){ L.err = "Le code fait 4 lettres."; return render(true); }
  L.busy = true; L.err = null; render(true);
  CODE = code; IS_HOST = false;
  try{ NET = await connect(CODE, onMsg); }catch(e){ L.err = e.message; L.busy = false; CODE = null; return render(true); }
  SS.set("fl-session", {code:CODE, host:false});
  act({t:"join", name:ME.name});
  joinTimer = setTimeout(() => { if(!game){ L.err = `Aucune partie trouvée avec le code ${CODE}. Vérifie le code et que l'hôte a l'appli ouverte.`; leaveGame(true); } }, 7000);
}
function leaveGame(keepErr, silent){
  if(!IS_HOST && NET && game && game.phase==="lobby") act({t:"leave"});
  try{ NET && NET.close(); }catch(e){}
  clearTimeout(hostTimer); clearTimeout(joinTimer); clearTimeout(autoTimer);
  if(CODE && CODE!=="SOLO") LS.del("fl-g-"+CODE);
  SS.del("fl-session"); NET = null; CODE = null; IS_HOST = false; G = null; game = null; deadline = null;
  const err = keepErr ? L.err : null; L = freshLocal(); L.err = err;
  if(!silent){ VIEW = keepErr ? "friends" : "home"; render(true); }
}
async function resumeSession(){
  const s = SS.get("fl-session"); if(!s || !s.code) return false;
  CODE = s.code; IS_HOST = !!s.host;
  try{ NET = await connect(CODE, onMsg); }catch(e){ SS.del("fl-session"); CODE = null; IS_HOST = false; return false; }
  VIEW = "game";
  if(IS_HOST){
    G = LS.get("fl-g-"+CODE); if(!G){ leaveGame(); return true; }
    if(G.deadlineAt){ const left = G.deadlineAt-Date.now(); const fn = G.phase==="answering" ? endRound : G.phase==="pmAsk" ? endPm : G.phase==="chronoPlay" ? endChrono : null; if(fn) hostTimer = setTimeout(fn, Math.max(0,left)+1200); }
    push();
  } else {
    act({t:"hello"});
    joinTimer = setTimeout(() => { if(!game){ L.err = "La partie précédente n'est plus disponible."; leaveGame(true); } }, 7000);
  }
  return true;
}
setInterval(() => { if(IS_HOST && G && NET){ try{ NET.send({t:"state", s:pub(), endsIn: G.deadlineAt ? Math.max(0, G.deadlineAt-Date.now()) : null}); }catch(e){} } }, 4000);

/* ---------- Un joueur par saison : saisie de mémoire, validée sur le téléphone du joueur ---------- */
function myTeam(id=ME.id){ const t = {}; (game.rounds||[]).forEach((r,k) => { const e = game.revealed && game.revealed[k] && game.revealed[k][id]; if(e) t[r.slot] = e; }); return t; }
function submitGuess(raw){
  const r = game.rounds[game.round], slot = slotById(r.slot);
  if(!norm(raw)) return;
  L.draft = raw;
  /* x = joueur dont on ne connaît la carrière qu'à partir de 2016 : on ne peut pas le juger sur une saison plus ancienne */
  const hits = findPlayers(raw).filter(i => !(P[i].x && r.y < 2016));
  if(!hits.length){ L.msg = {kind:"unknown", raw}; L.pendingRaw = raw; L.ver++; return render(); }
  const already = new Set(Object.values(myTeam()).filter(e => e.st==="ok").map(e => e.i));
  const valid = hits.filter(i => clubAt(P[i], r.y) && lines(P[i]).includes(slot.l) && !already.has(i));
  if(valid.length===1) return sendAnswer({st:"ok", i:valid[0]});
  if(valid.length>1){ L.msg = {kind:"ambig", opts:valid}; L.ver++; return render(); }
  L.tries++; const p = P[hits[0]]; let text, contest = false;
  if(hits.some(i => already.has(i))) text = `${short(p)} est déjà dans ton 11.`;
  else if(!hits.some(i => clubAt(P[i], r.y))){ text = `D'après notre base, ${short(p)} ne jouait pas en Premier League en ${sLbl(r.y)}.`; contest = true; }
  else { text = `${short(p)} n'est pas ${ROLE[slot.l]} pour nous.`; contest = true; }
  L.pendingRaw = raw;
  if(L.tries>=MAX_TRIES){ L.why = text+" Plus d'essais."; return sendAnswer({st:"none"}); }
  L.msg = {kind:"bad", text, contest}; L.ver++; render();
}
function sendAnswer(entry){ L.mine = entry; L.msg = null; L.ver++; act({t:"answer", round:game.round, entry}); render(); }

/* ---------- Chrono ---------- */
function chronoReset(){ if(L.chGame!==game.gameNo){ L.chGame = game.gameNo; L.chFound = []; L.chMsg = null; L.chDone = false; } }
function chronoGuess(input){
  const raw = input.value, l = listById(game.chrono.list); if(!norm(raw)) return;
  const r = chronoMatch(l, raw, L.chFound);
  if(r.kind==="ok"){ L.chFound.push(r.i); L.chMsg = {ok:true, text:`✓ ${l.items[r.i].n}`}; act({t:"found", items:L.chFound.slice()}); }
  else if(r.kind==="dup") L.chMsg = {ok:false, text:`${l.items[r.i].n} : déjà trouvé`};
  else L.chMsg = {ok:false, text:`« ${raw.trim()} » n'est pas dans la liste`};
  input.value = ""; render();
}

/* ---------- Qui est une pépite ---------- */
const keyOf = e => !e || e.st==="none" || e.st==="refused" ? null : e.st==="ok" ? "i"+e.i : "r"+norm(e.raw);
function isGem(r, id){ if(game.players.length<2) return false; const rv = game.revealed[r]; const k = keyOf(rv && rv[id]); if(!k) return false; return game.players.every(p => p.id===id || keyOf(rv[p.id])!==k); }
function rankingSaison(){
  return game.players.map(p => { const got = Object.values(game.votes||{}).map(r => r[p.id]).filter(v => typeof v==="number");
    const t = myTeam(p.id); const filled = Object.values(t).filter(e => ["ok","agreed","pending"].includes(e.st)).length;
    const gems = game.rounds.filter((r,k) => isGem(k, p.id)).length;
    return {id:p.id, name:p.name, avg: got.length ? got.reduce((a,b) => a+b, 0)/got.length : 0, filled, gems}; })
    .sort((a,b) => game.players.length>1 ? b.avg-a.avg || b.gems-a.gems : b.filled-a.filled);
}

/* ---------- Fin de partie : XP, cartes, défi du jour (une seule fois par partie) ---------- */
function finishGame(){
  const tag = (game.code||"")+":"+game.gameNo; if(L.summaryFor===tag) return; L.summaryFor = tag;
  const multi = game.players.length>1, mode = game.mode, r = {mode, solo:!multi, daily:game.daily, found:[], pepites:[]};
  if(mode==="saison"){
    const t = myTeam(); r.total = 11;
    r.detail = SLOTS.map(s => { const e = t[s.id]; return !!e && ["ok","agreed"].includes(e.st); });
    r.score = r.detail.filter(Boolean).length;
    r.found = Object.values(t).filter(e => e.st==="ok").map(e => P[e.i].n);
    r.pepites = game.rounds.map((x,k) => isGem(k, ME.id) ? game.revealed[k][ME.id] : null).filter(e => e && e.st==="ok").map(e => P[e.i].n);
    if(multi){ const rk = rankingSaison(); r.won = rk[0].id===ME.id && rk[0].avg>0; }
  } else if(mode==="chrono"){
    const l = listById(game.chrono.list), mine = (game.chrono.found||{})[ME.id] || L.chFound;
    r.list = l.id; r.time = game.chronoTime; r.total = l.items.length; r.score = mine.length;
    if(l.kind==="player") r.found = mine.map(i => l.items[i].n);
    if(multi){ const all = game.chrono.found||{}; const best = Math.max(...game.players.map(p => (all[p.id]||[]).length)); r.won = r.score===best && r.score>0;
      r.pepites = l.kind==="player" ? mine.filter(i => game.players.every(p => p.id===ME.id || !(all[p.id]||[]).includes(i))).map(i => l.items[i].n) : []; }
  } else {
    r.score = (game.pm.scores||{})[ME.id] || 0; r.detail = (game.pm.hist||{})[ME.id] || [];
    r.total = game.pm.endless ? null : PM_DUELS; r.theme = game.pmTheme;
    if(multi){ const best = Math.max(...Object.values(game.pm.scores)); r.won = r.score===best && r.score>0; }
  }
  L.summary = Object.assign(recordGame(r), {r, coins:null, bonus:null});
  if(L.summary.rec.length) setTimeout(() => celebrate(), 300);
  if(r.daily) submitDaily(r);
  (async () => {
    const s = L.summary, coins = await rewardGame(r.score, r.won);
    if(L.summary!==s) return;
    s.coins = coins;
    if(r.daily){ const d = await claimDaily(r.daily); if(d && !d.already){ s.bonus = d; PROFILE.streak = {count:d.streak, best:Math.max(PROFILE.streak.best||0, d.streak), last:r.daily}; saveProfile(); } }
    render(true);
  })();
}
