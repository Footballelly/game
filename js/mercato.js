/* Football Legends — MERCATO FC v6 : un championnat à 4 présidents, en solo contre 3 ordinateurs.
   Équipe à 5 (1 gardien + 4 joueurs de champ) et 2 remplaçants.
   Chaque journée : Infos (breaking news + pioche) → Mercato à l'aveugle → Bureau (offres, transferts, cartes) → Match.
   Économie vivante : chaque joueur a une cote qui bouge, les clubs touchent des revenus, on revend avec plus-value.
   Classement aux points (victoire 3, nul 1, dernière journée ×2) + objectif secret + valeur du club.
   Tout se joue sur l'appareil ; la fin de partie rapporte XP et pièces comme les autres modes. */
"use strict";

const MC = {
  seasons:6, budget:100, buys:2, market:6, handMax:3, plays:2, bench:2, deals:3,
  income:12, winBonus:6, drawBonus:2, tv:{1:0, 2:3, 3:6, 4:10}, trio:10, duo:4, league:8, legendMult:1.5,
  pepCurve:[3,6,9], bankRatio:0.8, secretPts:3, valuePts:50, fee:1, pactPP:4, pactLen:2, flashSeason:4, clauseMult:1.5
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
  negociateur:{ic:"🤝", t:"Le Négociateur", d:"−10 % sur tous tes achats au mercato."},
  tacticien:{ic:"📋", t:"Le Tacticien", d:"Tes combos rapportent 50 % de plus."},
  trader:{ic:"📈", t:"Le Trader", d:"Tu revends à la banque à 100 % de la cote (au lieu de 80 %)."}
};
const MC_TRAITS = {
  capitaine:{ic:"🎖️", t:"Capitaine", d:"+4 de force à l'équipe s'il est titulaire."},
  clutch:{ic:"⏰", t:"Clutch", d:"Force doublée en journées 5 et 6."},
  fragile:{ic:"🩹", t:"Fragile", d:"1 chance sur 4 de rater le match."},
  ego:{ic:"😤", t:"Ego", d:"−3 de force à l'équipe s'il est sur le banc."},
  fidele:{ic:"🔒", t:"Fidèle", d:"Pas à vendre, impossible à voler."}
};
const MC_CARDS = {
  prime:    {ic:"🏅", t:"Prime de match",   k:"bonus", tg:"self", d:"+6 de force pour ton prochain match."},
  blinde:   {ic:"🛡️", t:"Contrat Blindé",   k:"bonus", tg:"self", d:"+1 bouclier : annule un coup bas."},
  scandale: {ic:"📸", t:"Scandale",         k:"bas", tg:"seat", pick:true, d:"Un de ses titulaires est suspendu pour ce match.", p:"« Je n'ai rien contre lui, j'ai juste des photos. »"},
  clause:   {ic:"💼", t:"Clause libératoire", k:"bas", tg:"seat", pick:true, d:"Tu lui prends un joueur en payant 1,5× sa cote (l'argent va à lui).", p:"« Tout a un prix. Même la loyauté. »"},
  pacte:    {ic:"🤝", t:"Pacte",            k:"pacte", tg:"seat", d:"Alliance 2 journées : +4 de force chacun, pas d'attaque entre vous, transferts amicaux.", p:"« Ensemble, on est plus forts. »"},
  trahison: {ic:"🗡️", t:"Trahison",         k:"pacte", tg:"ally", d:"Romps ton pacte : tu lui voles 15 M€ et il perd 5 de force.", p:"« Rien de personnel. C'est le business. »"}
};
const MC_PDECK = {prime:5, blinde:3, scandale:6, clause:4, pacte:5, trahison:3};
const MC_SECRETS = {
  club3:{ic:"🏟️", t:"Esprit de clocher", d:"3 titulaires du même club.", ok:p => Math.max(0, ...Object.values(mcCount(p.team.map(c => c.club)))) >= 3},
  legend2:{ic:"🌟", t:"Galáctico", d:"Posséder 2 Légendes.", ok:p => mcRoster(p).filter(c => c.kind==="legend").length >= 2},
  trade:{ic:"📈", t:"Coup du siècle", d:"Revendre un joueur 30 M€ de plus que son prix d'achat.", ok:p => p.bestGain >= 30},
  rich:{ic:"💰", t:"Club en or", d:"Valeur du club de 250 M€ ou plus.", ok:p => mcValue(p) >= 250},
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
const mcValue = p => p.money + mcRoster(p).reduce((s,c) => s + c.val, 0);
const mcMe = () => M.players[0];
const mcIdx = p => M.players.indexOf(p);
const mcName = p => p.bot ? p.n : "Toi";
const mcShort = p => p.bot ? MC_BOTS.find(x => x.prof===p.prof).s : "Toi";
const mcBank = (p, c) => Math.round(c.val * (p.power==="trader" ? 1 : MC.bankRatio));
let M = null;

/* ---------- sons (synthétisés, aucun fichier à charger) */
let MC_AC = null;
function mcSfx(kind){
  if(PROFILE.best.mcMute) return;
  try{
    MC_AC = MC_AC || new (window.AudioContext || window.webkitAudioContext)();
    const ac = MC_AC, t = ac.currentTime;
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
    if(kind==="news") { tone(392, 0.15, "square", 0.07); tone(523, 0.15, "square", 0.07, 0.16); tone(784, 0.3, "square", 0.07, 0.32); }
    if(kind==="win") [523,659,784,1047].forEach((f,i) => tone(f, 0.35, "triangle", 0.1, i*0.12));
  }catch(e){}
}

/* ---------- paquets (tirage seedé pour la partie du jour) */
function mcDeck(r){
  const leg = CARDS.filter(c => c.r==="legend" || c.r==="icon"), rare = CARDS.filter(c => c.r==="rare"), com = CARDS.filter(c => c.r==="common");
  const tk = Object.keys(MC_TRAITS);
  const mk = (c, kind) => { const x = hashStr(c.id+"mc"); const base = {uid:uid(), id:c.id, n:c.n, club:c.c, lg:c.lg, pos:MC_POS[c.p]||"MIL", kind, age:0,
      trait: kind!=="pepite" && x%100 < 35 ? tk[(x>>8) % tk.length] : null};
    let o;
    if(kind==="legend") o = {...base, price:40 + x%16, pp:20 + x%9};
    else if(kind==="pepite") o = {...base, price:3 + x%3, pp:0};
    else o = {...base, price:(c.r==="rare"?18:12) + x%7, pp:(c.r==="rare"?9:7) + x%3};
    o.val = o.price; return o; };
  const pick = (arr, n) => mcShuffle([...arr], r).slice(0, n);
  const used = new Set(), out = [];
  pick(leg, 16).forEach(c => { used.add(c.id); out.push(mk(c, "legend")); });
  pick([...rare, ...com].filter(c => !used.has(c.id)), 60).forEach(c => { used.add(c.id); out.push(mk(c, "regular")); });
  pick(com.filter(c => !used.has(c.id)), 30).forEach(c => out.push(mk(c, "pepite")));
  return mcShuffle(out, r);
}
function mcPdeck(r){ return mcShuffle(Object.entries(MC_PDECK).flatMap(([k, n]) => Array(n).fill(k)), r); }
function mcDraw(p, n){ const got = []; for(let k=0;k<n;k++){ if(!M.pdeck.length) M.pdeck = mcPdeck(M.r); const c = M.pdeck.pop(); p.hand.push(c); got.push(c); } while(p.hand.length > MC.handMax) p.hand.shift(); return got; }

/* ---------- démarrage */
function startMercato(diff, opt={}){
  leaveGame(false, true); mcStopFlash();
  const daily = !!opt.daily, sr = rng(daily ? hashStr("mercato6"+todayKey()) : Date.now() % 1e9);
  const r = rng((Date.now() ^ 0x5bd1e995) % 1e9);
  const bots = mcShuffle([...MC_BOTS], sr).slice(0, 3);
  const mkP = (n, ic, prof, bot, col) => ({n, ic, prof, bot, col, money:MC.budget, team:[], bench:[], hand:[], shield:1, pts:0, gf:0, ga:0, w:0, d:0, l:0, form:[],
    secret:null, power:null, hit:false, betrayed:0, bas:0, mod:0, mods:[], buys:[], bestGain:0, grudge:null, mission:false, income:0, res:null});
  M = {diff, daily, r, v:0, season:1, deck:mcDeck(sr), pdeck:mcPdeck(sr), players:[mkP(PROFILE.name || "Toi", "⭐", "me", false, "#ffd23f"), ...bots.map(b => mkP(b.n, b.ic, b.prof, true, b.col))],
       phase:(PROFILE.best.mercatoTuto3 ? "secret" : "tuto"), tuto:0, market:[], won:{}, susp:new Set(), sel:{}, results:[], pacts:[], bub:{}, show:[], si:0, flash:null,
       sheet:null, aim:null, played:0, fx:null, goals:{}, flashA:null, inbox:[], news:null, buys:MC.buys, deals:0, drawn:[], moves:[]};
  const rounds = mcShuffle([[[0,1],[2,3]], [[0,2],[1,3]], [[0,3],[1,2]]], sr); M.fixtures = [...rounds, ...rounds];
  M.newsPlan = [null, ...mcShuffle(Object.keys(MC_NEWS), sr).slice(0, MC.seasons-1)];
  const keys = Object.keys(MC_SECRETS), pk = Object.keys(MC_POWERS);
  M.players.forEach((p, k) => { mcDraw(p, 1); const two = mcShuffle([...keys], sr).slice(0, 2); if(k===0) M.secretChoice = two; else p.secret = two[0]; });
  M.powerChoice = mcShuffle([...pk], sr).slice(0, 3);
  VIEW = "mercato"; mcR();
}
function mcR(fx){ M.v++; M.fx = fx || null; render(true); M.fx = null; }
const mcGD = p => p.gf - p.ga;
function mcRank(){ return [...M.players].sort((a,b) => b.pts-a.pts || mcGD(b)-mcGD(a) || b.gf-a.gf || mcValue(b)-mcValue(a)); }
function mcSay(p, t, cls=""){ M.bub[mcIdx(p)] = {t, cls}; }
function mcOpp(p){ const f = M.fixtures[M.season-1], i = mcIdx(p); const m = f.find(x => x.includes(i)); return M.players[m[0]===i ? m[1] : m[0]]; }

/* ---------- pactes */
const mcAllied = (a, b) => M.pacts.some(x => (x.a===a && x.b===b) || (x.a===b && x.b===a));
const mcAllies = p => M.pacts.filter(x => x.a===p || x.b===p).map(x => x.a===p ? x.b : x.a);
function mcBreak(a, b){ M.pacts = M.pacts.filter(x => !((x.a===a && x.b===b) || (x.a===b && x.b===a))); }

/* ---------- effectif : les meilleurs jouent, le banc trop plein est vendu à la banque */
function mcLineup(p){
  ["G","F"].forEach(sl => {
    const all = mcRoster(p).filter(c => mcSlot(c)===sl).sort((a,b) => (mcPP(b)+(b.trait==="capitaine"?4:0)) - (mcPP(a)+(a.trait==="capitaine"?4:0)));
    p.team = p.team.filter(c => mcSlot(c)!==sl).concat(all.slice(0, MC_SLOTS[sl]));
    p.bench = p.bench.filter(c => mcSlot(c)!==sl).concat(all.slice(MC_SLOTS[sl]));
  });
  const notes = [];
  while(p.bench.length > MC.bench){ const w = [...p.bench].sort((a,b) => mcPP(a)-mcPP(b) || a.val-b.val)[0]; const v = mcSell(p, w); notes.push(`${cardName(w.n)} vendu ${v} M€`); }
  return notes;
}
function mcPlace(p, c){ p.bench.push(c); return mcLineup(p); }
function mcRemove(p, c){ const i = p.team.indexOf(c); if(i>=0) p.team.splice(i, 1); else { const j = p.bench.indexOf(c); if(j>=0) p.bench.splice(j, 1); } }
function mcSell(p, c){
  if(!mcRoster(p).includes(c)) return 0;
  mcRemove(p, c); const v = mcBank(p, c); p.money += v; mcGain(p, c, v); return v;
}
function mcGain(p, c, v){ if(c.paid==null) return; const g = v - c.paid; p.bestGain = Math.max(p.bestGain, g); if(!M.bestTrade || g > M.bestTrade.g) M.bestTrade = {p, c, g}; }
function mcTransfer(from, to, c, amt){
  mcRemove(from, c); from.money += amt; to.money -= amt; mcGain(from, c, amt);
  c.paid = amt; c.boughtAt = M.season; mcLineup(from); return mcPlace(to, c);
}

/* ======================================================================
   BREAKING NEWS : un dilemme ou un rebondissement à chaque journée
   ====================================================================== */
const mcStar = p => [...p.team].filter(c => c.trait!=="fidele").sort((a,b) => b.val-a.val)[0];
const mcPepVal = c => Math.round([4, 8, 16, 30, 32][Math.min(c.age, 4)] * (0.8 + (hashStr(c.id)%40)/100));
const MC_NEWS = {
  saudi:{ic:"🛢️", t:"Offre venue du Golfe", ok:() => !!mcStar(mcMe()),
    set:n => { n.c = mcStar(mcMe()); n.amt = Math.round(n.c.val*2.5); },
    d:n => `Un club saoudien propose ${n.amt} M€ pour ${n.c.n} (cote ${n.c.val} M€).`,
    a:[["Vendre", n => { const me = mcMe(); mcRemove(me, n.c); me.money += n.amt; mcGain(me, n.c, n.amt); mcLineup(me); return `+${n.amt} M€ ! ${n.c.n} s'envole vers le désert.`; }],
       ["Refuser", n => `${n.c.n} reste. Les supporters t'adorent.`]]},
  leave:{ic:"😤", t:"Ta star veut partir", ok:() => !!mcStar(mcMe()),
    set:n => { n.c = mcStar(mcMe()); },
    d:n => `${n.c.n} réclame un transfert. Garde-le et il boude (−5 de force), ou vends-le à la banque à 60 % de sa cote (${Math.round(n.c.val*0.6)} M€).`,
    a:[["Le garder", n => { mcMe().mods.push({t:`😤 ${cardName(n.c.n)} boude`, v:-5}); return `−5 de force pour ce match.`; }],
       ["Le vendre", n => { const me = mcMe(), v = Math.round(n.c.val*0.6); mcRemove(me, n.c); me.money += v; mcLineup(me); return `+${v} M€. Bon vent !`; }]]},
  nightclub:{ic:"🍾", t:"Soirée en boîte", ok:() => mcMe().team.length>0,
    set:n => { const t = mcMe().team; n.c = t[Math.floor(M.r()*t.length)]; },
    d:n => `${n.c.n} a été photographié en boîte la veille du match. Amende de 8 M€ pour étouffer l'affaire, ou suspension.`,
    a:[["Payer 8 M€", n => { const me = mcMe(); if(me.money < 8){ M.susp.add(n.c.uid); return "Pas assez d'argent : suspendu quand même !"; } me.money -= 8; return "Affaire étouffée."; }],
       ["Suspendu", n => { M.susp.add(n.c.uid); return `${n.c.n} rate le match.`; }]]},
  kit:{ic:"👕", t:"Sponsor maillot", ok:() => true,
    set:() => {}, d:() => "Une marque de chips propose 20 M€ pour s'afficher sur ton maillot. Il est hideux : −3 de force (moral) pour ce match.",
    a:[["Signer", () => { const me = mcMe(); me.money += 20; me.mods.push({t:"👕 Maillot moche", v:-3}); return "+20 M€. Les supporters rient jaune."; }],
       ["Refuser", () => "Le maillot reste sobre."]]},
  agent:{ic:"🕶️", t:"Le super-agent", ok:() => M.deck.some(c => c.kind==="legend"),
    set:n => { const i = M.deck.findIndex(c => c.kind==="legend"); n.c = M.deck.splice(i, 1)[0]; n.amt = n.c.val + 10; },
    d:n => `Un agent te propose ${n.c.n} en exclusivité : ${n.amt} M€ (cote ${n.c.val} M€ + 10 de commission).`,
    a:[["Acheter", n => { const me = mcMe(); if(me.money < n.amt){ M.market.push(n.c); return "Pas assez d'argent… il part au marché."; } me.money -= n.amt; n.c.paid = n.amt; n.c.boughtAt = M.season; me.buys.push({c:n.c, price:n.amt, s:M.season}); mcPlace(me, n.c); return `${n.c.n} signe chez toi !`; }],
       ["Non merci", n => { n.c.price = n.c.val; M.market.push(n.c); return `${n.c.n} arrive au marché… pour tout le monde.`; }]]},
  bankrupt:{ic:"💥", t:"Faillite !", ok:() => M.players.some(p => p.bot && mcRoster(p).length >= 2), auto:true,
    set:n => { const b = M.players.filter(p => p.bot && mcRoster(p).length >= 2); n.p = b[Math.floor(M.r()*b.length)]; },
    d:n => `${n.p.n} est en faillite ! Ses 2 meilleurs joueurs sont bradés au marché à moitié prix.`,
    a:[["Au marché !", n => { const best = mcRoster(n.p).sort((a,b) => b.val-a.val).slice(0, 2);
      best.forEach(c => { mcRemove(n.p, c); c.price = Math.max(2, Math.round(c.val/2)); c.sale = true; M.market.push(c); }); n.p.money = Math.max(n.p.money, 15); mcLineup(n.p); return `${best.map(c => c.n).join(" et ")} sont soldés !`; }]]},
  billionaire:{ic:"🤑", t:"Rachat du club", ok:() => true, auto:true,
    set:n => { n.p = mcRank().at(-1); },
    d:n => `Un milliardaire rachète le club du dernier : ${n.p.bot ? n.p.n : "TOI"} touche +50 M€ !`,
    a:[["Ok !", n => { n.p.money += 50; return ""; }]]},
  tv:{ic:"📺", t:"Nouveaux droits TV", ok:() => true, auto:true,
    set:() => {}, d:() => "Un diffuseur américain inonde le championnat : chaque club touche +15 M€.",
    a:[["Encaisser", () => { M.players.forEach(p => p.money += 15); return ""; }]]},
  deadline:{ic:"⏰", t:"Dernier jour du mercato", ok:() => true, auto:true,
    set:() => {}, d:() => "Folie générale : chacun peut faire 3 offres au lieu de 2, et 2 joueurs de plus arrivent au marché.",
    a:[["Let's go", () => { M.buys = 3; const more = M.deck.splice(0, 2); more.forEach(c => c.price = c.val); M.market.push(...more); return ""; }]]},
  youth:{ic:"🌟", t:"Pépite révélée", ok:() => true,
    set:() => {}, d:() => "Ton centre de formation sort un phénomène.",
    a:[["Le découvrir", () => { const me = mcMe(), pep = mcRoster(me).find(c => c.kind==="pepite");
      if(pep){ pep.age += 2; pep.val = mcPepVal(pep); mcLineup(me); return `${pep.n} explose : cote ${pep.val} M€ !`; }
      const i = M.deck.findIndex(c => c.kind==="pepite"); if(i<0) return "Rien cette année."; const c = M.deck.splice(i, 1)[0]; c.age = 1; c.val = mcPepVal(c); c.paid = 0; mcPlace(me, c); return `${c.n} 🌱 rejoint ton équipe gratuitement !`; }]]}
};

/* ---------- début de journée : pioche + news */
function mcSeasonStart(){
  M.susp = new Set(); M.won = {}; M.sel = {}; M.results = []; M.played = 0; M.bub = {}; M.show = []; M.si = 0; M.flash = null; M.aim = null; M.sheet = null; M.spy = null;
  M.buys = MC.buys; M.deals = 0; M.inbox = [];
  M.pacts = M.pacts.filter(x => x.until >= M.season);
  M.players.forEach(p => {
    p.mod = 0; p.mods = [];
    mcRoster(p).forEach(c => { if(c.kind==="pepite"){ c.age += p.power==="formateur" ? 2 : 1; c.val = mcPepVal(c); } });
    if(p.bot){ mcDraw(p, 1); mcRoster(p).filter(c => c.kind==="pepite" && c.age>=4 && (p.prof==="D" || p.money < 25)).forEach(c => mcSell(p, c)); }
    mcLineup(p);
  });
  M.market = M.deck.splice(0, MC.market);
  if(!M.market.some(c => c.kind==="legend")){ const i = M.deck.findIndex(c => c.kind==="legend"); if(i>=0) M.market[M.market.length-1] = M.deck.splice(i, 1)[0]; }
  M.market.forEach(c => { c.price = c.val; });
  M.drawn = mcDraw(mcMe(), 1);
  const key = M.newsPlan[M.season-1];
  M.news = null;
  if(key && MC_NEWS[key].ok()){ const n = {key}; MC_NEWS[key].set(n); M.news = n; }
  M.phase = "news"; mcSfx(M.news ? "news" : "card"); mcR("draw");
}
function mcNewsChoose(k){
  const n = M.news, N = MC_NEWS[n.key]; n.out = N.a[k][1](n); n.done = true;
  mcSfx((n.key==="saudi" && k===0) || N.auto ? "coin" : "tap"); mcR();
}

/* ---------- valeur pour un ordinateur (M€ qu'il est prêt à payer) */
const MC_K = {easy:0.55, normal:0.9, hard:1.35};
function mcWtp(p, c){
  const left = MC.seasons - M.season + 1, hard = M.diff==="hard", easy = M.diff==="easy";
  const tr = {capitaine:4, clutch:M.season>=4 ? 4 : 1, fragile:-2, ego:-1, fidele:1}[c.trait] || 0;
  let pp = c.kind==="pepite" ? [3,6,9,9,9,9].slice(0, left).reduce((a,b) => a+b, 0) : (c.pp+tr)*left;
  const syn = (p.team.filter(o => o.club===c.club).length*4 + p.team.filter(o => o.lg===c.lg && c.lg!=="pl").length*3) * left;
  pp += syn * (p.prof==="C" || hard ? 1 : 0.3);
  const resale = c.kind==="pepite" ? (left>=3 ? 24 : left===2 ? 12 : 5) : c.val*0.75;
  let m = 1;
  if(p.prof==="B") m = c.kind==="legend" ? 1.3 : (M.season < 5 ? 0.6 : 0.85);
  if(p.prof==="D") m = c.kind==="pepite" ? 1.5 : (c.kind==="legend" ? 0.9 : 0.75);
  if(mcRoster(p).includes(c) ? false : !mcFree(p, c)){
    const weak = p.team.filter(o => mcSlot(o)===mcSlot(c)).sort((a,b) => mcPP(a)-mcPP(b))[0];
    const gain = (c.kind==="pepite" ? 6 : c.pp) - mcPP(weak);
    pp *= gain > 0 ? Math.min(1, 0.3 + gain/8) : (c.kind==="pepite" && p.bench.length < MC.bench ? 0.5 : 0.1);
  }
  let v = (pp * MC_K[M.diff] + resale*0.6) * m;
  if(easy) v *= 0.6 + M.r()*0.6;
  return v;
}

/* ---------- mercato à l'aveugle */
function mcBotBids(p){
  const bids = []; let budget = p.money - (M.diff==="hard" ? 0 : 5);
  const ranked = [...M.market].sort((a,b) => (mcWtp(p,b)-b.price) - (mcWtp(p,a)-a.price));
  for(const c of ranked){
    if(bids.length>=(M.diff==="easy" && M.r()<0.5 ? 1 : M.buys)) break;
    const w = mcWtp(p, c); if(w < c.price) break;
    const cap = Math.round(c.price * (c.kind==="legend" ? 1.3 : c.kind==="pepite" ? (p.prof==="D" ? 3 : 2) : 1.5));
    const share = {easy:0.4, normal:0.6, hard:0.75}[M.diff];
    const bid = Math.min(Math.round(w * (M.diff==="hard" ? 0.95 + M.r()*0.05 : 0.85 + M.r()*0.15)), cap, Math.max(c.price, Math.round(budget*share)), budget);
    if(bid < c.price) continue;
    bids.push([c.uid, bid]); budget -= bid;
  }
  return bids;
}
function mcBuy(w, c, price){
  w.money -= price; if(c.kind==="pepite" && !c.sale){ c.age = w.power==="formateur" ? 1 : 0; } c.paid = price; c.boughtAt = M.season; M.won[c.uid] = w; delete c.sale;
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
    if(w.power==="negociateur") price = Math.round(price*0.9);
    if(w.money >= price){ const notes = mcBuy(w, c, price); return {c, bids:bl, w, price, starter:w.team.includes(c), notes}; }
    return {c, bids:bl, w:null};
  });
  M.sel = {}; M.phase = "reveal"; mcSfx("env"); mcR("reveal");
}

