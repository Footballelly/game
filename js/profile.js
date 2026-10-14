/* Football Legends — profil local : pseudo, XP, niveaux, série, records, collection.
   Tout reste sur l'appareil (localStorage). Seuls le pseudo et le score du défi du jour partent au classement. */
"use strict";

const PROFILE_KEY = "fl-profile";
function freshProfile(){
  return { v:1, id:uuid(), name:"", xp:0, games:0, created:todayKey(),
    streak:{count:0, best:0, last:null},
    best:{pm:0, pmLdc:0, saison:0, chrono:{}},
    daily:{},          // { "2026-10-14": {kind, score, total, detail, at} }
    cards:{},          // { "Thierry Henry": {r:"c"|"p", at:"2026-10-14"} }  r = commune / pépite
    seenInstall:false };
}
let PROFILE = Object.assign(freshProfile(), LS.get(PROFILE_KEY) || {});
if(!PROFILE.id) PROFILE.id = uuid();
const saveProfile = () => LS.set(PROFILE_KEY, PROFILE);
saveProfile();

/* ---------- Niveaux : 50 XP pour le niveau 2, puis de plus en plus ---------- */
const levelOf = xp => Math.floor(Math.sqrt(xp/50)) + 1;
const xpFor = lvl => 50 * (lvl-1) * (lvl-1);
function levelInfo(xp=PROFILE.xp){ const l = levelOf(xp), a = xpFor(l), b = xpFor(l+1); return {level:l, into:xp-a, need:b-a, pct:Math.round((xp-a)/(b-a)*100)}; }
const TITLES = ["Supporter du dimanche","Abonné au stade","Habitué de la tribune","Consultant du bar","Encyclopédie ambulante","Scout de l'ombre","Historien du foot","Légende du quiz"];
const titleOf = lvl => TITLES[Math.min(TITLES.length-1, Math.floor((lvl-1)/2))];

/* ---------- Série de jours (défi du jour) ---------- */
function streakAlive(){ const s = PROFILE.streak; return s.last===todayKey() || s.last===prevKey(todayKey()) ? s.count : 0; }
function bumpStreak(day){
  const s = PROFILE.streak; if(s.last===day) return s.count;
  s.count = s.last===prevKey(day) ? s.count+1 : 1; s.last = day; s.best = Math.max(s.best, s.count); return s.count;
}

/* ---------- Cartes ---------- */
const LEGEND_NAMES = ["Thierry Henry","Dennis Bergkamp","Patrick Vieira","Robert Pirès","Sol Campbell","Ashley Cole","Cesc Fàbregas","Robin van Persie",
  "Frank Lampard","John Terry","Didier Drogba","Petr Čech","Claude Makélélé","Eden Hazard","Steven Gerrard","Jamie Carragher","Fernando Torres","Luis Suárez",
  "Xabi Alonso","Paul Scholes","Ryan Giggs","Wayne Rooney","Cristiano Ronaldo","Edwin van der Sar","Rio Ferdinand","Nemanja Vidić","Ruud van Nistelrooy",
  "Roy Keane","Gary Neville","Alan Shearer","Sergio Agüero","Vincent Kompany","Yaya Touré","David Silva","Gareth Bale","Luka Modrić","Harry Kane","Michael Owen","Robbie Fowler","Jamie Vardy"];
const LEGENDS = new Set(LEGEND_NAMES.filter(n => playerByName(n)!==undefined));
const rarityOf = name => LEGENDS.has(name) ? "l" : (PROFILE.cards[name]||{}).r==="p" ? "p" : "c";
/* débloque des cartes ; renvoie celles qui sont nouvelles ou améliorées */
function unlockCards(names, pepites=[]){
  const fresh = [];
  for(const n of names){ if(playerByName(n)===undefined) continue;
    const had = PROFILE.cards[n], isP = pepites.includes(n);
    if(!had){ PROFILE.cards[n] = {r:isP?"p":"c", at:todayKey()}; fresh.push(n); }
    else if(isP && had.r!=="p"){ had.r = "p"; fresh.push(n); } }
  return fresh;
}
/* albums : un par club, avec tous les joueurs de la base passés par ce club */
function albums(){
  const map = {};
  P.forEach(p => new Set(p.s.map(s => s[0])).forEach(c => (map[c] ||= []).push(p.n)));
  return Object.entries(map).map(([club, names]) => ({club, names:names.sort(), got:names.filter(n => PROFILE.cards[n]).length}))
    .sort((a,b) => b.got/b.names.length - a.got/a.names.length || b.names.length - a.names.length);
}

/* ---------- Fin de partie : XP, records, cartes ---------- */
/* r = {mode, score, total, found:[noms de joueurs validés], pepites:[noms], won, daily} */
function recordGame(r){
  const before = levelOf(PROFILE.xp);
  let xp = 20 + r.score*10 + (r.pepites||[]).length*15 + (r.won?30:0);
  if(r.daily) xp += 50;
  const rec = [];
  if(r.mode==="plusmoins" && r.solo && !r.daily){ const k = r.theme==="ldc" ? "pmLdc" : "pm"; if(r.score>(PROFILE.best[k]||0)){ PROFILE.best[k] = r.score; rec.push(`Record de série : ${r.score}`); } }
  if(r.mode==="saison" && r.score>PROFILE.best.saison){ PROFILE.best.saison = r.score; rec.push(`Record : ${r.score}/11 postes`); }
  if(r.mode==="chrono" && r.list){ const ck = chronoKey(r.list, r.daily ? 90 : r.time); const b = PROFILE.best.chrono[ck]||0; if(r.score>b){ PROFILE.best.chrono[ck] = r.score; if(b) rec.push(`Record sur cette liste : ${r.score}`); } }
  if(r.mode==="career"){ const k = careerRecKey(r.diff); if(r.points>(PROFILE.best[k]||0)){ if(PROFILE.best[k]) rec.push(`Record ${DIFFS[r.diff].t} : ${r.points}/${r.max}`); PROFILE.best[k] = r.points; } }
  const cards = [];
  PROFILE.xp += xp; PROFILE.games++;
  let streak = null;
  if(r.daily){ PROFILE.daily[r.daily] = {kind:r.mode, score:r.score, total:r.total, detail:r.detail||null, list:r.list||null, at:Date.now()}; streak = bumpStreak(r.daily); }
  saveProfile();
  return {xp, cards, rec, levelUp: levelOf(PROFILE.xp)>before ? levelOf(PROFILE.xp) : 0, streak};
}
