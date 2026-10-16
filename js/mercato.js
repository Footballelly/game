/* Football Legends — MERCATO FC v5 : un championnat à 4 présidents, en solo contre 3 ordinateurs.
   Équipe à 5 (1 gardien + 4 joueurs de champ) et 2 remplaçants.
   Chaque saison : Pioche → Mercato à l'aveugle (+ mercato d'hiver flash en saison 4) → Coups → Match de championnat.
   Le classement se fait aux points (victoire 3, nul 1), la dernière journée compte double.
   Tout se joue sur l'appareil ; la fin de partie rapporte XP et pièces comme les autres modes. */
"use strict";

const MC = {
  seasons:6, budget:50, buys:2, market:6, handMax:4, plays:2, draw:2, bench:2,
  prize:{1:5, 2:8, 3:10, 4:12}, trio:10, duo:4, league:8, legendMult:1.5,
  pepCurve:[3,6,9], pepResale:15, sellRatio:0.5, secretPts:3, moneyPts:20, fee:1, pactPP:4, pactLen:2, flashSeason:4
};
const MC_SLOTS = {G:1, F:4};
const mcSlot = c => c.pos==="G" ? "G" : "F";
const MC_POS = {GK:"G", DEF:"DEF", MID:"MIL", ATT:"ATT"};
const MC_POS_FR = {G:"Gardien", DEF:"Défenseur", MIL:"Milieu", ATT:"Attaquant"};
const MC_DIFF = {
  easy:{t:"Facile", b:"Vestiaire tranquille", d:"Présidents amateurs"},
  normal:{t:"Moyen", b:"Vrai mercato", d:"Chacun sa stratégie"},
  hard:{t:"Difficile", b:"Fosse aux requins", d:"Ils s'allient contre le leader"}
};
const MC_BOTS = [
  {prof:"A", n:"Le Requin", s:"Requin", ic:"🦈", col:"#ff4d6d"},
  {prof:"B", n:"Le Comptable", s:"Comptable", ic:"🧮", col:"#3ed38f"},
  {prof:"C", n:"Le Professeur", s:"Prof", ic:"🎓", col:"#a98bff"},
  {prof:"D", n:"Le Dénicheur", s:"Dénicheur", ic:"🔍", col:"#ff9f3a"}
];
const MC_POWERS = {
  flambeur:{ic:"🎲", t:"Le Flambeur", d:"À chaque mercato, tu espionnes une offre adverse."},
  formateur:{ic:"🌱", t:"Le Formateur", d:"Tes Pépites grandissent 2× plus vite."},
  negociateur:{ic:"🤝", t:"Le Négociateur", d:"−2 M€ sur chaque joueur gagné au mercato."},
  tacticien:{ic:"📋", t:"Le Tacticien", d:"Tes combos rapportent 50 % de plus."},
  mediatique:{ic:"📺", t:"Le Médiatique", d:"Tu pioches 3 cartes par saison au lieu de 2."}
};
const MC_TRAITS = {
  capitaine:{ic:"🎖️", t:"Capitaine", d:"+4 de force à l'équipe s'il est titulaire."},
  clutch:{ic:"⏰", t:"Clutch", d:"Force doublée en saisons 5 et 6."},
  fragile:{ic:"🩹", t:"Fragile", d:"1 chance sur 4 de rater le match."},
  ego:{ic:"😤", t:"Ego", d:"−3 de force à l'équipe s'il est sur le banc."},
  fidele:{ic:"🔒", t:"Fidèle", d:"Impossible à voler (Clause, 23h59)."}
};
const MC_EVENTS = {
  calme:{ic:"☀️", t:"Mercato calme", d:"Aucun effet."},
  inflation:{ic:"📈", t:"Inflation", d:"−2 M€ de salaires par titulaire."},
  europe:{ic:"🌍", t:"Coupe d'Europe", d:"Combos championnat étranger ×2."},
  derby:{ic:"⚔️", t:"Derby", d:"Combos de club ×2."},
  crise:{ic:"📉", t:"Crise", d:"Primes de fin de saison ÷2."},
  fou:{ic:"🌀", t:"Mercato fou", d:"8 joueurs au marché."},
  blessures:{ic:"🚑", t:"Blessures", d:"Le meilleur joueur de chaque équipe rate le match."},
  jeunesse:{ic:"🌱", t:"Jeunesse", d:"+3 de force par Pépite titulaire."}
};
const MC_EV_POOL = ["calme","calme","inflation","europe","derby","crise","fou","blessures","jeunesse"];

/* la pioche : bonus (pour toi), coups bas (sur un adversaire), pactes et trahisons */
const MC_CARDS = {
  prime:    {ic:"🏅", t:"Prime de match",   k:"bonus", tg:"self", d:"+6 de force pour ton prochain match."},
  sponsor:  {ic:"💶", t:"Sponsor",          k:"bonus", tg:"self", d:"+8 M€ tout de suite."},
  formation:{ic:"🌱", t:"Centre de formation", k:"bonus", tg:"self", d:"Une Pépite gratuite rejoint ton club."},
  blinde:   {ic:"🛡️", t:"Contrat Blindé",   k:"bonus", tg:"self", d:"+1 bouclier : annule un coup bas."},
  scandale: {ic:"📸", t:"Scandale",         k:"bas", tg:"seat", pick:true, d:"Un de ses titulaires est suspendu pour ce match.", p:"« Je n'ai rien contre lui, j'ai juste des photos. »"},
  clause:   {ic:"💼", t:"Clause libératoire", k:"bas", tg:"seat", pick:true, d:"Tu rachètes un de ses joueurs 2× son prix (l'argent va à lui).", p:"« Tout a un prix. Même la loyauté. »"},
  piston:   {ic:"⚡", t:"Signature à 23h59", k:"bas", tg:"seat", pick:true, d:"Tu lui chipes une recrue de cette saison (prix + 5 M€).", p:"« Désolé, il a signé chez nous à 23h59. »"},
  fpf:      {ic:"🧾", t:"Audit FPF",        k:"bas", tg:"seat", d:"Il perd 20 % de sa trésorerie.", p:"« Les comptes ne mentent jamais… les présidents, si. »"},
  greve:    {ic:"📢", t:"Grève des supporters", k:"bas", tg:"seat", d:"−6 de force pour lui à ce match.", p:"« Le peuple a parlé. »"},
  pacte:    {ic:"🤝", t:"Pacte",            k:"pacte", tg:"seat", d:"Alliance 2 saisons : +4 de force chacun, pas d'attaque entre vous.", p:"« Ensemble, on est plus forts. »"},
  trahison: {ic:"🗡️", t:"Trahison",         k:"pacte", tg:"ally", d:"Romps ton pacte : tu lui voles 8 M€ et il perd 5 de force.", p:"« Rien de personnel. C'est le business. »"}
};
const MC_PDECK = {prime:5, sponsor:4, formation:3, blinde:2, scandale:5, clause:3, piston:4, fpf:3, greve:4, pacte:4, trahison:3};
const MC_SECRETS = {
  club3:{ic:"🏟️", t:"Esprit de clocher", d:"3 titulaires du même club.", ok:p => Math.max(0, ...Object.values(mcCount(p.team.map(c => c.club)))) >= 3},
  legend2:{ic:"🌟", t:"Galáctico", d:"Posséder 2 Légendes.", ok:p => mcRoster(p).filter(c => c.kind==="legend").length >= 2},
  pep2:{ic:"🌱", t:"Formateur", d:"Revendre 2 Pépites au prix fort.", ok:p => p.pepSold >= 2},
  rich:{ic:"💰", t:"Trésorier", d:"Finir avec 40 M€ ou plus.", ok:p => p.money >= 40},
  clean:{ic:"😇", t:"Casier vierge", d:"Ne jamais subir de coup bas.", ok:p => !p.hit},
  unbeaten:{ic:"🧱", t:"Solide", d:"Perdre au plus 1 match.", ok:p => p.l <= 1},
  traitor:{ic:"🗡️", t:"Agent double", d:"Trahir un allié au moins une fois.", ok:p => p.betrayed >= 1},
  scorer:{ic:"⚽", t:"Machine à buts", d:"Marquer 12 buts ou plus.", ok:p => p.gf >= 12}
};

/* ---------- petits outils */
function mcCount(arr){ const o = {}; arr.forEach(x => o[x] = (o[x]||0)+1); return o; }
function mcShuffle(a, r){ for(let k=a.length-1;k>0;k--){ const j = Math.floor(r()*(k+1)); [a[k],a[j]] = [a[j],a[k]]; } return a; }
const mcRoster = p => [...p.team, ...p.bench];
const mcFree = (p, c) => p.team.filter(o => mcSlot(o)===mcSlot(c)).length < MC_SLOTS[mcSlot(c)];
const mcPP = c => { if(c.kind==="pepite") return MC.pepCurve[Math.min(Math.max(c.age,1),3)-1] || 0; return c.trait==="clutch" && M && M.season>=5 ? c.pp*2 : c.pp; };
const mcMe = () => M.players[0];
const mcIdx = p => M.players.indexOf(p);
const mcName = p => p.bot ? p.n : "Toi";
const mcShort = p => p.bot ? MC_BOTS.find(x => x.prof===p.prof).s : "Toi";
let M = null;

