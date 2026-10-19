/* Football Legends — MERCATO FC v7 : une saison de championnat à 20 clubs.
   Toi + 3 présidents ordinateurs + 16 clubs gérés par l'IA (noms inventés).
   Équipe à 5 (1 gardien + 4 joueurs de champ) + 2 remplaçants, notes sur 99, âge et progression.
   La saison (38 journées) est découpée en 6 périodes : Infos → Mercato → Bureau → Matchs.
   Classement final des présidents : points du championnat + objectif secret + objectif de la direction.
   Tout se joue sur l'appareil ; la fin de partie rapporte XP et pièces comme les autres modes. */
"use strict";

const MC = {
  periods:6, rounds:[6,6,7,6,7,6], buys:2, handMax:3, plays:2, squad:16, bench:5, deals:3,
  income:16, winBonus:3, bankRatio:0.8, secretPts:5, fee:1, pactLen:2, flashPeriod:4, clauseMult:1.5, wageCap:24, wageRate:0.045, minSquad:13
};
const MC_PERIODS = ["Mercato d'été · août", "Septembre · octobre", "Novembre · décembre", "Mercato d'hiver · janvier", "Février · mars", "Sprint final · avril-mai"];
const MC_CUP = {2:"8es de finale", 3:"Quarts de finale", 5:"Demi-finales", 6:"Finale"};
const mcSlot = c => c.pos==="G" ? "G" : "F";
const MC_SLOTS = {G:1, F:10};
const MC_POS = {GK:"G", DEF:"DEF", MID:"MIL", ATT:"ATT"};
const MC_POS_FR = {G:"Gardien", DEF:"Défenseur", MIL:"Milieu", ATT:"Attaquant"};
const MC_DIFF = {
  easy:{t:"Facile", b:"Vestiaire tranquille", d:"Présidents amateurs"},
  normal:{t:"Moyen", b:"Vrai mercato", d:"Chacun sa stratégie"},
  hard:{t:"Difficile", b:"Fosse aux requins", d:"Ils complotent contre le leader"}
};
const MC_BOTS = [
  {prof:"A", n:"Le Requin", s:"Requin", ic:"🦈", col:"#ff4d6d", club:"Squalo City"},
  {prof:"B", n:"Le Comptable", s:"Comptable", ic:"🧮", col:"#3ed38f", club:"Bilan Athletic"},
  {prof:"C", n:"Le Professeur", s:"Prof", ic:"🎓", col:"#a98bff", club:"Académie FC"},
  {prof:"D", n:"Le Dénicheur", s:"Dénicheur", ic:"🔍", col:"#ff9f3a", club:"Scouting Rovers"}
];
/* 16 clubs gérés par l'IA : noms inventés */
const MC_CPU = [
  ["Red Lions FC","🦁","#d7263d",3], ["Northbridge United","🌉","#2b59c3",3], ["Real Montaña","⛰️","#f2c14e",3],
  ["Inter Solaris","☀️","#1b998b",2], ["Olympique Mistral","🌬️","#4ea5d9",2], ["AC Vesuvio","🌋","#c0392b",2], ["Dynamo Kastel","🏰","#5c4d7d",2], ["Atlético Brisa","🌊","#e4572e",2], ["Celtic Harbour","⚓","#2e8b57",2],
  ["Sporting Lune","🌙","#6c5ce7",1], ["Racing Corsaire","🏴‍☠️","#2d3436",1], ["FC Nordwind","❄️","#74b9ff",1], ["Union Albatros","🕊️","#00b894",1], ["Stade Aurore","🌅","#fd9644",1], ["Polder 1903","🌷","#e17055",1], ["Athletic Ciervo","🦌","#8e5a2b",1]
];
/* clubs de départ : budget, objectif, style, particularité et coefficient (équité : on gagne à la progression) */
const MC_PROFILES = {
  petro:{ic:"💰", n:"Émirats Athletic", t:"Le club des pétrodollars", d:"Budget énorme, effectif de stars. La Ligue le surveille : soupçons 2× plus rapides.", money:120, goal:3, sys:"4-2-3-1", coef:1.25, sus:2, mix:"top"},
  historique:{ic:"🏛️", n:"Sporting Vieille Garde", t:"Le club historique en déclin", d:"Stade plein (+4 M€ de billetterie par période), mais 40 M€ de dettes qui coûtent des intérêts.", money:50, debt:40, gate:4, goal:6, sys:"4-3-3", coef:1, mix:"good"},
  formateur:{ic:"🌱", n:"Academica Verde", t:"Le club formateur", d:"Des Pépites qui progressent 2× plus vite et partent très cher.", money:45, goal:10, sys:"5-3-2", coef:0.9, boost:true, mix:"young"},
  populaire:{ic:"🔥", n:"Racing Populaire", t:"Le club populaire", d:"Ultras : +2 de note à domicile. Mais 3 défaites de suite = grève des supporters (−5 M€).", money:60, goal:8, sys:"4-3-3", coef:1, home:2, mix:"mid"},
  fonds:{ic:"🏦", n:"Capital United", t:"Le club racheté par un fonds", d:"Le fonds veut des plus-values : +5 pts de progression par revente à +20 M€.", money:90, goal:5, sys:"4-2-3-1", coef:1.1, resale:true, mix:"good"},
  poucet:{ic:"🐭", n:"US Petit Poucet", t:"Le Petit Poucet", d:"25 M€ et des inconnus. Personne ne le soupçonne : soupçons 2× plus lents.", money:25, goal:15, sys:"5-3-2", coef:1.4, sus:0.5, mix:"weak"},
  galacticos:{ic:"👑", n:"Galácticos Club", t:"Le club des stars · débloqué", d:"Des Légendes partout, peu de cash, et la direction veut le titre.", money:45, goal:1, sys:"4-3-3", coef:0.8, mix:"top", lock:"champ"},
  phoenix:{ic:"🦅", n:"Phoenix Rovers", t:"Le club en crise · débloqué", d:"40 M€ et des seconds couteaux. Le maintien… ou l'exploit.", money:40, goal:16, sys:"4-4-2", coef:1.8, mix:"weak", lock:"cup"}
};
const MC_BASE = ["petro","historique","formateur","populaire","fonds","poucet"];
/* systèmes de jeu : postes de gauche à droite, ligne par ligne depuis le gardien */
const MC_SYS = {
  "4-4-2":{st:null, rows:[1,4,4,2], s:["GB","DG","DC","DC","DD","AG","MC","MC","AD","BU","BU"], mod:{}, d:"Équilibré : ni bonus ni malus"},
  "4-3-3":{st:"pressing", rows:[1,4,3,3], s:["GB","DG","DC","DC","DD","MC","MDC","MC","AG","BU","AD"], mod:{A:2, D:-1}, d:"Pressing : attaque +2, défense −1"},
  "4-2-3-1":{st:"possession", rows:[1,4,2,3,1], s:["GB","DG","DC","DC","DD","MDC","MDC","AG","MOC","AD","BU"], mod:{M:1}, d:"Possession : milieu +1"},
  "3-5-2":{st:"possession", rows:[1,3,5,2], s:["GB","DC","DC","DC","DG","MC","MDC","MC","DD","BU","BU"], mod:{M:2, D:-1}, d:"Possession : milieu +2, défense −1"},
  "5-3-2":{st:"contre", rows:[1,5,3,2], s:["GB","DG","DC","DC","DC","DD","MC","MDC","MC","BU","BU"], mod:{D:2, A:-2}, d:"Contre-attaque : défense +2, attaque −2"}
};
const MC_STYLE = {pressing:{ic:"⚡", t:"Pressing", beats:"possession"}, possession:{ic:"🎯", t:"Possession", beats:"contre"}, contre:{ic:"🏹", t:"Contre-attaque", beats:"pressing"}};
const MC_LINE = {GB:"G", DC:"D", DG:"D", DD:"D", MDC:"M", MC:"M", MOC:"M", AG:"A", AD:"A", BU:"A"};
const MC_PO_FR = {GB:"Gardien", DC:"Défenseur central", DG:"Latéral gauche", DD:"Latéral droit", MDC:"Milieu défensif", MC:"Milieu", MOC:"Milieu offensif", AG:"Ailier gauche", AD:"Ailier droit", BU:"Avant-centre"};
const MC_ADJ = {D:{D:0.85, M:0.7, A:0.5}, M:{M:0.85, D:0.7, A:0.7}, A:{A:0.85, M:0.7, D:0.5}};
const MC_PLAN = ["G","G","D","D","D","D","D","M","M","M","M","M","A","A","A"];
const MC_MIX = {top:"LLLLRRRRRRCCCCC", good:"LLRRRRRRCCCCCCP", mid:"LRRRRCCCCCCCCPP", young:"RRRCCCCPPPPPPPP", weak:"RCCCCCCCCCCCCPP", cpu3:"LLLRRRRRRCCCCCC", cpu2:"LRRRRRCCCCCCCCP", cpu1:"RRRCCCCCCCCCCCP"};
const MC_POWERS = {
  flambeur:{ic:"🎲", t:"Le Flambeur", d:"À chaque mercato, tu espionnes une offre adverse."},
  formateur:{ic:"🌱", t:"Le Formateur", d:"Tes jeunes progressent 2× plus vite."},
  negociateur:{ic:"🤝", t:"Le Négociateur", d:"−10 % sur tous tes achats."},
  tacticien:{ic:"📋", t:"Le Tacticien", d:"Tes combos rapportent 2× plus."},
  trader:{ic:"📈", t:"Le Trader", d:"Tu revends à la banque à 100 % de la cote (au lieu de 80 %)."},
  motivateur:{ic:"📣", t:"Le Motivateur", d:"Bonus de série doublé, et personne ne boude sur ton banc.", lock:"hard"},
  chasseur:{ic:"🎯", t:"Le Chasseur de têtes", d:"Rapports du recruteur gratuits et Pépites du marché −20 %.", lock:"gain50"},
  mecene:{ic:"🏦", t:"Le Mécène", d:"+4 M€ de recettes à chaque période.", lock:"rich150"}
};
/* succès : chacun débloque un club ou un pouvoir */
const MC_ACH = {
  champ:{ic:"🏆", t:"Champion", d:"Finir 1er du championnat.", u:"le club 👑 Galácticos"},
  hard:{ic:"🦈", t:"Roi des requins", d:"Être le meilleur président en Difficile.", u:"le pouvoir 📣 Motivateur"},
  gain50:{ic:"📈", t:"Coup de maître", d:"Revendre un joueur 50 M€ de plus que son prix d'achat.", u:"le pouvoir 🎯 Chasseur de têtes"},
  rich150:{ic:"🏦", t:"Coffre-fort", d:"Finir une saison avec 150 M€ en caisse.", u:"le pouvoir 🏦 Mécène"},
  cup:{ic:"🥇", t:"Coupe aux grandes oreilles", d:"Gagner la coupe.", u:"le club 🔥 Phoenix Rovers"}
};
const mcHas = k => !!(PROFILE.best.mcAch && PROFILE.best.mcAch[k]);
const mcOpen = o => !o.lock || mcHas(o.lock);
/* clubs promus quand un club IA descend (mode carrière) */
const MC_PROMO = [["Wanderers Brume","🌫️","#7f8c8d"], ["Corinthian Vale","🏛️","#8e44ad"], ["Rapid Falcon","🦅","#d35400"], ["Spartak Ombre","🌑","#34495e"], ["Clyde Rovers","🛶","#16a085"], ["Ajax Riviera","🏖️","#e84393"], ["Benfica Doré","🥇","#b7950b"], ["Hertha Fjord","🏔️","#2980b9"], ["Torino Notte","🌃","#2c3e50"], ["Dukla Cobalt","🔷","#1e3799"], ["Boca Tango","💃","#f6b93b"], ["Fenix Porto","🐦‍🔥","#eb2f06"]];
const MC_TRAITS = {
  capitaine:{ic:"🎖️", t:"Capitaine", d:"+2 à la note de l'équipe s'il est titulaire."},
  clutch:{ic:"⏰", t:"Clutch", d:"+4 de note sur les deux dernières périodes."},
  fragile:{ic:"🩹", t:"Fragile", d:"1 chance sur 4 de rater chaque match."},
  ego:{ic:"😤", t:"Ego", d:"−2 à la note de l'équipe s'il est remplaçant."},
  fidele:{ic:"🔒", t:"Fidèle", d:"Pas à vendre, impossible à voler."}
};
/* ---------- affaires : le légal, le louche et le franchement illégal */
const MC_AF = {
  prime:{ic:"🏅", t:"Prime de match", k:"legal", cost:4, sus:0, d:"Les joueurs touchent une prime : +3 de note sur la période."},
  clause:{ic:"💼", t:"Clause libératoire", k:"atk", pick:true, sus:0, legal:true, d:"Tu lui prends un joueur en payant 1,5× sa cote (l'argent va à lui). Parfaitement légal."},
  pacte:{ic:"🤝", t:"Pacte secret", k:"pacte", sus:0, d:"Alliance secrète 2 périodes : +1 de note chacun, pas d'attaque entre vous, transferts amicaux."},
  trahison:{ic:"🗡️", t:"Trahison", k:"betray", sus:0, d:"Tu romps ton pacte : tu lui voles 15 M€ et son équipe perd 3 de note sur la période."},
  pari:{ic:"🎲", t:"Le pari du cousin", k:"self", bet:true, sus:10, d:"Ton cousin mise pour toi sur le résultat de ton gros match. Bon pronostic : ×3 la mise."},
  arrange:{ic:"🤫", t:"Le match arrangé", k:"self", cost:12, sus:30, d:"Une enveloppe au club du gros match : il lève le pied (−15 de note). Combiné au pari, c'est le jackpot.", need:() => !M.bigOpp ? "Pas de gros match." : !M.bigOpp.cpu ? "Ton gros match est contre un président : il ne se laissera pas acheter." : null},
  comptes:{ic:"📒", t:"Les comptes maquillés", k:"self", once:true, sus:20, d:"Des comptes « optimistes » devant la DNCG : +30 M€ de crédit tout de suite, 35 M€ à rembourser en fin de saison."},
  retro:{ic:"💸", t:"La rétrocommission", k:"self", cost:2, sus:15, d:"Un agent ami gonfle tes ventes : +20 % sur chaque joueur vendu à un club cette période."},
  sponsor:{ic:"🏢", t:"Le sponsor fantôme", k:"self", once:true, sus:5, d:"Une société écran sponsorise ton club : +6 M€ à chaque période jusqu'à la fin de saison (+5 soupçons à chaque fois)."},
  miroir:{ic:"🔄", t:"Le transfert miroir", k:"self", sus:15, d:"Avec ton allié secret, vous vous échangez des joueurs à prix gonflés : la cote de vos 3 meilleurs prend +15 %.", need:p => mcAllies(p).length ? null : "Il te faut un allié secret (pacte)."},
  chantage:{ic:"📸", t:"Le dossier compromettant", k:"atk", pick:true, mise:5, sus:15, d:"Tu as des photos. Il te vend le joueur de ton choix à 60 % de sa cote."},
  fuite:{ic:"📰", t:"La fuite organisée", k:"atk", mise:4, sus:10, d:"Une rumeur bien placée sur sa star : −20 % de cote, et son équipe perd 2 de note."},
  taupe:{ic:"🕵️", t:"La taupe dans le vestiaire", k:"spy", cost:5, sus:5, d:"En secret : pendant 2 périodes, tu vois ses soupçons, ses parades et ses magouilles. Il ne saura jamais qu'il est observé."},
  pelouse:{ic:"🪣", t:"La pelouse arrosée", k:"atk", mise:4, sus:10, d:"Un jardinier zélé : −3 de note pour son équipe sur la période."},
  detective:{ic:"🔎", t:"Le détective privé", k:"inv", cost:6, sus:0, d:"En toute discrétion, il fouille chez un rival : soupçons et magouilles en cours. S'il triche, tu peux le dénoncer à la Ligue (prime de 10 M€). S'il est clean, la dénonciation te coûte cher."},
  gala:{ic:"🥂", t:"Gala de charité", k:"clean", cost:8, sus:0, d:"Une belle photo avec un chèque géant : −20 soupçons."},
  tenor:{ic:"👔", t:"Un ténor du barreau", k:"clean", cost:12, sus:0, d:"Il nettoie ton dossier : −35 soupçons."},
  mission:{ic:"🎯", t:"Mission secrète", k:"atk", sus:0, hidden:true, d:""}
};
const MC_AF_MENU = [["Légal", ["prime","clause","pacte","trahison"]], ["Magouilles", ["pari","arrange","comptes","retro","sponsor","miroir"]], ["Coups bas", ["chantage","fuite","pelouse"]], ["Espionner en secret", ["taupe","detective"]], ["Se blanchir", ["gala","tenor"]]];
const MC_CASE = {pari:"paris truqués", arrange:"match arrangé", comptes:"comptes maquillés", retro:"rétrocommissions", sponsor:"sponsor fantôme", miroir:"transferts fictifs", chantage:"chantage", fuite:"fuites organisées", taupe:"espionnage", pelouse:"sabotage"};
/* parades : on les pioche ou on les achète ; elles retournent le coup contre l'attaquant */
const MC_PAR = {
  avocat:{ic:"⚖️", t:"L'avocat", vs:["chantage","fuite","clause","mission"], price:8, d:"Contre un chantage, une fuite ou une clause : coup annulé, l'attaquant perd sa mise et prend +20 soupçons."},
  contre:{ic:"🔍", t:"Le contre-espionnage", vs:["pelouse","chantage"], price:6, d:"Contre une pelouse arrosée ou un chantage : tu démasques l'attaquant, tu l'espionnes pendant 2 périodes et il perd sa mise."},
  ligue:{ic:"📞", t:"L'appel à la Ligue", vs:"*", price:9, d:"Contre n'importe quelle attaque : la Ligue enquête aussitôt sur l'attaquant."},
  presse:{ic:"🎙️", t:"La conférence de presse", vs:["fuite","pelouse"], price:5, d:"Contre une fuite ou une pelouse : l'affaire se retourne, −2 de note pour l'attaquant."}
};
const MC_PDECK = {avocat:4, contre:4, ligue:2, presse:4};
const MC_SECRETS = {
  club3:{ic:"🏟️", t:"Esprit de clocher", d:"3 titulaires venant du même club (sur leur carte).", ok:p => Math.max(0, ...Object.values(mcCount(p.team.map(c => c.club)))) >= 3},
  legend2:{ic:"🌟", t:"Galáctico", d:"Posséder 2 Légendes.", ok:p => mcRoster(p).filter(c => c.kind==="legend").length >= 2},
  trade:{ic:"📈", t:"Coup du siècle", d:"Revendre un joueur 25 M€ de plus que son prix d'achat.", ok:p => p.bestGain >= 25},
  rich:{ic:"💰", t:"Trésorier", d:"Finir la saison avec 80 M€ ou plus.", ok:p => p.money >= 80},
  clean:{ic:"😇", t:"Casier vierge", d:"Ne jamais subir de coup bas.", ok:p => !p.hit},
  europe:{ic:"🇪🇺", t:"Coupe d'Europe", d:"Finir dans le top 6.", ok:p => mcLeague().indexOf(p) < 6},
  traitor:{ic:"🗡️", t:"Agent double", d:"Trahir un allié au moins une fois.", ok:p => p.betrayed >= 1},
  scorer:{ic:"⚽", t:"Machine à buts", d:"Marquer 60 buts ou plus.", ok:p => p.gf >= 60}
};

/* ---------- petits outils */
function mcCount(arr){ const o = {}; arr.forEach(x => o[x] = (o[x]||0)+1); return o; }
function mcShuffle(a, r){ for(let k=a.length-1;k>0;k--){ const j = Math.floor(r()*(k+1)); [a[k],a[j]] = [a[j],a[k]]; } return a; }
const mcRoster = p => [...p.team, ...p.bench];
const mcFree = (p, c) => mcRoster(p).length < MC.squad;
const mcOvr = c => c.ovr + (c.trait==="clutch" && M && M.period>=5 ? 4 : 0);
const mcMe = () => M.players[0];
const mcIdx = p => M.players.indexOf(p);
const mcName = p => p.cpu ? p.n : p.bot ? p.n : "Toi";
const mcShort = p => p.cpu ? p.n : p.bot ? MC_BOTS.find(x => x.prof===p.prof).s : "Toi";
const mcWage = c => Math.max(0.3, Math.round(c.val * MC.wageRate * 10) / 10);
const mcWages = p => Math.round(mcRoster(p).reduce((s,c) => s + mcWage(c), 0));
const mcCanSell = p => mcRoster(p).length > MC.minSquad;
const mcFortune = p => p.money + mcRoster(p).reduce((s,c) => s + c.val, 0) - (p.debt||0) - (p.loan||0);
const mcPoFr = c => `${MC_PO_FR[c.po]||""}${(c.ps||[]).length ? ` (${c.ps.join(", ")})` : ""}`;
function mcFit(c, sl){ if(!c) return 0; if(c.po===sl) return 1; if((c.ps||[]).includes(sl)) return 0.95; const a = MC_LINE[c.po]||"M", b = MC_LINE[sl]; if(a==="G" || b==="G") return a===b ? 1 : 0.3; return MC_ADJ[a][b]; }
const mcEff = (c, sl) => Math.round(mcOvr(c) * mcFit(c, sl));
const mcSys = p => MC_SYS[p.sys] || MC_SYS["4-4-2"];
const mcBank = (p, c) => Math.round(c.val * (p.power==="trader" ? 1 : MC.bankRatio));
const mcOut = c => M.susp.has(c.uid) || c.inj > 0;
/* un remplaçant boude s'il reste 2 périodes sur le banc alors qu'il vaut presque un titulaire */
const mcSulk = c => { if((c.bn||0) < 2 || c.ovr < 76 || c.age <= 21 || c.trait==="fidele" || c.inj > 0) return false;
  const k = M && M.clubs && mcOwner(c); if(!k || k.cpu) return false; const st = k.team.filter(o => mcSlot(o)===mcSlot(c) && !o.inj);
  return !st.length || c.ovr >= Math.min(...st.map(o => o.ovr)) - 3; };
const mcHeal = c => 3 + Math.round(c.val * 0.1);
const mcListPrice = c => Math.max(1, Math.round(c.val * (c.inj>0 ? 0.88 : 1.05)));
const mcRenew = c => Math.max(2, Math.round(c.val * 0.2));
const mcCN = k => !k ? "Libre" : typeof k==="string" ? k : k.cpu ? k.n : (k.prof==="me" ? k.n : k.club || k.n);
/* journal des transferts (saison en cours + fiche de chaque joueur) */
function mcLog(c, from, to, amt, kind){
  const e = {s:M.season||1, p:M.period, n:c.n, f:mcCN(from), t:mcCN(to), a:amt, k:kind};
  (M.tlog ||= []).push(e); (c.th ||= []).push(e);
  if(M.tlog.length > 160) M.tlog.splice(0, M.tlog.length - 160);
}
function mcStreak(p){
  const f = p.form.slice(-3); if(f.length < 3) return null;
  if(f.every(x => x==="V")) return {t:"🔥 Série de victoires", v:p.power==="motivateur" ? 4 : 2};
  if(f.every(x => x==="D")) return {t:"🥶 Série noire", v:-2};
  return null;
}
let M = null;

/* ---------- sons (synthétisés) */
let MC_AC = null;
const MC_VIB = {goal:[60,40,140], hit:[180], win:[80,50,80,50,220], block:[40,30,40], sign:[50,30,50,30,120]};
function mcSfx(kind){
  if(PROFILE.best.mcMute) return;
  try{ if(MC_VIB[kind] && navigator.vibrate) navigator.vibrate(MC_VIB[kind]); }catch(e){}
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
    if(kind==="sign") { tone(392, 0.12, "triangle", 0.1); tone(523, 0.12, "triangle", 0.1, 0.12); tone(784, 0.4, "triangle", 0.12, 0.24); noise(0.5, 0.12, 0.2, 2500); }
  }catch(e){}
}
/* ambiance de stade pendant le gros match (coupée avec le son) */
let MC_CROWD = null;
function mcCrowd(on, dur){
  if(MC_CROWD){ try{ const g = MC_CROWD.g, t = MC_AC.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0.0001, t+0.6); const s = MC_CROWD; setTimeout(() => { try{ s.src.stop(); s.lfo.stop(); }catch(e){} }, 700); }catch(e){} MC_CROWD = null; }
  if(!on || PROFILE.best.mcMute) return;
  try{
    MC_AC = MC_AC || new (window.AudioContext || window.webkitAudioContext)();
    const ac = MC_AC, t = ac.currentTime, len = ac.sampleRate*3, b = ac.createBuffer(1, len, ac.sampleRate), ch = b.getChannelData(0);
    let last = 0; for(let i=0;i<len;i++){ last = (last + 0.02*(Math.random()*2-1)) / 1.02; ch[i] = last*3.5; }
    const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
    src.buffer = b; src.loop = true; f.type = "lowpass"; f.frequency.value = 900; lfo.frequency.value = 0.25; lg.gain.value = 0.025;
    lfo.connect(lg); lg.connect(g.gain); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.07, t+1.2);
    src.connect(f); f.connect(g); g.connect(ac.destination); src.start(t); lfo.start(t);
    MC_CROWD = {src, g, lfo};
    if(dur) setTimeout(() => { if(MC_CROWD && MC_CROWD.src===src) mcCrowd(false); }, dur*1000);
  }catch(e){}
}

/* ======================================================================
   JOUEURS : note /99, âge, potentiel, cote
   ====================================================================== */
function mcFair(c){
  let v = 3 * Math.pow(1.105, c.ovr - 60);
  if(c.age <= 21) v += Math.max(0, c.pot - c.ovr) * 0.35;
  if(c.age >= 30) v *= Math.max(0.45, 1 - 0.09*(c.age - 29));
  return v;
}
const mcRevalue = c => { c.val = Math.max(1, Math.round(mcFair(c) * c.form)); };
function mcMake(card, kind, r){
  const x = hashStr(card.id+"mc") >>> 0, tk = Object.keys(MC_TRAITS);
  const c = {uid:uid(), id:card.id, n:card.n, club:card.c, lg:card.lg, pos:MC_POS[card.p]||"MIL", kind, form:1,
    trait: kind!=="pepite" && x%100 < 30 ? tk[(x>>>8) % tk.length] : null};
  if(kind==="legend"){ c.ovr = (card.r==="icon" ? 89 : 85) + x%5; c.age = 29 + (x>>>4)%6; }
  else if(kind==="rare"){ c.ovr = 78 + x%7; c.age = 23 + (x>>>4)%9; }
  else if(kind==="common"){ c.ovr = 68 + x%10; c.age = 21 + (x>>>4)%12; }
  else { c.ovr = 58 + x%10; c.age = 18 + (x>>>4)%2; c.pot = 72 + (x>>>6)%19; }
  if(!c.pot) c.pot = c.ovr + (c.age < 24 ? 2 + x%4 : 0);
  const map = (window.FL_POSTES||{})[card.id];
  if(map){ const a = map.split("/"); c.po = a[0]; c.ps = a.slice(1); }
  else { const d = {GK:["GB"], DEF:["DC","DC","DG","DD"], MID:["MC","MC","MDC","MOC"], ATT:["BU","BU","AG","AD"]}[card.p] || ["MC"]; c.po = d[(x>>>12) % d.length];
    c.ps = {DG:["DD"], DD:["DG"], MDC:["MC"], MC:[(x>>>14)%2 ? "MOC" : "MDC"], MOC:["MC"], AG:["AD"], AD:["AG"], BU:(x>>>14)%3 ? [] : ["MOC"]}[c.po] || []; }
  c.ct = kind==="pepite" ? 3 : kind==="legend" ? 1 + (x>>>10)%2 : 1 + (x>>>10)%4;
  c.kind = kind==="pepite" ? "pepite" : kind==="legend" ? "legend" : "regular";
  mcRevalue(c); return c;
}
/* paquet par rareté, tiré du catalogue des cartes */
function mcPools(r){
  const pick = arr => mcShuffle([...arr], r);
  const used = new Set(), take = (arr, n) => { const out = []; for(const c of arr){ if(out.length>=n) break; if(!used.has(c.id)){ used.add(c.id); out.push(c); } } return out; };
  return {
    legend: take(pick(CARDS.filter(c => c.r==="legend" || c.r==="icon")), 200),
    rare: take(pick(CARDS.filter(c => c.r==="rare")), 200),
    common: take(pick(CARDS.filter(c => c.r==="common")), 340),
    pepite: take(pick(CARDS.filter(c => c.r==="common")), 200)
  };
}
/* en carrière, les paquets se vident : on les recharge avec les cartes qui ne sont dans aucun effectif */
function mcPoolFill(){
  const inUse = new Set(M.clubs.flatMap(k => mcRoster(k).map(c => c.id)).concat((M.freeAg||[]).map(c => c.id)));
  Object.keys(M.pools).forEach(kind => { if(M.pools[kind].length >= 12) return;
    const want = kind==="legend" ? c => c.r==="legend" || c.r==="icon" : kind==="rare" ? c => c.r==="rare" : c => c.r==="common";
    const have = new Set(M.pools[kind].map(c => c.id));
    M.pools[kind].push(...mcShuffle(CARDS.filter(c => want(c) && !inUse.has(c.id) && !have.has(c.id)), M.r).slice(0, 40)); });
}
const MC_LCARD = {G:"GK", D:"DEF", M:"MID", A:"ATT"};
function mcDrawPlayer(kind, line){
  const order = [kind, ...["rare","common","pepite","legend"].filter(k => k!==kind)];
  for(const k of order){ const pool = M.pools[k]; if(!pool || !pool.length) continue;
    const i = !line ? 0 : line==="F" ? pool.findIndex(c => c.p!=="GK") : line==="G" ? pool.findIndex(c => c.p==="GK") : pool.findIndex(c => c.p===MC_LCARD[line]);
    if(i < 0) continue;
    return mcMake(pool.splice(i, 1)[0], k, M.sr); }
  return null;
}
function mcPdeck(r){ return mcShuffle(Object.entries(MC_PDECK).flatMap(([k, n]) => Array(n).fill(k)), r); }
function mcDraw(p, n){ const got = []; for(let k=0;k<n;k++){ if(!M.pdeck.length) M.pdeck = mcPdeck(M.r); const c = M.pdeck.pop(); p.hand.push(c); got.push(c); } while(p.hand.length > MC.handMax) p.hand.shift(); return got; }

