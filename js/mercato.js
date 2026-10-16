/* Football Legends — MERCATO FC v4 « table de jeu », en solo contre 3 présidents ordinateurs.
   Équipe à 5 (1 gardien + 4 joueurs de champ) et 2 remplaçants.
   Chaque saison : Pioche → Mercato à l'aveugle → Coups (bonus, coups bas, pactes, trahisons) → Match.
   Tout se joue sur l'appareil ; la fin de partie rapporte XP et pièces comme les autres modes. */
"use strict";

const MC = {
  seasons:6, budget:50, buys:2, market:6, handMax:4, plays:2, draw:2, bench:2,
  prize:{1:5, 2:8, 3:10, 4:12}, trio:10, duo:4, league:8, legendMult:1.5,
  pepCurve:[3,6,9], pepResale:15, sellRatio:0.5, secret:15, fee:1, moneyPP:2, pactPP:4, pactLen:2
};
const MC_SLOTS = {G:1, F:4};
const mcSlot = c => c.pos==="G" ? "G" : "F";
const MC_POS = {GK:"G", DEF:"DEF", MID:"MIL", ATT:"ATT"};
const MC_POS_FR = {G:"Gardien", DEF:"Défenseur", MIL:"Milieu", ATT:"Attaquant"};
const MC_DIFF = {
  easy:{t:"Facile", b:"Vestiaire tranquille", d:"Présidents amateurs"},
  normal:{t:"Moyen", b:"Vrai mercato", d:"Chacun sa stratégie"},
  hard:{t:"Difficile", b:"Fosse aux requins", d:"Ils calculent et visent le leader"}
};
const MC_BOTS = [
  {prof:"A", n:"Le Requin", s:"Requin", ic:"🦈"},
  {prof:"B", n:"Le Comptable", s:"Comptable", ic:"🧮"},
  {prof:"C", n:"Le Professeur", s:"Prof", ic:"🎓"},
  {prof:"D", n:"Le Dénicheur", s:"Dénicheur", ic:"🔍"}
];
const MC_EVENTS = {
  calme:{ic:"☀️", t:"Mercato calme", d:"Aucun effet."},
  inflation:{ic:"📈", t:"Inflation", d:"−2 M€ de salaires par titulaire."},
  europe:{ic:"🌍", t:"Coupe d'Europe", d:"Combos championnat étranger ×2."},
  derby:{ic:"⚔️", t:"Derby", d:"Combos de club ×2."},
  crise:{ic:"📉", t:"Crise", d:"Primes de fin de saison ÷2."},
  fou:{ic:"🌀", t:"Mercato fou", d:"8 joueurs au marché."},
  blessures:{ic:"🚑", t:"Blessures", d:"Ton meilleur joueur rate le match."},
  jeunesse:{ic:"🌱", t:"Jeunesse", d:"+3 PP par Pépite titulaire."}
};
const MC_EV_POOL = ["calme","calme","inflation","europe","derby","crise","fou","blessures","jeunesse"];

/* la pioche : bonus (pour toi), coups bas (sur un adversaire), pactes et trahisons */
const MC_CARDS = {
  prime:    {ic:"🏅", t:"Prime de match",   k:"bonus", tg:"self", d:"+6 PP à ce match."},
  sponsor:  {ic:"💶", t:"Sponsor",          k:"bonus", tg:"self", d:"+8 M€ tout de suite."},
  formation:{ic:"🌱", t:"Centre de formation", k:"bonus", tg:"self", d:"Une Pépite gratuite rejoint ton club."},
  blinde:   {ic:"🛡️", t:"Contrat Blindé",   k:"bonus", tg:"self", d:"+1 bouclier : annule un coup bas."},
  scandale: {ic:"📸", t:"Scandale",         k:"bas", tg:"seat", pick:true, d:"Tu choisis un de ses titulaires : suspendu pour ce match.", p:"« Je n'ai rien contre lui, j'ai juste des photos. »"},
  clause:   {ic:"💼", t:"Clause libératoire", k:"bas", tg:"seat", pick:true, d:"Tu choisis un de ses joueurs et tu le rachètes 2× son prix (l'argent va à lui).", p:"« Tout a un prix. Même la loyauté. »"},
  piston:   {ic:"⚡", t:"Signature à 23h59", k:"bas", tg:"seat", pick:true, d:"Tu lui chipes une recrue de cette saison (prix + 5 M€, il est remboursé).", p:"« Désolé, il a signé chez nous à 23h59. »"},
  fpf:      {ic:"🧾", t:"Audit FPF",        k:"bas", tg:"seat", d:"Il perd 20 % de sa trésorerie.", p:"« Les comptes ne mentent jamais… les présidents, si. »"},
  greve:    {ic:"📢", t:"Grève des supporters", k:"bas", tg:"seat", d:"−6 PP pour lui à ce match.", p:"« Le peuple a parlé. »"},
  pacte:    {ic:"🤝", t:"Pacte",            k:"pacte", tg:"seat", d:"Alliance 2 saisons : +4 PP chacun par match, pas d'attaque entre vous.", p:"« Ensemble, on est plus forts. »"},
  trahison: {ic:"🗡️", t:"Trahison",         k:"pacte", tg:"ally", d:"Romps ton pacte : tu lui voles 8 M€ et il perd 5 PP.", p:"« Rien de personnel. C'est le business. »"}
};
const MC_PDECK = {prime:5, sponsor:4, formation:3, blinde:2, scandale:5, clause:3, piston:4, fpf:3, greve:4, pacte:4, trahison:3};
const MC_SECRETS = {
  club3:{ic:"🏟️", t:"Esprit de clocher", d:"3 titulaires du même club.", ok:p => Math.max(0, ...Object.values(mcCount(p.team.map(c => c.club)))) >= 3},
  legend2:{ic:"🌟", t:"Galáctico", d:"Posséder 2 Légendes.", ok:p => mcRoster(p).filter(c => c.kind==="legend").length >= 2},
  pep2:{ic:"🌱", t:"Formateur", d:"Revendre 2 Pépites au prix fort.", ok:p => p.pepSold >= 2},
  rich:{ic:"💰", t:"Trésorier", d:"Finir avec 40 M€ ou plus.", ok:p => p.money >= 40},
  clean:{ic:"😇", t:"Casier vierge", d:"Ne jamais subir de coup bas.", ok:p => !p.hit},
  full:{ic:"📋", t:"Effectif complet", d:"Finir avec 5 titulaires et 2 remplaçants.", ok:p => mcRoster(p).length >= 7},
  traitor:{ic:"🗡️", t:"Agent double", d:"Trahir un allié au moins une fois.", ok:p => p.betrayed >= 1}
};

/* ---------- petits outils */
function mcCount(arr){ const o = {}; arr.forEach(x => o[x] = (o[x]||0)+1); return o; }
function mcShuffle(a, r){ for(let k=a.length-1;k>0;k--){ const j = Math.floor(r()*(k+1)); [a[k],a[j]] = [a[j],a[k]]; } return a; }
const mcRoster = p => [...p.team, ...p.bench];
const mcFree = (p, c) => p.team.filter(o => mcSlot(o)===mcSlot(c)).length < MC_SLOTS[mcSlot(c)];
const mcPP = c => c.kind==="pepite" ? MC.pepCurve[Math.min(Math.max(c.age,1),3)-1] || 0 : c.pp;
const mcMe = () => M.players[0];
const mcIdx = p => M.players.indexOf(p);
const mcName = p => p.bot ? p.n : "Toi";
const mcShort = p => p.bot ? MC_BOTS.find(x => x.prof===p.prof).s : "Toi";
let M = null;

