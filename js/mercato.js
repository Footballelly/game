/* Football Legends — MERCATO FC (règles v2.2), en solo contre 3 directeurs sportifs ordinateurs.
   Tout se joue sur l'appareil (pas de serveur) ; seule la fin de partie rapporte XP et pièces comme les autres modes.
   Adaptation numérique : la nationalité n'existe pas dans nos données, le combo « Nationalité » devient
   « Championnat étranger » (3 joueurs de Ligue 1, Liga ou Serie A dans le même secteur). */
"use strict";

const MC = {
  seasons:6, budget:50, buys:2, market:6, handMax:3, plays:2,
  prize:{1:5, 2:8, 3:10, 4:12}, comboClub:10, comboLeague:8, duo:6, legendMult:1.5,
  pepCurve:[3,6,9], pepResale:15, sellRatio:0.5, secret:15, fpf:0.2, clauseMult:2, surench:5, fee:1, moneyPP:2
};
const MC_SLOTS = {G:1, DEF:4, MIL:4, ATT:2};
const MC_SECTOR = {G:"DEF", DEF:"DEF", MIL:"MIL", ATT:"ATT"};
const MC_POS = {GK:"G", DEF:"DEF", MID:"MIL", ATT:"ATT"};
const MC_POS_FR = {G:"Gardien", DEF:"Défenseur", MIL:"Milieu", ATT:"Attaquant"};
const MC_DIFF = {
  easy:{t:"Facile", d:"Des présidents amateurs : enchères timides, coups bas au hasard."},
  normal:{t:"Moyen", d:"Des pros qui suivent chacun leur stratégie."},
  hard:{t:"Difficile", d:"Des requins : ils calculent les combos et visent le leader."}
};
const MC_BOTS = [
  {prof:"A", n:"Le Requin", d:"agressif, adore les coups bas"},
  {prof:"B", n:"Le Comptable", d:"économise pour les Légendes"},
  {prof:"C", n:"Le Professeur", d:"ne pense qu'aux combos"},
  {prof:"D", n:"Le Dénicheur", d:"chasse les Pépites"}
];
const MC_EVENTS = {
  calme:{t:"Mercato calme", d:"Aucun effet."},
  inflation:{t:"Inflation", d:"Chaque club paie 1 M€ par joueur sur son terrain."},
  europe:{t:"Coupe d'Europe", d:"Combos Championnat étranger ×2."},
  derby:{t:"Derby", d:"Combos Club ×2."},
  crise:{t:"Crise financière", d:"Primes de fin de saison divisées par 2."},
  fou:{t:"Mercato fou", d:"8 joueurs au marché au lieu de 6."},
  blessures:{t:"Épidémie de blessures", d:"Le meilleur joueur de chaque équipe ne joue pas."},
  jeunesse:{t:"Année de la jeunesse", d:"Chaque Pépite sur le terrain rapporte +2 PP."}
};
const MC_EV_POOL = ["calme","calme","inflation","europe","derby","crise","fou","blessures","jeunesse"];
const MC_STRATS = {
  scandale:{t:"Scandale de Presse", d:"Suspend un joueur adverse cette saison (il casse le combo de son secteur).", p:"« Je n'ai rien contre lui, j'ai juste des photos. »"},
  clause:{t:"Clause Libératoire", d:"Payez 2 × son prix pour prendre un joueur adverse (une fois par partie).", p:"« Tout a un prix. Même la loyauté. »"},
  fpf:{t:"Audit FPF", d:"Le 1er du classement perd 20 % de sa trésorerie. Interdit en Saison 6.", p:"« Les comptes ne mentent jamais… les présidents, si. »"},
  surench:{t:"Surenchère Éclair", d:"Rachetez un joueur qu'un rival vient de signer (son prix + 5 M€).", p:"« Désolé, il a signé chez nous à 23h59. »"}
};
const MC_STRAT_DECK = [..."ssssssssssccccc".split("").map(x => x==="s"?"scandale":"clause"), ...Array(5).fill("fpf"), ...Array(6).fill("surench")];
const MC_SECRETS = {
  club3:{t:"Esprit de clocher", d:"Finir avec 3 joueurs du même club sur le terrain.", ok:p => Math.max(0, ...Object.values(mcCount(p.team.map(c => c.club)))) >= 3},
  legend2:{t:"Galáctico", d:"Posséder 2 Légendes.", ok:p => mcRoster(p).filter(c => c.kind==="legend").length >= 2},
  pep2:{t:"Formateur", d:"Avoir revendu 2 Pépites.", ok:p => p.pepSold >= 2},
  rich:{t:"Trésorier modèle", d:"Finir avec au moins 40 M€.", ok:p => p.money >= 40},
  clean:{t:"Casier vierge", d:"Ne jamais avoir subi de Scandale de Presse.", ok:p => !p.scandalised},
  full:{t:"Effectif complet", d:"Finir avec au moins 9 joueurs sur le terrain.", ok:p => p.team.length >= 9}
};

/* ---------- petits outils */
function mcCount(arr){ const o = {}; arr.forEach(x => o[x] = (o[x]||0)+1); return o; }
function mcShuffle(a, r){ for(let k=a.length-1;k>0;k--){ const j = Math.floor(r()*(k+1)); [a[k],a[j]] = [a[j],a[k]]; } return a; }
const mcRoster = p => [...p.team, ...p.bench];
const mcFree = (p, pos) => p.team.filter(c => c.pos===pos).length < MC_SLOTS[pos];
const mcPP = c => c.kind==="pepite" ? MC.pepCurve[Math.min(Math.max(c.age,1),3)-1] || 0 : c.pp;
const mcMe = () => M.players[0];
let M = null;