/* ---------- construction d'un effectif : 1 gardien + 4 joueurs de champ + banc */
function mcBuildSquad(club, mixKey){
  club.team = []; club.bench = [];
  const kinds = mcShuffle((MC_MIX[mixKey] || MC_MIX.mid).split(""), M.sr).map(x => ({L:"legend", R:"rare", C:"common", P:"pepite"})[x]);
  MC_PLAN.forEach((line, k) => { const c = mcDrawPlayer(kinds[k], line); if(c){ c.paid = c.val; club.bench.push(c); } });
  club.sys = club.sys || Object.keys(MC_SYS)[Math.floor(M.sr()*5)];
  mcLineup(club);
}

/* ---------- calendrier : 38 journées (aller-retour, méthode du cercle) */
function mcFixtures(n, r){
  const ids = mcShuffle([...Array(n).keys()], r), rounds = [];
  for(let k=0;k<n-1;k++){
    const rd = []; for(let i=0;i<n/2;i++){ const a = ids[i], b = ids[n-1-i]; rd.push(k%2 ? [b,a] : [a,b]); } rounds.push(rd);
    ids.splice(1, 0, ids.pop());
  }
  return [...rounds, ...rounds.map(rd => rd.map(([a,b]) => [b,a]))];
}

/* ======================================================================
   DÉMARRAGE
   ====================================================================== */
function startMercato(diff, opt={}){
  leaveGame(false, true); mcStopFlash();
  const daily = !!opt.daily, sr = rng(daily ? hashStr("mercato7"+todayKey()) : Date.now() % 1e9);
  const r = rng((Date.now() ^ 0x5bd1e995) % 1e9);
  M = {diff, daily, r, sr, v:0, period:1, pools:mcPools(sr), pdeck:mcPdeck(sr), phase:(PROFILE.best.mercatoTuto5 ? "club" : "tuto"), tuto:0,
       market:[], won:{}, susp:new Set(), sel:{}, results:[], pacts:[], bub:{}, show:[], si:0, flash:null, sheet:null, aim:null, played:0, fx:null,
       flashA:null, inbox:[], news:null, buys:MC.buys, deals:0, drawn:[], moves:[], round:0, season:1, palmares:[], tlog:[], bond:{}, feud:{}, bondOld:{}};
  M.newsPlan = [null, ...mcShuffle(Object.keys(MC_NEWS), sr).slice(0, MC.periods-1)];
  const keys = Object.keys(MC_SECRETS);
  M.secretChoice = mcShuffle([...keys], sr).slice(0, 2);
  const pw = Object.keys(MC_POWERS).filter(k => mcOpen(MC_POWERS[k])), fresh = pw.filter(k => MC_POWERS[k].lock);
  M.powerChoice = [...new Set([...mcShuffle(fresh, sr).slice(0, 1), ...mcShuffle(pw, sr)])].slice(0, 3);
  VIEW = "mercato"; mcR();
}
const mcBlank = o => Object.assign({team:[], bench:[], hand:[], par:[], sus:0, cases:[], recent:[], bonusPts:0, pts:0, gf:0, ga:0, w:0, d:0, l:0, form:[], money:0, hit:false, betrayed:0, bas:0, mod:0, mods:[], buys:[], bestGain:0, grudge:null, mission:false, income:0}, o);
/* le joueur a choisi son club : on crée la ligue */
function mcSetup(profile){
  M.len = M.len || 1;
  const sr = M.sr, P = MC_PROFILES[profile], f = {easy:0.85, normal:1, hard:1.15}[M.diff];
  const me = mcBlank({n:P.n, ic:P.ic, prof:"me", bot:false, col:"#ffd23f", money:P.money, debt:P.debt||0, goal:P.goal, profile, sys:P.sys});
  const others = mcShuffle(MC_BASE.filter(k => k!==profile), sr);
  const bots = mcShuffle([...MC_BOTS], sr).slice(0, 3).map((b, i) => { const Q = MC_PROFILES[others[i]];
    return mcBlank({n:b.n, club:b.club, ic:b.ic, prof:b.prof, bot:true, col:b.col, money:Math.round(Q.money*f), debt:Q.debt||0, goal:Q.goal, profile:others[i], sys:Q.sys}); });
  M.players = [me, ...bots];
  M.players.forEach(p => { mcBuildSquad(p, MC_PROFILES[p.profile].mix); if(p.bot) p.secret = mcShuffle(Object.keys(MC_SECRETS), sr)[0]; });
  if(P.boost) mcRoster(me).filter(c => c.age<=21).forEach(c => { c.pot = Math.max(c.pot, 82 + Math.floor(sr()*9)); c.ovr += 3; mcRevalue(c); c.paid = c.val; });
  M.cpu = MC_CPU.map(([n, ic, col, tier]) => { const c = mcBlank({n, ic, col, cpu:true, tier}); mcBuildSquad(c, "cpu"+tier); return c; });
  M.clubs = [...M.players, ...M.cpu];
  mcCupInit();
  M.fixtures = mcFixtures(20, sr);
  M.players.forEach(p => { mcDrawPar(p, 1); p.fort0 = mcFortune(p); });
  M.phase = "secret"; mcR();
}
/* parades : pioche */
function mcDrawPar(p, n){ const got = []; for(let k=0;k<n;k++){ if(!M.pdeck.length) M.pdeck = mcPdeck(M.r); const c = M.pdeck.pop(); p.par.push(c); got.push(c); } while(p.par.length > MC.handMax) p.par.shift(); return got; }
/* le gros match de la période : contre un président si possible, sinon le plus fort adversaire */
function mcBigPick(){
  const me = mcMe(), n = MC.rounds[M.period-1], rounds = M.fixtures.slice(M.round, M.round+n);
  let bigK = -1, best = -1, opp = null;
  rounds.forEach((rd, k) => { const m = rd.find(([x,y]) => M.clubs[x]===me || M.clubs[y]===me); const o = M.clubs[m[0]]===me ? M.clubs[m[1]] : M.clubs[m[0]]; const sc = (o.cpu ? 0 : 100) + mcRating(o).total; if(sc > best){ best = sc; bigK = k; opp = o; } });
  M.bigK = bigK; M.bigOpp = opp;
}
function mcR(fx){ M.v++; M.fx = fx || null; render(true); M.fx = null; if(M.signC){ M.signC = null; setTimeout(() => mcSfx("sign"), M.phase==="reveal" ? M.results.length*200 + 500 : 100); } }
const mcGD = p => p.gf - p.ga;
function mcLeague(){ return [...M.clubs].sort((a,b) => b.pts-a.pts || mcGD(b)-mcGD(a) || b.gf-a.gf || a.n.localeCompare(b.n)); }
function mcRank(){ const L = mcLeague(); return [...M.players].sort((a,b) => L.indexOf(a)-L.indexOf(b)); }
const mcPos = p => mcLeague().indexOf(p) + 1;
function mcSay(p, t, cls=""){ if(mcIdx(p)>=0) M.bub[mcIdx(p)] = {t, cls}; }

/* ---------- pactes (secrets : je ne vois que les miens) */
const mcAllied = (a, b) => M.pacts.some(x => (x.a===a && x.b===b) || (x.a===b && x.b===a));
const mcAllies = p => M.pacts.filter(x => x.a===p || x.b===p).map(x => x.a===p ? x.b : x.a);
const mcKnownAllies = p => p===mcMe() ? mcAllies(p) : mcAllies(p).filter(q => q===mcMe());
function mcBreak(a, b){ M.pacts = M.pacts.filter(x => !((x.a===a && x.b===b) || (x.a===b && x.b===a))); }

/* ---------- effectif */
/* composition : chaque titulaire a un numéro de case (c.sl) dans le système. Les ordis se recomposent seuls ;
   toi, tes choix manuels sont gardés et seules les cases vides se remplissent. */
function mcLineup(p){
  const sys = mcSys(p), all = mcRoster(p), keep = p.prof==="me" && p.man ? all.filter(c => c.sl!=null && c.sl < 11) : [];
  const taken = new Set(); keep.forEach(c => { if(taken.has(c.sl)) c.sl = null; else taken.add(c.sl); });
  all.forEach(c => { if(!keep.includes(c) || c.sl==null) c.sl = null; });
  const free = sys.s.map((_, i) => i).filter(i => !taken.has(i)), cand = all.filter(c => c.sl==null), pairs = [];
  free.forEach(i => cand.forEach(c => pairs.push([mcOvr(c) * mcFit(c, sys.s[i]) * (c.inj>0 || M.susp.has(c.uid) ? 0.3 : 1) + (c.trait==="capitaine" ? 2 : 0), i, c])));
  pairs.sort((a,b) => b[0]-a[0]); const fi = new Set(), fc = new Set();
  pairs.forEach(([, i, c]) => { if(fi.has(i) || fc.has(c)) return; c.sl = i; fi.add(i); fc.add(c); });
  p.team = all.filter(c => c.sl!=null).sort((a,b) => a.sl-b.sl); p.bench = all.filter(c => c.sl==null);
  const notes = [];
  while(mcRoster(p).length > MC.squad && p.bench.length){ const w = [...p.bench].sort((a,b) => mcOvr(a)-mcOvr(b) || a.val-b.val)[0]; const v = mcSell(p, w); notes.push(`${cardName(w.n)} vendu ${v} M€`); }
  return notes;
}
/* où jouerait un joueur, et qui il remplacerait */
function mcWhere(p, c){
  const sys = mcSys(p); let best = {i:-1, gain:-99, rep:null, sl:null};
  sys.s.forEach((sl, i) => { const occ = p.team.find(o => o.sl===i), g = mcOvr(c)*mcFit(c, sl) - (occ ? mcOvr(occ)*mcFit(occ, sl) : 40); if(g > best.gain) best = {i, gain:Math.round(g), rep:occ, sl}; });
  return best;
}
function mcPlace(p, c){ c.sl = null; p.bench.push(c); return mcLineup(p); }
function mcRemove(p, c){ c.sl = null; const i = p.team.indexOf(c); if(i>=0) p.team.splice(i, 1); else { const j = p.bench.indexOf(c); if(j>=0) p.bench.splice(j, 1); } }
function mcSell(p, c){ if(!mcRoster(p).includes(c)) return 0; mcRemove(p, c); const v = mcBank(p, c); p.money += v; mcGain(p, c, v); if(!p.cpu) mcLog(c, p, "Banque", v, "bank"); return v; }
function mcGain(p, c, v){ if(c.paid==null || p.cpu) return; const g = v - c.paid; if(g >= 20 && MC_PROFILES[p.profile]?.resale) p.bonusPts = (p.bonusPts||0) + 5; p.bestGain = Math.max(p.bestGain, g); if(!M.bestTrade || g > M.bestTrade.g) M.bestTrade = {pi:M.clubs.indexOf(p), n:c.n, g}; }
/* un club IA qui perd un joueur se renforce aussitôt avec un joueur libre */
function mcRefill(club){
  if(!club.cpu) return;
  while(mcRoster(club).length < 15){
    const have = mcCount(mcRoster(club).map(c => MC_LINE[c.po])), need = {G:2, D:5, M:5, A:3};
    const line = Object.keys(need).sort((a,b) => ((have[a]||0) - need[a]) - ((have[b]||0) - need[b]))[0];
    const kind = club.tier===3 ? (M.r()<0.5 ? "rare" : "common") : club.tier===2 ? (M.r()<0.35 ? "rare" : "common") : "common";
    const c = mcDrawPlayer(kind, line); if(!c) break; club.bench.push(c);
  }
  mcLineup(club);
}
function mcTransfer(from, to, c, amt){
  mcRemove(from, c); from.money += amt; to.money -= amt; mcGain(from, c, amt); mcLog(c, from, to, amt, "deal");
  c.listed = false; c.paid = amt; c.boughtAt = M.period; c.ct = Math.max(c.ct||0, c.age<=24 ? 3 : 2); c.bn = 0; mcLineup(from); mcRefill(from);
  if(to===mcMe()) M.signC = c;
  return mcPlace(to, c);
}
const mcOwner = c => M.clubs.find(k => mcRoster(k).includes(c));

/* ======================================================================
   NOTE D'ÉQUIPE ET MATCHS
   ====================================================================== */
function mcRating(p, absent=new Set()){
  const sys = mcSys(p), out = c => !c || absent.has(c.uid) || mcOut(c);
  const bench = p.bench.filter(c => !out(c));
  const xi = sys.s.map((sl, i) => { const c = p.team.find(o => o.sl===i);
    if(c && !out(c)) return {c, sl, e:mcOvr(c)*mcFit(c, sl)};
    let best = null, be = -1; bench.forEach(b => { const e = mcOvr(b)*mcFit(b, sl); if(e > be){ be = e; best = b; } });
    if(best){ bench.splice(bench.indexOf(best), 1); return {c:best, sl, e:be, sub:true}; }
    return {c:null, sl, e:40}; });
  const avg = a => a.length ? a.reduce((s,x) => s+x, 0)/a.length : 40, L = l => xi.filter(x => MC_LINE[x.sl]===l).map(x => x.e);
  const D = Math.round((xi[0].e*1.5 + L("D").reduce((s,x) => s+x, 0)) / (1.5 + L("D").length)) + (sys.mod.D||0);
  const Mi = Math.round(avg(L("M"))) + (sys.mod.M||0), A = Math.round(avg(L("A"))) + (sys.mod.A||0);
  const base = Math.round((D + Mi + A) / 3), alive = xi.map(x => x.c).filter(Boolean);
  const lines = [{t:"Moyenne des 11", v:base}];
  if(alive.some(c => c.trait==="capitaine")) lines.push({t:"🎖️ Capitaine", v:2});
  const egos = p.bench.filter(c => c.trait==="ego").length; if(egos) lines.push({t:"😤 Ego frustré", v:-egos});
  const mult = p.power==="tacticien" ? 2 : 1;
  const club = Object.entries(mcCount(alive.map(c => c.club))).sort((a,b) => b[1]-a[1])[0];
  if(club && club[1]>=3) lines.push({t:`Bloc ${club[0]} (${club[1]})`, v:(club[1]>=5 ? 2 : 1)*mult});
  if(alive.filter(c => c.kind==="legend").length >= 3) lines.push({t:"⭐ Galaxie de Légendes", v:1*mult});
  const hp = alive.filter((c, i) => mcFit(c, xi.find(x => x.c===c).sl) < 0.9).length; if(hp >= 3) lines.push({t:`🧩 ${hp} joueurs hors poste`, v:-1});
  if(p.cpu) lines.push({t:"Collectif rodé", v:p.tier*2});
  const stk = mcStreak(p); if(stk) lines.push(stk);
  const sulk = p.power==="motivateur" ? [] : p.bench.filter(mcSulk);
  if(sulk.length) lines.push({t:`😒 ${sulk.length>1 ? sulk.length+" remplaçants boudent" : cardName(sulk[0].n)+" boude sur le banc"}`, v:-sulk.length});
  const hurt = p.team.filter(c => c.inj > 0).length; if(hurt && !p.cpu) lines.push({t:`🚑 ${hurt} blessé${hurt>1?"s":""} (remplacé${hurt>1?"s":""})`, v:0});
  (p.mods||[]).forEach(m => lines.push(m));
  if(mcAllies(p).length) lines.push({t:"🤝 Pacte", v:1});
  return {lines, total:lines.reduce((s,x) => s+x.v, 0), base, D, M:Mi, A, xi, alive};
}
const mcStyleOf = p => mcSys(p).st;
/* le match : le milieu décide de la possession, l'attaque face à la défense adverse décide des buts */
function mcLam(a, b, ra, rb, xa=0, xb=0){
  const sa = mcStyleOf(a), sb = mcStyleOf(b), st = (x, y) => x && MC_STYLE[x] && MC_STYLE[x].beats===y ? 3 : 0;
  const ea = ra.total - ra.base + st(sa, sb) + 1.5 + (MC_PROFILES[a.profile]?.home||0) + xa, eb = rb.total - rb.base + st(sb, sa) + xb;
  const poss = 1/(1+Math.exp(-((ra.M+ea) - (rb.M+eb))/8));
  const lam = x => Math.min(3.6, 1.3*Math.exp(x));
  return {la:lam(((ra.A+ea) - (rb.D+eb))/13 + (poss-0.5)*0.6), lb:lam(((rb.A+eb) - (ra.D+ea))/13 + (0.5-poss)*0.6), poss, sty:st(sa, sb) ? a : st(sb, sa) ? b : null};
}
function mcPois(l, r){ let L = Math.exp(-l), k = 0, p = 1; do { k++; p *= r(); } while(p > L && k < 9); return k - 1; }
/* match rapide (tous les autres matchs) */
function mcQuick(a, b){
  const r = M.r, fr = p => new Set(p.team.filter(c => c.trait==="fragile" && r() < 0.25).map(c => c.uid));
  const ra = mcRating(a, fr(a)), rb = mcRating(b, fr(b)), L = mcLam(a, b, ra, rb);
  const ga = mcPois(L.la, r), gb = mcPois(L.lb, r);
  [[ra, ga], [rb, gb]].forEach(([R, g]) => { for(let k=0;k<g;k++){ const s = mcScorer(R.xi, r); if(s){ s.gs = (s.gs||0)+1; s.sc = (s.sc||0)+1; s.gt = (s.gt||0)+1; } } });
  return {a, b, ga, gb};
}
function mcScorer(xi, r){
  const pool = xi.filter(x => x.c && MC_LINE[x.sl]!=="G"); if(!pool.length) return null;
  const w = pool.map(x => Math.max(0.2, ({A:6, M:x.sl==="MOC" ? 4 : 2.2, D:0.8}[MC_LINE[x.sl]]||1) + (x.e-60)/10));
  let v = r()*w.reduce((s,x) => s+x, 0); for(let k=0;k<pool.length;k++){ v -= w[k]; if(v<=0) return pool[k].c; } return pool[0].c;
}
/* gros match : même calcul, raconté minute par minute */
function mcBig(a, b, xa=0, xb=0){
  const r = M.r, fr = p => new Set(p.team.filter(c => c.trait==="fragile" && r() < 0.25).map(c => c.uid));
  const xA = fr(a), xB = fr(b), fa = mcRating(a, xA), fb = mcRating(b, xB), ev = [], L = mcLam(a, b, fa, fb, xa, xb);
  [[a, xA], [b, xB]].forEach(([p, x]) => x.forEach(u => { const c = p.team.find(o => o.uid===u); ev.push({min:0, p, t:`🩹 ${cardName(c.n)} forfait`}); }));
  [a, b].forEach(p => p.team.filter(c => c.inj > 0).forEach(c => ev.push({min:0, p, t:`🚑 ${cardName(c.n)} blessé`})));
  if(L.sty) ev.push({min:0, p:L.sty, t:`${MC_STYLE[mcStyleOf(L.sty)].ic} Son ${MC_STYLE[mcStyleOf(L.sty)].t.toLowerCase()} prend le dessus (+3)`});
  const ga = mcPois(L.la, r), gb = mcPois(L.lb, r);
  const mins = Array.from({length:ga+gb}, () => 2 + Math.floor(r()*88));
  const sides = mcShuffle([...Array(ga).fill(a), ...Array(gb).fill(b)], r);
  mins.sort((x,y) => x-y).forEach((min, k) => { const p = sides[k], s = mcScorer(p===a ? fa.xi : fb.xi, r); if(s){ s.gs = (s.gs||0)+1; s.sc = (s.sc||0)+1; s.gt = (s.gt||0)+1; } ev.push({min, p, t:s ? cardName(s.n) : "But contre son camp", goal:true}); });
  for(let k=0;k<3+Math.floor(r()*3);k++){ const p = r()<0.5 ? a : b, R = p===a ? fa : fb, s = mcScorer(R.xi, r), D = p===a ? fb : fa, gk = D.xi[0] && D.xi[0].c; if(s) ev.push({min:2+Math.floor(r()*88), p, t: gk && r()<0.6 ? `Arrêt de ${cardName(gk.n)} devant ${cardName(s.n)}` : `${cardName(s.n)} manque le cadre`}); }
  ev.sort((x,y) => x.min-y.min);
  return {a, b, ga, gb, fa, fb, ev, poss:Math.round(L.poss*100)};
}
function mcRecord(m){
  const set = (p, f, c) => { p.gf += f; p.ga += c; const res = f>c ? "V" : f===c ? "N" : "D";
    if(f>c){ p.w++; p.pts += 3; } else if(f===c){ p.d++; p.pts += 1; } else p.l++; p.form.push(res); p.pw = (p.pw||0) + (res==="V" ? 1 : 0); };
  set(m.a, m.ga, m.gb); set(m.b, m.gb, m.ga);
}
const mcEvDelay = (evs, e) => { const list = evs.filter(x => x.min>0); const i = e ? list.indexOf(e) : list.length; return 0.4 + Math.max(0, i)*0.6; };
/* joue toutes les journées de la période ; un « gros match » est raconté en direct */
function mcPlayPeriod(){
  const me = mcMe(), n = MC.rounds[M.period-1], from = M.round, rounds = M.fixtures.slice(from, from+n);
  M.before = mcLeague(); M.clubs.forEach(p => p.pw = 0);
  if(M.bigK==null || M.bigK < 0) mcBigPick();
  const bigK = M.bigK, fixed = me.fix===M.period;
  M.myRes = []; M.big = null;
  rounds.forEach((rd, k) => rd.forEach(([x,y]) => {
    const a = M.clubs[x], b = M.clubs[y], mine = a===me || b===me;
    const m = mine && k===bigK ? mcBig(a, b, fixed && a!==me ? -15 : 0, fixed && b!==me ? -15 : 0) : mcQuick(a, b);
    mcRecord(m);
    if(mine){ const home = a===me, res = {opp: home ? b : a, gf: home ? m.ga : m.gb, ga: home ? m.gb : m.ga, home, big:k===bigK, day:from+k+1}; M.myRes.push(res);
      if(k===bigK) M.big = home ? m : Object.assign(m, {a:b, b:a, ga:m.gb, gb:m.ga, fa:m.fb, fb:m.fa}); }
  }));
  M.round += n;
  // paris
  M.betRes = null;
  M.players.forEach(p => { if(!p.bet) return; const b = p.bet; p.bet = null;
    if(p===me){ const res = M.big.ga>M.big.gb ? "V" : M.big.ga===M.big.gb ? "N" : "D", win = res===b.o; if(win) me.money += b.mise*3; M.betRes = {win, mise:b.mise, o:b.o, res}; }
    else if(M.r() < 0.4) p.money += b.mise*3; });
  mcCupRound();
  mcAfterPeriod();
  mcEnquetes();
  M.hist = M.hist || []; M.hist.push({p:M.period, money:me.money, pos:mcPos(me), pts:me.pts, value:mcRoster(me).reduce((s,c) => s+c.val, 0), wages:me.wages, income:me.income, sus:me.sus||0, prog:mcProg(me).tot});
  M.phase = "match"; M.bub = {}; M.flash = null; mcSfx("whistle");
  M.big.ev.filter(e => e.goal).forEach(e => setTimeout(() => { if(M && M.phase==="match") mcSfx(e.p===me ? "goal" : "hit"); }, 700 + mcEvDelay(M.big.ev, e)*1000));
  setTimeout(() => { if(M && M.phase==="match") mcSfx("whistle"); }, 900 + mcEvDelay(M.big.ev, null)*1000);
  mcCrowd(true, 1.6 + mcEvDelay(M.big.ev, null));
  mcR("match");
}
/* conférence de presse : 2 réponses, un effet sur la période */
const MC_PRESS = [
  {q:r => `${r.n} dit que ton équipe est surcotée. Ta réponse ?`, a:[["« On répondra sur le terrain. »", (me, r) => { me.mods.push({t:"🎤 Piqué au vif", v:2}); r.grudge = me; return `+2 de note pour la période… et ${r.n} t'a dans le viseur.`; }],
      ["« Pas de commentaire. »", () => "Les journalistes repartent bredouilles."]]},
  {q:() => "Les supporters réclament des recrues. Que leur dis-tu ?", a:[["« Le chéquier est ouvert ! »", me => { me.mods.push({t:"🎤 Euphorie", v:2}); me.money = Math.max(0, me.money - 5); return "+2 de note, mais les primes promises coûtent 5 M€."; }],
      ["« Patience, on construit. »", me => { me.money += 4; return "Le sponsor apprécie la sérénité : +4 M€."; }]]},
  {q:() => "Ton équipe peut-elle viser le haut du tableau ?", a:[["« On vise le titre, point. »", me => { me.mods.push({t:"🎤 Ambition", v:3}); me.pressBold = true; return "+3 de note… mais la direction attend des résultats."; }],
      ["« Match après match. »", me => { me.mods.push({t:"🎤 Sérénité", v:1}); return "+1 de note, le vestiaire reste calme."; }]]},
  {q:r => `On parle d'un rapprochement secret entre toi et ${r.n}…`, a:[["« Fake news ! »", () => "Rien ne filtre."], ["« Qui sait… »", (me, r) => { r.grudge = null; me.mods.push({t:"🎤 Mystère", v:1}); return `${r.n} sourit : il ne t'en veut plus. +1 de note.`; }]]},
  {q:() => "Le vestiaire est-il uni ?", a:[["« Comme jamais ! »", me => { me.mods.push({t:"🎤 Cohésion", v:1}); return "+1 de note."; }],
      ["« Certains doivent se remettre en question. »", me => { me.mods.push({t:"🎤 Coup de pression", v:3}); mcRoster(me).forEach(c => c.form = Math.max(0.7, c.form - 0.03)); return "+3 de note pour la période, mais la cote des joueurs baisse un peu."; }]]}
];
function mcPressStart(){
  const me = mcMe(), rivals = M.players.slice(1).sort((a,b) => Math.abs(mcPos(a)-mcPos(me)) - Math.abs(mcPos(b)-mcPos(me)));
  M.press = {i:Math.floor(M.r()*MC_PRESS.length), r:rivals[0], out:null}; M.phase = "press"; mcSfx("card"); mcR();
}
function mcPressAnswer(k){ const P = M.press, Q = MC_PRESS[P.i]; P.out = Q.a[k][1](mcMe(), P.r); P.k = k; mcSfx("coin"); mcR("bub"); }
/* coupe à élimination directe : 4 présidents + 12 clubs tirés au sort */
function mcCupInit(){
  const cpu = mcShuffle([...Array(16).keys()].map(i => i+4), M.r).slice(0, 12);
  M.cup = {alive:[0,1,2,3, ...cpu], winner:null};
}
function mcCupRound(){
  const name = MC_CUP[M.period]; M.cupRes = null;
  if(!name || !M.cup || M.cup.alive.length < 2) return;
  const me = mcMe(), ids = mcShuffle([...M.cup.alive], M.r), next = [];
  for(let i=0;i<ids.length;i+=2){
    const a = M.clubs[ids[i]], b = M.clubs[ids[i+1]]; if(!b){ next.push(ids[i]); continue; }
    const m = mcQuick(a, b); let wa = m.ga > m.gb, tab = false;
    if(m.ga===m.gb){ tab = true; wa = M.r() < 0.5 + (mcRating(a).total - mcRating(b).total)/40; }
    const w = wa ? a : b; next.push(M.clubs.indexOf(w));
    if(!w.cpu) w.money += M.period===6 ? 25 : 5;
    if(a===me || b===me){ const home = a===me; M.cupRes = {name, opp: home ? b : a, gf: home ? m.ga : m.gb, ga: home ? m.gb : m.ga, tab, win: w===me}; }
  }
  M.cup.alive = next;
  if(next.length===1){ M.cup.winner = next[0]; }
}
/* revenus, progression des joueurs, cotes */
function mcAfterPeriod(){
  const moves = []; M.hurt = [];
  M.clubs.forEach(p => {
    if(!p.cpu){ const Q = MC_PROFILES[p.profile] || {};
      p.income = MC.income + MC.winBonus*p.pw + Math.round((20-mcPos(p))/2) + (p.power==="mecene" ? 4 : 0) + (Q.gate||0) + (p.ghost===(M.season||1) ? 6 : 0);
      if(p.ghost===(M.season||1)) mcSusUp(p, 5);
      p.wages = mcWages(p); p.tax = Math.max(0, p.wages - MC.wageCap); p.int = p.debt > 0 ? Math.round(p.debt*0.04) : 0;
      p.money += p.income - p.wages - p.tax - p.int;
      p.strike = Q.home && p.form.slice(-3).length===3 && p.form.slice(-3).every(x => x==="D"); if(p.strike) p.money -= 5;
      p.forced = [];
      while(p.money < 0 && p.bench.length){ const c = [...p.bench].sort((a,b) => a.ovr-b.ovr)[0]; p.forced.push(`${cardName(c.n)} (${mcSell(p, c)} M€)`); } }
    mcRoster(p).forEach(c => {
      const old = c.val, oldO = c.ovr;
      const sp = p.power==="formateur" || MC_PROFILES[p.profile]?.boost ? 2 : 1;
      if(c.age <= 20 && c.ovr < c.pot) c.ovr = Math.min(c.pot, c.ovr + sp*(1 + Math.floor(M.r()*3)));
      else if(c.age <= 23 && c.ovr < c.pot && M.r()<0.6) c.ovr += sp;
      else if(c.age >= 32 && M.r()<0.5) c.ovr -= 1;
      c.form = Math.min(1.5, Math.max(0.7, c.form * (1 + (c.sc||0)*0.04 + (p.bench.includes(c) ? -0.05 : 0.01) + (M.r()-0.5)*0.06))); c.sc = 0;
      mcRevalue(c);
      // banc, blessures, historique
      c.bn = p.bench.includes(c) && !c.inj ? (c.bn||0) + 1 : 0;
      if(c.inj > 0) c.inj--;
      else if(p.team.includes(c) && M.r() < (c.trait==="fragile" ? 0.16 : c.age >= 32 ? 0.08 : 0.045)){ c.inj = M.r() < 0.3 ? 2 : 1; if(p===mcMe()) (M.hurt ||= []).push(c); }
      (c.oh ||= []).push(c.ovr); (c.vh ||= []).push(c.val); if(c.oh.length > 24){ c.oh.shift(); c.vh.shift(); }
      if(p===mcMe() && (c.val!==old || c.ovr!==oldO)) moves.push({c, old, oldO});
    });
    if(!p.cpu) mcLineup(p);
    // les clubs IA recrutent aussi pour rester dans la course
    if(p.cpu && M.r() < 0.7){ const weak = [...p.team].sort((a,b) => a.ovr-b.ovr)[0], kind = p.tier===3 ? (M.r()<0.4 ? "legend" : "rare") : p.tier===2 ? "rare" : (M.r()<0.5 ? "rare" : "common");
      const c = weak && mcDrawPlayer(kind, MC_LINE[weak.po]); if(c && c.ovr > weak.ovr){ mcRemove(p, weak); p.bench.push(c); mcLineup(p); } }
  });
  M.moves = moves.sort((a,b) => Math.abs(b.c.val-b.old) - Math.abs(a.c.val-a.old)).slice(0, 4);
}