/* ---------- paquets */
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
  pick(com.filter(c => !used.has(c.id)), 30).forEach(c => out.push(mk(c, "pepite")));
  return mcShuffle(out, r);
}
function mcPdeck(r){ return mcShuffle(Object.entries(MC_PDECK).flatMap(([k, n]) => Array(n).fill(k)), r); }
function mcDraw(p, n){ for(let k=0;k<n;k++){ if(!M.pdeck.length) M.pdeck = mcPdeck(M.r); p.hand.push(M.pdeck.pop()); } while(p.hand.length > MC.handMax) p.hand.shift(); }

/* ---------- démarrage */
function startMercato(diff){
  leaveGame(false, true);
  const r = rng(Date.now() % 1e9);
  const bots = mcShuffle([...MC_BOTS], r).slice(0, 3);
  const mkP = (n, ic, prof, bot) => ({n, ic, prof, bot, money:MC.budget, team:[], bench:[], hand:[], shield:1, score:0, last:0, secret:null, pepSold:0, hit:false, betrayed:0, mod:0, mods:[]});
  M = {diff, r, v:0, season:1, deck:mcDeck(r), pdeck:mcPdeck(r), events:Array.from({length:MC.seasons}, () => MC_EV_POOL[Math.floor(r()*MC_EV_POOL.length)]),
       players:[mkP(PROFILE.name || "Toi", "⭐", "me", false), ...bots.map(b => mkP(b.n, b.ic, b.prof, true))],
       phase:(PROFILE.best.mercatoTuto ? "secret" : "tuto"), tuto:0, market:[], won:{}, susp:new Set(), sel:{}, results:[], pacts:[], bub:{}, show:[], si:0, flash:null, sheet:null, aim:null, played:0, fx:null};
  const keys = Object.keys(MC_SECRETS);
  M.players.forEach((p, k) => { mcDraw(p, 2); const two = mcShuffle([...keys], r).slice(0, 2); if(k===0) M.secretChoice = two; else p.secret = two[0]; });
  VIEW = "mercato"; mcR();
}
function mcR(fx){ M.v++; M.fx = fx || null; render(true); M.fx = null; }
function mcRank(){ return [...M.players].sort((a,b) => b.score-a.score || b.money-a.money); }
function mcSay(p, t, cls=""){ M.bub[mcIdx(p)] = {t, cls}; }

/* ---------- pactes */
const mcAllied = (a, b) => M.pacts.some(x => (x.a===a && x.b===b) || (x.a===b && x.b===a));
const mcAllies = p => M.pacts.filter(x => x.a===p || x.b===p).map(x => x.a===p ? x.b : x.a);
function mcBreak(a, b){ M.pacts = M.pacts.filter(x => !((x.a===a && x.b===b) || (x.a===b && x.b===a))); }

/* ---------- effectif : placement automatique (le meilleur joue) */
function mcLineup(p){
  ["G","F"].forEach(sl => {
    const all = mcRoster(p).filter(c => mcSlot(c)===sl).sort((a,b) => mcPP(b)-mcPP(a) || (b.kind==="legend")-(a.kind==="legend"));
    const starters = all.slice(0, MC_SLOTS[sl]);
    p.team = p.team.filter(c => mcSlot(c)!==sl).concat(starters);
    p.bench = p.bench.filter(c => mcSlot(c)!==sl).concat(all.slice(MC_SLOTS[sl]));
  });
  // banc plein : on vend le moins utile
  const notes = [];
  while(p.bench.length > MC.bench){ const w = [...p.bench].sort((a,b) => mcPP(a)-mcPP(b) || mcSellValue(a)-mcSellValue(b))[0]; const v = mcSell(p, w); notes.push(`${cardName(w.n)} vendu ${v} M€`); }
  return notes;
}
function mcPlace(p, c){ p.bench.push(c); return mcLineup(p); }

/* ---------- saison : pioche */
function mcSeasonStart(){
  const ev = M.events[M.season-1];
  M.susp = new Set(); M.won = {}; M.sel = {}; M.results = []; M.played = 0; M.bub = {}; M.show = []; M.si = 0; M.flash = null; M.aim = null; M.sheet = null;
  M.pacts = M.pacts.filter(x => x.until >= M.season);
  M.players.forEach(p => {
    p.mod = 0; p.mods = [];
    if(ev==="inflation") p.money = Math.max(0, p.money - 2*p.team.length);
    mcRoster(p).forEach(c => { if(c.kind==="pepite") c.age++; });
    if(p.bot){ mcDraw(p, MC.draw); mcRoster(p).filter(c => c.kind==="pepite" && c.age>=4 && (p.prof==="D" || p.money < 15)).forEach(c => mcSell(p, c)); mcLineup(p); }
    else mcLineup(p);
  });
  const n = MC.market + (ev==="fou" ? 2 : 0);
  M.market = M.deck.splice(0, n);
  if(!M.market.some(c => c.kind==="legend")){ const i = M.deck.findIndex(c => c.kind==="legend"); if(i>=0) M.market[M.market.length-1] = M.deck.splice(i, 1)[0]; }
  M.drawn = null; M.phase = "draw"; mcR();
}
function mcDrawMine(){ const me = mcMe(); mcDraw(me, MC.draw); M.drawn = me.hand.slice(-MC.draw); mcR("draw"); }

/* ---------- valeur pour un ordinateur (M€ qu'il est prêt à payer) */
function mcWtp(p, c){
  const left = MC.seasons - M.season + 1, hard = M.diff==="hard", easy = M.diff==="easy";
  let pp = c.kind==="pepite" ? [3,6,9,9,9,9].slice(0, left).reduce((a,b) => a+b, 0) + (left>3 ? MC.pepResale/0.35*0.5 : 0) : c.pp*left;
  const own = p.team;
  const syn = (own.filter(o => o.club===c.club).length*4 + own.filter(o => o.lg===c.lg && c.lg!=="pl").length*3) * left;
  pp += syn * (p.prof==="C" || hard ? 1 : 0.3);
  let m = 1;
  if(p.prof==="B") m = c.kind==="legend" ? 1.35 : (M.season < 5 ? 0.4 : 0.8);
  if(p.prof==="D") m = c.kind==="pepite" ? 1.5 : (c.kind==="legend" && p.money>35 ? 1.1 : 0.6);
  if(!mcFree(p, c)){ // titulaires au complet : ne vaut que le gain sur le plus faible
    const weak = p.team.filter(o => mcSlot(o)===mcSlot(c)).sort((a,b) => mcPP(a)-mcPP(b))[0];
    const gain = (c.kind==="pepite" ? 6 : c.pp) - mcPP(weak);
    m *= gain > 0 ? Math.min(1, 0.3 + gain/8) : (c.kind==="pepite" && p.bench.length < MC.bench ? 0.5 : 0.1);
  }
  let v = pp * ({easy:0.25, normal:0.45, hard:0.75}[M.diff]) * (hard ? Math.max(m, Math.min(0.85, m*2)) : m);
  if(easy) v *= 0.6 + M.r()*0.6;
  return v;
}