/* ---------- paquet de joueurs tiré du catalogue des cartes */
function mcDeck(r){
  const h = id => hashStr(id+"mc");
  const leg = CARDS.filter(c => c.r==="legend" || c.r==="icon"), rare = CARDS.filter(c => c.r==="rare"), com = CARDS.filter(c => c.r==="common");
  const mk = (c, kind) => { const x = h(c.id); const base = {uid:uid(), id:c.id, n:c.n, club:c.c, lg:c.lg, pos:MC_POS[c.p]||"MIL", kind, age:0};
    if(kind==="legend") return {...base, price:25 + x%6, pp:20 + x%9};
    if(kind==="pepite") return {...base, price:2, pp:0};
    return {...base, price:(c.r==="rare"?10:8) + x%3, pp:(c.r==="rare"?9:7) + x%3}; };
  const pick = (arr, n) => mcShuffle([...arr], r).slice(0, n);
  const used = new Set(), out = [];
  pick(leg, 14).forEach(c => { used.add(c.id); out.push(mk(c, "legend")); });
  pick([...rare, ...com].filter(c => !used.has(c.id)), 60).forEach(c => { used.add(c.id); out.push(mk(c, "regular")); });
  pick(com.filter(c => !used.has(c.id)), 26).forEach(c => out.push(mk(c, "pepite")));
  return mcShuffle(out, r);
}

/* ---------- démarrage */
function startMercato(diff){
  leaveGame(false, true);
  const r = rng(Date.now() % 1e9);
  const bots = mcShuffle([...MC_BOTS], r).slice(0, 3);
  const mkP = (n, prof, bot) => ({n, prof, bot, money:MC.budget, team:[], bench:[], hand:[], shield:true, clauseUsed:false, score:0, hist:[], secret:null, pepSold:0, scandalised:false});
  M = {diff, r, season:1, deck:mcDeck(r), sdeck:mcShuffle([...MC_STRAT_DECK], r), events:Array.from({length:MC.seasons}, () => MC_EV_POOL[Math.floor(r()*MC_EV_POOL.length)]),
       players:[mkP(PROFILE.name || "Toi", "me", false), ...bots.map(b => mkP(b.n, b.prof, true))],
       phase:"intro", market:[], won:{}, susp:new Set(), log:[], sel:{}, results:[], pending:null, queue:[], qi:0, played:0, secretChoice:null};
  const keys = Object.keys(MC_SECRETS);
  M.players.forEach((p, k) => { p.hand = [M.sdeck.pop(), M.sdeck.pop()];
    const two = mcShuffle([...keys], r).slice(0, 2); if(k===0) M.secretChoice = two; else p.secret = two[0]; });
  VIEW = "mercato"; render(true);
}
function mcRank(){ return [...M.players].sort((a,b) => b.score-a.score || b.money-a.money); }
function mcLog(t, cls=""){ M.log.push({t, cls, s:M.season}); }

/* ---------- Phase 1 : météo + pioche + vieillissement des Pépites, puis marché */
function mcSeasonStart(){
  const ev = M.events[M.season-1];
  M.susp = new Set(); M.won = {}; M.sel = {}; M.results = []; M.played = 0;
  mcLog(`Saison ${M.season} · ${MC_EVENTS[ev].t} : ${MC_EVENTS[ev].d}`, "ev");
  M.players.forEach(p => {
    if(ev==="inflation"){ const c = p.team.length; p.money = Math.max(0, p.money - c); }
    for(let k=0;k<2;k++) if(M.sdeck.length) p.hand.push(M.sdeck.pop());
    while(p.hand.length > MC.handMax) p.hand.shift();
    mcRoster(p).forEach(c => { if(c.kind==="pepite") c.age++; });
    if(p.bot) mcRoster(p).filter(c => c.kind==="pepite" && c.age>=4 && (p.prof==="D" || p.money < 15)).forEach(c => mcSell(p, c, true));
  });
  const n = MC.market + (ev==="fou" ? 2 : 0);
  M.market = M.deck.splice(0, n);
  if(!M.market.some(c => c.kind==="legend")){ const i = M.deck.findIndex(c => c.kind==="legend"); if(i>=0) M.market[M.market.length-1] = M.deck.splice(i, 1)[0]; }
  M.phase = "mercato"; render(true);
}

/* ---------- valeur pour un ordinateur (M€ qu'il est prêt à payer) */
function mcWtp(p, c){
  const left = MC.seasons - M.season + 1, hard = M.diff==="hard", easy = M.diff==="easy";
  let pp = c.kind==="pepite" ? [3,6,9,9,9,9].slice(0, left).reduce((a,b) => a+b, 0) + (left>3 ? MC.pepResale/0.35*0.5 : 0) : c.pp*left;
  const own = mcRoster(p).filter(o => MC_SECTOR[o.pos]===MC_SECTOR[c.pos]);
  const syn = (own.filter(o => o.club===c.club).length*4 + own.filter(o => o.lg===c.lg && c.lg!=="pl").length*3) * left;
  pp += syn * (p.prof==="C" || hard ? 1 : 0.3);
  let m = 1;
  if(p.prof==="B") m = c.kind==="legend" ? 1.35 : (M.season < 5 ? 0.4 : 0.8);
  if(p.prof==="D") m = c.kind==="pepite" ? 1.5 : (c.kind==="legend" && p.money>35 ? 1.1 : 0.6);
  if(!mcFree(p, c.pos) && p.bench.length>=3) m *= 0.3;
  let v = pp * ({easy:0.25, normal:0.45, hard:0.75}[M.diff]) * (hard ? Math.max(m, 0.85) : m);
  if(easy) v *= 0.6 + M.r()*0.6;
  return v;
}