/* ---------- soupçons et enquêtes de la Ligue */
function mcSusUp(p, n){ const f = MC_PROFILES[p.profile]?.sus || 1; p.sus = Math.max(0, Math.min(100, Math.round((p.sus||0) + n*f))); }
const mcActive = p => (p.recent||[]).filter(x => x.s===(M.season||1) && x.per >= M.period-1 && MC_AF[x.k] && MC_AF[x.k].sus > 0);
function mcCaseName(p){ const a = mcActive(p).at(-1) || (p.recent||[]).filter(x => MC_AF[x.k] && MC_AF[x.k].sus>0).at(-1); return a ? MC_CASE[a.k] || "comportement suspect" : "comportement suspect"; }
function mcEnquete(p){
  const s = p.sus||0, lvl = s >= 70 ? 3 : s >= 40 ? 2 : 1;
  const fine = [0,10,20,30][lvl], pts = [0,0,3,6][lvl], cas = [0,3,6,10][lvl], why = mcCaseName(p);
  p.money -= fine; p.pts = Math.max(0, p.pts - pts); (p.cases ||= []).push({t:why, pts:cas, s:M.season||1});
  if(lvl===3){ p.ban = M.period + 1; if(p.loan){ p.money -= p.loan; p.loan = 0; } p.ghost = 0; }
  p.sus = Math.max(0, s - 40);
  const txt = `amende de ${fine} M€${pts?`, −${pts} pts au classement`:""}${lvl===3?", interdiction de recruter à la prochaine période":""}`;
  (M.enq ||= []).push({p, why, txt});
  return txt;
}
function mcEnquetes(){
  M.players.forEach(p => {
    if((p.sus||0) > 0 && M.r() < (p.sus/100)*0.35) mcEnquete(p);
    else if(p.lastDirty!==M.period) p.sus = Math.max(0, (p.sus||0) - 10);
  });
}
/* points de progression : ce qui désigne le meilleur président */
function mcProg(p, final){
  const L = mcLeague(), pos = L.indexOf(p) + 1, Q = MC_PROFILES[p.profile] || {}, coef = Q.coef || 1;
  const fort = Math.round((mcFortune(p) - (p.fort0||0)) / 5 * coef);
  const rank = (p.goal - pos)*3;
  const tro = (final && L[0]===p ? 12 : 0) + (M.cup && M.cup.winner!=null && M.clubs[M.cup.winner]===p ? 6 : 0);
  const cas = -(p.cases||[]).filter(x => x.s===(M.season||1)).reduce((a,x) => a+x.pts, 0);
  const sec = final && p.secretOk ? MC.secretPts : 0, bon = p.bonusPts||0;
  return {fort, rank, tro, cas, sec, bon, tot:fort + rank + tro + cas + sec + bon};
}

/* ======================================================================
   BREAKING NEWS
   ====================================================================== */
const mcStar = p => [...p.team].filter(c => c.trait!=="fidele").sort((a,b) => b.val-a.val)[0];
const MC_NEWS = {
  saudi:{ic:"🛢️", t:"Offre venue du Golfe", ok:() => !!mcStar(mcMe()) && mcCanSell(mcMe()),
    set:n => { n.c = mcStar(mcMe()); n.amt = Math.round(n.c.val*1.8); },
    d:n => `Un club saoudien propose ${n.amt} M€ pour ${n.c.n} (cote ${n.c.val} M€, note ${n.c.ovr}).`,
    a:[["Vendre", n => { const me = mcMe(); mcRemove(me, n.c); me.money += n.amt; mcGain(me, n.c, n.amt); mcLog(n.c, me, "Club du Golfe", n.amt, "deal"); mcLineup(me); return `+${n.amt} M€ ! ${n.c.n} s'envole vers le désert.`; }],
       ["Refuser", n => `${n.c.n} reste. Les supporters t'adorent.`]]},
  leave:{ic:"😤", t:"Ta star veut partir", ok:() => !!mcStar(mcMe()) && mcCanSell(mcMe()),
    set:n => { n.c = mcStar(mcMe()); },
    d:n => `${n.c.n} réclame un transfert. Garde-le et il boude (−3 de note sur la période), ou vends-le à la banque à 60 % (${Math.round(n.c.val*0.6)} M€).`,
    a:[["Le garder", n => { mcMe().mods.push({t:`😤 ${cardName(n.c.n)} boude`, v:-3}); return `−3 de note pour la période.`; }],
       ["Le vendre", n => { const me = mcMe(), v = Math.round(n.c.val*0.6); mcRemove(me, n.c); me.money += v; mcLog(n.c, me, "Banque", v, "bank"); mcLineup(me); return `+${v} M€. Bon vent !`; }]]},
  nightclub:{ic:"🍾", t:"Soirée en boîte", ok:() => mcMe().team.length>0,
    set:n => { const t = mcMe().team; n.c = t[Math.floor(M.r()*t.length)]; },
    d:n => `${n.c.n} a été photographié en boîte. Amende de 8 M€ pour étouffer l'affaire, ou suspension pour la période.`,
    a:[["Payer 8 M€", n => { const me = mcMe(); if(me.money < 8){ M.susp.add(n.c.uid); return "Pas assez d'argent : suspendu quand même !"; } me.money -= 8; return "Affaire étouffée."; }],
       ["Suspendu", n => { M.susp.add(n.c.uid); return `${n.c.n} rate la période.`; }]]},
  kit:{ic:"👕", t:"Sponsor maillot", ok:() => true,
    set:() => {}, d:() => "Une marque de chips propose 20 M€ pour s'afficher sur ton maillot. Il est hideux : −1 de note (moral) sur la période.",
    a:[["Signer", () => { const me = mcMe(); me.money += 20; me.mods.push({t:"👕 Maillot moche", v:-1}); return "+20 M€. Les supporters rient jaune."; }],
       ["Refuser", () => "Le maillot reste sobre."]]},
  agent:{ic:"🕶️", t:"Le super-agent", ok:() => M.pools.legend.length > 0,
    set:n => { n.c = mcDrawPlayer("legend"); n.amt = n.c.val + 10; },
    d:n => `Un agent te propose ${n.c.n} (note ${n.c.ovr}, ${n.c.age} ans) en exclusivité : ${n.amt} M€ (cote + 10 de commission).`,
    a:[["Acheter", n => { const me = mcMe(); if(me.money < n.amt){ M.market.push(n.c); return "Pas assez d'argent… il part au marché."; } me.money -= n.amt; n.c.paid = n.amt; n.c.boughtAt = M.period; me.buys.push({c:n.c, price:n.amt}); mcLog(n.c, "Agent", me, n.amt, "market"); M.signC = n.c; mcPlace(me, n.c); return `${n.c.n} signe chez toi !`; }],
       ["Non merci", n => { n.c.price = n.c.val; M.market.push(n.c); return `${n.c.n} arrive au marché… pour tout le monde.`; }]]},
  bankrupt:{ic:"💥", t:"Faillite !", ok:() => true, auto:true,
    set:n => { n.p = M.cpu[Math.floor(M.r()*M.cpu.length)]; },
    d:n => `${n.p.n} est en faillite ! Ses 2 meilleurs joueurs sont soldés au marché à moitié prix.`,
    a:[["Au marché !", n => { const best = mcRoster(n.p).sort((a,b) => b.val-a.val).slice(0, 2);
      best.forEach(c => { mcRemove(n.p, c); c.price = Math.max(2, Math.round(c.val/2)); c.sale = true; c.from = n.p; M.market.push(c); }); mcRefill(n.p); return ""; }]]},
  billionaire:{ic:"🤑", t:"Rachat du club", ok:() => true, auto:true,
    set:n => { n.p = mcRank().at(-1); },
    d:n => `Un milliardaire rachète le club du président le moins bien classé : ${n.p.bot ? n.p.n : "TOI"} touche +50 M€ !`,
    a:[["Ok !", n => { n.p.money += 50; return ""; }]]},
  tv:{ic:"📺", t:"Nouveaux droits TV", ok:() => true, auto:true,
    set:() => {}, d:() => "Un diffuseur américain inonde le championnat : chaque club touche +15 M€.",
    a:[["Encaisser", () => { M.players.forEach(p => p.money += 15); return ""; }]]},
  leak:{ic:"🕵️", t:"Fuite dans la presse", ok:() => M.pacts.some(x => x.a!==mcMe() && x.b!==mcMe()) || M.players.some(p => p.bot && p.grudge===mcMe()), auto:true,
    set:n => { const x = M.pacts.find(x => x.a!==mcMe() && x.b!==mcMe()); if(x){ n.a = x.a; n.b = x.b; } else n.g = M.players.find(p => p.bot && p.grudge===mcMe()); },
    d:n => n.a ? `Révélation : ${n.a.n} et ${n.b.n} ont signé un pacte secret !` : `Off the record, ${n.g.n} jure de se venger de toi…`,
    a:[["Noté", n => { if(n.a){ M.leaked = M.leaked || []; M.leaked.push([n.a, n.b]); } return ""; }]]},
  youth:{ic:"🌟", t:"Pépite révélée", ok:() => true,
    set:() => {}, d:() => "Ton centre de formation sort un phénomène.",
    a:[["Le découvrir", () => { const me = mcMe(), pep = mcRoster(me).filter(c => c.age<=21).sort((a,b) => b.pot-a.pot)[0];
      if(pep){ pep.ovr = Math.min(pep.pot, pep.ovr + 6); mcRevalue(pep); mcLineup(me); return `${pep.n} explose : note ${pep.ovr}, cote ${pep.val} M€ !`; }
      const c = mcDrawPlayer("pepite"); if(!c) return "Rien cette année."; c.paid = 0; mcPlace(me, c); return `${c.n} 🌱 (${c.ovr}) rejoint ton équipe gratuitement !`; }]]}
};

/* ---------- début de période */
function mcPeriodStart(){
  M.tab = "jeu";
  M.susp = new Set(); M.won = {}; M.sel = {}; M.results = []; M.played = 0; M.bub = {}; M.show = []; M.si = 0; M.flash = null; M.aim = null; M.sheet = null; M.spy = null;
  M.buys = MC.buys; M.deals = 0; M.inbox = [];
  M.pacts = M.pacts.filter(x => x.until >= M.period);
  M.enq = []; M.det = null; M.spies = (M.spies||[]).filter(x => x.until >= M.period);
  M.players.forEach(p => { p.mod = 0; p.mods = []; p._n = 0; p._t = 0;
    if(p.bot){ mcDrawPar(p, 1); if(M.r() < 0.3) p.sys = Object.keys(MC_SYS)[Math.floor(M.r()*5)]; else p.sys = MC_PROFILES[p.profile].sys; mcLineup(p); } });
  // effectif trop court : le centre de formation complète jusqu'à 13 joueurs
  M.youth = [];
  M.players.forEach(p => { while(mcRoster(p).length < 13){
    const have = mcCount(mcRoster(p).map(c => MC_LINE[c.po])), need = {G:2, D:4, M:4, A:3};
    const line = Object.keys(need).sort((a,b) => ((have[a]||0) - need[a]) - ((have[b]||0) - need[b]))[0];
    const c = mcDrawPlayer("pepite", line); if(!c) break; c.paid = 0; p.bench.push(c); if(p===mcMe()) M.youth.push(c); }
    mcLineup(p); });
  mcBigPick();
  // le marché : joueurs libres + joueurs mis en vente par les clubs IA
  const big = M.period===1 || M.period===MC.flashPeriod, n = big ? 10 : 7;
  M.market = [];
  const kinds = ["legend","rare","rare","common","common","pepite","pepite","common","rare","common"];
  for(let k=0;k<n;k++){
    if(M.r() < 0.45){ const club = M.cpu[Math.floor(M.r()*M.cpu.length)], c = mcRoster(club).sort((a,b) => b.val-a.val)[Math.floor(M.r()*2)]; if(c && !M.market.includes(c)){ c.from = club; c.price = c.val; M.market.push(c); continue; } }
    const c = mcDrawPlayer(kinds[k % kinds.length]); if(c){ c.price = c.val; M.market.push(c); }
  }
  let owned = new Set(); try{ owned = new Set(ownedIds()); }catch(e){}
  M.market.forEach(c => { if(owned.has(c.id) && !c.sale){ c.fav = true; c.price = Math.max(1, Math.round(c.val*0.85)); } });
  if(mcMe().power==="chasseur") M.market.forEach(c => { if(c.kind==="pepite") c.price = Math.max(1, Math.round(c.price*0.8)); });
  if(M.period===1 && M.freeAg && M.freeAg.length){ M.freeAg.splice(0, 4).forEach(c => { c.fa = true; c.price = Math.max(1, Math.round(c.val*0.4)); M.market.push(c); }); M.freeAg = []; }
  M.drawn = mcDrawPar(mcMe(), 1);
  const key = M.newsPlan[M.period-1];
  M.news = null;
  if(key && MC_NEWS[key].ok()){ const nn = {key}; MC_NEWS[key].set(nn); M.news = nn; }
  M.phase = "news"; mcSfx(M.news ? "news" : "card"); mcR("draw");
}
function mcNewsChoose(k){
  const n = M.news, N = MC_NEWS[n.key]; n.out = N.a[k][1](n); n.done = true;
  mcSfx((n.key==="saudi" && k===0) || N.auto ? "coin" : "tap"); mcR();
}

/* ======================================================================
   VALEUR POUR UN ORDINATEUR
   ====================================================================== */
const MC_K = {easy:1.6, normal:2.8, hard:4.2};    // M€ par point de note et par période
function mcGainOf(p, c){
  if(mcRoster(p).includes(c)) return 0;
  const w = mcWhere(p, c);
  return Math.max(0, w.gain) / 4 + (mcRoster(p).length < 14 ? 0.5 : 0);
}
function mcWtp(p, c){
  const left = MC.periods - M.period + 1, hard = M.diff==="hard";
  let gain = mcGainOf(p, c) + ({capitaine:0.4, clutch:M.period>=4 ? 0.8 : 0.2, fragile:-0.3, ego:-0.2}[c.trait] || 0);
  gain += (p.team.filter(o => o.club===c.club).length ? 0.3 : 0) * (p.prof==="C" || hard ? 2 : 1);
  let v = gain * left * MC_K[M.diff] + c.val * 0.75 - mcWage(c) * left * (M.diff==="easy" ? 0.3 : 0.8);
  if(p.prof==="B") v *= c.kind==="legend" ? 1.15 : 0.85;
  if(p.prof==="D") v *= c.age <= 21 ? 1.3 : 0.85;
  if(M.diff==="easy") v *= 0.6 + M.r()*0.6;
  return v;
}

/* ---------- mercato à l'aveugle */
function mcBotBids(p){
  const bids = []; let budget = p.money - (M.diff==="hard" ? 0 : 5);
  const ranked = [...M.market].filter(c => c.from!==p).sort((a,b) => (mcWtp(p,b)-b.price) - (mcWtp(p,a)-a.price));
  for(const c of ranked){
    if(bids.length>=(M.diff==="easy" && M.r()<0.5 ? 1 : M.buys)) break;
    const w = mcWtp(p, c); if(w < c.price) break;
    const cap = Math.round(c.price * (c.kind==="legend" ? 1.3 : c.age<=21 ? (p.prof==="D" ? 2 : 1.6) : 1.5));
    const share = {easy:0.45, normal:0.65, hard:0.8}[M.diff];
    const bid = Math.min(Math.round(w * (M.diff==="hard" ? 0.95 + M.r()*0.05 : 0.85 + M.r()*0.15)), cap, Math.max(c.price, Math.round(budget*share)), budget);
    if(bid < c.price) continue;
    bids.push([c.uid, bid]); budget -= bid;
  }
  return bids;
}
function mcBuy(w, c, price){
  const src = c.from;
  if(c.from){ const club = c.from; if(mcRoster(club).includes(c)){ mcRemove(club, c); club.money += price; mcRefill(club); } delete c.from; }
  mcLog(c, src || (c.fa ? "Fin de contrat" : "Libre"), w, price, "market");
  w.money -= price; c.paid = price; c.boughtAt = M.period; M.won[c.uid] = w; delete c.sale; delete c.fa;
  c.ct = Math.max(c.ct||0, c.age<=24 ? 3 : 2); c.bn = 0;
  if(w===mcMe() && !M.signC) M.signC = c;
  w.buys.push({c, price}); return mcPlace(w, c);
}
function mcResolve(){
  const me = mcMe(), all = {};
  Object.entries(M.sel).forEach(([u, b]) => (all[u] ||= []).push([b, me]));
  M.players.forEach((p, i) => { if(p.bot && p.ban!==M.period) (M.botBids?.[i] || mcBotBids(p)).forEach(([u, b]) => (all[u] ||= []).push([b, p])); });
  M.botBids = null;
  const rk = mcRank();
  M.results = M.market.map(c => {
    const bl = (all[c.uid]||[]).sort((x,y) => y[0]-x[0] || rk.indexOf(y[1])-rk.indexOf(x[1]));
    const from = c.from;
    if(!bl.length){ delete c.from; return {c, bids:[], w:null, from}; }
    let price, w = bl[0][1];
    if(bl.length===1) price = c.price;
    else { price = Math.max(c.price, Math.min(bl[0][0], bl[1][0] + MC.fee)); bl.slice(1).forEach(([, l]) => { l.money -= MC.fee; }); }
    if(w.power==="negociateur") price = Math.round(price*0.9);
    if(w.money >= price){ const notes = mcBuy(w, c, price); return {c, bids:bl, w, price, starter:w.team.includes(c), notes, from}; }
    delete c.from; return {c, bids:bl, w:null, from};
  });
  M.sel = {}; M.phase = "reveal"; mcSfx("env"); mcR("reveal");
}

/* ---------- mercato d'hiver flash : une Légende aux enchères en direct */
let MC_FLASH_T = null;
function mcFlashStart(){
  const c = mcDrawPlayer("legend"); if(!c) return mcBureau();
  const start = Math.max(15, c.val - 20);
  const max = {}; M.players.forEach((p, k) => { if(p.bot) max[k] = Math.min(p.money, Math.round(mcWtp(p, c) * (0.85 + M.r()*0.3))); });
  M.flashA = {c, start, price:start, in:M.players.map((p, k) => p.bot ? max[k] >= start : p.money >= start), max, w:null};
  M.phase = "flash"; mcR();
  if(!mcFlashCheck()){ mcStopFlash(); MC_FLASH_T = setInterval(mcFlashTick, 700); }
}
function mcStopFlash(){ if(MC_FLASH_T){ clearInterval(MC_FLASH_T); MC_FLASH_T = null; } if(MC_CROWD) mcCrowd(false); }
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
   BUREAU : appels reçus, transferts, cartes
   ====================================================================== */
const mcCoalition = () => M.diff!=="easy" && mcRank()[0]===mcMe() && M.period>=2;
/* ce que demande un club pour lâcher un joueur */
function mcAsk(p, c){
  if(c.trait==="fidele" || p.grudge===mcMe()) return Infinity;
  const end = c.ct===1 && M.period >= MC.flashPeriod ? 0.75 : 1;   // fin de contrat : il partira libre, autant le vendre
  if(p.cpu){ const best = mcRoster(p).sort((a,b) => b.ovr-a.ovr)[0]===c; return Math.round(c.val * (1.25 + (best ? 0.3 : 0) + (p.tier===3 ? 0.2 : 0)) * end); }
  let f = {easy:1.0, normal:1.15, hard:1.3}[M.diff];
  if(mcAllied(p, mcMe())) f = 0.95;
  else if(mcCoalition()) f *= 1.4;
  if(p.team.includes(c) && c.kind==="legend") f += 0.2;
  return Math.round(Math.max(c.val, (mcWtp(p, c) - c.val*0.75) * 0.6 + c.val) * f * end);
}
/* ce qu'un président ordinateur accepte de payer pour un de mes joueurs */
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
  M.players.filter(p => p.bot && p.grudge!==me && mcCanSell(me)).forEach(p => {
    if(M.r() > prob) return;
    const best = mcRoster(me).filter(c => c.trait!=="fidele").map(c => ({c, w:mcBid(p, c)})).filter(x => x.w >= x.c.val*1.05).sort((a,b) => (b.w-b.c.val)-(a.w-a.c.val))[0];
    if(!best) return;
    const amt = Math.round(Math.min(best.w, best.c.val*(1.1 + M.r()*0.35)));
    if(amt > p.money - 3 || M.inbox.some(o => o.c===best.c)) return;
    M.inbox.push({by:p, c:best.c, amt, max:best.w});
  });
  // joueurs mis sur la liste des transferts : un club appelle à coup sûr
  mcRoster(me).filter(c => c.listed && !M.inbox.some(o => o.c===c)).forEach(c => {
    const by = M.cpu[Math.floor(M.r()*M.cpu.length)], amt = Math.round(mcListPrice(c) * (0.92 + M.r()*0.2));
    M.inbox.push({by, c, amt, max:Math.round(amt*1.08), listed:true}); });
  // un club IA s'intéresse parfois à ton meilleur jeune
  const young = mcRoster(me).filter(c => c.age<=22 && c.trait!=="fidele").sort((a,b) => b.val-a.val)[0];
  if(young && M.r() < 0.35){ const club = M.cpu.filter(k => k.tier===3)[Math.floor(M.r()*3)]; const amt = Math.round(young.val*(1.3 + M.r()*0.5)); M.inbox.push({by:club, c:young, amt, max:Math.round(amt*1.1)}); }
  if(M.inbox.length) mcSfx("card");
  mcR();
}
function mcInbox(kind){
  const o = M.inbox[0], me = mcMe(); if(!o) return;
  if((kind==="ok" || kind==="counter") && !mcCanSell(me)){ toast(`Effectif minimum : ${MC.minSquad} joueurs. Recrute avant de vendre.`); return; }
  if(!mcRoster(me).includes(o.c) || (!o.by.cpu && o.by.money < o.amt)){ M.inbox.shift(); return mcR(); }
  const done = amt => { mcTransfer(me, o.by, o.c, amt); if(o.by.cpu) mcLineup(o.by); if(me.retro===M.period){ const b = Math.round(amt*0.2); me.money += b; toast(`💸 Rétrocommission : +${b} M€`, "ok"); } };
  if(kind==="ok"){ done(o.amt); M.inbox.shift(); M.flash = mcAct_(o.by, "deal", me, `${o.c.n} part chez ${o.by.n} pour ${o.amt} M€`); mcSay(o.by, "Merci patron 🤝", "ok"); mcSfx("coin"); }
  else if(kind==="no"){ M.inbox.shift(); mcSay(o.by, "Dommage…", "no"); }
  else if(kind==="counter"){ const ask = Math.round(o.amt*1.2);
    if(ask <= o.max && (o.by.cpu || ask <= o.by.money)){ done(ask); M.inbox.shift(); M.flash = mcAct_(o.by, "deal", me, `Contre-offre acceptée : ${o.c.n} part pour ${ask} M€`); mcSay(o.by, "Tu m'as eu 😅", "ok"); mcSfx("coin"); }
    else { M.inbox.shift(); M.flash = mcAct_(o.by, "deal", me, `${o.by.n} refuse ta contre-offre à ${ask} M€ et raccroche`, "refused"); mcSay(o.by, "Trop cher !", "no"); mcSfx("block"); } }
  mcR("bub");
}
function mcDealMood(){
  const s = M.sheet, p = mcClub(s.club), amt = s.amt;
  if(s.mode==="buy"){ const c = mcRoster(p).find(x => x.uid===s.u), ask = mcAsk(p, c); return ask===Infinity ? 0 : amt/ask; }
  const c = mcRoster(mcMe()).find(x => x.uid===s.u), bid = mcBid(p, c); return bid<=0 ? 0 : bid/amt;
}
const mcClub = k => M.clubs[k];
function mcDealSend(){
  const s = M.sheet, p = mcClub(s.club), me = mcMe(), amt = s.amt;
  if(M.deals >= MC.deals) return toast(`${MC.deals} propositions maximum par période.`);
  if(s.mode==="buy"){
    if(me.ban===M.period) return toast("Interdit de recruter cette période (sanction de la Ligue).");
    const c = mcRoster(p).find(x => x.uid===s.u); if(!c || me.money < amt) return toast("Pas assez d'argent.");
    M.deals++;
    const ask = mcAsk(p, c);
    if(amt >= ask){
      mcTransfer(p, me, c, amt); M.sheet = null; mcSfx("coin");
      let extra = "";
      if(!p.cpu && mcAllied(p, me) && amt >= c.val + 20){ p.mission = true; extra = " Ton allié a de quoi attaquer le leader…"; }
      M.flash = mcAct_(me, "deal", p, `${c.n} signe chez toi pour ${amt} M€.${extra}`); mcSay(p, mcAllied(p, me) ? "Je sais quoi en faire 😏" : "Affaire conclue", "ok");
    } else { M.sheet = null; M.flash = mcAct_(me, "deal", p, ask===Infinity ? (c.trait==="fidele" ? `${c.n} est 🔒 Fidèle : pas à vendre.` : `${p.n} refuse de traiter avec toi. Il n'a pas oublié…`) : `${p.n} refuse ${amt} M€ pour ${c.n}.`, "refused"); mcSay(p, ask===Infinity ? "Jamais 😠" : "Trop bas 🙄", "no"); mcSfx("block"); }
  } else {
    const c = mcRoster(me).find(x => x.uid===s.u), bid = mcBid(p, c);
    if(!mcCanSell(me)) return toast(`Effectif minimum : ${MC.minSquad} joueurs.`);
    M.deals++;
    if(bid >= amt && p.money >= amt){ mcTransfer(me, p, c, amt); M.sheet = null; mcSfx("coin"); if(me.retro===M.period) me.money += Math.round(amt*0.2); M.flash = mcAct_(me, "deal", p, `${p.n} t'achète ${c.n} pour ${amt} M€ (cote ${c.val}).`); mcSay(p, "Topé !", "ok"); }
    else { M.sheet = null; M.flash = mcAct_(me, "deal", p, `${p.n} ne paiera pas ${amt} M€ pour ${c.n}.`, "refused"); mcSay(p, "Non merci", "no"); mcSfx("block"); }
  }
  mcR("bub");
}

