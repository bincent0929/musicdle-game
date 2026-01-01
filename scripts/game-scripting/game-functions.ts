import type { DropdownItem, GameState, currentSong } from './game-logic-types.js';

import { $ } from '../additional-functions.js';

import { initializeHintBoxes, renderHintBoxes, revealedStateUpdate, updateHintsFromMatches, updateHintState } from '../hints.js';

import { ITunesSearchResponse, ITunesTrack } from '../api-types.js';

// big old popup for game information
export function initGameInfoPopup(): void {
  const popup = $("game-info-popup");
  const closeBtn = $("game-info-close");
  if (!popup || !closeBtn) return;

  const hidePopup = () => {
    popup.classList.add("hidden");
    popup.setAttribute("aria-hidden", "true");
  };

  closeBtn.addEventListener("click", hidePopup);
  document.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Escape" && !popup.classList.contains("hidden")) {
      hidePopup();
    }
  });
}

export async function fetchSongURL(current: currentSong | null, currentSongId: string | null): Promise<currentSong | null> {
  try {  
  // Fetch preview URL and song ID
    const urlResponse = await fetch('http://localhost:3000/api/daily-song-url');
    const urlData = await urlResponse.json();

    currentSongId = urlData.songId;
    
    // this won't change the current in main-game.ts
    // needs to be updated
    return current = {
      preview: urlData.previewUrl,
      artist: "",
      title: "",
      genre: "",
      releaseYear: "",
      albumName: "",
      fullTrack: null
    };
  } catch (e) {
    return null;
  }
}

/**
 * Updates the UI to show current game state
 */
export function updateGameStateUI(gameState: GameState): void {
  const attemptsEl = $("attempts");
  const unlockedEl = $("unlocked");

  if (attemptsEl) {
    attemptsEl.textContent = `Attempts remaining: ${gameState.attemptsRemaining}/5`;
  }

  if (unlockedEl) {
    unlockedEl.textContent = `Unlocked: ${gameState.maxListenTime} seconds`;
  }
}

/**
 * Sets up audio event listeners to restrict playback to unlocked time
 */
export function setupAudioRestrictions(player: HTMLAudioElement, gameState: GameState): void {
  // Remove any existing listeners to avoid duplicates
  const newPlayer = player.cloneNode(true) as HTMLAudioElement;
  player.parentNode?.replaceChild(newPlayer, player);

  // timeupdate: pause and reset when reaching the time limit
  newPlayer.addEventListener('timeupdate', () => {
    if (!gameState.hasWon && newPlayer.currentTime >= gameState.maxListenTime) {
      newPlayer.pause();
      newPlayer.currentTime = 0;
    }
  });

  // seeking: prevent seeking beyond unlocked time
  newPlayer.addEventListener('seeking', () => {
    if (!gameState.hasWon && newPlayer.currentTime > gameState.maxListenTime) {
      newPlayer.currentTime = gameState.maxListenTime;
    }
  });

  // ended: reset to beginning for replay
  newPlayer.addEventListener('ended', () => {
    newPlayer.currentTime = 0;
  });
}

// VERY MUCH needs to be refactored
// do not think this works with the updated API right now
export async function checkGuess(gameState: GameState, current: currentSong | null, currentSongId: string | null): Promise<void> {
  if (!current || !currentSongId) return;

  const guessInput = $("guess") as HTMLInputElement | null;
  const statusEl = $("status");
  const metaEl = $("meta");

  if (!guessInput || !statusEl || !metaEl) return;

  const playerGuessText: string = guessInput.value.trim();
  if (!playerGuessText) {
    statusEl.textContent = "Type a guess first!";
    return;
  }

  try {
    statusEl.textContent = "Checking...";

    // Send guess to server for validation
    const response = await fetch('http://localhost:3000/api/validate-guess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guessText: playerGuessText,
        songId: currentSongId
      })
    });

    const result = await response.json();

    // Handle error responses
    if (!result.success) {
      statusEl.textContent = result.message || "Error processing guess.";
      return;
    }

    const isCorrect = result.isCorrect;

    if (isCorrect) {
      // I don't think this works to correctly reveal everything
      // current isn't updated anywhere before this.
      updateHintState(current);
      renderHintBoxes();

      gameState.hasWon = true;
      gameState.maxListenTime = 30;// Unlock full 30-second preview
      statusEl.textContent = "✅ Correct!";
      metaEl.innerHTML = `You got it! <b>${current.title}</b> by ${current.artist}`;
      updateGameStateUI(gameState);
      // Show completion popup after a short delay
      setTimeout(() => showCompletionPopup(gameState, current), 800);
    } else {
      // Update hints based on matches from server
      // see main-server.ts for matches' non-implemented interface
      // this will need to be added to an interface later
      updateHintsFromMatches(result.matches, current);
      renderHintBoxes();
      // Wrong guess
      gameState.attemptsRemaining--;
      gameState.wrongGuesses++;
      // Unlock +6 more seconds (cap at 30)
      gameState.maxListenTime = Math.min(6 + (gameState.wrongGuesses * 6), 30);

      if (gameState.attemptsRemaining > 0) {
        // Give feedback based on what was revealed
        let feedback = "❌ Not quite.";
        const revealed : Array<string> = [];
        revealedStateUpdate(revealed);
        
        if (revealed.length > 0) {
          feedback += ` Revealed: ${revealed.join(", ")}`;
        }
        
        statusEl.textContent = feedback;
        updateGameStateUI(gameState);
      } else {
        // Out of attempts - reveal everything
        updateHintState(current);
        renderHintBoxes();

        statusEl.textContent = "❌ Out of attempts!";
        metaEl.innerHTML = `Answer: <b>${current.title}</b> — ${current.artist}`;
        gameState.maxListenTime = 30;// Unlock full audio after game over
        updateGameStateUI(gameState);
        setTimeout(() => showCompletionPopup(gameState, current), 1500);
      }
    }

    // Clear the guess input
    guessInput.value = "";

  } catch (error) {
    console.error("Error checking guess:", error);
    statusEl.textContent = "⚠️ Error processing guess. Try again.";
  }
}