/* ---------- mercato d'hiver flash : une Légende aux enchères en direct */
let MC_FLASH_T = null;
function mcFlashStart(){
  const i = M.deck.findIndex(c => c.kind==="legend"); if(i<0) return mcBureau();
  const c = M.deck.splice(i, 1)[0], start = Math.max(15, c.val - 20);
  const max = {}; M.players.forEach((p, k) => { if(p.bot) max[k] = Math.min(p.money, Math.round(mcWtp(p, c) * (0.85 + M.r()*0.3))); });
  M.flashA = {c, start, price:start, in:M.players.map((p, k) => p.bot ? max[k] >= start : p.money >= start), max, w:null};
  M.phase = "flash"; mcR();
  if(!mcFlashCheck()){ mcStopFlash(); MC_FLASH_T = setInterval(mcFlashTick, 700); }
}
function mcStopFlash(){ if(MC_FLASH_T){ clearInterval(MC_FLASH_T); MC_FLASH_T = null; } }
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
  F.price += F.price < 40 ? 2 : 1;
  M.players.forEach((p, k) => { if(!F.in[k]) return; if(p.bot && F.max[k] < F.price){ F.in[k] = false; mcSay(p, `Je lâche`, "no"); } if(!p.bot && p.money < F.price) F.in[0] = false; });
  if(mcFlashCheck(prev)) return;
  mcSfx("tick"); mcR();
}
function mcFlashDrop(){ const F = M.flashA; if(F.done) return; const prev = [...F.in]; F.in[0] = false; mcSay(mcMe(), "Je lâche"); if(!mcFlashCheck(prev)) mcR(); }

