/* Football Legends — pièces, collection et packs (Supabase). Le serveur fait foi : tirages, soldes et gains y sont calculés. */
"use strict";

const CARDS = window.FL_CARDS || [];
const CARD = new Map(CARDS.map(c => [c.id, c]));
const PACKS = {
  classic:{t:"Pack Classique", price:100, d:"3 cartes · 25 % de pépites, 4 % de légendes, 1 % d'icônes"},
  gold:{t:"Pack Or", price:300, d:"3 cartes dont au moins 1 pépite · 11 % de légendes, 4 % d'icônes"}
};
const RAR_FR = {common:"Commune", rare:"Pépite", legend:"Légende", icon:"Icône"};
const RORD = {icon:0, legend:1, rare:2, common:3};
let WALLET = {loaded:false, loading:false, err:null, coins:0, streak:0, best:0, cards:{}, albums:[]};

async function rpc(fn, args){
  const client = sb(); if(!client) throw new Error("hors ligne");
  const {data, error} = await client.rpc(fn, args); if(error) throw error; return data;
}
async function loadWallet(force){
  if(WALLET.loading || (WALLET.loaded && !force)) return;
  WALLET.loading = true;
  try{ const w = await rpc("fl_wallet", {p_player:PROFILE.id});
    WALLET = {loaded:true, loading:false, err:null, coins:w.coins, streak:w.streak, best:w.best_streak, cards:w.cards || {}, albums:w.albums || []}; }
  catch(e){ WALLET.loading = false; WALLET.err = "La collection a besoin d'une connexion internet."; }
  render();
}
/* gain de fin de partie ; ref unique par partie (le serveur ignore un second envoi) */
async function rewardGame(score, won){
  try{ const r = await rpc("fl_reward", {p_player:PROFILE.id, p_ref:uid()+uid(), p_score:Math.max(0, score|0), p_won:!!won});
    WALLET.coins = r.coins; return r.amount; }catch(e){ return null; }
}
async function claimDaily(day){
  try{ const r = await rpc("fl_claim_daily", {p_player:PROFILE.id, p_day:day});
    WALLET.coins = r.coins; WALLET.streak = r.streak; return r; }catch(e){ return null; }
}
async function openPack(kind){
  if(L.opening) return;
  L.opening = true; L.packErr = null; render(true);
  try{
    const r = await rpc("fl_open_pack", {p_player:PROFILE.id, p_pack:kind});
    r.cards.forEach(c => WALLET.cards[c.id] = (WALLET.cards[c.id]||0) + 1);
    WALLET.coins = r.coins;
    L.pack = {kind, cards:r.cards, refund:r.refund, shown:0, torn:false, anim:[0,0]};
    VIEW = "pack";
  }catch(e){ L.packErr = /pas assez/.test(e.message||"") ? "Pas assez de pièces pour ce pack." : "Ouverture impossible pour le moment. Réessaie dans un instant."; }
  L.opening = false; render(true);
}
/* albums de club : bonus unique quand toutes les cartes du club sont obtenues */
const ALBUMS = (() => { const m = {}; CARDS.forEach(c => (m[c.c] ||= []).push(c.id)); return Object.entries(m).filter(([,ids]) => ids.length>=3).map(([club, ids]) => ({club, ids})); })();
const albumBonus = n => 50 + 15*n;
const albumState = a => { const got = a.ids.filter(id => WALLET.cards[id]).length, full = got===a.ids.length;
  return {got, full, claimed:WALLET.albums.includes(a.club), claimable: full && !WALLET.albums.includes(a.club)}; };
async function claimAlbum(club){
  if(L.claiming) return; L.claiming = club; render(true);
  try{ const r = await rpc("fl_claim_album", {p_player:PROFILE.id, p_club:club});
    WALLET.coins = r.coins; if(!WALLET.albums.includes(club)) WALLET.albums.push(club);
    toast(`Album ${club} complété : +${r.amount} pièces`, "ok"); celebrate("gold"); }
  catch(e){ toast("Bonus indisponible pour le moment, réessaie.", ""); }
  L.claiming = null; render(true);
}
const ownedIds = () => Object.keys(WALLET.cards).filter(id => CARD.has(id));
const coinPill = () => `<span class="coins" title="Pièces">${ICON.coin}<b data-live="coins">${WALLET.loaded ? WALLET.coins : "…"}</b></span>`;