async function showCompletionPopup(gameState: GameState, current: currentSong): Promise<void> {
  await end_of_game_fetch(gameState, current);

  const Popup = $("completion-Popup");
  if (!Popup) {
    console.error("Completion Popup not found");
    return;
  }

  // Calculate score based on game state
  const score = gameState.hasWon ? (6 - gameState.wrongGuesses) : 0;
  const scoreEl = $("Popup-score");
  if (scoreEl) {
    scoreEl.textContent = score.toString();
  }
  
  // Show number of guesses made
  const guessesEl = $("Popup-guesses");
  if (guessesEl) {
    const guessesMade = gameState.wrongGuesses + (gameState.hasWon ? 1 : 0);
    guessesEl.textContent = guessesMade.toString();
  }

  // Populate song information
  if (current) {
    const songTitleEl = $("Popup-song-title");
    const artistNameEl = $("Popup-artist-name");
    const albumArtEl = $("Popup-album-art") as HTMLImageElement | null;
    
    if (songTitleEl) {
      songTitleEl.textContent = current.title;
    }
    if (artistNameEl) {
      artistNameEl.textContent = current.artist;
    }
    if (albumArtEl && current.fullTrack) {
      const artworkUrl = current.fullTrack.artworkUrl100 || current.fullTrack.artworkUrl60 || "";
      const highResArtwork = artworkUrl.replace("100x100bb", "300x300bb").replace("60x60bb", "300x300bb");
      albumArtEl.src = highResArtwork;
      albumArtEl.alt = `${current.albumName} album artwork`;
    }
  }

  // Show the Popup
  Popup.classList.remove("hidden");

  // Setup event listeners for Popup buttons
  const yesBtn = $("Popup-yes") as HTMLButtonElement | null;
  const noBtn = $("Popup-no") as HTMLButtonElement | null;
  const playAgainBtn = $("Popup-play-again") as HTMLButtonElement | null;
  const noteEl = $("Popup-note");

  if (yesBtn && noteEl) {
    yesBtn.onclick = () => {
      // Save to localStorage
      const saved = localStorage.getItem("musicdle-scores") || "[]";
      const scores = JSON.parse(saved);
      scores.push({
        score: score,
        date: new Date().toISOString(),
        song: current?.title,
        artist: current?.artist
      });
      localStorage.setItem("musicdle-scores", JSON.stringify(scores));
      
      noteEl.classList.remove("hidden");
      if (yesBtn) yesBtn.disabled = true;
      if (noBtn) noBtn.disabled = true;
    };
  }

  if (noBtn && Popup) {
    noBtn.onclick = () => {
      Popup.classList.add("hidden");
    };
  }

  if (playAgainBtn) {
    playAgainBtn.onclick = () => {
      window.location.reload();
    };
  }

  // Close Popup when clicking outside
  Popup.onclick = (e) => {
    if (e.target === Popup) {
      Popup.classList.add("hidden");
    }
  };
}

async function end_of_game_fetch(gameState: GameState, current: currentSong | null): Promise<void> {
  if (current === null) {
    try {
      const response = await fetch('/api/validate-guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_state: "finished" }) // special guess to trigger reveal
      });
      
      if (response.ok) {
        current = await response.json() as currentSong;
      }
    }
    catch (error) {
      console.error("Error fetching current song for reveal:", error);
      return;
    }
  }
}

