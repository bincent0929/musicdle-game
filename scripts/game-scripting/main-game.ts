import { $ } from '../additional-functions.js';
import { initializeHintBoxes, renderHintBoxes } from '../hints.js';

import { setupAudioRestrictions, updateGameStateUI, 
  initGameInfoPopup, fetchSongURLAndId, hideDD, searchArtistSongs, 
  checkGuess, reveal, highlight, selectItem } from './game-functions.js';

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

const submitBtn = $("submit");
if (submitBtn === null) throw new Error("Submit button not found.");
const revealBtn = $("reveal");
if (revealBtn === null) throw new Error("Reveal button not found.");
const guessInput = $("guess") as HTMLInputElement;
if (guessInput === null) throw new Error("Guess input not found.");
const player = $("player") as HTMLAudioElement;
if (player === null) throw new Error("Audio player not found.");

// if (newBtn) newBtn.onclick = () => fetchSongURL(current, currentSongId);
// indicates where the button would've been checked to be pressed for fetching the daily song

let statusElement = $("status") as HTMLElement;
if (!statusElement) throw new Error("Status element not found.");
let metaElement = $("meta") as HTMLElement;
if (!metaElement) throw new Error("Meta element not found.");

// this are taken from the user's input on the page
statusElement.textContent = "Loading top songs…";
metaElement.textContent = "";
guessInput.value = "";
player.src = "";

initializeHintBoxes();
renderHintBoxes();

const fetchedData = await fetchSongURLAndId();

if (fetchedData) {
  /**
   * It's technically not just the URL,
   * saved into current but the rest
   * of the values are empty or null
   */
  current = fetchedData.songPreviewURL;
  currentSongId = fetchedData.songId;
  player.src = current.preview;
  player.load();
}

setupAudioRestrictions(player, gameState);

// Get the new player element after replacement in setupAudioRestrictions
const restrictedPlayer = player;
const p = restrictedPlayer.play();

if (p && p.catch) await p.catch(() => 
  { statusElement.textContent = "Tap ▶️ to start playback (autoplay blocked)."; });
if (!restrictedPlayer.paused) statusElement.textContent = "Playing preview… guess the title!";
metaElement.textContent = "";
updateGameStateUI(gameState);

/**
 * This is where the song info is being updated.
 * Right now it's just getting a true/false for the info.
 * It needs to be updated to grab the info from the guessed
 * song and put it into the info.
 */
if (submitBtn) submitBtn.onclick = () => 
  checkGuess(gameState, current, currentSongId, guessInput, statusElement, metaElement);

if (revealBtn) revealBtn.onclick = () => 
  reveal(gameState, current);

if (guessInput) guessInput.addEventListener("keydown", e =>
   { if (e.key === "Enter") 
    checkGuess(gameState, current, currentSongId, guessInput, statusElement, metaElement); });

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
