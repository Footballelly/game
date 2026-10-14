/* Football Legends — rendu, navigation, événements et démarrage. */
"use strict";

const app = document.getElementById("app");
let lastKey = null;
let DEFERRED_INSTALL = null;
const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

function view(){
  if(VIEW==="game" && game) return gameView();
  if(!PROFILE.name) return screenOnboard();
  switch(VIEW){
    case "chronoPick": return screenChronoPick();
    case "pmPick": return screenPmPick();
    case "pack": return screenPack();
    case "career": return screenCareer();
    case "friends": return screenFriends();
    case "collection": return screenCollection();
    case "album": return screenAlbum();
    case "board": return screenBoard();
    default: VIEW = "home"; return screenHome();
  }
}
function render(force){
  const v = view();
  if(!force && v.key===lastKey){ updateLive(v.html); return; }
  const prevBase = lastKey && lastKey.split("-")[0], sameScreen = prevBase && v.key.split("-")[0]===prevBase;
  const y = window.scrollY; lastKey = v.key;
  app.innerHTML = v.html;
  app.classList.toggle("has-tabs", !!app.querySelector(".tabbar"));
  window.scrollTo(0, sameScreen ? y : 0);
  const cg = document.getElementById("chguess"); if(cg) cg.focus({preventScroll:true});
  const cg2 = document.getElementById("carguess"); if(cg2) cg2.focus({preventScroll:true});
  const g = document.getElementById("guess"); if(g && !L.mine){ g.focus({preventScroll:true}); const n = g.value.length; try{ g.setSelectionRange(n,n); }catch(e){} }
  tickClock();
}
function updateLive(html){
  const tmp = document.createElement("div"); tmp.innerHTML = html;
  app.querySelectorAll("[data-live]").forEach(el => { const n = tmp.querySelector(`[data-live="${el.dataset.live}"]`); if(!n) return;
    if(el.hasAttribute("data-html")){ if(el.innerHTML!==n.innerHTML) el.innerHTML = n.innerHTML; } else el.textContent = n.textContent; });
}
function tickClock(){
  document.querySelectorAll("[data-clock]").forEach(el => {
    const left = Math.max(0, Math.ceil((deadline-Date.now())/1000));
    el.textContent = left>=60 ? `${Math.floor(left/60)}:${String(left%60).padStart(2,"0")}` : `${left}s`;
    el.classList.toggle("warn", left<=10);
    if(left<=0 && game && game.phase==="answering" && !L.mine && !game.answeredIds.includes(ME.id)){ L.why = "Temps écoulé."; sendAnswer({st:"none"}); }
  });
  document.querySelectorAll('[data-live="cd"]').forEach(el => el.textContent = fmtCountdown(msToTomorrow()));
}
setInterval(tickClock, 250);
setInterval(() => { if(VIEW!=="game" && document.visibilityState==="visible"){ const k = lastKey; render(); if(k!==lastKey) return; } }, 30000);
function toast(msg, kind){ const t = document.createElement("div"); t.className = "toast"+(kind?" "+kind:""); t.textContent = msg; t.setAttribute("role","status"); document.body.appendChild(t); setTimeout(() => t.remove(), 2200); }
/* petites récompenses sensorielles : vibration (si dispo) et confettis */
function buzz(p){ try{ navigator.vibrate && navigator.vibrate(p); }catch(e){} }
function celebrate(kind){
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const cols = kind==="gold" ? ["#ffd23f","#fff4c2","#e0a800","#ffffff"] : ["#ffd23f","#19c37d","#8fb6ff","#ff4d5e","#ffffff"];
  const box = document.createElement("div"); box.className = "confetti"; box.setAttribute("aria-hidden","true");
  for(let k=0;k<70;k++){ const i = document.createElement("i");
    i.style.cssText = `left:${Math.random()*100}%;background:${cols[k%cols.length]};--x:${(Math.random()-.5)*160}px;--r:${Math.random()*720-360}deg;animation-delay:${Math.random()*.25}s;animation-duration:${1.1+Math.random()*.9}s;${Math.random()<.4?"border-radius:50%;":""}`;
    box.appendChild(i); }
  document.body.appendChild(box); buzz(kind==="gold"?[60,40,140]:40); setTimeout(() => box.remove(), 2400);
}
function revealFx(from, to){
  const p = L.pack; p.anim = [from, to]; p.shown = to; render(true);
  const hasL = p.cards.slice(from, to).findIndex(c => c.rarity==="legend"), hasR = p.cards.slice(from, to).some(c => c.rarity==="rare");
  if(hasL>=0) setTimeout(() => celebrate("gold"), 450 + hasL*260); else if(hasR) setTimeout(() => buzz(35), 450); else buzz(12);
}
function go(v, arg=null){ VIEW = v; VIEW_ARG = arg; L.shareFallback = null; L.packErr = null; if(v==="collection") loadWallet(true); render(true); }

