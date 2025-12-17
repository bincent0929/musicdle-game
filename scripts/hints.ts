import type { HintState } from "./hints-types";
import { normalize } from "./additional-functions";

let hintState: HintState;

/**
 * Initialize or update the hint boxes in the DOM
 */
export function initializeHintBoxes(): void {
    hintState = {
        artist: { value: "", revealed: false },
        genre: { value: "", revealed: false },
        year: { value: "", revealed: false },
        album: { value: "", revealed: false }
    };

    let hintContainer = document.getElementById("hint-container");
  
    if (!hintContainer) {
    // Create the container if it doesn't exist
    const bottomInfo = document.getElementById("bottom-info");
    if (!bottomInfo) return;
        hintContainer = document.createElement("div");
        hintContainer.id = "hint-container";
        hintContainer.className = "mt-6 p-4 bg-white border border-gray-200 rounded-xl";
        bottomInfo.parentElement?.insertBefore(hintContainer, bottomInfo.nextSibling);
    }

    // Create the hint boxes
    hintContainer.innerHTML = `
    <h3 class="text-lg font-bold text-center mb-3">Song Info</h3>
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
}

/**
 * Update a specific hint box with correct info
 */
function updateHintBox(boxId: string, value: string, shouldReveal: boolean): void {
    const box = document.getElementById(boxId);
    if (!box) return;

    const valueEl = box.querySelector(".text-sm");
    if (!valueEl) return;

    if (shouldReveal) {
    // Reveal the correct answer with green styling
    box.className = "hint-box px-3 py-2 rounded-md border-2 min-w-[100px] bg-green-100 border-green-500 text-green-800 transition-all duration-300";
    valueEl.textContent = value;
    } else {
    // Keep it hidden
    box.className = "hint-box px-3 py-2 rounded-md border-2 min-w-[100px] bg-gray-100 border-gray-300 text-gray-600";
    valueEl.textContent = "???";
    }
}

/**
 * Update all hint boxes based on current hint state
 */
export function renderHintBoxes(): void {
    updateHintBox("hint-artist", hintState.artist.value, hintState.artist.revealed);
    updateHintBox("hint-genre", hintState.genre.value, hintState.genre.revealed);
    updateHintBox("hint-year", hintState.year.value, hintState.year.revealed);
    updateHintBox("hint-album", hintState.album.value, hintState.album.revealed);
}

/**
 * Check a guess and update hint state
 */
export function checkGuessAgainstCurrent(guessedTrack: ITunesTrack): boolean {
    if (!current) return false;

    // Check artist
    if (!hintState.artist.revealed && normalize(guessedTrack.artistName) === normalize(current.artist)) {
    hintState.artist.value = current.artist;
    hintState.artist.revealed = true;
    }

    // Check genre
    if (!hintState.genre.revealed && normalize(guessedTrack.primaryGenreName) === normalize(current.genre)) {
    hintState.genre.value = current.genre;
    hintState.genre.revealed = true;
    }

    // Check year
    if (!hintState.year.revealed && extractYear(guessedTrack.releaseDate) === current.releaseYear) {
    hintState.year.value = current.releaseYear;
    hintState.year.revealed = true;
    }

    // Check album
    if (!hintState.album.revealed && normalize(guessedTrack.collectionName) === normalize(current.albumName)) {
    hintState.album.value = current.albumName;
    hintState.album.revealed = true;
    }

    // Check if exact match
    const isCorrect = normalize(guessedTrack.trackName) === normalize(current.title);

    return isCorrect;
}