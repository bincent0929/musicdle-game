import type {
  DropdownItem,
  GameState,
  currentSong,
} from "./game-logic-types.js";

import { $ } from "../additional-functions.js";
import { GameElements } from "../dom/game-elements.js";

import {
  renderHintBoxes,
  revealedStateUpdate,
  updateHintsFromMatches,
  updateHintState,
} from "../hints.js";

import { ITunesSearchResponse, ITunesTrack } from "../api-types.js";

/**
 * Formats seconds into MM:SS format
 */
const formatTime = (s: number): string => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

// big old popup for game information
export function initGameInfoPopup(elements: GameElements): Promise<void> {
  const popup = elements.gameInfoPopup;
  const closeBtn = elements.gameInfoCloseBtn;

  return new Promise((resolve) => {
    const hidePopup = () => {
      // Move focus to the guess input before hiding the popup
      // This prevents aria-hidden violation when descendant has focus
      elements.guessInput.focus();

      // Now it's safe to hide the popup
      popup.classList.add("hidden");
      popup.setAttribute("aria-hidden", "true");

      // Resolve the promise when popup is closed
      resolve();
    };

    closeBtn.addEventListener("click", hidePopup);
    document.addEventListener("keydown", (event: KeyboardEvent) => {
      if (event.key === "Escape" && !popup.classList.contains("hidden")) {
        hidePopup();
      }
    });
  });
}

export async function fetchSongURL(): Promise<{
  songPreviewURL: currentSong;
} | null> {
  try {
    const urlResponse = await fetch(
      "https://backend.musicdle.xyz/api/daily-song-url"
    );
    if (!urlResponse.ok) {
      throw new Error(`Error fetching daily song: ${urlResponse.statusText}`);
    }
    const urlData = await urlResponse.json();

    return {
      songPreviewURL: {
        preview: urlData.previewUrl,
        artist: "",
        title: "",
        genre: "",
        releaseYear: "",
        albumName: "",
        fullTrack: null,
      },
    };
  } catch (e) {
    console.error(
      "Failed to fetch song URL:",
      e instanceof Error ? e.message : String(e)
    );
    return null;
  }
}

/**
 * Updates the UI to show current game state
 */
export function updateGameStateUI(
  gameState: GameState,
  elements: GameElements
): void {
  elements.attemptsElement.textContent = `Attempts remaining: ${gameState.attemptsRemaining}/5`;

  // Update the unlocked bar to reflect current maxListenTime
  const unlockedBar = elements.unlockedBar;
  if (unlockedBar) {
    const unlockedPct = Math.min((gameState.maxListenTime / 30) * 100, 100);
    unlockedBar.style.width = `${unlockedPct}%`;
  }
}

/**
 * Sets up audio event listeners to restrict playback to unlocked time
 */
