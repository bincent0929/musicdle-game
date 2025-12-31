import { $ } from '../additional-functions.js';

import { initGameInfoPopup, fetchSongURL, hideDD, searchArtistSongs, checkGuess, reveal, highlight, selectItem } from './game-functions.js';

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
if (newBtn) newBtn.onclick = () => fetchSongURL(gameState, current, currentSongId);

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
