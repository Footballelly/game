/* Football Legends — utilitaires partagés (chargé en premier) */
"use strict";

/* ---------- Configuration Supabase (temps réel des salons + classements) ---------- */
const SUPABASE_URL = "https://vxlafnwippmztnzmeppo.supabase.co";
const SUPABASE_KEY = "sb_publishable_fnlv_-QglWwO0J_222pmjA_2vttOfM4";
const ONLINE = !!(SUPABASE_URL && SUPABASE_KEY && window.supabase);
const SITE_URL = "footballelly.github.io/game";
let SB = null;
function sb(){ if(!SB && ONLINE){ try{ SB = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); }catch(e){ SB = null; } } return SB; }

/* ---------- Données ---------- */
const P = window.FL_PLAYERS || [];
const CLUB = window.FL_CLUBS || {};
const KITS = window.FL_KITS || {};
const GOALS = window.FL_GOALS || [];
const LISTS = window.FL_LISTS || [];
const GOALS_UCL = window.FL_GOALS_UCL || [];
const PM_THEMES = window.FL_PM_THEMES || {pl:{t:"Buts en Premier League", u:"buts en PL"}};
const goalsOf = th => th==="ldc" ? GOALS_UCL : GOALS;
const LEAGUES = window.FL_LEAGUES || {};

/* ---------- Constantes de jeu ---------- */
const SEASONS = [2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014];
const sLbl = y => `${y}-${String(y+1).slice(2)}`;
const sShort = y => `${String(y).slice(2)}/${String(y+1).slice(2)}`;
const SLOTS = [{id:"GK",l:"GK",fr:"Gardien",ab:"G"},
 {id:"LB",l:"DEF",fr:"Latéral gauche",ab:"DG"},{id:"CB1",l:"DEF",fr:"Défenseur central",ab:"DC"},{id:"CB2",l:"DEF",fr:"Défenseur central",ab:"DC"},{id:"RB",l:"DEF",fr:"Latéral droit",ab:"DD"},
 {id:"CM1",l:"MID",fr:"Milieu",ab:"MIL"},{id:"CM2",l:"MID",fr:"Milieu",ab:"MIL"},{id:"CM3",l:"MID",fr:"Milieu",ab:"MIL"},
 {id:"LW",l:"ATT",fr:"Ailier gauche",ab:"AG"},{id:"ST",l:"ATT",fr:"Avant-centre",ab:"BU"},{id:"RW",l:"ATT",fr:"Ailier droit",ab:"AD"}];
const LINES = [["LW","ST","RW"],["CM1","CM2","CM3"],["LB","CB1","CB2","RB"],["GK"]];
const ROLE = {GK:"gardien",DEF:"défenseur",MID:"milieu",ATT:"attaquant"};
const MODES = {
  saison:{t:"Un joueur par saison",d:"11 manches : un poste, une saison de PL. Tu cites un joueur de mémoire."},
  plusmoins:{t:"Plus ou moins",d:"Le joueur suivant a-t-il marqué plus ou moins de buts en Premier League ?"},
  chrono:{t:"Chrono",d:"Cite un maximum de noms d'une liste avant la fin du temps."}
};
const MAX_TRIES = 3, PM_DUELS = 10;
const slotById = id => SLOTS.find(s => s.id === id);