/* ======================================================================
   BUREAU : offres reçues, transferts entre présidents, cartes
   ====================================================================== */
const mcCoalition = () => M.diff!=="easy" && mcRank()[0]===mcMe() && M.season>=2;
/* ce qu'un ordinateur demande pour lâcher un de ses joueurs */
function mcAsk(p, c){
  if(c.trait==="fidele" || p.grudge===mcMe()) return Infinity;
  let f = {easy:1.0, normal:1.15, hard:1.3}[M.diff];
  if(mcAllied(p, mcMe())) f = 0.95;
  else if(mcCoalition()) f *= 1.4;
  if(p.team.includes(c) && c.kind==="legend") f += 0.2;
  return Math.round(Math.max(c.val, mcWtp(p, c)*0.8) * f);
}
/* ce qu'un ordinateur accepte de payer pour un de mes joueurs */
function mcBid(p, c){
  if(p.grudge===mcMe()) return 0;
  let v = Math.max(c.val*0.9, mcWtp(p, c));
  if(mcAllied(p, mcMe())) v *= 1.3;
  return Math.min(p.money - 3, Math.round(v));
}
function mcBureau(){
  mcStopFlash(); M.phase = "coups"; M.bub = {}; M.flash = null;
  const me = mcMe(), prob = {easy:0.45, normal:0.6, hard:0.7}[M.diff];
  M.inbox = [];
  M.players.filter(p => p.bot && p.grudge!==me).forEach(p => {
    if(M.r() > prob) return;
    const best = mcRoster(me).filter(c => c.trait!=="fidele").map(c => ({c, w:mcBid(p, c)})).filter(x => x.w >= x.c.val*1.05).sort((a,b) => (b.w-b.c.val)-(a.w-a.c.val))[0];
    if(!best) return;
    const amt = Math.round(Math.min(best.w, best.c.val*(1.1 + M.r()*0.35)));
    if(amt > p.money - 3 || M.inbox.some(o => o.c===best.c)) return;
    M.inbox.push({by:p, c:best.c, amt, max:best.w});
  });
  if(M.inbox.length) mcSfx("card");
  mcR();
}
function mcInbox(kind){
  const o = M.inbox[0], me = mcMe(); if(!o) return;
  if(!mcRoster(me).includes(o.c) || o.by.money < o.amt){ M.inbox.shift(); return mcR(); }
  if(kind==="ok"){ mcTransfer(me, o.by, o.c, o.amt); M.inbox.shift(); M.flash = mcAct_(o.by, "deal", me, `${o.c.n} part chez ${o.by.n} pour ${o.amt} M€`); mcSay(o.by, "Merci patron 🤝", "ok"); mcSfx("coin"); }
  else if(kind==="no"){ M.inbox.shift(); mcSay(o.by, "Dommage…", "no"); }
  else if(kind==="counter"){ const ask = Math.round(o.amt*1.2);
    if(ask <= o.max && ask <= o.by.money){ mcTransfer(me, o.by, o.c, ask); M.inbox.shift(); M.flash = mcAct_(o.by, "deal", me, `Contre-offre acceptée : ${o.c.n} part pour ${ask} M€`); mcSay(o.by, "Tu m'as eu 😅", "ok"); mcSfx("coin"); }
    else { M.inbox.shift(); M.flash = mcAct_(o.by, "deal", me, `${o.by.n} refuse ta contre-offre à ${ask} M€ et retire son offre`, "refused"); mcSay(o.by, "Trop cher !", "no"); mcSfx("block"); } }
  mcR("bub");
}
function mcDealMood(){
  const s = M.sheet, p = M.players[s.seat], amt = s.amt;
  if(s.mode==="buy"){ const c = mcRoster(p).find(x => x.uid===s.u), ask = mcAsk(p, c); return ask===Infinity ? 0 : amt/ask; }
  const c = mcRoster(mcMe()).find(x => x.uid===s.u), bid = mcBid(p, c); return bid<=0 ? 0 : bid/amt;
}
function mcDealSend(){
  const s = M.sheet, p = M.players[s.seat], me = mcMe(), amt = s.amt;
  if(M.deals >= MC.deals) return toast(`${MC.deals} propositions maximum par journée.`);
  if(s.mode==="buy"){
    const c = mcRoster(p).find(x => x.uid===s.u); if(!c || me.money < amt) return toast("Pas assez d'argent.");
    M.deals++;
    const ask = mcAsk(p, c);
    if(amt >= ask){
      mcTransfer(p, me, c, amt); M.sheet = null; mcSfx("coin");
      let extra = "";
      if(mcAllied(p, me) && amt >= c.val + 20){ p.mission = true; extra = " Ton allié a de quoi attaquer le leader…"; }
      M.flash = mcAct_(me, "deal", p, `${c.n} signe chez toi pour ${amt} M€.${extra}`); mcSay(p, mcAllied(p, me) ? "Je sais quoi en faire 😏" : "Affaire conclue", "ok");
    } else { M.sheet = null; M.flash = mcAct_(me, "deal", p, ask===Infinity ? (c.trait==="fidele" ? `${c.n} est 🔒 Fidèle : pas à vendre.` : `${p.n} refuse de traiter avec toi. Il n'a pas oublié…`) : `${p.n} refuse ${amt} M€ pour ${c.n}.`, "refused"); mcSay(p, ask===Infinity ? "Jamais 😠" : "Trop bas 🙄", "no"); mcSfx("block"); }
  } else {
    const c = mcRoster(me).find(x => x.uid===s.u), bid = mcBid(p, c);
    M.deals++;
    if(bid >= amt && p.money >= amt){ mcTransfer(me, p, c, amt); M.sheet = null; mcSfx("coin"); M.flash = mcAct_(me, "deal", p, `${p.n} t'achète ${c.n} pour ${amt} M€ (cote ${c.val}).`); mcSay(p, "Topé !", "ok"); }
    else { M.sheet = null; M.flash = mcAct_(me, "deal", p, `${p.n} ne paiera pas ${amt} M€ pour ${c.n}.`, "refused"); mcSay(p, "Non merci", "no"); mcSfx("block"); }
  }
  mcR("bub");
}

/* ---------- cartes */
function mcTargets(by, st, to){
  if(st==="scandale") return to.team.filter(c => !M.susp.has(c.uid));
  if(st==="clause") return mcRoster(to).filter(c => c.trait!=="fidele" && c.boughtAt!==M.season && by.money >= Math.round(c.val*MC.clauseMult));
  return [];
}
function mcCheck(by, st, to){
  const C = MC_CARDS[st];
  if(C.tg==="self") return null;
  if(!to || to===by) return "Choisis un adversaire.";
  if(st==="trahison") return mcAllied(by, to) ? null : "Tu n'as pas de pacte avec lui.";
  if(mcAllied(by, to)) return "Vous avez un pacte : pas d'attaque entre alliés.";
  if(st==="pacte") return mcAllies(by).length || mcAllies(to).length ? "Un seul pacte à la fois." : null;
  if(C.pick && !mcTargets(by, st, to).length) return {scandale:"Il n'a aucun titulaire.", clause:"Aucun joueur à ta portée (argent, 🔒 Fidèle ou recrue du jour)."}[st];
  return null;
}
function mcApply(by, st, to, c){
  if(st==="prime"){ by.mod += 6; by.mods.push({t:"🏅 Prime", v:6}); return "+6 de force pour le match"; }
  if(st==="blinde"){ by.shield++; return "+1 bouclier"; }
  if(MC_CARDS[st].k==="bas"){ to.hit = true; by.bas++; if(to.bot) to.grudge = by; }
  if(MC_CARDS[st].pick && !c) c = mcTargets(by, st, to).sort((a,b) => mcPP(b)-mcPP(a) || b.val-a.val)[0];
  if(st==="scandale"){ M.susp.add(c.uid); return `${c.n} suspendu pour ce match`; }
  if(st==="clause"){ const cost = Math.round(c.val*MC.clauseMult); mcTransfer(to, by, c, cost); return `${c.n} change de camp (${cost} M€)`; }
  if(st==="pacte"){ M.pacts.push({a:by, b:to, until:M.season + MC.pactLen - 1}); return `Pacte jusqu'à la journée ${M.season + MC.pactLen - 1}`; }
  if(st==="trahison"){ mcBreak(by, to); const v = Math.min(15, to.money); to.money -= v; by.money += v; to.mod -= 5; to.mods.push({t:"🗡️ Trahi", v:-5}); by.betrayed++; if(to.bot) to.grudge = by; return `${v} M€ volés et −5 de force pour la victime`; }
}
const mcShieldable = st => !!MC_CARDS[st] && (MC_CARDS[st].k==="bas" || st==="trahison");
const mcAct_ = (by, st, to, out, res="ok") => ({by, st, to, out, res});
const mcCardOf = st => st==="deal" ? {ic:"💸", t:"Transfert", k:"deal"} : st==="mission" ? {ic:"🎯", t:"Mission secrète", k:"bas", p:"« Un ami m'a prêté de quoi… »"} : MC_CARDS[st];

