import type { HintState } from "./hints-types.js";
import { normalize, $ } from "./additional-functions.js";
import { ITunesTrack } from "./api-types.js";
import { extractYear } from "./additional-functions.js";
import type { currentSong } from "./game-scripting/game-logic-types.js";
import { HintElements } from "./dom/game-elements.js";
import ElementManager from "./dom/element-manager.js";

let hintState: HintState;
let hintElements: HintElements | null = null;

/**
 * Initialize or update the hint boxes in the DOM
 */
export function initializeHintBoxes(): void {
  hintState = {
    artist: { value: "", revealed: false },
    genre: { value: "", revealed: false },
    year: { value: "", revealed: false },
    album: { value: "", revealed: false },
  };

  let hintContainer = $("hint-container");

  if (!hintContainer) {
    // Create the container if it doesn't exist
    const bottomInfo = $("bottom-info");
    if (!bottomInfo) return;
    hintContainer = document.createElement("div");
    hintContainer.id = "hint-container";
    hintContainer.className =
      "mt-6 p-4 bg-white border border-gray-200 rounded-xl";
    bottomInfo.parentElement?.insertBefore(
      hintContainer,
      bottomInfo.nextSibling
    );
  }

  // Create the hint boxes
  hintContainer.innerHTML = `
  <h3 class="text-lg font-bold text-center mb-3">What You've Got Right So Far</h3>
  <div class="flex gap-2 flex-wrap justify-center">
      <div id="hint-artist" class="hint-box px-3 py-2 rounded-md border-2 min-w-[100px] bg-gray-100 border-gray-300 text-gray-600">
      <div class="text-xs font-semibold uppercase">Artist</div>
      <div class="text-sm font-medium mt-0.5">???</div>
      </div>
      <div id="hint-genre" class="hint-box px-3 py-2 rounded-md border-2 min-w-[100px] bg-gray-100 border-gray-300 text-gray-600">
      <div class="text-xs font-semibold uppercase">Genre</div>
      <div class="text-sm font-medium mt-0.5">???</div>
      </div>
      <div id="hint-year" class="hint-box px-3 py-2 rounded-md border-2 min-w-[100px] bg-gray-100 border-gray-300 text-gray-600">
      <div class="text-xs font-semibold uppercase">Year</div>
      <div class="text-sm font-medium mt-0.5">???</div>
      </div>
      <div id="hint-album" class="hint-box px-3 py-2 rounded-md border-2 min-w-[100px] bg-gray-100 border-gray-300 text-gray-600">
      <div class="text-xs font-semibold uppercase">Album</div>
      <div class="text-sm font-medium mt-0.5">???</div>
      </div>
  </div>
  `;

  // Register dynamically created elements with ElementManager
  const manager = ElementManager.getInstance();
  manager.replace("hint-container", hintContainer);
  manager.replace("hint-artist", document.getElementById("hint-artist")!);
  manager.replace("hint-genre", document.getElementById("hint-genre")!);
  manager.replace("hint-year", document.getElementById("hint-year")!);
  manager.replace("hint-album", document.getElementById("hint-album")!);

  // Now we can use HintElements accessor
  hintElements = new HintElements();
}

/**
 * Update a specific hint box with correct info
 */
function updateHintBox(
  element: HTMLElement,
  value: string,
  shouldReveal: boolean
): void {
  const valueEl = element.querySelector(".text-sm");
  if (!valueEl) return;

  if (shouldReveal) {
    // Reveal the correct answer with green styling
    element.className =
      "hint-box px-3 py-2 rounded-md border-2 min-w-[100px] bg-green-100 border-green-500 text-green-800 transition-all duration-300";
    valueEl.textContent = value;
  } else {
    // Keep it hidden
    element.className =
      "hint-box px-3 py-2 rounded-md border-2 min-w-[100px] bg-gray-100 border-gray-300 text-gray-600";
    valueEl.textContent = "???";
  }
}

/**
 * Update all hint boxes based on current hint state
 */
export function renderHintBoxes(): void {
  if (!hintElements) return;

  updateHintBox(
    hintElements.artistBox,
    hintState.artist.value,
    hintState.artist.revealed
  );
  updateHintBox(
    hintElements.genreBox,
    hintState.genre.value,
    hintState.genre.revealed
  );
  updateHintBox(
    hintElements.yearBox,
    hintState.year.value,
    hintState.year.revealed
  );
  updateHintBox(
    hintElements.albumBox,
    hintState.album.value,
    hintState.album.revealed
  );
}

/**
 * Check a guess and update hint state
 */
export function checkGuessAgainstCurrent(
  guessedTrack: ITunesTrack,
  current: currentSong
): boolean {
  if (!current) return false;

  // Check artist
  if (
    !hintState.artist.revealed &&
    normalize(guessedTrack.artistName) === normalize(current.artist)
  ) {
    hintState.artist.value = current.artist;
    hintState.artist.revealed = true;
  }

  // Check genre
  if (
    !hintState.genre.revealed &&
    normalize(guessedTrack.primaryGenreName) === normalize(current.genre)
  ) {
    hintState.genre.value = current.genre;
    hintState.genre.revealed = true;
  }

  // Check year
  if (
    !hintState.year.revealed &&
    extractYear(guessedTrack.releaseDate) === current.releaseYear
  ) {
    hintState.year.value = current.releaseYear;
    hintState.year.revealed = true;
  }

  // Check album
  if (
    !hintState.album.revealed &&
    normalize(guessedTrack.collectionName) === normalize(current.albumName)
  ) {
    hintState.album.value = current.albumName;
    hintState.album.revealed = true;
  }

  // Check if exact match
  const isCorrect =
    normalize(guessedTrack.trackName) === normalize(current.title);

  return isCorrect;
}

export function updateHintState(current: currentSong): void {
  hintState.artist.value = current.artist;
  hintState.artist.revealed = true;
  hintState.genre.value = current.genre;
  hintState.genre.revealed = true;
  hintState.year.value = current.releaseYear;
  hintState.year.revealed = true;
  hintState.album.value = current.albumName;
  hintState.album.revealed = true;
}

export function revealedStateUpdate(revealed: Array<string>): void {
  if (hintState.artist.revealed) revealed.push("artist");
  if (hintState.genre.revealed) revealed.push("genre");
  if (hintState.year.revealed) revealed.push("year");
  if (hintState.album.revealed) revealed.push("album");
}

export function updateHintsFromMatches(
  matches: {
    artist: string | false;
    genre: string | false;
    year: string | false;
    album: string | false;
  },
  current: currentSong
): void {
  if (matches.artist && !hintState.artist.revealed) {
    current.artist = matches.artist;
    hintState.artist.value = matches.artist;
    hintState.artist.revealed = true;
  }
  if (matches.genre && !hintState.genre.revealed) {
    current.genre = matches.genre;
    hintState.genre.value = matches.genre;
    hintState.genre.revealed = true;
  }
  if (matches.year && !hintState.year.revealed) {
    current.releaseYear = matches.year;
    hintState.year.value = matches.year;
    hintState.year.revealed = true;
  }
  if (matches.album && !hintState.album.revealed) {
    current.albumName = matches.album;
    hintState.album.value = matches.album;
    hintState.album.revealed = true;
  }
}