export function setupAudioRestrictions(
  gameState: GameState,
  elements: GameElements
): void {
  const player = elements.audioPlayer;

  // Remove any existing listeners to avoid duplicates
  const newPlayer = player.cloneNode(true) as HTMLAudioElement;
  player.parentNode?.replaceChild(newPlayer, player);

  // CRITICAL: Update the cached reference in ElementManager
  elements.updateAudioPlayer(newPlayer);

  // --- Custom Player Elements ---
  const playBtn = elements.playBtn;
  let playIcon = elements.playIcon;
  let pauseIcon = elements.pauseIcon;
  const progressContainer = elements.progressContainer;
  let progressBar = elements.progressBar;
  const unlockedBar = elements.unlockedBar;

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
        const pct = gameState.maxListenTime > 0 ? Math.min((currentTime / gameState.maxListenTime) * (gameState.maxListenTime / 30) * 100, 100) : 0;
        progressBar.style.width = `${pct}%`;
    }
    if (unlockedBar) {
        const unlockedPct = Math.min((gameState.maxListenTime / 30) * 100, 100);
        unlockedBar.style.width = `${unlockedPct}%`;
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

      // Update the cached reference
      elements.updatePlayBtn(newBtn);

      // Re-get icon references from the new button
      const newPlayIcon = newBtn.querySelector("#play-icon") as HTMLElement | null;
      const newPauseIcon = newBtn.querySelector("#pause-icon") as HTMLElement | null;
      if (newPlayIcon) playIcon = newPlayIcon;
      if (newPauseIcon) pauseIcon = newPauseIcon;
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

      // Update the cached reference
      elements.updateProgressContainer(newContainer);

      const newProgressBar = newContainer.querySelector("#progress-bar") as HTMLElement | null;
      if (newProgressBar) progressBar = newProgressBar;

      const newUnlockedBar = newContainer.querySelector("#unlocked-bar") as HTMLElement | null;
      if (newUnlockedBar) {
        elements.updateUnlockedBar(newUnlockedBar);
      }

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

// VERY MUCH needs to be refactored
// do not think this works with the updated API right now
export async function checkGuess(
  gameState: GameState,
  current: currentSong | null,
  elements: GameElements
): Promise<void> {
  // maybe remove these checks
  // the main program should ensure these are valid
  if (!current) return;

  const playerGuessText: string = elements.guessInput.value.trim();
  if (!playerGuessText) {
    elements.statusElement.textContent = "Type a guess first!";
    return;
  }

  try {
    elements.statusElement.textContent = "Checking...";

    // Send guess to server for validation
    const response = await fetch(
      "https://backend.musicdle.xyz/api/validate-guess",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guessText: playerGuessText,
          gameOver: false,
        }),
      }
    );

    const result = await response.json();

    // Handle error responses
    if (!result.success) {
      elements.statusElement.textContent =
        result.message || "Error processing guess.";
      return;
    }

    const isCorrect: boolean = result.isCorrect;

    if (isCorrect) {
      // I don't think this works to correctly reveal everything
      // current isn't updated anywhere before this.

      current.artist = result.matches.artist;
      current.genre = result.matches.genre;
      current.releaseYear = result.matches.year;
      current.albumName = result.matches.album;
      current.fullTrack = result.trackData;

      updateHintState(current);
      renderHintBoxes();

      gameState.hasWon = true;
      gameState.maxListenTime = 30; // Unlock full 30-second preview
      elements.statusElement.textContent = "✅ Correct!";
      elements.metaElement.innerHTML = `You got it! <b>${current.fullTrack?.trackName}</b> by ${current.artist}`;
      updateGameStateUI(gameState, elements);
      // Show completion popup after a short delay
      setTimeout(() => showCompletionPopup(gameState, current, elements), 800);
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
      gameState.maxListenTime = Math.min(6 + gameState.wrongGuesses * 6, 30);

      if (gameState.attemptsRemaining > 0) {
        // Give feedback based on what was revealed
        let feedback = "❌ Not quite.";
        const revealed: Array<string> = [];
        revealedStateUpdate(revealed);

        if (revealed.length > 0) {
          feedback += ` Revealed: ${revealed.join(", ")}`;
        }

        elements.statusElement.textContent = feedback;
        updateGameStateUI(gameState, elements);
      } else {
        // Out of attempts - reveal everything
        // this does another fetch. which I don't know if I want that
        // I think there should be a check of whether there are more
        // attempts left and then have it do a fetch
        await end_of_game_fetch(current, elements.statusElement);

        updateHintState(current);
        renderHintBoxes();

        elements.statusElement.textContent = "❌ Out of attempts!";
        elements.metaElement.innerHTML = `Answer: <b>${current.fullTrack?.trackName}</b> — ${current.artist}`;
        gameState.maxListenTime = 30; // Unlock full audio after game over
        updateGameStateUI(gameState, elements);
        setTimeout(
          () => showCompletionPopup(gameState, current, elements),
          1500
        );
      }
    }

    // Clear the guess input
    elements.guessInput.value = "";
  } catch (error) {
    console.error("Error checking guess:", error);
    elements.statusElement.textContent =
      "⚠️ Error processing guess. Try again.";
  }
}