/* ---------- toi : jouer une carte */
function mcPlay(i, seat, u){
  const me = mcMe(), st = me.hand[i]; if(st==null) return;
  if(M.played >= MC.plays) return toast("2 cartes maximum par journée.");
  const C = MC_CARDS[st], to = seat!=null ? M.players[seat] : null;
  if(C.tg!=="self" && seat==null){ M.aim = i; M.sheet = null; M.flash = null; return mcR(); }
  const err = mcCheck(me, st, to); if(err) return toast(err);
  if(C.pick && !u){ M.sheet = {t:"target", i, seat}; M.aim = null; return mcR("sheet"); }
  const c = u ? mcTargets(me, st, to).find(x => x.uid===u) : null;
  me.hand.splice(i, 1); M.played++; M.aim = null; M.sheet = null;
  if(st==="pacte"){
    const last = mcRank().at(-1)===to, lead = mcRank()[0]===me, p = to.grudge===me ? 0 : {easy:0.75, normal:0.55, hard:0.4}[M.diff] + (last ? 0.2 : 0) - (lead && M.diff!=="easy" ? 0.3 : 0);
    if(M.r() < p){ M.flash = mcAct_(me, st, to, mcApply(me, st, to)); mcSay(to, "🤝 Marché conclu !", "ok"); mcSfx("coin"); }
    else { M.flash = mcAct_(me, st, to, to.grudge===me ? `${to.n} : « Après ce que tu m'as fait ? Jamais. »` : `${to.n} refuse : « Toi, t'es trop fort… »`, "refused"); mcSay(to, "Non merci 😏", "no"); mcSfx("block"); }
    return mcR("bub");
  }
  if(to && mcShieldable(st) && to.shield>0 && M.r() < (M.diff==="easy" ? 0.35 : M.diff==="normal" ? 0.6 : 0.8)){
    to.shield--; to.grudge = me; mcSay(to, "🛡️ Bloqué !", "ok"); M.flash = mcAct_(me, st, to, `${to.n} sort son Contrat Blindé : coup annulé`, "blocked"); mcSfx("block"); return mcR("bub"); }
  const out = mcApply(me, st, to, c);
  if(to) mcSay(to, `Je n'oublierai pas 😠`, "hit");
  M.flash = mcAct_(me, st, to, out); mcSfx(to ? "hit" : "coin");
  mcR("bub");
}

/* ---------- ordinateurs : missions, rancunes, cartes, transferts entre eux */
function mcBotsStart(){ M.queue = mcRank().reverse().filter(p => p.bot); M.qi = 0; M.bub = {}; M.flash = null; M.show = []; mcBotsStep(); }
function mcBotsStep(){
  while(M.qi < M.queue.length){ const r = mcBotTurn(M.queue[M.qi]); if(r==="wait") return; M.qi++; }
  mcBotMarket();
  M.si = 0; M.phase = "after"; if(M.show.length) mcSfx(M.show[0].res==="ok" && M.show[0].to ? "hit" : "card"); mcR("act");
}
function mcBotMarket(){
  const bots = M.players.filter(p => p.bot);
  bots.forEach(p => { if(p.money < 10 && p.bench.length){ const c = [...p.bench].sort((a,b) => b.val-a.val)[0]; const v = mcSell(p, c); M.show.push(mcAct_(p, "deal", null, `Besoin de cash : ${p.n} vend ${c.n} à la banque (${v} M€)`)); } });
  if(M.r() < 0.5){
    const buyer = bots[Math.floor(M.r()*bots.length)], sellers = bots.filter(q => q!==buyer && q.grudge!==buyer && buyer.grudge!==q);
    const offers = sellers.flatMap(s => mcRoster(s).filter(c => c.trait!=="fidele").map(c => ({s, c, w:mcWtp(buyer, c), ask:Math.max(c.val, mcWtp(s, c)*0.8)*1.1}))).filter(x => x.w >= x.ask && buyer.money - 5 >= x.ask).sort((a,b) => (b.w-b.ask)-(a.w-a.ask));
    const x = offers[0]; if(x){ const amt = Math.round(x.ask); mcTransfer(x.s, buyer, x.c, amt); M.show.push(mcAct_(buyer, "deal", x.s, `${buyer.n} rachète ${x.c.n} à ${x.s.n} pour ${amt} M€`)); }
  }
}
function mcBotTarget(p, st){
  let rivals = M.players.filter(q => q!==p && !mcCheck(p, st, q));
  if(!rivals.length) return null;
  const me = mcMe();
  if(st==="pacte"){
    if(mcCoalition()){ const b = rivals.filter(q => q.bot); if(b.length) return b[0]; }
    rivals = rivals.filter(q => q.grudge!==p && p.grudge!==q); if(!rivals.length) return null;
    const rk = mcRank(); return M.diff==="hard" ? rivals.sort((a,b) => rk.indexOf(b)-rk.indexOf(a))[0] : rivals[Math.floor(M.r()*rivals.length)];
  }
  if(p.grudge && rivals.includes(p.grudge) && M.r() < 0.65) return p.grudge;
  if(mcCoalition() && rivals.includes(me) && M.r() < (M.diff==="hard" ? 0.85 : 0.55)) return me;
  if(M.diff==="easy") return rivals[Math.floor(M.r()*rivals.length)];
  const opp = mcOpp(p); if(rivals.includes(opp) && M.r() < 0.5) return opp;
  if(M.diff==="normal" && p.prof!=="A" && M.r()<0.4) return rivals[Math.floor(M.r()*rivals.length)];
  return mcRank().find(q => rivals.includes(q));
}
function mcBotTurn(p){
  p._n = p._n || 0;
  if(p.mission){ p.mission = false;
    const lead = mcRank().find(q => q!==p && !mcAllied(p, q));
    const c = lead && mcRoster(lead).filter(c => c.trait!=="fidele" && c.boughtAt!==M.season && Math.round(c.val*MC.clauseMult) <= p.money).sort((a,b) => mcPP(b)-mcPP(a))[0];
    if(c){ const cost = Math.round(c.val*MC.clauseMult);
      if(!lead.bot && lead.shield>0){ M.pending = {by:p, st:"mission", to:lead, c, cost}; M.phase = "react"; mcSfx("hit"); mcR(); return "wait"; }
      if(lead.shield>0 && M.r()<0.4){ lead.shield--; M.show.push(mcAct_(p, "mission", lead, `${lead.n} bloque la mission avec son Contrat Blindé`, "blocked")); }
      else { mcTransfer(lead, p, c, cost); lead.hit = true; M.show.push(mcAct_(p, "mission", lead, `Avec l'argent de son allié, ${p.n} arrache ${c.n} au leader (${cost} M€) !`)); }
    }
  }
  const rate = {easy:0.4, normal:{A:1, B:0.55, C:0.7, D:0.6}[p.prof], hard:0.95}[M.diff];
  const order = [...p.hand].sort((a,b) => (MC_CARDS[a].k==="bonus" ? 0 : 1) - (MC_CARDS[b].k==="bonus" ? 0 : 1));
  for(const st of order){
    if(p._n >= MC.plays) break;
    if(M.r() > rate) continue;
    if(st==="trahison" && !(p.prof==="A" || M.r()<0.5)) continue;
    const C = MC_CARDS[st], to = C.tg==="self" ? null : mcBotTarget(p, st);
    if(C.tg!=="self" && !to) continue;
    p.hand.splice(p.hand.indexOf(st), 1); p._n++;
    if(to && !to.bot && (st==="pacte" || (mcShieldable(st) && to.shield>0))){ M.pending = {by:p, st, to}; M.phase = st==="pacte" ? "offer" : "react"; mcSfx(st==="pacte" ? "card" : "hit"); mcR(); return "wait"; }
    if(st==="pacte"){ const co = mcCoalition(), yes = M.r() < (co ? 0.9 : 0.6);
      if(yes){ const out = mcApply(p, st, to); M.show.push(mcAct_(p, st, to, co ? "Alliance contre le leader ! " + out : out)); }
      else M.show.push(mcAct_(p, st, to, `${to.n} refuse`, "refused")); continue; }
    if(to && mcShieldable(st) && to.shield>0 && M.r()<0.5){ to.shield--; M.show.push(mcAct_(p, st, to, `${to.n} sort son Contrat Blindé : coup annulé`, "blocked")); continue; }
    const vengeance = p.grudge===to && to===mcMe();
    M.show.push(mcAct_(p, st, to, (vengeance ? "Vengeance ! " : "") + mcApply(p, st, to)));
  }
  p._n = 0;
}
function mcAnswer(yes){
  const {by, st, to, c, cost} = M.pending; M.pending = null;
  if(st==="mission"){
    if(yes){ to.shield--; mcSfx("block"); M.show.push(mcAct_(by, st, to, "Ton Contrat Blindé repousse l'attaque", "blocked")); }
    else { mcTransfer(to, by, c, cost); to.hit = true; M.show.push(mcAct_(by, st, to, `${by.n} t'arrache ${c.n} (${cost} M€) avec l'argent de son allié !`)); }
  }
  else if(st==="pacte"){ if(yes) M.show.push(mcAct_(by, st, to, mcApply(by, st, to))); else M.show.push(mcAct_(by, st, to, "Tu refuses le pacte", "refused")); }
  else if(yes){ to.shield--; mcSfx("block"); M.show.push(mcAct_(by, st, to, "Ton Contrat Blindé annule le coup", "blocked")); }
  else M.show.push(mcAct_(by, st, to, mcApply(by, st, to)));
  M.phase = "botsplay";
  const r = mcBotTurn(by); if(r==="wait") return;
  M.qi++; mcBotsStep();
}