/* ---------- mercato à l'aveugle */
function mcBotBids(p){
  const bids = []; let budget = p.money;
  const ranked = [...M.market].sort((a,b) => (mcWtp(p,b)-b.price) - (mcWtp(p,a)-a.price));
  for(const c of ranked){
    if(bids.length>=(M.diff==="easy" && M.r()<0.5 ? 1 : MC.buys)) break;
    const w = mcWtp(p, c); if(w < c.price) break;
    const cap = c.kind==="pepite" ? (p.prof==="D" ? 10 : 6) : Math.round(c.price * (c.kind==="legend" ? 1.35 : 1.6));
    const share = {easy:0.35, normal:0.55, hard:0.75}[M.diff];
    const bid = Math.min(Math.round(w * (M.diff==="hard" ? 0.95 + M.r()*0.05 : 0.85 + M.r()*0.15)), cap, Math.max(c.price, Math.round(budget*share)), budget);
    if(bid < c.price) continue;
    bids.push([c.uid, bid]); budget -= bid;
  }
  return bids;
}
function mcResolve(){
  const me = mcMe(), all = {};
  Object.entries(M.sel).forEach(([u, b]) => (all[u] ||= []).push([b, me]));
  M.players.forEach((p, i) => { if(p.bot) (M.botBids?.[i] || mcBotBids(p)).forEach(([u, b]) => (all[u] ||= []).push([b, p])); });
  M.botBids = null;
  M.results = M.market.map(c => {
    const bl = (all[c.uid]||[]).sort((x,y) => y[0]-x[0] || x[1].score-y[1].score);
    if(!bl.length) return {c, bids:[], w:null};
    let price, w = bl[0][1];
    if(bl.length===1) price = c.price;
    else { price = Math.max(c.price, Math.min(bl[0][0], bl[1][0] + MC.fee)); bl.slice(1).forEach(([, l]) => { l.money -= MC.fee; }); }
    if(w.money >= price){ w.money -= price; c.age = 0; c.boughtAt = M.season; M.won[c.uid] = w; const notes = mcPlace(w, c);
      return {c, bids:bl, w, price, starter:w.team.includes(c), notes}; }
    return {c, bids:bl, w:null};
  });
  M.sel = {}; M.phase = "reveal"; mcR("reveal");
}

/* ---------- ventes */
const mcSellValue = c => c.kind==="pepite" ? (c.age>=3 ? MC.pepResale : 1) : Math.round(c.price * MC.sellRatio);
function mcSell(p, c){
  const inT = p.team.indexOf(c), inB = p.bench.indexOf(c);
  if(inT<0 && inB<0) return 0;
  if(inT>=0) p.team.splice(inT, 1); else p.bench.splice(inB, 1);
  const v = mcSellValue(c); if(c.kind==="pepite" && c.age>=3) p.pepSold++;
  p.money += v; return v;
}

/* ---------- cartes : cibles possibles */
function mcTargets(by, st, to){
  if(st==="scandale") return to.team.filter(c => !M.susp.has(c.uid));
  if(st==="clause") return mcRoster(to).filter(c => c.kind!=="pepite" && c.boughtAt!==M.season && by.money >= c.price*2);
  if(st==="piston") return mcRoster(to).filter(c => M.won[c.uid]===to && c.locked!==M.season && by.money >= c.price+5);
  return [];
}
/* renvoie un texte d'erreur si la carte ne peut pas viser cette cible, sinon null */
function mcCheck(by, st, to){
  const C = MC_CARDS[st];
  if(C.tg==="self") return null;
  if(!to || to===by) return "Choisis un adversaire.";
  if(st==="trahison") return mcAllied(by, to) ? null : "Tu n'as pas de pacte avec lui.";
  if(mcAllied(by, to)) return "Vous avez un pacte : pas d'attaque entre alliés.";
  if(st==="pacte") return mcAllies(by).length || mcAllies(to).length ? "Un seul pacte à la fois." : null;
  if(C.pick && !mcTargets(by, st, to).length) return {scandale:"Il n'a aucun titulaire.", clause:"Aucun joueur à ta portée (argent).", piston:"Il n'a rien recruté que tu peux payer."}[st];
  return null;
}
/* applique l'effet ; renvoie le texte du résultat */
function mcApply(by, st, to, c){
  if(st==="prime"){ by.mod += 6; by.mods.push({t:"🏅 Prime", v:6}); return "+6 PP à ce match"; }
  if(st==="sponsor"){ by.money += 8; return "+8 M€ en caisse"; }
  if(st==="blinde"){ by.shield++; return "+1 bouclier"; }
  if(st==="formation"){ const i = M.deck.findIndex(c => c.kind==="pepite"); if(i<0) return "Plus de jeunes en stock"; const x = M.deck.splice(i, 1)[0]; x.age = 0; x.boughtAt = M.season; mcPlace(by, x); return `${x.n} 🌱 rejoint le club`; }
  if(MC_CARDS[st].k==="bas") to.hit = true;
  if(MC_CARDS[st].pick && !c) c = mcTargets(by, st, to).sort((a,b) => mcPP(b)-mcPP(a) || b.pp-a.pp)[0];
  if(st==="scandale"){ M.susp.add(c.uid); return `${c.n} suspendu pour ce match`; }
  if(st==="clause"){ const cost = c.price*2; by.money -= cost; to.money += cost; mcSell(to, c); to.money -= mcSellValue(c); mcLineup(to); mcPlace(by, c); return `${c.n} change de camp (${cost} M€)`; }
  if(st==="piston"){ const cost = c.price + 5; by.money -= cost; to.money += c.price;
    const inT = to.team.indexOf(c); if(inT>=0) to.team.splice(inT, 1); else to.bench.splice(to.bench.indexOf(c), 1); mcLineup(to);
    M.won[c.uid] = by; c.locked = M.season; mcPlace(by, c); return `${c.n} chipé (${cost} M€)`; }
  if(st==="fpf"){ const loss = Math.round(to.money*0.2); to.money -= loss; return `−${loss} M€ de trésorerie`; }
  if(st==="greve"){ to.mod -= 6; to.mods.push({t:"📢 Grève", v:-6}); return "−6 PP à ce match"; }
  if(st==="pacte"){ M.pacts.push({a:by, b:to, until:M.season + MC.pactLen - 1}); return `Pacte jusqu'à la saison ${M.season + MC.pactLen - 1}`; }
  if(st==="trahison"){ mcBreak(by, to); const v = Math.min(8, to.money); to.money -= v; by.money += v; to.mod -= 5; to.mods.push({t:"🗡️ Trahi", v:-5}); by.betrayed++; return `${v} M€ volés et −5 PP pour la victime`; }
}
const mcShieldable = st => MC_CARDS[st].k==="bas" || st==="trahison";
/* une action = ce qu'on montre en grand à l'écran */
const mcAct_ = (by, st, to, out, res="ok") => ({by, st, to, out, res});