async function showCompletionPopup(
  gameState: GameState,
  current: currentSong,
  elements: GameElements
): Promise<void> {
  //await end_of_game_fetch(current, elements.statusElement);

  const popup = elements.completionPopup;

  // Calculate score based on game state
  const score = gameState.hasWon ? 6 - gameState.wrongGuesses : 0;
  const scoreEl = elements.popupScore;
  if (scoreEl) {
    scoreEl.textContent = score.toString();
  }

  // Show number of guesses made
  const guessesEl = elements.popupGuesses;
  if (guessesEl) {
    const guessesMade = gameState.wrongGuesses + (gameState.hasWon ? 1 : 0);
    guessesEl.textContent = guessesMade.toString();
  }

  // Populate song information
  if (current) {
    const songTitleEl = elements.popupSongTitle;
    const artistNameEl = elements.popupArtistName;
    const albumArtEl = elements.popupAlbumArt;

    if (songTitleEl && current.fullTrack) {
      songTitleEl.textContent = current.fullTrack?.trackName;
    }
    if (artistNameEl) {
      artistNameEl.textContent = current.artist;
    }
    if (albumArtEl && current.fullTrack) {
      const artworkUrl =
        current.fullTrack.artworkUrl100 || current.fullTrack.artworkUrl60 || "";
      const highResArtwork = artworkUrl
        .replace("100x100bb", "300x300bb")
        .replace("60x60bb", "300x300bb");
      albumArtEl.src = highResArtwork;
      albumArtEl.alt = `${current.albumName} album artwork`;
    }
  }

  // Show the Popup
  popup.classList.remove("hidden");

  // Setup event listeners for Popup buttons
  const yesBtn = elements.popupYesBtn;
  const noBtn = elements.popupNoBtn;
  const playAgainBtn = elements.popupPlayAgainBtn;
  const noteEl = elements.popupNote;

  if (yesBtn && noteEl) {
    yesBtn.onclick = () => {
      // Save to localStorage
      const saved = localStorage.getItem("musicdle-scores") || "[]";
      const scores = JSON.parse(saved);
      scores.push({
        score: score,
        date: new Date().toISOString(),
        song: current?.title,
        artist: current?.artist,
      });
      localStorage.setItem("musicdle-scores", JSON.stringify(scores));

      noteEl.classList.remove("hidden");
      if (yesBtn) yesBtn.disabled = true;
      if (noBtn) noBtn.disabled = true;
    };
  }

  if (noBtn) {
    noBtn.onclick = () => {
      popup.classList.add("hidden");
    };
  }

  if (playAgainBtn) {
    playAgainBtn.onclick = () => {
      window.location.reload();
    };
  }

  // Close Popup when clicking outside
  popup.onclick = (e) => {
    if (e.target === popup) {
      popup.classList.add("hidden");
    }
  };
}

async function end_of_game_fetch(
  current: currentSong,
  statusEl: HTMLElement
): Promise<void> {
  const response = await fetch(
    "https://backend.musicdle.xyz/api/validate-guess",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guessText: null,
        gameOver: true,
      }),
    }
  );

  const result = await response.json();

  // Handle error responses
  if (!result.success) {
    statusEl.textContent = result.message || "Error processing guess.";
    return;
  }

  current.artist = result.matches.artist;
  current.genre = result.matches.genre;
  current.releaseYear = result.matches.year;
  current.albumName = result.matches.album;
  current.fullTrack = result.trackData;
}

export async function reveal(
  gameState: GameState,
  current: currentSong | null,
  elements: GameElements
): Promise<void> {
  if (!current) return;

  await end_of_game_fetch(current, elements.statusElement);

  // Reveal all hints
  updateHintState(current);
  renderHintBoxes();

  elements.statusElement.textContent = "🔎 Revealed.";
  elements.metaElement.innerHTML = `Answer: <b>${current.fullTrack?.trackName}</b> — ${current.artist}`;

  // Unlock full audio when revealed
  gameState.maxListenTime = 30;
  gameState.attemptsRemaining = 0;
  updateGameStateUI(gameState, elements);

  // Show completion Popup after a short delay
  setTimeout(() => showCompletionPopup(gameState, current, elements), 800);
}