/* ---------- Phase 2 : enchères */
function mcBotBids(p){
  const bids = []; let budget = p.money;
  const ranked = [...M.market].sort((a,b) => (mcWtp(p,b)-b.price) - (mcWtp(p,a)-a.price));
  for(const c of ranked){
    if(bids.length>=(M.diff=="easy" && M.r()<0.5 ? 1 : MC.buys)) break;
    const w = mcWtp(p, c); if(w < c.price) break;
    const cap = c.kind==="pepite" ? (p.prof==="D" ? 10 : 6) : Math.round(c.price * (c.kind==="legend" ? 1.35 : 1.6));
    const share = {easy:0.35, normal:0.55, hard:0.75}[M.diff];
    const bid = Math.min(Math.round(w * (M.diff==="hard" ? 0.95 + M.r()*0.05 : 0.85 + M.r()*0.15)), cap, Math.max(c.price, Math.round(budget*share)), budget);
    if(bid < c.price) continue;
    bids.push([c.uid, bid]); budget -= bid;
  }
  return bids;
}
function mcPlace(p, c){
  if(mcFree(p, c.pos)){ p.team.push(c); return true; }
  if(p.bench.length < 3){ p.bench.push(c); return true; }
  return false;
}
function mcResolve(){
  const me = mcMe(), all = {};
  Object.entries(M.sel).forEach(([u, b]) => (all[u] ||= []).push([b, me]));
  M.players.filter(p => p.bot).forEach(p => mcBotBids(p).forEach(([u, b]) => (all[u] ||= []).push([b, p])));
  M.results = [];
  M.market.forEach(c => {
    const bl = (all[c.uid]||[]).sort((x,y) => y[0]-x[0] || x[1].score-y[1].score);
    if(!bl.length) return;
    let price, w = bl[0][1];
    if(bl.length===1) price = c.price;
    else { price = Math.max(c.price, Math.min(bl[0][0], bl[1][0] + MC.fee)); bl.slice(1).forEach(([, l]) => { l.money -= MC.fee; }); }
    if(w.money >= price && mcPlace(w, c)){ w.money -= price; M.won[c.uid] = w; c.age = 0; c.boughtAt = M.season;
      M.results.push({c, w, price, rivals:bl.slice(1).map(x => x[1].n)}); }
  });
  M.sel = {};
  M.phase = "results"; render(true);
}
/* rattrapage : du dernier au premier, 1 carte invendue au prix de base pour qui a moins de 2 achats */
function mcRattrapage(){
  const order = [...M.players].sort((a,b) => a.score-b.score);
  M.queue = order; M.qi = 0; mcRattStep();
}
function mcRattStep(){
  const left = M.market.filter(c => !M.won[c.uid]);
  while(M.qi < M.queue.length){
    const p = M.queue[M.qi];
    const nb = Object.values(M.won).filter(q => q===p).length;
    if(nb >= MC.buys || !left.length){ M.qi++; continue; }
    if(!p.bot){ M.phase = "ratt"; return render(true); }
    const best = [...left].sort((a,b) => (mcWtp(p,b)-b.price) - (mcWtp(p,a)-a.price))[0];
    if(best && mcWtp(p, best) >= best.price && p.money >= best.price && mcPlace(p, best)){
      p.money -= best.price; M.won[best.uid] = p; best.age = 0; best.boughtAt = M.season; mcLog(`${p.n} récupère ${best.n} au rattrapage (${best.price} M€).`);
      left.splice(left.indexOf(best), 1); }
    M.qi++;
  }
  mcStratsStart();
}
function mcRattBuy(u){
  const me = mcMe(), c = M.market.find(x => x.uid===u);
  if(c && !M.won[u] && me.money >= c.price && mcPlace(me, c)){ me.money -= c.price; M.won[u] = me; c.age = 0; c.boughtAt = M.season; mcLog(`Tu récupères ${c.n} au rattrapage (${c.price} M€).`, "me"); }
  else if(c) toast("Pas de place ou pas assez d'argent pour ce joueur.");
  M.qi++; mcRattStep();
}

/* ---------- ventes */
function mcSell(p, c, quiet){
  const inT = p.team.indexOf(c), inB = p.bench.indexOf(c);
  if(inT<0 && inB<0) return;
  if(inT>=0) p.team.splice(inT, 1); else p.bench.splice(inB, 1);
  let v;
  if(c.kind==="pepite"){ v = c.age>=3 ? MC.pepResale : 1; if(c.age>=3) p.pepSold++; }
  else v = Math.round(c.price * MC.sellRatio);
  p.money += v;
  if(!quiet || p.bot) mcLog(`${p.bot?p.n:"Tu"} ${p.bot?"vend":"vends"} ${c.n} pour ${v} M€.`, p.bot?"":"me");
}
function mcBench(u){ // passer un joueur du banc au terrain (ou l'inverse) si la place le permet
  const me = mcMe(), b = me.bench.find(c => c.uid===u), t = me.team.find(c => c.uid===u);
  if(b && mcFree(me, b.pos)){ me.bench.splice(me.bench.indexOf(b), 1); me.team.push(b); }
  else if(t && me.bench.length < 3){ me.team.splice(me.team.indexOf(t), 1); me.bench.push(t); }
  else toast("Pas de place pour ce déplacement.");
  render(true);
}

