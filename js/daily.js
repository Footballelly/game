/* Football Legends — défi du jour : le même pour tout le monde, un essai par jour, classement en ligne. */
"use strict";

/* rotation : Chrono, Parcours de carrière, Plus ou moins en série — trois modes notés finement, pour un vrai classement.
   (Un joueur par saison est sorti du défi le 15/10 : trop de 11/11, impossible de départager.) */
const fmtDailyScore = (kind, score, total) => kind==="plusmoins" ? `série de ${score}` : kind==="career" ? `${score} pts` : `${score}/${total}`;
function dailyFor(key=todayKey()){
  const n = dayNumber(key), kind = ["chrono","career","plusmoins"][(n-1+300)%3];
  const d = {key, n, kind};
  if(kind==="chrono"){ const l = LISTS[Math.floor((n-1)/3) % LISTS.length]; d.list = l.id; d.title = l.t; d.sub = `Chrono 1 min 30 · ${l.items.length} réponses possibles`; d.time = 90; }
  /* à partir du 16/10 : défi plus accessible (Parcours en Facile, Chrono en 2 min) pour donner envie de revenir */
  d.easy = key >= "2026-10-16";
  if(kind==="chrono" && d.easy){ d.time = 120; d.sub = d.sub.replace("1 min 30", "2 min"); }
  if(kind==="career"){ d.diff = d.easy ? "easy" : "normal"; d.title = "Parcours de carrière"; d.sub = d.easy ? "Les mêmes 10 joueurs connus pour tout le monde · 4 propositions · 30 s par joueur" : "Les mêmes 10 joueurs pour tout le monde · 30 s par joueur · 50 points en jeu"; }
  if(kind==="plusmoins"){ d.theme = ["pl","mod","ldc"][Math.floor((n-1)/3)%3]; d.title = `Plus ou moins : ${PM_THEMES[d.theme].t.toLowerCase()}`; d.sub = "La même série pour tout le monde · une erreur et c'est fini · 20 s par duel"; }
  return d;
}
/* un défi joué sous un autre mode (le défi a changé de formule ce jour-là) ne compte pas */
const dailyDone = (key=todayKey()) => { const r = PROFILE.daily[key]; return r && r.kind===dailyFor(key).kind ? r : null; };
function playDaily(){
  const d = dailyFor(); if(dailyDone()) return;
  if(d.kind==="career") return startCareer(d.diff, {daily:d.key});
  startSolo(d.kind, {daily:d.key, list:d.list, time:d.time, timer:30, theme:d.theme});
}

/* ---------- Texte à partager (façon Wordle) ---------- */
function shareText(key=todayKey()){
  const d = dailyFor(key), r = dailyDone(key); if(!r) return "";
  let line, grid;
  if(d.kind==="chrono"){ line = `${d.title} : ${r.score}/${r.total}`; const k = Math.round(r.score/r.total*10); grid = "🟨".repeat(k)+"⬛".repeat(10-k); }
  else if(d.kind==="saison"){ line = `Un joueur par saison : ${r.score}/11`; grid = (r.detail||[]).map(x => x ? "🟩" : "⬛").join(""); }
  else if(d.kind==="career"){ line = `Parcours de carrière : ${r.score}/${r.total}`; grid = (r.detail||[]).map(x => CAR_EMO(x, d.diff)).join(""); }
  else { line = `${d.title} : série de ${r.score}`; grid = (r.detail||[]).map(x => x ? "🟦" : "🟥").join(""); }
  const st = PROFILE.streak.last===key && PROFILE.streak.count>1 ? `\nSérie : ${PROFILE.streak.count} jours` : "";
  return `Football Legends · Défi n°${d.n}\n${line}\n${grid}${st}\n${SITE_URL}`;
}
/* texte à partager pour n'importe quelle partie qui vient de se terminer */
function shareTextGame(){
  if(VIEW==="career" && L.summary && L.summary.r.mode==="career" && L.summary.r.daily) return shareText(L.summary.r.daily);
  if(VIEW==="career" && L.summary && L.summary.r.mode==="career"){ const r = L.summary.r; return `Football Legends\nParcours de carrière (${DIFFS[r.diff].t}) : ${r.points}/${r.max}\n${r.detail.map(x => CAR_EMO(x, r.diff)).join("")}\nTu fais mieux ? ${SITE_URL}`; }
  if(game && game.daily) return shareText(game.daily);
  const s = L.summary; if(!s) return "";
  const r = s.r; let line, grid = "";
  if(r.mode==="chrono"){ const l = listById(r.list); line = `Chrono ${l.t}${r.time&&r.time!==90?` (${(CH_TIMES.find(x => x[0]===r.time)||[,""])[1]})`:""} : ${r.score}/${r.total}`; const k = Math.round(r.score/r.total*10); grid = "🟨".repeat(k)+"⬛".repeat(10-k); }
  else if(r.mode==="saison"){ line = `Un joueur par saison${r.era==="modern"?" (ère moderne)":""} : ${r.score}/11`; grid = (r.detail||[]).map(x => x ? "🟩" : "⬛").join(""); }
  else { line = r.total ? `Plus ou moins : ${r.score}/${r.total}` : `Plus ou moins (${PM_THEMES[r.theme||"pl"].u}) : série de ${r.score}`; grid = (r.detail||[]).map(x => x ? "🟦" : "🟥").join(""); }
  return `Football Legends\n${line}\n${grid}\nTu fais mieux ? ${SITE_URL}`;
}
async function shareDaily(key){
  const text = key==="game" ? shareTextGame() : shareText(key);
  try{ if(navigator.share){ await navigator.share({text}); return; } }catch(e){ if(e && e.name==="AbortError") return; }
  try{ await navigator.clipboard.writeText(text); toast("Résultat copié, colle-le où tu veux", "ok"); }
  catch(e){ L.shareFallback = text; render(true); }
}

/* ---------- Classement (Supabase) ---------- */
let BOARD = {key:null, data:null, loading:false, err:null};
async function submitDaily(r){
  const client = sb(); if(!client) return;
  try{
    await client.rpc("submit_daily", {p_day:r.daily, p_player:PROFILE.id, p_pseudo:PROFILE.name, p_kind:r.mode, p_score:r.dscore ?? r.score, p_total:r.dtotal ?? (r.total || 0)});
    BOARD.key = null; loadBoard(r.daily);
  }catch(e){ /* le score reste enregistré sur l'appareil */ }
}
async function loadBoard(key=todayKey()){
  const client = sb(); if(!client){ BOARD = {key, data:null, loading:false, err:"Le classement n'est pas disponible hors ligne."}; return; }
  if(BOARD.loading) return;
  BOARD = {key, data:BOARD.key===key ? BOARD.data : null, loading:true, err:null}; render();
  try{
    const {data, error} = await client.rpc("daily_board", {p_day:key, p_player:PROFILE.id, p_kind:dailyFor(key).kind});
    if(error) throw error;
    BOARD = {key, data, loading:false, err:null};
  }catch(e){ BOARD = {key, data:null, loading:false, err:"Impossible de charger le classement pour le moment."}; }
  render();
}