/* ---------- sons (synthétisés, aucun fichier à charger) */
let MC_AC = null;
function mcSfx(kind){
  if(PROFILE.best.mcMute) return;
  try{
    MC_AC = MC_AC || new (window.AudioContext || window.webkitAudioContext)();
    const ac = MC_AC, t = ac.currentTime, g = ac.createGain(); g.connect(ac.destination);
    const tone = (f, d, type="sine", v=0.15, at=0) => { const o = ac.createOscillator(), gg = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t+at);
      gg.gain.setValueAtTime(v, t+at); gg.gain.exponentialRampToValueAtTime(0.001, t+at+d); o.connect(gg); gg.connect(ac.destination); o.start(t+at); o.stop(t+at+d); };
    const noise = (d, v=0.2, at=0, freq=1200) => { const b = ac.createBuffer(1, ac.sampleRate*d, ac.sampleRate), ch = b.getChannelData(0); for(let i=0;i<ch.length;i++) ch[i] = Math.random()*2-1;
      const s = ac.createBufferSource(), f = ac.createBiquadFilter(), gg = ac.createGain(); f.type = "bandpass"; f.frequency.value = freq; s.buffer = b;
      gg.gain.setValueAtTime(0.001, t+at); gg.gain.linearRampToValueAtTime(v, t+at+d*0.3); gg.gain.exponentialRampToValueAtTime(0.001, t+at+d); s.connect(f); f.connect(gg); gg.connect(ac.destination); s.start(t+at); };
    if(kind==="tap") tone(660, 0.06, "triangle", 0.08);
    if(kind==="card") { noise(0.18, 0.15, 0, 3000); tone(880, 0.08, "triangle", 0.06, 0.05); }
    if(kind==="env") noise(0.3, 0.2, 0, 1800);
    if(kind==="coin") { tone(988, 0.08, "square", 0.05); tone(1319, 0.2, "square", 0.05, 0.08); }
    if(kind==="hit") { tone(160, 0.25, "sawtooth", 0.12); noise(0.2, 0.2, 0, 400); }
    if(kind==="block") { tone(520, 0.1, "square", 0.06); tone(780, 0.18, "square", 0.06, 0.1); }
    if(kind==="whistle") { tone(2100, 0.25, "sine", 0.1); tone(2100, 0.5, "sine", 0.1, 0.32); }
    if(kind==="goal") { noise(1.6, 0.35, 0, 900); tone(523, 0.3, "triangle", 0.1, 0.1); tone(659, 0.3, "triangle", 0.1, 0.2); tone(784, 0.5, "triangle", 0.1, 0.3); }
    if(kind==="tick") tone(1200, 0.04, "square", 0.04);
    if(kind==="win") [523,659,784,1047].forEach((f,i) => tone(f, 0.35, "triangle", 0.1, i*0.12));
  }catch(e){}
}