export function hideDD(
  elements: GameElements,
  ddIndex: number,
  ddItems: DropdownItem[]
) {
  const guessDD = elements.guessDropdown;
  guessDD.classList.add("hidden");
  guessDD.innerHTML = "";
  ddIndex = -1;
  ddItems = [];
}

function showDD(elements: GameElements) {
  elements.guessDropdown.classList.remove("hidden");
}

function renderDD(
  items: DropdownItem[],
  elements: GameElements,
  onSelectCallback?: (index: number, items: DropdownItem[]) => void
): void {
  const guessDD = elements.guessDropdown;
  if (!guessDD) {
    console.warn(`guessDD null case`);
    return;
  }
  guessDD.innerHTML = "";
  items.forEach((it: DropdownItem, i: number) => {
    const el = document.createElement("div");
    el.className =
      "flex gap-2.5 items-center px-3 py-2 cursor-pointer hover:bg-gray-100 aria-selected:bg-gray-100";
    el.setAttribute("role", "option");
    el.dataset.idx = String(i);
    el.innerHTML = `<img src="${it.artwork}" alt="" class="w-10 h-10 rounded-md object-cover">
      <div><div class="font-semibold">${it.title}</div><div class="text-gray-600">${it.artist}</div></div>`;
    el.onclick = () => {
      selectItem(i, items, elements);
      if (onSelectCallback) onSelectCallback(i, items);
    };
    guessDD.appendChild(el);
  });
  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "px-3 py-2 text-gray-600";
    empty.textContent = "No songs found.";
    guessDD.appendChild(empty);
  }
  showDD(elements);
}

export function highlight(index: number, elements: GameElements): void {
  const guessDD = elements.guessDropdown;
  Array.from(guessDD.children).forEach((c, i) =>
    c.setAttribute("aria-selected", i === index ? "true" : "false")
  );
  if (index >= 0 && guessDD.children[index])
    guessDD.children[index].scrollIntoView({ block: "nearest" });
}

export function selectItem(
  index: number,
  ddItems: DropdownItem[],
  elements: GameElements
): void {
  // Ensure the index is valid
  const selectedItem = ddItems?.[index];
  if (!selectedItem) {
    console.warn(`selectItem: Invalid index ${index} or no items available.`);
    return;
  }

  // Fill the input with the selected song title
  elements.guessInput.value = selectedItem.title;

  hideDD(elements, index, ddItems);
  elements.guessInput.focus();
}

function dedupeByTitle(results: ITunesTrack[]): DropdownItem[] {
  const seen = new Set();
  const out = [];
  for (const r of results) {
    const key = (r.trackName || "").toLowerCase();
    if (!key || seen.has(key) || !r.previewUrl) continue; // require preview
    seen.add(key);
    out.push({
      title: r.trackName,
      artist: r.artistName,
      artwork: (r.artworkUrl100 || "").replace("100x100bb", "60x60bb"),
    });
  }
  return out;
}

export async function searchArtistSongs(
  query: string,
  aborter: AbortController | null,
  elements: GameElements,
  ddIndex: number,
  ddItems: DropdownItem[],
  onSelectCallback?: (index: number, items: DropdownItem[]) => void
): Promise<void> {
  // Cancel any ongoing request before starting a new one
  if (aborter) aborter.abort();
  aborter = new AbortController();
  const { signal } = aborter;

  // Get the country code
  const countryInput = $("country") as HTMLInputElement | null;
  const country = countryInput?.value || "us";

  // Skip if the query is too short
  if (query.trim().length < 2) {
    hideDD(elements, ddIndex, ddItems);
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
    renderDD(uniqueSongs, elements, onSelectCallback);

    // Select the first suggestion by default
    ddIndex = uniqueSongs.length > 0 ? 0 : -1;
    highlight(ddIndex, elements);
  } catch (error) {
    // If the user stopped typing before the request finished
    if (error instanceof DOMException && error.name === "AbortError") return;

    console.error("Error fetching artist songs:", error);
    hideDD(elements, ddIndex, ddItems);
  }
}