/* ---------- Phase 3 : stratagèmes, du dernier au premier */
function mcStratsStart(){
  M.queue = [...M.players].sort((a,b) => a.score-b.score); M.qi = 0; M.played = 0;
  mcStratStep();
}
function mcLeader(){ return mcRank()[0]; }
function mcStratStep(){
  while(M.qi < M.queue.length){
    const p = M.queue[M.qi];
    if(!p.bot){ M.phase = "strats"; return render(true); }
    const r = mcBotPlay(p); if(r==="wait") return;
    M.qi++;
  }
  mcBilan();
}
function mcBotPlay(p){
  const rate = {easy:0.25, normal:{A:1, B:0.35, C:0.55, D:0.45}[p.prof], hard:0.9}[M.diff];
  p._done = p._done || 0;
  for(const st of [...p.hand]){
    if(p._done >= MC.plays) break;
    if(M.r() > rate) continue;
    const rivals = M.players.filter(q => q!==p);
    const tgt = M.diff==="easy" ? rivals[Math.floor(M.r()*3)] : rivals.reduce((a,b) => b.score>a.score ? b : a);
    let action = null;
    if(st==="scandale"){ const c = tgt.team.filter(c => !M.susp.has(c.uid)).sort((a,b) => mcPP(b)-mcPP(a))[0]; if(c) action = {st, by:p, to:tgt, c}; }
    else if(st==="clause" && !p.clauseUsed){
      const cs = rivals.flatMap(q => q.team.map(c => ({q, c}))).filter(x => x.c.kind!=="pepite" && x.c.boughtAt!==M.season && x.c.price*MC.clauseMult <= p.money - 5 && mcFree(p, x.c.pos)).sort((a,b) => b.c.pp-a.c.pp);
      if(cs[0]) action = {st, by:p, to:cs[0].q, c:cs[0].c};
    }
    else if(st==="fpf" && M.season<MC.seasons && mcLeader()!==p) action = {st, by:p, to:mcLeader()};
    else if(st==="surench"){
      const cs = Object.entries(M.won).filter(([, q]) => q!==p).map(([u, q]) => ({q, c:mcRoster(q).find(c => c.uid===u)})).filter(x => x.c && x.c.locked!==M.season && x.c.price+MC.surench <= p.money && mcFree(p, x.c.pos)).sort((a,b) => mcPP(b.c)-mcPP(a.c));
      if(cs[0] && (cs[0].c.kind!=="pepite" || p.prof==="D")) action = {st, by:p, to:cs[0].q, c:cs[0].c};
    }
    if(!action) continue;
    p.hand.splice(p.hand.indexOf(st), 1); p._done++;
    // l'adversaire humain peut répondre avec son Contrat Blindé
    if(!action.to.bot && action.to.shield && st!=="surench"){ M.pending = action; M.phase = "react"; render(true); return "wait"; }
    if(action.to.bot && action.to.shield && ((st==="scandale" && mcPP(action.c)>=15) || (st==="clause" && action.c.kind==="legend") || (st==="fpf" && M.r()<0.3))){
      action.to.shield = false; mcLog(`${p.n} joue ${MC_STRATS[st].t}… ${MC_STRATS[st].p} ${action.to.n} dégaine son Contrat Blindé : coup annulé !`, "block"); continue; }
    mcApply(action);
  }
  p._done = 0;
}
function mcApply(a){
  const {st, by, to, c} = a, who = by.bot ? by.n : "Tu", mine = !by.bot;
  if(st==="scandale"){ M.susp.add(c.uid); to.scandalised = true; mcLog(`${who} ${mine?"joues":"joue"} Scandale de Presse sur ${c.n} (${to.bot?to.n:"chez toi"}). ${MC_STRATS.scandale.p}`, "hit"); }
  if(st==="clause"){ const cost = c.price*MC.clauseMult; by.money -= cost; to.money += cost; to.team.splice(to.team.indexOf(c), 1); by.team.push(c); by.clauseUsed = true;
    mcLog(`${who} ${mine?"actives":"active"} la Clause Libératoire de ${c.n} (${cost} M€ versés à ${to.bot?to.n:"toi"}). ${MC_STRATS.clause.p}`, "hit"); }
  if(st==="fpf"){ const loss = Math.round(to.money*MC.fpf); to.money -= loss; mcLog(`${who} ${mine?"déclenches":"déclenche"} un Audit FPF : ${to.bot?to.n:"tu"} ${to.bot?"perd":"perds"} ${loss} M€. ${MC_STRATS.fpf.p}`, "hit"); }
  if(st==="surench"){ const cost = c.price+MC.surench; by.money -= cost; to.money += c.price;
    const inT = to.team.indexOf(c); if(inT>=0) to.team.splice(inT, 1); else to.bench.splice(to.bench.indexOf(c), 1);
    if(!mcPlace(by, c)) by.team.push(c); M.won[c.uid] = by; c.locked = M.season;
    mcLog(`${who} ${mine?"chipes":"chipe"} ${c.n} à ${to.bot?to.n:"toi"} sur le fil (${cost} M€). ${MC_STRATS.surench.p}`, "hit"); }
}
function mcReact(useShield){
  const a = M.pending; M.pending = null; const me = mcMe();
  if(useShield){ me.shield = false; mcLog(`${a.by.n} joue ${MC_STRATS[a.st].t}… ${MC_STRATS[a.st].p} Tu dégaines ton Contrat Blindé : coup annulé !`, "block"); }
  else mcApply(a);
  // l'ordinateur reprend où il en était
  const p = a.by; const r = mcBotPlay(p); if(r==="wait") return;
  M.qi++; mcStratStep();
}
/* stratagèmes du joueur humain : on choisit une carte, puis une cible */
function mcPlayStrat(st, target){
  const me = mcMe();
  if(M.played >= MC.plays || !me.hand.includes(st)) return;
  let a = null;
  if(st==="fpf"){ const l = mcLeader(); if(M.season===MC.seasons) return toast("Audit FPF interdit en Saison 6."); if(l===me) return toast("Tu es 1er : l'audit tomberait sur toi !"); a = {st, by:me, to:l}; }
  else {
    if(!target){ M.choose = st; return render(true); }
    const [pi, u] = target.split(":"), to = M.players[+pi], c = mcRoster(to).find(x => x.uid===u);
    if(!c) return;
    if(st==="clause"){ if(me.clauseUsed) return toast("Clause déjà utilisée."); if(c.boughtAt===M.season) return toast("Interdit sur un joueur acheté cette saison."); if(me.money < c.price*2) return toast("Pas assez d'argent."); if(!mcFree(me, c.pos)) return toast(`Plus de place au poste ${MC_POS_FR[c.pos]}.`); }
    if(st==="surench"){ if(me.money < c.price+MC.surench) return toast("Pas assez d'argent."); }
    a = {st, by:me, to, c};
  }
  me.hand.splice(me.hand.indexOf(st), 1); M.played++; M.choose = null;
  if(a.to.bot && a.to.shield && M.r() < (M.diff==="easy" ? 0.3 : 0.6) && st!=="surench"){ a.to.shield = false; mcLog(`Tu joues ${MC_STRATS[st].t}… ${MC_STRATS[st].p} ${a.to.n} dégaine son Contrat Blindé : coup annulé !`, "block"); }
  else mcApply(a);
  render(true);
}
function mcStratDone(){ M.choose = null; M.qi++; mcStratStep(); }

