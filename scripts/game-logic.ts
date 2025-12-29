import type { currentSong, GameState, DropdownItem } from "./game-logic-types.js";
import type { ITunesTrack, ITunesSearchResponse } from "./api-types.js";

import { $, normalize } from "./additional-functions.js";

import { pickSongWithPreview } from "./api.js";

import { initializeHintBoxes, renderHintBoxes, checkGuessAgainstCurrent, updateHintState, revealedStateUpdate } from "./hints.js";

let gameState: GameState = {
  attemptsRemaining: 5,
  wrongGuesses: 0,
  maxListenTime: 6,
  hasWon: false
};

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

//let current: currentSong | null = null;
let current: currentSong | null = null;

// big old popup for game information
function initGameInfoPopup(): void {
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

initGameInfoPopup();

async function pickSong() {
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

  try {
    // Reset game state AND hint state for new song
    gameState = {
      attemptsRemaining: 5,
      wrongGuesses: 0,
      maxListenTime: 6,
      hasWon: false
    };

    // Initialize hint boxes
    initializeHintBoxes();
    renderHintBoxes();

    current = await pickSongWithPreview();
    const player = $("player") as HTMLAudioElement;
    if (player === null) throw new Error("Audio player not found.");
    player.src = current.preview;
    player.load();

    // Set up audio restrictions
    setupAudioRestrictions(player);

    // Get the new player element after replacement in setupAudioRestrictions
    const restrictedPlayer = $("player") as HTMLAudioElement;
    const p = restrictedPlayer.play();

    if (p && p.catch) await p.catch(() => { statusElement.textContent = "Tap ▶️ to start playback (autoplay blocked)."; });
    if (!restrictedPlayer.paused) statusElement.textContent = "Playing preview… guess the title!";
    metaElement.textContent = "";
    updateGameStateUI();
  } catch (e) {
    statusElement.textContent = (e as Error).message || "Error fetching song.";
    metaElement.textContent = "";
  }
}

/**
 * Updates the UI to show current game state
 */
function updateGameStateUI(): void {
  const attemptsEl = $("attempts");
  const unlockedEl = $("unlocked");
  const unlockedBar = $("unlocked-bar");
  const totalTimeEl = $("total-time");
  const player = $("player") as HTMLAudioElement | null;

  const fallbackDuration = 30;
  const rawDuration = player?.duration ?? fallbackDuration;
  const duration = Number.isFinite(rawDuration) && rawDuration > 0 ? rawDuration : fallbackDuration;
  const allowedTime = gameState.hasWon ? duration : Math.min(gameState.maxListenTime, duration);

  if (attemptsEl) {
    attemptsEl.textContent = `Attempts remaining: ${gameState.attemptsRemaining}/5`;
  }

  if (unlockedEl) {
    unlockedEl.textContent = `Unlocked: ${gameState.maxListenTime} seconds`;
  }

  if (unlockedBar) {
    // Assuming 30s is the standard preview length
    const percentage = Math.min((gameState.maxListenTime / 30) * 100, 100);
    unlockedBar.style.width = `${percentage}%`;
  }

  if (totalTimeEl) {
    totalTimeEl.textContent = formatTime(allowedTime);
  }
}

/**
 * Sets up audio event listeners to restrict playback to unlocked time
 */
function setupAudioRestrictions(player: HTMLAudioElement): void {
  // Remove any existing listeners to avoid duplicates
  const newPlayer = player.cloneNode(true) as HTMLAudioElement;
  player.parentNode?.replaceChild(newPlayer, player);

  // --- Custom Player Elements ---
  const playBtn = $("play-btn");
  let playIcon = $("play-icon");
  let pauseIcon = $("pause-icon");
  const progressContainer = $("progress-container");
  let progressBar = $("progress-bar");
  const timeDisplay = $("current-time");
  const totalTimeDisplay = $("total-time");

  const toggleIcons = (isPlaying: boolean) => {
    if (!playIcon || !pauseIcon) return;
    if (isPlaying) {
      playIcon.classList.add("hidden");
      pauseIcon.classList.remove("hidden");
    } else {
      playIcon.classList.remove("hidden");
      pauseIcon.classList.add("hidden");
    }
  };

  // Ensure icons start in a paused state
  toggleIcons(false);

  const getDuration = () => {
    const raw = newPlayer.duration;
    return Number.isFinite(raw) && raw > 0 ? raw : 30;
  };

  const getAllowedTime = () => gameState.hasWon ? getDuration() : Math.min(gameState.maxListenTime, getDuration());

  // --- Audio Events ---

  // timeupdate: pause and reset when reaching the time limit + Update UI
  newPlayer.addEventListener('timeupdate', () => {
    const currentTime = newPlayer.currentTime;
    
    // Restriction Logic
    if (!gameState.hasWon && currentTime >= gameState.maxListenTime) {
      newPlayer.pause();
      newPlayer.currentTime = 0;
    }

    // UI Update
    if (progressBar) {
        const duration = getDuration();
        const pct = duration ? Math.min((currentTime / duration) * 100, 100) : 0;
        progressBar.style.width = `${pct}%`;
    }
    if (timeDisplay) {
        const allowedTime = getAllowedTime();
        timeDisplay.textContent = formatTime(Math.min(currentTime, allowedTime));
    }
    if (totalTimeDisplay) {
        totalTimeDisplay.textContent = formatTime(getAllowedTime());
    }
  });

  // seeking: prevent seeking beyond unlocked time
  newPlayer.addEventListener('seeking', () => {
    const allowedTime = getAllowedTime();
    if (!gameState.hasWon && newPlayer.currentTime > allowedTime) {
      newPlayer.currentTime = allowedTime;
    }
  });

  // ended: reset to beginning for replay
  newPlayer.addEventListener('ended', () => {
    newPlayer.currentTime = 0;
    toggleIcons(false);
  });

  newPlayer.addEventListener('play', () => {
      toggleIcons(true);
  });

  newPlayer.addEventListener('pause', () => {
      toggleIcons(false);
  });

  // --- UI Interaction Events ---
  
  // Re-bind Play Button
  if (playBtn) {
      const newBtn = playBtn.cloneNode(true) as HTMLElement;
      playBtn.parentNode?.replaceChild(newBtn, playBtn);
      playIcon = newBtn.querySelector("#play-icon") as HTMLElement | null;
      pauseIcon = newBtn.querySelector("#pause-icon") as HTMLElement | null;
      toggleIcons(!newPlayer.paused);
      
      newBtn.addEventListener("click", () => {
          if (newPlayer.paused) {
              newPlayer.play();
              toggleIcons(true);
          } else {
              newPlayer.pause();
              toggleIcons(false);
          }
      });
  }

  // Re-bind Progress Bar Click
  if (progressContainer) {
      const newContainer = progressContainer.cloneNode(true) as HTMLElement;
      progressContainer.parentNode?.replaceChild(newContainer, progressContainer);
      progressBar = newContainer.querySelector("#progress-bar") as HTMLElement | null;

      newContainer.addEventListener("click", (e) => {
          const rect = newContainer.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const width = rect.width;
          const pct = Math.max(0, Math.min(1, x / width));
          const duration = getDuration();
          let targetTime = pct * duration;

          // Clamp to unlocked time
          if (!gameState.hasWon) {
              const allowedTime = getAllowedTime();
              if (targetTime > allowedTime) {
                targetTime = allowedTime;
              }
          }

          newPlayer.currentTime = targetTime;
      });
  }
}

/**
 * This needs to be refactored to not use the iTunes Search.
 * It should just pull from the data that the API grabbed when it was queried in
 * pickSongWithPreview.
 * Have it pull from entries that was created in pickSongWithPreview.
 */
async function checkGuess() {
  if (!current) return;

  const guessInput = $("guess") as HTMLInputElement | null;
  const statusEl = $("status");
  const metaEl = $("meta");
  
  if (!guessInput || !statusEl || !metaEl) return;

  const playerGuessText: string = guessInput.value.trim();
  if (!playerGuessText) {
    statusEl.textContent = "Type a guess first!";
    return;
  }

  // Search for the guessed track to get full details
  try {
    statusEl.textContent = "Checking...";
    
    const searchUrl = new URL("https://itunes.apple.com/search");
    searchUrl.searchParams.set("media", "music");
    searchUrl.searchParams.set("entity", "song");
    searchUrl.searchParams.set("term", playerGuessText);
    searchUrl.searchParams.set("limit", "5");

    const response = await fetch(searchUrl.toString());
    const data: ITunesSearchResponse = await response.json();

    if (data.results.length === 0) {
      statusEl.textContent = "❓ Song not found. Try selecting from the dropdown.";
      return;
    }

    // Find best match - prefer exact title match
    const normalizedGuess = normalize(playerGuessText);
    let guessedTrack = data.results.find(t => normalize(t.trackName) === normalizedGuess);
    if (!guessedTrack) guessedTrack = data.results[0];

    // Check the guess and update hints
    const isCorrect = checkGuessAgainstCurrent(guessedTrack, current);
    renderHintBoxes();

    if (isCorrect) {
      // CORRECT - reveal all remaining hints
      updateHintState(current);
      renderHintBoxes();

      gameState.hasWon = true;
      gameState.maxListenTime = 30;// Unlock full 30-second preview
      statusEl.textContent = "✅ Correct!";
      metaEl.innerHTML = `You got it! <b>${current.title}</b> by ${current.artist}`;
      updateGameStateUI();
      // Show completion popup after a short delay
      setTimeout(() => showCompletionPopup(), 800);
    } else {
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
        updateGameStateUI();
      } else {
        // Out of attempts - reveal everything
        updateHintState(current);
        renderHintBoxes();

        statusEl.textContent = "❌ Out of attempts!";
        metaEl.innerHTML = `Answer: <b>${current.title}</b> — ${current.artist}`;
        gameState.maxListenTime = 30;// Unlock full audio after game over
        updateGameStateUI();
        setTimeout(() => showCompletionPopup(), 1500);
      }
    }

    // Clear the guess input
    guessInput.value = "";

  } catch (error) {
    console.error("Error checking guess:", error);
    statusEl.textContent = "⚠️ Error processing guess. Try again.";
  }
}

