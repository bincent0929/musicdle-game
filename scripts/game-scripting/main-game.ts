import { initializeElements } from "../dom/initialize-elements.js";
import { GameElements } from "../dom/game-elements.js";
import { initializeHintBoxes, renderHintBoxes } from "../hints.js";

import {
  setupAudioRestrictions,
  updateGameStateUI,
  initGameInfoPopup,
  fetchSongURL,
  hideDD,
  searchArtistSongs,
  checkGuess,
  reveal,
  highlight,
  selectItem,
} from "./game-functions.js";

import type {
  GameState,
  currentSong,
  DropdownItem,
} from "./game-logic-types.js";

// ==== INITIALIZATION: ALL DOM QUERIES HAPPEN HERE ====
initializeElements(); // Single call - grabs all 15+ elements ONCE

// Create element accessor
const elements = new GameElements();

let gameState: GameState = {
  attemptsRemaining: 5,
  wrongGuesses: 0,
  maxListenTime: 6,
  hasWon: false,
};

let current: currentSong | null = null;

await initGameInfoPopup(elements);

elements.statusElement.textContent = "Loading top songs…";
elements.metaElement.textContent = "";
elements.guessInput.value = "";
elements.audioPlayer.src = "";

initializeHintBoxes();
renderHintBoxes();

const fetchedData = await fetchSongURL();

if (fetchedData) {
  /**
   * It's technically not just the URL,
   * saved into current but the rest
   * of the values are empty or null
   */
  current = fetchedData.songPreviewURL;
  elements.audioPlayer.src = current.preview;
  elements.audioPlayer.load();
}

setupAudioRestrictions(gameState, elements);

// Wait for the game info popup to be closed before playing
await initGameInfoPopup(elements);

// Try to play
const p = elements.audioPlayer.play();

if (p && p.catch)
  await p.catch(() => {
    elements.statusElement.textContent =
      "Tap ▶️ to start playback (autoplay blocked).";
  });
if (!elements.audioPlayer.paused)
  elements.statusElement.textContent = "Playing preview… guess the title!";
elements.metaElement.textContent = "";
updateGameStateUI(gameState, elements);

/**
 * This is where the song info is being updated.
 * Right now it's just getting a true/false for the info.
 * It needs to be updated to grab the info from the guessed
 * song and put it into the info.
 */
elements.submitBtn.onclick = () => checkGuess(gameState, current, elements);

elements.revealBtn.onclick = () => reveal(gameState, current, elements);

elements.guessInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") checkGuess(gameState, current, elements);
});

// Dropdown handling
let ddIndex = -1;
let ddItems: DropdownItem[] = [];
let aborter: AbortController | null = null;

const DEBOUNCE_MS = 180;
let t: any = null;

elements.guessInput.addEventListener("input", (e) => {
  const eventTarget = e.target as HTMLInputElement;
  const q = eventTarget.value.trim();
  clearTimeout(t);
  if (q.length < 2) {
    hideDD(elements, ddIndex, ddItems);
    return;
  }
  t = setTimeout(
    () => searchArtistSongs(q, aborter, elements, ddIndex, ddItems),
    DEBOUNCE_MS
  );
});

elements.guessInput.addEventListener("keydown", (e) => {
  if (elements.guessDropdown.classList.contains("hidden")) return;
  if (e.key === "ArrowDown") {
    e.preventDefault();
    ddIndex = Math.min(ddIndex + 1, ddItems.length - 1);
    highlight(ddIndex, elements);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    ddIndex = Math.max(ddIndex - 1, 0);
    highlight(ddIndex, elements);
  } else if (e.key === "Enter") {
    if (ddIndex >= 0) {
      e.preventDefault();
      selectItem(ddIndex, ddItems, elements);
    }
  } else if (e.key === "Escape") {
    hideDD(elements, ddIndex, ddItems);
  }
});

document.addEventListener("click", (e) => {
  const wrap = document.querySelector(".guess-wrap");
  if (!wrap) return;
  if (!wrap.contains(e.target as Node)) hideDD(elements, ddIndex, ddItems);
});