/* ---------- Phase 4 : bilan */
function mcScore(p){
  const ev = M.events[M.season-1];
  let alive = p.team.filter(c => !M.susp.has(c.uid)), injured = null;
  if(ev==="blessures" && alive.length){ injured = alive.reduce((a,b) => mcPP(b)>mcPP(a) ? b : a); alive = alive.filter(c => c!==injured); }
  let base = alive.reduce((s,c) => s + mcPP(c), 0);
  if(ev==="jeunesse") base += alive.filter(c => c.kind==="pepite").length*2;
  const combos = [];
  ["DEF","MIL","ATT"].forEach(sec => {
    if(p.team.some(c => MC_SECTOR[c.pos]===sec && M.susp.has(c.uid))) return;
    const g = alive.filter(c => MC_SECTOR[c.pos]===sec); let best = null;
    const club = Object.entries(mcCount(g.map(c => c.club))).find(([, n]) => n>=3);
    if(club) best = {t:`Trio ${club[0]}`, v:MC.comboClub*(ev==="derby"?2:1)};
    const lg = Object.entries(mcCount(g.filter(c => c.lg!=="pl").map(c => c.lg))).find(([, n]) => n>=3);
    if(lg){ const v = MC.comboLeague*(ev==="europe"?2:1); if(!best || v>best.v) best = {t:`Trio ${LG_AB[lg[0]]||lg[0]}`, v}; }
    if(sec==="ATT" && !best && g.length>=2 && (new Set(g.map(c => c.lg)).size < g.length || new Set(g.map(c => c.club)).size < g.length)) best = {t:"Duo d'attaque", v:MC.duo};
    if(best){ if(g.some(c => c.kind==="legend")){ best.v = Math.round(best.v*MC.legendMult); best.t += " ×1,5"; } combos.push({sec, ...best}); }
  });
  return {base, combos, total: base + combos.reduce((s,x) => s+x.v, 0), injured};
}
function mcBilan(){
  const ev = M.events[M.season-1];
  M.season_scores = M.players.map(p => { const s = mcScore(p); p.score += s.total; p.hist.push(s.total); return s; });
  const rk = mcRank();
  rk.forEach((p, k) => { p.money += Math.round(MC.prize[k+1] * (ev==="crise" ? 0.5 : 1)); });
  M.phase = "bilan"; render(true);
}
function mcNext(){
  if(M.season < MC.seasons){ M.season++; mcSeasonStart(); return; }
  // fin : objectifs secrets + bilan comptable
  M.players.forEach(p => { p.secretOk = !!(p.secret && MC_SECRETS[p.secret].ok(p)); p.bonusSecret = p.secretOk ? MC.secret : 0; p.bonusMoney = Math.floor(p.money/MC.moneyPP); p.final = p.score + p.bonusSecret + p.bonusMoney; });
  M.final = [...M.players].sort((a,b) => b.final-a.final || b.money-a.money);
  const rank = M.final.indexOf(mcMe()) + 1, won = rank===1;
  const r = {mode:"mercato", diff:M.diff, solo:true, score:(5-rank)*2 + (M.diff==="hard"?2:M.diff==="normal"?1:0), total:null, won, found:[], pepites:[]};
  L.summary = Object.assign(recordGame(r), {r, coins:null, bonus:null});
  if(won) setTimeout(() => celebrate("gold"), 300);
  (async () => { const s = L.summary, coins = await rewardGame(r.score, won); s.ref = LAST_REF; if(L.summary!==s) return; s.coins = coins; render(true); })();
  M.phase = "end"; render(true);
}

/* ======================================================================
   ÉCRANS
   ====================================================================== */
