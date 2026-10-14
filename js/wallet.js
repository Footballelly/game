/* Football Legends — pièces, collection et packs (Supabase). Le serveur fait foi : tirages, soldes et gains y sont calculés. */
"use strict";

const CARDS = window.FL_CARDS || [];
const CARD = new Map(CARDS.map(c => [c.id, c]));
const PACKS = {
  classic:{t:"Pack Classique", price:100, d:"3 cartes · 25 % de chances de rare, 5 % de légende"},
  gold:{t:"Pack Or", price:300, d:"3 cartes dont au moins 1 rare · 15 % de légende"}
};
const RAR_FR = {common:"Commune", rare:"Rare", legend:"Légende"};
let WALLET = {loaded:false, loading:false, err:null, coins:0, streak:0, best:0, cards:{}};

async function rpc(fn, args){
  const client = sb(); if(!client) throw new Error("hors ligne");
  const {data, error} = await client.rpc(fn, args); if(error) throw error; return data;
}
async function loadWallet(force){
  if(WALLET.loading || (WALLET.loaded && !force)) return;
  WALLET.loading = true;
  try{ const w = await rpc("fl_wallet", {p_player:PROFILE.id});
    WALLET = {loaded:true, loading:false, err:null, coins:w.coins, streak:w.streak, best:w.best_streak, cards:w.cards || {}}; }
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
    L.pack = {kind, cards:r.cards, refund:r.refund, shown:0};
    VIEW = "pack";
  }catch(e){ L.packErr = /pas assez/.test(e.message||"") ? "Pas assez de pièces pour ce pack." : "Ouverture impossible pour le moment. Réessaie dans un instant."; }
  L.opening = false; render(true);
}
const ownedIds = () => Object.keys(WALLET.cards).filter(id => CARD.has(id));
const coinPill = () => `<span class="coins" title="Pièces">${ICON.coin}<b data-live="coins">${WALLET.loaded ? WALLET.coins : "…"}</b></span>`;