export async function reveal(gameState: GameState, current: currentSong | null): Promise<void> {
  await end_of_game_fetch(gameState, current);

  if(!current) return;
  const statusEl = $("status");
  const metaEl = $("meta");
  if (!statusEl || !metaEl) return;

  // Reveal all hints
  updateHintState(current);
  renderHintBoxes();
  
  statusEl.textContent = "🔎 Revealed.";
  metaEl.innerHTML = `Answer: <b>${current.title}</b> — ${current.artist}`;

  // Unlock full audio when revealed
  gameState.maxListenTime = 30;
  gameState.attemptsRemaining = 0;
  updateGameStateUI(gameState);

  // Show completion Popup after a short delay
  setTimeout(() => showCompletionPopup(gameState, current), 800);
}

export function hideDD(guessDD: HTMLElement, ddIndex: number, ddItems: DropdownItem[]) { guessDD.classList.add("hidden"); guessDD.innerHTML = ""; ddIndex = -1; ddItems = []; }
function showDD(guessDD: HTMLElement) { guessDD.classList.remove("hidden"); }

function renderDD(items: DropdownItem[], guessDD: HTMLElement): void {
  if (!guessDD) {
    console.warn(`guessDD null case`);
    return;
  }
  guessDD.innerHTML = "";
  items.forEach((it: DropdownItem, i: number) => {
    const el = document.createElement("div");
    el.className = "flex gap-2.5 items-center px-3 py-2 cursor-pointer hover:bg-gray-100 aria-selected:bg-gray-100"; el.setAttribute("role", "option"); el.dataset.idx = String(i);
    el.innerHTML = `<img src="${it.artwork}" alt="" class="w-10 h-10 rounded-md object-cover">
      <div><div class="font-semibold">${it.title}</div><div class="text-gray-600">${it.artist}</div></div>`;
    el.onclick = () => selectItem(i, items, guessDD);
    guessDD.appendChild(el);
  });
  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "px-3 py-2 text-gray-600"; empty.textContent = "No songs found.";
    guessDD.appendChild(empty);
  }
  showDD(guessDD);
}

export function highlight(index: number, guessDD: HTMLElement): void {
  Array.from(guessDD.children).forEach((c, i) => c.setAttribute("aria-selected", i === index ? "true" : "false"));
  if (index >= 0 && guessDD.children[index]) guessDD.children[index].scrollIntoView({ block: "nearest" });
}

export function selectItem(index: number, ddItems: DropdownItem[], guessDD: HTMLElement): void {
  // Ensure the index is valid
  const selectedItem = ddItems?.[index];
  if (!selectedItem) {
    console.warn(`selectItem: Invalid index ${index} or no items available.`);
    return;
  }
  const guessInput = $("guess") as HTMLInputElement | null;
  if (!guessInput) {
    console.error("selectItem: Could not find guess input element.");
    return;
  }

  // Fill the input with the selected song title
  guessInput.value = selectedItem.title;

  hideDD(guessDD, index, ddItems);
  guessInput.focus();
}

function dedupeByTitle(results: ITunesTrack[]): DropdownItem[] {
  const seen = new Set(); const out = [];
  for (const r of results) {
    const key = (r.trackName || "").toLowerCase();
    if (!key || seen.has(key) || !r.previewUrl) continue;  // require preview
    seen.add(key);
    out.push({
      title: r.trackName,
      artist: r.artistName,
      artwork: (r.artworkUrl100 || "").replace("100x100bb", "60x60bb")
    });
  }
  return out;
}

export async function searchArtistSongs(query: string, aborter: AbortController | null, guessDD: HTMLElement, ddIndex: number, ddItems: DropdownItem[]): Promise<void> {
  // Cancel any ongoing request before starting a new one
  if (aborter) aborter.abort();
  aborter = new AbortController();
  const { signal } = aborter;

  // Get the country code
  const countryInput = $("country") as HTMLInputElement | null;
  const country = countryInput?.value || "us";

  // Skip if the query is too short
  if (query.trim().length < 2) {
    hideDD(guessDD, ddIndex, ddItems);
    return;
  }

  const searchUrl = new URL("https://itunes.apple.com/search");
  searchUrl.searchParams.set("media", "music");
  searchUrl.searchParams.set("entity", "song");
  searchUrl.searchParams.set("attribute", "artistTerm");
  searchUrl.searchParams.set("country", country);
  searchUrl.searchParams.set("limit", "50");
  searchUrl.searchParams.set("term", query.trim());

  try {
    const response = await fetch(searchUrl.toString(), { signal });
    const data: ITunesSearchResponse = await response.json();

    // Duplicates
    const uniqueSongs = dedupeByTitle(data.results ?? []).slice(0, 30);

    ddItems = uniqueSongs;
    renderDD(uniqueSongs, guessDD);

    // Select the first suggestion by default
    ddIndex = uniqueSongs.length > 0 ? 0 : -1;
    highlight(ddIndex, guessDD);
  } catch (error) {
    // If the user stopped typing before the request finished
    if (error instanceof DOMException && error.name === "AbortError") return;

    console.error("Error fetching artist songs:", error);
    hideDD(guessDD, ddIndex, ddItems);
  }
}