/* ---------- force de l'équipe et match */
function mcForce(p, absent=new Set()){
  const alive = p.team.filter(c => !M.susp.has(c.uid) && !absent.has(c.uid));
  const lines = [{t:"Joueurs", v:alive.reduce((s,c) => s + mcPP(c), 0)}];
  if(alive.some(c => c.trait==="capitaine")) lines.push({t:"🎖️ Capitaine", v:4});
  const egos = p.bench.filter(c => c.trait==="ego").length; if(egos) lines.push({t:"😤 Ego sur le banc", v:-3*egos});
  const leg = alive.some(c => c.kind==="legend"), mult = (leg ? MC.legendMult : 1) * (p.power==="tacticien" ? 1.5 : 1), star = leg ? " ⭐" : "";
  const club = Object.entries(mcCount(alive.map(c => c.club))).sort((a,b) => b[1]-a[1])[0];
  if(club && club[1]>=2) lines.push({t:`${club[1]>=3?"Trio":"Duo"} ${club[0]}${star}`, v:Math.round((club[1]>=3 ? MC.trio : MC.duo)*mult)});
  const lg = Object.entries(mcCount(alive.filter(c => c.lg!=="pl").map(c => c.lg))).find(([, n]) => n>=3);
  if(lg) lines.push({t:`Trio ${LG_AB[lg[0]]||lg[0]}${star}`, v:Math.round(MC.league*mult)});
  p.mods.forEach(m => lines.push(m));
  if(mcAllies(p).length) lines.push({t:"🤝 Pacte", v:MC.pactPP});
  return {lines, total:Math.max(1, lines.reduce((s,x) => s+x.v, 0)), alive};
}
function mcSimMatch(a, b){
  const r = M.r, abs = p => new Set(p.team.filter(c => c.trait==="fragile" && r() < 0.25).map(c => c.uid));
  const xa = abs(a), xb = abs(b), fa = mcForce(a, xa), fb = mcForce(b, xb);
  const ev = [];
  [[a, xa], [b, xb]].forEach(([p, x]) => x.forEach(u => { const c = p.team.find(o => o.uid===u); ev.push({min:0, p, t:`🩹 ${cardName(c.n)} forfait`}); }));
  const pa = Math.pow(fa.total, 1.6) / (Math.pow(fa.total, 1.6) + Math.pow(fb.total, 1.6));
  const n = 6 + Math.floor(r()*4), mins = Array.from({length:n}, () => 2 + Math.floor(r()*88)).sort((x,y) => x-y);
  let ga = 0, gb = 0;
  const shooter = F => { const pool = F.alive.filter(c => c.pos!=="G"); if(!pool.length) return null; const w = pool.map(c => mcPP(c) + ({ATT:8, MIL:4, DEF:1}[c.pos]||1)); let x = r()*w.reduce((s,v) => s+v, 0); for(let k=0;k<pool.length;k++){ x -= w[k]; if(x<=0) return pool[k]; } return pool[0]; };
  mins.forEach(min => {
    const att = r() < pa ? a : b, F = att===a ? fa : fb, D = att===a ? fb : fa;
    const s = shooter(F); if(!s) return;
    const gk = D.alive.find(c => c.pos==="G");
    const pg = 0.3 + 0.15*Math.min(1, F.total/Math.max(1, D.total)) - (gk ? 0.05 : -0.15);
    if(r() < pg){ if(att===a) ga++; else gb++; M.goals[s.uid] = M.goals[s.uid] || {c:s, n:0, p:att}; M.goals[s.uid].n++; s.sc = (s.sc||0) + 1; ev.push({min, p:att, t:`${cardName(s.n)}`, goal:true}); }
    else if(r() < 0.5) ev.push({min, p:att, t: gk && r()<0.6 ? `Arrêt de ${cardName(gk.n)} devant ${cardName(s.n)}` : `${cardName(s.n)} manque le cadre`});
  });
  return {a, b, ga, gb, fa, fb, ev};
}
function mcRecord(m){
  const k = M.season===MC.seasons ? 2 : 1;
  const set = (p, f, c) => { p.gf += f; p.ga += c; p.res = f>c ? "V" : f===c ? "N" : "D";
    if(f>c){ p.w++; p.pts += 3*k; } else if(f===c){ p.d++; p.pts += k; } else p.l++; p.form.push(p.res); };
  set(m.a, m.ga, m.gb); set(m.b, m.gb, m.ga);
}
/* revenus et évolution des cotes après la journée */
function mcAfterMatch(){
  const rk = mcRank(), moves = [];
  M.players.forEach(p => {
    const inc = MC.income + (p.res==="V" ? MC.winBonus : p.res==="N" ? MC.drawBonus : 0) + MC.tv[rk.indexOf(p)+1];
    p.income = inc; p.money += inc;
    mcRoster(p).forEach(c => {
      if(c.kind==="pepite"){ c.sc = 0; return; }
      const old = c.val; let f = 1 + (c.sc||0)*0.1 + (p.res==="V" ? 0.04 : p.res==="D" ? -0.05 : 0) + (p.bench.includes(c) ? -0.06 : 0) + (M.r()-0.5)*0.06;
      if(c.trait==="clutch" && M.season>=4) f += 0.05;
      c.val = Math.max(2, Math.round(c.val * f)); c.sc = 0;
      if(p===mcMe() && c.val!==old) moves.push({c, old});
    });
  });
  M.moves = moves.sort((a,b) => Math.abs(b.c.val-b.old) - Math.abs(a.c.val-a.old)).slice(0, 3);
}
function mcMatch(){
  const me = mcMe();
  M.before = mcRank();
  M.matches = M.fixtures[M.season-1].map(([i,j]) => mcSimMatch(M.players[i], M.players[j]));
  M.matches.forEach(mcRecord);
  const mine = M.matches.find(m => m.a===me || m.b===me);
  if(mine.b===me) Object.assign(mine, {a:mine.b, b:mine.a, ga:mine.gb, gb:mine.ga, fa:mine.fb, fb:mine.fa});
  M.mine = mine; M.other = M.matches.find(m => m!==mine);
  mcAfterMatch();
  M.phase = "match"; M.bub = {}; M.flash = null; mcSfx("whistle");
  M.mine.ev.filter(e => e.goal).forEach(e => setTimeout(() => { if(M && M.phase==="match") mcSfx(e.p===me ? "goal" : "hit"); }, 700 + mcEvDelay(M.mine.ev, e)*1000));
  setTimeout(() => { if(M && M.phase==="match") mcSfx("whistle"); }, 900 + mcEvDelay(M.mine.ev, null)*1000);
  mcR("match");
}
const mcEvDelay = (evs, e) => { const list = evs.filter(x => x.min>0); const i = e ? list.indexOf(e) : list.length; return 0.4 + Math.max(0, i)*0.6; };
function mcNext(){
  if(M.season < MC.seasons){ M.season++; mcSeasonStart(); return; }
  M.players.forEach(p => { p.secretOk = !!(p.secret && MC_SECRETS[p.secret].ok(p)); p.bonusSecret = p.secretOk ? MC.secretPts : 0; p.bonusValue = Math.floor(mcValue(p)/MC.valuePts); p.final = p.pts + p.bonusSecret + p.bonusValue; });
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
  if(M.bestTrade && M.bestTrade.g > 0) t.push({ic:"📈", t:"Coup du siècle", d:`${M.bestTrade.c.n} · +${M.bestTrade.g} M€`, p:M.bestTrade.p});
  const bas = [...P].sort((a,b) => b.bas-a.bas)[0]; if(bas.bas) t.push({ic:"🗡️", t:"Roi des coups bas", d:`${bas.bas} coup${bas.bas>1?"s":""} bas`, p:bas});
  const flops = P.flatMap(p => p.buys.map(b => ({...b, p}))).filter(b => b.price >= 15).map(b => ({...b, loss:b.price - b.c.val})).sort((a,b) => b.loss-a.loss)[0];
  if(flops && flops.loss > 0) t.push({ic:"💸", t:"Flop du mercato", d:`${flops.c.n} : payé ${flops.price}, vaut ${flops.c.val}`, p:flops.p});
  const rich = [...P].sort((a,b) => mcValue(b)-mcValue(a))[0]; t.push({ic:"🏦", t:"Club le plus riche", d:`${mcValue(rich)} M€`, p:rich});
  const def = [...P].sort((a,b) => a.ga-b.ga)[0]; t.push({ic:"🧱", t:"Meilleure défense", d:`${def.ga} but${def.ga>1?"s":""} encaissé${def.ga>1?"s":""}`, p:def});
  return t.slice(0, 6);
}
async function mcShare(){
  const me = mcMe(), rank = M.final.indexOf(me)+1, medal = ["🥇","🥈","🥉","4️⃣"][rank-1];
  const text = `Mercato FC ${M.daily?"· partie du jour ":""}(${MC_DIFF[M.diff].t})\n${medal} ${rank===1?"Champion !":`${rank}ᵉ sur 4`} · ${me.final} pts · ${me.w}V ${me.d}N ${me.l}D\n${me.form.map(f => f==="V"?"🟩":f==="N"?"🟨":"🟥").join("")} · club valorisé ${mcValue(me)} M€\n${M.trophies.filter(x => x.p===me).map(x => x.ic+" "+x.t).join(" · ")}\nTu fais mieux ? ${SITE_URL}`;
  try{ if(navigator.share){ await navigator.share({text}); return; } }catch(e){ if(e && e.name==="AbortError") return; }
  try{ await navigator.clipboard.writeText(text); toast("Résultat copié, colle-le où tu veux", "ok"); }catch(e){ toast("Copie impossible sur cet appareil."); }
}

/* ======================================================================
   ÉCRANS
   ====================================================================== */
const MC_STEPS = [["news","📰","Infos"],["mercato","✉️","Mercato"],["coups","💼","Bureau"],["match","⚽","Match"]];
function mcStepOf(ph){ return {news:"news", mercato:"mercato", reveal:"mercato", flash:"mercato", coups:"coups", botsplay:"coups", react:"coups", offer:"coups", after:"coups", match:"match"}[ph]; }
const mcTraitTag = c => c.trait ? `<span class="trait" title="${MC_TRAITS[c.trait].t}">${MC_TRAITS[c.trait].ic}</span>` : "";
const mcValTag = c => { const d = c.paid!=null ? c.val - c.paid : 0; return `<span class="val${d>0?" up":d<0?" down":""}">${c.val}</span>`; };