/* ---------- paquets (setup = tirage, seedé pour la partie du jour) */
function mcDeck(r){
  const leg = CARDS.filter(c => c.r==="legend" || c.r==="icon"), rare = CARDS.filter(c => c.r==="rare"), com = CARDS.filter(c => c.r==="common");
  const tk = Object.keys(MC_TRAITS);
  const mk = (c, kind) => { const x = hashStr(c.id+"mc"); const base = {uid:uid(), id:c.id, n:c.n, club:c.c, lg:c.lg, pos:MC_POS[c.p]||"MIL", kind, age:0,
      trait: kind!=="pepite" && x%100 < 35 ? tk[(x>>8) % tk.length] : null};
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
function startMercato(diff, opt={}){
  leaveGame(false, true); mcStopFlash();
  const daily = !!opt.daily, sr = rng(daily ? hashStr("mercato"+todayKey()) : Date.now() % 1e9);
  const r = rng((Date.now() ^ 0x5bd1e995) % 1e9);
  const bots = mcShuffle([...MC_BOTS], sr).slice(0, 3);
  const mkP = (n, ic, prof, bot, col) => ({n, ic, prof, bot, col, money:MC.budget, team:[], bench:[], hand:[], shield:1, pts:0, gf:0, ga:0, w:0, d:0, l:0, form:[],
    secret:null, power:null, pepSold:0, hit:false, betrayed:0, bas:0, mod:0, mods:[], buys:[]});
  M = {diff, daily, r, v:0, season:1, deck:mcDeck(sr), pdeck:mcPdeck(sr), events:Array.from({length:MC.seasons}, () => MC_EV_POOL[Math.floor(sr()*MC_EV_POOL.length)]),
       players:[mkP(PROFILE.name || "Toi", "⭐", "me", false, "#ffd23f"), ...bots.map(b => mkP(b.n, b.ic, b.prof, true, b.col))],
       phase:(PROFILE.best.mercatoTuto2 ? "secret" : "tuto"), tuto:0, market:[], won:{}, susp:new Set(), sel:{}, results:[], pacts:[], bub:{}, show:[], si:0, flash:null,
       sheet:null, aim:null, played:0, fx:null, goals:{}, flashA:null};
  // calendrier : 3 journées aller, 3 retour
  const rounds = mcShuffle([[[0,1],[2,3]], [[0,2],[1,3]], [[0,3],[1,2]]], sr); M.fixtures = [...rounds, ...rounds];
  const keys = Object.keys(MC_SECRETS), pk = Object.keys(MC_POWERS);
  M.players.forEach((p, k) => { mcDraw(p, 2); const two = mcShuffle([...keys], sr).slice(0, 2); if(k===0) M.secretChoice = two; else p.secret = two[0]; });
  M.powerChoice = mcShuffle([...pk], sr).slice(0, 3);
  VIEW = "mercato"; mcR();
}
function mcR(fx){ M.v++; M.fx = fx || null; render(true); M.fx = null; }
const mcGD = p => p.gf - p.ga;
function mcRank(){ return [...M.players].sort((a,b) => b.pts-a.pts || mcGD(b)-mcGD(a) || b.gf-a.gf || b.money-a.money); }
function mcSay(p, t, cls=""){ M.bub[mcIdx(p)] = {t, cls}; }
function mcOpp(p){ const f = M.fixtures[M.season-1], i = mcIdx(p); const m = f.find(x => x.includes(i)); return M.players[m[0]===i ? m[1] : m[0]]; }

/* ---------- pactes */
const mcAllied = (a, b) => M.pacts.some(x => (x.a===a && x.b===b) || (x.a===b && x.b===a));
const mcAllies = p => M.pacts.filter(x => x.a===p || x.b===p).map(x => x.a===p ? x.b : x.a);
function mcBreak(a, b){ M.pacts = M.pacts.filter(x => !((x.a===a && x.b===b) || (x.a===b && x.b===a))); }

/* ---------- effectif : les meilleurs jouent */
function mcLineup(p){
  ["G","F"].forEach(sl => {
    const all = mcRoster(p).filter(c => mcSlot(c)===sl).sort((a,b) => (mcPP(b)+(b.trait==="capitaine"?4:0)) - (mcPP(a)+(a.trait==="capitaine"?4:0)));
    p.team = p.team.filter(c => mcSlot(c)!==sl).concat(all.slice(0, MC_SLOTS[sl]));
    p.bench = p.bench.filter(c => mcSlot(c)!==sl).concat(all.slice(MC_SLOTS[sl]));
  });
  const notes = [];
  while(p.bench.length > MC.bench){ const w = [...p.bench].sort((a,b) => mcPP(a)-mcPP(b) || mcSellValue(a)-mcSellValue(b))[0]; const v = mcSell(p, w); notes.push(`${cardName(w.n)} vendu ${v} M€`); }
  return notes;
}
function mcPlace(p, c){ p.bench.push(c); return mcLineup(p); }

/* ---------- saison : pioche */
function mcSeasonStart(){
  const ev = M.events[M.season-1];
  M.susp = new Set(); M.won = {}; M.sel = {}; M.results = []; M.played = 0; M.bub = {}; M.show = []; M.si = 0; M.flash = null; M.aim = null; M.sheet = null; M.spy = null;
  M.pacts = M.pacts.filter(x => x.until >= M.season);
  M.players.forEach(p => {
    p.mod = 0; p.mods = [];
    if(ev==="inflation") p.money = Math.max(0, p.money - 2*p.team.length);
    mcRoster(p).forEach(c => { if(c.kind==="pepite") c.age += p.power==="formateur" ? 2 : 1; });
    if(p.bot){ mcDraw(p, MC.draw); mcRoster(p).filter(c => c.kind==="pepite" && c.age>=4 && (p.prof==="D" || p.money < 15)).forEach(c => mcSell(p, c)); }
    mcLineup(p);
  });
  const n = MC.market + (ev==="fou" ? 2 : 0);
  M.market = M.deck.splice(0, n);
  if(!M.market.some(c => c.kind==="legend")){ const i = M.deck.findIndex(c => c.kind==="legend"); if(i>=0) M.market[M.market.length-1] = M.deck.splice(i, 1)[0]; }
  M.drawn = null; M.phase = "draw"; mcR();
}
function mcDrawMine(){ const me = mcMe(), n = me.power==="mediatique" ? 3 : MC.draw; mcDraw(me, n); M.drawn = me.hand.slice(-n); mcSfx("card"); mcR("draw"); }

/* ---------- valeur pour un ordinateur (M€ qu'il est prêt à payer) */
function mcWtp(p, c){
  const left = MC.seasons - M.season + 1, hard = M.diff==="hard", easy = M.diff==="easy";
  const tr = {capitaine:4, clutch:M.season>=4 ? 4 : 1, fragile:-2, ego:-1, fidele:1}[c.trait] || 0;
  let pp = c.kind==="pepite" ? [3,6,9,9,9,9].slice(0, left).reduce((a,b) => a+b, 0) + (left>3 ? MC.pepResale/0.35*0.5 : 0) : (c.pp+tr)*left;
  const syn = (p.team.filter(o => o.club===c.club).length*4 + p.team.filter(o => o.lg===c.lg && c.lg!=="pl").length*3) * left;
  pp += syn * (p.prof==="C" || hard ? 1 : 0.3);
  let m = 1;
  if(p.prof==="B") m = c.kind==="legend" ? 1.35 : (M.season < 5 ? 0.4 : 0.8);
  if(p.prof==="D") m = c.kind==="pepite" ? 1.5 : (c.kind==="legend" && p.money>35 ? 1.1 : 0.6);
  if(!mcFree(p, c)){
    const weak = p.team.filter(o => mcSlot(o)===mcSlot(c)).sort((a,b) => mcPP(a)-mcPP(b))[0];
    const gain = (c.kind==="pepite" ? 6 : c.pp) - mcPP(weak);
    m *= gain > 0 ? Math.min(1, 0.3 + gain/8) : (c.kind==="pepite" && p.bench.length < MC.bench ? 0.5 : 0.1);
  }
  let v = pp * ({easy:0.25, normal:0.42, hard:0.82}[M.diff]) * (hard ? Math.max(m, Math.min(0.85, m*2)) : m);
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
function mcBuy(w, c, price){
  w.money -= price; c.age = w.power==="formateur" && c.kind==="pepite" ? 1 : 0; c.boughtAt = M.season; M.won[c.uid] = w;
  w.buys.push({c, price, s:M.season}); return mcPlace(w, c);
}
function mcResolve(){
  const me = mcMe(), all = {};
  Object.entries(M.sel).forEach(([u, b]) => (all[u] ||= []).push([b, me]));
  M.players.forEach((p, i) => { if(p.bot) (M.botBids?.[i] || mcBotBids(p)).forEach(([u, b]) => (all[u] ||= []).push([b, p])); });
  M.botBids = null;
  const rk = mcRank();
  M.results = M.market.map(c => {
    const bl = (all[c.uid]||[]).sort((x,y) => y[0]-x[0] || rk.indexOf(y[1])-rk.indexOf(x[1]));
    if(!bl.length) return {c, bids:[], w:null};
    let price, w = bl[0][1];
    if(bl.length===1) price = c.price;
    else { price = Math.max(c.price, Math.min(bl[0][0], bl[1][0] + MC.fee)); bl.slice(1).forEach(([, l]) => { l.money -= MC.fee; }); }
    if(w.power==="negociateur") price = Math.max(1, price - 2);
    if(w.money >= price){ const notes = mcBuy(w, c, price); return {c, bids:bl, w, price, starter:w.team.includes(c), notes}; }
    return {c, bids:bl, w:null};
  });
  M.sel = {}; M.phase = "reveal"; mcSfx("env"); mcR("reveal");
}

/* ---------- mercato d'hiver flash : une Légende aux enchères en direct */
let MC_FLASH_T = null;
function mcFlashStart(){
  const i = M.deck.findIndex(c => c.kind==="legend"); if(i<0) return mcGoCoups();
  const c = M.deck.splice(i, 1)[0], start = Math.max(10, c.price - 12);
  const max = {}; M.players.forEach((p, k) => { if(p.bot) max[k] = Math.min(p.money, Math.round(mcWtp(p, c) * (0.85 + M.r()*0.3))); });
  M.flashA = {c, start, price:start, in:M.players.map((p, k) => p.bot ? max[k] >= start : p.money >= start), max, w:null};
  M.phase = "flash"; mcR();
  if(!mcFlashCheck()){ mcStopFlash(); MC_FLASH_T = setInterval(mcFlashTick, 800); }
}
function mcStopFlash(){ if(MC_FLASH_T){ clearInterval(MC_FLASH_T); MC_FLASH_T = null; } }
/* renvoie true si l'enchère est terminée */
function mcFlashCheck(prev){
  const F = M.flashA, still = F.in.map((x,k) => x ? k : -1).filter(k => k>=0);
  if(still.length > 1) return false;
  mcStopFlash();
  let wi = still.length ? still[0] : null;
  if(wi==null && prev){ const cand = prev.map((x,k) => x ? k : -1).filter(k => k>=0 && M.players[k].bot); if(cand.length) wi = cand.sort((a,b) => F.max[b]-F.max[a])[0]; }
  if(wi!=null){ const w = M.players[wi], paid = Math.min(w.money, Math.max(F.start, F.price - 1)); F.w = w; F.paid = paid; mcBuy(w, F.c, paid); mcSfx(w===mcMe() ? "win" : "hit"); }
  F.done = true; mcR("bub"); return true;
}
function mcFlashTick(){
  if(!M || M.phase!=="flash" || M.flashA.done){ mcStopFlash(); return; }
  const F = M.flashA, prev = [...F.in];
  F.price++;
  M.players.forEach((p, k) => { if(!F.in[k]) return; if(p.bot && F.max[k] < F.price){ F.in[k] = false; mcSay(p, `Je lâche`, "no"); } if(!p.bot && p.money < F.price) F.in[0] = false; });
  if(mcFlashCheck(prev)) return;
  mcSfx("tick"); mcR();
}
function mcFlashDrop(){ const F = M.flashA; if(F.done) return; const prev = [...F.in]; F.in[0] = false; mcSay(mcMe(), "Je lâche"); if(!mcFlashCheck(prev)) mcR(); }
function mcGoCoups(){ M.phase = "coups"; M.bub = {}; M.flash = null; mcR(); }

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
  if(st==="clause") return mcRoster(to).filter(c => c.kind!=="pepite" && c.trait!=="fidele" && c.boughtAt!==M.season && by.money >= c.price*2);
  if(st==="piston") return mcRoster(to).filter(c => M.won[c.uid]===to && c.trait!=="fidele" && c.locked!==M.season && by.money >= c.price+5);
  return [];
}
function mcCheck(by, st, to){
  const C = MC_CARDS[st];
  if(C.tg==="self") return null;
  if(!to || to===by) return "Choisis un adversaire.";
  if(st==="trahison") return mcAllied(by, to) ? null : "Tu n'as pas de pacte avec lui.";
  if(mcAllied(by, to)) return "Vous avez un pacte : pas d'attaque entre alliés.";
  if(st==="pacte") return mcAllies(by).length || mcAllies(to).length ? "Un seul pacte à la fois." : null;
  if(C.pick && !mcTargets(by, st, to).length) return {scandale:"Il n'a aucun titulaire.", clause:"Aucun joueur à ta portée (argent ou 🔒 Fidèle).", piston:"Il n'a rien recruté que tu peux chiper."}[st];
  return null;
}
function mcApply(by, st, to, c){
  if(st==="prime"){ by.mod += 6; by.mods.push({t:"🏅 Prime", v:6}); return "+6 de force pour le match"; }
  if(st==="sponsor"){ by.money += 8; return "+8 M€ en caisse"; }
  if(st==="blinde"){ by.shield++; return "+1 bouclier"; }
  if(st==="formation"){ const i = M.deck.findIndex(c => c.kind==="pepite"); if(i<0) return "Plus de jeunes en stock"; const x = M.deck.splice(i, 1)[0]; x.age = by.power==="formateur" ? 1 : 0; x.boughtAt = M.season; mcPlace(by, x); return `${x.n} 🌱 rejoint le club`; }
  if(MC_CARDS[st].k==="bas"){ to.hit = true; by.bas++; }
  if(MC_CARDS[st].pick && !c) c = mcTargets(by, st, to).sort((a,b) => mcPP(b)-mcPP(a) || b.pp-a.pp)[0];
  if(st==="scandale"){ M.susp.add(c.uid); return `${c.n} suspendu pour ce match`; }
  if(st==="clause"){ const cost = c.price*2; by.money -= cost; to.money += cost; mcSell(to, c); to.money -= mcSellValue(c); mcLineup(to); mcPlace(by, c); return `${c.n} change de camp (${cost} M€)`; }
  if(st==="piston"){ const cost = c.price + 5; by.money -= cost; to.money += c.price;
    const inT = to.team.indexOf(c); if(inT>=0) to.team.splice(inT, 1); else to.bench.splice(to.bench.indexOf(c), 1); mcLineup(to);
    M.won[c.uid] = by; c.locked = M.season; mcPlace(by, c); return `${c.n} chipé (${cost} M€)`; }
  if(st==="fpf"){ const loss = Math.round(to.money*0.2); to.money -= loss; return `−${loss} M€ de trésorerie`; }
  if(st==="greve"){ to.mod -= 6; to.mods.push({t:"📢 Grève", v:-6}); return "−6 de force pour le match"; }
  if(st==="pacte"){ M.pacts.push({a:by, b:to, until:M.season + MC.pactLen - 1}); return `Pacte jusqu'à la saison ${M.season + MC.pactLen - 1}`; }
  if(st==="trahison"){ mcBreak(by, to); const v = Math.min(8, to.money); to.money -= v; by.money += v; to.mod -= 5; to.mods.push({t:"🗡️ Trahi", v:-5}); by.betrayed++; return `${v} M€ volés et −5 de force pour la victime`; }
}
const mcShieldable = st => MC_CARDS[st].k==="bas" || st==="trahison";
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
    const last = mcRank().at(-1)===to, lead = mcRank()[0]===me, p = {easy:0.75, normal:0.55, hard:0.4}[M.diff] + (last ? 0.2 : 0) - (lead && M.diff!=="easy" ? 0.3 : 0);
    if(M.r() < p){ M.flash = mcAct_(me, st, to, mcApply(me, st, to)); mcSay(to, "🤝 Marché conclu !", "ok"); mcSfx("coin"); }
    else { M.flash = mcAct_(me, st, to, `${to.n} refuse : « Toi, t'es trop fort… »`, "refused"); mcSay(to, "Non merci 😏", "no"); mcSfx("block"); }
    return mcR("bub");
  }
  if(to && mcShieldable(st) && to.shield>0 && M.r() < (M.diff==="easy" ? 0.35 : M.diff==="normal" ? 0.6 : 0.8)){
    to.shield--; mcSay(to, "🛡️ Bloqué !", "ok"); M.flash = mcAct_(me, st, to, `${to.n} sort son Contrat Blindé : coup annulé`, "blocked"); mcSfx("block"); return mcR("bub"); }
  const out = mcApply(me, st, to, c);
  if(to) mcSay(to, `${C.ic} aïe`, "hit");
  M.flash = mcAct_(me, st, to, out); mcSfx(to ? "hit" : "coin");
  mcR("bub");
}