function mcCardHTML(c, {sel=false, act="", v="", extra="", note=""}={}){
  const tag = c.kind==="pepite" ? `<span class="newtag">Pépite</span>` : "";
  const pp = c.kind==="pepite" ? `${mcPP(c) || 3} PP${c.age>=3?" · max":""}` : `${c.pp} PP`;
  return `<button class="mc-card${sel?" sel":""}" ${act?`data-act="${act}" data-v="${esc(v)}"`:"disabled"}>${cardHTML(c.id,{small:true, tag})}
    <span class="mc-info"><b>${c.price} M€</b><span>${pp}</span></span>${note?`<span class="mc-note">${note}</span>`:""}${extra}</button>`;
}
function mcStand(){
  const rk = mcRank();
  return `<div class="mc-stand">${M.players.map(p => `<div class="mc-p${p.bot?"":" me"}"><span class="rk">${rk.indexOf(p)+1}</span><b>${esc(p.bot?p.n:"Toi")}</b><small>${p.score} PP · ${p.money} M€</small></div>`).join("")}</div>`;
}
function mcHead(){
  const ev = M.events[M.season-1], nx = M.events[M.season];
  return `<div class="bar" style="justify-content:flex-start"><button class="iconbtn" data-act="quit" aria-label="Quitter">${ICON.back}</button><h2 style="flex:1">Saison ${M.season}/6</h2><span class="chip">${ICON.coin} ${mcMe().money} M€</span></div>
   <div class="mc-ev"><span><small>Cette saison</small><b>${MC_EVENTS[ev].t}</b>${esc(MC_EVENTS[ev].d)}</span>${nx?`<span class="nx"><small>Saison suivante</small><b>${MC_EVENTS[nx].t}</b></span>`:""}</div>
   ${mcStand()}`;
}
function mcSquad(open){
  const me = mcMe(), sellable = ["mercato","ratt"].includes(M.phase);
  const row = (c, bench) => `<div class="mc-row${M.susp.has(c.uid)?" susp":""}"><span class="pos">${c.pos}</span><b>${esc(c.n)}</b><small>${esc(c.club)} · ${mcPP(c)} PP${c.kind==="legend"?" · Légende":c.kind==="pepite"?` · Pépite (S${c.age})`:""}</small>
    <span class="acts">${sellable?`<button data-act="mcmove" data-v="${c.uid}">${bench?"↑ Terrain":"↓ Banc"}</button><button data-act="mcsell" data-v="${c.uid}">${c.kind==="pepite"?(c.age>=3?`Revendre ${MC.pepResale} M€`:"Libérer"):`Vendre ${Math.round(c.price*MC.sellRatio)} M€`}</button>`:""}</span></div>`;
  return `<details class="mc-squad"${open?" open":""}><summary>Mon effectif · ${me.team.length}/11 sur le terrain · banc ${me.bench.length}/3</summary>
    ${["G","DEF","MIL","ATT"].map(pos => `<div class="mc-line"><small>${MC_POS_FR[pos]} (${me.team.filter(c => c.pos===pos).length}/${MC_SLOTS[pos]})</small>${me.team.filter(c => c.pos===pos).map(c => row(c,false)).join("")}</div>`).join("")}
    ${me.bench.length?`<div class="mc-line"><small>Banc</small>${me.bench.map(c => row(c,true)).join("")}</div>`:""}
    <p class="hint">Combos (1 par secteur) : 3 du même club +10 · 3 du même championnat étranger +8 · duo d'attaque +6 · ×1,5 avec une Légende dans le secteur.</p></details>`;
}
function mcLogHTML(n=6){ const l = M.log.filter(x => x.s===M.season).slice(-n); return l.length ? `<div class="mc-log">${l.map(x => `<p class="${x.cls}">${esc(x.t)}</p>`).join("")}</div>` : ""; }