/* ---------- Texte ---------- */
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm = s => String(s).replace(/œ/g,"oe").replace(/Œ/g,"OE").replace(/æ/g,"ae").replace(/ß/g,"ss")
  .normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[łŁ]/g,"l").toLowerCase()
  .replace(/['’]/g,"").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
const short = p => p.k || p.n.split(" ").slice(-1)[0];
const initialsOf = name => { const w = String(name).replace(/['’.]/g,"").trim().split(/\s+/).filter(Boolean); if(!w.length) return "?"; return (w.length>1 ? w[0][0]+w[w.length-1][0] : w[0].slice(0,2)).toUpperCase(); };
const plural = (n, one, many) => `${n} ${n>1 ? (many || one+"s") : one}`;

/* ---------- Joueurs ---------- */
const clubAt = (p, y) => { const st = p.s.find(([c,a,b]) => y>=a && y<=b); return st ? st[0] : null; };
const lines = p => p.p.split(" ");
function mainClub(p){ // le club où il a passé le plus de saisons
  const tot = {}; p.s.forEach(([c,a,b]) => tot[c] = (tot[c]||0) + (b-a+1));
  return Object.entries(tot).sort((x,y) => y[1]-x[1])[0][0];
}
const ALIAS = P.map(p => { const set = new Set([norm(p.n), norm(short(p)), norm(p.n.split(" ").slice(-1)[0]), ...(p.a||[]).map(norm)]);
  const w = norm(p.n).split(" "); if(w.length>2) set.add(w.slice(1).join(" ")); return [...set].filter(x => x.length>1); });
function lev(a,b){ if(Math.abs(a.length-b.length)>2) return 9; const d = Array.from({length:a.length+1},(_,i)=>[i]); for(let j=1;j<=b.length;j++) d[0][j]=j;
  for(let i=1;i<=a.length;i++) for(let j=1;j<=b.length;j++) d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1)); return d[a.length][b.length]; }
function findPlayers(input){ const q = norm(input); if(!q) return [];
  let hits = P.map((p,i)=>i).filter(i => ALIAS[i].includes(q));
  if(!hits.length && q.length>=5){ const tol = q.length>=8 ? 2 : 1; hits = P.map((p,i)=>i).filter(i => ALIAS[i].some(a => a.length>=4 && lev(q,a)<=tol)); }
  return hits; }
const playerByName = (() => { const m = new Map(P.map((p,i) => [norm(p.n), i])); return n => m.get(norm(n)); })();

/* ---------- Listes du Chrono ---------- */
function buildListAliases(l){
  const SUF = / (city|united|town|rovers|wanderers|athletic|albion|county|hotspur|rangers|wednesday)$/;
  const auto = l.items.map(it => { const s = new Set(), n = norm(it.n), w = n.split(" ");
    if(l.kind==="player"){ if(w.length>1) s.add(w[w.length-1]); if(w.length>2) s.add(w.slice(1).join(" ")); }
    else { const st = n.replace(SUF,""); if(st!==n) s.add(st); }
    return s; });
  const cnt = {}; auto.forEach(s => s.forEach(a => cnt[a] = (cnt[a]||0)+1));
  return l.items.map((it,i) => { const s = new Set([norm(it.n), ...(it.a||[]).map(norm)]); auto[i].forEach(a => { if(cnt[a]===1 && a.length>2) s.add(a); }); return [...s].filter(Boolean); });
}
LISTS.forEach(l => { l._al = buildListAliases(l); });
const listById = id => LISTS.find(l => l.id === id);
function chronoMatch(l, input, found){
  const q = norm(input); if(!q) return {kind:"none"};
  let hits = l.items.map((_,i)=>i).filter(i => l._al[i].includes(q));
  if(!hits.length && q.length>=5){ const tol = q.length>=8 ? 2 : 1; hits = l.items.map((_,i)=>i).filter(i => l._al[i].some(a => a.length>=4 && lev(q,a)<=tol)); }
  if(!hits.length) return {kind:"none"};
  const fresh = hits.find(i => !found.includes(i));
  return fresh!==undefined ? {kind:"ok", i:fresh} : {kind:"dup", i:hits[0]};
}

/* ---------- Hasard (graine fixe pour le défi du jour) ---------- */
function hashStr(s){ let h = 2166136261; for(const c of s){ h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h>>>0; }
function rng(seed){ let a = typeof seed==="string" ? hashStr(seed) : seed>>>0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a>>>15, 1|a); t = t + Math.imul(t ^ t>>>7, 61|t) ^ t; return ((t ^ t>>>14)>>>0)/4294967296; }; }
const shuffle = (arr, r=Math.random) => { const a = [...arr]; for(let i=a.length-1;i>0;i--){ const j = Math.floor(r()*(i+1)); [a[i],a[j]] = [a[j],a[i]]; } return a; };
const uid = () => Math.random().toString(36).slice(2,10);
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c/4).toString(16)));