/* ---------- toi : jouer une carte */
function mcPlay(i, seat, u){
  const me = mcMe(), st = me.hand[i]; if(st==null) return;
  if(M.played >= MC.plays) return toast("2 cartes maximum par saison.");
  const C = MC_CARDS[st], to = seat!=null ? M.players[seat] : null;
  if(C.tg!=="self" && seat==null){ M.aim = i; M.sheet = null; M.flash = null; return mcR(); }
  const err = mcCheck(me, st, to); if(err) return toast(err);
  if(C.pick && !u){ M.sheet = {t:"target", i, seat}; M.aim = null; return mcR("sheet"); }
  const c = u ? mcTargets(me, st, to).find(x => x.uid===u) : null;
  me.hand.splice(i, 1); M.played++; M.aim = null; M.sheet = null;
  if(st==="pacte"){
    const last = mcRank().at(-1)===to, p = {easy:0.75, normal:0.55, hard:0.4}[M.diff] + (last ? 0.2 : 0);
    if(M.r() < p){ M.flash = mcAct_(me, st, to, mcApply(me, st, to)); mcSay(to, "🤝 Marché conclu !", "ok"); }
    else { M.flash = mcAct_(me, st, to, `${to.n} refuse : « Non merci. »`, "refused"); mcSay(to, "Non merci 😏", "no"); }
    return mcR("bub");
  }
  if(to && mcShieldable(st) && to.shield>0 && M.r() < (M.diff==="easy" ? 0.35 : M.diff==="normal" ? 0.6 : 0.8)){
    to.shield--; mcSay(to, "🛡️ Bloqué !", "ok"); M.flash = mcAct_(me, st, to, `${to.n} sort son Contrat Blindé : coup annulé`, "blocked"); return mcR("bub"); }
  const out = mcApply(me, st, to, c);
  if(to) mcSay(to, `${C.ic} aïe`, "hit");
  M.flash = mcAct_(me, st, to, out);
  mcR("bub");
}

/* ---------- ordinateurs : jouer leurs cartes, un par un */
function mcBotsStart(){ M.queue = mcRank().reverse().filter(p => p.bot); M.qi = 0; M.bub = {}; M.flash = null; M.show = []; mcBotsStep(); }
function mcBotsStep(){
  while(M.qi < M.queue.length){
    const r = mcBotTurn(M.queue[M.qi]); if(r==="wait") return;
    M.qi++;
  }
  M.si = 0; M.phase = "after"; mcR("act");
}
function mcBotTarget(p, st){
  const rivals = M.players.filter(q => q!==p && !mcCheck(p, st, q));
  if(!rivals.length) return null;
  if(st==="pacte"){ const rk = mcRank(); return M.diff==="hard" ? rivals.sort((a,b) => rk.indexOf(b)-rk.indexOf(a))[0] : rivals[Math.floor(M.r()*rivals.length)]; }
  if(M.diff==="easy") return rivals[Math.floor(M.r()*rivals.length)];
  if(M.diff==="normal" && p.prof!=="A" && M.r()<0.4) return rivals[Math.floor(M.r()*rivals.length)];
  return rivals.sort((a,b) => b.score-a.score)[0];
}
function mcBotTurn(p){
  p._n = p._n || 0;
  const rate = {easy:0.4, normal:{A:1, B:0.55, C:0.7, D:0.6}[p.prof], hard:0.95}[M.diff];
  const order = [...p.hand].sort((a,b) => (MC_CARDS[a].k==="bonus" ? 0 : 1) - (MC_CARDS[b].k==="bonus" ? 0 : 1));
  for(const st of order){
    if(p._n >= MC.plays) break;
    if(M.r() > rate) continue;
    if(st==="trahison" && !(p.prof==="A" || M.r()<0.5)) continue;
    const C = MC_CARDS[st], to = C.tg==="self" ? null : mcBotTarget(p, st);
    if(C.tg!=="self" && !to) continue;
    if(st==="formation" && !M.deck.some(c => c.kind==="pepite")) continue;
    p.hand.splice(p.hand.indexOf(st), 1); p._n++;
    if(to && !to.bot && (st==="pacte" || (mcShieldable(st) && to.shield>0))){ M.pending = {by:p, st, to}; M.phase = st==="pacte" ? "offer" : "react"; mcR(); return "wait"; }
    if(st==="pacte"){ if(M.r()<0.6) M.show.push(mcAct_(p, st, to, mcApply(p, st, to))); else M.show.push(mcAct_(p, st, to, `${to.n} refuse`, "refused")); continue; }
    if(to && mcShieldable(st) && to.shield>0 && M.r()<0.5){ to.shield--; M.show.push(mcAct_(p, st, to, `${to.n} sort son Contrat Blindé : coup annulé`, "blocked")); continue; }
    M.show.push(mcAct_(p, st, to, mcApply(p, st, to)));
  }
  p._n = 0;
}
function mcAnswer(yes){
  const {by, st, to} = M.pending; M.pending = null;
  if(st==="pacte"){ if(yes) M.show.push(mcAct_(by, st, to, mcApply(by, st, to))); else M.show.push(mcAct_(by, st, to, "Tu refuses le pacte", "refused")); }
  else if(yes){ to.shield--; M.show.push(mcAct_(by, st, to, "Ton Contrat Blindé annule le coup", "blocked")); }
  else M.show.push(mcAct_(by, st, to, mcApply(by, st, to)));
  M.phase = "botsplay";
  const r = mcBotTurn(by); if(r==="wait") return;
  M.qi++; mcBotsStep();
}

/* ---------- match */
function mcScore(p){
  const ev = M.events[M.season-1];
  let alive = p.team.filter(c => !M.susp.has(c.uid)), injured = null;
  if(ev==="blessures" && alive.length){ injured = alive.reduce((a,b) => mcPP(b)>mcPP(a) ? b : a); alive = alive.filter(c => c!==injured); }
  const lines = [{t:"Joueurs", v:alive.reduce((s,c) => s + mcPP(c), 0)}];
  if(ev==="jeunesse"){ const j = alive.filter(c => c.kind==="pepite").length*3; if(j) lines.push({t:"🌱 Jeunesse", v:j}); }
  const leg = alive.some(c => c.kind==="legend"), mult = leg ? MC.legendMult : 1, star = leg ? " ⭐" : "";
  const club = Object.entries(mcCount(alive.map(c => c.club))).sort((a,b) => b[1]-a[1])[0];
  if(club && club[1]>=2){ const v = (club[1]>=3 ? MC.trio : MC.duo) * (ev==="derby"?2:1); lines.push({t:`${club[1]>=3?"Trio":"Duo"} ${club[0]}${star}`, v:Math.round(v*mult)}); }
  const lg = Object.entries(mcCount(alive.filter(c => c.lg!=="pl").map(c => c.lg))).find(([, n]) => n>=3);
  if(lg) lines.push({t:`Trio ${LG_AB[lg[0]]||lg[0]}${star}`, v:Math.round(MC.league*(ev==="europe"?2:1)*mult)});
  p.mods.forEach(m => lines.push(m));
  if(mcAllies(p).length) lines.push({t:"🤝 Pacte", v:MC.pactPP});
  return {lines, total:Math.max(0, lines.reduce((s,x) => s+x.v, 0)), injured};
}
function mcMatch(){
  const ev = M.events[M.season-1];
  M.scores = M.players.map(p => { const s = mcScore(p); p.score += s.total; p.last = s.total; return s; });
  mcRank().forEach((p, k) => { p.money += Math.round(MC.prize[k+1] * (ev==="crise" ? 0.5 : 1)); });
  M.phase = "match"; M.bub = {}; M.flash = null; mcR("match");
}
function mcNext(){
  if(M.season < MC.seasons){ M.season++; mcSeasonStart(); return; }
  M.players.forEach(p => { p.secretOk = !!(p.secret && MC_SECRETS[p.secret].ok(p)); p.bonusSecret = p.secretOk ? MC.secret : 0; p.bonusMoney = Math.floor(p.money/MC.moneyPP); p.final = p.score + p.bonusSecret + p.bonusMoney; });
  M.final = [...M.players].sort((a,b) => b.final-a.final || b.money-a.money);
  const rank = M.final.indexOf(mcMe()) + 1, won = rank===1;
  const r = {mode:"mercato", diff:M.diff, solo:true, score:(5-rank)*2 + (M.diff==="hard"?2:M.diff==="normal"?1:0), total:null, won, found:[], pepites:[]};
  L.summary = Object.assign(recordGame(r), {r, coins:null, bonus:null});
  if(won) setTimeout(() => celebrate("gold"), 300);
  (async () => { const s = L.summary, coins = await rewardGame(r.score, won); s.ref = LAST_REF; if(L.summary!==s || !M) return; s.coins = coins; mcR(); })();
  M.phase = "end"; mcR("end");
}