/* ---------- cartes */
/* ---------- affaires */
const mcPair = (a, b) => [M.clubs.indexOf(a), M.clubs.indexOf(b)].sort((x,y) => x-y).join("-");
const mcBond = (a, b, old) => ((old ? M.bondOld : M.bond) || {})[mcPair(a, b)] || 0;
const mcFeud = (a, b) => (M.feud || {})[mcPair(a, b)] || 0;
const mcAfMoney = (k, o={}) => (MC_AF[k].cost||0) + (MC_AF[k].mise||0) + (k==="pari" ? (o.mise||0) : 0);
function mcAfTargets(by, k, to){
  if(!to) return [];
  if(k==="clause") return mcRoster(to).filter(c => c.trait!=="fidele" && c.boughtAt!==M.period && by.money >= Math.round(c.val*MC.clauseMult));
  if(k==="chantage") return mcRoster(to).filter(c => c.trait!=="fidele" && c.boughtAt!==M.period && by.money >= Math.round(c.val*0.6) + (MC_AF.chantage.mise||0));
  return [];
}
const mcAfNeedsSeat = k => ["atk","inv","spy","pacte","betray"].includes(MC_AF[k].k);
function mcAfCheck(by, k, to, o={}){
  const A = MC_AF[k]; if(!A) return "Inconnu.";
  if(!A.hidden && (by.once||{})[k]===(M.season||1)) return "Déjà utilisée cette saison.";
  if(by.money < mcAfMoney(k, o)) return `Il te faut ${mcAfMoney(k, o)} M€.`;
  if((k==="clause" || k==="chantage") && by.ban===M.period) return "Interdit de recruter cette période (sanction de la Ligue).";
  if(A.need){ const e = A.need(by, to); if(e) return e; }
  if(!mcAfNeedsSeat(k)) return null;
  if(!to || to===by) return "Choisis un président.";
  if(k==="trahison") return mcAllied(by, to) ? null : "Tu n'as pas de pacte avec lui.";
  if(mcAllied(by, to)) return "Vous avez un pacte : pas de coup entre alliés.";
  if(k==="pacte") return mcAllies(by).length || mcAllies(to).length ? (by===mcMe() && mcAllies(by).length ? "Un seul pacte à la fois." : "Il a déjà un engagement ailleurs…") : null;
  if(A.pick && !mcAfTargets(by, k, to).length) return "Aucun joueur à ta portée (argent, 🔒 Fidèle ou recrue du moment).";
  return null;
}
function mcTagAf(p, k){ (p.recent ||= []).push({k, per:M.period, s:M.season||1}); if(p.recent.length > 30) p.recent.shift(); if(MC_AF[k].sus > 0) p.lastDirty = M.period; }
/* exécute une affaire (après une éventuelle riposte) ; renvoie le texte du résultat */
function mcAfApply(by, k, to, c, o={}){
  const A = MC_AF[k];
  by.money -= (A.cost||0) + (A.mise||0);
  if(A.sus) mcSusUp(by, A.sus);
  mcTagAf(by, k); (by.once ||= {})[k] = M.season||1;
  if(A.k==="atk" && to){ to.hit = true; by.bas++; if(to.bot) to.grudge = by; M.feud ||= {}; M.feud[mcPair(by, to)] = mcFeud(by, to) + 1; }
  switch(k){
    case "prime": by.mods.push({t:"🏅 Prime de match", v:3}); return "+3 de note sur la période";
    case "pari": by.money -= o.mise; by.bet = {mise:o.mise, o:o.o}; return `${o.mise} M€ misés sur ${({V:"une victoire",N:"un nul",D:"une défaite"})[o.o]} au gros match`;
    case "arrange": by.fix = M.period; return `${mcCN(M.bigOpp)} lèvera le pied au gros match`;
    case "comptes": by.money += 30; by.loan = (by.loan||0) + 35; return "+30 M€ tout de suite, 35 M€ à rembourser en fin de saison";
    case "retro": by.retro = M.period; return "+20 % sur tes ventes aux clubs cette période";
    case "sponsor": by.ghost = M.season||1; return "+6 M€ à chaque période jusqu'à la fin de saison";
    case "miroir": { const al = mcAllies(by)[0]; [by, al].forEach(q => { mcRoster(q).sort((a,b) => b.val-a.val).slice(0, 3).forEach(x => { x.form = Math.min(1.6, x.form*1.15); mcRevalue(x); }); if(q!==by){ mcSusUp(q, A.sus); mcTagAf(q, k); } });
      return `Les cotes de tes 3 meilleurs et de ceux de ${mcShort(al)} gonflent de 15 %`; }
    case "chantage": { const cost = Math.round(c.val*0.6); mcTransfer(to, by, c, cost); return `${c.n} lui est « cédé » pour ${cost} M€`; }
    case "fuite": { const st = mcStar(to); if(st){ st.form = Math.max(0.6, st.form*0.8); mcRevalue(st); } to.mods.push({t:`📰 Rumeur${st?` sur ${cardName(st.n)}`:""}`, v:-2}); return st ? `${st.n} perd 20 % de cote, son équipe −2 de note` : "−2 de note pour son équipe"; }
    case "taupe": M.spies = (M.spies||[]).filter(x => !(x.by===by && x.on===to)); M.spies.push({by, on:to, until:M.period+1}); return "Tu vois ses soupçons, parades et magouilles pendant 2 périodes";
    case "pelouse": to.mods.push({t:"🪣 Pelouse arrosée", v:-3}); return "−3 de note pour son équipe sur la période";
    case "detective": { const act = mcActive(to); if(by===mcMe()) M.det = {to, sus:to.sus||0, act:act.map(x => x.k), done:false};
      return act.length ? `${act.length} magouille${act.length>1?"s":""} trouvée${act.length>1?"s":""} chez ${to.n}` : `${to.n} a l'air clean`; }
    case "clause": { const cost = Math.round(c.val*MC.clauseMult); mcTransfer(to, by, c, cost); return `${c.n} change de camp (${cost} M€)`; }
    case "pacte": M.pacts.push({a:by, b:to, until:M.period + MC.pactLen - 1}); M.bond ||= {}; M.bond[mcPair(by, to)] = mcBond(by, to) + 1; return `Pacte secret jusqu'à la période ${M.period + MC.pactLen - 1}`;
    case "trahison": { mcBreak(by, to); const v = Math.min(15, Math.max(0, to.money)); to.money -= v; by.money += v; to.mods.push({t:"🗡️ Trahi", v:-3}); by.betrayed++; if(to.bot) to.grudge = by; M.feud ||= {}; M.feud[mcPair(by, to)] = mcFeud(by, to) + 1; return `${v} M€ volés et −3 de note pour la victime`; }
    case "gala": by.sus = Math.max(0, (by.sus||0) - 20); return "−20 soupçons";
    case "tenor": by.sus = Math.max(0, (by.sus||0) - 35); return "−35 soupçons";
  }
  return "";
}
/* parades disponibles contre une affaire */
const mcParFor = (p, k) => (p.par||[]).filter(x => MC_PAR[x] && (MC_PAR[x].vs==="*" || MC_PAR[x].vs.includes(k)));
/* retour de bâton : la cible riposte, l'attaquant perd sa mise et prend un malus */
function mcBackfire(by, k, to, par){
  const A = MC_AF[k] || {}; to.par.splice(to.par.indexOf(par), 1);
  const mise = (A.cost||0) + (A.mise||0) + (k==="mission" ? 5 : 0), lost = Math.min(Math.max(0, by.money), mise);
  by.money -= lost; to.money += lost; mcSusUp(by, 20); mcTagAf(by, k); by.hit = true; if(to.bot) to.grudge = by;
  M.feud ||= {}; M.feud[mcPair(by, to)] = mcFeud(by, to) + 1;
  const who = by===mcMe() ? "tu perds" : `${by.n} perd`;
  if(par==="contre"){ M.spies = (M.spies||[]).filter(x => !(x.by===to && x.on===by)); M.spies.push({by:to, on:by, until:M.period+1}); return `🔍 Démasqué ! ${to===mcMe()?"Tu espionnes":`${to.n} espionne`} désormais ${by===mcMe()?"toi":by.n} pendant 2 périodes. ${who} ${lost} M€.`; }
  if(par==="ligue"){ const t = mcEnquete(by); return `📞 La Ligue enquête aussitôt : ${t}. ${who} sa mise (${lost} M€).`.replace("tu perds sa", "tu perds ta"); }
  if(par==="presse"){ by.mods.push({t:"🎙️ Retour de bâton", v:-2}); return `🎙️ L'affaire se retourne : −2 de note pour ${by===mcMe()?"toi":by.n}, ${lost} M€ perdus.`; }
  return `⚖️ Coup annulé par l'avocat : ${who} ${lost} M€ et prend +20 soupçons.`;
}
/* dénoncer après le détective */
function mcDenounce(by, to){
  const act = mcActive(to);
  if(act.length){ const t = mcEnquete(to); by.money += 10; return {ok:true, t:`La Ligue confirme : ${to.n} sanctionné pour ${MC_CASE[act.at(-1).k]||"magouilles"} (${t}). Prime de 10 M€.`}; }
  by.money -= 8; mcSusUp(by, 15); return {ok:false, t:`Dénonciation calomnieuse : ${to.n} est clean. −8 M€ et +15 soupçons.`};
}
const mcAct_ = (by, st, to, out, res="ok") => ({by, st, to, out, res});
const mcCardOf = st => st==="deal" ? {ic:"💸", t:"Transfert", k:"deal"} : st==="enq" ? {ic:"🚨", t:"Enquête de la Ligue", k:"bas"} : MC_AF[st] ? {...MC_AF[st], k:MC_AF[st].k==="atk" || st==="trahison" ? "bas" : MC_AF[st].k==="pacte" ? "pacte" : "bonus"} : {ic:"❔", t:st, k:"bonus"};
/* moi : lancer l'affaire préparée dans la fiche */
function mcAfGo(){
  const s = M.sheet, me = mcMe(), k = s.k, A = MC_AF[k], to = s.seat!=null ? M.players[s.seat] : null, o = {mise:s.mise, o:s.o};
  const counts = A.k!=="clean";
  if(counts && M.played >= MC.plays) return toast(`${MC.plays} affaires maximum par période.`);
  if(A.bet && (!s.mise || !s.o)) return toast("Choisis ta mise et le résultat.");
  const c = A.pick ? mcAfTargets(me, k, to).find(x => x.uid===s.u) : null;
  const err = mcAfCheck(me, k, to, o); if(err) return toast(err);
  if(A.pick && !c) return toast("Choisis un joueur.");
  if(counts) M.played++; M.sheet = null;
  if(k==="pacte"){
    const last = mcRank().at(-1)===to, lead = mcRank()[0]===me, p = to.grudge===me ? 0 : {easy:0.75, normal:0.55, hard:0.4}[M.diff] + (last ? 0.2 : 0) - (lead && M.diff!=="easy" ? 0.3 : 0) + Math.min(0.2, mcBond(me, to)*0.1);
    if(M.r() < p){ M.flash = mcAct_(me, k, to, mcAfApply(me, k, to)); mcSay(to, "🤫 Marché conclu", "ok"); mcSfx("coin"); }
    else { M.flash = mcAct_(me, k, to, to.grudge===me ? `${to.n} : « Après ce que tu m'as fait ? Jamais. »` : `${to.n} refuse : « Toi, t'es trop fort… »`, "refused"); mcSay(to, "Non merci 😏", "no"); mcSfx("block"); }
    return mcR("bub");
  }
  if(A.k==="atk" && to){ const ps = mcParFor(to, k);
    if(ps.length && M.r() < {easy:0.55, normal:0.8, hard:0.95}[M.diff]){ const out = mcBackfire(me, k, to, ps[0]); mcSay(to, `${MC_PAR[ps[0]].ic} Riposte !`, "ok"); M.flash = mcAct_(me, k, to, out, "blocked"); mcSfx("block"); return mcR("bub"); } }
  const out = mcAfApply(me, k, to, c, o);
  if(k==="detective"){ M.sheet = {t:"det"}; mcSfx("card"); return mcR("sheet"); }
  if(to && A.k==="atk") mcSay(to, "Je n'oublierai pas 😠", "hit");
  if(k==="trahison") mcSay(to, "Traître ! 😠", "hit");
  M.flash = mcAct_(me, k, to, out); mcSfx(A.k==="atk" || k==="trahison" ? "hit" : "coin"); mcR("bub");
}

/* ---------- ordinateurs */
function mcBotsStart(){ M.queue = mcRank().reverse().filter(p => p.bot); M.qi = 0; M.bub = {}; M.flash = null; M.show = []; mcBotsStep(); }
function mcBotsStep(){
  while(M.qi < M.queue.length){ const r = mcBotTurn(M.queue[M.qi]); if(r==="wait") return; M.qi++; }
  mcBotMarket();
  M.si = 0; M.phase = "after"; if(M.show.length) mcSfx(M.show[0].res==="ok" && M.show[0].to ? "hit" : "card"); mcR("act");
}
/* les ordinateurs achètent aussi aux clubs IA, se vendent des joueurs, revendent quand ils manquent d'argent */
function mcBotMarket(){
  const bots = M.players.filter(p => p.bot);
  bots.forEach(p => { if(p.money < 8 && p.bench.length && mcCanSell(p)){ const c = [...p.bench].sort((a,b) => b.val-a.val)[0]; const v = mcSell(p, c); M.show.push(mcAct_(p, "deal", null, `Besoin de cash : ${p.n} vend ${c.n} à la banque (${v} M€)`)); } });
  bots.forEach(buyer => {
    if(M.r() > {easy:0.25, normal:0.4, hard:0.55}[M.diff]) return;
    const sellers = [...M.cpu, ...bots.filter(q => q!==buyer && q.grudge!==buyer && buyer.grudge!==q)];
    const offers = sellers.flatMap(s => mcRoster(s).filter(c => c.trait!=="fidele").map(c => ({s, c, w:mcWtp(buyer, c), ask:s.cpu ? mcAsk(s, c) : Math.max(c.val, mcWtp(s, c)*0.8)*1.1}))).filter(x => x.ask!==Infinity && x.w >= x.ask && buyer.money - 5 >= x.ask).sort((a,b) => (b.w-b.ask)-(a.w-a.ask));
    const x = offers[0]; if(x){ const amt = Math.round(x.ask); mcTransfer(x.s, buyer, x.c, amt); M.show.push(mcAct_(buyer, "deal", x.s.cpu ? null : x.s, `${buyer.n} recrute ${x.c.n} (${x.c.ovr}) chez ${x.s.n} pour ${amt} M€`)); }
  });
}
function mcBotTarget(p, st){
  let rivals = M.players.filter(q => q!==p && !mcAfCheck(p, st, q));
  if(!rivals.length) return null;
  const me = mcMe();
  if(st==="pacte"){
    if(mcCoalition()){ const b = rivals.filter(q => q.bot); if(b.length) return b[0]; }
    rivals = rivals.filter(q => q.grudge!==p && p.grudge!==q && mcFeud(p, q) < 3); if(!rivals.length) return null;
    const friend = [...rivals].sort((a,b) => mcBond(p, b) - mcBond(p, a))[0];
    if(mcBond(p, friend) >= 1 && M.r() < 0.7) return friend;
    const rk = mcRank(); return M.diff==="hard" ? rivals.sort((a,b) => rk.indexOf(b)-rk.indexOf(a))[0] : rivals[Math.floor(M.r()*rivals.length)];
  }
  if(st==="detective"){ const sus = [...rivals].sort((a,b) => (b.sus||0) - (a.sus||0))[0]; return sus && (sus.sus||0) >= 25 ? sus : null; }
  if(p.grudge && rivals.includes(p.grudge) && M.r() < 0.65) return p.grudge;
  const enemy = [...rivals].sort((a,b) => mcFeud(p, b) - mcFeud(p, a))[0];
  if(enemy && mcFeud(p, enemy) >= 2 && M.r() < 0.5) return enemy;
  if(mcCoalition() && rivals.includes(me) && M.r() < (M.diff==="hard" ? 0.85 : 0.55)) return me;
  if(M.diff==="easy") return rivals[Math.floor(M.r()*rivals.length)];
  if(M.diff==="normal" && p.prof!=="A" && M.r()<0.4) return rivals[Math.floor(M.r()*rivals.length)];
  return mcRank().find(q => rivals.includes(q));
}
/* la personnalité de chaque président ordinateur oriente ses affaires */
const MC_BOTAF = {A:["fuite","pelouse","chantage","clause","pari","trahison","prime","comptes"], B:["sponsor","comptes","retro","pari","prime","detective"], C:["pacte","miroir","detective","prime","pari","sponsor"], D:["taupe","detective","clause","pari","prime","retro"]};
function mcBotTurn(p){
  if(p._t!==M.period){ p._t = M.period; p._n = 0;
    // blanchiment et achat de parades
    if((p.sus||0) >= 55 && M.r() < 0.6){ const k = p.sus >= 75 ? "tenor" : "gala"; if(p.money - MC_AF[k].cost > 10) mcAfApply(p, k); }
    if(p.par.length < 2 && p.money > 35 && M.r() < 0.35){ const k = Object.keys(MC_PAR)[Math.floor(M.r()*4)]; p.money -= MC_PAR[k].price; p.par.push(k); }
    // mission financée par un allié
    if(p.mission){ p.mission = false;
      const lead = mcRank().find(q => q!==p && !mcAllied(p, q));
      const c = lead && mcRoster(lead).filter(c => c.trait!=="fidele" && c.boughtAt!==M.period && Math.round(c.val*MC.clauseMult) <= p.money).sort((a,b) => b.ovr-a.ovr)[0];
      if(c){ const cost = Math.round(c.val*MC.clauseMult);
        if(!lead.bot && mcParFor(lead, "mission").length){ M.pending = {by:p, st:"mission", to:lead, c, cost}; M.phase = "react"; mcSfx("hit"); mcR(); return "wait"; }
        const ps = mcParFor(lead, "mission");
        if(ps.length && M.r()<0.6) M.show.push(mcAct_(p, "mission", lead, mcBackfire(p, "mission", lead, ps[0]), "blocked"));
        else { mcTransfer(lead, p, c, cost); lead.hit = true; M.show.push(mcAct_(p, "mission", lead, `Avec l'argent de son allié, ${p.n} arrache ${c.n} au leader (${cost} M€) !`)); }
      }
    }
  }
  const rate = {easy:0.45, normal:{A:0.9, B:0.6, C:0.7, D:0.65}[p.prof], hard:0.92}[M.diff], cap = {easy:35, normal:50, hard:65}[M.diff];
  for(const k of mcShuffle([...MC_BOTAF[p.prof]], M.r)){
    if(p._n >= MC.plays) break;
    if(M.r() > rate) continue;
    const A = MC_AF[k];
    if(A.sus && (p.sus||0) + A.sus*(MC_PROFILES[p.profile]?.sus||1) > cap) continue;
    if(k==="trahison" && !(p.prof==="A" || M.r()<0.5)) continue;
    let to = null, c = null, o = {};
    if(mcAfNeedsSeat(k)){ to = mcBotTarget(p, k); if(!to) continue; }
    if(A.pick){ c = mcAfTargets(p, k, to).sort((a,b) => b.ovr-a.ovr)[0]; if(!c) continue; }
    if(A.bet){ o = {mise:Math.min(12, Math.floor(p.money/5)), o:"V"}; if(o.mise < 3) continue; }
    if(mcAfCheck(p, k, to, o)) continue;
    p._n++;
    if(to && !to.bot && (k==="pacte" || (A.k==="atk" && mcParFor(to, k).length))){ M.pending = {by:p, st:k, to, c, o}; M.phase = k==="pacte" ? "offer" : "react"; mcSfx(k==="pacte" ? "card" : "hit"); mcR(); return "wait"; }
    if(k==="pacte"){ if(M.r() < (mcCoalition() ? 0.9 : 0.6)) mcAfApply(p, k, to); continue; }   // secret : personne ne le voit
    if(A.k==="atk" && to.bot){ const ps = mcParFor(to, k); if(ps.length && M.r() < 0.8){ M.show.push(mcAct_(p, k, to, mcBackfire(p, k, to, ps[0]), "blocked")); continue; } }
    const out = mcAfApply(p, k, to, c, o);
    if(k==="detective"){ if(mcActive(to).length && M.r() < 0.75){ const d = mcDenounce(p, to); M.show.push(mcAct_(p, "detective", to, `Son détective fouille chez ${to===mcMe()?"toi":to.n}, et il dénonce à la Ligue. ${d.t}`, d.ok ? "ok" : "refused")); } continue; }
    if(A.k==="atk" || k==="trahison"){ const vg = p.grudge===to && to===mcMe(); M.show.push(mcAct_(p, k, to, (k==="trahison" && to!==mcMe() ? "Ils étaient alliés en secret ! " : vg ? "Vengeance ! " : "") + out)); }
    // les magouilles perso restent secrètes : seules les rumeurs filtrent
  }
}
function mcAnswer(v){
  const {by, st, to, c, cost, o} = M.pending; M.pending = null;
  const par = MC_PAR[v] ? v : null;
  if(st==="pacte"){ if(v==="1") M.show.push(mcAct_(by, st, to, mcAfApply(by, st, to) + " · personne d'autre ne le sait")); else M.show.push(mcAct_(by, st, to, "Tu refuses le pacte", "refused")); }
  else if(par){ mcSfx("block"); M.show.push(mcAct_(by, st, to, mcBackfire(by, st, to, par), "blocked")); }
  else if(st==="mission"){ mcTransfer(to, by, c, cost); to.hit = true; M.show.push(mcAct_(by, st, to, `${by.n} t'arrache ${c.n} (${cost} M€) avec l'argent de son allié !`)); }
  else M.show.push(mcAct_(by, st, to, mcAfApply(by, st, to, c, o||{})));
  M.phase = "botsplay";
  const r = mcBotTurn(by); if(r==="wait") return;
  M.qi++; mcBotsStep();
}