/* ---------- Dates (le défi du jour change à minuit UTC, 1 h ou 2 h en France) ---------- */
const LAUNCH = Date.UTC(2026, 9, 14); // défi n°1 = 14/10/2026
const todayKey = () => new Date().toISOString().slice(0,10);
const dayNumber = (key=todayKey()) => Math.round((Date.parse(key+"T00:00:00Z") - LAUNCH)/864e5) + 1;
const prevKey = key => new Date(Date.parse(key+"T00:00:00Z") - 864e5).toISOString().slice(0,10);
function msToTomorrow(){ const n = new Date(); return Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()+1) - n.getTime(); }
function fmtCountdown(ms){ const s = Math.max(0, Math.floor(ms/1000)); const h = Math.floor(s/3600), m = Math.floor(s%3600/60); return h ? `${h} h ${String(m).padStart(2,"0")}` : `${m} min`; }
const fmtDayFr = key => new Date(key+"T12:00:00Z").toLocaleDateString("fr-FR", {weekday:"long", day:"numeric", month:"long"});

/* ---------- Stockage ---------- */
const LS = {get(k){ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } }, set(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }, del(k){ try{ localStorage.removeItem(k); }catch(e){} }};
/* propre à chaque onglet : deux onglets du même navigateur sont deux joueurs différents dans un salon */
const SS = {get(k){ try{ return JSON.parse(sessionStorage.getItem(k)); }catch(e){ return null; } }, set(k,v){ try{ sessionStorage.setItem(k, JSON.stringify(v)); }catch(e){} }, del(k){ try{ sessionStorage.removeItem(k); }catch(e){} }};

/* ---------- Icônes (traits simples, sans emoji) ---------- */
const ICON = {
  flame:`<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 2c1 4 5 5.5 5 11a5 5 0 0 1-10 0c0-2.6 1.4-4 2.5-5 .2 1.8 1 2.8 2 3 0-3.5-.5-6 .5-9z" fill="currentColor"/></svg>`,
  star:`<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z" fill="currentColor"/></svg>`,
  clock:`<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M12 9v4l3 2M9 2h6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>`,
  pitch:`<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M3 12h18M8 3v4h8V3M8 21v-4h8v4" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12" r="2.6" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>`,
  updown:`<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M8 20V5M3.5 9.5 8 5l4.5 4.5M16 4v15M11.5 14.5 16 19l4.5-4.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  users:`<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="9" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M15.5 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c1.8.8 3 2.5 3.5 5.2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  cards:`<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><rect x="7" y="3" width="13" height="17" rx="2.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M4 7.5v11A2.5 2.5 0 0 0 6.5 21H15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  home:`<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M3.5 11 12 4l8.5 7M6 9.5V20h12V9.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  trophy:`<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5M12 14v3M8 20h8M9.5 17h5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  share:`<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="18" cy="5" r="2.6" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="6" cy="12" r="2.6" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="18" cy="19" r="2.6" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="m8.3 10.8 7.4-4.3M8.3 13.2l7.4 4.3" stroke="currentColor" stroke-width="2.2"/></svg>`,
  back:`<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  lock:`<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>`,
  coin:`<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="9.5" fill="#ffd23f" stroke="#c99a00" stroke-width="2"/><circle cx="12" cy="12" r="5.5" fill="none" stroke="#c99a00" stroke-width="1.8"/><path d="M12 8.5v7" stroke="#c99a00" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  pack:`<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M4 7.5 12 12l8-4.5M12 12v9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>`,
  route:`<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="5.5" cy="18.5" r="2.5" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="18.5" cy="5.5" r="2.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M8 18.5h7a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="0.1 3.6"/></svg>`,
  plus:`<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>`
};