function screenMercatoPick(){
  const b = PROFILE.best;
  return {key:"mercatoPick", html:`
  <div class="subhead"><button class="iconbtn" data-act="nav" data-v="home" aria-label="Retour">${ICON.back}</button><h1>Mercato FC</h1></div>
  <p class="muted" style="margin:0 0 12px">Tu es directeur sportif. 6 saisons pour bâtir la meilleure équipe face à 3 présidents : enchères à l'aveugle, combos de club et coups bas en conférence de presse.</p>
  <div class="pick-list">${Object.entries(MC_DIFF).map(([k,d]) => `<button class="mode diff-${k==="normal"?"normal":k}" data-act="mcstart" data-v="${k}"><span class="lgtag">${d.t}</span><b>${k==="easy"?"Vestiaire tranquille":k==="normal"?"Vrai mercato":"Fosse aux requins"}</b><small>${d.d}</small>${b["mercato_"+k]?`<span class="rec">Victoires : ${b["mercato_"+k]}</span>`:""}</button>`).join("")}</div>
  <div class="card" style="margin-top:14px;font-size:14px"><b>Les règles en 30 secondes</b>
   <ul style="margin:8px 0 0;padding-left:18px;line-height:1.5">
    <li>Chaque saison, 6 joueurs au marché : tu poses jusqu'à 2 offres cachées. Seul sur un joueur, tu paies son prix. En conflit, le plus offrant paie la 2ᵉ offre + 1 M€.</li>
    <li>Ton équipe marque des points chaque saison : PP des joueurs + combos par secteur.</li>
    <li>Coups bas : Scandale, Clause, Audit FPF, Surenchère. Ton Contrat Blindé annule une attaque, une seule fois.</li>
    <li>À la fin : objectif secret (+15) et 1 PP par tranche de 2 M€ en caisse.</li></ul></div>
  ${tabbar()}`};
}
function screenMercato(){
  if(!M){ VIEW = "mercatoPick"; return screenMercatoPick(); }
  const me = mcMe();
  if(M.phase==="intro") return {key:"mc-intro", html:`
    <div class="hero"><span class="eyebrow">Mercato FC · ${MC_DIFF[M.diff].t}</span><h1 class="display" style="font-size:clamp(30px,9vw,44px)">Choisis ton <span>objectif secret</span></h1><p>Gardé caché jusqu'à la fin : +15 PP s'il est rempli.</p></div>
    <div class="pick-list">${M.secretChoice.map(k => `<button class="mode" data-act="mcsecret" data-v="${k}"><b>${MC_SECRETS[k].t}</b><small>${MC_SECRETS[k].d}</small></button>`).join("")}</div>
    <div class="card" style="margin-top:14px"><b>Tes adversaires</b>${M.players.slice(1).map(p => `<p style="margin:6px 0 0">${esc(p.n)} <small class="muted" style="color:var(--ink-soft)">· ${MC_BOTS.find(b => b.prof===p.prof).d}</small></p>`).join("")}</div>`};
  if(M.phase==="mercato"){
    const used = Object.values(M.sel).reduce((a,b) => a+b, 0);
    return {key:"mc-m"+M.season+JSON.stringify(M.sel)+me.money+mcRoster(me).length, html:`${mcHead()}
     <div class="sec-title"><h2>Le marché</h2><small>${Object.keys(M.sel).length}/2 offres · ${me.money-used} M€ libres</small></div>
     <div class="mc-market">${M.market.map(c => { const b = M.sel[c.uid];
       return `<div class="mc-slot">${mcCardHTML(c, {sel:b!=null, act:"mcpick", v:c.uid})}${b!=null?`<div class="mc-bid"><button data-act="mcbid" data-v="${c.uid}:-1">−</button><b>${b} M€</b><button data-act="mcbid" data-v="${c.uid}:1">+</button></div>`:""}</div>`; }).join("")}</div>
     <p class="solo-note">Touche un joueur pour faire une offre, puis règle ton prix. Les présidents misent en même temps, à l'aveugle.</p>
     ${mcSquad(false)}${mcLogHTML()}
     ${dock(`<button class="btn" data-act="mcresolve">${Object.keys(M.sel).length?`Envoyer mes ${Object.keys(M.sel).length>1?"2 offres":"offre"}`:"Ne rien acheter cette saison"}</button>`)}`};
  }
  if(M.phase==="results") return {key:"mc-r"+M.season, html:`${mcHead()}
     <div class="sec-title"><h2>Résultats du mercato</h2></div>
     <div class="mc-results">${M.results.length?M.results.map(x => `<div class="mc-res${x.w===me?" me":""}"><b>${esc(x.c.n)}</b><span>→ ${esc(x.w.bot?x.w.n:"Toi")} · ${x.price} M€${x.rivals.length?` <small>(battu : ${x.rivals.map(esc).join(", ")})</small>`:""}</span></div>`).join(""):`<div class="empty">Personne n'a acheté.</div>`}</div>
     ${dock(`<button class="btn" data-act="mcratt">Continuer</button>`)}`};
  if(M.phase==="ratt"){ const left = M.market.filter(c => !M.won[c.uid]);
    return {key:"mc-ratt"+M.season+me.money, html:`${mcHead()}
     <div class="sec-title"><h2>Rattrapage</h2><small>1 joueur invendu au prix de base</small></div>
     <div class="mc-market">${left.map(c => `<div class="mc-slot">${mcCardHTML(c, {act:me.money>=c.price?"mcrattbuy":"", v:c.uid, note:me.money>=c.price?"Acheter":"Trop cher"})}</div>`).join("")}</div>
     ${mcSquad(false)}
     ${dock(`<button class="btn ghost" data-act="mcrattpass">Passer</button>`)}`}; }
  if(M.phase==="react"){ const a = M.pending;
    return {key:"mc-react"+M.season+a.st, html:`${mcHead()}
     <div class="mc-alert"><small>Coup bas de ${esc(a.by.n)}</small><b>${MC_STRATS[a.st].t}</b><p>${a.c?`Cible : ${esc(a.c.n)}`:"Cible : ta trésorerie"}</p><p class="punch">${MC_STRATS[a.st].p}</p></div>
     ${dock(`<button class="btn item-btn" data-act="mcreact" data-v="1">${ICON.lock} Contrat Blindé : j'annule !</button><button class="btn ghost" data-act="mcreact" data-v="0">Je laisse passer (je le garde)</button>`)}`}; }
  if(M.phase==="strats"){
    const ch = M.choose;
    let targets = "";
    if(ch){ const list = M.players.flatMap((p, pi) => p===me ? [] : (ch==="surench" ? Object.entries(M.won).filter(([, q]) => q===p).map(([u]) => mcRoster(p).find(c => c.uid===u)).filter(c => c && c.locked!==M.season) : p.team.filter(c => ch!=="clause" || c.kind!=="pepite")).map(c => ({p, pi, c})));
      targets = `<div class="sec-title"><h2>${MC_STRATS[ch].t} : choisis la cible</h2><button class="linkbtn" data-act="mcstratcancel">Annuler</button></div>
       <div class="mc-results">${list.length?list.sort((a,b) => mcPP(b.c)-mcPP(a.c)).map(x => `<button class="mc-res tgt" data-act="mcstrattgt" data-v="${ch}|${x.pi}:${x.c.uid}"><b>${esc(x.c.n)}</b><span>${esc(x.p.n)} · ${mcPP(x.c)} PP${ch==="clause"?` · ${x.c.price*2} M€`:ch==="surench"?` · ${x.c.price+5} M€`:""}</span></button>`).join(""):`<div class="empty">Aucune cible possible.</div>`}</div>`; }
    return {key:"mc-s"+M.season+M.played+me.hand.join()+ch+M.log.length, html:`${mcHead()}
     <div class="sec-title"><h2>Coups bas</h2><small>${MC.plays-M.played} restant${MC.plays-M.played>1?"s":""} · Contrat Blindé ${me.shield?"disponible":"utilisé"}</small></div>
     ${mcLogHTML(8)}
     ${targets || `<div class="mc-hand">${me.hand.length?me.hand.map(st => `<button class="mc-strat s-${st}" data-act="mcstrat" data-v="${st}" ${M.played>=MC.plays?"disabled":""}><b>${MC_STRATS[st].t}</b><small>${MC_STRATS[st].d}</small><i>${MC_STRATS[st].p}</i></button>`).join(""):`<div class="empty">Pas de carte en main cette saison.</div>`}</div>`}
     ${dock(`<button class="btn" data-act="mcstratdone">Passer au bilan de la saison</button>`)}`};
  }
  if(M.phase==="bilan"){ const s = M.season_scores[0];
    return {key:"mc-b"+M.season, html:`${mcHead()}
     <div class="sec-title"><h2>Bilan de la saison ${M.season}</h2></div>
     <div class="card mc-bilan"><div class="ln"><span>Joueurs sur le terrain</span><b>${s.base} PP</b></div>
      ${s.combos.map(x => `<div class="ln combo"><span>${esc(x.t)} (${x.sec==="DEF"?"défense":x.sec==="MIL"?"milieu":"attaque"})</span><b>+${x.v}</b></div>`).join("")}
      ${s.injured?`<div class="ln"><span>Blessé : ${esc(s.injured.n)}</span><b>—</b></div>`:""}
      <div class="ln tot"><span>Total de la saison</span><b>${s.total} PP</b></div></div>
     <div class="mc-results">${M.players.map((p,k) => `<div class="mc-res${p.bot?"":" me"}"><b>${esc(p.bot?p.n:"Toi")}</b><span>+${M.season_scores[k].total} PP cette saison · total ${p.score}</span></div>`).join("")}</div>
     ${mcLogHTML(8)}
     ${dock(`<button class="btn" data-act="mcnext">${M.season<MC.seasons?`Saison ${M.season+1}`:"Décompte final"}</button>`)}`};
  }
  if(M.phase==="end"){ const meRank = M.final.indexOf(me)+1;
    return {key:"mc-end"+(L.summary&&L.summary.coins), html:`<div class="stack">
     <div class="hero"><span class="eyebrow">Mercato FC · ${MC_DIFF[M.diff].t}</span><h1 class="display" style="font-size:clamp(34px,10vw,50px)">${meRank===1?`Meilleur <span>directeur sportif</span>`:`${meRank}${meRank===2?"ᵉ":"ᵉ"} <span>sur 4</span>`}</h1></div>
     <div class="podium">${M.final.map((p,k) => `<div class="pod${k===0?" first":""}"><span class="rk">${k+1}</span><span><b>${esc(p.bot?p.n:"Toi")}</b><small>${p.score} PP · objectif ${p.secretOk?`+${MC.secret}`:"raté"} (${esc(MC_SECRETS[p.secret]?.t||"")}) · caisse +${p.bonusMoney}</small></span><span class="sc">${p.final}</span></div>`).join("")}</div>
     ${summaryBlock()}</div>
     ${dock(`<button class="btn" data-act="mcstart" data-v="${M.diff}">Rejouer</button><button class="btn ghost" data-act="nav" data-v="mercatoPick">Changer de difficulté</button>`)}`};
  }
  return {key:"mc-x", html:""};
}

/* ---------- actions (appelées depuis app.js) */
function mcAct(a, v){
  const me = M && mcMe();
  switch(a){
    case "mcstart": startMercato(v); break;
    case "mcsecret": me.secret = v; mcSeasonStart(); break;
    case "mcpick": {
      if(M.sel[v]!=null){ delete M.sel[v]; return render(true); }
      if(Object.keys(M.sel).length >= MC.buys) return toast("2 offres maximum par saison.");
      const c = M.market.find(x => x.uid===v), used = Object.values(M.sel).reduce((x,y) => x+y, 0);
      if(me.money - used < c.price) return toast("Pas assez d'argent pour ce prix de base.");
      M.sel[v] = c.price; render(true); break; }
    case "mcbid": {
      const [u, d] = v.split(":"), c = M.market.find(x => x.uid===u), used = Object.values(M.sel).reduce((x,y) => x+y, 0);
      const nb = M.sel[u] + (+d);
      if(nb < c.price) return; if(+d>0 && used + 1 > me.money) return toast("Tu n'as pas plus d'argent.");
      M.sel[u] = nb; render(true); break; }
    case "mcresolve": mcResolve(); break;
    case "mcratt": mcRattrapage(); break;
    case "mcrattbuy": mcRattBuy(v); break;
    case "mcrattpass": M.qi++; mcRattStep(); break;
    case "mcsell": { const c = mcRoster(me).find(x => x.uid===v); if(c){ mcSell(me, c); render(true); } break; }
    case "mcmove": mcBench(v); break;
    case "mcstrat": mcPlayStrat(v); break;
    case "mcstrattgt": { const [st, t] = v.split("|"); mcPlayStrat(st, t); break; }
    case "mcstratcancel": M.choose = null; render(true); break;
    case "mcstratdone": mcStratDone(); break;
    case "mcreact": mcReact(v==="1"); break;
    case "mcnext": mcNext(); break;
  }
}