/* ---------- fin de période / fin de saison */
function mcNext(){
  mcCrowd(false);
  if(M.period < MC.periods){ M.period++; mcSave(); mcPeriodStart(); return; }
  const L = mcLeague();
  M.players.forEach(p => { if(p.loan){ p.money -= p.loan; p.loanPaid = p.loan; p.loan = 0; } p.ghost = 0; p.prize = (21 - (L.indexOf(p)+1))*2; p.money += p.prize; });
  M.players.forEach(p => { p.secretOk = !!(p.secret && MC_SECRETS[p.secret].ok(p)); p.boardOk = L.indexOf(p)+1 <= p.goal; p.sc = mcProg(p, true); p.final = p.sc.tot; });
  M.final = [...M.players].sort((a,b) => b.final-a.final || L.indexOf(a)-L.indexOf(b));
  const me = mcMe(), rank = M.final.indexOf(me) + 1, won = rank===1;
  M.trophies = mcTrophies();
  const r = {mode:"mercato", diff:M.diff, solo:true, score:(5-rank)*2 + (M.diff==="hard"?2:M.diff==="normal"?1:0) + (L[0]===me ? 2 : 0), total:null, won, found:[], pepites:[]};
  L_SUM(r);
  if(M.daily){ const k = todayKey(), b = PROFILE.best.mercatoDay; if(!b || b.day!==k || me.final > b.pts){ PROFILE.best.mercatoDay = {day:k, pts:me.final, rank}; saveProfile(); }
    mcSubmitDay(Math.max(0, me.final), mcPos(me), me.n); }
  if(won){ setTimeout(() => celebrate("gold"), 300); mcSfx("win"); }
  M.players.forEach(p => p.careerPts = (p.careerPts||0) + p.final);
  // zone rouge : deux saisons de suite dans les 3 derniers en carrière = viré
  if(!M.daily && (M.len||1) > 1){ me.releg = mcPos(me) >= 18 ? (me.releg||0) + 1 : 0; if(me.releg >= 2) M.fired = true; }
  // succès
  const got = {champ:L[0]===me, hard:won && M.diff==="hard", gain50:me.bestGain >= 50, rich150:me.money >= 150, cup:!!(M.cup && M.clubs[M.cup.winner]===me)};
  PROFILE.best.mcAch = PROFILE.best.mcAch || {};
  M.newAch = Object.keys(got).filter(k => got[k] && !PROFILE.best.mcAch[k]);
  M.newAch.forEach(k => PROFILE.best.mcAch[k] = todayKey());
  if(M.newAch.length) saveProfile();
  M.palmares = M.palmares || []; M.palmares.push({s:M.season, pos:mcPos(me), rank, cup:M.cup && M.clubs[M.cup.winner]===me, champ:L[0]===me, board:me.boardOk, champion:L[0].n});
  M.seasonDone = true; M.careerOver = !M.daily && (M.season >= (M.len||1) || !!M.fired);
  M.seasonStats = mcSeasonStats();
  if(M.careerOver){ try{ localStorage.removeItem(MC_SAVE); }catch(e){} } else mcSave();
  M.phase = "end"; mcR("end");
}
/* ---------- partie du jour : classement en ligne */
let MCB = {day:null, data:null, loading:false, err:null};
async function mcSubmitDay(score, pos, club){
  const client = typeof sb==="function" && sb(); if(!client) return;
  try{ await client.rpc("submit_mercato_day", {p_day:todayKey(), p_player:PROFILE.id, p_pseudo:PROFILE.name, p_score:Math.max(0, Math.min(250, score)), p_pos:pos, p_club:club}); MCB.day = null; mcLoadBoard(); }catch(e){}
}
async function mcLoadBoard(){
  const day = todayKey(), client = typeof sb==="function" && sb();
  if(!client){ MCB = {day, data:null, loading:false, err:"Classement indisponible hors ligne."}; return; }
  if(MCB.loading || MCB.day===day) return;
  MCB = {day, data:null, loading:true, err:null};
  try{ const {data, error} = await client.rpc("mercato_board", {p_day:day, p_player:PROFILE.id}); if(error) throw error; MCB = {day, data, loading:false, err:null}; }
  catch(e){ MCB = {day, data:null, loading:false, err:"Impossible de charger le classement."}; }
  render(true);
}
function mcBoardHTML(n=8){
  if(MCB.day!==todayKey() && !MCB.loading) setTimeout(mcLoadBoard, 0);
  if(MCB.err) return `<p class="mct-hint">${esc(MCB.err)}</p>`;
  const d = MCB.data; if(!d) return `<p class="mct-hint">Chargement du classement…</p>`;
  if(!d.count) return `<p class="mct-hint">Personne n'a encore joué aujourd'hui : prends la tête !</p>`;
  return `<div class="dboard">${d.top.slice(0, n).map(x => `<p class="${x.me?"me":""}"><span>${x.rank}</span><b>${esc(x.pseudo)}</b><small>${esc(x.club)} · ${x.pos}ᵉ</small><em>${x.score}</em></p>`).join("")}
    ${d.me && d.me.rank > n ? `<p class="me"><span>${d.me.rank}</span><b>Toi</b><small>${d.me.pos}ᵉ</small><em>${d.me.score}</em></p>` : ""}<small class="dcount">${d.count} président${d.count>1?"s":""} aujourd'hui</small></div>`;
}
/* ---------- carrière : sauvegarde locale (une carrière à la fois) */
const MC_SAVE = "fl_mercato_career";
function mcSave(){
  if(!M || M.daily) return;
  const idx = c => c ? M.clubs.indexOf(c) : -1;
  const data = {ver:2, len:M.len||1, diff:M.diff, season:M.season, period:M.period, round:M.round, fixtures:M.fixtures, pools:M.pools, pdeck:M.pdeck, newsPlan:M.newsPlan,
    clubs:M.clubs.map(k => ({...k, grudge:idx(k.grudge)})), pacts:M.pacts.map(x => ({a:idx(x.a), b:idx(x.b), until:x.until})),
    bestTrade:M.bestTrade||null, cup:M.cup||null, hist:M.hist||[], palmares:M.palmares||[], seasonDone:!!M.seasonDone, secretChoice:M.secretChoice,
    tlog:M.tlog||[], bond:M.bond||{}, feud:M.feud||{}, bondOld:M.bondOld||{}, freeAg:M.freeAg||[], spies:(M.spies||[]).map(x => ({by:idx(x.by), on:idx(x.on), until:x.until}))};
  try{ localStorage.setItem(MC_SAVE, JSON.stringify(data, (k, v) => k==="from" || k==="_n" ? undefined : v)); }catch(e){}
}
function mcSaved(){ try{ const d = JSON.parse(localStorage.getItem(MC_SAVE) || "null"); return d && d.ver===2 ? d : null; }catch(e){ return null; } }
function mcLoad(){
  const d = mcSaved(); if(!d) return toast("Aucune carrière sauvegardée.");
  leaveGame(false, true); mcStopFlash();
  M = {len:d.len||1, diff:d.diff, daily:false, r:rng((Date.now() ^ 0x2c1b3c6d) % 1e9), v:0, season:d.season, period:d.period, round:d.round, fixtures:d.fixtures, pools:d.pools, pdeck:d.pdeck, newsPlan:d.newsPlan,
       market:[], won:{}, susp:new Set(), sel:{}, results:[], bub:{}, show:[], si:0, flash:null, sheet:null, aim:null, played:0, fx:null, flashA:null, inbox:[], news:null, buys:MC.buys, deals:0, drawn:[], moves:[],
       bestTrade:d.bestTrade, cup:d.cup, hist:d.hist||[], palmares:d.palmares, seasonDone:d.seasonDone, secretChoice:d.secretChoice,
       tlog:d.tlog||[], bond:d.bond||{}, feud:d.feud||{}, bondOld:d.bondOld||{}, freeAg:d.freeAg||[]};
  M.sr = M.r; M.clubs = d.clubs; M.players = M.clubs.slice(0, 4); M.cpu = M.clubs.slice(4);
  M.clubs.forEach(k => { k.grudge = k.grudge>=0 ? M.clubs[k.grudge] : null; });
  M.pacts = d.pacts.map(x => ({a:M.clubs[x.a], b:M.clubs[x.b], until:x.until}));
  M.spies = (d.spies||[]).map(x => ({by:M.clubs[x.by], on:M.clubs[x.on], until:x.until}));
  VIEW = "mercato";
  if(M.seasonDone) mcNewSeason(); else mcPeriodStart();
}
/* saison suivante : vieillissement, progression d'été, retraites, primes, nouveaux objectifs */
function mcNewSeason(){
  const L = mcLeague(), r = M.r, notes = [], me = mcMe();
  M.freeAg = [];
  // fins de contrat
  M.clubs.forEach(k => mcRoster(k).forEach(c => {
    c.ct = (c.ct||1) - 1;
    if(c.ct > 0) return;
    if(k===me){ mcRemove(k, c); notes.push(`📝 ${cardName(c.n)} arrive en fin de contrat et part libre`); mcLog(c, k, "Libre", 0, "free"); c.ct = 2; M.freeAg.push(c); return; }
    if(k.cpu ? r() < 0.25 : (c.ovr < 78 && r() < 0.5)){ mcRemove(k, c); mcLog(c, k, "Libre", 0, "free"); c.ct = 2; M.freeAg.push(c); }
    else c.ct = 2 + Math.floor(r()*2);
  }));
  M.freeAg = mcShuffle(M.freeAg, r).sort((a,b) => b.ovr - a.ovr);
  // relégation : les clubs IA dans les 3 derniers sont remplacés par des promus
  if((M.len||1) > 1){
    const used = new Set(M.clubs.map(k => k.n));
    L.slice(17).forEach(k => {
      if(!k.cpu){ k.money = Math.max(0, k.money - 15); if(k===me) notes.push(me.releg ? "🔻 Zone rouge ! −15 M€. Encore une saison en bas et la direction te vire." : "🔻 Zone rouge : −15 M€ de droits TV"); return; }
      const pr = MC_PROMO.find(x => !used.has(x[0])); if(!pr) return; used.add(pr[0]);
      notes.push(`🔻 ${k.n} descend · 🔺 ${pr[1]} ${pr[0]} monte`);
      Object.assign(k, mcBlank({n:pr[0], ic:pr[1], col:pr[2], cpu:true, tier:1, promoted:true}));
      mcPoolFill(); mcBuildSquad(k, "cpu1");
    });
  }
  mcPoolFill();
  M.clubs.forEach(k => {
    const pos = L.indexOf(k) + 1;
    if(!k.cpu){ const prize = k.boardOk ? 10 : 0; k.money += prize; if(k===me) notes.push(`💰 +${k.prize||0} M€ de prime de classement (${pos}ᵉ)${prize?" + 10 M€ pour l'objectif atteint":""}`); }
    mcRoster(k).forEach(c => {
      c.age++; c.gs = 0;
      if(c.age <= 22 && c.ovr < c.pot) c.ovr = Math.min(c.pot, c.ovr + 2 + Math.floor(r()*4));
      else if(c.age <= 25 && c.ovr < c.pot) c.ovr += 1;
      else if(c.age >= 31) c.ovr -= 1 + Math.floor(r()*3);
      c.form = 1; mcRevalue(c);
      if(k===me && c.age<=22 && c.ovr>=80) notes.push(`🆙 ${cardName(c.n)} passe à ${c.ovr}`);
    });
    mcRoster(k).filter(c => c.age >= 35 && r() < 0.6).forEach(c => { mcRemove(k, c); if(k===me) notes.push(`👋 ${cardName(c.n)} prend sa retraite`); });
    k.pts = k.gf = k.ga = k.w = k.d = k.l = 0; k.form = []; k.bas = 0; k.buys = []; k.bestGain = 0; k.grudge = k.grudge && mcFeud(k, k.grudge) >= 3 ? k.grudge : null; k.mission = false; k.hit = false; k.betrayed = 0; k.bonusPts = 0; k.sus = Math.max(0, (k.sus||0) - 20);
    if(k.cpu) mcRefill(k); else mcLineup(k);
  });
  // nouvel objectif : selon la force de l'effectif
  const byRating = [...M.clubs].sort((a,b) => mcRating(b).total - mcRating(a).total);
  M.players.forEach(p => { p.goal = Math.min(17, Math.max(1, byRating.indexOf(p) + 1 + (p===me ? 1 : 2))); if(p.bot) p.secret = mcShuffle(Object.keys(MC_SECRETS), r)[0]; p.fort0 = mcFortune(p); });
  M.season++; M.period = 1; M.round = 0; M.seasonDone = false; M.pacts = []; M.bestTrade = null;
  M.bondOld = {...(M.bond||{})};
  M.fixtures = mcFixtures(20, r);
  M.newsPlan = [null, ...mcShuffle(Object.keys(MC_NEWS), r).slice(0, MC.periods-1)];
  M.secretChoice = mcShuffle(Object.keys(MC_SECRETS), r).slice(0, 2);
  M.seasonNotes = notes; mcCupInit(); M.hist = [];
  mcSave();
  M.phase = "secret"; mcR();
}
function mcSeasonStats(){
  const me = mcMe(), all = M.clubs.flatMap(k => mcRoster(k).map(c => ({c, k})));
  const scorers = all.filter(x => x.c.gs).sort((a,b) => b.c.gs - a.c.gs).slice(0, 5).map(x => ({n:x.c.n, g:x.c.gs, k:mcCN(x.k), me:x.k===me}));
  const season = (M.tlog||[]).filter(e => e.s===(M.season||1) && e.k!=="bank");
  const rec = [...season].sort((a,b) => b.a - a.a)[0] || null;
  const mine = me.buys.filter(b => mcRoster(me).includes(b.c)).sort((a,b) => ((b.c.gs||0)*3 + b.c.ovr) - ((a.c.gs||0)*3 + a.c.ovr))[0];
  return {scorers, rec, recruit:mine ? {n:mine.c.n, g:mine.c.gs||0, o:mine.c.ovr, price:mine.price} : null, gain:M.bestTrade && M.bestTrade.g > 0 ? {n:M.bestTrade.n, g:M.bestTrade.g, k:mcCN(M.clubs[M.bestTrade.pi])} : null, n:season.length};
}
function L_SUM(r){
  L.summary = Object.assign(recordGame(r), {r, coins:null, bonus:null});
  (async () => { const s = L.summary, coins = await rewardGame(r.score, r.won); s.ref = LAST_REF; if(L.summary!==s || !M) return; s.coins = coins; mcR(); })();
}
function mcTrophies(){
  const t = [], P = M.players, L = mcLeague();
  t.push({ic:"🏆", t:"Champion", d:`${L[0].n} · ${L[0].pts} pts`, p:L[0]});
  if(M.cup && M.cup.winner!=null){ const w = M.clubs[M.cup.winner]; t.push({ic:"🥇", t:"Vainqueur de la coupe", d:w.cpu ? w.n : (w.club||w.n), p:w}); }
  const top = M.clubs.flatMap(k => mcRoster(k).map(c => ({c, k}))).sort((a,b) => (b.c.gs||0)-(a.c.gs||0))[0];
  if(top && top.c.gs) t.push({ic:"👟", t:"Soulier d'or", d:`${top.c.n} · ${top.c.gs} buts`, p:top.k});
  if(M.bestTrade && M.bestTrade.g > 0) t.push({ic:"📈", t:"Coup du siècle", d:`${M.bestTrade.n} · +${M.bestTrade.g} M€`, p:M.clubs[M.bestTrade.pi]});
  const bas = [...P].sort((a,b) => b.bas-a.bas)[0]; if(bas.bas) t.push({ic:"🗡️", t:"Roi des coups bas", d:`${bas.bas} coup${bas.bas>1?"s":""} bas`, p:bas});
  const flops = P.flatMap(p => p.buys.map(b => ({...b, p}))).filter(b => b.price >= 15).map(b => ({...b, loss:b.price - b.c.val})).sort((a,b) => b.loss-a.loss)[0];
  if(flops && flops.loss > 0) t.push({ic:"💸", t:"Flop du mercato", d:`${flops.c.n} : payé ${flops.price}, vaut ${flops.c.val}`, p:flops.p});
  const crook = [...P].sort((a,b) => (b.cases||[]).length - (a.cases||[]).length)[0]; if(crook && (crook.cases||[]).length) t.push({ic:"🚨", t:"Casier le plus chargé", d:`${crook.cases.length} sanction${crook.cases.length>1?"s":""} de la Ligue`, p:crook});
  const def = [...L].sort((a,b) => a.ga-b.ga)[0]; t.push({ic:"🧱", t:"Meilleure défense", d:`${def.ga} buts encaissés`, p:def});
  return t.slice(0, 6);
}
async function mcShare(){
  const me = mcMe(), rank = M.final.indexOf(me)+1, medal = ["🥇","🥈","🥉","4️⃣"][rank-1], pos = mcPos(me);
  const text = `Mercato FC ${M.daily?"· partie du jour ":""}(${MC_DIFF[M.diff].t})\n${medal} ${rank===1?"Meilleur président !":`${rank}ᵉ président sur 4`} · ${me.n} ${pos}ᵉ du championnat (${me.pts} pts)\n${me.w}V ${me.d}N ${me.l}D · objectif direction ${me.boardOk?"✅":"❌"}\n${M.trophies.filter(x => x.p===me).map(x => x.ic+" "+x.t).join(" · ")}\nTu fais mieux ? ${SITE_URL}`;
  try{ if(navigator.share){ await navigator.share({text}); return; } }catch(e){ if(e && e.name==="AbortError") return; }
  try{ await navigator.clipboard.writeText(text); toast("Résultat copié, colle-le où tu veux", "ok"); }catch(e){ toast("Copie impossible sur cet appareil."); }
}

/* ======================================================================
   ÉCRANS
   ====================================================================== */
