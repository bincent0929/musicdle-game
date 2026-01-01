import { $ } from '../additional-functions.js';
import { initializeHintBoxes, renderHintBoxes } from '../hints.js';

import { setupAudioRestrictions, updateGameStateUI, initGameInfoPopup, fetchSongURL, hideDD, searchArtistSongs, checkGuess, reveal, highlight, selectItem } from './game-functions.js';

import type { GameState, currentSong, DropdownItem } from './game-logic-types.js';

let gameState: GameState = {
  attemptsRemaining: 5,
  wrongGuesses: 0,
  maxListenTime: 6,
  hasWon: false
};

let current: currentSong | null = null;
let currentSongId: string | null = null;

initGameInfoPopup();

const newBtn = $("new");
const submitBtn = $("submit");
const revealBtn = $("reveal");
const guessInput = $("guess");

// we should have the pickSong function be called when new game starts
// instead of when the user presses the button.
//if (newBtn) newBtn.onclick = () => fetchSongURL(current, currentSongId);

let statusElement = $("status") as HTMLElement;
let metaElement = $("meta") as HTMLElement;

if (!statusElement) throw new Error("Status element not found.");
if (!metaElement) throw new Error("Meta element not found.");

// this are taken from the user's input on the page
//const country = ($("country") as HTMLInputElement).value;
//const genre = ($("genre") as HTMLInputElement).value;
($("status") as HTMLElement).textContent = "Loading top songs…";
($("meta") as HTMLElement).textContent = "";
($("guess") as HTMLInputElement).value = "";
($("player") as HTMLAudioElement).src = "";

initializeHintBoxes();
renderHintBoxes();

// this could probably also be moved into main-game.ts
const player = $("player") as HTMLAudioElement;
if (player === null) throw new Error("Audio player not found.");
current = await fetchSongURL(current, currentSongId);

if (current) {
  player.src = current.preview;
  player.load();
}

// Set up audio restrictions
setupAudioRestrictions(player, gameState);

// Get the new player element after replacement in setupAudioRestrictions
const restrictedPlayer = $("player") as HTMLAudioElement;
const p = restrictedPlayer.play();

if (p && p.catch) await p.catch(() => { statusElement.textContent = "Tap ▶️ to start playback (autoplay blocked)."; });
if (!restrictedPlayer.paused) statusElement.textContent = "Playing preview… guess the title!";
metaElement.textContent = "";
updateGameStateUI(gameState);

if (submitBtn) submitBtn.onclick = () => checkGuess(gameState, current, currentSongId);
if (revealBtn) revealBtn.onclick = () => reveal(gameState, current);
if (guessInput) guessInput.addEventListener("keydown", e => { if (e.key === "Enter") checkGuess(gameState, current, currentSongId); });

const guessDD = $("guessDD") as HTMLDivElement;
let ddIndex = -1;
let ddItems: DropdownItem[] = [];
let aborter: AbortController | null = null;

const DEBOUNCE_MS = 180;
let t: any = null;
let guessElement = $("guess") as HTMLInputElement;

guessElement.addEventListener("input", (e) => {
  const eventTarget = e.target as HTMLInputElement;
  const q = eventTarget.value.trim();
  clearTimeout(t);
  if (q.length < 2) { hideDD(guessDD, ddIndex, ddItems); return; }
  t = setTimeout(() => searchArtistSongs(q, aborter, guessDD, ddIndex, ddItems), DEBOUNCE_MS);
});

guessElement.addEventListener("keydown", (e) => {
  if (guessDD.classList.contains("hidden")) return;
  if (e.key === "ArrowDown") { e.preventDefault(); ddIndex = Math.min(ddIndex + 1, ddItems.length - 1); highlight(ddIndex, guessDD); }
  else if (e.key === "ArrowUp") { e.preventDefault(); ddIndex = Math.max(ddIndex - 1, 0); highlight(ddIndex, guessDD); }
  else if (e.key === "Enter") { if (ddIndex >= 0) { e.preventDefault(); selectItem(ddIndex, ddItems, guessDD); } }
  else if (e.key === "Escape") { hideDD(guessDD, ddIndex, ddItems); }
});

document.addEventListener("click", (e) => {
  const wrap = document.querySelector(".guess-wrap")
  if (!wrap) return;
  if (!wrap.contains(e.target as Node)) hideDD(guessDD, ddIndex, ddItems);
});
