/* Football Legends — défi du jour : le même pour tout le monde, un essai par jour, classement en ligne. */
"use strict";

/* rotation : Chrono, Un joueur par saison, Plus ou moins, puis on recommence avec la liste suivante */
function dailyFor(key=todayKey()){
  const n = dayNumber(key), kind = ["chrono","saison","plusmoins"][(n-1+300)%3];
  const d = {key, n, kind};
  if(kind==="chrono"){ const l = LISTS[Math.floor((n-1)/3) % LISTS.length]; d.list = l.id; d.title = l.t; d.sub = `Chrono 1 min 30 · ${l.items.length} réponses possibles`; d.time = 90; }
  if(kind==="saison"){ d.title = "Un joueur par saison"; d.sub = "Les mêmes 11 postes et saisons pour tout le monde · 30 s par manche"; }
  if(kind==="plusmoins"){ d.theme = Math.floor((n-1)/3)%2 ? "ldc" : "pl"; d.title = `Plus ou moins : ${PM_THEMES[d.theme].t.toLowerCase()}`; d.sub = "10 duels · 20 s par duel"; }
  return d;
}
const dailyDone = (key=todayKey()) => PROFILE.daily[key] || null;
function playDaily(){
  const d = dailyFor(); if(dailyDone()) return;
  startSolo(d.kind, {daily:d.key, list:d.list, time:d.time, timer:30, theme:d.theme});
}

/* ---------- Texte à partager (façon Wordle) ---------- */
function shareText(key=todayKey()){
  const d = dailyFor(key), r = dailyDone(key); if(!r) return "";
  let line, grid;
  if(d.kind==="chrono"){ line = `${d.title} : ${r.score}/${r.total}`; const k = Math.round(r.score/r.total*10); grid = "🟨".repeat(k)+"⬛".repeat(10-k); }
  else if(d.kind==="saison"){ line = `Un joueur par saison : ${r.score}/11`; grid = (r.detail||[]).map(x => x ? "🟩" : "⬛").join(""); }
  else { line = `Plus ou moins : ${r.score}/${r.total}`; grid = (r.detail||[]).map(x => x ? "🟦" : "⬛").join(""); }
  const st = PROFILE.streak.last===key && PROFILE.streak.count>1 ? `\nSérie : ${PROFILE.streak.count} jours` : "";
  return `Football Legends · Défi n°${d.n}\n${line}\n${grid}${st}\n${SITE_URL}`;
}
/* texte à partager pour n'importe quelle partie qui vient de se terminer */
function shareTextGame(){
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
    await client.rpc("submit_daily", {p_day:r.daily, p_player:PROFILE.id, p_pseudo:PROFILE.name, p_kind:r.mode, p_score:r.score, p_total:r.total || 0});
    BOARD.key = null; loadBoard(r.daily);
  }catch(e){ /* le score reste enregistré sur l'appareil */ }
}
async function loadBoard(key=todayKey()){
  const client = sb(); if(!client){ BOARD = {key, data:null, loading:false, err:"Le classement n'est pas disponible hors ligne."}; return; }
  if(BOARD.loading) return;
  BOARD = {key, data:BOARD.key===key ? BOARD.data : null, loading:true, err:null}; render();
  try{
    const {data, error} = await client.rpc("daily_board", {p_day:key, p_player:PROFILE.id});
    if(error) throw error;
    BOARD = {key, data, loading:false, err:null};
  }catch(e){ BOARD = {key, data:null, loading:false, err:"Impossible de charger le classement pour le moment."}; }
  render();
}