function showCompletionPopup(): void {
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

function reveal(){
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
  updateGameStateUI();

  // Show completion Popup after a short delay
  setTimeout(() => showCompletionPopup(), 800);
}

const newBtn = $("new");
const submitBtn = $("submit");
const revealBtn = $("reveal");
const guessInput = $("guess");

if (newBtn) newBtn.onclick = pickSong;
if (submitBtn) submitBtn.onclick = checkGuess;
if (revealBtn) revealBtn.onclick = reveal;
if (guessInput) guessInput.addEventListener("keydown", e => { if (e.key === "Enter") checkGuess(); });

// Auto-start a song on load
pickSong();


/* ------------ integrated dropdown on the Guess input ------------ */
const guessDD = $("guessDD") as HTMLDivElement;
let ddIndex = -1;
let ddItems: DropdownItem[] = [];
let aborter: AbortController | null = null;

function hideDD() { guessDD.classList.add("hidden"); guessDD.innerHTML = ""; ddIndex = -1; ddItems = []; }
function showDD() { guessDD.classList.remove("hidden"); }

function renderDD(items: DropdownItem[]): void {
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
    el.onclick = () => selectItem(i);
    guessDD.appendChild(el);
  });
  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "px-3 py-2 text-gray-600"; empty.textContent = "No songs found.";
    guessDD.appendChild(empty);
  }
  showDD();
}

function highlight(index: number): void {
  Array.from(guessDD.children).forEach((c, i) => c.setAttribute("aria-selected", i === index ? "true" : "false"));
  if (index >= 0 && guessDD.children[index]) guessDD.children[index].scrollIntoView({ block: "nearest" });
}

function selectItem(index: number): void {
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

  hideDD();
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

async function searchArtistSongs(query: string): Promise<void> {
  // Cancel any ongoing request before starting a new one
  if (aborter) aborter.abort();
  aborter = new AbortController();
  const { signal } = aborter;

  // Get the country code
  const countryInput = $("country") as HTMLInputElement | null;
  const country = countryInput?.value || "us";

  // Skip if the query is too short
  if (query.trim().length < 2) {
    hideDD();
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
    renderDD(uniqueSongs);

    // Select the first suggestion by default
    ddIndex = uniqueSongs.length > 0 ? 0 : -1;
    highlight(ddIndex);
  } catch (error) {
    // If the user stopped typing before the request finished
    if (error instanceof DOMException && error.name === "AbortError") return;

    console.error("Error fetching artist songs:", error);
    hideDD();
  }
}

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
    checkGuessAgainstCurrent,
    updateHintState,
    revealedStateUpdate
};