/* ---------- ordinateurs : jouer leurs cartes */
function mcBotsStart(){ M.queue = mcRank().reverse().filter(p => p.bot); M.qi = 0; M.bub = {}; M.flash = null; M.show = []; mcBotsStep(); }
function mcBotsStep(){
  while(M.qi < M.queue.length){ const r = mcBotTurn(M.queue[M.qi]); if(r==="wait") return; M.qi++; }
  M.si = 0; M.phase = "after"; if(M.show.length) mcSfx(M.show[0].res==="ok" && M.show[0].to ? "hit" : "card"); mcR("act");
}
const mcCoalition = () => M.diff!=="easy" && mcRank()[0]===mcMe() && M.season>=2;
function mcBotTarget(p, st){
  let rivals = M.players.filter(q => q!==p && !mcCheck(p, st, q));
  if(!rivals.length) return null;
  const me = mcMe();
  if(st==="pacte"){
    if(mcCoalition()){ const b = rivals.filter(q => q.bot); if(b.length) return b[0]; }
    const rk = mcRank(); return M.diff==="hard" ? rivals.sort((a,b) => rk.indexOf(b)-rk.indexOf(a))[0] : rivals[Math.floor(M.r()*rivals.length)];
  }
  if(mcCoalition() && rivals.includes(me) && M.r() < (M.diff==="hard" ? 0.85 : 0.55)) return me;
  if(M.diff==="easy") return rivals[Math.floor(M.r()*rivals.length)];
  const opp = mcOpp(p); if(rivals.includes(opp) && M.r() < 0.5) return opp; // il affaiblit son adversaire du jour
  if(M.diff==="normal" && p.prof!=="A" && M.r()<0.4) return rivals[Math.floor(M.r()*rivals.length)];
  return mcRank().find(q => rivals.includes(q));
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
    if(to && !to.bot && (st==="pacte" || (mcShieldable(st) && to.shield>0))){ M.pending = {by:p, st, to}; M.phase = st==="pacte" ? "offer" : "react"; mcSfx(st==="pacte" ? "card" : "hit"); mcR(); return "wait"; }
    if(st==="pacte"){ const yes = M.r() < (mcCoalition() ? 0.9 : 0.6);
      if(yes){ const co = mcCoalition(), out = mcApply(p, st, to); M.show.push(mcAct_(p, st, to, co ? "Alliance contre le leader ! " + out : out)); }
      else M.show.push(mcAct_(p, st, to, `${to.n} refuse`, "refused")); continue; }
    if(to && mcShieldable(st) && to.shield>0 && M.r()<0.5){ to.shield--; M.show.push(mcAct_(p, st, to, `${to.n} sort son Contrat Blindé : coup annulé`, "blocked")); continue; }
    M.show.push(mcAct_(p, st, to, mcApply(p, st, to)));
  }
  p._n = 0;
}
function mcAnswer(yes){
  const {by, st, to} = M.pending; M.pending = null;
  if(st==="pacte"){ if(yes) M.show.push(mcAct_(by, st, to, mcApply(by, st, to))); else M.show.push(mcAct_(by, st, to, "Tu refuses le pacte", "refused")); }
  else if(yes){ to.shield--; mcSfx("block"); M.show.push(mcAct_(by, st, to, "Ton Contrat Blindé annule le coup", "blocked")); }
  else M.show.push(mcAct_(by, st, to, mcApply(by, st, to)));
  M.phase = "botsplay";
  const r = mcBotTurn(by); if(r==="wait") return;
  M.qi++; mcBotsStep();
}