const MC_STEPS = [["news","📰","Infos"],["mercato","✉️","Mercato"],["coups","💼","Bureau"],["match","⚽","Matchs"]];
function mcStepOf(ph){ return {press:"match", news:"news", mercato:"mercato", reveal:"mercato", flash:"mercato", coups:"coups", botsplay:"coups", react:"coups", offer:"coups", after:"coups", match:"match"}[ph]; }
const mcTraitTag = c => c.trait ? `<span class="trait" title="${MC_TRAITS[c.trait].t}">${MC_TRAITS[c.trait].ic}</span>` : "";
const mcValTag = c => { const d = c.paid!=null ? c.val - c.paid : 0; return `<span class="val${d>0?" up":d<0?" down":""}">${c.val}</span>`; };
/* blason dessiné : écu aux couleurs du club, motif et initiales tirés du nom */
let MC_BADGE_N = 0;
function mcBadge(k, size=28){
  const name = k.cpu ? k.n : (k.club || k.n), h = hashStr(name) >>> 0, id = "bd" + (MC_BADGE_N++);
  const ini = name.replace(/^(FC|AC|Real|Inter|Sporting|Racing|Union|Stade|Athletic|Atlético|Olympique|Dynamo|Celtic|Royal)\s+/i, "").split(/\s+/).filter(w => /^[A-Za-zÀ-ÿ0-9]/.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join("") || "FC";
  const col = k.col || "#2b59c3", alt = ["#ffffff","#0c1240","#ffd23f"][h % 3];
  const pat = [ "", `<rect x="10" width="6" height="46" fill="${alt}" opacity=".85"/><rect x="24" width="6" height="46" fill="${alt}" opacity=".85"/>`,
    `<rect y="15" width="40" height="9" fill="${alt}" opacity=".85"/>`, `<path d="M-4 6 L44 40 L44 50 L-4 16Z" fill="${alt}" opacity=".85"/>`,
    `<path d="M0 10 L20 24 L40 10 L40 18 L20 32 L0 18Z" fill="${alt}" opacity=".85"/>` ][(h >>> 3) % 5];
  return `<svg class="mcbadge" viewBox="0 0 40 46" width="${size}" height="${Math.round(size*1.15)}" aria-hidden="true"><defs><clipPath id="${id}"><path d="M20 2 L37 8 V22 C37 33 29 40 20 44 C11 40 3 33 3 22 V8 Z"/></clipPath></defs>
    <g clip-path="url(#${id})"><rect width="40" height="46" fill="${col}"/>${pat}</g><path d="M20 2 L37 8 V22 C37 33 29 40 20 44 C11 40 3 33 3 22 V8 Z" fill="none" stroke="#fff" stroke-width="2.4"/>
    <text x="20" y="29" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" font-weight="900" fill="#fff" stroke="#0c1240" stroke-width="2.6" paint-order="stroke">${esc(ini)}</text></svg>`;
}
const mcCrest = (p, cls="") => `<i class="crest-i ${cls}" style="--pc:${p.col}">${p.ic}</i>`;

function mcHandCard(st, i, {flip=false}={}){
  const C = MC_PAR[st] || {ic:"❔", t:st};
  return `<span class="mcc k-par${flip?" flip":""}" style="${flip?`animation-delay:${i*0.15}s`:""}"><span class="mcc-ic">${C.ic}</span><b>${C.t}</b></span>`;
}
function mcMini(c, {act="", v="", cls="", val=false}={}){
  const tag = act ? "button" : "span";
  return `<${tag} class="mini${M.susp.has(c.uid) || c.inj>0?" susp":""}${cls}${M.sheet && M.sheet.u===c.uid?" on":""}" ${act?`data-act="${act}" data-v="${esc(v)}"`:""}>${cardHTML(c.id,{small:true})}<span class="mini-pp">${mcOvr(c)}</span>${mcTraitTag(c)}${val?mcValTag(c):""}${M.susp.has(c.uid)?`<span class="mini-x">📸</span>`:c.inj>0?`<span class="mini-x">🚑</span>`:mcSulk(c) && !(M.players && mcMe().power==="motivateur")?`<span class="mini-x">😒</span>`:""}</${tag}>`;
}
/* terrain : les 11 cases du système, de l'attaque (en haut) au gardien */
function mcPitch(p, act="", sel=null){
  const sys = mcSys(p); let k = 0;
  const rows = sys.rows.map(n => Array.from({length:n}, () => k++)).reverse();
  return `<div class="mpitch">${rows.map(r => `<div class="mp-row">${r.map(i => { const sl = sys.s[i], c = p.team.find(o => o.sl===i), f = c ? mcFit(c, sl) : 0;
    return `<button class="mp-t${!c?" empty":""}${f && f<0.9?" off":""}${c && mcOut(c)?" out":""}${sel===i?" on":""}" ${act?`data-act="${act}" data-v="${i}"`:"disabled"}><i>${sl}</i><b>${c?esc(cardName(c.n).split(" ").slice(-1)[0]):"vide"}</b><em>${c?mcEff(c, sl):"—"}${c && c.inj>0?" 🚑":c && M.susp.has(c.uid)?" 📸":""}</em></button>`; }).join("")}</div>`).join("")}</div>`;
}
function mcLine(p, act){ return mcPitch(p, act); }
const mcCompo = p => { const r = mcRating(p), st = mcStyleOf(p); return `<span class="cmp-sys">${p.sys}${st?` ${MC_STYLE[st].ic}`:""}</span><span>🧱 ${r.D}</span><span>🎯 ${r.M}</span><span>⚽ ${r.A}</span><span class="cmp-go">Composer ›</span>`; };
const mcSpying = (by, on) => (M.spies||[]).some(x => x.by===by && x.on===on && x.until >= M.period);
function mcSeat(p){
  const i = mcIdx(p), me = mcMe(), b = M.bub[i];
  const env = M.phase==="mercato" && M.botBids ? (M.botBids[i]||[]).length : 0;
  const act = M.phase==="after" && M.show[M.si], hl = act && (act.by===p ? " actor" : act.to===p ? " victim" : "");
  const fl = M.phase==="flash" && M.flashA, spy = mcSpying(me, p);
  return `<button class="seat${mcAllied(me, p)?" ally":""}${hl||""}${fl && !M.flashA.in[i]?" out":""}" style="--pc:${p.col}" data-act="mcpeek" data-v="${i}">
    <span class="seat-rk">${mcPos(p)}ᵉ</span>${p.grudge===me?`<span class="seat-grudge" title="Il t'en veut">😠</span>`:""}
    <span class="seat-av">${p.ic}</span>
    <b>${mcBadge(p, 13)} ${esc(mcShort(p))}</b>
    <span class="seat-pp">${mcRating(p).total}<small> note</small></span>
    <span class="seat-m">${p.pts} pts · 💰${p.money}</span>
    <span class="seat-row">${(p.par||[]).map(() => `<i class="bk"></i>`).join("")}${spy?`<i class="sh">🕵️ ${p.sus||0}%</i>`:(p.sus||0)>=40?`<i class="sh" title="Des rumeurs circulent">🗞️</i>`:""}${mcAllied(me, p)?`<i class="pc">🤫🤝</i>`:""}</span>
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
const MC_TIPS = {
  news:["📰 Le début de période", "Lis l'info du jour et le point de la direction (blessés, rumeurs, soupçons). Puis passe au mercato."],
  mercato:["✉️ Le mercato à l'aveugle", "Touche un joueur pour glisser une offre secrète. Les rivaux enchérissent aussi : le plus offrant l'emporte. 2 offres maximum."],
  coups:["💼 Le bureau des affaires", "Choisis jusqu'à 2 affaires (chacune une seule fois par saison) : du légal, des magouilles qui rapportent mais font monter tes soupçons, des coups bas contre un rival, ou de l'espionnage en secret. Touche un président en haut pour lui acheter ou vendre un joueur."],
  press:["🎤 La conférence de presse", "Ta réponse donne un bonus ou un malus de note pour les matchs de la période."],
  match:["⚽ Le bilan de la période", "Tes résultats, tes finances et les enquêtes de la Ligue. Ton vrai score, ce sont les points de progression : regarde l'onglet Championnat."],
  club:["👥 Ton club", "Choisis ton système, touche une case du terrain pour changer un joueur. Un joueur hors de son poste perd de sa note."],
  ligue:["🏆 Qui gagne ?", "Le meilleur président est celui qui gagne le plus de points de progression : l'argent gagné × le coefficient de son club, plus les places au-dessus de son objectif."]
};
function mcTip(k){
  const t = MC_TIPS[k]; if(!t || M.daily && M.season>1) return "";
  const seen = PROFILE.best.mcTips || {}; if(seen[k]) return "";
  return `<div class="coach"><b>${t[0]}</b><p>${esc(t[1])}</p><button class="mini-btn go" data-act="mctipok" data-v="${k}">OK, compris</button></div>`;
}
const MC_TABS = [["jeu","⚽","Partie"],["club","👥","Mon club"],["ligue","🏆","Championnat"]];
function mcTable(center, dockHtml="", cls=""){
  const me = mcMe(), step = mcStepOf(M.phase), si = MC_STEPS.findIndex(s => s[0]===step), pos = mcPos(me);
  const lockTab = ["flash","react","offer"].includes(M.phase) || (M.phase==="coups" && M.inbox.length);
  const tab = lockTab ? "jeu" : (M.tab || "jeu");
  if(tab!=="jeu"){ center = tab==="club" ? mcClubView() : mcLeagueView(); dockHtml = `<button class="btn" data-act="mctab" data-v="jeu">⚽ Retour à la partie · ${MC_STEPS[Math.max(0, si)][2]}</button>`; cls += " tab-"+tab; }
  const showHand = false;
  return `<div class="mct ${cls}">
   <div class="mct-top"><button class="iconbtn" data-act="quit" aria-label="Quitter">${ICON.back}</button>
    <span class="mct-season">${M.season>1?`<small>S${M.season}·</small>`:""}P${M.period}<small>/6</small></span>
    <button class="mct-ev" data-act="mcevent">🏆 ${pos}ᵉ · ${me.pts} pts</button>
    <button class="iconbtn mct-help" data-act="mcmute" aria-label="Son">${PROFILE.best.mcMute?"🔇":"🔊"}</button>
    <button class="iconbtn mct-help" data-act="mcrules" aria-label="Règles">?</button></div>
   ${lockTab ? "" : `<div class="mc-tabs">${MC_TABS.map(([k,ic,t]) => `<button class="${tab===k?"on":""}" data-act="mctab" data-v="${k}">${ic} ${t}${k==="club" && mcRoster(me).some(c => c.inj>0 || mcSulk(c)) ? `<i class="dot"></i>` : ""}</button>`).join("")}</div>`}
   <div class="seats">${M.players.slice(1).map(mcSeat).join("")}</div>
   <div class="fixture"><span>${MC_PERIODS[M.period-1]} · J${M.round+1}-${M.round+MC.rounds[M.period-1]}</span><b>🎯 top ${me.goal} <em class="${pos<=me.goal?"ok":"ko"}">${pos<=me.goal?"✓":"✗"}</em></b></div>
   <div class="steps"${tab!=="jeu"?' hidden':""}>${MC_STEPS.map((s,k) => `<span class="${k<si?"done":k===si?"cur":""}">${s[1]} ${s[2]}</span>`).join("")}</div>
   <div class="mct-c">${mcTip(tab!=="jeu" ? tab : M.phase)}${center}</div>
   <div class="me-zone" style="--pc:${me.col}"${tab!=="jeu"?' hidden':""}>
    <div class="me-bar"><span class="seat-av me">${me.power?MC_POWERS[me.power].ic:me.ic}</span><span class="me-st"><b>${esc(me.n)} · ${mcRating(me).total}</b><small>💰 ${me.money} M€ · 💸 −${mcWages(me)}/pér. · ${pos}ᵉ</small></span>
     <span class="me-form">${me.form.slice(-5).map(f => `<i class="f-${f}">${f}</i>`).join("")}</span>
     <span class="me-sh sus${(me.sus||0)>=60?" hot":(me.sus||0)>=35?" warm":""}" title="Soupçons de la Ligue">🕵️ ${me.sus||0}%</span>${mcAllies(me).length?`<span class="me-sh">🤫🤝${mcAllies(me).map(q => q.ic).join("")}</span>`:""}
     <button class="me-dash" data-act="mcdash" aria-label="Tableau de bord">📊</button><button class="me-secret" data-act="mcsecretpeek" aria-label="Objectif secret">🔒</button></div>
    <button class="me-line comp" data-act="mcteam">${mcCompo(me)}</button>
    ${showHand ? `<div class="hand">${me.hand.length ? me.hand.map((st, i) => mcHandCard(st, i, {play:true})).join("") : `<span class="hand-empty">Main vide</span>`}</div>` : ""}
   </div>
   ${dockHtml?dock(dockHtml):""}
   ${mcSheet()}
   ${M.signC ? `<div class="sign-fx" style="--d:${M.phase==="reveal" ? (M.results.length*0.2 + 0.5).toFixed(1) : 0.1}s"><div class="sign-card">${cardHTML(M.signC.id)}</div><b class="sign-st">OFFICIEL</b><small>${esc(M.signC.n)} signe chez ${esc(mcMe().n)}</small></div>` : ""}
  </div>`;
}
/* ---------- vue « Mon club » : effectif, finances, alertes, actions sur chaque joueur */
function mcClubView(){
  const me = mcMe(), sc = mcRating(me), val = mcRoster(me).reduce((t,c) => t+c.val, 0);
  const row = c => { const bench = me.bench.includes(c), tags = [c.inj>0 ? `🚑 ${plural(c.inj,"période")}` : "", M.susp.has(c.uid) ? "📸 suspendu" : "", mcSulk(c) && bench && me.power!=="motivateur" ? "😒 boude" : "", (M.len||1)>1 && c.ct===1 ? "📝 fin de contrat" : "", c.listed ? "📢 en vente" : ""].filter(Boolean);
    return `<div class="cv-row${bench?" bn":""}"><button class="cv-card" data-act="mcpl" data-v="${c.uid}">${cardHTML(c.id,{small:true})}</button>
      <button class="cv-main" data-act="mcpl" data-v="${c.uid}"><b>${esc(cardName(c.n))} ${c.trait?MC_TRAITS[c.trait].ic:""}</b><small>${bench?"Banc":`Titulaire ${mcSys(me).s[c.sl]}`} · ${c.po}${(c.ps||[]).length?"/"+c.ps.join("/"):""} · ${c.age} ans · 💪 ${mcOvr(c)} · ${c.val} M€${c.paid!=null?` <em class="${c.val>=c.paid?"up":"down"}">(${c.val-c.paid>=0?"+":""}${c.val-c.paid})</em>`:""}</small>${tags.length?`<span class="cv-tags">${tags.join(" · ")}</span>`:""}</button>
      <span class="cv-acts">${c.inj>0?`<button class="mini-btn" data-act="mcheal" data-v="${c.uid}">🚑 ${mcHeal(c)}</button>`:""}<button class="mini-btn" data-act="mcmove" data-v="${c.uid}">${bench?"↑":"↓"}</button>
       <button class="mini-btn go" data-act="mcsellask" data-v="${c.uid}">Vendre</button></span></div>`; };
  return `<div class="cv"><div class="kpis cv-k"><div><small>Note d'équipe</small><b>${sc.total}</b></div><div><small>Trésorerie</small><b>${me.money} M€</b></div><div><small>Salaires</small><b>−${mcWages(me)}<i>/pér.${mcWages(me)>MC.wageCap?" 🧾":""}</i></b></div><div><small>Valeur</small><b>${val} M€</b></div></div>
    <p class="cv-t">Système <small>touche une case pour changer un joueur</small></p>
    <div class="chips sys">${Object.entries(MC_SYS).map(([k, S]) => `<button class="${me.sys===k?"on":""}" data-act="mcsys" data-v="${k}">${k}${S.st?` ${MC_STYLE[S.st].ic}`:""}</button>`).join("")}</div>
    <div class="blocks"><span>🧱 Défense <b>${sc.D}</b></span><span>🎯 Milieu <b>${sc.M}</b></span><span>⚽ Attaque <b>${sc.A}</b></span></div>
    ${mcPitch(me, "mcslotc")}
    <div class="lines">${sc.lines.filter(x => x.v).map((x,k) => `<span class="${x.v<0?"neg":k?"bonus":""}">${esc(x.t)} ${k&&x.v>0?"+":""}${x.v}</span>`).join("")}</div>
    <div class="kpis cv-k"><div><small>Soupçons de la Ligue</small><b class="${(me.sus||0)>=60?"neg":""}">${me.sus||0} %</b></div><div><small>Progression</small><b>${mcProg(me).tot} pts</b><i> ${MC_PROFILES[me.profile]?.ic||""} ×${MC_PROFILES[me.profile]?.coef||1}</i></div></div>
    <p class="cv-t">Titulaires</p>${me.team.map(row).join("")}
    <p class="cv-t">Banc <small>${me.bench.length}/${MC.bench}</small></p>${me.bench.map(row).join("") || `<p class="mct-hint">Personne sur le banc.</p>`}
    <p class="mct-hint">« Vendre » : à la banque tout de suite, ou mis sur la liste des transferts (un club t'appellera au prochain bureau).</p>
    <div class="dock-row cv-b"><button class="btn ghost" data-act="mcdash">📊 Tableau de bord</button><button class="btn ghost" data-act="mcsecretpeek">🔒 Objectifs</button></div></div>`;
}
/* ---------- vue « Championnat » : classement, présidents, transferts, buteurs */
function mcLeagueView(){
  const me = mcMe(), sc = M.clubs.flatMap(k => mcRoster(k).map(c => ({c, k}))).filter(x => x.c.gs).sort((a,b) => b.c.gs-a.c.gs).slice(0, 5);
  const tl = [...(M.tlog||[])].filter(e => e.s===(M.season||1) && e.k!=="bank").reverse().slice(0, 6);
  return `<div class="cv">
    <p class="cv-t">Points de progression <small>si la saison s'arrêtait maintenant</small></p>
    <div class="tlog">${[...M.players].map(p => ({p, g:mcProg(p)})).sort((a,b) => b.g.tot-a.g.tot).map((x,k) => `<p class="${x.p===me?"me":""}"><span>${k+1}</span><b>${x.p.ic} ${esc(x.p===me?"Toi":mcShort(x.p))}<small>${MC_PROFILES[x.p.profile]?.ic||""} ×${MC_PROFILES[x.p.profile]?.coef||1} · 💰 ${x.g.fort>=0?"+":""}${x.g.fort} · 🏆 ${x.g.rank>=0?"+":""}${x.g.rank}${x.g.cas?` · 🚨 ${x.g.cas}`:""}${x.g.bon?` · 🏦 +${x.g.bon}`:""}</small></b><em>${x.g.tot}</em></p>`).join("")}</div>
    <p class="cv-t">Présidents</p><div class="cv-pres">${mcRank().map(p => `<button class="cv-p${p===me?" me":""}" style="--pc:${p.col}" ${p===me?"":`data-act="mcpeek" data-v="${mcIdx(p)}"`}><span>${p.ic}</span><b>${esc(p===me?"Toi":mcShort(p))}</b><small>${mcPos(p)}ᵉ · ${p.pts} pts · 💰${p.money} · note ${mcRating(p).total}</small>${p!==me && p.grudge===me?`<i>😠</i>`:""}${p!==me && mcAllied(p, me)?`<i>🤝</i>`:""}</button>`).join("")}</div>
    <p class="cv-t">Classement <small>J${M.round}/38</small></p>${mcLeagueHTML(true, M.phase==="coups" && !M.inbox.length ? "mcclubpeek" : "")}
    ${M.cup ? `<p class="mct-hint">🏆 Coupe : ${M.cup.winner!=null ? `vainqueur ${esc(mcCN(M.clubs[M.cup.winner]))}` : `${M.cup.alive.length} clubs en course${M.cup.alive.includes(0)?", dont toi":" · tu es éliminé"}`}</p>` : ""}
    ${sc.length ? `<p class="cv-t">👟 Buteurs</p><div class="tlog">${sc.map((x,k) => `<p class="${x.k===me?"me":""}"><span>${k+1}</span><b>${esc(cardName(x.c.n))}<small>${esc(mcCN(x.k))}</small></b><em>${x.c.gs}</em></p>`).join("")}</div>` : ""}
    <p class="cv-t">📜 Derniers transferts</p>${tl.length ? `<div class="tlog">${tl.map(e => `<p class="${e.f===me.n||e.t===me.n?"me":""}"><span>P${e.p}</span><b>${esc(cardName(e.n))}<small>${esc(e.f)} → ${esc(e.t)}</small></b><em>${e.k==="free"?"libre":e.a+" M€"}</em></p>`).join("")}</div><button class="linkbtn" data-act="mctlog">Tout voir</button>` : `<p class="mct-hint">Aucun transfert pour l'instant.</p>`}</div>`;
}
/* classement : complet (20) ou compact (top 5 + présidents + voisins) */
function mcLeagueHTML(full, act){
  const L = mcLeague(), before = M.before || L, me = mcMe();
  const show = full ? L : L.filter((p,k) => k<4 || !p.cpu || Math.abs(k - L.indexOf(me)) <= 1 || k===L.length-1);
  let last = -1;
  return `<div class="league${full?" full":""}">${show.map(p => { const k = L.indexOf(p), mv = before.indexOf(p) - k, gap = k > last+1 ? `<div class="lg-gap">···</div>` : ""; last = k;
    const zone = k===0 ? " z-champ" : k<4 ? " z-ucl" : k>=17 ? " z-rel" : "";
    return `${gap}<${act?"button":"div"} class="lg-r${p.cpu?" cpu":""}${p===me?" me":""}${zone}" style="--pc:${p.col}" ${act?`data-act="${act}" data-v="${M.clubs.indexOf(p)}"`:""}><span class="lg-pos">${k+1}</span><span class="lg-av">${mcBadge(p, 20)}</span><b>${esc(p===me ? me.n : p.cpu ? p.n : p.club)}${p.cpu?"":` <small>${esc(p===me?"toi":mcShort(p))}</small>`}</b>
      <span class="lg-mv">${mv>0?"▲":mv<0?"▼":""}</span><span class="lg-f">${p.form.slice(-3).map(f => `<i class="f-${f}"></i>`).join("")}</span>
      <span class="lg-gd">${mcGD(p)>0?"+":""}${mcGD(p)}</span><span class="lg-pts">${p.pts}</span></${act?"button":"div"}>`; }).join("")}</div>`;
}
function mcMood(r){ return r>=1 ? `<span class="mood ok">😀 Il a l'air chaud</span>` : r>=0.85 ? `<span class="mood mid">🤔 Ça se discute</span>` : r>0 ? `<span class="mood no">😬 Il va rire</span>` : `<span class="mood no">🚫 Il refusera</span>`; }
const mcPotTxt = c => c.age<=21 ? (c.scouted ? `pot. ${c.pot}` : `pot. ${c.pot>=85?"⭐⭐⭐":c.pot>=78?"⭐⭐":"⭐"}`) : "";
/* une ligne de joueur avec tout ce qui compte, pour comparer sans ouvrir chaque fiche */
function mcRow(c, k, {act=true}={}){
  const me = mcMe(), can = act && M.phase==="coups" && !M.inbox.length, ci = M.clubs.indexOf(k);
  return `<div class="prow-l"><span class="pl-card">${cardHTML(c.id,{small:true})}</span>
    <button class="pl-main" data-act="mcpl" data-v="${c.uid}"><b>${esc(c.n)} ${c.trait?MC_TRAITS[c.trait].ic:""}${c.inj>0?" 🚑":""}</b><small>${c.po} · ${c.age} ans${c.age<=21?` · ${mcPotTxt(c)}`:""}${k?` · ${mcBadge(k, 11)} ${esc(k.cpu?k.n:k.club)}`:""}${k && k.team && !k.team.includes(c)?" · banc":""}${c.ct===1 && M.period>=MC.flashPeriod?` · <em class="ct-end">📝 fin de contrat</em>`:""}</small></button>
    <span class="pl-ovr">${mcOvr(c)}</span><span class="pl-val">${c.val}<small>M€</small></span>
    <span class="pl-acts">${c.age<=21 && !c.scouted ? `<button class="mini-btn" data-act="mcscoutp" data-v="${c.uid}" title="Rapport du recruteur">🔎 2</button>` : ""}${can && k!==me && c.trait!=="fidele" ? `<button class="mini-btn go" data-act="mcdealfrom" data-v="${ci}|${c.uid}">Offre</button>` : c.trait==="fidele" ? `<span class="mini-lock">🔒</span>` : ""}</span></div>`;
}
const mcPlayerLine = c => `💪 ${mcOvr(c)} · ${c.age} ans${c.age<=21?` · ${mcPotTxt(c)}`:""} · cote ${c.val} M€`;
function mcSheet(){
  const s = M.sheet; if(!s) return "";
  const me = mcMe();
  let body = "";
  if(s.t==="af"){ const k = s.k, A = MC_AF[k], to = s.seat!=null ? M.players[s.seat] : null, o = {mise:s.mise, o:s.o}, f = MC_PROFILES[me.profile]?.sus || 1;
    const err = mcAfCheck(me, k, to, o), cnt = A.k!=="clean";
    body = `<h3>${A.ic} ${A.t}</h3><p class="bid-note">${esc(A.d)}</p>
      <div class="af-meta">${mcAfMoney(k, o) ? `<span>💰 ${mcAfMoney(k, o)} M€${A.mise?" (mise)":""}</span>` : ""}${A.sus ? `<span class="sus">🕵️ +${Math.round(A.sus*f)} soupçons</span>` : A.k==="clean" ? `<span class="ok">🧼 ne compte pas dans tes 2 affaires</span>` : `<span class="ok">✅ légal</span>`}${A.k==="atk" ? `<span>🛡️ parable : ${(A.legal?["avocat","ligue"]:Object.keys(MC_PAR).filter(x => MC_PAR[x].vs==="*" || MC_PAR[x].vs.includes(k))).map(x => MC_PAR[x].ic).join(" ")}</span>` : ""}</div>
      ${A.bet ? `<p class="dash-t">Ta mise</p><div class="chips">${[5,10,20].map(v => `<button class="${s.mise===v?"on":""}" data-act="mcafmise" data-v="${v}">${v} M€</button>`).join("")}</div>
        <p class="dash-t">Gros match : ${esc(mcCN(M.bigOpp))}</p><div class="chips">${[["V","Victoire"],["N","Nul"],["D","Défaite"]].map(([v,t]) => `<button class="${s.o===v?"on":""}" data-act="mcafo" data-v="${v}">${t}</button>`).join("")}</div>
        ${me.fix===M.period ? `<p class="bid-note">🤫 Le match est arrangé… la victoire est presque sûre.</p>` : ""}` : ""}
      ${mcAfNeedsSeat(k) ? M.players.slice(1).map((p, n) => { const e = mcAfCheck(me, k, p, o), seat = n+1;
        if(!A.pick) return `<button class="tgt-p${s.seat===seat?" on":""}" data-act="mcafseat" data-v="${seat}" ${e?"disabled":""}><span class="lg-av">${p.ic}</span><b>${esc(p.club)} <small>${esc(mcShort(p))}${mcSpying(me, p)?` · 🕵️ ${p.sus||0}%`:""}</small></b><em>${e?esc(e):s.seat===seat?"✓":"Choisir"}</em></button>`;
        const list = e ? [] : mcAfTargets(me, k, p);
        return `<div class="tgt-club"><p><span>${p.ic}</span> <b>${esc(p.club)}</b> <small>${esc(mcShort(p))}${e?` · ${esc(e)}`:""}</small></p>${list.length?`<div class="tgt-grid">${list.map(c => `<button class="tgt${s.u===c.uid?" on":""}" data-act="mcafpick" data-v="${seat}|${c.uid}">${cardHTML(c.id,{small:true})}${mcTraitTag(c)}<span>💪${mcOvr(c)} · ${k==="clause"?Math.round(c.val*MC.clauseMult):Math.round(c.val*0.6)} M€</span></button>`).join("")}</div>`:""}</div>`; }).join("") : ""}
      <button class="btn" data-act="mcafgo" ${(!mcAfNeedsSeat(k) && err) || (cnt && M.played >= MC.plays) ? "disabled" : ""}>${cnt && M.played >= MC.plays ? "Déjà 2 affaires cette période" : !mcAfNeedsSeat(k) && err ? esc(err) : `${A.ic} Lancer`}</button>`; }
  if(s.t==="det"){ const D = M.det; if(!D){ M.sheet = null; return ""; }
    body = `<h3>🔎 Rapport du détective</h3><div class="det"><span class="lg-av">${D.to.ic}</span><b>${esc(D.to.club||D.to.n)} · ${esc(mcShort(D.to))}</b>
      <div class="susbar"><i style="width:${D.sus}%"></i></div><small>Soupçons de la Ligue : ${D.sus}%</small>
      ${D.act.length ? `<p class="det-l">${D.act.map(k => `${MC_AF[k].ic} ${MC_AF[k].t}`).join("<br>")}</p>` : `<p class="det-l">Rien de louche ces deux dernières périodes.</p>`}</div>
      ${D.done ? `<p class="bid-note">${esc(D.res)}</p>` : `<button class="btn${D.act.length?"":" ghost"}" data-act="mcdenounce">🚨 Le dénoncer à la Ligue</button><p class="bid-note">${D.act.length ? "Il triche : la Ligue le sanctionnera et tu touches 10 M€." : "Il a l'air clean : une dénonciation te coûterait 8 M€ et +15 soupçons."}</p>`}`; }
  if(s.t==="parshop"){ body = `<h3>🛡️ Acheter une parade</h3><p class="bid-note">Une parade se joue toute seule quand un rival t'attaque : le jeu te demande si tu ripostes. Tu en gardes ${MC.handMax} au maximum.</p>
      ${Object.entries(MC_PAR).map(([k, P]) => `<button class="tgt-p" data-act="mcbuypar" data-v="${k}" ${me.money < P.price || me.par.length >= MC.handMax ? "disabled" : ""}><span class="lg-av">${P.ic}</span><b>${P.t}<small>${esc(P.d)}</small></b><em>${P.price} M€</em></button>`).join("")}
      <p class="bid-note">Tes parades : ${me.par.length ? me.par.map(k => MC_PAR[k].ic+" "+MC_PAR[k].t).join(" · ") : "aucune"}</p>`; }
  if(s.t==="bid"){ const c = M.market.find(x => x.uid===s.u), b = M.sel[s.u] ?? c.price, used = Object.entries(M.sel).filter(([u]) => u!==s.u).reduce((a,[,v]) => a+v, 0);
    const weak = !mcFree(me, c) ? me.team.filter(o => mcSlot(o)===mcSlot(c)).sort((a,b) => mcOvr(a)-mcOvr(b))[0] : null;
    body = `<div class="bid-head">${cardHTML(c.id,{small:true})}<div><b>${esc(c.n)}</b><small>${mcPoFr(c)}${c.from?` · chez ${esc(c.from.n)}`:" · libre"}</small><span class="bid-pp">💪 ${mcOvr(c)}<small> · ${c.age} ans</small></span>
      <small>${mcPlayerLine(c)}${c.fav?" · ❤️ dans ta collection : −15 %":""}</small>${c.age<=21 && !c.scouted?`<button class="mini-btn" data-act="mcscoutp" data-v="${c.uid}">🔎 Rapport du recruteur · 2 M€</button>`:""}
      ${c.trait?`<span class="trait-l">${MC_TRAITS[c.trait].ic} <b>${MC_TRAITS[c.trait].t}</b> · ${MC_TRAITS[c.trait].d}</span>`:""}
      <small>${(() => { const w = mcWhere(me, c); return w.gain > 0 ? `🔄 Titulaire en ${w.sl}${w.rep?` à la place de ${esc(cardName(w.rep.n))} (${mcEff(w.rep, w.sl)} → ${mcEff(c, w.sl)})`:""}` : "🪑 Irait sur le banc"; })()}${mcFree(me, c) ? "" : " · effectif plein (16) : ton moins bon remplaçant sera vendu"}</small></div></div>
      <div class="bid-dial"><button data-act="mcbid" data-v="-5">−5</button><button data-act="mcbid" data-v="-1">−</button><b>${b}<small> M€</small></b><button data-act="mcbid" data-v="1">+</button><button data-act="mcbid" data-v="5">+5</button></div>
      <p class="bid-note">Prix de base ${c.price} M€${c.sale?" (soldé !)":""} · salaire ${mcWage(c)} M€/période · il te reste ${me.money - used} M€</p>
      <button class="btn" data-act="mcseal" data-v="${s.u}">✉️ Glisser mon offre (${b} M€)</button>
      ${!s.isNew?`<button class="btn ghost" data-act="mcunbid" data-v="${s.u}">Retirer l'offre</button>`:""}`; }
  if(s.t==="team"){ const sc = mcRating(me), sys = mcSys(me), slot = s.slot;
    const occ = slot!=null ? me.team.find(c => c.sl===slot) : null;
    const cands = slot!=null ? mcRoster(me).filter(c => c!==occ).sort((a,b) => mcEff(b, sys.s[slot]) - mcEff(a, sys.s[slot])) : [];
    body = `<h3>${esc(me.n)} · note ${sc.total}</h3>
      <div class="chips sys">${Object.entries(MC_SYS).map(([k, S]) => `<button class="${me.sys===k?"on":""}" data-act="mcsys" data-v="${k}">${k}${S.st?` ${MC_STYLE[S.st].ic}`:""}</button>`).join("")}</div>
      <p class="bid-note">${esc(sys.d)}${sys.st?` · bat le ${MC_STYLE[MC_STYLE[sys.st].beats].t.toLowerCase()} (+3)`:""}</p>
      <div class="blocks"><span>🧱 Défense <b>${sc.D}</b></span><span>🎯 Milieu <b>${sc.M}</b></span><span>⚽ Attaque <b>${sc.A}</b></span></div>
      ${mcPitch(me, "mcslot", slot)}
      ${slot!=null ? `<p class="dash-t">Case ${sys.s[slot]} · ${MC_PO_FR[sys.s[slot]]}${occ?` · ${esc(cardName(occ.n))} (${mcEff(occ, sys.s[slot])})`:""}</p>
        <div class="pl-list">${cands.map(c => { const e = mcEff(c, sys.s[slot]), f = mcFit(c, sys.s[slot]);
          return `<button class="cand" data-act="mcput" data-v="${c.uid}"><b>${esc(cardName(c.n))}</b><small>${c.po}${(c.ps||[]).length?"/"+c.ps.join("/"):""} · ${c.sl!=null?`titulaire en ${sys.s[c.sl]}`:"banc"}${c.inj>0?" · 🚑":""}</small><em class="${f>=0.95?"ok":f>=0.85?"mid":"ko"}">${e}</em></button>`; }).join("")}</div>`
        : `<p class="bid-note">Touche une case pour choisir qui y joue. Au bon poste : 100 % de la note · poste secondaire 95 % · même ligne 85 % · hors poste 50 à 70 %.</p>`}
      <div class="lines">${sc.lines.filter(x => x.v).map((x,k) => `<span class="${x.v<0?"neg":k?"bonus":""}">${esc(x.t)} ${k&&x.v>0?"+":""}${x.v}</span>`).join("")}</div>
      <div class="dock-row"><button class="btn ghost" data-act="mcauto">⚙️ Compo auto</button><button class="btn ghost" data-act="mctab" data-v="club">👥 Mon effectif</button></div>`; }
  if(s.t==="secret"){ const k = me.secret; body = `<div class="secret-big">${MC_SECRETS[k].ic}<b>${MC_SECRETS[k].t}</b><small>${MC_SECRETS[k].d}</small><span>+${MC.secretPts} pts à la fin · ${MC_SECRETS[k].ok(me)?"✅ rempli pour l'instant":"pas encore"}</span></div>
      <p class="bid-note">🎯 Objectif de la direction : top ${me.goal}. Chaque place au-dessus rapporte 3 pts de progression, chaque place en dessous en coûte 3.</p>
      ${me.power?`<p class="bid-note">Ton pouvoir : ${MC_POWERS[me.power].ic} <b>${MC_POWERS[me.power].t}</b> — ${MC_POWERS[me.power].d}</p>`:""}`; }
  if(s.t==="peek" || s.t==="club"){ const p = s.t==="peek" ? M.players[s.i] : mcClub(s.club), ci = M.clubs.indexOf(p), can = M.phase==="coups" && !M.inbox.length;
    body = `<h3>${p.ic} ${esc(p.cpu ? p.n : `${p.club} · ${p.n}`)} · note ${mcRating(p).total}</h3><p class="bid-note">${mcPos(p)}ᵉ · ${p.pts} pts · ${p.w}V ${p.d}N ${p.l}D${p.cpu?"":` · 💰 ${p.money} M€ · ${p.hand.length} carte${p.hand.length>1?"s":""} cachée${p.hand.length>1?"s":""}`}${p.grudge===me?" · 😠 il t'en veut":""}${mcAllied(p, me)?" · 🤫 ton allié secret":""}</p>
      ${p.cpu ? "" : (() => { const rel = M.players.filter(q => q!==p).flatMap(q => [mcBond(p, q, true) >= 2 ? `🤝 vieux complice de ${q===me?"toi":mcShort(q)} (${mcBond(p, q, true)} pactes)` : "", mcFeud(p, q) >= 2 ? `⚔️ ennemi juré de ${q===me?"toi":mcShort(q)} (${mcFeud(p, q)} coups bas)` : ""]).filter(Boolean); return rel.length ? `<p class="rel">${rel.map(esc).join("<br>")}</p>` : ""; })()}
      ${p.cpu ? "" : `<p class="bid-note">${MC_PROFILES[p.profile]?.ic||""} ${esc(MC_PROFILES[p.profile]?.t||"")} · ${p.sys} · ${mcSpying(me, p) ? `🕵️ ta taupe : soupçons ${p.sus||0}% · parades ${(p.par||[]).map(k => MC_PAR[k].ic).join(" ")||"aucune"} · magouilles : ${mcActive(p).map(x => MC_AF[x.k].ic+" "+MC_AF[x.k].t).join(", ")||"rien"}` : (p.sus||0) >= 40 ? "🗞️ des rumeurs circulent sur lui" : ""}</p>`}
      <div class="pl-list">${mcRoster(p).sort((a,b) => mcOvr(b)-mcOvr(a)).map(c => mcRow(c, p)).join("")}</div>
      ${can ? `<p class="bid-note">💼 « Offre » pour lui acheter un joueur${p.cpu?"":", ou :"}</p>${p.cpu?"":`<button class="btn ghost" data-act="mcdealsellpick" data-v="${ci}">Lui vendre un de mes joueurs</button>`}${mcAllied(p, me)?`<p class="hint-ally">💡 Ton allié secret : surpaye un de ses joueurs (20 M€ au-dessus de la cote) et il utilisera l'argent pour attaquer le leader.</p>`:""}` : M.phase==="coups" ? `<p class="bid-note">Réponds d'abord aux appels reçus.</p>` : `<p class="bid-note">Les transferts se font pendant le 💼 Bureau.</p>`}`;
    M.sheet.club = ci; }
  if(s.t==="scout"){ const pos = M.sf || "all", sort = M.ss || "ovr";
    const all = M.clubs.filter(k => k!==me).flatMap(k => mcRoster(k).map(c => ({c, k}))).filter(x => pos==="all" || (pos==="G" ? x.c.pos==="G" : x.c.pos===pos))
      .sort((a,b) => sort==="val" ? a.c.val-b.c.val : sort==="age" ? a.c.age-b.c.age : sort==="pot" ? (b.c.age<=21)-(a.c.age<=21) || b.c.pot-a.c.pot : mcOvr(b.c)-mcOvr(a.c)).slice(0, 40);
    body = `<h3>🔎 Recruter</h3>
      <div class="seg2">${[["joueurs","Joueurs"],["clubs","Clubs"]].map(([k,t]) => `<button class="${(M.st||"joueurs")===k?"on":""}" data-act="mcscouttab" data-v="${k}">${t}</button>`).join("")}</div>
      ${(M.st||"joueurs")==="clubs" ? mcLeagueHTML(true, "mcclubpeek") : `
      <div class="chips">${[["all","Tous"],["G","Gardiens"],["DEF","Déf."],["MIL","Milieux"],["ATT","Attaq."]].map(([k,t]) => `<button class="${pos===k?"on":""}" data-act="mcsf" data-v="${k}">${t}</button>`).join("")}</div>
      <div class="chips">${[["ovr","Meilleure note"],["val","Moins cher"],["age","Plus jeune"],["pot","Potentiel"]].map(([k,t]) => `<button class="${sort===k?"on":""}" data-act="mcss" data-v="${k}">${t}</button>`).join("")}</div>
      <div class="pl-list">${all.map(x => mcRow(x.c, x.k)).join("")}</div>
      <p class="bid-note">💰 tu as ${me.money} M€ · 🔎 2 = rapport du recruteur sur un jeune (2 M€) : potentiel exact.</p>`}`; }
  if(s.t==="dash"){ const H = M.hist || [], val = mcRoster(me).reduce((t,c) => t+c.val, 0), g = mcProg(me), pos = mcPos(me);
    const pres = [...M.players].map(p => ({p, t:mcProg(p).tot})).sort((a,b) => b.t-a.t), rk = pres.findIndex(x => x.p===me) + 1, mx = Math.max(10, ...pres.map(x => Math.abs(x.t)));
    const spark = (key, inv, fmt) => { const vs = [...H.map(x => x[key] ?? 0)]; if(vs.length < 2) return `<p class="bid-note">La courbe apparaît après 2 périodes.</p>`;
      const mn = Math.min(...vs), mx2 = Math.max(...vs), W = 260, Hh = 50, sx = i => 8 + i*(W-16)/(vs.length-1), sy = v => mx2===mn ? Hh/2 : (inv ? 6 + (v-mn)/(mx2-mn)*(Hh-12) : Hh-6 - (v-mn)/(mx2-mn)*(Hh-12));
      return `<svg class="spark" viewBox="0 0 ${W} ${Hh}" preserveAspectRatio="none"><polyline points="${vs.map((v,i) => `${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(" ")}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>${vs.map((v,i) => `<circle cx="${sx(i).toFixed(1)}" cy="${sy(v).toFixed(1)}" r="${i===vs.length-1?4:2.5}" fill="currentColor"/>`).join("")}</svg><div class="spark-l">${H.map(x => `<span>P${x.p}<b>${fmt(x[key] ?? 0)}</b></span>`).join("")}</div>`; };
    const last = H.at(-1), net = me.income!=null ? me.income - (me.wages||0) - (me.tax||0) - (me.int||0) : null;
    const used = Object.keys(MC_AF).filter(k => !MC_AF[k].hidden && (me.once||{})[k]===(M.season||1));
    body = `<h3>📊 Tableau de bord · saison ${M.season}</h3>
      <div class="db-hero"><div><small>Points de progression</small><b>${g.tot}</b><em>${rk===1?"🥇 tu mènes":`${rk}ᵉ des présidents`}</em></div>
        <div class="db-chips"><span>💰 fortune ${g.fort>=0?"+":""}${g.fort}</span><span>🏆 classement ${g.rank>=0?"+":""}${g.rank}</span>${g.cas?`<span class="neg">🚨 casseroles ${g.cas}</span>`:""}${g.bon?`<span>🏦 +${g.bon}</span>`:""}</div></div>
      <div class="db-bars">${pres.map(x => `<p class="${x.p===me?"me":""}"><span>${x.p.ic} ${esc(x.p===me?"Toi":mcShort(x.p))}</span><i><b class="${x.t<0?"neg":""}" style="width:${Math.round(Math.abs(x.t)/mx*100)}%"></b></i><em>${x.t}</em></p>`).join("")}</div>
      <div class="kpis db-k">
        <div><small>Classement</small><b class="${pos<=me.goal?"pos":"neg"}">${pos}ᵉ</b><i>objectif top ${me.goal}</i></div>
        <div><small>Trésorerie</small><b>${me.money} M€</b>${me.loan?`<i>dont ${me.loan} à rembourser</i>`:me.debt?`<i>dettes ${me.debt} M€</i>`:""}</div>
        <div><small>Soupçons</small><b class="${(me.sus||0)>=60?"neg":""}">${me.sus||0} %</b><i>risque d'enquête ${Math.round((me.sus||0)*0.35)} %</i></div>
        <div><small>Valeur de l'effectif</small><b>${val} M€</b><i>${mcRoster(me).length} joueurs</i></div></div>
      ${net!=null ? `<p class="dash-t">Dernière période</p><div class="db-flow"><span class="pos">Recettes +${me.income}</span><span class="neg">Salaires −${me.wages||0}</span>${me.tax?`<span class="neg">Taxe −${me.tax}</span>`:""}${me.int?`<span class="neg">Intérêts −${me.int}</span>`:""}<b class="${net>=0?"pos":"neg"}">= ${net>=0?"+":""}${net} M€</b></div>` : ""}
      <p class="dash-t">Affaires utilisées cette saison <small>(une seule fois chacune)</small></p><p class="bid-note">${used.length ? used.map(k => `${MC_AF[k].ic} ${MC_AF[k].t}`).join(" · ") : "Aucune pour l'instant."}</p>
      <p class="dash-t">Points de progression</p>${spark("prog", false, v => v)}
      <p class="dash-t">Classement</p>${spark("pos", true, v => v+"ᵉ")}
      <p class="dash-t">Trésorerie</p>${spark("money", false, v => v)}
      ${M.cup ? `<p class="bid-note">🏆 Coupe : ${M.cup.alive.includes(0) ? (M.cup.winner===0 ? "vainqueur !" : `encore en course (${M.cup.alive.length} clubs)`) : "éliminé"}</p>` : ""}
      <button class="btn ghost" data-act="mctlog">📜 Tous les transferts de la saison</button>`; }
  if(s.t==="sellpick"){ const p = mcClub(s.club);
    body = `<h3>Vendre à ${p.ic} ${esc(p.n)}</h3><p class="bid-note">Quel joueur lui proposes-tu ?</p><div class="pl-list">${mcRoster(me).sort((a,b) => b.val-a.val).map(c => `<button class="cand" data-act="mcdealsell" data-v="${c.uid}"><b>${esc(cardName(c.n))}</b><small>${c.po} · 💪 ${mcOvr(c)}</small><em>${c.val} M€</em></button>`).join("")}</div>`; }
  if(s.t==="deal"){ const p = mcClub(s.club), c = mcRoster(s.mode==="buy" ? p : me).find(x => x.uid===s.u);
    body = `<h3>${s.mode==="buy" ? `Acheter à ${p.ic} ${esc(p.cpu ? p.n : mcShort(p))}` : `Vendre à ${p.ic} ${esc(mcShort(p))}`}</h3>
      <div class="bid-head">${cardHTML(c.id,{small:true})}<div><b>${esc(c.n)}</b><small>${mcPlayerLine(c)}${c.trait?` · ${MC_TRAITS[c.trait].ic} ${MC_TRAITS[c.trait].t}`:""}</small>${mcMood(mcDealMood())}</div></div>
      <div class="bid-dial"><button data-act="mcdealamt" data-v="-5">−5</button><button data-act="mcdealamt" data-v="-1">−</button><b>${s.amt}<small> M€</small></b><button data-act="mcdealamt" data-v="1">+</button><button data-act="mcdealamt" data-v="5">+5</button></div>
      <p class="bid-note">${M.deals}/${MC.deals} propositions cette période · 💰 tu as ${me.money} M€</p>
      <button class="btn" data-act="mcdealsend">💼 Envoyer la proposition</button>`; }
  if(s.t==="event") body = `<h3>Championnat · ${M.round}/38 journées</h3>${mcLeagueHTML(true, M.phase==="coups" && !M.inbox.length ? "mcclubpeek" : "")}<p class="bid-note">${M.phase==="coups"?"💼 Touche un club pour voir son effectif et lui faire une offre.<br>":""}🏆 Champion · 🔵 Top 4 · 🔻 Relégation. Fin de saison : points + objectif secret (+${MC.secretPts}) + objectif de la direction (+${MC.boardPts}).</p>`;
  if(s.t==="player"){ const c = [...M.clubs.flatMap(mcRoster), ...M.market].find(x => x.uid===s.u);
    if(!c){ M.sheet = null; return ""; }
    const k = mcOwner(c), mine = k===me, oh = [...(c.oh||[]), c.ovr].slice(-12), vh = [...(c.vh||[]), c.val].slice(-12);
    const sp = (vs, cls) => { if(vs.length < 2) return `<p class="bid-note">L'historique apparaît après une période.</p>`; const mn = Math.min(...vs), mx = Math.max(...vs), W = 260, H = 44, x = i => 6 + i*(W-12)/(vs.length-1), y = v => mx===mn ? H/2 : H-5 - (v-mn)/(mx-mn)*(H-10);
      return `<svg class="spark ${cls}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><polyline points="${vs.map((v,i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>${vs.map((v,i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="${i===vs.length-1?4:2.3}" fill="currentColor"/>`).join("")}</svg><div class="spark-l">${vs.map(v => `<span><b>${v}</b></span>`).join("")}</div>`; };
    const st = [c.inj>0 ? `🚑 blessé ${plural(c.inj, "période")}` : "", M.susp.has(c.uid) ? "📸 suspendu" : "", mcSulk(c) && k && k.bench.includes(c) ? "😒 boude" : "", c.ct===1 ? "📝 dernière année de contrat" : `📝 contrat : ${plural(c.ct||1, "saison")}`].filter(Boolean);
    body = `${s.back?`<button class="linkbtn sheet-back" data-act="mcback">← Retour</button>`:""}
      <div class="pf-head">${cardHTML(c.id)}<div><b>${esc(c.n)}</b><small>${mcPoFr(c)} · ${c.age} ans${k?` · ${mcBadge(k, 12)} ${esc(mcCN(k))}`:" · sur le marché"}</small>
        <div class="kpis pf-k"><div><small>Note</small><b>${mcOvr(c)}</b></div><div><small>Cote</small><b>${c.val} M€</b></div><div><small>Salaire</small><b>${mcWage(c)}<i>/pér.</i></b></div><div><small>Buts</small><b>${c.gs||0}<i> cette saison · ${c.gt||0} en tout</i></b></div></div></div></div>
      ${c.trait?`<p class="trait-l">${MC_TRAITS[c.trait].ic} <b>${MC_TRAITS[c.trait].t}</b> · ${MC_TRAITS[c.trait].d}</p>`:""}
      <p class="bid-note">${st.join(" · ")}${c.age<=21 ? ` · potentiel ${c.scouted || me.power==="chasseur" ? c.pot : mcPotTxt(c).replace("pot. ","")}` : ""}${c.paid!=null && mine ? ` · acheté ${c.paid} M€ (${c.val-c.paid>=0?"+":""}${c.val-c.paid})` : ""}</p>
      <p class="dash-t">Note</p>${sp(oh, "")}<p class="dash-t">Cote (M€)</p>${sp(vh, "alt")}
      <p class="dash-t">Transferts</p>${(c.th||[]).length ? `<div class="tlog">${[...c.th].reverse().map(e => `<p><span>S${e.s}·P${e.p}</span><b>${esc(e.f)} → ${esc(e.t)}</b><em>${e.k==="free"?"libre":e.a+" M€"}</em></p>`).join("")}</div>` : `<p class="bid-note">Aucun transfert depuis le début de la partie.</p>`}
      ${mine ? `<div class="dock-row"><button class="btn" data-act="mcsellask" data-v="${c.uid}">💰 Vendre</button>${c.inj>0?`<button class="btn ghost" data-act="mcheal" data-v="${c.uid}">🚑 ${mcHeal(c)} M€</button>`:""}${(M.len||1)>1?`<button class="btn ghost" data-act="mcrenew" data-v="${c.uid}">✍️ +2 saisons · ${mcRenew(c)} M€</button>`:""}</div>`
        : k && M.phase==="coups" && !M.inbox.length && c.trait!=="fidele" ? `<button class="btn" data-act="mcdealfrom" data-v="${M.clubs.indexOf(k)}|${c.uid}">💼 Faire une offre</button>` : ""}`; }
  if(s.t==="sellask"){ const c = mcRoster(me).find(x => x.uid===s.u); if(!c){ M.sheet = null; return ""; }
    body = `<h3>Vendre ${esc(cardName(c.n))} ?</h3><div class="bid-head">${cardHTML(c.id,{small:true})}<div><b>${esc(c.n)}</b><small>${mcPlayerLine(c)}${c.inj>0?` · 🚑 blessé ${plural(c.inj,"période")}`:""}${c.paid!=null?` · acheté ${c.paid} M€`:""}</small></div></div>
      <button class="btn" data-act="mcsell" data-v="${c.uid}">🏦 Tout de suite à la banque : ${mcBank(me, c)} M€</button>
      <button class="btn ghost" data-act="mclist" data-v="${c.uid}">${c.listed ? "Retirer de la liste des transferts" : `📢 Liste des transferts : un club appellera (≈ ${mcListPrice(c)} M€)`}</button>
      <p class="bid-note">${c.inj>0 ? "Blessé, il intéresse moins les clubs. " : ""}La liste des transferts rapporte souvent plus que la banque, mais l'offre n'arrive qu'au prochain 💼 Bureau${M.phase==="coups"?" (la période suivante)":""}.</p>`; }
  if(s.t==="tlog"){ const list = [...(M.tlog||[])].filter(e => e.s===(M.season||1)).reverse();
    body = `${s.back?`<button class="linkbtn sheet-back" data-act="mcback">← Retour</button>`:""}<h3>📜 Transferts · saison ${M.season||1}</h3>
      ${list.length ? `<div class="tlog">${list.map(e => `<p class="${e.f===me.n||e.t===me.n?"me":""}"><span>P${e.p}</span><b>${esc(cardName(e.n))}<small>${esc(e.f)} → ${esc(e.t)}</small></b><em>${e.k==="free"?"libre":e.a+" M€"}</em></p>`).join("")}</div>` : `<p class="bid-note">Aucun transfert pour l'instant.</p>`}`; }
  if(s.t==="log") body = `<h3>Pendant ce temps…</h3><div class="log-list">${M.show.map(a => { const C = mcCardOf(a.st); return `<p class="log-l res-${a.res}"><span>${a.by.ic} ${C.ic}${a.to?` → ${a.to.ic}`:""}</span><span>${esc(a.out)}</span></p>`; }).join("")}</div>`;
  if(s.t==="rules") body = `<h3>Le but en 30 secondes</h3>
      <div class="rule-goal"><p>🏆 Le meilleur président n'est pas forcément le champion : c'est celui qui <b>fait le plus progresser son club</b>.</p>
      <p>💰 Argent gagné (caisse + valeur de l'effectif) × coefficient du club · 📈 +3 pts par place au-dessus de ton objectif, −3 en dessous · 🚨 les sanctions retirent des points.</p></div>
      <h3>Une période en 5 étapes</h3><ol class="rule-steps"><li><b>Infos</b> : la news du jour et le point de la direction.</li><li><b>Mercato</b> : enchères à l'aveugle sur le marché.</li><li><b>Bureau</b> : 2 affaires max, négociations avec les présidents.</li><li><b>Conférence de presse</b> : un bonus ou un malus.</li><li><b>Matchs</b> : 6 ou 7 journées, dont un gros match en direct.</li></ol>
      <button class="btn ghost" data-act="mctipsreset">💡 Revoir les conseils à chaque écran</button>
      <h3>Comment on joue</h3>${mcTutoSlides().map(x => `<p class="rule-l"><span>${x[0]}</span><span><b>${x[1]}</b><small>${x[2]}</small></span></p>`).join("")}
      <h3>Les affaires</h3>${Object.values(MC_AF).filter(x => !x.hidden).map(x => `<p class="rule-l"><span>${x.ic}</span><span><b>${x.t}${x.sus?` · 🕵️ +${x.sus}`:""}</b><small>${esc(x.d)}</small></span></p>`).join("")}
      <h3>Les parades</h3>${Object.values(MC_PAR).map(x => `<p class="rule-l"><span>${x.ic}</span><span><b>${x.t} · ${x.price} M€</b><small>${esc(x.d)}</small></span></p>`).join("")}
      <h3>Soupçons et enquêtes</h3><p class="bid-note">À chaque fin de période, la Ligue enquête au hasard : risque = soupçons × 0,35. Sanction selon la gravité : amende de 10 à 30 M€, points retirés au classement, interdiction de recruter, et une casserole qui coûte des points de progression. Une période sans magouille fait baisser les soupçons de 10.</p>
      <h3>Traits des joueurs</h3>${Object.values(MC_TRAITS).map(x => `<p class="rule-l"><span>${x.ic}</span><span><b>${x.t}</b><small>${x.d}</small></span></p>`).join("")}`;
  const an = M.fx==="sheet" ? " anim" : "";
  return `<div class="sheet-bg${an}" data-act="mcclose"></div><div class="sheet${an}">${body}</div>`;
}
function mcTutoSlides(){ return [
  ["🏟️","Un championnat à 20","Toi, 3 présidents rivaux et 16 clubs. 38 journées découpées en 6 périodes."],
  ["📈","Gagner = progresser","Le meilleur président n'est pas le champion : c'est celui qui fait le plus progresser son club (argent, classement), coefficient du club compris."],
  ["📋","Ton onze","11 titulaires, 5 systèmes de jeu, des postes précis. Pressing bat possession, possession bat contre-attaque, contre-attaque bat pressing."],
  ["🤫","Les magouilles","Paris truqués, comptes maquillés, chantage… 2 affaires par période, chacune une seule fois par saison. Ça rapporte vite, mais chaque coup fait monter tes soupçons. Gare aux enquêtes de la Ligue."],
  ["🛡️","Les parades","Avocat, contre-espionnage, appel à la Ligue : quand on t'attaque, riposte, et l'attaquant perd sa mise."],
  ["🔎","Espionner en secret","Taupe ou détective : ta cible ne le saura jamais. Envoie un détective. S'il triche, dénonce-le à la Ligue et touche une prime. S'il est clean… ça te coûtera cher."]]; }

function screenMercatoPick(){
  const b = PROFILE.best, day = b.mercatoDay && b.mercatoDay.day===todayKey() ? b.mercatoDay : null;
  return {key:"mercatoPick", html:`
  <div class="subhead"><button class="iconbtn" data-act="nav" data-v="home" aria-label="Retour">${ICON.back}</button><h1>Mercato FC</h1></div>
  <div class="mc-hero"><div class="mc-hero-row"><span class="mc-hero-av" style="--pc:#ff4d6d">🦈</span><span class="mc-hero-av" style="--pc:#3ed38f">🧮</span><span class="mc-hero-av" style="--pc:#a98bff">🎓</span><span class="mc-hero-av" style="--pc:#ff9f3a">🔍</span></div>
   <p class="mc-hero-t">Mercato FC</p><p>Une saison, 20 clubs, 3 présidents rivaux.<br>Achète, revends, trahis… et finis devant eux.</p></div>
  ${(() => { const sv = mcSaved(); if(!sv) return ""; const c = sv.clubs[0]; return `<button class="mc-daily mc-resume" data-act="mcresume"><span>${c.ic}</span><span><b>Reprendre ma carrière</b><small>${esc(c.n)} · saison ${sv.season + (sv.seasonDone?1:0)}${(sv.len||1)<99?`/${sv.len||1}`:""}${sv.seasonDone?"":` · période ${sv.period}`} · ${MC_DIFF[sv.diff].t}</small></span><em>▶</em></button>`; })()}
  <button class="mc-daily" data-act="mcstart" data-v="normal" data-d="1"><span>🎯</span><span><b>Partie du jour</b><small>Même tirage pour tout le monde · niveau Moyen</small></span><em>${day?`${day.pts} pts`:"Jouer"}</em></button>
  <details class="dcard"><summary>🏆 Classement de la partie du jour</summary>${mcBoardHTML()}</details>
  <details class="dcard"><summary>🏅 Succès ${Object.keys(MC_ACH).filter(mcHas).length}/${Object.keys(MC_ACH).length} · nouveaux clubs et pouvoirs</summary><div class="ach-list">${Object.entries(MC_ACH).map(([k,a]) => `<p class="${mcHas(k)?"ok":""}"><span>${mcHas(k)?a.ic:"🔒"}</span><b>${a.t}<small>${a.d}</small></b><em>${mcHas(k)?"✓ ":""}${esc(a.u)}</em></p>`).join("")}</div></details>
  <div class="pick-list">${Object.entries(MC_DIFF).map(([k,d]) => `<button class="mode diff-${k}" data-act="mcstart" data-v="${k}"><span class="lgtag">${d.t}</span><b>${d.b}</b><small>${d.d}</small>${b["mercato_"+k]?`<span class="rec">🏆 ${b["mercato_"+k]}</span>`:""}</button>`).join("")}</div>
  ${tabbar()}`};
}
function screenMercato(){
  if(!M){ VIEW = "mercatoPick"; return screenMercatoPick(); }
  const key = "mc-"+M.v;
  if(M.phase==="tuto"){ const sl = mcTutoSlides(), x = sl[M.tuto];
    return {key:"mct-"+M.v, html:`<div class="tuto">
      <button class="linkbtn tuto-skip" data-act="mctutoskip">Passer</button>
      <div class="tuto-ic">${x[0]}</div><h1 class="display">${x[1]}</h1><p>${x[2]}</p>
      <div class="tuto-dots">${sl.map((_,k) => `<i class="${k===M.tuto?"on":""}"></i>`).join("")}</div></div>
      ${dock(`<button class="btn" data-act="mctuto">${M.tuto<sl.length-1?"Suivant":"C'est parti"}</button>`)}`}; }
  if(M.phase==="club") return {key:"mcc-"+M.v, html:`<div class="tuto">
      <span class="eyebrow">1/3 · Ton club</span><h1 class="display">Choisis ton club</h1><p class="mct-hint">Le vainqueur : celui qui fait le plus progresser son club. Plus le club est petit, plus son coefficient est fort.</p>
      <div class="fmt">${[[1,"⚡","1 saison"],[3,"📅","3 saisons"],[99,"♾️","Carrière"]].map(([n,ic,t]) => `<button class="${(M.len||1)===n?"on":""}" data-act="mcfmt" data-v="${n}">${ic} ${t}</button>`).join("")}</div>
      <p class="mct-hint">${(M.len||1)===1?"Une saison, environ 15 minutes.":(M.len===3?"3 saisons : le meilleur président au cumul des points.":"Sans fin : enchaîne les saisons tant que tu veux.")}</p>
      <div class="power-pick">${Object.entries(MC_PROFILES).map(([k,P],i) => mcOpen(P) ? `<button class="power-c club-c" data-act="mcclub" data-v="${k}" style="animation-delay:${i*0.15}s"><span>${P.ic}</span><span><b>${P.n}</b><small>${P.t} · ${P.d}</small><em>💰 ${P.money} M€${P.debt?` (−${P.debt} de dettes)`:""} · 🎯 top ${P.goal} · ${P.sys} ${MC_STYLE[MC_SYS[P.sys].st]?.ic||""} · coef. ×${P.coef}</em></span></button>`
        : `<div class="power-c club-c locked" style="animation-delay:${i*0.15}s"><span>🔒</span><span><b>${P.n}</b><small>Succès à débloquer : ${MC_ACH[P.lock].ic} ${MC_ACH[P.lock].t} · ${MC_ACH[P.lock].d}</small></span></div>`).join("")}</div></div>`};
  const me = mcMe();
  if(M.phase==="secret") return {key:"mcs-"+M.v, html:`<div class="tuto">
      <span class="eyebrow">${M.season>1?`Saison ${M.season} · ${esc(me.n)}`:"2/3 · Ton objectif secret"}</span><h1 class="display">${M.season>1?"Nouvel objectif secret":"Choisis une carte"}</h1>
      ${M.season>1 && M.seasonNotes ? `<div class="snotes">${M.seasonNotes.map(x => `<p>${esc(x)}</p>`).join("")}<p>🎯 Objectif de la direction : top ${me.goal}</p></div>` : ""}<p>Personne ne la verra. +${MC.secretPts} pts si tu la remplis.</p>
      <div class="secret-pick">${M.secretChoice.map((k,i) => `<button class="secret-c" data-act="mcsecret" data-v="${k}" style="animation-delay:${i*0.2}s"><span>${MC_SECRETS[k].ic}</span><b>${MC_SECRETS[k].t}</b><small>${MC_SECRETS[k].d}</small></button>`).join("")}</div></div>`};
  if(M.phase==="power") return {key:"mcp-"+M.v, html:`<div class="tuto">
      <span class="eyebrow">3/3 · Quel président es-tu ?</span><h1 class="display">Ton pouvoir</h1>
      <div class="power-pick">${M.powerChoice.map((k,i) => `<button class="power-c" data-act="mcpower" data-v="${k}" style="animation-delay:${i*0.15}s"><span>${MC_POWERS[k].ic}</span><span><b>${MC_POWERS[k].t}</b><small>${MC_POWERS[k].d}</small></span></button>`).join("")}</div></div>`};

  if(M.phase==="news"){ const n = M.news, N = n && MC_NEWS[n.key];
    const card = M.drawn.length ? `<p class="mct-hint">🃏 Tu pioches</p><div class="drawn">${M.drawn.map((st,i) => mcHandCard(st, i, {flip:M.fx==="draw"})).join("")}</div>` : "";
    const head = M.period===1 ? `<div class="news calm"><span class="news-tag">COUP D'ENVOI</span><b>${me.ic} ${esc(me.n)}</b><p>💰 ${me.money} M€ en caisse · note ${mcRating(me).total} · objectif top ${me.goal}.<br>Le mercato d'été ouvre !</p></div>`
      : !n ? `<div class="news calm"><span class="news-tag">${MC_PERIODS[M.period-1].toUpperCase()}</span><b>Calme plat</b><p>Aucune info croustillante cette fois.</p></div>`
      : `<div class="news${M.fx==="draw"?" in":""}"><span class="news-tag">⚡ BREAKING NEWS</span><span class="news-ic">${N.ic}</span><b>${N.t}</b><p>${esc(N.d(n))}</p>${n.done && n.out?`<p class="news-out">→ ${esc(n.out)}</p>`:""}</div>`;
    const choose = n && !n.done && !N.auto;
    const alerts = [];
    const pos = mcPos(me); if(M.period>1) alerts.push(pos <= me.goal ? `✅ ${pos}ᵉ : objectif top ${me.goal} tenu` : `⚠️ ${pos}ᵉ : la direction attend le top ${me.goal}`);
    if(MC_CUP[M.period] && M.cup && M.cup.alive.includes(0)) alerts.push(`🏆 Coupe : ${MC_CUP[M.period]} cette période`);
    if(me.money < 10) alerts.push(`💸 Caisse presque vide (${me.money} M€) : pense à vendre`);
    const last = (M.hist||[]).at(-1); if(last && last.wages > last.income) alerts.push(`📉 Salaires (${last.wages}) > recettes (${last.income})`);
    mcRoster(me).filter(c => c.age >= 33).slice(0, 1).forEach(c => alerts.push(`👴 ${cardName(c.n)} (${c.age} ans) décline : vends-le tant qu'il vaut ${c.val} M€`));
    M.players.filter(p => p.bot && p.grudge===me).slice(0, 1).forEach(p => alerts.push(`😠 ${p.n} t'en veut`));
    if(mcWages(me) > MC.wageCap) alerts.push(`🧾 Fair-play financier : salaires ${mcWages(me)} M€ > plafond ${MC.wageCap} : l'excédent est taxé`);
    const stk = mcStreak(me); if(stk) alerts.push(stk.v>0 ? `🔥 3 victoires de suite : +${stk.v} de note tant que ça dure` : "🥶 3 défaites de suite : −2 de note, il faut réagir");
    me.bench.filter(mcSulk).slice(0, 1).forEach(c => me.power!=="motivateur" && alerts.push(`😒 ${cardName(c.n)} boude sur le banc (−1) : fais-le jouer ou vends-le`));
    if((M.len||1) > 1 && M.period >= MC.flashPeriod) mcRoster(me).filter(c => c.ct===1).slice(0, 1).forEach(c => alerts.push(`📝 Contrat de ${cardName(c.n)} : fin de saison. Prolonge-le (${mcRenew(c)} M€) ou il part libre`));
    if((me.sus||0) >= 35) alerts.unshift(`🕵️ Soupçons ${me.sus} % : à chaque fin de période, ${Math.round(me.sus*0.35)} % de risque d'enquête. Un gala de charité calmerait les choses`);
    if(me.ban===M.period) alerts.unshift("🚫 Sanction de la Ligue : interdit de recruter cette période");
    M.players.filter(p => p.bot && (p.sus||0) >= 35).slice(0, 2).forEach(p => { const a = (p.recent||[]).filter(x => MC_AF[x.k] && MC_AF[x.k].sus).at(-1);
      alerts.push(`🗞️ Rumeur : ${({pari:"on a vu", arrange:"un match bizarre pour", comptes:"la DNCG pose des questions à", retro:"un agent très proche de", sponsor:"un sponsor inconnu chez", miroir:"des transferts étranges chez", chantage:"des photos circulent autour de", fuite:"des fuites partent de chez", taupe:"une taupe pour le compte de", pelouse:"un jardinier payé par"})[a?.k] || "des bruits de couloir autour de"} ${p.n}${a?.k==="pari"?" avec des parieurs":""}`); });
    if(M.youth && M.youth.length) alerts.unshift(`🌱 Effectif trop court : ${M.youth.map(c => cardName(c.n)).join(", ")} ${M.youth.length>1?"montent":"monte"} du centre de formation`);
    const hurt = mcRoster(me).filter(c => c.inj > 0);
    const memo = alerts.length || hurt.length ? `<div class="memo"><b>📬 Le point de la direction</b>${alerts.slice(0, 5).map(x => `<p>${esc(x)}</p>`).join("")}
      ${hurt.map(c => `<p class="memo-act">🚑 ${esc(cardName(c.n))} blessé (${plural(c.inj, "période")}) <span><button class="mini-btn go" data-act="mcheal" data-v="${c.uid}">Soigner · ${mcHeal(c)} M€</button> <button class="mini-btn" data-act="mcsellask" data-v="${c.uid}">Vendre</button></span></p>`).join("")}</div>` : "";
    return {key, html:mcTable(head + memo + card,
      choose ? `<div class="dock-row">${N.a.map(([t], k) => `<button class="btn${k?" ghost":""}" data-act="mcnews" data-v="${k}">${t}</button>`).join("")}</div>` : `<button class="btn" data-act="mcgomkt">Au mercato →</button>`)}; }
  if(M.phase==="mercato"){
    const n = Object.keys(M.sel).length, used = Object.values(M.sel).reduce((a,b) => a+b, 0);
    return {key, html:mcTable(`<p class="mct-say">${M.period===1?"Mercato d'été":M.period===MC.flashPeriod?"Mercato d'hiver":"Marché des joueurs"} · ${M.buys} offres max · ${me.money-used} M€ libres</p>
      <div class="mkt">${M.market.map(c => { const b = M.sel[c.uid];
        return `<button class="mkt-c${b!=null?" bid":""}${c.sale?" sale":""}" data-act="mcopen" data-v="${c.uid}">${cardHTML(c.id,{small:true})}${mcTraitTag(c)}<span class="mkt-ovr">${mcOvr(c)}</span><span class="mkt-i"><b>${c.price}</b> M€ · ${c.age} ans</span><span class="mkt-from">${c.from?`${mcBadge(c.from, 12)} ${esc(c.from.n)}`:"🆓 libre"}</span>${c.fav?`<span class="fav-tag">❤️ −15 %</span>`:""}${c.sale?`<span class="sale-tag">SOLDÉ</span>`:""}${b!=null?`<span class="env">✉️ ${b}</span>`:""}</button>`; }).join("")}</div>`,
      `<button class="btn" data-act="mcresolve">${n?`Sceller ${n>1?`mes ${n} offres`:"mon offre"} ✉️`:"Passer ce mercato"}</button>`)};
  }
  if(M.phase==="reveal") return {key, html:mcTable(`<div class="reveal">${M.results.map((x, k) => `<div class="rv${x.w===me?" me":""}" style="animation-delay:${k*0.2}s;--pc:${x.w?x.w.col:"#fff3"}">
      <span class="rv-n"><b>${esc(cardName(x.c.n))} · ${mcOvr(x.c)} ${x.c.trait?MC_TRAITS[x.c.trait].ic:""}</b><small>base ${x.c.price} M€${x.from?` · ${esc(x.from.n)}`:""}</small></span>
      <span class="rv-b">${x.bids.length?x.bids.map(([v,p], j) => `<i class="${j===0&&x.w?"win":""}">${p.ic} ${v}</i>`).join(""):`<i class="none">pas d'offre</i>`}</span>
      ${x.w?`<span class="rv-w">${x.w.ic}<small>${x.price} M€</small></span>`:""}
      ${x.w===me?`<span class="rv-note">${x.starter?"✅ Titulaire":"🪑 Sur le banc"}${x.notes.length?" · "+esc(x.notes.join(", ")):""}</span>`:""}</div>`).join("")}</div>`,
      M.period===MC.flashPeriod ? `<button class="btn flashbtn" data-act="mcflash">❄️ Enchère flash : une Légende !</button>` : `<button class="btn" data-act="mccoups">Au bureau 💼</button>`)};
  if(M.phase==="flash"){ const F = M.flashA, c = F.c;
    return {key, html:mcTable(`<div class="flash"><span class="flash-t">❄️ Mercato d'hiver · enchères en direct</span>
      <div class="flash-c">${cardHTML(c.id,{small:true})}${mcTraitTag(c)}</div>
      <div class="flash-p${F.done?"":" tick"}"><b>${F.done && F.w ? F.paid : F.price}</b><small>M€</small></div>
      <div class="flash-in">${M.players.map((p,k) => `<span class="${F.in[k]?"in":"out"}" style="--pc:${p.col}">${p.ic}</span>`).join("")}</div>
      ${F.done?`<p class="mct-say">${F.w?`${F.w.ic} ${esc(mcName(F.w))} ${F.w.bot?"remporte":"remportes"} ${esc(c.n)} !`:"Personne n'en veut !"}</p>`:`<p class="mct-hint">${c.n} · note ${c.ovr} · ${c.age} ans · cote ${c.val} M€<br>Le prix monte… le dernier en lice l'emporte.</p>`}</div>`,
      F.done ? `<button class="btn" data-act="mccoups">Au bureau 💼</button>` : F.in[0] ? `<button class="btn danger" data-act="mcflashdrop">✋ Je lâche !</button>` : `<button class="btn ghost" disabled>Tu es sorti…</button>`)}; }
  if(M.phase==="coups"){
    const o = M.inbox[0];
    if(o) return {key, html:mcTable(`<div class="alert offer phone"><span class="ring">📞</span><span class="alert-av">${o.by.ic}</span><small>${esc(o.by.n)} t'appelle</small><b>${o.amt} M€</b><p>pour <strong>${esc(o.c.n)}</strong> · note ${o.c.ovr} · cote ${o.c.val} M€${o.c.paid!=null?` · tu l'as payé ${o.c.paid}`:""}</p>
        <div class="mini-one">${mcMini(o.c)}</div>${M.inbox.length>1?`<i>${M.inbox.length-1} autre${M.inbox.length>2?"s":""} appel${M.inbox.length>2?"s":""} en attente</i>`:""}</div>`,
      `<button class="btn" data-act="mcinbox" data-v="ok">✅ Accepter ${o.amt} M€</button><div class="dock-row"><button class="btn ghost" data-act="mcinbox" data-v="counter">↗️ ${Math.round(o.amt*1.2)} M€ ?</button><button class="btn ghost" data-act="mcinbox" data-v="no">✋ Refuser</button></div>`)};
    return {key, html:mcTable(`${M.flash ? mcActHTML(M.flash, M.fx==="bub") : ""}
         <p class="mct-say">💼 Bureau des affaires <small>${MC.plays-M.played} affaire${MC.plays-M.played>1?"s":""} possible${MC.plays-M.played>1?"s":""} · 🕵️ soupçons ${me.sus||0}%</small></p>
         ${me.ban===M.period ? `<p class="coal">🚫 Sanction de la Ligue : interdit de recruter cette période.</p>` : ""}
         ${MC_AF_MENU.map(([t, ks]) => `<p class="af-t">${t}</p><div class="af-grid">${ks.map(k => { const A = MC_AF[k], done = (me.once||{})[k]===(M.season||1);
           return `<button class="af${A.sus>=20?" hot":A.sus>0?" warm":A.k==="clean"?" clean":""}" data-act="mcaf" data-v="${k}" ${done?"disabled":""}><span>${A.ic}</span><b>${A.t}</b><small>${done?"déjà fait":mcAfMoney(k)?`${mcAfMoney(k)} M€`:A.bet?"mise libre":"gratuit"}${A.sus?` · 🕵️+${A.sus}`:""}</small></button>`; }).join("")}</div>`).join("")}
         <p class="af-t">Tes parades</p><div class="hand center">${me.par.length ? me.par.map((st, i) => mcHandCard(st, i)).join("") : `<span class="hand-empty">Aucune parade</span>`}<button class="mcc k-shop" data-act="mcparshop"><span class="mcc-ic">🛒</span><b>Acheter</b></button></div>
         <div class="bureau-acts"><button class="btn ghost scout" data-act="mcscout">🔎 Recruter : tous les joueurs</button><span class="mct-hint">ou touche un président en haut pour négocier</span></div>
         ${mcCoalition()?`<p class="coal">👀 Rumeur : on complote contre le leader…</p>`:""}`,
      `<button class="btn" data-act="mcendturn">Fin du bureau</button>`)};
  }
  if(M.phase==="react" || M.phase==="offer"){ const {by, st, c, cost} = M.pending, C = mcCardOf(st);
    return {key, html:mcTable(`<div class="alert ${M.phase}"><span class="alert-av">${by.ic}</span><small>${esc(by.n)} ${M.phase==="offer"?"te glisse à l'oreille":"t'attaque"}</small><b>${C.ic} ${C.t}</b><p>${st==="mission" ? `Il veut t'arracher ${esc(c.n)} pour ${cost} M€ avec l'argent de son allié !` : st==="chantage" && c ? `Il a des photos… et veut ${esc(c.n)} pour ${Math.round(c.val*0.6)} M€.` : st==="clause" && c ? `Il active la clause de ${esc(c.n)} : ${Math.round(c.val*MC.clauseMult)} M€.` : esc(C.d)}</p>${M.phase==="react"?`<i>Si tu ripostes, il perd sa mise et prend un retour de bâton.</i>`:""}</div>`,
      M.phase==="offer" ? `<button class="btn" data-act="mcanswer" data-v="1">🤫 J'accepte le pacte</button><button class="btn ghost" data-act="mcanswer" data-v="0">Refuser</button>`
      : `<div class="dock-col">${mcParFor(me, st).map(k => `<button class="btn" data-act="mcanswer" data-v="${k}">${MC_PAR[k].ic} Riposter : ${MC_PAR[k].t}</button>`).join("")}<button class="btn ghost" data-act="mcanswer" data-v="0">Encaisser</button></div>`)}; }
  if(M.phase==="press"){ const P = M.press, Q = MC_PRESS[P.i];
    return {key, html:mcTable(`<div class="press"><span class="press-tag">🎤 CONFÉRENCE DE PRESSE</span><p class="press-q">${esc(Q.q(P.r))}</p>${P.out?`<p class="press-a">${esc(Q.a[P.k][0])}</p><p class="news-out">→ ${esc(P.out)}</p>`:""}</div>`,
      P.out ? `<button class="btn" data-act="mcplay2">Lancer les ${MC.rounds[M.period-1]} journées ⚽</button>` : `<div class="dock-col">${Q.a.map(([t], k) => `<button class="btn${k?" ghost":""}" data-act="mcpress" data-v="${k}">${esc(t)}</button>`).join("")}</div>`)}; }
  if(M.phase==="after"){ const a = M.show[M.si], n = M.show.length;
    return {key, html:mcTable(n
      ? `<p class="mct-say">Pendant ce temps… · ${M.si+1}/${n}</p>${mcActHTML(a, true)}`
      : `<p class="mct-say">Les présidents n'ont rien tenté…</p><p class="mct-hint">…en apparence.</p>`,
      M.si < n-1 ? `<div class="dock-row"><button class="btn" data-act="mcshownext">Suivant →</button><button class="btn ghost" data-act="mcshowall">Tout voir</button></div>` : `<button class="btn" data-act="mcmatch">Lancer les ${MC.rounds[M.period-1]} journées ⚽</button>`)}; }
  if(M.phase==="match"){ const m = M.big, evs = m.ev.filter(e => e.min>0), pre = m.ev.filter(e => e.min===0), end = mcEvDelay(m.ev, null);
    const res = m.ga>m.gb ? "win" : m.ga===m.gb ? "draw" : "loss", anim = M.fx==="match", side = p => p===m.a ? "l" : "r", goals = evs.filter(e => e.goal);
    let sa = 0, sb = 0;
    const w = M.myRes.filter(x => x.gf>x.ga).length, d = M.myRes.filter(x => x.gf===x.ga).length, l = M.myRes.length - w - d;
    return {key, html:mcTable(`<div class="board${anim?" anim":""}">
       <div class="board-top">⭐ Le gros match · journée ${M.myRes.find(x => x.big).day}</div>
       <div class="board-sc"><span class="crest" style="--pc:${m.a.col}">${mcBadge(m.a, 40)}<small>${esc(m.a===me ? "Toi" : mcShort(m.a))}</small></span>
        <span class="score">${anim ? [0, ...goals].map(e => { if(e){ if(e.p===m.a) sa++; else sb++; } return `<b class="sc-step" style="animation-delay:${e?mcEvDelay(m.ev,e):0}s">${sa}<i>-</i>${sb}</b>`; }).join("") : `<b>${m.ga}<i>-</i>${m.gb}</b>`}</span>
        <span class="crest" style="--pc:${m.b.col}">${mcBadge(m.b, 40)}<small>${esc(mcShort(m.b))}</small></span></div>
       <div class="board-f"><span>note ${m.fa.total} · ${m.a.sys}</span><span>possession ${m.poss}-${100-m.poss}</span><span>${m.b.sys} · note ${m.fb.total}</span></div>
       ${anim ? `<div class="pitch-strip" style="--dur:${end}s"><i class="ball">⚽</i></div>${goals.map(e => `<div class="gflash ${e.p===me?"mine":"them"}" style="animation-delay:${mcEvDelay(m.ev,e)}s"><b>${e.p===me?"BUUUT !":"BUT…"}</b><span>${esc(e.t)}</span></div>`).join("")}` : ""}
       ${pre.map(e => `<p class="tl pre ${side(e.p)}">${esc(e.t)}</p>`).join("")}
       <div class="tl-list">${evs.map(e => `<p class="tl ${side(e.p)}${e.goal?" goal":""}" style="animation-delay:${mcEvDelay(m.ev,e)}s"><span class="tl-m">${e.min}'</span>${e.goal?"⚽ BUUUT ! ":""}${esc(e.t)}</p>`).join("")}</div>
       <div class="stamp s-${res}" style="animation-delay:${anim?end+0.4:0}s">${res==="win"?"VICTOIRE":res==="draw"?"MATCH NUL":"DÉFAITE"}</div>
      </div>
      <div class="after-match" style="animation-delay:${anim?end+0.8:0}s">
       <div class="period-res"><b>Ta période : ${w}V ${d}N ${l}D</b><div class="pr-list">${M.myRes.map(x => `<span class="pr ${x.gf>x.ga?"f-V":x.gf===x.ga?"f-N":"f-D"}${x.big?" big":""}"><i>J${x.day}</i>${mcBadge(x.opp, 14)} ${x.gf}-${x.ga}</span>`).join("")}</div></div>
       ${M.cupRes ? `<div class="cup-res ${M.cupRes.win?"ok":"ko"}"><span>🏆 Coupe · ${M.cupRes.name}</span><b>${mcBadge(M.cupRes.opp, 16)} ${esc(mcShort(M.cupRes.opp))} : ${M.cupRes.gf}-${M.cupRes.ga}${M.cupRes.tab?" (tab)":""}</b><em>${M.cupRes.win ? (M.period===6 ? "🏆 VAINQUEUR DE LA COUPE ! +25 M€" : "Qualifié ! +5 M€") : "Éliminé"}</em></div>`
         : MC_CUP[M.period] && M.cup && M.cup.winner!=null && M.period===6 ? `<div class="cup-res"><span>🏆 Coupe</span><b>${esc(mcName(M.clubs[M.cup.winner]))} remporte la coupe</b></div>` : ""}
       <div class="cash"><b>💰 ${me.income-me.wages-(me.tax||0)>=0?"+":""}${me.income-me.wages-(me.tax||0)} M€</b><small>recettes +${me.income} · salaires −${me.wages}${me.tax?` · 🧾 taxe fair-play −${me.tax}`:""}</small>${me.forced && me.forced.length?`<small class="warn">⚠️ Caisse vide : vente forcée de ${esc(me.forced.join(", "))}</small>`:""}</div>
       ${M.moves.length?`<div class="moves">${M.moves.map(x => `<span class="${x.c.val>=x.old?"up":"down"}">${x.c.ovr>x.oldO?`🆙 ${esc(cardName(x.c.n))} ${x.oldO}→${x.c.ovr}`:x.c.ovr<x.oldO?`🔻 ${esc(cardName(x.c.n))} ${x.oldO}→${x.c.ovr}`:`${x.c.val>x.old?"📈":"📉"} ${esc(cardName(x.c.n))} ${x.old}→${x.c.val} M€`}</span>`).join("")}</div>`:""}
       ${M.betRes ? `<div class="cup-res ${M.betRes.win?"ok":"ko"}"><span>🎲 Le pari du cousin</span><b>${({V:"Victoire",N:"Nul",D:"Défaite"})[M.betRes.o]} misé ${M.betRes.mise} M€</b><em>${M.betRes.win?`Gagné ! +${M.betRes.mise*3} M€`:"Perdu"}</em></div>` : ""}
       ${(M.enq||[]).length ? `<div class="enq">${M.enq.map(e => `<p class="${e.p===me?"me":""}"><b>🚨 La Ligue épingle ${esc(e.p===me?"ton club":e.p.n)}</b><small>${esc(e.why)} : ${esc(e.txt)}</small></p>`).join("")}</div>` : ""}
       ${M.hurt && M.hurt.length ? `<div class="moves">${M.hurt.map(c => `<span class="down">🚑 ${esc(cardName(c.n))} blessé ${plural(c.inj, "période")}</span>`).join("")}</div>` : ""}
       ${mcLeagueHTML(false)}
       <button class="linkbtn" data-act="mcevent">Voir le classement complet</button>
      </div>`,
      `<button class="btn" data-act="mcnext">${M.period<MC.periods?`Période ${M.period+1} →`:"Fin de saison 🏆"}</button>`, "is-match")}; }
  if(M.phase==="end"){ const meRank = M.final.indexOf(me)+1, LG = mcLeague();
    return {key:"mcend-"+(L.summary&&L.summary.coins), html:`<div class="stack mc-end">
     <div class="hero"><span class="eyebrow">Mercato FC · ${M.daily?"Partie du jour":MC_DIFF[M.diff].t}</span><h1 class="display" style="font-size:clamp(32px,9vw,46px)">${meRank===1?`Meilleur <span>président</span> 🏆`:`${meRank}ᵉ <span>président sur 4</span>`}</h1><p>${esc(me.n)} termine ${mcPos(me)}ᵉ du championnat${LG[0]===me?" : CHAMPION ! 🏆":""}.</p></div>
     <div class="finals">${M.final.map((p,k) => `<div class="fin${p.bot?"":" me"}" style="animation-delay:${k*0.2}s;--pc:${p.col}"><span class="fin-rk">${k+1}</span><span class="seat-av">${p.ic}</span>
       <span class="fin-t"><b>${esc(p===me ? me.n : `${p.club} (${mcShort(p)})`)}</b><small>${MC_PROFILES[p.profile]?.ic||""} ${mcPos(p)}ᵉ (objectif ${p.goal}) · 💰 ${p.sc.fort>=0?"+":""}${p.sc.fort} · 🏆 ${p.sc.rank>=0?"+":""}${p.sc.rank + p.sc.tro}${p.sc.cas?` · 🚨 ${p.sc.cas}`:""}${p.sc.sec?` · 🔒 +${p.sc.sec}`:""}${p.sc.bon?` · 🏦 +${p.sc.bon}`:""}</small></span><span class="fin-s">${p.final}</span></div>`).join("")}</div>
     <p class="mct-hint" style="color:#fff">Points de progression : 💰 fortune gagnée × coefficient du club · 🏆 places par rapport à l'objectif et trophées · 🚨 casseroles.</p>
     <div class="trophies">${M.trophies.map((t,k) => `<div class="tro${t.p===me?" me":""}" style="animation-delay:${0.8+k*0.15}s"><span>${t.ic}</span><b>${t.t}</b><small>${esc(t.d)}</small><em>${t.p.ic} ${esc(t.p===me?"Toi":t.p.cpu?t.p.n:mcShort(t.p))}</em></div>`).join("")}</div>
     ${M.fired ? `<div class="career-end fired"><b>🚪 Viré !</b><p>Deux saisons de suite dans la zone rouge : la direction te remercie.</p></div>` : ""}
     ${M.newAch && M.newAch.length ? `<div class="ach-new">${M.newAch.map(k => `<p><span>${MC_ACH[k].ic}</span><b>Succès : ${MC_ACH[k].t}</b><small>Tu débloques ${MC_ACH[k].u}</small></p>`).join("")}</div>` : ""}
     ${(() => { const S = M.seasonStats; if(!S) return ""; return `<div class="sstats"><b>📊 La saison en chiffres</b>
       ${S.scorers.length ? `<p class="dash-t">👟 Meilleurs buteurs</p><div class="tlog">${S.scorers.map((x,k) => `<p class="${x.me?"me":""}"><span>${k+1}</span><b>${esc(cardName(x.n))}<small>${esc(x.k)}</small></b><em>${x.g} buts</em></p>`).join("")}</div>` : ""}
       <div class="kpis">${S.recruit ? `<div><small>Ta meilleure recrue</small><b>${esc(cardName(S.recruit.n))}</b><i>${S.recruit.o} de note · ${S.recruit.g} buts · ${S.recruit.price} M€</i></div>` : ""}
        ${S.gain ? `<div><small>Plus grosse plus-value</small><b>+${S.gain.g} M€</b><i>${esc(cardName(S.gain.n))} · ${esc(S.gain.k)}</i></div>` : ""}
        ${S.rec ? `<div><small>Transfert record</small><b>${S.rec.a} M€</b><i>${esc(cardName(S.rec.n))} · ${esc(S.rec.f)} → ${esc(S.rec.t)}</i></div>` : ""}
        <div><small>Transferts</small><b>${S.n}</b><i>sur la saison</i></div></div>
       <button class="linkbtn" data-act="mctlog">📜 Voir tous les transferts</button></div>`; })()}
     <button class="btn ghost" data-act="mcevent">🏆 Classement final</button>
     ${M.daily ? `<div class="card"><b>🏆 Classement du jour</b>${mcBoardHTML(10)}</div>` : ""}
     <button class="btn ghost" data-act="mcshare">${ICON.share} Partager mon résultat</button>
     ${summaryBlock()}</div>
     ${mcSheet()}
     ${M.careerOver && M.len>1 ? `<div class="career-end"><b>🏁 Fin de carrière · ${M.len} saisons</b>${[...M.players].sort((a,b) => b.careerPts-a.careerPts).map((p,k) => `<p class="${p===me?"me":""}"><span>${k+1}. ${p.ic} ${esc(p===me?me.n:p.club)}</span><b>${p.careerPts} pts</b></p>`).join("")}</div>` : ""}
     ${M.palmares && M.palmares.length>1 ? `<div class="palm"><b>Ton palmarès</b>${M.palmares.map(x => `<span>S${x.s} · ${x.pos}ᵉ${x.champ?" 🏆":""}${x.cup?" 🥇":""}${x.rank===1?" 👑":""}</span>`).join("")}</div>` : ""}
     ${dock(M.daily ? `<button class="btn" data-act="mcstart" data-v="${M.diff}" data-d="1">Rejouer</button><button class="btn ghost" data-act="nav" data-v="mercatoPick">Retour</button>`
       : !M.careerOver ? `<button class="btn" data-act="mcnextseason">Saison ${M.season+1}${M.len<99?`/${M.len}`:""} avec ${esc(me.n)} →</button><button class="btn ghost" data-act="nav" data-v="mercatoPick">Quitter (sauvegardé)</button>`
       : `<button class="btn" data-act="mcstart" data-v="${M.diff}">Nouvelle partie</button><button class="btn ghost" data-act="nav" data-v="mercatoPick">Retour</button>`)}`};
  }
  return {key:"mc-x", html:""};
}

/* ---------- actions (appelées depuis app.js) */
function mcAct(a, v, el){
  if(a==="mcstart"){ mcSfx("tap"); return startMercato(v, {daily: !!(el && el.dataset && el.dataset.d)}); }
  if(a==="mcresume"){ mcSfx("tap"); return mcLoad(); }
  if(!M) return;
  const me = M.players && mcMe();
  if(!["mcbid","mcdealamt"].includes(a)) mcSfx("tap");
  switch(a){
    case "mctuto": if(M.tuto < mcTutoSlides().length-1){ M.tuto++; mcR(); } else { PROFILE.best.mercatoTuto5 = 1; saveProfile(); M.phase = "club"; mcR(); } break;
    case "mctutoskip": PROFILE.best.mercatoTuto5 = 1; saveProfile(); M.phase = "club"; mcR(); break;
    case "mcclub": mcSetup(v); break;
    case "mcfmt": M.len = +v; mcR(); break;
    case "mcsecret": me.secret = v; if(me.power){ mcSave(); mcPeriodStart(); } else { M.phase = "power"; mcR(); } break;
    case "mcnextseason": mcNewSeason(); break;
    case "mcresume": mcLoad(); break;
    case "mcpower": me.power = v; mcSave(); mcPeriodStart(); break;
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
    case "mcclubpeek": M.sheet = {t:"club", club:+v}; mcR(); break;
    case "mcdealbuy": { const p = mcClub(M.sheet.club), c = mcRoster(p).find(x => x.uid===v); M.sheet = {t:"deal", mode:"buy", club:M.sheet.club, u:v, amt:Math.max(1, Math.min(me.money, Math.round(c.val*1.2)))}; mcR(); break; }
    case "mcdealsellpick": M.sheet = {t:"sellpick", club:+v}; mcR(); break;
    case "mcdealsell": { const c = mcRoster(me).find(x => x.uid===v); M.sheet = {t:"deal", mode:"sell", club:M.sheet.club, u:v, amt:c.val + 5}; mcR(); break; }
    case "mcdealamt": M.sheet.amt = Math.max(1, M.sheet.amt + (+v)); if(M.sheet.mode==="buy") M.sheet.amt = Math.min(me.money, M.sheet.amt); mcSfx("coin"); mcR(); break;
    case "mcdealsend": mcDealSend(); break;
    case "mcaf": M.sheet = {t:"af", k:v, seat:null, u:null, mise:null, o:null}; mcSfx("card"); mcR("sheet"); break;
    case "mcafseat": M.sheet.seat = +v; mcR(); break;
    case "mcafpick": { const [seat, u] = v.split("|"); M.sheet.seat = +seat; M.sheet.u = u; mcR(); break; }
    case "mcafmise": M.sheet.mise = +v; mcR(); break;
    case "mcafo": M.sheet.o = v; mcR(); break;
    case "mcafgo": mcAfGo(); break;
    case "mcdenounce": { const D = M.det; if(!D || D.done) break; const r = mcDenounce(me, D.to); D.done = true; D.res = r.t; M.flash = mcAct_(me, "detective", D.to, r.t, r.ok ? "ok" : "refused"); mcSfx(r.ok ? "coin" : "block"); mcR(); break; }
    case "mcparshop": M.sheet = {t:"parshop"}; mcR("sheet"); break;
    case "mcbuypar": { const P = MC_PAR[v]; if(!P || me.money < P.price || me.par.length >= MC.handMax) break; me.money -= P.price; me.par.push(v); mcSfx("coin"); mcR(); break; }
    case "mcslot": M.sheet = {t:"team", slot:M.sheet && M.sheet.slot===+v ? null : +v}; mcR(); break;
    case "mcput": { const sl = M.sheet && M.sheet.slot; if(sl==null) break; const c = mcRoster(me).find(x => x.uid===v); if(!c) break;
      const occ = me.team.find(x => x.sl===sl), from = c.sl; c.sl = sl; if(occ) occ.sl = from!=null ? from : null;
      me.man = true; me.team = mcRoster(me).filter(x => x.sl!=null).sort((a,b) => a.sl-b.sl); me.bench = mcRoster(me).filter(x => x.sl==null); mcLineup(me); M.sheet = {t:"team", slot:null}; mcR(); break; }
    case "mcsys": me.sys = v; me.man = false; mcLineup(me); mcR(); break;
    case "mcauto": me.man = false; mcLineup(me); toast("Compo automatique : les meilleurs à leur poste.", "ok"); mcR(); break;
    case "mcendturn": M.phase = "botsplay"; mcBotsStart(); break;
    case "mcanswer": mcAnswer(v==="1"); break;
    case "mcshownext": M.si++; { const x = M.show[M.si]; mcSfx(x.res==="blocked" ? "block" : x.st==="deal" ? "coin" : x.to ? "hit" : "card"); } mcR("act"); break;
    case "mcmatch": mcPressStart(); break;
    case "mcshowall": M.sheet = {t:"log"}; M.si = M.show.length-1; mcR("sheet"); break;
    case "mcnext": mcNext(); break;
    case "mcshare": mcShare(); break;
    case "mcmute": PROFILE.best.mcMute = !PROFILE.best.mcMute; saveProfile(); mcR(); break;
    case "mcteam": M.sheet = {t:"team"}; mcR("sheet"); break;
    case "mcslotc": M.sheet = {t:"team", slot:+v}; mcR("sheet"); break;
    case "mcsell": { const c = mcRoster(me).find(x => x.uid===v); if(c && !mcCanSell(me)) return toast(`Effectif minimum : ${MC.minSquad} joueurs.`); if(c){ const g = mcSell(me, c); mcLineup(me); mcSfx("coin"); toast(`${cardName(c.n)} vendu : +${g} M€`); M.sheet = M.tab==="club" ? null : {t:"team"}; mcR(); } break; }
    case "mcmove": { const c = mcRoster(me).find(x => x.uid===v); if(!c) break; const sys = mcSys(me);
      if(c.sl==null){ const w = mcWhere(me, c); if(w.i < 0) break; const occ = me.team.find(x => x.sl===w.i); if(occ) occ.sl = null; c.sl = w.i; }
      else { const sl = c.sl, sub = me.bench.filter(x => !mcOut(x)).sort((a,b) => mcEff(b, sys.s[sl]) - mcEff(a, sys.s[sl]))[0]; if(!sub) return toast("Personne sur le banc pour le remplacer."); c.sl = null; sub.sl = sl; }
      me.man = true; me.team = mcRoster(me).filter(x => x.sl!=null).sort((a,b) => a.sl-b.sl); me.bench = mcRoster(me).filter(x => x.sl==null); mcLineup(me); mcR(); break; }
    case "mcsecretpeek": M.sheet = {t:"secret"}; mcR("sheet"); break;
    case "mcpeek": M.sheet = {t:"peek", i:+v}; mcR("sheet"); break;
    case "mcevent": M.sheet = {t:"event"}; mcR("sheet"); break;
    case "mcscout": M.sheet = {t:"scout"}; mcR("sheet"); break;
    case "mcscouttab": M.st = v; mcR(); break;
    case "mcsf": M.sf = v; mcR(); break;
    case "mcss": M.ss = v; mcR(); break;
    case "mcscoutp": { const c = [...M.clubs.flatMap(mcRoster), ...M.market].find(x => x.uid===v); if(!c) break; const fee = me.power==="chasseur" ? 0 : 2; if(me.money < fee) return toast("Pas assez d'argent."); me.money -= fee; c.scouted = true; toast(`Rapport : ${cardName(c.n)} peut atteindre ${c.pot}.`); mcR(); break; }
    case "mcdealfrom": { const [ci, u] = v.split("|"), p = mcClub(+ci), c = mcRoster(p).find(x => x.uid===u); if(!c) break; M.sheet = {t:"deal", mode:"buy", club:+ci, u, amt:Math.max(1, Math.min(me.money, Math.round(c.val*1.2)))}; mcR(); break; }
    case "mcdash": M.sheet = {t:"dash"}; mcR("sheet"); break;
    case "mcpress": mcPressAnswer(+v); break;
    case "mcplay2": mcPlayPeriod(); break;
    case "mcrules": M.sheet = {t:"rules"}; mcR("sheet"); break;
    case "mctipok": PROFILE.best.mcTips = PROFILE.best.mcTips || {}; PROFILE.best.mcTips[v] = 1; saveProfile(); mcR(); break;
    case "mctipsreset": PROFILE.best.mcTips = {}; saveProfile(); M.sheet = null; toast("Les conseils réapparaîtront.", "ok"); mcR(); break;
    case "mctab": M.tab = v; M.sheet = null; mcR(); window.scrollTo(0, 0); break;
    case "mcsellask": M.sheet = {t:"sellask", u:v}; mcR("sheet"); break;
    case "mclist": { const c = mcRoster(me).find(x => x.uid===v); if(!c) break; c.listed = !c.listed; toast(c.listed ? `${cardName(c.n)} est sur la liste des transferts.` : "Retiré de la liste.", "ok"); M.sheet = null; mcR(); break; }
    case "mcpl": M.sheet = {t:"player", u:v, back:M.sheet && M.sheet.t!=="player" ? M.sheet : M.sheet && M.sheet.back || null}; mcR(M.sheet.back ? "" : "sheet"); break;
    case "mcback": M.sheet = M.sheet && M.sheet.back || null; mcR(); break;
    case "mctlog": M.sheet = {t:"tlog", back:M.sheet && M.sheet.t!=="tlog" ? M.sheet : null}; mcR(M.sheet.back ? "" : "sheet"); break;
    case "mcheal": { const c = mcRoster(me).find(x => x.uid===v); if(!c || !c.inj) break; const cost = mcHeal(c); if(me.money < cost) return toast("Pas assez d'argent."); me.money -= cost; c.inj = 0; mcSfx("coin"); toast(`${cardName(c.n)} est soigné : il rejoue tout de suite.`, "ok"); mcR(); break; }
    case "mcrenew": { const c = mcRoster(me).find(x => x.uid===v); if(!c) break; const cost = mcRenew(c); if(me.money < cost) return toast("Pas assez d'argent."); if((c.ct||1) >= 4) return toast("Contrat déjà long : reviens plus tard."); me.money -= cost; c.ct = (c.ct||1) + 2; mcSfx("coin"); toast(`${cardName(c.n)} prolonge : contrat de ${c.ct} saisons.`, "ok"); mcR(); break; }
  }
}
