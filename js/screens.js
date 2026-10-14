/* Football Legends — écrans. Chaque fonction renvoie {key, html} ; une clé identique = mise à jour partielle (data-live). */
"use strict";

let VIEW = "home";      // onboard | home | chronoPick | friends | collection | album | board | game
let VIEW_ARG = null;

/* ---------- Petits composants ---------- */
const dock = html => `<div class="dock"><div>${html}</div></div>`;
const nameOf = id => (game.players.find(p => p.id===id) || {}).name || "?";
const clock = () => deadline ? `<span class="chip" data-clock>--</span>` : "";
const netBadge = () => `<span class="netbadge${ONLINE?"":" local"}"><i></i>${ONLINE?"En ligne":"Mode test · onglets"}</span>`;
const hostDock = btns => IS_HOST ? dock(`<div class="hostbar">${game.solo?"":`<div class="hosttag">Tu es l'hôte</div>`}${btns}</div>`) : "";
const BALL = `<svg class="ball" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="#f7f5ef" stroke="#0c1240" stroke-width="2.5"/><path d="M16 9.5l5.6 4.1-2.1 6.6h-7l-2.1-6.6z" fill="#0c1240"/><path d="M16 9.5V3.2M21.6 13.6l6-2M19.5 20.2l3.7 5.2M12.5 20.2l-3.7 5.2M10.4 13.6l-6-2" stroke="#0c1240" stroke-width="2"/></svg>`;
function crest(club, w=40){ const k = kitOf(club), c = CLUB[club] || k.s; const t = isLight(c) ? "#0c1240" : "#ffffff";
  return `<svg class="crest" viewBox="0 0 40 44" width="${w}" height="${Math.round(w*1.1)}" aria-hidden="true"><path d="M20 2 L37 8 L37 22 C37 33 29 39 20 42 C11 39 3 33 3 22 L3 8 Z" fill="${c}" stroke="#ffffff" stroke-width="2.5"/>
  <path d="M3 8 L37 8 L37 13 L3 13 Z" fill="${k.t}" opacity=".9"/><text x="20" y="31" text-anchor="middle" font-family="Bungee, Impact, sans-serif" font-size="12" fill="${t}">${esc(initialsOf(club))}</text></svg>`; }
function avatar(e, y, w=46){
  if(!e || e.st==="none" || e.st==="refused") return `<span class="av empty">–</span>`;
  if(e.st==="pending" || e.st==="agreed") return `<span class="av${e.st==="pending"?" pending":""}" style="background:#5a5f86">${esc(initialsOf(e.raw))}</span>`;
  return `<span class="mp">${miniPlayer(kitOf(clubAt(P[e.i], y)), {w, label:`Mini-joueur de ${P[e.i].n}`})}</span>`;
}
const entryName = e => !e || e.st==="none" || e.st==="refused" ? null : e.st==="ok" ? short(P[e.i]) : e.raw;
const seasonOf = id => (game.rounds||[]).find(r => r.slot===id)?.y;
function pitch(team, mini){
  return `<div class="pitch${mini?" mini":""}">${LINES.map(line => `<div class="line">${line.map(id => {
    const s = slotById(id), e = team[id], y = seasonOf(id), nm = entryName(e);
    return `<div class="slot">${e ? avatar(e, y, mini?36:46) : `<span class="av empty"></span>`}<span class="nm">${nm?esc(nm):`<span class="ps">${s.ab}</span>`}</span>${e && y!=null ? `<span class="ssn${nm?"":" ghost"}">${sShort(y)}</span>` : ""}</div>`;
  }).join("")}</div>`).join("")}</div>`;
}
function ticket(r){ const s = slotById(r.slot); return `<div class="ticket"><span class="lab">Poste</span><span class="lab r">Saison</span><span class="pos">${s.fr}</span><span class="yr">${sShort(r.y)}</span></div>`; }
const roundBar = (n, cur) => `<div class="rounds">${Array.from({length:n}, (_,k) => `<i class="${k<cur?"done":k===cur?"now":""}"></i>`).join("")}</div>`;
function tabbar(){
  const t = [["home","Jouer",ICON.home],["collection","Collection",ICON.cards],["board","Classement",ICON.trophy]];
  const cur = ["album","pack"].includes(VIEW) ? "collection" : ["pmPick","chronoPick","career","careerPick"].includes(VIEW) ? "home" : VIEW;
  return `<nav class="tabbar" aria-label="Navigation"><div>${t.map(([v,l,i]) => `<button data-act="nav" data-v="${v}" ${cur===v?'aria-current="page"':""}>${i}<span>${l}</span></button>`).join("")}</div></nav>`;
}
function topbar(){
  const li = levelInfo(), st = WALLET.loaded ? WALLET.streak : streakAlive();
  return `<header class="topbar"><div class="wordmark">${BALL}<div>FOOTBALL<br><span>LEGENDS</span></div></div>
   <div class="tb-right">${coinPill()}<div class="me-pill" title="${esc(titleOf(li.level))}"><span class="lvl">${li.level}</span><span class="nm">${esc(PROFILE.name)}</span>${st?`<span class="st">${ICON.flame}${st}</span>`:""}</div></div></header>`;
}

/* ======================================================================
   ÉCRANS DE L'APPLI
   ====================================================================== */
function screenOnboard(){
  return {key:"onboard"+(L.err||""), html:`
  <div class="onboard">
   <div class="wordmark" style="font-size:20px">${BALL}<div>FOOTBALL<br><span>LEGENDS</span></div></div>
   <h1>Tu connais vraiment le foot ? <span>Prouve-le de mémoire.</span></h1>
   <ul class="pts">
    <li><i>${ICON.clock}</i>Pas de liste, pas d'aide : tu tapes les noms de tête.</li>
    <li><i>${ICON.trophy}</i>Un défi par jour, le même pour tout le monde, avec un classement.</li>
    <li><i>${ICON.cards}</i>Chaque joueur que tu cites rejoint ta collection de cartes.</li>
   </ul>
   <form class="card stack" data-form="onboard" autocomplete="off">
    <div><label class="lbl" for="ob-name">Ton pseudo</label><input class="input" id="ob-name" maxlength="18" value="${esc(PROFILE.name)}" placeholder="Pseudo affiché au classement" autocomplete="nickname"></div>
    ${L.err?`<div class="err" role="alert">${esc(L.err)}</div>`:""}
    <button class="btn ink" type="submit">C'est parti</button>
   </form>
  </div>`};
}
function installBanner(){
  if(PROFILE.seenInstall || isStandalone()) return "";
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if(!DEFERRED_INSTALL && !ios) return "";
  return `<div class="install"><span class="ic">${ICON.plus}</span><p><b>Garde le jeu sur ton téléphone</b>${ios?"Touche Partager, puis « Sur l'écran d'accueil ».":"Il s'ouvre comme une appli, en un geste."}</p>
   ${ios?"":`<button class="btn sm" data-act="install">Installer</button>`}<button class="x" data-act="noinstall" aria-label="Masquer">×</button></div>`;
}
function dailyCard(){
  const d = dailyFor(), r = dailyDone();
  const head = `<span class="tag"><b>Défi n°${d.n}</b>${esc(fmtDayFr(d.key))}</span>`;
  if(!r) return `<section class="daily" aria-label="Défi du jour">${head}<h2>${esc(d.title)}</h2><p>${esc(d.sub)}</p>
    <button class="btn ink" data-act="daily">Jouer le défi du jour</button><span class="next">Un seul essai · nouveau défi dans <span data-live="cd">${fmtCountdown(msToTomorrow())}</span></span></section>`;
  const grid = shareText().split("\n")[2] || "";
  return `<section class="daily" aria-label="Défi du jour">${head}<h2>${esc(d.title)}</h2>
   <div class="done-score"><b>${r.score}</b><span>/ ${r.total}</span></div><div class="grid-emo" aria-hidden="true">${grid}</div>
   <div class="row2"><button class="btn ink sm" data-act="share">${ICON.share} Partager</button><button class="btn ghost-ink sm" data-act="nav" data-v="board">Classement</button></div>
   <span class="next">Prochain défi dans <span data-live="cd">${fmtCountdown(msToTomorrow())}</span></span>
   ${L.shareFallback?`<textarea class="sharebox" readonly aria-label="Texte à copier">${esc(L.shareFallback)}</textarea>`:""}</section>`;
}
function screenHome(){
  const li = levelInfo(), b = PROFILE.best;
  const tile = (act, ic, cls, t, d, rec, extra="") => `<button class="tile" data-act="${act}" ${extra}><span class="ic ${cls}">${ic}</span><span><b>${t}</b><small>${d}</small></span>${rec?`<span class="rec">${rec}</span>`:"<span></span>"}</button>`;
  return {key:"home"+JSON.stringify([dailyDone(), PROFILE.xp, L.shareFallback, !!DEFERRED_INSTALL, PROFILE.seenInstall, WALLET.loaded, WALLET.streak]), html:`
  ${topbar()}
  <div class="xpbar" title="Niveau ${li.level}" aria-label="Progression du niveau ${li.level} : ${li.pct} %"><i style="width:${li.pct}%"></i></div>
  <div style="display:flex;justify-content:space-between;font-family:var(--f-mono);font-size:11px;color:var(--mute);margin:6px 0 14px"><span>${esc(titleOf(li.level))}</span><span>${li.into}/${li.need} XP</span></div>
  ${installBanner()}
  <div style="margin-top:12px">${dailyCard()}</div>
  <div class="sec-title"><h2>Jouer seul</h2><small>sans limite</small></div>
  <div class="tiles">
   ${tile("nav",ICON.route,"r","Parcours de carrière",`Les clubs tombent un par un : trouve le joueur. 3 difficultés.`, b.career||b.career_hard||b.career_easy?"":`<span class="newb">Nouveau</span>`,'data-v="careerPick"')}
   ${tile("pickpm",ICON.updown,"","Plus ou moins","Premier League ou Ligue des champions : enchaîne sans te tromper.", Math.max(b.pm||0,b.pmLdc||0)?`Record<br>${Math.max(b.pm||0,b.pmLdc||0)}`:"")}
   ${tile("pickchrono",ICON.clock,"b","Chrono",`${LISTS.length} listes : PL, Ligue 1, Liga, Serie A, LDC, Bleus…`, "")}
   ${tile("saison",ICON.pitch,"g","Un joueur par saison","11 postes, 11 saisons de PL, de mémoire.", b.saison?`Record<br>${b.saison}/11`:"")}
  </div>
  <div class="sec-title"><h2>Entre potes</h2><small>chacun sur son téléphone</small></div>
  ${tile("nav",ICON.users,"","Jouer avec des amis","Crée un salon ou rejoins-en un avec un code.","",'data-v="friends"')}
  ${tabbar()}`};
}
function screenChronoPick(){
  const f = L.lgFilter || "all", lgs = ["all", ...new Set(LISTS.map(l => l.lg))];
  const shown = LISTS.filter(l => f==="all" || l.lg===f);
  return {key:"chronoPick"+f+(PROFILE.chTime||90), html:`
  <div class="subhead"><button class="iconbtn" data-act="nav" data-v="home" aria-label="Retour">${ICON.back}</button><h1>Chrono</h1></div>
  <p class="muted" style="margin:0 0 12px">Cite un maximum de noms avant la fin du temps. Les fautes de frappe et les surnoms passent.</p>
  <div class="diffbar" role="group" aria-label="Difficulté">${CH_TIMES.map(([t,l,d]) => `<button data-act="chtimesolo" data-v="${t}" aria-pressed="${(PROFILE.chTime||90)===t}"><b>${l}</b><small>${d}</small></button>`).join("")}</div>
  <div class="chips" role="group" aria-label="Compétition">${lgs.map(k => `<button data-act="lgfilter" data-v="${k}" aria-pressed="${f===k}">${k==="all"?"Toutes":esc(LEAGUES[k]||k)}</button>`).join("")}</div>
  <div class="pick-list">${shown.map(l => { const r = PROFILE.best.chrono[chronoKey(l.id, PROFILE.chTime||90)];
    return `<button class="mode" data-act="chrono" data-v="${l.id}"><span class="lgtag">${esc(LEAGUES[l.lg]||"")}</span><b>${esc(l.t)}</b><small>${esc(l.hint)}</small>${r?`<span class="rec">Ton record : ${r}/${l.items.length}</span>`:""}</button>`; }).join("")}</div>
  ${tabbar()}`};
}
function screenPmPick(){
  const b = PROFILE.best;
  return {key:"pmPick", html:`
  <div class="subhead"><button class="iconbtn" data-act="nav" data-v="home" aria-label="Retour">${ICON.back}</button><h1>Plus ou moins</h1></div>
  <p class="muted" style="margin:0 0 14px">Le joueur suivant a-t-il marqué plus ou moins ? Une erreur et la série s'arrête.</p>
  <div class="pick-list">
   <button class="mode" data-act="pm" data-v="pl"><span class="lgtag">Premier League</span><b>Buts en Premier League</b><small>${GOALS.length} buteurs qui ont quitté la PL, chiffres vérifiés.</small>${b.pm?`<span class="rec">Ton record : ${b.pm}</span>`:""}</button>
   <button class="mode" data-act="pm" data-v="ldc"><span class="lgtag">Ligue des champions</span><b>Buts en Ligue des champions</b><small>${GOALS_UCL.length} légendes de la C1, de Di Stéfano à Benzema.</small>${b.pmLdc?`<span class="rec">Ton record : ${b.pmLdc}</span>`:""}</button>
  </div>
  ${tabbar()}`};
}

function screenFriends(){
  return {key:"friends"+L.busy+(L.err||""), html:`
  <div class="subhead"><button class="iconbtn" data-act="nav" data-v="home" aria-label="Retour">${ICON.back}</button><h1>Entre potes</h1><span style="margin-left:auto">${netBadge()}</span></div>
  ${ONLINE?"":`<div class="card" style="font-size:14px;margin-bottom:12px"><b>Mode test.</b> Ouvre la page dans plusieurs onglets pour simuler plusieurs téléphones.</div>`}
  <div class="card friends">
   <p style="margin:0;color:var(--ink-soft)">Tu joues sous le pseudo <b style="color:var(--ink)">${esc(PROFILE.name)}</b>. Chacun joue sur son téléphone, le débat se fait en vrai.</p>
   <button class="btn ink" data-act="create" ${L.busy?"disabled":""}>Créer un salon</button>
   <div class="or">ou rejoindre</div>
   <div class="row"><input class="input code" id="join-code" maxlength="4" value="${esc(L.joinCode)}" placeholder="CODE" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Code du salon">
    <button class="btn" data-act="join" ${L.busy?"disabled":""}>Rejoindre</button></div>
   ${L.err?`<div class="err" role="alert">${esc(L.err)}</div>`:""}
  </div>
  ${tabbar()}`};
}
function screenCollection(){
  if(!WALLET.loaded && !WALLET.loading && !WALLET.err) setTimeout(() => loadWallet(), 0);
  const own = ownedIds(), byR = r => own.filter(id => CARD.get(id).r===r).length, tot = r => CARDS.filter(c => c.r===r).length;
  const f = L.colFilter || "all";
  const shown = own.filter(id => { const c = CARD.get(id); return f==="all" || c.r===f || c.lg===f; })
    .sort((a,b) => (RORD[CARD.get(a).r] - RORD[CARD.get(b).r]) || CARD.get(a).n.localeCompare(CARD.get(b).n));
  const al = ALBUMS.map(a => ({...a, ...albumState(a)})).sort((a,b) => b.claimable-a.claimable || b.got/b.ids.length - a.got/a.ids.length || b.ids.length - a.ids.length);
  const nFull = al.filter(a => a.full).length, nClaim = al.filter(a => a.claimable).length;
  const packBtn = k => { const p = PACKS[k], ok = WALLET.loaded && WALLET.coins>=p.price;
    return `<button class="pack pack-${k}" data-act="openpack" data-v="${k}" ${ok&&!L.opening?"":"disabled"}><span class="pk-box">${ICON.pack}</span><span><b>${p.t}</b><small>${p.d}</small></span><span class="pk-price">${ICON.coin}${p.price}</span></button>`; };
  const filters = [["all","Toutes"],["icon","Icônes"],["legend","Légendes"],["rare","Pépites"],["common","Communes"],["pl","Premier League"],["l1","Ligue 1"],["liga","Liga"],["seriea","Serie A"],["europe","Europe"]];
  return {key:"collection"+JSON.stringify([own.length, WALLET.coins, WALLET.loaded, WALLET.err, f, L.opening, L.packErr, !!L.allAlbums, WALLET.albums.length, L.claiming]), html:`
  ${topbar()}
  ${WALLET.err?`<div class="empty">${esc(WALLET.err)}</div>`:`
  <div class="stats3"><div class="stat"><b>${own.length}</b><small>cartes sur ${CARDS.length}</small></div><div class="stat"><b>${byR("legend")}</b><small>légendes sur ${tot("legend")}</small></div><div class="stat icon"><b>${byR("icon")}</b><small>icônes sur ${tot("icon")}</small></div></div>
  ${nClaim?`<button class="claimbar" data-act="album" data-v="${esc(al[0].club)}">${ICON.star}<span><b>${plural(nClaim,"album")} à réclamer</b>Ton bonus de pièces t'attend</span>${ICON.coin}</button>`:""}
  <div class="sec-title"><h2>Boutique</h2><small>tu gagnes des pièces en jouant</small></div>
  <div class="packs">${packBtn("classic")}${packBtn("gold")}</div>
  ${L.packErr?`<div class="err" role="alert" style="margin-top:10px">${esc(L.packErr)}</div>`:""}
  <p class="solo-note" style="margin-top:8px">Une carte en double te rembourse des pièces : 10 pour une commune, 25 pour une pépite, 60 pour une légende, 150 pour une icône.</p>
  <div class="sec-title"><h2>Ma collection</h2><small>${plural(own.length,"carte")}</small></div>
  <div class="chips" role="group" aria-label="Filtrer">${filters.map(([k,l]) => `<button data-act="colfilter" data-v="${k}" aria-pressed="${f===k}">${l}</button>`).join("")}</div>
  ${!WALLET.loaded?`<div class="empty">Chargement de ta collection…</div>`:shown.length?`<div class="fgrid">${shown.map(id => cardHTML(id,{count:WALLET.cards[id]})).join("")}</div>`
    :`<div class="empty">${own.length?"Aucune carte dans ce filtre pour l'instant.":"Ta collection est vide. Ouvre ton premier pack : tu as reçu 150 pièces de bienvenue."}</div>`}
  <div class="sec-title"><h2>Albums par club</h2><small>${nFull}/${al.length} complétés</small></div>
  <p class="solo-note" style="margin:0 0 10px">Complète un album pour toucher un gros bonus de pièces, une seule fois par club.</p>
  <div class="albums">${(L.allAlbums?al:al.slice(0,10)).map(a => `<button class="album${a.full?" full":""}${a.claimable?" claim":""}" data-act="album" data-v="${esc(a.club)}">${crest(a.club)}<span><b>${esc(a.club)}</b><span class="xpbar"><i style="width:${Math.round(a.got/a.ids.length*100)}%"></i></span></span><span class="cnt">${a.claimable?`<span class="claimtag">${ICON.coin}+${albumBonus(a.ids.length)}</span>`:a.claimed?`${ICON.star} Complet`:`${a.got}/${a.ids.length}`}</span></button>`).join("")}</div>${!L.allAlbums&&al.length>10?`<button class="btn ghost" style="margin-top:10px" data-act="allalbums">Voir les ${al.length} albums</button>`:""}`}
  ${tabbar()}`};
}

function screenAlbum(){
  const A = ALBUMS.find(a => a.club===VIEW_ARG);
  if(!A){ VIEW = "collection"; return screenCollection(); }
  const ids = [...A.ids].sort((a,b) => (RORD[CARD.get(a).r]-RORD[CARD.get(b).r]) || CARD.get(a).n.localeCompare(CARD.get(b).n));
  const st = albumState(A), bonus = albumBonus(ids.length);
  const banner = st.claimable ? `<div class="albumprize ready">${ICON.star}<span><b>Album complété !</b>Récupère ton bonus de ${bonus} pièces.</span><button class="btn ink sm" data-act="claimalbum" data-v="${esc(A.club)}" ${L.claiming?"disabled":""}>${ICON.coin} +${bonus}</button></div>`
    : st.claimed ? `<div class="albumprize done">${ICON.star}<span><b>Album complété</b>Bonus de ${bonus} pièces récupéré.</span></div>`
    : `<div class="albumprize">${ICON.coin}<span><b>Bonus : ${bonus} pièces</b>Il te manque ${plural(ids.length-st.got,"carte")}. Elles s'obtiennent dans les packs.</span></div>`;
  return {key:"album"+VIEW_ARG+st.got+st.claimed+L.claiming, html:`
  <div class="subhead"><button class="iconbtn" data-act="nav" data-v="collection" aria-label="Retour">${ICON.back}</button>${crest(VIEW_ARG,34)}<h1>${esc(VIEW_ARG)}</h1><span class="chip" style="margin-left:auto">${st.got}/${ids.length}</span></div>
  ${banner}
  <div class="fgrid" style="margin-top:14px">${ids.map(id => cardHTML(id, {locked:!WALLET.cards[id], small:true, count:WALLET.cards[id]})).join("")}</div>
  ${tabbar()}`};
}
function screenPack(){
  const p = L.pack; if(!p){ VIEW = "collection"; return screenCollection(); }
  const all = p.shown>=p.cards.length, best = p.cards.reduce((m,c) => Math.max(m, {common:0,rare:1,legend:2,icon:3}[c.rarity]), 0), tier = ["c","r","l","l"][best];
  if(!p.torn) return {key:"pack-sealed"+p.kind+p.cards.map(c => c.id).join(), html:`
  <div class="pack-stage sealed">
   <span class="eyebrow">${esc(PACKS[p.kind].t)}</span>
   <button class="bigpack pack-${p.kind} glow-${tier}" data-act="tear" aria-label="Ouvrir le pack">
    <span class="bp-top"></span><span class="bp-logo">${BALL}<b>FOOTBALL<br>LEGENDS</b></span><span class="bp-name">${esc(PACKS[p.kind].t)}</span><span class="bp-n">3 cartes</span>
   </button>
   <p class="muted">Touche le pack pour le déchirer</p>
  </div>`};
  const [a0, a1] = p.anim || [0,0];
  const face = (c,i) => { const anim = i>=a0 && i<a1, legend = c.rarity==="legend" || c.rarity==="icon";
    return `<div class="fl3${anim?" turn":""}${legend?" is-l":""}" style="--d:${anim?(i-a0)*260:0}ms">${legend?`<span class="rays" aria-hidden="true"></span>`:""}<div class="fl3-in">
      <div class="fl3-front">${cardHTML(c.id,{tag:c.new?`<span class="newtag">Nouvelle</span>`:`<span class="duptag">Doublon</span>`})}</div>
      <div class="fl3-back flip back r-${c.rarity}" aria-hidden="true">${ICON.pack}<span>?</span></div></div></div>`; };
  return {key:"pack"+p.shown+"-"+p.cards.map(c => c.id).join(), html:`
  <div class="pack-stage tier-${all?tier:"c"}">
   <span class="eyebrow">${esc(PACKS[p.kind].t)}</span>
   <h1 class="display" style="font-size:clamp(30px,9vw,42px)">${all?(best===3?"Une <span>icône</span> !!":best===2?"Une <span>légende</span> !":best===1?"Une <span>pépite</span> !":"Pack <span>ouvert</span>"):"Touche une carte <span>pour la retourner</span>"}</h1>
   <div class="pack-cards">${p.cards.map((c,i) => i<p.shown ? face(c,i)
     : `<button class="flip back deal r-${c.rarity}" style="--d:${i*120}ms" data-act="reveal" aria-label="Retourner la carte ${i+1}">${ICON.pack}<span>?</span></button>`).join("")}</div>
   ${all&&p.refund?`<p class="muted" style="text-align:center">Doublons remboursés : <b style="color:var(--flash)">+${p.refund} pièces</b></p>`:""}
  </div>
  ${all?dock(`<button class="btn" data-act="openpack" data-v="${p.kind}" ${WALLET.coins>=PACKS[p.kind].price?"":"disabled"}>Ouvrir un autre ${esc(PACKS[p.kind].t)} (${WALLET.coins} pièces)</button><button class="btn ghost" data-act="nav" data-v="collection">Voir ma collection</button>`)
     :dock(`<button class="btn ghost" data-act="revealall">Tout retourner</button>`)}`};
}

function screenBoard(){
  const d = dailyFor(), r = dailyDone();
  if(BOARD.key!==d.key && !BOARD.loading) setTimeout(() => loadBoard(d.key), 0);
  const data = BOARD.key===d.key ? BOARD.data : null;
  let body;
  if(BOARD.err) body = `<div class="empty">${esc(BOARD.err)}</div>`;
  else if(!data) body = `<div class="empty">Chargement du classement…</div>`;
  else if(!data.count) body = `<div class="empty">Personne n'a encore joué le défi n°${d.n}. Sois le premier au classement.</div>`;
  else body = `<div class="board">${data.top.map(x => `<div class="brow${x.me?" me":""}${x.rank===1?" top1":""}"><span class="rk">${x.rank}</span><b>${esc(x.pseudo)}${x.me?" (toi)":""}</b><span class="sc">${x.score}/${x.total}</span></div>`).join("")}
    ${data.me && data.me.rank>50 ? `<div class="brow me"><span class="rk">${data.me.rank}</span><b>${esc(PROFILE.name)} (toi)</b><span class="sc">${data.me.score}/${data.me.total}</span></div>` : ""}</div>`;
  return {key:"board"+JSON.stringify([BOARD.key, data, BOARD.err, !!r]), html:`
  ${topbar()}
  <div class="daily" style="margin-bottom:14px"><span class="tag"><b>Défi n°${d.n}</b>${esc(fmtDayFr(d.key))}</span><h2>${esc(d.title)}</h2>
   <p>${data && data.count ? `${plural(data.count,"joueur")} aujourd'hui${data.me?` · tu es ${data.me.rank===1?"1er":data.me.rank+"e"}`:""}` : "Classement du jour"}</p>
   ${r?"":`<button class="btn ink" data-act="daily">Jouer pour apparaître au classement</button>`}</div>
  ${body}
  <p class="solo-note" style="margin-top:14px">À égalité, le premier à avoir joué passe devant. Le classement repart de zéro chaque jour.</p>
  ${tabbar()}`};
}

/* ======================================================================
   ÉCRANS DE PARTIE
   ====================================================================== */
function gameTop(title, right=""){
  const quit = game && game.daily ? "" : `<button class="iconbtn" data-act="quit" aria-label="Quitter la partie">${ICON.back}</button>`;
  return `<div class="bar" style="justify-content:flex-start">${quit}<h2 style="flex:1">${title}</h2>${right}</div>`;
}
function screenLobby(){
  const g = game, n = g.players.length;
  return {key:"lobby"+JSON.stringify([g.players, g.mode, g.timer, g.chronoList, g.chronoTime, g.pmTheme]), html:`
  <div class="stack">
   <div style="display:flex;justify-content:space-between;align-items:center"><span class="eyebrow">Salon</span>${netBadge()}</div>
   <div class="codebox"><div class="lbl" style="margin:0">Code de la partie</div><div class="display">${esc(g.code)}</div><div class="hint">Tes potes ouvrent ${SITE_URL}, puis « Jouer avec des amis » et tapent ce code.</div></div>
   <div><div class="eyebrow" style="margin-bottom:8px">${plural(n,"joueur")} dans le salon</div>
    <div class="people">${g.players.map(p => `<span class="person${p.id===ME.id?" me":""}"><span class="dot">${esc(initialsOf(p.name))}</span><span>${esc(p.name)}${p.id===g.host?" · hôte":""}</span></span>`).join("")}</div></div>
   ${IS_HOST?`<div class="card stack">
     <div><span class="lbl">Mode de jeu</span><div class="modes">${Object.entries(MODES).map(([k,m]) => `<button class="mode" data-act="mode" data-v="${k}" aria-pressed="${g.mode===k}"><b>${m.t}</b><small>${m.d}</small></button>`).join("")}</div></div>
     ${g.mode==="chrono"?`<div><span class="lbl">Liste</span><div class="modes">${[["random","Au hasard","Une liste surprise à chaque partie."], ...LISTS.map(l => [l.id, l.t, `${l.items.length} réponses possibles`])].map(([k,t2,d]) => `<button class="mode" data-act="chlist" data-v="${k}" aria-pressed="${g.chronoList===k}"><b>${esc(t2)}</b><small>${esc(d)}</small></button>`).join("")}</div></div>
     <div><span class="lbl">Durée</span><div class="seg">${[[60,"1 min"],[90,"1 min 30"],[120,"2 min"]].map(([v,l]) => `<button data-act="chtime" data-v="${v}" aria-pressed="${g.chronoTime===v}">${l}</button>`).join("")}</div></div>`
     :`${g.mode==="plusmoins"?`<div><span class="lbl">Thème</span><div class="seg">${Object.entries(PM_THEMES).map(([k,v]) => `<button data-act="pmtheme" data-v="${k}" aria-pressed="${g.pmTheme===k}">${k==="ldc"?"Ligue des champions":"Premier League"}</button>`).join("")}</div></div>`:""}<div><span class="lbl">Temps par manche</span><div class="seg">${[[0,"Sans"],[15,"15 s"],[30,"30 s"],[45,"45 s"]].map(([v,l]) => `<button data-act="timer" data-v="${v}" aria-pressed="${g.timer===v}">${l}</button>`).join("")}</div>
      <div class="hint">Sans chrono, c'est toi qui clôtures chaque manche.</div></div>`}
    </div>`:`<div class="card"><h3>${esc(MODES[g.mode].t)}</h3><p style="margin:6px 0 0;color:var(--ink-soft)">${esc(MODES[g.mode].d)}</p>${g.mode==="chrono"?`<p class="hint">Liste : ${esc(g.chronoList==="random"?"au hasard":(listById(g.chronoList)||{}).t||"")}</p>`:""}<p class="hint">En attente de ${esc(nameOf(g.host))} pour lancer.</p></div>`}
  </div>
  ${IS_HOST?dock(`<button class="btn" data-act="start" ${n<2?"disabled":""}>${n<2?"En attente d'un autre joueur":`Lancer avec ${n} joueurs`}</button><button class="btn ghost" data-act="leave">Fermer le salon</button>`)
           :dock(`<button class="btn ghost" data-act="leave">Quitter le salon</button>`)}`};
}
function msgBox(m){
  if(m.kind==="ambig") return `<div class="msg info">Plusieurs joueurs correspondent. Lequel ?<div class="opts">${m.opts.map(i => `<button type="button" data-act="choose" data-i="${i}">${esc(P[i].n)} · ${esc(clubAt(P[i], game.rounds[game.round].y))}</button>`).join("")}</div></div>`;
  if(m.kind==="unknown") return game.solo
    ? `<div class="msg info">« ${esc(m.raw)} » n'est pas dans notre base pour ce poste. Vérifie l'orthographe ou essaie un autre joueur.</div>`
    : `<div class="msg info">« ${esc(m.raw)} » n'est pas dans notre base. Vérifie l'orthographe, ou garde ta réponse : le groupe tranchera.<div class="opts"><button type="button" data-act="keep">Garder ma réponse</button></div></div>`;
  return `<div class="msg bad">${esc(m.text)}${m.contest && !game.solo?`<div class="opts"><button type="button" data-act="keep">Contester, le groupe tranchera</button></div>`:""}</div>`;
}
function screenAnswering(){
  const g = game, r = g.rounds[g.round];
  if(L.round!==g.round){ const keep = L.ver; Object.assign(L, {round:g.round, draft:"", tries:0, msg:null, pendingRaw:null, why:null, mine:null}); L.ver = keep+1; }
  const done = !!L.mine || g.answeredIds.includes(ME.id);
  const count = g.solo ? "" : `réponses reçues <span data-live="count">${g.answeredIds.length}/${g.players.length}</span>`;
  const head = `${roundBar(11, g.round)}${gameTop(`Manche ${g.round+1}/11`, clock())}${ticket(r)}`;
  if(done){
    const e = L.mine || {st:"none"};
    const lab = e.st==="ok" ? `<span class="stamp ok">Validé</span>` : e.st==="pending" ? `<span class="stamp pending">Le groupe tranchera</span>` : `<span class="stamp none">Poste vide</span>`;
    const title = e.st==="ok" ? esc(P[e.i].n) : e.st==="pending" ? esc(e.raw) : "Raté";
    return {key:`ans-${g.round}-done`, html:`${head}
     <div class="waitcard pop">${lab}<div class="big">${avatar(e, r.y, 64)}<div><h2 class="display" style="font-size:26px">${title}</h2>
       <p class="muted" style="margin:4px 0 0">${e.st==="ok" ? esc(clubAt(P[e.i], r.y)) : esc(L.why||"")}</p></div></div>
       ${g.solo?"":`<p class="muted">${count}. On attend les autres.</p>`}</div>
     ${g.solo?"":hostDock(`<button class="btn ghost" data-act="force">Clôturer la manche maintenant</button>`)}`};
  }
  return {key:`ans-${g.round}-open-${L.ver}`, html:`${head}
   <form class="answer" data-form="answer" autocomplete="off">
    <label class="eyebrow" for="guess">Ton joueur, de mémoire</label>
    <input id="guess" name="guess" autocomplete="off" autocorrect="off" autocapitalize="words" spellcheck="false" enterkeyhint="done" placeholder="Nom du joueur" value="${esc(L.draft)}">
    <div class="tries">${Array.from({length:MAX_TRIES}, (_,k) => `<i class="${k<L.tries?"used":""}"></i>`).join("")}<span>${plural(MAX_TRIES-L.tries,"essai")}${count?` · ${count}`:""}</span></div>
    ${L.msg ? msgBox(L.msg) : ""}
    <button class="btn ink" type="submit">Valider</button>
    <button class="linkbtn" type="button" data-act="skip">Je sèche, laisser le poste vide</button>
   </form>
   ${g.solo?"":hostDock(`<button class="btn ghost" data-act="force">Clôturer la manche maintenant</button>`)}`};
}
function screenRoundResult(){
  const g = game, r = g.rounds[g.round], rv = g.revealed[g.round] || {}, pend = Object.values(rv).filter(e => e.st==="pending").length;
  return {key:"rr"+JSON.stringify([g.round, rv]), html:`
   ${roundBar(11, g.round)}${gameTop(`Manche ${g.round+1}/11`, `<span class="chip">${g.solo?"Résultat":"Réponses"}</span>`)}
   ${ticket(r)}
   <div class="picks">${g.players.map(p => { const e = rv[p.id] || {st:"none"};
     let main = e.st==="ok" ? `<b>${esc(P[e.i].n)}${isGem(g.round, p.id)?`<span class="gem">Exclu</span>`:""}</b><small>${esc(clubAt(P[e.i], r.y))}</small>`
       : e.st==="pending" ? `<b>${esc(e.raw)}</b><small>À valider</small>`
       : e.st==="agreed" ? `<b>${esc(e.raw)}${isGem(g.round, p.id)?`<span class="gem">Exclu</span>`:""}</b><small>Validé par le groupe</small>`
       : e.st==="refused" ? `<b><s>${esc(e.raw)}</s></b><small>Refusé par le groupe</small>` : `<b>Poste vide</b><small>Pas de réponse valide</small>`;
     const j = e.st==="pending" ? (IS_HOST ? `<div class="judge">Il jouait bien là en ${sLbl(r.y)} ? <button class="yes" data-act="judge" data-p="${p.id}" data-v="ok">Validé</button><button class="no" data-act="judge" data-p="${p.id}" data-v="refused">Refusé</button></div>`
       : `<div class="judge">Débattez : l'hôte valide ou refuse.</div>`) : "";
     return `<div class="pick"><span>${avatar(e, r.y, 40)}</span><span><span class="who">${esc(p.name)}${p.id===ME.id&&!g.solo?" · toi":""}</span>${main}</span>${j}</div>`; }).join("")}</div>
   <div style="margin-top:20px"><div class="eyebrow" style="margin-bottom:8px">Ton 11</div>${pitch(myTeam(), true)}</div>
   ${g.solo ? dock(`<p class="solo-note">Manche suivante…</p>`)
     : IS_HOST ? hostDock(`<button class="btn" data-act="next" ${pend?"disabled":""}>${pend?`Tranchez ${plural(pend,"réponse")} d'abord`:g.round<10?"Manche suivante":"Passer au vote"}</button>`)
     : dock(`<p class="muted" style="text-align:center;margin:0">${pend?"L'hôte tranche les réponses contestées.":"En attente de l'hôte pour la suite."}</p>`)}`};
}
function screenVoting(){
  const g = game, others = g.players.filter(p => p.id!==ME.id);
  const voted = L.voted || g.votedIds.includes(ME.id);
  others.forEach(p => { if(L.ratings[p.id]==null) L.ratings[p.id] = 5; });
  const count = `<span data-live="count">${g.votedIds.length}/${g.players.length}</span>`;
  if(voted) return {key:"vote-done", html:`<div class="stack"><div class="hero"><span class="eyebrow">Vote</span><h1 class="display" style="font-size:42px">Notes <span>envoyées</span></h1>
    <p>Votes reçus : ${count}. Les résultats arrivent quand tout le monde a voté.</p></div><div><div class="eyebrow" style="margin-bottom:8px">Ton 11</div>${pitch(myTeam(), true)}</div></div>
    ${hostDock(`<button class="btn ghost" data-act="force">Afficher les résultats maintenant</button>`)}`};
  return {key:"vote-open", html:`
   <div class="bar"><h2>Note les équipes</h2><span class="chip">${count}</span></div>
   <div class="stack">${others.map(p => `<div class="card">
     <div class="teamhead"><h2>${esc(p.name)}</h2></div>${pitch(myTeam(p.id), true)}
     <div class="rate"><div class="rate-top"><label for="r-${p.id}" style="font-weight:800">Ta note</label><span class="score" id="sv-${p.id}">${L.ratings[p.id]}</span></div>
      <input type="range" id="r-${p.id}" min="0" max="10" step="1" value="${L.ratings[p.id]}" data-act="rate" data-p="${p.id}"></div></div>`).join("")}</div>
   ${dock(`<button class="btn" data-act="sendvotes">Envoyer mes notes</button>`)}`};
}
/* bilan commun à toutes les fins de partie */
function summaryBlock(){
  const s = L.summary; if(!s) return "";
  return `<div class="summary">
    <div class="xpline"><b>+${s.xp} XP</b>${s.levelUp?`<span class="lvup">${ICON.star} Niveau ${s.levelUp}</span>`:`<span class="muted" style="color:var(--ink-soft);font-size:13px">Niveau ${levelInfo().level}</span>`}</div>
    <div class="xpbar"><i style="width:${levelInfo().pct}%"></i></div>
    ${s.rec.length||(s.streak&&!s.bonus)?`<div class="recs">${s.rec.map(x => `<span>${esc(x)}</span>`).join("")}${s.streak&&!s.bonus?`<span>Série : ${plural(s.streak,"jour")}</span>`:""}</div>`:""}
    <div class="coinline">${ICON.coin}<span>${s.coins==null?"Pièces en cours de calcul…":s.coins===0?"Plafond de pièces du jour atteint":`<b>+${s.coins}</b> pièces`}</span>${s.bonus?`<span class="bonus">${ICON.flame} Série de ${plural(s.bonus.streak,"jour")} : <b>+${s.bonus.amount}</b></span>`:""}</div>
    ${WALLET.loaded&&WALLET.coins>=PACKS.classic.price?`<button class="btn ink sm" data-act="tohome" data-v="collection">${ICON.pack} Ouvrir un pack (${WALLET.coins} pièces)</button>`:""}
  </div>`;
}
function endButtons(replayAct){
  if(game.daily) return dock(`<button class="btn" data-act="share">${ICON.share} Partager mon résultat</button><button class="btn ghost" data-act="tohome" data-v="board">Voir le classement</button>`);
  if(game.solo) return dock(`<button class="btn" data-act="${replayAct}" ${replayAct==="pm"?`data-v="${game.pmTheme}"`:""}>Rejouer</button><div class="row2"><button class="btn ghost" data-act="sharegame">${ICON.share} Partager</button><button class="btn ghost" data-act="tohome">Accueil</button></div>`);
  return IS_HOST ? hostDock(`<button class="btn" data-act="lobby">Retour au salon</button>`) : dock(`<p class="muted" style="text-align:center;margin:0">L'hôte peut relancer une partie.</p>`);
}
function screenResults(){
  const g = game;
  if(g.mode==="plusmoins"){
    const res = g.players.map(p => ({name:p.name, id:p.id, sc:g.pm.scores[p.id]||0})).sort((a,b) => b.sc-a.sc), w = res[0], tie = res.length>1 && res[1].sc===w.sc;
    const title = g.solo ? (g.pm.endless ? `Série de <span>${w.sc}</span>` : `${w.sc} <span>sur ${PM_DUELS}</span>`) : tie ? `Égalité <span>parfaite</span>` : `${esc(w.name)} <span>gagne</span>`;
    return {key:"res-pm"+g.gameNo, html:`<div class="stack">
     <div class="hero"><span class="eyebrow">${g.daily?`Défi n°${dayNumber(g.daily)} · `:""}Plus ou moins</span><h1 class="display" style="font-size:clamp(36px,11vw,52px)">${title}</h1>
      ${g.pm.endless?`<p>${PM_THEMES[g.pmTheme].t} · ${w.sc>=(PROFILE.best[g.pmTheme==="ldc"?"pmLdc":"pm"]||0)?"Nouveau record personnel.":`Ton record : ${PROFILE.best[g.pmTheme==="ldc"?"pmLdc":"pm"]}.`}</p>`:""}</div>
     ${g.solo?"":`<div class="podium">${res.map((r,k) => `<div class="pod${k===0?" first":""}"><span class="rk">${k+1}</span><b>${esc(r.name)}</b><span class="sc">${r.sc}/${PM_DUELS}</span></div>`).join("")}</div>`}
     ${summaryBlock()}</div>${endButtons("pm")}`};
  }
  const res = rankingSaison(), w = res[0], tie = res.length>1 && res[1].avg===w.avg;
  const mine = myTeam(), filled = Object.values(mine).filter(e => ["ok","agreed"].includes(e.st)).length;
  return {key:"res-s"+g.gameNo, html:`<div class="stack">
   <div class="hero"><span class="eyebrow">${g.daily?`Défi n°${dayNumber(g.daily)} · `:""}Un joueur par saison</span><h1 class="display" style="font-size:clamp(36px,11vw,52px)">${g.solo?`${filled} <span>sur 11</span>`:tie?`Égalité, <span>débat obligatoire</span>`:`${esc(w.name)} <span>gagne</span>`}</h1></div>
   ${g.solo?"":`<div class="podium">${res.map((r,k) => `<div class="pod${k===0?" first":""}"><span class="rk">${k+1}</span><span><b>${esc(r.name)}</b><small>${r.filled}/11 postes · ${plural(r.gems,"exclu")}</small></span><span class="sc">${r.avg.toFixed(1)}/10</span></div>`).join("")}</div>`}
   <div><div class="eyebrow" style="margin-bottom:8px">${g.solo?"Ton 11":"Carte à partager"}</div>
    <div class="share"><div class="share-top"><div><div class="eyebrow">Un joueur par saison · PL</div><div class="display">${esc(g.solo?PROFILE.name:w.name)}</div></div><span class="badge">${g.solo?`${filled}/11`:w.avg.toFixed(1)}</span></div>
     ${pitch(myTeam(g.solo?ME.id:w.id), true)}<div class="share-foot"><span>De mémoire · 04/05 → 14/15</span><span>FOOTBALL LEGENDS</span></div></div></div>
   ${summaryBlock()}</div>${endButtons("saison")}`};
}
function duelCards(A, B, showB, theme="pl"){ const U = PM_THEMES[theme].u;
  return `<div class="duel">
   <div class="card"><span class="lbl" style="margin:0">Référence</span><span class="nm">${esc(A.n)}</span><span class="clubs">${esc(A.c)}</span><span class="val">${A.g}<small>${U}</small></span></div>
   <div class="vs">VS</div>
   <div class="card"><span class="lbl" style="margin:0">Il en a plus ou moins ?</span><span class="nm">${esc(B.n)}</span><span class="clubs">${esc(B.c)}</span>
    ${showB?`<span class="val pop">${B.g}<small>${U}</small></span>`:`<span class="hidden">???</span>`}</div></div>`;
}
function screenPmAsk(){
  const g = game, GS = goalsOf(g.pmTheme), A = GS[g.chain[g.pm.cur]], B = GS[g.chain[g.pm.cur+1]], rk = g.pmTheme==="ldc" ? "pmLdc" : "pm";
  if(L.pmCur!==g.pm.cur){ L.pmCur = g.pm.cur; L.pmPick = null; }
  const picked = L.pmPick || (g.pickedIds.includes(ME.id) ? "?" : null);
  const count = `<span data-live="count">${g.pickedIds.length}/${g.players.length}</span>`;
  const head = g.pm.endless ? gameTop(`Série : ${g.pm.scores[ME.id]||0}`, PROFILE.best[rk]?`<span class="chip">Record ${PROFILE.best[rk]}</span>`:"")
    : `${roundBar(PM_DUELS, g.pm.cur)}${gameTop(`Duel ${g.pm.cur+1}/${PM_DUELS}`, clock())}`;
  return {key:`pm-${g.pm.cur}-${picked}`, html:`${head}
   ${duelCards(A, B, false, g.pmTheme)}
   <div class="choices"><button class="btn${picked==="plus"?" sel":""}" data-act="pm-pick" data-v="plus" ${picked?"disabled":""}>Plus</button><button class="btn${picked==="moins"?" sel":""}" data-act="pm-pick" data-v="moins" ${picked?"disabled":""}>Moins</button></div>
   ${g.solo?`<p class="solo-note">${g.pm.endless?"Une erreur et la série s'arrête. En cas d'égalité, c'est gagné.":"En cas d'égalité, c'est gagné."}</p>`
     :`<p class="muted" style="font-size:14px">${picked?`Choix envoyé. Réponses reçues : ${count}.`:`En cas d'égalité, tout le monde marque. Réponses reçues : ${count}.`}</p>`}
   ${g.solo?"":hostDock(`<button class="btn ghost" data-act="force">Révéler maintenant</button>`)}`};
}
function screenPmResult(){
  const g = game, GS = goalsOf(g.pmTheme), A = GS[g.chain[g.pm.cur]], B = GS[g.chain[g.pm.cur+1]], last = g.pm.last || {winners:[], picks:{}};
  const mine = last.picks[ME.id], won = last.winners.includes(ME.id);
  const res = g.players.map(p => ({p, sc:g.pm.scores[p.id]||0})).sort((a,b) => b.sc-a.sc);
  const head = g.pm.endless ? gameTop(`Série : ${g.pm.scores[ME.id]||0}`, g.pm.over?`<span class="over">Fin de série</span>`:`<span class="stamp ok">+1</span>`)
    : `${roundBar(PM_DUELS, g.pm.cur)}${gameTop(`Duel ${g.pm.cur+1}/${PM_DUELS}`, `<span class="stamp ${won?"ok":"none"}">${won?"+1 point":mine?"Raté":"Pas de réponse"}</span>`)}`;
  return {key:"pmr"+g.pm.cur+JSON.stringify(g.pm.scores)+!!g.pm.over, html:`${head}
   ${duelCards(A, B, true, g.pmTheme)}
   ${g.solo?"":`<div class="podium" style="margin-top:16px">${res.map((r,k) => `<div class="pod${last.winners.includes(r.p.id)?" first":""}"><span class="rk">${k+1}</span><span><b>${esc(r.p.name)}</b><small>${last.picks[r.p.id]?(last.picks[r.p.id]==="plus"?"A dit plus":"A dit moins"):"Pas de réponse"}</small></span><span class="sc">${plural(r.sc,"pt")}</span></div>`).join("")}</div>`}
   ${g.solo?dock(`<p class="solo-note">${g.pm.over?"Bilan…":"Duel suivant…"}</p>`)
     :IS_HOST?hostDock(`<button class="btn" data-act="next">${g.pm.cur<g.chain.length-2?"Duel suivant":"Voir le classement"}</button>`):dock(`<p class="muted" style="text-align:center;margin:0">En attente de l'hôte.</p>`)}`};
}
function screenChronoPlay(){
  chronoReset();
  const g = game, l = listById(g.chrono.list), done = L.chDone || g.chrono.doneIds.includes(ME.id);
  const people = g.solo ? "" : `<div class="chpeople" data-live="chpeople" data-html>${g.players.map(p => `<span class="${p.id===ME.id?"me":""}">${esc(p.name)} · ${p.id===ME.id?L.chFound.length:(g.chrono.counts[p.id]||0)}${g.chrono.doneIds.includes(p.id)?" ✓":""}</span>`).join("")}</div>`;
  const msg = L.chMsg ? `<span class="${L.chMsg.ok?"ok":"ko"}">${esc(L.chMsg.text)}</span>` : "";
  const rec = PROFILE.best.chrono[chronoKey(l.id, g.solo&&!g.daily ? g.chronoTime : 90)];
  return {key:`chrono-${g.gameNo}-${done}`, html:`
   ${gameTop(esc(l.t), clock())}
   <p class="chhint">${esc(l.hint)}</p>
   <div class="chscore"><b data-live="chmine">${L.chFound.length}</b><span>/ ${l.items.length} trouvés${g.solo&&rec?` · record ${rec}`:""}</span></div>
   ${people}
   ${done?`<div class="card"><h3>Tu as terminé avec ${plural(L.chFound.length,"réponse")}.</h3><p class="hint">Les résultats arrivent quand le chrono s'arrête ou que tout le monde a fini.</p></div>`
   :`<form class="answer" data-form="chrono" autocomplete="off" style="margin-top:0">
     <label class="eyebrow" for="chguess">Un nom, puis Entrée</label>
     <input id="chguess" autocomplete="off" autocorrect="off" autocapitalize="words" spellcheck="false" enterkeyhint="send" placeholder="Tape un nom">
     <div class="chmsg" data-live="chmsg" data-html aria-live="polite">${msg}</div>
     <button class="btn ink" type="submit">Valider</button>
     <button class="linkbtn" type="button" data-act="chdone">${g.solo?"J'ai fini, voir la liste":"J'ai fini"}</button>
    </form>`}
   <div class="chfound" data-live="chfound" data-html>${L.chFound.map(i => `<span>${esc(l.items[i].n)}</span>`).join("")}</div>
   ${g.solo?"":hostDock(`<button class="btn ghost" data-act="force">Arrêter le chrono</button>`)}`};
}
function screenChronoResult(){
  chronoReset();
  const g = game, l = listById(g.chrono.list), found = g.chrono.found || {}, multi = g.players.length>1;
  const finders = l.items.map((_,i) => g.players.filter(p => (found[p.id]||[]).includes(i)));
  const res = g.players.map(p => { const f = found[p.id]||[]; return {p, n:f.length, gems: multi ? f.filter(i => finders[i].length===1).length : 0}; }).sort((a,b) => b.n-a.n || b.gems-a.gems);
  const w = res[0], tie = res.length>1 && res[1].n===w.n && res[1].gems===w.gems, missed = finders.filter(f => !f.length).length;
  return {key:"chres"+g.gameNo, html:`<div class="stack">
   <div class="hero"><span class="eyebrow">${g.daily?`Défi n°${dayNumber(g.daily)} · `:""}Chrono · ${esc(l.t)}</span>
    <h1 class="display" style="font-size:clamp(34px,10vw,50px)">${!multi?`${w.n} <span>sur ${l.items.length}</span>`:tie?`Égalité <span>parfaite</span>`:`${esc(w.p.name)} <span>gagne</span>`}</h1></div>
   ${multi?`<div class="podium">${res.map((r,k) => `<div class="pod${k===0?" first":""}"><span class="rk">${k+1}</span><span><b>${esc(r.p.name)}</b><small>${plural(r.gems,"exclu")}</small></span><span class="sc">${r.n}/${l.items.length}</span></div>`).join("")}</div>`:""}
   ${summaryBlock()}
   <div><div class="eyebrow" style="margin-bottom:8px">La liste complète${missed?` · ${missed} ${multi?"oubliés par tout le monde":"oubliés"}`:""}</div>
    <div class="clist">${l.items.map((it,i) => { const f = finders[i];
      return `<div class="citem${f.length?"":" miss"}"><b>${esc(it.n)}</b><div class="who">${f.length?(multi?f.map(p => `<i title="${esc(p.name)}">${esc(initialsOf(p.name))}</i>`).join("")+(f.length===1?`<span class="gem">Exclu</span>`:""):`<small>Trouvé</small>`):`<small>${multi?"Personne":"Oublié"}</small>`}</div></div>`; }).join("")}</div></div>
  </div>
  ${game.solo&&!game.daily?dock(`<button class="btn" data-act="chrono" data-v="${l.id}">Rejouer cette liste</button><div class="row2"><button class="btn ghost" data-act="sharegame">${ICON.share} Partager</button><button class="btn ghost" data-act="tohome">Accueil</button></div>`):g.daily?endButtons():IS_HOST?hostDock(`<button class="btn" data-act="start">Rejouer${g.chronoList==="random"?" avec une autre liste":""}</button><button class="btn ghost" data-act="lobby">Retour au salon</button>`):dock(`<p class="muted" style="text-align:center;margin:0">L'hôte peut relancer une partie.</p>`)}`};
}
function gameView(){
  switch(game.phase){
    case "lobby": return screenLobby();
    case "answering": return screenAnswering();
    case "roundResult": return screenRoundResult();
    case "voting": return screenVoting();
    case "pmAsk": return screenPmAsk();
    case "pmResult": return screenPmResult();
    case "chronoPlay": return screenChronoPlay();
    case "chronoResult": return screenChronoResult();
    default: return screenResults();
  }
}