/* ---------- force de l'équipe et match */
function mcForce(p, absent=new Set()){
  const ev = M.events[M.season-1];
  let alive = p.team.filter(c => !M.susp.has(c.uid) && !absent.has(c.uid)), injured = null;
  if(ev==="blessures" && alive.length){ injured = alive.reduce((a,b) => mcPP(b)>mcPP(a) ? b : a); alive = alive.filter(c => c!==injured); }
  const lines = [{t:"Joueurs", v:alive.reduce((s,c) => s + mcPP(c), 0)}];
  if(alive.some(c => c.trait==="capitaine")) lines.push({t:"🎖️ Capitaine", v:4});
  const egos = p.bench.filter(c => c.trait==="ego").length; if(egos) lines.push({t:"😤 Ego sur le banc", v:-3*egos});
  if(ev==="jeunesse"){ const j = alive.filter(c => c.kind==="pepite").length*3; if(j) lines.push({t:"🌱 Jeunesse", v:j}); }
  const leg = alive.some(c => c.kind==="legend"), mult = (leg ? MC.legendMult : 1) * (p.power==="tacticien" ? 1.5 : 1), star = leg ? " ⭐" : "";
  const club = Object.entries(mcCount(alive.map(c => c.club))).sort((a,b) => b[1]-a[1])[0];
  if(club && club[1]>=2){ const v = (club[1]>=3 ? MC.trio : MC.duo) * (ev==="derby"?2:1); lines.push({t:`${club[1]>=3?"Trio":"Duo"} ${club[0]}${star}`, v:Math.round(v*mult)}); }
  const lg = Object.entries(mcCount(alive.filter(c => c.lg!=="pl").map(c => c.lg))).find(([, n]) => n>=3);
  if(lg) lines.push({t:`Trio ${LG_AB[lg[0]]||lg[0]}${star}`, v:Math.round(MC.league*(ev==="europe"?2:1)*mult)});
  p.mods.forEach(m => lines.push(m));
  if(mcAllies(p).length) lines.push({t:"🤝 Pacte", v:MC.pactPP});
  return {lines, total:Math.max(1, lines.reduce((s,x) => s+x.v, 0)), injured, alive};
}
function mcSimMatch(a, b){
  const r = M.r, abs = p => new Set(p.team.filter(c => c.trait==="fragile" && r() < 0.25).map(c => c.uid));
  const xa = abs(a), xb = abs(b), fa = mcForce(a, xa), fb = mcForce(b, xb);
  const ev = [];
  [[a, xa], [b, xb]].forEach(([p, x]) => x.forEach(u => { const c = p.team.find(o => o.uid===u); ev.push({min:0, p, t:`🩹 ${cardName(c.n)} forfait`}); }));
  if(fa.injured) ev.push({min:0, p:a, t:`🚑 ${cardName(fa.injured.n)} blessé`}); if(fb.injured) ev.push({min:0, p:b, t:`🚑 ${cardName(fb.injured.n)} blessé`});
  const pa = Math.pow(fa.total, 1.6) / (Math.pow(fa.total, 1.6) + Math.pow(fb.total, 1.6));
  const n = 6 + Math.floor(r()*4), mins = Array.from({length:n}, () => 2 + Math.floor(r()*88)).sort((x,y) => x-y);
  let ga = 0, gb = 0;
  const shooter = (p, F) => { const pool = F.alive.filter(c => c.pos!=="G"); if(!pool.length) return null; const w = pool.map(c => mcPP(c) + ({ATT:8, MIL:4, DEF:1}[c.pos]||1)); let x = r()*w.reduce((s,v) => s+v, 0); for(let k=0;k<pool.length;k++){ x -= w[k]; if(x<=0) return pool[k]; } return pool[0]; };
  mins.forEach(min => {
    const att = r() < pa ? a : b, F = att===a ? fa : fb, D = att===a ? fb : fa, def = att===a ? b : a;
    const s = shooter(att, F); if(!s) return;
    const gk = D.alive.find(c => c.pos==="G");
    const pg = 0.3 + 0.15*Math.min(1, F.total/Math.max(1, D.total)) - (gk ? 0.05 : -0.15);
    if(r() < pg){ if(att===a) ga++; else gb++; M.goals[s.uid] = M.goals[s.uid] || {c:s, n:0, p:att}; M.goals[s.uid].n++; ev.push({min, p:att, t:`${cardName(s.n)}`, goal:true}); }
    else ev.push({min, p:att, t: gk && r()<0.6 ? `Arrêt de ${cardName(gk.n)} devant ${cardName(s.n)}` : `${cardName(s.n)} manque le cadre`});
  });
  return {a, b, ga, gb, fa, fb, ev};
}
function mcRecord(m){
  const k = M.season===MC.seasons ? 2 : 1;
  const set = (p, f, c) => { p.gf += f; p.ga += c; if(f>c){ p.w++; p.pts += 3*k; p.form.push("V"); } else if(f===c){ p.d++; p.pts += k; p.form.push("N"); } else { p.l++; p.form.push("D"); } };
  set(m.a, m.ga, m.gb); set(m.b, m.gb, m.ga);
}
function mcMatch(){
  const ev = M.events[M.season-1], me = mcMe();
  M.before = mcRank();
  M.matches = M.fixtures[M.season-1].map(([i,j]) => mcSimMatch(M.players[i], M.players[j]));
  M.matches.forEach(mcRecord);
  // mon match d'abord, côté gauche
  const mine = M.matches.find(m => m.a===me || m.b===me);
  if(mine.b===me) Object.assign(mine, {a:mine.b, b:mine.a, ga:mine.gb, gb:mine.ga, fa:mine.fb, fb:mine.fa});
  M.mine = mine; M.other = M.matches.find(m => m!==mine);
  mcRank().forEach((p, k) => { p.money += Math.round(MC.prize[k+1] * (ev==="crise" ? 0.5 : 1)); });
  M.phase = "match"; M.bub = {}; M.flash = null; mcSfx("whistle");
  const goals = M.mine.ev.filter(e => e.goal).length;
  M.mine.ev.filter(e => e.goal).forEach((e, k) => setTimeout(() => { if(M && M.phase==="match") mcSfx(e.p===me ? "goal" : "hit"); }, 700 + mcEvDelay(M.mine.ev, e)*1000));
  setTimeout(() => { if(M && M.phase==="match") mcSfx("whistle"); }, 900 + mcEvDelay(M.mine.ev, null)*1000);
  mcR("match");
}
const mcEvDelay = (evs, e) => { const list = evs.filter(x => x.min>0); const i = e ? list.indexOf(e) : list.length; return 0.4 + Math.max(0, i)*0.7; };
function mcNext(){
  if(M.season < MC.seasons){ M.season++; mcSeasonStart(); return; }
  M.players.forEach(p => { p.secretOk = !!(p.secret && MC_SECRETS[p.secret].ok(p)); p.bonusSecret = p.secretOk ? MC.secretPts : 0; p.bonusMoney = Math.floor(p.money/MC.moneyPts); p.final = p.pts + p.bonusSecret + p.bonusMoney; });
  M.final = [...M.players].sort((a,b) => b.final-a.final || mcGD(b)-mcGD(a) || b.gf-a.gf);
  const me = mcMe(), rank = M.final.indexOf(me) + 1, won = rank===1;
  M.trophies = mcTrophies();
  const r = {mode:"mercato", diff:M.diff, solo:true, score:(5-rank)*2 + (M.diff==="hard"?2:M.diff==="normal"?1:0), total:null, won, found:[], pepites:[]};
  L.summary = Object.assign(recordGame(r), {r, coins:null, bonus:null});
  if(M.daily){ const k = todayKey(), b = PROFILE.best.mercatoDay; if(!b || b.day!==k || me.final > b.pts){ PROFILE.best.mercatoDay = {day:k, pts:me.final, rank}; saveProfile(); } }
  if(won){ setTimeout(() => celebrate("gold"), 300); mcSfx("win"); }
  (async () => { const s = L.summary, coins = await rewardGame(r.score, won); s.ref = LAST_REF; if(L.summary!==s || !M) return; s.coins = coins; mcR(); })();
  M.phase = "end"; mcR("end");
}
function mcTrophies(){
  const t = [], P = M.players;
  const top = Object.values(M.goals).sort((a,b) => b.n-a.n)[0];
  if(top) t.push({ic:"👟", t:"Soulier d'or", d:`${top.c.n} · ${top.n} but${top.n>1?"s":""}`, p:top.p});
  const bas = [...P].sort((a,b) => b.bas-a.bas)[0]; if(bas.bas) t.push({ic:"🗡️", t:"Roi des coups bas", d:`${bas.bas} coup${bas.bas>1?"s":""} bas`, p:bas});
  const flops = P.flatMap(p => p.buys.map(b => ({...b, p}))).filter(b => b.price >= 10).map(b => ({...b, ratio: b.price / Math.max(1, mcPP(b.c) + (M.goals[b.c.uid]?.n||0)*3)})).sort((a,b) => b.ratio-a.ratio)[0];
  if(flops) t.push({ic:"💸", t:"Flop du mercato", d:`${flops.c.n} payé ${flops.price} M€`, p:flops.p});
  const def = [...P].sort((a,b) => a.ga-b.ga)[0]; t.push({ic:"🧱", t:"Meilleure défense", d:`${def.ga} but${def.ga>1?"s":""} encaissé${def.ga>1?"s":""}`, p:def});
  const rich = [...P].sort((a,b) => b.money-a.money)[0]; t.push({ic:"💰", t:"Banquier", d:`${rich.money} M€ en caisse`, p:rich});
  return t;
}
async function mcShare(){
  const me = mcMe(), rank = M.final.indexOf(me)+1, medal = ["🥇","🥈","🥉","4️⃣"][rank-1];
  const text = `Mercato FC ${M.daily?"· partie du jour ":""}(${MC_DIFF[M.diff].t})\n${medal} ${rank===1?"Champion !":`${rank}ᵉ sur 4`} · ${me.final} pts · ${me.w}V ${me.d}N ${me.l}D\n${me.form.map(f => f==="V"?"🟩":f==="N"?"🟨":"🟥").join("")}\n${M.trophies.filter(x => x.p===me).map(x => x.ic+" "+x.t).join(" · ")}\nTu fais mieux ? ${SITE_URL}`;
  try{ if(navigator.share){ await navigator.share({text}); return; } }catch(e){ if(e && e.name==="AbortError") return; }
  try{ await navigator.clipboard.writeText(text); toast("Résultat copié, colle-le où tu veux", "ok"); }catch(e){ toast("Copie impossible sur cet appareil."); }
}

/* ======================================================================
   ÉCRANS
   ====================================================================== */
const MC_STEPS = [["draw","🃏","Pioche"],["mercato","✉️","Mercato"],["coups","🎭","Coups"],["match","⚽","Match"]];
function mcStepOf(ph){ return {draw:"draw", mercato:"mercato", reveal:"mercato", flash:"mercato", coups:"coups", botsplay:"coups", react:"coups", offer:"coups", after:"coups", match:"match"}[ph]; }
const mcTraitTag = c => c.trait ? `<span class="trait" title="${MC_TRAITS[c.trait].t}">${MC_TRAITS[c.trait].ic}</span>` : "";

