/**
 * Look at https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/index.html#//apple_ref/doc/uid/TP40017632-CH3-SW1
 * for the iTunes Search API documentation.
 */
/**
 * iTunes Search API Track Result
 * Based on Apple's official documentation
 */

/**
 * I had Claude go ahead and write up an interface (kind of like a structure)
 * for the return type of the iTunes API.
 */
interface ITunesTrack {
  // Core identification
  wrapperType: "track" | "collection" | "artist";
  kind: "book" | "album" | "coached-audio" | "feature-movie" |
  "interactive-booklet" | "music-video" | "pdf" | "podcast" |
  "podcast-episode" | "software-package" | "song" | "tv-episode" | "artist";

  // IDs
  trackId: number;
  artistId: number;
  collectionId: number;

  // Names
  trackName: string;
  artistName: string;
  collectionName: string;

  // Censored versions (objectionable words *'d out)
  trackCensoredName: string;
  collectionCensoredName: string;

  // URLs for viewing in iTunes Store
  artistViewUrl: string;
  collectionViewUrl: string;
  trackViewUrl: string;

  // Preview URL (30-second preview) - only for tracks
  previewUrl?: string;

  // Artwork URLs
  artworkUrl60?: string;   // 60x60 pixels
  artworkUrl100?: string;  // 100x100 pixels

  // Pricing
  collectionPrice: number;
  trackPrice: number;
  currency: string;  // e.g., "USD"

  // Explicit content ratings (RIAA parental advisory)
  trackExplicitness: "explicit" | "cleaned" | "notExplicit";
  collectionExplicitness: "explicit" | "cleaned" | "notExplicit";

  // Track metadata
  discCount: number;
  discNumber: number;
  trackCount: number;
  trackNumber: number;
  trackTimeMillis: number;  // Track duration in milliseconds

  // Location and genre
  country: string;  // e.g., "USA"
  primaryGenreName: string;  // e.g., "Rock"

  // Additional fields commonly returned but not in the example
  releaseDate?: string;  // ISO 8601 format
  collectionArtistId?: number;
  collectionArtistName?: string;
  collectionArtistViewUrl?: string;

  // For different media types
  contentAdvisoryRating?: string;  // For movies/TV
  shortDescription?: string;
  longDescription?: string;

  // Radio station specific
  radioStationUrl?: string;

  // Streaming availability
  isStreamable?: boolean;

  // Additional artwork sizes (sometimes included)
  artworkUrl30?: string;
  artworkUrl512?: string;
  artworkUrl600?: string;

  // Genre IDs
  genreIds?: string[];
  genres?: string[];
}

/**dropdownItem definition */
interface DropdownItem {
  title: string;
  artist: string;
  artwork: string;
}

/**
 * iTunes API Response wrapper
 */
interface ITunesSearchResponse {
  resultCount: number;
  results: ITunesTrack[];
}

interface ITunesRSSEntry {
  /**
   * The reason `im` is here is because that's how the
   * RSS XML is formatted by Apple in the response
   */
  id: {
    attributes: {
      "im:id": string;
    };
  };
  "im:name": {
    label: string; // track title
  }
  "im:artist": {
    label: string; // artist name
  }
}

interface ITunesRSSResponse {
  feed: {
    entry: ITunesRSSEntry[]
  }
}

interface currentSong {
  preview: string
  artist: string
  title: string
}

interface GameState {
  attemptsRemaining: number;
  wrongGuesses: number;
  maxListenTime: number;
  hasWon: boolean;
}

interface HintState {
  artist: { value: string; revealed: boolean };
  genre: { value: string; revealed: boolean };
  year: { value: string; revealed: boolean };
  album: { value: string; revealed: boolean };
}

interface EnhancedCurrentSong extends currentSong {
  genre: string;
  releaseYear: string;
  albumName: string;
  fullTrack: ITunesTrack;
}
/**
 * Media kinds enum for better type safety
 */
enum ITunesMediaKind {
  Book = "book",
  Album = "album",
  CoachedAudio = "coached-audio",
  FeatureMovie = "feature-movie",
  InteractiveBooklet = "interactive-booklet",
  MusicVideo = "music-video",
  PDF = "pdf",
  Podcast = "podcast",
  PodcastEpisode = "podcast-episode",
  SoftwarePackage = "software-package",
  Song = "song",
  TVEpisode = "tv-episode",
  Artist = "artist"
}

/**
 * Type for explicit content ratings
 */
type ExplicitnessRating = "explicit" | "cleaned" | "notExplicit";

//let current: currentSong | null = null;
let current: EnhancedCurrentSong | null = null;

let hintState: HintState = {
  artist: { value: "", revealed: false },
  genre: { value: "", revealed: false },
  year: { value: "", revealed: false },
  album: { value: "", revealed: false }
};

let gameState: GameState = {
  attemptsRemaining: 5,
  wrongGuesses: 0,
  maxListenTime: 6,
  hasWon: false
};

// allows us to use $ as shorthand for document.getElementById
const $ = (id: string) => document.getElementById(id);

function normalize(s: string) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/**
 * Type guard for songs with preview URLs
 */
function isSongWithPreview(track: ITunesTrack): track is ITunesTrack & { previewUrl: string } {
  return track.kind === "song" && !!track.previewUrl;
}

/**
 * Extract year from release date string
 */
function extractYear(releaseDate?: string): string {
  if (!releaseDate) return "Unknown";
  return new Date(releaseDate).getFullYear().toString();
}