/* ---------- Événements ---------- */
app.addEventListener("submit", e => {
  const f = e.target.dataset.form; if(!f) return; e.preventDefault();
  if(f==="chrono") return chronoGuess(e.target.querySelector("#chguess"));
  if(f==="career") return careerGuess(e.target.querySelector("#carguess"));
  if(f==="answer") return submitGuess(e.target.querySelector("#guess").value);
  if(f==="onboard"){ const v = e.target.querySelector("#ob-name").value.replace(/\s+/g," ").trim().slice(0,18);
    if(v.length<2){ L.err = "Choisis un pseudo d'au moins 2 caractères."; return render(true); }
    PROFILE.name = v; saveProfile(); L.err = null; go("home"); }
});
app.addEventListener("click", e => {
  const el = e.target.closest("[data-act]"); if(!el) return;
  const a = el.dataset.act, v = el.dataset.v;
  switch(a){
    /* navigation */
    case "nav": go(v); break;
    case "album": go("album", v); break;
    case "tohome": leaveGame(false, true); go(v || "home"); break;
    case "quit": leaveGame(false, true); go("home"); break;
    /* solo */
    case "daily": playDaily(); break;
    case "pickpm": go("pmPick"); break;
    case "pm": startSolo("plusmoins", {theme:v||"pl"}); break;
    case "lgfilter": L.lgFilter = v; render(true); break;
    case "colfilter": L.colFilter = v; render(true); break;
    case "openpack": openPack(v); break;
    case "allalbums": L.allAlbums = true; render(true); break;
    case "tear": if(L.pack && !L.pack.tearing){ L.pack.tearing = true; el.classList.add("tearing"); buzz([15,30,15,30,40]);
      setTimeout(() => { if(L.pack){ L.pack.torn = true; render(true); } }, 900); } break;
    case "reveal": if(L.pack) revealFx(L.pack.shown, L.pack.shown+1); break;
    case "revealall": if(L.pack) revealFx(L.pack.shown, L.pack.cards.length); break;
    case "claimalbum": claimAlbum(v); break;
    case "career": startCareer(); break;
    case "carhint": careerHint(null); break;
    case "carskip": if(L.car){ L.car.hist.push(0); L.car.phase = "missed"; L.car.msg = null; render(true); } break;
    case "carnext": careerNext(); break;
    case "sharegame": shareDaily("game"); break;
    case "pmtheme": if(IS_HOST){ G.pmTheme = v; push(); } break;
    case "saison": startSolo("saison", {timer:45}); break;
    case "pickchrono": go("chronoPick"); break;
    case "chrono": startSolo("chrono", {list:v, time:90}); break;
    case "share": shareDaily(game && game.daily ? game.daily : todayKey()); break;
    case "install": if(DEFERRED_INSTALL){ DEFERRED_INSTALL.prompt(); DEFERRED_INSTALL.userChoice.finally(() => { DEFERRED_INSTALL = null; render(true); }); } break;
    case "noinstall": PROFILE.seenInstall = true; saveProfile(); render(true); break;
    /* salon */
    case "create": createGame(); break;
    case "join": joinGame(L.joinCode); break;
    case "leave": leaveGame(); break;
    case "mode": if(IS_HOST){ G.mode = v; push(); } break;
    case "timer": if(IS_HOST){ G.timer = +v; push(); } break;
    case "chlist": if(IS_HOST){ G.chronoList = v; push(); } break;
    case "chtime": if(IS_HOST){ G.chronoTime = +v; push(); } break;
    case "start": if(IS_HOST) hostStart(); break;
    case "next": if(IS_HOST) hostNext(); break;
    case "force": if(IS_HOST) hostForce(); break;
    case "judge": if(IS_HOST) hostJudge(game.round, el.dataset.p, v); break;
    case "lobby": if(IS_HOST) hostLobby(); break;
    /* en partie */
    case "choose": sendAnswer({st:"ok", i:+el.dataset.i}); break;
    case "keep": sendAnswer({st:"pending", raw:L.pendingRaw || L.draft}); break;
    case "skip": L.why = "Tu as séché sur ce poste."; sendAnswer({st:"none"}); break;
    case "pm-pick": L.pmPick = v; act({t:"pick", cur:game.pm.cur, choice:v}); render(); break;
    case "chdone": L.chDone = true; act({t:"chdone"}); render(); break;
    case "sendvotes": L.voted = true; act({t:"votes", ratings:{...L.ratings}}); render(); break;
  }
});
app.addEventListener("input", e => {
  const el = e.target;
  if(el.id==="join-code"){ L.joinCode = el.value.toUpperCase().replace(/[^A-Z]/g,"").slice(0,4); el.value = L.joinCode; }
  if(el.id==="guess") L.draft = el.value;
  if(el.dataset.act==="rate"){ L.ratings[el.dataset.p] = +el.value; const o = document.getElementById(`sv-${el.dataset.p}`); if(o) o.textContent = el.value; }
});
app.addEventListener("keydown", e => { if(e.key==="Enter" && e.target.id==="join-code"){ e.preventDefault(); joinGame(L.joinCode); } });

/* ---------- Appli installable ---------- */
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); DEFERRED_INSTALL = e; if(VIEW==="home") render(true); });
window.addEventListener("appinstalled", () => { DEFERRED_INSTALL = null; PROFILE.seenInstall = true; saveProfile(); });
if("serviceWorker" in navigator && location.protocol==="https:"){ window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {})); }

/* ---------- Démarrage ---------- */
(async () => {
  render(true);
  loadWallet();
  if(location.hash==="#salon") go("friends");
  if(await resumeSession()) render(true);
})();