function mcHandCard(st, i, {play=false, big=false, flip=false}={}){
  const C = MC_CARDS[st];
  return `<button class="mcc k-${C.k}${big?" big":""}${flip?" flip":""}${M.aim===i?" on":""}" ${play?`data-act="mccard" data-v="${i}"`:"disabled"} style="${flip?`animation-delay:${i*0.15}s`:""}">
    <span class="mcc-ic">${C.ic}</span><b>${C.t}</b>${big?`<small>${esc(C.d)}</small>${C.p?`<i>${esc(C.p)}</i>`:""}`:""}</button>`;
}
function mcMini(c, {act="", v="", cls=""}={}){
  const tag = act ? "button" : "span";
  return `<${tag} class="mini${M.susp.has(c.uid)?" susp":""}${cls}${M.sheet && M.sheet.u===c.uid?" on":""}" ${act?`data-act="${act}" data-v="${esc(v)}"`:""}>${cardHTML(c.id,{small:true})}<span class="mini-pp">${mcPP(c)}</span>${mcTraitTag(c)}${M.susp.has(c.uid)?`<span class="mini-x">📸</span>`:""}</${tag}>`;
}
function mcLine(p, act){
  const g = p.team.filter(c => c.pos==="G"), f = p.team.filter(c => c.pos!=="G");
  const empty = n => Array(Math.max(0,n)).fill(`<span class="mini empty"></span>`).join("");
  return `<div class="line5">${g.map(c => mcMini(c, {act, v:c.uid})).join("")}${empty(1-g.length)}${f.map(c => mcMini(c, {act, v:c.uid})).join("")}${empty(4-f.length)}
    <span class="line-sep"></span>${p.bench.map(c => mcMini(c, {act, v:c.uid, cls:" bn"})).join("")}${Array(Math.max(0, MC.bench-p.bench.length)).fill(`<span class="mini empty bn"></span>`).join("")}</div>`;
}
function mcSeat(p){
  const i = mcIdx(p), me = mcMe(), b = M.bub[i], rk = mcRank().indexOf(p)+1;
  const aimSt = M.aim!=null ? me.hand[M.aim] : null, ok = aimSt && !mcCheck(me, aimSt, p);
  const env = M.phase==="mercato" && M.botBids ? (M.botBids[i]||[]).length : 0;
  const act = M.phase==="after" && M.show[M.si], hl = act && (act.by===p ? " actor" : act.to===p ? " victim" : "");
  const vs = M.phase!=="end" && M.fixtures && mcOpp(me)===p, fl = M.phase==="flash" && M.flashA;
  return `<button class="seat${ok?" aim":""}${aimSt && !ok?" dim":""}${mcAllied(me, p)?" ally":""}${hl||""}${fl && !M.flashA.in[i]?" out":""}" style="--pc:${p.col}" ${ok?`data-act="mcaim" data-v="${i}"`:aimSt?`data-act="mcaimno" data-v="${i}"`:`data-act="mcpeek" data-v="${i}"`}>
    <span class="seat-rk">${rk}ᵉ</span>${vs?`<span class="seat-vs">VS</span>`:""}
    <span class="seat-av">${p.ic}</span>
    <b>${esc(mcShort(p))}</b>
    <span class="seat-pp">${p.pts}<small> pts</small></span>
    <span class="seat-m">💪 ${mcForce(p).total} · ${p.money} M€</span>
    <span class="seat-row">${p.hand.map(() => `<i class="bk"></i>`).join("")}${p.shield?`<i class="sh">🛡️${p.shield>1?p.shield:""}</i>`:""}${mcAllies(p).length?`<i class="pc">🤝${mcAllies(p).map(q => q.ic).join("")}</i>`:""}</span>
    ${env?`<span class="seat-env">${"✉️".repeat(env)}</span>`:""}
    ${M.spy && M.spy.p===p && M.phase==="mercato"?`<span class="bub ok">🎲 ${M.spy.bid} M€ sur ${esc(cardName(M.spy.c.n))}</span>`:b?`<span class="bub ${b.cls}${M.fx==="bub"?" pop":""}">${esc(b.t)}</span>`:""}
  </button>`;
}
function mcActHTML(a, anim){
  const C = MC_CARDS[a.st], av = p => `<span class="act-av" style="--pc:${p.col}"><span>${p.ic}</span><small>${esc(mcShort(p))}</small></span>`;
  return `<div class="act res-${a.res}${anim?" in":""}">
    <div class="act-row">${av(a.by)}<span class="act-card k-${C.k}">${C.ic}</span>${a.to?av(a.to):""}</div>
    <b>${esc(mcName(a.by))} ${a.by.bot?"joue":"joues"} ${C.t}</b>
    <p class="act-out">${a.res==="blocked"?"🛡️ ":a.res==="refused"?"✋ ":"→ "}${esc(a.out)}</p>
    ${C.p && a.res==="ok"?`<i>${esc(C.p)}</i>`:""}</div>`;
}
function mcTable(center, dockHtml="", cls=""){
  const me = mcMe(), ev = M.events[M.season-1], step = mcStepOf(M.phase), si = MC_STEPS.findIndex(s => s[0]===step), opp = mcOpp(me), fin = M.season===MC.seasons;
  const showHand = ["draw","coups"].includes(M.phase);
  return `<div class="mct ${cls}">
   <div class="mct-top"><button class="iconbtn" data-act="quit" aria-label="Quitter">${ICON.back}</button>
    <span class="mct-season">J${M.season}<small>/6</small></span>
    <button class="mct-ev" data-act="mcevent">${MC_EVENTS[ev].ic} ${MC_EVENTS[ev].t}</button>
    <button class="iconbtn mct-help" data-act="mcmute" aria-label="Son">${PROFILE.best.mcMute?"🔇":"🔊"}</button>
    <button class="iconbtn mct-help" data-act="mcrules" aria-label="Règles">?</button></div>
   <div class="seats">${M.players.slice(1).map(mcSeat).join("")}</div>
   <div class="fixture${fin?" final":""}"><span>${fin?"🏆 Dernière journée · points ×2":"Prochain match"}</span><b><i style="--pc:${me.col}">${me.ic}</i> Toi <em>${mcForce(me).total}</em> <u>vs</u> <em>${mcForce(opp).total}</em> ${esc(mcShort(opp))} <i style="--pc:${opp.col}">${opp.ic}</i></b></div>
   <div class="steps">${MC_STEPS.map((s,k) => `<span class="${k<si?"done":k===si?"cur":""}">${s[1]} ${s[2]}</span>`).join("")}</div>
   <div class="mct-c">${center}</div>
   <div class="me-zone" style="--pc:${me.col}">
    <div class="me-bar"><span class="seat-av me">${me.power?MC_POWERS[me.power].ic:me.ic}</span><span class="me-st"><b>${me.pts} pts</b><small>${mcRank().indexOf(me)+1}ᵉ · ${me.money} M€ · 💪 ${mcForce(me).total}</small></span>
     <span class="me-form">${me.form.slice(-5).map(f => `<i class="f-${f}">${f}</i>`).join("")}</span>
     ${me.shield?`<span class="me-sh">🛡️${me.shield>1?" "+me.shield:""}</span>`:""}${mcAllies(me).length?`<span class="me-sh">🤝${mcAllies(me).map(q => q.ic).join("")}</span>`:""}
     <button class="me-secret" data-act="mcsecretpeek" aria-label="Objectif secret">🔒</button></div>
    <button class="me-line" data-act="mcteam">${mcLine(me)}</button>
    ${showHand ? `<div class="hand">${me.hand.length ? me.hand.map((st, i) => mcHandCard(st, i, {play:M.phase==="coups", flip:M.fx==="draw" && i>=me.hand.length-(M.drawn||[]).length})).join("") : `<span class="hand-empty">Main vide</span>`}</div>` : ""}
   </div>
   ${dockHtml?dock(dockHtml):""}
   ${mcSheet()}
  </div>`;
}
function mcLeague(compact){
  const rk = mcRank(), before = M.before || rk;
  return `<div class="league">${rk.map((p,k) => { const mv = before.indexOf(p) - k;
    return `<div class="lg-r${p.bot?"":" me"}" style="--pc:${p.col}"><span class="lg-pos">${k+1}</span><span class="lg-av">${p.ic}</span><b>${esc(mcShort(p))}</b>
      <span class="lg-mv">${mv>0?"▲":mv<0?"▼":""}</span>${compact?"":`<span class="lg-f">${p.form.slice(-3).map(f => `<i class="f-${f}"></i>`).join("")}</span>`}
      <span class="lg-gd">${mcGD(p)>0?"+":""}${mcGD(p)}</span><span class="lg-pts">${p.pts}</span></div>`; }).join("")}</div>`;
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
      <div class="tgt-grid">${list.map(c => `<button class="tgt" data-act="mcpicktgt" data-v="${c.uid}">${cardHTML(c.id,{small:true})}${mcTraitTag(c)}<span>${mcPP(c)} force${st==="clause"?` · ${c.price*2} M€`:st==="piston"?` · ${c.price+5} M€`:""}</span></button>`).join("")}</div>`; }
  if(s.t==="bid"){ const c = M.market.find(x => x.uid===s.u), b = M.sel[s.u] ?? c.price, used = Object.entries(M.sel).filter(([u]) => u!==s.u).reduce((a,[,v]) => a+v, 0);
    const weak = !mcFree(me, c) ? me.team.filter(o => mcSlot(o)===mcSlot(c)).sort((a,b) => mcPP(a)-mcPP(b))[0] : null;
    body = `<div class="bid-head">${cardHTML(c.id,{small:true})}<div><b>${esc(c.n)}</b><small>${MC_POS_FR[c.pos]} · ${c.kind==="legend"?"Légende ⭐":c.kind==="pepite"?"Pépite 🌱 3 → 6 → 9":"Régulier"} · ${esc(c.club)}</small><span class="bid-pp">${c.kind==="pepite"?"3":c.pp}<small> de force</small></span>
      ${c.trait?`<span class="trait-l">${MC_TRAITS[c.trait].ic} <b>${MC_TRAITS[c.trait].t}</b> · ${MC_TRAITS[c.trait].d}</span>`:""}
      <small>${mcFree(me, c)?"✅ Place libre chez les titulaires":weak && mcPP(weak) < (c.kind==="pepite"?3:c.pp)?`🔄 Remplacerait ${esc(cardName(weak.n))} (${mcPP(weak)})`:"🪑 Irait sur le banc"}</small></div></div>
      <div class="bid-dial"><button data-act="mcbid" data-v="-5">−5</button><button data-act="mcbid" data-v="-1">−</button><b>${b}<small> M€</small></b><button data-act="mcbid" data-v="1">+</button><button data-act="mcbid" data-v="5">+5</button></div>
      <p class="bid-note">Prix de base ${c.price} M€ · il te reste ${me.money - used} M€</p>
      <button class="btn" data-act="mcseal" data-v="${s.u}">✉️ Glisser mon offre (${b} M€)</button>
      ${!s.isNew?`<button class="btn ghost" data-act="mcunbid" data-v="${s.u}">Retirer l'offre</button>`:""}`; }
  if(s.t==="team"){ const sel = s.u && mcRoster(me).find(c => c.uid===s.u), sc = mcForce(me);
    body = `<h3>Mon équipe · 💪 ${sc.total}</h3>
      <div class="team-big">${mcLine(me, "mcchip")}</div>
      <div class="lines">${sc.lines.filter(x => x.v).map((x,k) => `<span class="${x.v<0?"neg":k?"bonus":""}">${esc(x.t)} ${x.v>0?"+":""}${x.v}</span>`).join("")}</div>
      ${sel?`<div class="chip-acts"><b>${esc(sel.n)}</b> · ${esc(sel.club)} · ${mcPP(sel)} de force${sel.trait?`<br>${MC_TRAITS[sel.trait].ic} ${MC_TRAITS[sel.trait].t} : ${MC_TRAITS[sel.trait].d}`:""}<div>${me.bench.includes(sel) && !mcFree(me, sel) && false?"":`<button class="btn ghost" data-act="mcmove" data-v="${sel.uid}">${me.bench.includes(sel)?"↑ Titulaire":"↓ Au banc"}</button>`}<button class="btn" data-act="mcsell" data-v="${sel.uid}">Vendre ${mcSellValue(sel)} M€</button></div></div>`
        :`<p class="bid-note">Touche un joueur pour le vendre ou le changer de place.<br>Combos : 2 du même club +4 · 3 du même club +10 · 3 d'un championnat étranger +8 · une Légende ×1,5.</p>`}`; }
  if(s.t==="secret"){ const k = me.secret; body = `<div class="secret-big">${MC_SECRETS[k].ic}<b>${MC_SECRETS[k].t}</b><small>${MC_SECRETS[k].d}</small><span>+${MC.secretPts} pts à la fin · ${MC_SECRETS[k].ok(me)?"✅ rempli pour l'instant":"pas encore"}</span></div>
      ${me.power?`<p class="bid-note">Ton pouvoir : ${MC_POWERS[me.power].ic} <b>${MC_POWERS[me.power].t}</b> — ${MC_POWERS[me.power].d}</p>`:""}`; }
  if(s.t==="peek"){ const p = M.players[s.i]; body = `<h3>${p.ic} ${esc(p.n)} · 💪 ${mcForce(p).total}</h3><p class="bid-note">${p.money} M€ · ${p.w}V ${p.d}N ${p.l}D · ${p.hand.length} carte${p.hand.length>1?"s":""} cachée${p.hand.length>1?"s":""} · objectif secret ?</p>
      <div class="team-big">${mcLine(p)}</div>`; }
  if(s.t==="event"){ const ev = M.events[M.season-1], nx = M.events[M.season];
    body = `<div class="secret-big">${MC_EVENTS[ev].ic}<b>${MC_EVENTS[ev].t}</b><small>${MC_EVENTS[ev].d}</small></div>${nx?`<p class="bid-note">Saison suivante : ${MC_EVENTS[nx].ic} <b>${MC_EVENTS[nx].t}</b> — ${MC_EVENTS[nx].d}</p>`:""}
      <h3 style="margin-top:6px">Classement</h3>${mcLeague()}`; }
  if(s.t==="rules") body = `<h3>Comment on joue</h3>${mcTutoSlides().map(x => `<p class="rule-l"><span>${x[0]}</span><span><b>${x[1]}</b><small>${x[2]}</small></span></p>`).join("")}
      <h3>Traits des joueurs</h3>${Object.values(MC_TRAITS).map(x => `<p class="rule-l"><span>${x.ic}</span><span><b>${x.t}</b><small>${x.d}</small></span></p>`).join("")}`;
  const an = M.fx==="sheet" ? " anim" : "";
  return `<div class="sheet-bg${an}" data-act="mcclose"></div><div class="sheet${an}">${body}</div>`;
}
function mcTutoSlides(){ return [
  ["🏟️","Un championnat à 4","Chaque saison, tu joues un match contre un président. Victoire 3 pts, nul 1. La dernière journée compte double."],
  ["⚽","Ton équipe à 5","1 gardien, 4 joueurs de champ, 2 remplaçants. Plus ta force est grande, plus tu marques."],
  ["✉️","Enchères à l'aveugle","Tu mises en secret. Le plus offrant gagne et paie la 2ᵉ offre + 1 M€. En hiver : une Légende aux enchères en direct !"],
  ["🃏","Cartes et trahisons","Bonus pour toi, coups bas pour eux, pactes… et trahisons au bon moment."],
  ["🏆","Le titre","À la fin : objectif secret +3 pts et 1 pt par tranche de 20 M€ en caisse."]]; }

function screenMercatoPick(){
  const b = PROFILE.best, day = b.mercatoDay && b.mercatoDay.day===todayKey() ? b.mercatoDay : null;
  return {key:"mercatoPick", html:`
  <div class="subhead"><button class="iconbtn" data-act="nav" data-v="home" aria-label="Retour">${ICON.back}</button><h1>Mercato FC</h1></div>
  <div class="mc-hero"><div class="mc-hero-row"><span class="mc-hero-av" style="--pc:#ff4d6d">🦈</span><span class="mc-hero-av" style="--pc:#3ed38f">🧮</span><span class="mc-hero-av" style="--pc:#a98bff">🎓</span><span class="mc-hero-av" style="--pc:#ff9f3a">🔍</span></div>
   <p class="mc-hero-t">Mercato FC</p><p>Enchères à l'aveugle, coups bas et trahisons.<br>6 journées pour décrocher le titre.</p></div>
  <button class="mc-daily" data-act="mcstart" data-v="normal" data-d="1"><span>🎯</span><span><b>Partie du jour</b><small>Même tirage pour tout le monde · niveau Moyen</small></span><em>${day?`${day.pts} pts`:"Jouer"}</em></button>
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
      <span class="eyebrow">1/2 · Ton objectif secret</span><h1 class="display">Choisis une carte</h1><p>Personne ne la verra. +3 pts si tu la remplis.</p>
      <div class="secret-pick">${M.secretChoice.map((k,i) => `<button class="secret-c" data-act="mcsecret" data-v="${k}" style="animation-delay:${i*0.2}s"><span>${MC_SECRETS[k].ic}</span><b>${MC_SECRETS[k].t}</b><small>${MC_SECRETS[k].d}</small></button>`).join("")}</div></div>`};
  if(M.phase==="power") return {key:"mcp-"+M.v, html:`<div class="tuto">
      <span class="eyebrow">2/2 · Quel président es-tu ?</span><h1 class="display">Ton pouvoir</h1>
      <div class="power-pick">${M.powerChoice.map((k,i) => `<button class="power-c" data-act="mcpower" data-v="${k}" style="animation-delay:${i*0.15}s"><span>${MC_POWERS[k].ic}</span><span><b>${MC_POWERS[k].t}</b><small>${MC_POWERS[k].d}</small></span></button>`).join("")}</div></div>`};

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
        return `<button class="mkt-c${b!=null?" bid":""}" data-act="mcopen" data-v="${c.uid}">${cardHTML(c.id,{small:true})}${mcTraitTag(c)}<span class="mkt-i"><b>${c.price}</b> M€ · 💪${c.kind==="pepite"?"3→9":c.pp}</span>${b!=null?`<span class="env">✉️ ${b}</span>`:""}</button>`; }).join("")}</div>`,
      `<button class="btn" data-act="mcresolve">${n?`Sceller ${n>1?"mes 2 offres":"mon offre"} ✉️`:"Passer ce mercato"}</button>`)};
  }
  if(M.phase==="reveal") return {key, html:mcTable(`<div class="reveal">${M.results.map((x, k) => `<div class="rv${x.w===me?" me":""}" style="animation-delay:${k*0.25}s;--pc:${x.w?x.w.col:"#fff3"}">
      <span class="rv-n"><b>${esc(cardName(x.c.n))} ${x.c.trait?MC_TRAITS[x.c.trait].ic:""}</b><small>${x.c.kind==="legend"?"⭐ ":x.c.kind==="pepite"?"🌱 ":""}base ${x.c.price} M€</small></span>
      <span class="rv-b">${x.bids.length?x.bids.map(([v,p], j) => `<i class="${j===0&&x.w?"win":""}">${p.ic} ${v}</i>`).join(""):`<i class="none">invendu</i>`}</span>
      ${x.w?`<span class="rv-w">${x.w.ic}<small>${x.price} M€</small></span>`:""}
      ${x.w===me?`<span class="rv-note">${x.starter?"✅ Titulaire":"🪑 Sur le banc"}${x.notes.length?" · "+esc(x.notes.join(", ")):""}</span>`:""}</div>`).join("")}</div>`,
      M.season===MC.flashSeason ? `<button class="btn flashbtn" data-act="mcflash">❄️ Mercato d'hiver flash !</button>` : `<button class="btn" data-act="mccoups">Aux coups bas 🎭</button>`)};
  if(M.phase==="flash"){ const F = M.flashA, c = F.c;
    return {key, html:mcTable(`<div class="flash"><span class="flash-t">❄️ Mercato d'hiver · enchères en direct</span>
      <div class="flash-c">${cardHTML(c.id,{small:true})}${mcTraitTag(c)}</div>
      <div class="flash-p${F.done?"":" tick"}"><b>${F.done && F.w ? F.paid : F.price}</b><small>M€</small></div>
      <div class="flash-in">${M.players.map((p,k) => `<span class="${F.in[k]?"in":"out"}" style="--pc:${p.col}">${p.ic}</span>`).join("")}</div>
      ${F.done?`<p class="mct-say">${F.w?`${F.w.ic} ${esc(mcName(F.w))} ${F.w.bot?"remporte":"remportes"} ${esc(c.n)} !`:"Personne n'en veut !"}</p>`:`<p class="mct-hint">Le prix monte… le dernier encore en lice l'emporte.</p>`}</div>`,
      F.done ? `<button class="btn" data-act="mccoups">Aux coups bas 🎭</button>` : F.in[0] ? `<button class="btn danger" data-act="mcflashdrop">✋ Je lâche !</button>` : `<button class="btn ghost" disabled>Tu es sorti…</button>`)}; }
  if(M.phase==="coups") return {key, html:mcTable(M.aim!=null
      ? `<p class="mct-say aimsay">${MC_CARDS[me.hand[M.aim]].ic} Touche un adversaire en haut</p><button class="linkbtn" data-act="mcaimcancel">Annuler</button>`
      : `${M.flash ? mcActHTML(M.flash, M.fx==="bub") : `<p class="mct-say">Joue jusqu'à 2 cartes</p><p class="mct-hint">Touche une carte de ta main ↓</p>${mcCoalition()?`<p class="coal">⚠️ Tu es en tête : les présidents se liguent contre toi</p>`:""}`}`,
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
  if(M.phase==="match"){ const m = M.mine, o = M.other, evs = m.ev.filter(e => e.min>0), pre = m.ev.filter(e => e.min===0), end = mcEvDelay(m.ev, null);
    const res = m.ga>m.gb ? "win" : m.ga===m.gb ? "draw" : "loss", anim = M.fx==="match";
    const side = p => p===m.a ? "l" : "r";
    let sa = 0, sb = 0;
    return {key, html:mcTable(`<div class="board${anim?" anim":""}">
       <div class="board-top">${M.season===MC.seasons?"🏆 Dernière journée · points ×2":`Journée ${M.season}`}</div>
       <div class="board-sc"><span class="crest" style="--pc:${m.a.col}">${m.a.ic}<small>Toi</small></span>
        <span class="score">${anim ? evs.filter(e => e.goal).length ? [0, ...evs.filter(e => e.goal)].map((e,k) => { if(e){ if(e.p===m.a) sa++; else sb++; } return `<b class="sc-step" style="animation-delay:${e?mcEvDelay(m.ev,e):0}s">${sa}<i>-</i>${sb}</b>`; }).join("") : `<b class="sc-step">0<i>-</i>0</b>` : `<b>${m.ga}<i>-</i>${m.gb}</b>`}</span>
        <span class="crest" style="--pc:${m.b.col}">${m.b.ic}<small>${esc(mcShort(m.b))}</small></span></div>
       <div class="board-f"><span>💪 ${m.fa.total}</span><span>💪 ${m.fb.total}</span></div>
       ${pre.map(e => `<p class="tl pre ${side(e.p)}">${esc(e.t)}</p>`).join("")}
       <div class="tl-list">${evs.map(e => `<p class="tl ${side(e.p)}${e.goal?" goal":""}" style="animation-delay:${mcEvDelay(m.ev,e)}s"><span class="tl-m">${e.min}'</span>${e.goal?"⚽ BUUUT ! ":""}${esc(e.t)}</p>`).join("")}</div>
       <div class="stamp s-${res}" style="animation-delay:${anim?end+0.4:0}s">${res==="win"?"VICTOIRE":res==="draw"?"MATCH NUL":"DÉFAITE"}</div>
      </div>
      <div class="after-match" style="animation-delay:${anim?end+0.8:0}s">
       <p class="other">Autre match : ${o.a.ic} ${esc(mcShort(o.a))} <b>${o.ga} - ${o.gb}</b> ${esc(mcShort(o.b))} ${o.b.ic}</p>
       ${mcLeague()}
      </div>`,
      `<button class="btn" data-act="mcnext">${M.season<MC.seasons?`Journée ${M.season+1} →`:"Remise du trophée 🏆"}</button>`, "is-match")}; }
  if(M.phase==="end"){ const meRank = M.final.indexOf(me)+1;
    return {key:"mcend-"+(L.summary&&L.summary.coins), html:`<div class="stack mc-end">
     <div class="hero"><span class="eyebrow">Mercato FC · ${M.daily?"Partie du jour":MC_DIFF[M.diff].t}</span><h1 class="display" style="font-size:clamp(34px,10vw,50px)">${meRank===1?`Champion <span>!</span> 🏆`:`${meRank}ᵉ <span>sur 4</span>`}</h1></div>
     <div class="finals">${M.final.map((p,k) => `<div class="fin${p.bot?"":" me"}" style="animation-delay:${k*0.2}s;--pc:${p.col}"><span class="fin-rk">${k+1}</span><span class="seat-av">${p.ic}</span>
       <span class="fin-t"><b>${esc(mcName(p))}</b><small>${p.pts} pts · ${p.w}V ${p.d}N ${p.l}D · ${MC_SECRETS[p.secret]?.ic||""} ${p.secretOk?`+${MC.secretPts}`:"✗"} · 💶 +${p.bonusMoney}</small></span><span class="fin-s">${p.final}</span></div>`).join("")}</div>
     <div class="trophies">${M.trophies.map((t,k) => `<div class="tro${t.p===me?" me":""}" style="animation-delay:${0.8+k*0.15}s"><span>${t.ic}</span><b>${t.t}</b><small>${esc(t.d)}</small><em>${t.p.ic} ${esc(mcShort(t.p))}</em></div>`).join("")}</div>
     <button class="btn ghost" data-act="mcshare">${ICON.share} Partager mon résultat</button>
     ${summaryBlock()}</div>
     ${dock(`<button class="btn" data-act="mcstart" data-v="${M.diff}" ${M.daily?'data-d="1"':""}>Rejouer</button><button class="btn ghost" data-act="nav" data-v="mercatoPick">Changer de niveau</button>`)}`};
  }
  return {key:"mc-x", html:""};
}

/* ---------- actions (appelées depuis app.js) */
function mcAct(a, v, el){
  if(a==="mcstart"){ mcSfx("tap"); return startMercato(v, {daily: !!(el && el.dataset && el.dataset.d)}); }
  if(!M) return;
  const me = mcMe();
  if(!["mcbid"].includes(a)) mcSfx("tap");
  switch(a){
    case "mctuto": if(M.tuto < mcTutoSlides().length-1){ M.tuto++; mcR(); } else { PROFILE.best.mercatoTuto2 = 1; saveProfile(); M.phase = "secret"; mcR(); } break;
    case "mctutoskip": PROFILE.best.mercatoTuto2 = 1; saveProfile(); M.phase = "secret"; mcR(); break;
    case "mcsecret": me.secret = v; M.phase = "power"; mcR(); break;
    case "mcpower": me.power = v; mcSeasonStart(); break;
    case "mcdraw": mcDrawMine(); break;
    case "mcgomkt": M.phase = "mercato"; M.drawn = null; M.botBids = M.players.map(p => p.bot ? mcBotBids(p) : null);
      if(me.power==="flambeur"){ const all = M.botBids.flatMap((b, i) => (b||[]).map(([u, bid]) => ({p:M.players[i], c:M.market.find(c => c.uid===u), bid}))); if(all.length) M.spy = all[Math.floor(M.r()*all.length)]; }
      mcR(); break;
    case "mcopen": {
      if(M.sel[v]==null && Object.keys(M.sel).length >= MC.buys) return toast("2 offres maximum par saison.");
      const c = M.market.find(x => x.uid===v), used = Object.entries(M.sel).filter(([u]) => u!==v).reduce((x,[,y]) => x+y, 0);
      if(M.sel[v]==null && me.money - used < c.price) return toast("Pas assez d'argent.");
      M.sheet = {t:"bid", u:v, isNew:M.sel[v]==null}; M.sel[v] = M.sel[v] ?? c.price; mcR("sheet"); break; }
    case "mcbid": { const u = M.sheet.u, c = M.market.find(x => x.uid===u), used = Object.entries(M.sel).filter(([k]) => k!==u).reduce((x,[,y]) => x+y, 0);
      M.sel[u] = Math.max(c.price, Math.min(me.money - used, M.sel[u] + (+v))); mcSfx("coin"); mcR(); break; }
    case "mcseal": M.sheet = null; mcSfx("env"); mcR(); break;
    case "mcunbid": delete M.sel[v]; M.sheet = null; mcR(); break;
    case "mcclose": if(M.sheet && M.sheet.t==="bid" && M.sheet.isNew) delete M.sel[M.sheet.u]; M.sheet = null; mcR(); break;
    case "mcresolve": mcResolve(); break;
    case "mcflash": mcFlashStart(); break;
    case "mcflashdrop": mcFlashDrop(); break;
    case "mccoups": mcStopFlash(); mcGoCoups(); break;
    case "mccard": M.aim = null; M.sheet = {t:"card", i:+v}; mcSfx("card"); mcR("sheet"); break;
    case "mcplay": mcPlay(+v); break;
    case "mcaim": mcPlay(M.aim, +v); break;
    case "mcpicktgt": mcPlay(M.sheet.i, M.sheet.seat, v); break;
    case "mcaimno": toast(mcCheck(me, me.hand[M.aim], M.players[+v]) || "Cible impossible."); break;
    case "mcaimcancel": M.aim = null; mcR(); break;
    case "mcendturn": M.aim = null; M.phase = "botsplay"; mcBotsStart(); break;
    case "mcanswer": mcAnswer(v==="1"); break;
    case "mcshownext": M.si++; { const x = M.show[M.si]; mcSfx(x.res==="blocked" ? "block" : x.to ? "hit" : "card"); } mcR("act"); break;
    case "mcmatch": mcMatch(); break;
    case "mcnext": mcNext(); break;
    case "mcshare": mcShare(); break;
    case "mcmute": PROFILE.best.mcMute = !PROFILE.best.mcMute; saveProfile(); mcR(); break;
    case "mcteam": M.sheet = {t:"team"}; mcR("sheet"); break;
    case "mcchip": M.sheet = {t:"team", u:M.sheet && M.sheet.u===v ? null : v}; mcR(); break;
    case "mcsell": { const c = mcRoster(me).find(x => x.uid===v); if(c){ const g = mcSell(me, c); mcLineup(me); mcSfx("coin"); toast(`${cardName(c.n)} vendu : +${g} M€`); M.sheet = {t:"team"}; mcR(); } break; }
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