/**
 * Initialize or update the hint boxes in the DOM
 */
function initializeHintBoxes(): void {
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
function renderHintBoxes(): void {
  updateHintBox("hint-artist", hintState.artist.value, hintState.artist.revealed);
  updateHintBox("hint-genre", hintState.genre.value, hintState.genre.revealed);
  updateHintBox("hint-year", hintState.year.value, hintState.year.revealed);
  updateHintBox("hint-album", hintState.album.value, hintState.album.revealed);
}

/**
 * Check a guess and update hint state
 */
function checkGuessAgainstCurrent(guessedTrack: ITunesTrack): boolean {
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

/* ------------ main game: pick & play a popular track ------------ */
/**
 * 1. pulls from the itunes API for the top songs.
 * 2. randomly picks one songs from the fetched songs.
 * 3. pulls the artist name, preview, and title from the lookup API.
 * @param tries 
 * @returns Promise<{preview: string, artist: string, title: string}>
 */


async function pickSongWithPreview(tries = 6): Promise<EnhancedCurrentSong> {
  // this are taken from the user's input on the page
  //const country = ($("country") as HTMLInputElement).value;
  //const genre = ($("genre") as HTMLInputElement).value;
  ($("status") as HTMLElement).textContent = "Loading top songs…";
  ($("meta") as HTMLElement).textContent = "";
  ($("guess") as HTMLInputElement).value = "";
  ($("player") as HTMLAudioElement).src = "";

  // the max amount of songs you can get is 200 from iTunes
  const feed: ITunesRSSResponse = await fetch('https://itunes.apple.com/us/rss/topsongs/limit=200/genre=1/json')
    .then(r => r.json()).catch(e => ({ feed: { entry: [] } }));
  const entries = feed?.feed?.entry || [];
  if (!entries.length) throw new Error("No songs found for that genre/country.");
  // 2) Try up to N random entries until one has previewUrl

  for (let i = 0; i < tries; i++) {
    const chosen = entries[Math.floor(Math.random() * entries.length)];
    const trackId: ITunesRSSEntry['id']['attributes']['im:id'] = chosen?.id?.attributes?.["im:id"];
    if (!trackId) continue;

    const looked: ITunesSearchResponse | null = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(trackId)}&entity=song`)
      .then(r => r.json()).catch(() => null);
    const item: ITunesTrack | undefined = looked?.results?.find((x: ITunesTrack) => x.kind === "song") || looked?.results?.[0];
    
    const preview = item?.previewUrl;
    if (preview && item) {
      return {
        preview,
        artist: item.artistName,
        title: item.trackName,
        genre: item.primaryGenreName,
        releaseYear: extractYear(item.releaseDate),
        albumName: item.collectionName,
        fullTrack: item
      };
    }
  }
  throw new Error("Could not find a preview for any of the picked tracks. Try again.");
}

/**
 * Updates the UI to show current game state
 */
function updateGameStateUI(): void {
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
function setupAudioRestrictions(player: HTMLAudioElement): void {
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


async function pickSong() {
  let statusElement = $("status") as HTMLElement;
  let metaElement = $("meta") as HTMLElement;

  if (!statusElement) throw new Error("Status element not found.");
  if (!metaElement) throw new Error("Meta element not found.");

  try {
    // Reset game state AND hint state for new song
    gameState = {
      attemptsRemaining: 5,
      wrongGuesses: 0,
      maxListenTime: 6,
      hasWon: false
    };
    
    hintState = {
      artist: { value: "", revealed: false },
      genre: { value: "", revealed: false },
      year: { value: "", revealed: false },
      album: { value: "", revealed: false }
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
    const isCorrect = checkGuessAgainstCurrent(guessedTrack);
    renderHintBoxes();

    if (isCorrect) {
      // CORRECT - reveal all remaining hints
      hintState.artist.value = current.artist;
      hintState.artist.revealed = true;
      hintState.genre.value = current.genre;
      hintState.genre.revealed = true;
      hintState.year.value = current.releaseYear;
      hintState.year.revealed = true;
      hintState.album.value = current.albumName;
      hintState.album.revealed = true;
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
        const revealed = [];
        if (hintState.artist.revealed) revealed.push("artist");
        if (hintState.genre.revealed) revealed.push("genre");
        if (hintState.year.revealed) revealed.push("year");
        if (hintState.album.revealed) revealed.push("album");
        
        if (revealed.length > 0) {
          feedback += ` Revealed: ${revealed.join(", ")}`;
        }
        
        statusEl.textContent = feedback;
        updateGameStateUI();
      } else {
        // Out of attempts - reveal everything
        hintState.artist.value = current.artist;
        hintState.artist.revealed = true;
        hintState.genre.value = current.genre;
        hintState.genre.revealed = true;
        hintState.year.value = current.releaseYear;
        hintState.year.revealed = true;
        hintState.album.value = current.albumName;
        hintState.album.revealed = true;
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
  hintState.artist.value = current.artist;
  hintState.artist.revealed = true;
  hintState.genre.value = current.genre;
  hintState.genre.revealed = true;
  hintState.year.value = current.releaseYear;
  hintState.year.revealed = true;
  hintState.album.value = current.albumName;
  hintState.album.revealed = true;
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

// big old popup for game information
function initGameInfoPopup(): void {
  const popup = document.getElementById("game-info-popup");
  const closeBtn = document.getElementById("game-info-close");
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
