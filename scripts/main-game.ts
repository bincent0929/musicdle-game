import { $ } from './additional-functions.js';

import { initGameInfoPopup, pickSong, updateGameStateUI, setupAudioRestrictions, checkGuess, showCompletionPopup, reveal } from './game-functions.js';

import type { GameState, currentSong, DropdownItem } from './game-logic-types.js';

import { initializeHintBoxes, renderHintBoxes, updateHintState, revealedStateUpdate } from './hints.js';

let gameState: GameState = {
  attemptsRemaining: 5,
  wrongGuesses: 0,
  maxListenTime: 6,
  hasWon: false
};

//let current: currentSong | null = null;
let current: currentSong | null = null;
let currentSongId: string | null = null;

initGameInfoPopup();

const newBtn = $("new");
const submitBtn = $("submit");
const revealBtn = $("reveal");
const guessInput = $("guess");

if (newBtn) newBtn.onclick = () => pickSong(gameState, current, currentSongId);
if (submitBtn) submitBtn.onclick = checkGuess;
if (revealBtn) revealBtn.onclick = reveal;
if (guessInput) guessInput.addEventListener("keydown", e => { if (e.key === "Enter") checkGuess(); });


/* ------------ integrated dropdown on the Guess input ------------ */
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
  if (q.length < 2) { hideDD(); return; }
  t = setTimeout(() => searchArtistSongs(q), DEBOUNCE_MS);
});
guessElement.addEventListener("keydown", (e) => {
  if (guessDD.classList.contains("hidden")) return;
  if (e.key === "ArrowDown") { e.preventDefault(); ddIndex = Math.min(ddIndex + 1, ddItems.length - 1); highlight(ddIndex); }
  else if (e.key === "ArrowUp") { e.preventDefault(); ddIndex = Math.max(ddIndex - 1, 0); highlight(ddIndex); }
  else if (e.key === "Enter") { if (ddIndex >= 0) { e.preventDefault(); selectItem(ddIndex); } }
  else if (e.key === "Escape") { hideDD(); }
});

// click outside to close
document.addEventListener("click", (e) => {
  const wrap = document.querySelector(".guess-wrap")
  if (!wrap) return;
  if (!wrap.contains(e.target as Node)) hideDD();
});

// Expose functions for debugging
(window as any).gameDebug = {
    initGameInfoPopup,
    pickSong,
    updateGameStateUI,
    setupAudioRestrictions,
    checkGuess,
    showCompletionPopup,
    reveal,
    hideDD,
    searchArtistSongs,
    // Imported from hints
    initializeHintBoxes,
    renderHintBoxes,
    updateHintState,
    revealedStateUpdate
};