/* ======================================================================
   ÉCRANS
   ====================================================================== */
const MC_STEPS = [["draw","🃏","Pioche"],["mercato","✉️","Mercato"],["coups","🎭","Coups"],["match","⚽","Match"]];
function mcStepOf(ph){ return {draw:"draw", mercato:"mercato", reveal:"mercato", coups:"coups", botsplay:"coups", react:"coups", offer:"coups", after:"coups", match:"match"}[ph]; }

function mcHandCard(st, i, {play=false, big=false, flip=false}={}){
  const C = MC_CARDS[st];
  return `<button class="mcc k-${C.k}${big?" big":""}${flip?" flip":""}${M.aim===i?" on":""}" ${play?`data-act="mccard" data-v="${i}"`:"disabled"} style="${flip?`animation-delay:${i*0.15}s`:""}">
    <span class="mcc-ic">${C.ic}</span><b>${C.t}</b>${big?`<small>${esc(C.d)}</small>${C.p?`<i>${esc(C.p)}</i>`:""}`:""}</button>`;
}
function mcMini(c, {act="", v="", cls=""}={}){
  const tag = act ? "button" : "span";
  return `<${tag} class="mini${M.susp.has(c.uid)?" susp":""}${cls}${M.sheet && M.sheet.u===c.uid?" on":""}" ${act?`data-act="${act}" data-v="${esc(v)}"`:""}>${cardHTML(c.id,{small:true})}<span class="mini-pp">${mcPP(c)}</span>${M.susp.has(c.uid)?`<span class="mini-x">📸</span>`:""}</${tag}>`;
}
function mcLine(p, act){ // 5 titulaires + 2 remplaçants
  const g = p.team.filter(c => c.pos==="G"), f = p.team.filter(c => c.pos!=="G");
  const empty = n => Array(n).fill(`<span class="mini empty"></span>`).join("");
  return `<div class="line5">${g.map(c => mcMini(c, {act, v:c.uid})).join("")}${empty(1-g.length)}${f.map(c => mcMini(c, {act, v:c.uid})).join("")}${empty(4-f.length)}
    <span class="line-sep"></span>${p.bench.map(c => mcMini(c, {act, v:c.uid, cls:" bn"})).join("")}${Array(MC.bench-p.bench.length).fill(`<span class="mini empty bn"></span>`).join("")}</div>`;
}
function mcSeat(p){
  const i = mcIdx(p), me = mcMe(), b = M.bub[i], rk = mcRank().indexOf(p)+1;
  const aimSt = M.aim!=null ? me.hand[M.aim] : null, ok = aimSt && !mcCheck(me, aimSt, p);
  const env = M.phase==="mercato" && M.botBids ? (M.botBids[i]||[]).length : 0;
  const act = M.phase==="after" && M.show[M.si], hl = act && (act.by===p ? " actor" : act.to===p ? " victim" : "");
  return `<button class="seat${ok?" aim":""}${aimSt && !ok?" dim":""}${mcAllied(me, p)?" ally":""}${hl||""}" ${ok?`data-act="mcaim" data-v="${i}"`:aimSt?`data-act="mcaimno" data-v="${i}"`:`data-act="mcpeek" data-v="${i}"`}>
    <span class="seat-rk">${rk}</span>
    <span class="seat-av">${p.ic}</span>
    <b>${esc(mcShort(p))}</b>
    <span class="seat-pp">${p.score}<small> PP</small></span>
    <span class="seat-m">${p.money} M€ · ${p.team.length}/5</span>
    <span class="seat-row">${p.hand.map(() => `<i class="bk"></i>`).join("")}${p.shield?`<i class="sh">🛡️${p.shield>1?p.shield:""}</i>`:""}${mcAllies(p).length?`<i class="pc">🤝${mcAllies(p).map(q => q.ic).join("")}</i>`:""}</span>
    ${env?`<span class="seat-env">${"✉️".repeat(env)}</span>`:""}
    ${b?`<span class="bub ${b.cls}${M.fx==="bub"?" pop":""}">${esc(b.t)}</span>`:""}
  </button>`;
}
/* grande carte d'action : qui → quoi → sur qui → résultat */
function mcActHTML(a, anim){
  const C = MC_CARDS[a.st], av = p => `<span class="act-av${p.bot?"":" me"}">${p.ic}<small>${esc(mcShort(p))}</small></span>`;
  return `<div class="act res-${a.res}${anim?" in":""}">
    <div class="act-row">${av(a.by)}<span class="act-card k-${C.k}">${C.ic}</span>${a.to?av(a.to):""}</div>
    <b>${esc(mcName(a.by))} ${a.by.bot?"joue":"joues"} ${C.t}</b>
    <p class="act-out">${a.res==="blocked"?"🛡️ ":a.res==="refused"?"✋ ":"→ "}${esc(a.out)}</p>
    ${C.p && a.res==="ok"?`<i>${esc(C.p)}</i>`:""}</div>`;
}
function mcTable(center, dockHtml=""){
  const me = mcMe(), ev = M.events[M.season-1], step = mcStepOf(M.phase), si = MC_STEPS.findIndex(s => s[0]===step);
  const showHand = ["draw","coups"].includes(M.phase);
  return `<div class="mct">
   <div class="mct-top"><button class="iconbtn" data-act="quit" aria-label="Quitter">${ICON.back}</button>
    <span class="mct-season">Saison ${M.season}<small>/6</small></span>
    <button class="mct-ev" data-act="mcevent">${MC_EVENTS[ev].ic} ${MC_EVENTS[ev].t}</button>
    <button class="iconbtn mct-help" data-act="mcrules" aria-label="Règles">?</button></div>
   <div class="seats">${M.players.slice(1).map(mcSeat).join("")}</div>
   <div class="steps">${MC_STEPS.map((s,k) => `<span class="${k<si?"done":k===si?"cur":""}">${s[1]} ${s[2]}</span>`).join("")}</div>
   <div class="mct-c">${center}</div>
   <div class="me-zone">
    <div class="me-bar"><span class="seat-av me">${me.ic}</span><span class="me-st"><b>${me.score} PP</b><small>${me.money} M€ · ${mcRank().indexOf(me)+1}ᵉ</small></span>
     ${me.shield?`<span class="me-sh">🛡️${me.shield>1?" "+me.shield:""}</span>`:""}${mcAllies(me).length?`<span class="me-sh">🤝${mcAllies(me).map(q => q.ic).join("")}</span>`:""}
     <button class="me-secret" data-act="mcsecretpeek" aria-label="Objectif secret">🔒</button></div>
    <button class="me-line" data-act="mcteam">${mcLine(me)}</button>
    ${showHand ? `<div class="hand">${me.hand.length ? me.hand.map((st, i) => mcHandCard(st, i, {play:M.phase==="coups", flip:M.fx==="draw" && i>=me.hand.length-MC.draw})).join("") : `<span class="hand-empty">Main vide</span>`}</div>` : ""}
   </div>
   ${dockHtml?dock(dockHtml):""}
   ${mcSheet()}
  </div>`;
}
function mcSheet(){
  const s = M.sheet; if(!s) return "";
  const me = mcMe();
  let body = "";
  if(s.t==="card"){ const st = me.hand[s.i], C = MC_CARDS[st];
    body = `<div class="sheet-card">${mcHandCard(st, s.i, {big:true})}</div>
      <button class="btn" data-act="mcplay" data-v="${s.i}" ${M.played>=MC.plays?"disabled":""}>${M.played>=MC.plays?"Déjà 2 cartes jouées":C.tg==="self"?"Jouer":"Choisir l'adversaire"}</button>`; }
  if(s.t==="target"){ const st = me.hand[s.i], C = MC_CARDS[st], to = M.players[s.seat], list = mcTargets(me, st, to);
    body = `<h3>${C.ic} ${C.t} → ${to.ic} ${esc(to.n)}</h3><p class="bid-note">Choisis le joueur visé</p>
      <div class="tgt-grid">${list.map(c => `<button class="tgt" data-act="mcpicktgt" data-v="${c.uid}">${cardHTML(c.id,{small:true})}<span>${mcPP(c)} PP${st==="clause"?` · ${c.price*2} M€`:st==="piston"?` · ${c.price+5} M€`:""}</span></button>`).join("")}</div>`; }
  if(s.t==="bid"){ const c = M.market.find(x => x.uid===s.u), b = M.sel[s.u] ?? c.price, used = Object.entries(M.sel).filter(([u]) => u!==s.u).reduce((a,[,v]) => a+v, 0);
    const weak = !mcFree(me, c) ? me.team.filter(o => mcSlot(o)===mcSlot(c)).sort((a,b) => mcPP(a)-mcPP(b))[0] : null;
    body = `<div class="bid-head">${cardHTML(c.id,{small:true})}<div><b>${esc(c.n)}</b><small>${MC_POS_FR[c.pos]} · ${c.kind==="legend"?"Légende ⭐":c.kind==="pepite"?"Pépite 🌱 3 → 6 → 9 PP":"Régulier"}</small><span class="bid-pp">${c.kind==="pepite"?"3":c.pp} PP<small>/match</small></span>
      <small>${mcFree(me, c)?"✅ Place libre chez les titulaires":weak && mcPP(weak) < (c.kind==="pepite"?3:c.pp)?`🔄 Remplacerait ${esc(cardName(weak.n))} (${mcPP(weak)} PP)`:"🪑 Irait sur le banc"}</small></div></div>
      <div class="bid-dial"><button data-act="mcbid" data-v="-5">−5</button><button data-act="mcbid" data-v="-1">−</button><b>${b}<small> M€</small></b><button data-act="mcbid" data-v="1">+</button><button data-act="mcbid" data-v="5">+5</button></div>
      <p class="bid-note">Prix de base ${c.price} M€ · il te reste ${me.money - used} M€</p>
      <button class="btn" data-act="mcseal" data-v="${s.u}">✉️ Glisser mon offre (${b} M€)</button>
      ${!s.isNew?`<button class="btn ghost" data-act="mcunbid" data-v="${s.u}">Retirer l'offre</button>`:""}`; }
  if(s.t==="team"){ const sel = s.u && mcRoster(me).find(c => c.uid===s.u), sc = mcScore(me);
    body = `<h3>Mon équipe</h3>
      <div class="team-big">${mcLine(me, "mcchip")}</div>
      <div class="lines">${sc.lines.filter(x => x.v && !x.t.startsWith("🏅") && !x.t.startsWith("📢") && !x.t.startsWith("🗡️")).map((x,k) => `<span class="${k?"bonus":""}">${esc(x.t)} ${x.v>0?"+":""}${x.v}</span>`).join("")}</div>
      ${sel?`<div class="chip-acts"><b>${esc(sel.n)}</b> · ${esc(sel.club)} · ${mcPP(sel)} PP<div>${me.bench.includes(sel) && !mcFree(me, sel)?"":`<button class="btn ghost" data-act="mcmove" data-v="${sel.uid}">${me.bench.includes(sel)?"↑ Titulaire":"↓ Au banc"}</button>`}<button class="btn" data-act="mcsell" data-v="${sel.uid}">Vendre ${mcSellValue(sel)} M€</button></div></div>`
        :`<p class="bid-note">Touche un joueur pour le vendre ou le changer de place.<br>Combos : 2 du même club +4 · 3 du même club +10 · 3 d'un championnat étranger +8 · une Légende multiplie ×1,5.</p>`}`; }
  if(s.t==="secret"){ const k = me.secret; body = `<div class="secret-big">${MC_SECRETS[k].ic}<b>${MC_SECRETS[k].t}</b><small>${MC_SECRETS[k].d}</small><span>+${MC.secret} PP à la fin · ${MC_SECRETS[k].ok(me)?"✅ rempli pour l'instant":"pas encore"}</span></div>`; }
  if(s.t==="peek"){ const p = M.players[s.i]; body = `<h3>${p.ic} ${esc(p.n)}</h3><p class="bid-note">${p.money} M€ · ${p.hand.length} carte${p.hand.length>1?"s":""} cachée${p.hand.length>1?"s":""} · ${p.shield} bouclier${p.shield>1?"s":""} · objectif secret ?</p>
      <div class="team-big">${mcLine(p)}</div>`; }
  if(s.t==="event"){ const ev = M.events[M.season-1], nx = M.events[M.season];
    body = `<div class="secret-big">${MC_EVENTS[ev].ic}<b>${MC_EVENTS[ev].t}</b><small>${MC_EVENTS[ev].d}</small></div>${nx?`<p class="bid-note">Saison suivante : ${MC_EVENTS[nx].ic} <b>${MC_EVENTS[nx].t}</b> — ${MC_EVENTS[nx].d}</p>`:""}`; }
  if(s.t==="rules") body = `<h3>Comment on joue</h3>${mcTutoSlides().map(x => `<p class="rule-l"><span>${x[0]}</span><span><b>${x[1]}</b><small>${x[2]}</small></span></p>`).join("")}`;
  const an = M.fx==="sheet" ? " anim" : "";
  return `<div class="sheet-bg${an}" data-act="mcclose"></div><div class="sheet${an}">${body}</div>`;
}
function mcTutoSlides(){ return [
  ["⚽","Ton équipe à 5","1 gardien, 4 joueurs de champ et 2 remplaçants. Les meilleurs jouent automatiquement."],
  ["✉️","Enchères à l'aveugle","Tu mises en secret. Le plus offrant gagne et paie la 2ᵉ offre + 1 M€."],
  ["🃏","La pioche","2 cartes par saison : bonus pour toi, coups bas pour eux. Ta main est cachée."],
  ["🤝","Pactes et trahisons","Allie-toi pour +4 PP par match… et trahis au bon moment."],
  ["🏆","6 saisons","Joueurs du même club = combos. À la fin : objectif secret +15 et 1 PP par 2 M€ en caisse."]]; }

function screenMercatoPick(){
  const b = PROFILE.best;
  return {key:"mercatoPick", html:`
  <div class="subhead"><button class="iconbtn" data-act="nav" data-v="home" aria-label="Retour">${ICON.back}</button><h1>Mercato FC</h1></div>
  <div class="mc-hero"><span class="mc-hero-av">🦈</span><span class="mc-hero-av">🧮</span><span class="mc-hero-av">🎓</span><span class="mc-hero-av">🔍</span>
   <p>Enchères à l'aveugle, coups bas et trahisons.<br>6 saisons pour être le meilleur président.</p></div>
  <div class="pick-list">${Object.entries(MC_DIFF).map(([k,d]) => `<button class="mode diff-${k}" data-act="mcstart" data-v="${k}"><span class="lgtag">${d.t}</span><b>${d.b}</b><small>${d.d}</small>${b["mercato_"+k]?`<span class="rec">🏆 ${b["mercato_"+k]}</span>`:""}</button>`).join("")}</div>
  ${tabbar()}`};
}
function screenMercato(){
  if(!M){ VIEW = "mercatoPick"; return screenMercatoPick(); }
  const me = mcMe(), key = "mc-"+M.v;
  if(M.phase==="tuto"){ const sl = mcTutoSlides(), x = sl[M.tuto];
    return {key:"mct-"+M.v, html:`<div class="tuto">
      <button class="linkbtn tuto-skip" data-act="mctutoskip">Passer</button>
      <div class="tuto-ic">${x[0]}</div><h1 class="display">${x[1]}</h1><p>${x[2]}</p>
      <div class="tuto-dots">${sl.map((_,k) => `<i class="${k===M.tuto?"on":""}"></i>`).join("")}</div></div>
      ${dock(`<button class="btn" data-act="mctuto">${M.tuto<sl.length-1?"Suivant":"C'est parti"}</button>`)}`}; }
  if(M.phase==="secret") return {key:"mcs-"+M.v, html:`<div class="tuto">
      <span class="eyebrow">Ton objectif secret</span><h1 class="display">Choisis une carte</h1><p>Personne ne la verra. +15 PP si tu la remplis.</p>
      <div class="secret-pick">${M.secretChoice.map((k,i) => `<button class="secret-c" data-act="mcsecret" data-v="${k}" style="animation-delay:${i*0.2}s"><span>${MC_SECRETS[k].ic}</span><b>${MC_SECRETS[k].t}</b><small>${MC_SECRETS[k].d}</small></button>`).join("")}</div></div>`};

  if(M.phase==="draw"){
    const drawn = M.drawn;
    return {key, html:mcTable(drawn
      ? `<p class="mct-say">Tu as pioché</p><div class="drawn">${drawn.map((st,i) => mcHandCard(st, i, {big:true, flip:true})).join("")}</div>`
      : `<p class="mct-say">Touche la pioche</p><button class="pile" data-act="mcdraw"><span></span><span></span><span></span><b>${M.pdeck.length}</b></button>`,
      drawn ? `<button class="btn" data-act="mcgomkt">Au mercato →</button>` : "")};
  }
  if(M.phase==="mercato"){
    const n = Object.keys(M.sel).length, used = Object.values(M.sel).reduce((a,b) => a+b, 0);
    return {key, html:mcTable(`<p class="mct-say">Choisis jusqu'à 2 joueurs · ${me.money-used} M€ libres</p>
      <div class="mkt">${M.market.map(c => { const b = M.sel[c.uid];
        return `<button class="mkt-c${b!=null?" bid":""}" data-act="mcopen" data-v="${c.uid}">${cardHTML(c.id,{small:true})}<span class="mkt-i"><b>${c.price}</b> M€ · ${c.kind==="pepite"?"3→9":c.pp} PP</span>${b!=null?`<span class="env">✉️ ${b}</span>`:""}</button>`; }).join("")}</div>`,
      `<button class="btn" data-act="mcresolve">${n?`Sceller ${n>1?"mes 2 offres":"mon offre"} ✉️`:"Passer ce mercato"}</button>`)};
  }
  if(M.phase==="reveal") return {key, html:mcTable(`<div class="reveal">${M.results.map((x, k) => `<div class="rv${x.w===me?" me":""}" style="animation-delay:${k*0.25}s">
      <span class="rv-n"><b>${esc(cardName(x.c.n))}</b><small>${x.c.kind==="legend"?"⭐ ":x.c.kind==="pepite"?"🌱 ":""}base ${x.c.price} M€</small></span>
      <span class="rv-b">${x.bids.length?x.bids.map(([v,p], j) => `<i class="${j===0&&x.w?"win":""}">${p.ic} ${v}</i>`).join(""):`<i class="none">invendu</i>`}</span>
      ${x.w?`<span class="rv-w">${x.w.ic}<small>${x.price} M€</small></span>`:""}
      ${x.w===me?`<span class="rv-note">${x.starter?"✅ Titulaire":"🪑 Sur le banc"}${x.notes.length?" · "+esc(x.notes.join(", ")):""}</span>`:""}</div>`).join("")}</div>`,
      `<button class="btn" data-act="mccoups">Aux coups bas 🎭</button>`)};
  if(M.phase==="coups") return {key, html:mcTable(M.aim!=null
      ? `<p class="mct-say aimsay">${MC_CARDS[me.hand[M.aim]].ic} Touche un adversaire en haut</p><button class="linkbtn" data-act="mcaimcancel">Annuler</button>`
      : `${M.flash ? mcActHTML(M.flash, M.fx==="bub") : `<p class="mct-say">Joue jusqu'à 2 cartes</p><p class="mct-hint">Touche une carte de ta main ↓</p>`}`,
      M.aim!=null ? "" : `<button class="btn" data-act="mcendturn">${M.played>=MC.plays?"Fin de mon tour":M.played?"Fin de mon tour (1 carte restante)":"Je ne joue rien"}</button>`)};
  if(M.phase==="react" || M.phase==="offer"){ const {by, st} = M.pending, C = MC_CARDS[st];
    return {key, html:mcTable(`<div class="alert ${M.phase}"><span class="alert-av">${by.ic}</span><small>${esc(by.n)} ${M.phase==="offer"?"te propose":"t'attaque"}</small><b>${C.ic} ${C.t}</b><p>${esc(C.d)}</p>${C.p?`<i>${esc(C.p)}</i>`:""}</div>`,
      M.phase==="offer" ? `<button class="btn" data-act="mcanswer" data-v="1">🤝 J'accepte</button><button class="btn ghost" data-act="mcanswer" data-v="0">Refuser</button>`
      : `<button class="btn" data-act="mcanswer" data-v="1">🛡️ Contrat Blindé (${me.shield})</button><button class="btn ghost" data-act="mcanswer" data-v="0">Encaisser</button>`)}; }
  if(M.phase==="after"){ const a = M.show[M.si], n = M.show.length;
    return {key, html:mcTable(n
      ? `<p class="mct-say">Les présidents jouent · ${M.si+1}/${n}</p>${mcActHTML(a, true)}`
      : `<p class="mct-say">Les présidents n'ont rien joué</p><p class="mct-hint">Calme plat… pour l'instant.</p>`,
      M.si < n-1 ? `<button class="btn" data-act="mcshownext">Suivant →</button>` : `<button class="btn" data-act="mcmatch">Coup d'envoi ⚽</button>`)}; }
  if(M.phase==="match"){ const s = M.scores[0], rk = mcRank(), mx = Math.max(1, ...M.players.map(p => p.score));
    return {key, html:mcTable(`<div class="score-pop"><b>+${s.total}</b><small>PP pour toi</small></div>
      <div class="lines">${s.lines.filter(x => x.v).map((x,k) => `<span class="${x.v<0?"neg":k?"bonus":""}" style="animation-delay:${0.3+k*0.15}s">${esc(x.t)} ${x.v>0?"+":""}${x.v}</span>`).join("")}${s.injured?`<span class="neg">🚑 ${esc(cardName(s.injured.n))} absent</span>`:""}</div>
      <div class="race">${rk.map(p => `<div class="race-r${p.bot?"":" me"}"><span>${p.ic}</span><i style="width:${Math.round(p.score/mx*100)}%"></i><b>${p.score}</b><small>+${p.last}</small></div>`).join("")}</div>`,
      `<button class="btn" data-act="mcnext">${M.season<MC.seasons?`Saison ${M.season+1} →`:"Décompte final 🏆"}</button>`)}; }
  if(M.phase==="end"){ const meRank = M.final.indexOf(me)+1;
    return {key:"mcend-"+(L.summary&&L.summary.coins), html:`<div class="stack">
     <div class="hero"><span class="eyebrow">Mercato FC · ${MC_DIFF[M.diff].t}</span><h1 class="display" style="font-size:clamp(34px,10vw,50px)">${meRank===1?`Meilleur <span>président</span> 🏆`:`${meRank}ᵉ <span>sur 4</span>`}</h1></div>
     <div class="finals">${M.final.map((p,k) => `<div class="fin${p.bot?"":" me"}" style="animation-delay:${k*0.2}s"><span class="fin-rk">${k+1}</span><span class="seat-av">${p.ic}</span>
       <span class="fin-t"><b>${esc(mcName(p))}</b><small>${p.score} PP · ${MC_SECRETS[p.secret]?.ic||""} ${p.secretOk?`+${MC.secret}`:"✗"} · 💶 +${p.bonusMoney}</small></span><span class="fin-s">${p.final}</span></div>`).join("")}</div>
     ${summaryBlock()}</div>
     ${dock(`<button class="btn" data-act="mcstart" data-v="${M.diff}">Rejouer</button><button class="btn ghost" data-act="nav" data-v="mercatoPick">Changer de niveau</button>`)}`};
  }
  return {key:"mc-x", html:""};
}

/* ---------- actions (appelées depuis app.js) */
function mcAct(a, v){
  if(a==="mcstart") return startMercato(v);
  if(!M) return;
  const me = mcMe();
  switch(a){
    case "mctuto": if(M.tuto < mcTutoSlides().length-1){ M.tuto++; mcR(); } else { PROFILE.best.mercatoTuto = 1; saveProfile(); M.phase = "secret"; mcR(); } break;
    case "mctutoskip": PROFILE.best.mercatoTuto = 1; saveProfile(); M.phase = "secret"; mcR(); break;
    case "mcsecret": me.secret = v; mcSeasonStart(); break;
    case "mcdraw": mcDrawMine(); break;
    case "mcgomkt": M.phase = "mercato"; M.drawn = null; M.botBids = M.players.map(p => p.bot ? mcBotBids(p) : null); mcR(); break;
    case "mcopen": {
      if(M.sel[v]==null && Object.keys(M.sel).length >= MC.buys) return toast("2 offres maximum par saison.");
      const c = M.market.find(x => x.uid===v), used = Object.entries(M.sel).filter(([u]) => u!==v).reduce((x,[,y]) => x+y, 0);
      if(M.sel[v]==null && me.money - used < c.price) return toast("Pas assez d'argent.");
      M.sheet = {t:"bid", u:v, isNew:M.sel[v]==null}; M.sel[v] = M.sel[v] ?? c.price; mcR("sheet"); break; }
    case "mcbid": { const u = M.sheet.u, c = M.market.find(x => x.uid===u), used = Object.entries(M.sel).filter(([k]) => k!==u).reduce((x,[,y]) => x+y, 0);
      M.sel[u] = Math.max(c.price, Math.min(me.money - used, M.sel[u] + (+v))); mcR(); break; }
    case "mcseal": M.sheet = null; mcR(); break;
    case "mcunbid": delete M.sel[v]; M.sheet = null; mcR(); break;
    case "mcclose": if(M.sheet && M.sheet.t==="bid" && M.sheet.isNew) delete M.sel[M.sheet.u]; M.sheet = null; mcR(); break;
    case "mcresolve": mcResolve(); break;
    case "mccoups": M.phase = "coups"; M.bub = {}; M.flash = null; mcR(); break;
    case "mccard": M.aim = null; M.sheet = {t:"card", i:+v}; mcR("sheet"); break;
    case "mcplay": mcPlay(+v); break;
    case "mcaim": mcPlay(M.aim, +v); break;
    case "mcpicktgt": mcPlay(M.sheet.i, M.sheet.seat, v); break;
    case "mcaimno": toast(mcCheck(me, me.hand[M.aim], M.players[+v]) || "Cible impossible."); break;
    case "mcaimcancel": M.aim = null; mcR(); break;
    case "mcendturn": M.aim = null; M.phase = "botsplay"; mcBotsStart(); break;
    case "mcanswer": mcAnswer(v==="1"); break;
    case "mcshownext": M.si++; mcR("act"); break;
    case "mcmatch": mcMatch(); break;
    case "mcnext": mcNext(); break;
    case "mcteam": M.sheet = {t:"team"}; mcR("sheet"); break;
    case "mcchip": M.sheet = {t:"team", u:M.sheet && M.sheet.u===v ? null : v}; mcR(); break;
    case "mcsell": { const c = mcRoster(me).find(x => x.uid===v); if(c){ const g = mcSell(me, c); mcLineup(me); toast(`${cardName(c.n)} vendu : +${g} M€`); M.sheet = {t:"team"}; mcR(); } break; }
    case "mcmove": { const b = me.bench.find(c => c.uid===v), t = me.team.find(c => c.uid===v);
      if(b && mcFree(me, b)){ me.bench.splice(me.bench.indexOf(b), 1); me.team.push(b); }
      else if(b){ const w = me.team.filter(o => mcSlot(o)===mcSlot(b)).sort((x,y) => mcPP(x)-mcPP(y))[0]; me.team.splice(me.team.indexOf(w), 1, b); me.bench.splice(me.bench.indexOf(b), 1, w); }
      else if(t && me.bench.length < MC.bench){ me.team.splice(me.team.indexOf(t), 1); me.bench.push(t); }
      else return toast("Banc plein.");
      M.sheet = {t:"team", u:v}; mcR(); break; }
    case "mcsecretpeek": M.sheet = {t:"secret"}; mcR("sheet"); break;
    case "mcpeek": M.sheet = {t:"peek", i:+v}; mcR("sheet"); break;
    case "mcevent": M.sheet = {t:"event"}; mcR("sheet"); break;
    case "mcrules": M.sheet = {t:"rules"}; mcR("sheet"); break;
  }
}