function mcHandCard(st, i, {play=false, big=false, flip=false}={}){
  const C = MC_CARDS[st];
  return `<button class="mcc k-${C.k}${big?" big":""}${flip?" flip":""}${M.aim===i?" on":""}" ${play?`data-act="mccard" data-v="${i}"`:"disabled"} style="${flip?`animation-delay:${i*0.15}s`:""}">
    <span class="mcc-ic">${C.ic}</span><b>${C.t}</b>${big?`<small>${esc(C.d)}</small>${C.p?`<i>${esc(C.p)}</i>`:""}`:""}</button>`;
}
function mcMini(c, {act="", v="", cls="", val=false}={}){
  const tag = act ? "button" : "span";
  return `<${tag} class="mini${M.susp.has(c.uid)?" susp":""}${cls}${M.sheet && M.sheet.u===c.uid?" on":""}" ${act?`data-act="${act}" data-v="${esc(v)}"`:""}>${cardHTML(c.id,{small:true})}<span class="mini-pp">${mcPP(c)}</span>${mcTraitTag(c)}${val?mcValTag(c):""}${M.susp.has(c.uid)?`<span class="mini-x">📸</span>`:""}</${tag}>`;
}
function mcLine(p, act, val){
  const g = p.team.filter(c => c.pos==="G"), f = p.team.filter(c => c.pos!=="G");
  const empty = n => Array(Math.max(0,n)).fill(`<span class="mini empty"></span>`).join("");
  return `<div class="line5">${g.map(c => mcMini(c, {act, v:c.uid, val})).join("")}${empty(1-g.length)}${f.map(c => mcMini(c, {act, v:c.uid, val})).join("")}${empty(4-f.length)}
    <span class="line-sep"></span>${p.bench.map(c => mcMini(c, {act, v:c.uid, cls:" bn", val})).join("")}${Array(Math.max(0, MC.bench-p.bench.length)).fill(`<span class="mini empty bn"></span>`).join("")}</div>`;
}
function mcSeat(p){
  const i = mcIdx(p), me = mcMe(), b = M.bub[i], rk = mcRank().indexOf(p)+1;
  const aimSt = M.aim!=null ? me.hand[M.aim] : null, ok = aimSt && !mcCheck(me, aimSt, p);
  const env = M.phase==="mercato" && M.botBids ? (M.botBids[i]||[]).length : 0;
  const act = M.phase==="after" && M.show[M.si], hl = act && (act.by===p ? " actor" : act.to===p ? " victim" : "");
  const vs = M.phase!=="end" && M.fixtures && mcOpp(me)===p, fl = M.phase==="flash" && M.flashA;
  return `<button class="seat${ok?" aim":""}${aimSt && !ok?" dim":""}${mcAllied(me, p)?" ally":""}${hl||""}${fl && !M.flashA.in[i]?" out":""}" style="--pc:${p.col}" ${ok?`data-act="mcaim" data-v="${i}"`:aimSt?`data-act="mcaimno" data-v="${i}"`:`data-act="mcpeek" data-v="${i}"`}>
    <span class="seat-rk">${rk}ᵉ</span>${vs?`<span class="seat-vs">VS</span>`:""}${p.grudge===me?`<span class="seat-grudge" title="Il t'en veut">😠</span>`:""}
    <span class="seat-av">${p.ic}</span>
    <b>${esc(mcShort(p))}</b>
    <span class="seat-pp">${p.pts}<small> pts</small></span>
    <span class="seat-m">💪${mcForce(p).total} · 💰${p.money}</span>
    <span class="seat-row">${p.hand.map(() => `<i class="bk"></i>`).join("")}${p.shield?`<i class="sh">🛡️${p.shield>1?p.shield:""}</i>`:""}${mcAllies(p).length?`<i class="pc">🤝${mcAllies(p).map(q => q.ic).join("")}</i>`:""}</span>
    ${env?`<span class="seat-env">${"✉️".repeat(env)}</span>`:""}
    ${M.spy && M.spy.p===p && M.phase==="mercato"?`<span class="bub ok">🎲 ${M.spy.bid} sur ${esc(cardName(M.spy.c.n))}</span>`:b?`<span class="bub ${b.cls}${M.fx==="bub"?" pop":""}">${esc(b.t)}</span>`:""}
  </button>`;
}
function mcActHTML(a, anim){
  const C = mcCardOf(a.st), av = p => `<span class="act-av" style="--pc:${p.col}"><span>${p.ic}</span><small>${esc(mcShort(p))}</small></span>`;
  return `<div class="act res-${a.res}${anim?" in":""}">
    <div class="act-row">${av(a.by)}<span class="act-card k-${C.k}">${C.ic}</span>${a.to?av(a.to):""}</div>
    <b>${a.st==="deal" ? "💸 Transfert" : `${esc(mcName(a.by))} ${a.by.bot?"joue":"joues"} ${C.t}`}</b>
    <p class="act-out">${a.res==="blocked"?"🛡️ ":a.res==="refused"?"✋ ":"→ "}${esc(a.out)}</p>
    ${C.p && a.res==="ok"?`<i>${esc(C.p)}</i>`:""}</div>`;
}
function mcTable(center, dockHtml="", cls=""){
  const me = mcMe(), step = mcStepOf(M.phase), si = MC_STEPS.findIndex(s => s[0]===step), opp = mcOpp(me), fin = M.season===MC.seasons;
  const showHand = M.phase==="coups" && !M.inbox.length;
  return `<div class="mct ${cls}">
   <div class="mct-top"><button class="iconbtn" data-act="quit" aria-label="Quitter">${ICON.back}</button>
    <span class="mct-season">J${M.season}<small>/6</small></span>
    <button class="mct-ev" data-act="mcevent">🏆 Classement</button>
    <button class="iconbtn mct-help" data-act="mcmute" aria-label="Son">${PROFILE.best.mcMute?"🔇":"🔊"}</button>
    <button class="iconbtn mct-help" data-act="mcrules" aria-label="Règles">?</button></div>
   <div class="seats">${M.players.slice(1).map(mcSeat).join("")}</div>
   <div class="fixture${fin?" final":""}"><span>${fin?"🏆 Dernière journée · points ×2":"Prochain match"}</span><b><i style="--pc:${me.col}">${me.ic}</i> Toi <em>${mcForce(me).total}</em> <u>vs</u> <em>${mcForce(opp).total}</em> ${esc(mcShort(opp))} <i style="--pc:${opp.col}">${opp.ic}</i></b></div>
   <div class="steps">${MC_STEPS.map((s,k) => `<span class="${k<si?"done":k===si?"cur":""}">${s[1]} ${s[2]}</span>`).join("")}</div>
   <div class="mct-c">${center}</div>
   <div class="me-zone" style="--pc:${me.col}">
    <div class="me-bar"><span class="seat-av me">${me.power?MC_POWERS[me.power].ic:me.ic}</span><span class="me-st"><b>💰 ${me.money} M€</b><small>${me.pts} pts · ${mcRank().indexOf(me)+1}ᵉ · club ${mcValue(me)} M€</small></span>
     <span class="me-form">${me.form.slice(-5).map(f => `<i class="f-${f}">${f}</i>`).join("")}</span>
     ${me.shield?`<span class="me-sh">🛡️${me.shield>1?" "+me.shield:""}</span>`:""}${mcAllies(me).length?`<span class="me-sh">🤝${mcAllies(me).map(q => q.ic).join("")}</span>`:""}
     <button class="me-secret" data-act="mcsecretpeek" aria-label="Objectif secret">🔒</button></div>
    <button class="me-line" data-act="mcteam">${mcLine(me, "", true)}</button>
    ${showHand ? `<div class="hand">${me.hand.length ? me.hand.map((st, i) => mcHandCard(st, i, {play:true})).join("") : `<span class="hand-empty">Main vide</span>`}</div>` : ""}
   </div>
   ${dockHtml?dock(dockHtml):""}
   ${mcSheet()}
  </div>`;
}
function mcLeague(){
  const rk = mcRank(), before = M.before || rk;
  return `<div class="league">${rk.map((p,k) => { const mv = before.indexOf(p) - k;
    return `<div class="lg-r${p.bot?"":" me"}" style="--pc:${p.col}"><span class="lg-pos">${k+1}</span><span class="lg-av">${p.ic}</span><b>${esc(mcShort(p))}</b>
      <span class="lg-mv">${mv>0?"▲":mv<0?"▼":""}</span><span class="lg-f">${p.form.slice(-3).map(f => `<i class="f-${f}"></i>`).join("")}</span>
      <span class="lg-gd">${mcGD(p)>0?"+":""}${mcGD(p)}</span><span class="lg-pts">${p.pts}</span></div>`; }).join("")}</div>`;
}
function mcMood(r){ return r>=1 ? `<span class="mood ok">😀 Il a l'air chaud</span>` : r>=0.85 ? `<span class="mood mid">🤔 Ça se discute</span>` : r>0 ? `<span class="mood no">😬 Il va rire</span>` : `<span class="mood no">🚫 Il refusera</span>`; }
function mcSheet(){
  const s = M.sheet; if(!s) return "";
  const me = mcMe();
  let body = "";
  if(s.t==="card"){ const st = me.hand[s.i], C = MC_CARDS[st];
    body = `<div class="sheet-card">${mcHandCard(st, s.i, {big:true})}</div>
      <button class="btn" data-act="mcplay" data-v="${s.i}" ${M.played>=MC.plays?"disabled":""}>${M.played>=MC.plays?"Déjà 2 cartes jouées":C.tg==="self"?"Jouer":"Choisir l'adversaire"}</button>`; }
  if(s.t==="target"){ const st = me.hand[s.i], C = MC_CARDS[st], to = M.players[s.seat], list = mcTargets(me, st, to);
    body = `<h3>${C.ic} ${C.t} → ${to.ic} ${esc(to.n)}</h3><p class="bid-note">Choisis le joueur visé</p>
      <div class="tgt-grid">${list.map(c => `<button class="tgt" data-act="mcpicktgt" data-v="${c.uid}">${cardHTML(c.id,{small:true})}${mcTraitTag(c)}<span>💪${mcPP(c)}${st==="clause"?` · ${Math.round(c.val*MC.clauseMult)} M€`:""}</span></button>`).join("")}</div>`; }
  if(s.t==="bid"){ const c = M.market.find(x => x.uid===s.u), b = M.sel[s.u] ?? c.price, used = Object.entries(M.sel).filter(([u]) => u!==s.u).reduce((a,[,v]) => a+v, 0);
    const weak = !mcFree(me, c) ? me.team.filter(o => mcSlot(o)===mcSlot(c)).sort((a,b) => mcPP(a)-mcPP(b))[0] : null;
    body = `<div class="bid-head">${cardHTML(c.id,{small:true})}<div><b>${esc(c.n)}</b><small>${MC_POS_FR[c.pos]} · ${c.kind==="legend"?"Légende ⭐":c.kind==="pepite"?"Pépite 🌱 cote qui explose":"Régulier"} · ${esc(c.club)}</small><span class="bid-pp">💪 ${c.kind==="pepite"?"3→9":c.pp}<small> · cote ${c.val} M€</small></span>
      ${c.trait?`<span class="trait-l">${MC_TRAITS[c.trait].ic} <b>${MC_TRAITS[c.trait].t}</b> · ${MC_TRAITS[c.trait].d}</span>`:""}
      <small>${mcFree(me, c)?"✅ Place libre chez les titulaires":weak && mcPP(weak) < (c.kind==="pepite"?3:c.pp)?`🔄 Remplacerait ${esc(cardName(weak.n))} (💪${mcPP(weak)})`:"🪑 Irait sur le banc"}</small></div></div>
      <div class="bid-dial"><button data-act="mcbid" data-v="-5">−5</button><button data-act="mcbid" data-v="-1">−</button><b>${b}<small> M€</small></b><button data-act="mcbid" data-v="1">+</button><button data-act="mcbid" data-v="5">+5</button></div>
      <p class="bid-note">Prix de base ${c.price} M€${c.sale?" (bradé !)":""} · il te reste ${me.money - used} M€</p>
      <button class="btn" data-act="mcseal" data-v="${s.u}">✉️ Glisser mon offre (${b} M€)</button>
      ${!s.isNew?`<button class="btn ghost" data-act="mcunbid" data-v="${s.u}">Retirer l'offre</button>`:""}`; }
  if(s.t==="team"){ const sel = s.u && mcRoster(me).find(c => c.uid===s.u), sc = mcForce(me);
    body = `<h3>Mon équipe · 💪 ${sc.total} · club ${mcValue(me)} M€</h3>
      <div class="team-big">${mcLine(me, "mcchip", true)}</div>
      <div class="lines">${sc.lines.filter(x => x.v).map((x,k) => `<span class="${x.v<0?"neg":k?"bonus":""}">${esc(x.t)} ${x.v>0?"+":""}${x.v}</span>`).join("")}</div>
      ${sel?`<div class="chip-acts"><b>${esc(sel.n)}</b> · ${esc(sel.club)} · 💪${mcPP(sel)} · cote <b>${sel.val} M€</b>${sel.paid!=null?` (acheté ${sel.paid})`:""}${sel.trait?`<br>${MC_TRAITS[sel.trait].ic} ${MC_TRAITS[sel.trait].t} : ${MC_TRAITS[sel.trait].d}`:""}
        <div><button class="btn ghost" data-act="mcmove" data-v="${sel.uid}">${me.bench.includes(sel)?"↑ Titulaire":"↓ Au banc"}</button><button class="btn" data-act="mcsell" data-v="${sel.uid}">Banque : ${mcBank(me, sel)} M€</button></div>
        ${M.phase==="coups"?`<p class="bid-note">💡 Pour en tirer plus, propose-le à un président : touche son siège.</p>`:""}</div>`
        :`<p class="bid-note">Touche un joueur pour le vendre ou le changer de place. L'étiquette verte ou rouge, c'est sa cote en M€ (vert = plus-value).<br>Combos : 2 du même club +4 · 3 du même club +10 · 3 d'un championnat étranger +8 · une Légende ×1,5.</p>`}`; }
  if(s.t==="secret"){ const k = me.secret; body = `<div class="secret-big">${MC_SECRETS[k].ic}<b>${MC_SECRETS[k].t}</b><small>${MC_SECRETS[k].d}</small><span>+${MC.secretPts} pts à la fin · ${MC_SECRETS[k].ok(me)?"✅ rempli pour l'instant":"pas encore"}</span></div>
      ${me.power?`<p class="bid-note">Ton pouvoir : ${MC_POWERS[me.power].ic} <b>${MC_POWERS[me.power].t}</b> — ${MC_POWERS[me.power].d}</p>`:""}`; }
  if(s.t==="peek"){ const p = M.players[s.i], can = M.phase==="coups" && !M.inbox.length;
    body = `<h3>${p.ic} ${esc(p.n)} · 💪 ${mcForce(p).total}</h3><p class="bid-note">💰 ${p.money} M€ · club ${mcValue(p)} M€ · ${p.w}V ${p.d}N ${p.l}D · ${p.hand.length} carte${p.hand.length>1?"s":""} cachée${p.hand.length>1?"s":""}${p.grudge===me?" · 😠 il t'en veut":""}${mcAllied(p, me)?" · 🤝 ton allié":""}</p>
      <div class="team-big">${mcLine(p, can ? "mcdealbuy" : "", true)}</div>
      ${can ? `<p class="bid-note">💼 Touche un de ses joueurs pour faire une offre, ou :</p><button class="btn ghost" data-act="mcdealsellpick" data-v="${s.i}">Lui vendre un de mes joueurs</button>${mcAllied(p, me)?`<p class="hint-ally">💡 C'est ton allié : surpaye un de ses joueurs (20 M€ au-dessus de la cote) et il utilisera l'argent pour attaquer le leader.</p>`:""}` : M.phase==="coups" ? `<p class="bid-note">Réponds d'abord aux appels reçus.</p>` : `<p class="bid-note">Les transferts se font pendant le 💼 Bureau.</p>`}`; }
  if(s.t==="sellpick"){ const p = M.players[s.seat];
    body = `<h3>Vendre à ${p.ic} ${esc(p.n)}</h3><p class="bid-note">Quel joueur lui proposes-tu ?</p><div class="team-big">${mcLine(me, "mcdealsell", true)}</div>`; }
  if(s.t==="deal"){ const p = M.players[s.seat], c = mcRoster(s.mode==="buy" ? p : me).find(x => x.uid===s.u);
    body = `<h3>${s.mode==="buy" ? `Acheter à ${p.ic} ${esc(mcShort(p))}` : `Vendre à ${p.ic} ${esc(mcShort(p))}`}</h3>
      <div class="bid-head">${cardHTML(c.id,{small:true})}<div><b>${esc(c.n)}</b><small>💪 ${mcPP(c)} · cote ${c.val} M€${c.trait?` · ${MC_TRAITS[c.trait].ic} ${MC_TRAITS[c.trait].t}`:""}</small>${mcMood(mcDealMood())}</div></div>
      <div class="bid-dial"><button data-act="mcdealamt" data-v="-5">−5</button><button data-act="mcdealamt" data-v="-1">−</button><b>${s.amt}<small> M€</small></b><button data-act="mcdealamt" data-v="1">+</button><button data-act="mcdealamt" data-v="5">+5</button></div>
      <p class="bid-note">${M.deals}/${MC.deals} propositions cette journée · 💰 tu as ${me.money} M€</p>
      <button class="btn" data-act="mcdealsend">💼 Envoyer la proposition</button>`; }
  if(s.t==="event") body = `<h3>Classement · journée ${M.season}/6</h3>${mcLeague()}<p class="bid-note">À la fin : +3 pts pour l'objectif secret, +1 pt par tranche de ${MC.valuePts} M€ de valeur du club (argent + cotes).</p>`;
  if(s.t==="rules") body = `<h3>Comment on joue</h3>${mcTutoSlides().map(x => `<p class="rule-l"><span>${x[0]}</span><span><b>${x[1]}</b><small>${x[2]}</small></span></p>`).join("")}
      <h3>Traits des joueurs</h3>${Object.values(MC_TRAITS).map(x => `<p class="rule-l"><span>${x.ic}</span><span><b>${x.t}</b><small>${x.d}</small></span></p>`).join("")}`;
  const an = M.fx==="sheet" ? " anim" : "";
  return `<div class="sheet-bg${an}" data-act="mcclose"></div><div class="sheet${an}">${body}</div>`;
}
function mcTutoSlides(){ return [
  ["🏟️","Un championnat à 4","6 journées, un match à chaque fois. Victoire 3 pts, nul 1. La dernière journée compte double."],
  ["📈","Achète bas, revends haut","Chaque joueur a une cote qui bouge avec ses buts et ses résultats. Les Pépites peuvent valoir 10× leur prix."],
  ["✉️","Enchères à l'aveugle","Tu mises en secret. Le plus offrant gagne et paie la 2ᵉ offre + 1 M€."],
  ["💼","Le bureau","Les présidents t'appellent : offres, transferts, pactes… et trahisons."],
  ["📰","Breaking news","À chaque journée, un rebondissement : offre du Golfe, star capricieuse, faillite…"],
  ["🏆","Le titre","Points + objectif secret (+3) + 1 pt par 50 M€ de valeur du club."]]; }

function screenMercatoPick(){
  const b = PROFILE.best, day = b.mercatoDay && b.mercatoDay.day===todayKey() ? b.mercatoDay : null;
  return {key:"mercatoPick", html:`
  <div class="subhead"><button class="iconbtn" data-act="nav" data-v="home" aria-label="Retour">${ICON.back}</button><h1>Mercato FC</h1></div>
  <div class="mc-hero"><div class="mc-hero-row"><span class="mc-hero-av" style="--pc:#ff4d6d">🦈</span><span class="mc-hero-av" style="--pc:#3ed38f">🧮</span><span class="mc-hero-av" style="--pc:#a98bff">🎓</span><span class="mc-hero-av" style="--pc:#ff9f3a">🔍</span></div>
   <p class="mc-hero-t">Mercato FC</p><p>Achète bas, revends haut, trahis au bon moment.<br>6 journées pour décrocher le titre.</p></div>
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

  if(M.phase==="news"){ const n = M.news, N = n && MC_NEWS[n.key];
    const card = M.drawn.length ? `<p class="mct-hint">🃏 Tu pioches</p><div class="drawn">${M.drawn.map((st,i) => mcHandCard(st, i, {flip:M.fx==="draw"})).join("")}</div>` : "";
    const head = M.season===1 ? `<div class="news calm"><span class="news-tag">COUP D'ENVOI</span><b>💰 ${me.money} M€ en caisse</b><p>Le mercato ouvre. Construis ton équipe à 5 et vise le titre.</p></div>`
      : !n ? `<div class="news calm"><span class="news-tag">JOURNÉE ${M.season}</span><b>Calme plat</b><p>Aucune info croustillante cette semaine.</p></div>`
      : `<div class="news${M.fx==="draw"?" in":""}"><span class="news-tag">⚡ BREAKING NEWS</span><span class="news-ic">${N.ic}</span><b>${N.t}</b><p>${esc(N.d(n))}</p>${n.done && n.out?`<p class="news-out">→ ${esc(n.out)}</p>`:""}</div>`;
    const choose = n && !n.done && !N.auto;
    return {key, html:mcTable(head + card,
      choose ? `<div class="dock-row">${N.a.map(([t], k) => `<button class="btn${k?" ghost":""}" data-act="mcnews" data-v="${k}">${t}</button>`).join("")}</div>` : `<button class="btn" data-act="mcgomkt">Au mercato →</button>`)}; }
  if(M.phase==="mercato"){
    const n = Object.keys(M.sel).length, used = Object.values(M.sel).reduce((a,b) => a+b, 0);
    return {key, html:mcTable(`<p class="mct-say">Jusqu'à ${M.buys} offres · ${me.money-used} M€ libres</p>
      <div class="mkt">${M.market.map(c => { const b = M.sel[c.uid];
        return `<button class="mkt-c${b!=null?" bid":""}${c.sale?" sale":""}" data-act="mcopen" data-v="${c.uid}">${cardHTML(c.id,{small:true})}${mcTraitTag(c)}<span class="mkt-i"><b>${c.price}</b> M€ · 💪${c.kind==="pepite"?"3→9":c.pp}</span>${c.sale?`<span class="sale-tag">SOLDÉ</span>`:""}${b!=null?`<span class="env">✉️ ${b}</span>`:""}</button>`; }).join("")}</div>`,
      `<button class="btn" data-act="mcresolve">${n?`Sceller ${n>1?`mes ${n} offres`:"mon offre"} ✉️`:"Passer ce mercato"}</button>`)};
  }
  if(M.phase==="reveal") return {key, html:mcTable(`<div class="reveal">${M.results.map((x, k) => `<div class="rv${x.w===me?" me":""}" style="animation-delay:${k*0.25}s;--pc:${x.w?x.w.col:"#fff3"}">
      <span class="rv-n"><b>${esc(cardName(x.c.n))} ${x.c.trait?MC_TRAITS[x.c.trait].ic:""}</b><small>${x.c.kind==="legend"?"⭐ ":x.c.kind==="pepite"?"🌱 ":""}base ${x.c.price} M€</small></span>
      <span class="rv-b">${x.bids.length?x.bids.map(([v,p], j) => `<i class="${j===0&&x.w?"win":""}">${p.ic} ${v}</i>`).join(""):`<i class="none">invendu</i>`}</span>
      ${x.w?`<span class="rv-w">${x.w.ic}<small>${x.price} M€</small></span>`:""}
      ${x.w===me?`<span class="rv-note">${x.starter?"✅ Titulaire":"🪑 Sur le banc"}${x.notes.length?" · "+esc(x.notes.join(", ")):""}</span>`:""}</div>`).join("")}</div>`,
      M.season===MC.flashSeason ? `<button class="btn flashbtn" data-act="mcflash">❄️ Mercato d'hiver flash !</button>` : `<button class="btn" data-act="mccoups">Au bureau 💼</button>`)};
  if(M.phase==="flash"){ const F = M.flashA, c = F.c;
    return {key, html:mcTable(`<div class="flash"><span class="flash-t">❄️ Mercato d'hiver · enchères en direct</span>
      <div class="flash-c">${cardHTML(c.id,{small:true})}${mcTraitTag(c)}</div>
      <div class="flash-p${F.done?"":" tick"}"><b>${F.done && F.w ? F.paid : F.price}</b><small>M€</small></div>
      <div class="flash-in">${M.players.map((p,k) => `<span class="${F.in[k]?"in":"out"}" style="--pc:${p.col}">${p.ic}</span>`).join("")}</div>
      ${F.done?`<p class="mct-say">${F.w?`${F.w.ic} ${esc(mcName(F.w))} ${F.w.bot?"remporte":"remportes"} ${esc(c.n)} !`:"Personne n'en veut !"}</p>`:`<p class="mct-hint">Cote ${c.val} M€ · le prix monte… le dernier en lice l'emporte.</p>`}</div>`,
      F.done ? `<button class="btn" data-act="mccoups">Au bureau 💼</button>` : F.in[0] ? `<button class="btn danger" data-act="mcflashdrop">✋ Je lâche !</button>` : `<button class="btn ghost" disabled>Tu es sorti…</button>`)}; }
  if(M.phase==="coups"){
    const o = M.inbox[0];
    if(o) return {key, html:mcTable(`<div class="alert offer phone"><span class="ring">📞</span><span class="alert-av">${o.by.ic}</span><small>${esc(o.by.n)} t'appelle</small><b>${o.amt} M€</b><p>pour <strong>${esc(o.c.n)}</strong> · cote ${o.c.val} M€${o.c.paid!=null?` · tu l'as payé ${o.c.paid}`:""}</p>
        <div class="mini-one">${mcMini(o.c)}</div>${M.inbox.length>1?`<i>${M.inbox.length-1} autre${M.inbox.length>2?"s":""} appel${M.inbox.length>2?"s":""} en attente</i>`:""}</div>`,
      `<button class="btn" data-act="mcinbox" data-v="ok">✅ Accepter ${o.amt} M€</button><div class="dock-row"><button class="btn ghost" data-act="mcinbox" data-v="counter">↗️ ${Math.round(o.amt*1.2)} M€ ?</button><button class="btn ghost" data-act="mcinbox" data-v="no">✋ Refuser</button></div>`)};
    return {key, html:mcTable(M.aim!=null
      ? `<p class="mct-say aimsay">${MC_CARDS[me.hand[M.aim]].ic} Touche un adversaire en haut</p><button class="linkbtn" data-act="mcaimcancel">Annuler</button>`
      : `${M.flash ? mcActHTML(M.flash, M.fx==="bub") : `<p class="mct-say">💼 Ton bureau</p><p class="mct-hint">Touche un président en haut pour lui acheter ou lui vendre un joueur.<br>Joue jusqu'à 2 cartes de ta main ↓</p>${mcCoalition()?`<p class="coal">⚠️ Tu es en tête : les présidents se liguent contre toi</p>`:""}`}`,
      M.aim!=null ? "" : `<button class="btn" data-act="mcendturn">Fin du bureau</button>`)};
  }
  if(M.phase==="react" || M.phase==="offer"){ const {by, st, c, cost} = M.pending, C = mcCardOf(st);
    return {key, html:mcTable(`<div class="alert ${M.phase}"><span class="alert-av">${by.ic}</span><small>${esc(by.n)} ${M.phase==="offer"?"te propose":"t'attaque"}</small><b>${C.ic} ${C.t}</b><p>${st==="mission" ? `Il veut t'arracher ${esc(c.n)} pour ${cost} M€ avec l'argent de son allié !` : esc(C.d)}</p>${C.p?`<i>${esc(C.p)}</i>`:""}</div>`,
      M.phase==="offer" ? `<button class="btn" data-act="mcanswer" data-v="1">🤝 J'accepte</button><button class="btn ghost" data-act="mcanswer" data-v="0">Refuser</button>`
      : `<button class="btn" data-act="mcanswer" data-v="1">🛡️ Contrat Blindé (${me.shield})</button><button class="btn ghost" data-act="mcanswer" data-v="0">Encaisser</button>`)}; }
  if(M.phase==="after"){ const a = M.show[M.si], n = M.show.length;
    return {key, html:mcTable(n
      ? `<p class="mct-say">Pendant ce temps… · ${M.si+1}/${n}</p>${mcActHTML(a, true)}`
      : `<p class="mct-say">Les présidents n'ont rien tenté</p><p class="mct-hint">Calme plat… pour l'instant.</p>`,
      M.si < n-1 ? `<button class="btn" data-act="mcshownext">Suivant →</button>` : `<button class="btn" data-act="mcmatch">Coup d'envoi ⚽</button>`)}; }
  if(M.phase==="match"){ const m = M.mine, o = M.other, evs = m.ev.filter(e => e.min>0), pre = m.ev.filter(e => e.min===0), end = mcEvDelay(m.ev, null);
    const res = m.ga>m.gb ? "win" : m.ga===m.gb ? "draw" : "loss", anim = M.fx==="match", side = p => p===m.a ? "l" : "r", goals = evs.filter(e => e.goal);
    let sa = 0, sb = 0;
    return {key, html:mcTable(`<div class="board${anim?" anim":""}">
       <div class="board-top">${M.season===MC.seasons?"🏆 Dernière journée · points ×2":`Journée ${M.season}`}</div>
       <div class="board-sc"><span class="crest" style="--pc:${m.a.col}">${m.a.ic}<small>Toi</small></span>
        <span class="score">${anim ? [0, ...goals].map(e => { if(e){ if(e.p===m.a) sa++; else sb++; } return `<b class="sc-step" style="animation-delay:${e?mcEvDelay(m.ev,e):0}s">${sa}<i>-</i>${sb}</b>`; }).join("") : `<b>${m.ga}<i>-</i>${m.gb}</b>`}</span>
        <span class="crest" style="--pc:${m.b.col}">${m.b.ic}<small>${esc(mcShort(m.b))}</small></span></div>
       <div class="board-f"><span>💪 ${m.fa.total}</span><span>💪 ${m.fb.total}</span></div>
       ${pre.map(e => `<p class="tl pre ${side(e.p)}">${esc(e.t)}</p>`).join("")}
       <div class="tl-list">${evs.map(e => `<p class="tl ${side(e.p)}${e.goal?" goal":""}" style="animation-delay:${mcEvDelay(m.ev,e)}s"><span class="tl-m">${e.min}'</span>${e.goal?"⚽ BUUUT ! ":""}${esc(e.t)}</p>`).join("")}</div>
       <div class="stamp s-${res}" style="animation-delay:${anim?end+0.4:0}s">${res==="win"?"VICTOIRE":res==="draw"?"MATCH NUL":"DÉFAITE"}</div>
      </div>
      <div class="after-match" style="animation-delay:${anim?end+0.8:0}s">
       <div class="cash"><b>💰 +${me.income} M€</b><small>billetterie${me.res==="V"?" + prime de victoire":me.res==="N"?" + prime du nul":""}${MC.tv[mcRank().indexOf(me)+1]?" + droits TV":""}</small></div>
       ${M.moves.length?`<div class="moves">${M.moves.map(x => `<span class="${x.c.val>x.old?"up":"down"}">${x.c.val>x.old?"📈":"📉"} ${esc(cardName(x.c.n))} ${x.old} → ${x.c.val}</span>`).join("")}</div>`:""}
       <p class="other">Autre match : ${o.a.ic} ${esc(mcShort(o.a))} <b>${o.ga} - ${o.gb}</b> ${esc(mcShort(o.b))} ${o.b.ic}</p>
       ${mcLeague()}
      </div>`,
      `<button class="btn" data-act="mcnext">${M.season<MC.seasons?`Journée ${M.season+1} →`:"Remise du trophée 🏆"}</button>`, "is-match")}; }
  if(M.phase==="end"){ const meRank = M.final.indexOf(me)+1;
    return {key:"mcend-"+(L.summary&&L.summary.coins), html:`<div class="stack mc-end">
     <div class="hero"><span class="eyebrow">Mercato FC · ${M.daily?"Partie du jour":MC_DIFF[M.diff].t}</span><h1 class="display" style="font-size:clamp(34px,10vw,50px)">${meRank===1?`Champion <span>!</span> 🏆`:`${meRank}ᵉ <span>sur 4</span>`}</h1></div>
     <div class="finals">${M.final.map((p,k) => `<div class="fin${p.bot?"":" me"}" style="animation-delay:${k*0.2}s;--pc:${p.col}"><span class="fin-rk">${k+1}</span><span class="seat-av">${p.ic}</span>
       <span class="fin-t"><b>${esc(mcName(p))}</b><small>${p.pts} pts · ${p.w}V ${p.d}N ${p.l}D · ${MC_SECRETS[p.secret]?.ic||""} ${p.secretOk?`+${MC.secretPts}`:"✗"} · 🏦 ${mcValue(p)} M€ → +${p.bonusValue}</small></span><span class="fin-s">${p.final}</span></div>`).join("")}</div>
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
  if(!["mcbid","mcdealamt"].includes(a)) mcSfx("tap");
  switch(a){
    case "mctuto": if(M.tuto < mcTutoSlides().length-1){ M.tuto++; mcR(); } else { PROFILE.best.mercatoTuto3 = 1; saveProfile(); M.phase = "secret"; mcR(); } break;
    case "mctutoskip": PROFILE.best.mercatoTuto3 = 1; saveProfile(); M.phase = "secret"; mcR(); break;
    case "mcsecret": me.secret = v; M.phase = "power"; mcR(); break;
    case "mcpower": me.power = v; mcSeasonStart(); break;
    case "mcnews": mcNewsChoose(+v); break;
    case "mcgomkt": if(M.news && !M.news.done && MC_NEWS[M.news.key].auto){ M.news.out = MC_NEWS[M.news.key].a[0][1](M.news); M.news.done = true; }
      M.phase = "mercato"; M.drawn = []; M.botBids = M.players.map(p => p.bot ? mcBotBids(p) : null);
      if(me.power==="flambeur"){ const all = M.botBids.flatMap((b, i) => (b||[]).map(([u, bid]) => ({p:M.players[i], c:M.market.find(c => c.uid===u), bid}))); if(all.length) M.spy = all[Math.floor(M.r()*all.length)]; }
      mcR(); break;
    case "mcopen": {
      if(M.sel[v]==null && Object.keys(M.sel).length >= M.buys) return toast(`${M.buys} offres maximum.`);
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
    case "mccoups": mcBureau(); break;
    case "mcinbox": mcInbox(v); break;
    case "mcdealbuy": { const p = M.players[M.sheet.i], c = mcRoster(p).find(x => x.uid===v); M.sheet = {t:"deal", mode:"buy", seat:M.sheet.i, u:v, amt:Math.max(1, Math.min(me.money, c.val + 5))}; mcR(); break; }
    case "mcdealsellpick": M.sheet = {t:"sellpick", seat:+v}; mcR(); break;
    case "mcdealsell": { const c = mcRoster(me).find(x => x.uid===v); M.sheet = {t:"deal", mode:"sell", seat:M.sheet.seat, u:v, amt:c.val + 5}; mcR(); break; }
    case "mcdealamt": M.sheet.amt = Math.max(1, M.sheet.amt + (+v)); if(M.sheet.mode==="buy") M.sheet.amt = Math.min(me.money, M.sheet.amt); mcSfx("coin"); mcR(); break;
    case "mcdealsend": mcDealSend(); break;
    case "mccard": M.aim = null; M.sheet = {t:"card", i:+v}; mcSfx("card"); mcR("sheet"); break;
    case "mcplay": mcPlay(+v); break;
    case "mcaim": mcPlay(M.aim, +v); break;
    case "mcpicktgt": mcPlay(M.sheet.i, M.sheet.seat, v); break;
    case "mcaimno": toast(mcCheck(me, me.hand[M.aim], M.players[+v]) || "Cible impossible."); break;
    case "mcaimcancel": M.aim = null; mcR(); break;
    case "mcendturn": M.aim = null; M.phase = "botsplay"; mcBotsStart(); break;
    case "mcanswer": mcAnswer(v==="1"); break;
    case "mcshownext": M.si++; { const x = M.show[M.si]; mcSfx(x.res==="blocked" ? "block" : x.st==="deal" ? "coin" : x.to ? "hit" : "card"); } mcR("act"); break;
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
