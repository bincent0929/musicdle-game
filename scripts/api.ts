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

/**
 * Type guard for songs with preview URLs
 */
function isSongWithPreview(track: ITunesTrack): track is ITunesTrack & { previewUrl: string } {
  return track.kind === "song" && !!track.previewUrl;
}

/**
 * Type for explicit content ratings
 */
type ExplicitnessRating = "explicit" | "cleaned" | "notExplicit";

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

// allows us to use $ as shorthand for document.getElementById
const $ = (id:string) => document.getElementById(id);

// fetches a json from Apple's API
const rssTopSongs = (country: string, genre: string, limit=100) =>
  `https://itunes.apple.com/${country}/rss/topsongs/limit=${limit}/genre=${genre}/json`;

// stores the current song's arist and title info
let current : {artist: string, title: string} | null = null;
function normalize(s:string){ 
  return (s||"").toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); 
}

/* ------------ main game: pick & play a popular track ------------ */
/**
 * 1. pulls from the itunes API for the top songs.
 * 2. randomly picks one songs from the fetched songs.
 * 3. pulls the artist name, preview, and title from the lookup API.
 * @param tries 
 * @returns Promise<{preview: string, artist: string, title: string}>
 */
async function pickSongWithPreview(tries=6): Promise<{preview: string, artist: string, title: string}> {
  // this are taken from the user's input on the page
  const country = ($("country") as HTMLInputElement).value;
  const genre = ($("genre") as HTMLInputElement).value;
  
  ($("status") as HTMLElement).textContent = "Loading top songs…";
  ($("meta") as HTMLElement).textContent = "";
  ($("guess") as HTMLInputElement).value = "";
  ($("player") as HTMLAudioElement).src = "";

  // 1) Get top songs feed
  const feed = await fetch(rssTopSongs(country, genre, 100)).then(r => r.json()).catch(e => ({ feed: { entry: [] } }));
  const entries = feed?.feed?.entry || [];
  if (!entries.length) throw new Error("No songs found for that genre/country.");

  // 2) Try up to N random entries until one has previewUrl
  for (let i = 0; i < tries; i++) {
    const chosen = entries[Math.floor(Math.random() * entries.length)];
    const trackId = chosen?.id?.attributes?.["im:id"];
    const fallbackArtist = chosen?.["im:artist"]?.label || "";
    const fallbackTitle = chosen?.["im:name"]?.label || "";
    if (!trackId) continue;

    const looked = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(trackId)}&entity=song`)
      .then(r => r.json()).catch(()=>null);
    // !! x needs to be properly typed based on the API
    const item = looked?.results?.find((x:ITunesTrack) => x.kind === "song") || looked?.results?.[0];
    // grabs the preview url from the result
    const preview : string = item?.previewUrl;
    if (preview){
      // !! this log is just for debugging purposes
      console.log("Picked track:", fallbackArtist, "–", fallbackTitle);
      return { preview, artist: item?.artistName || fallbackArtist, title: item?.trackName || fallbackTitle };
    }
  }
  throw new Error("Could not find a preview for any of the picked tracks. Try again.");
}

async function pickSong(){
  let statusElement = $("status") as HTMLElement;
  let metaElement = $("meta") as HTMLElement;
    
  if (!statusElement) throw new Error("Status element not found.");
  if (!metaElement) throw new Error("Meta element not found.");
  
  try {
    const info = await pickSongWithPreview();
    current = { artist: info.artist, title: info.title };
    const player = $("player") as HTMLAudioElement;
    if (player === null) throw new Error("Audio player not found.");
    player.src = info.preview; player.load();
    // define the type for p
    const p = player.play();

    if (p && p.catch) await p.catch(()=>{statusElement.textContent="Tap ▶️ to start playback (autoplay blocked).";});
    if (!player.paused) statusElement.textContent = "Playing preview… guess the title!";
    metaElement.textContent = "";
  } catch (e){
    statusElement.textContent = (e as Error).message || "Error fetching song.";
    metaElement.textContent = "";
  }
}

function checkGuess(){
  if(!current) return;
  const guessInput = $("guess") as HTMLInputElement | null;
  const statusEl = $("status");
  if (!guessInput || !statusEl) return;
  
  const g = normalize(guessInput.value);
  const correct = normalize(current.title);
  if (!g) { 
    statusEl.textContent = "Type a guess first!"; 
    return; 
  }
  statusEl.textContent = (g && (correct.includes(g) || g === correct)) ? "✅ Correct!" : "❌ Not quite. Try again or Reveal.";
}
// This is not working right now
function reveal(){
  if(!current) return;
  const statusEl = $("status");
  const metaEl = $("meta");
  if (!statusEl || !metaEl) return;
  
  statusEl.textContent = "🔎 Revealed.";
  metaEl.innerHTML = `Answer: <b>${current.title}</b> — ${current.artist}`;
}

const newBtn = $("new");
const submitBtn = $("submit");
const guessInput = $("guess");

if (newBtn) newBtn.onclick = pickSong;
if (submitBtn) submitBtn.onclick = checkGuess;
if (guessInput) guessInput.addEventListener("keydown", e => { if(e.key==="Enter") checkGuess(); });


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
    el.className = "dd-item"; el.setAttribute("role", "option"); el.dataset.idx = String(i);
    el.innerHTML = `<img src="${it.artwork}" alt="">
      <div><div class="dd-title">${it.title}</div><div class="muted">${it.artist}</div></div>`;
    el.onclick = () => selectItem(i);
    guessDD.appendChild(el);
  });
  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "dd-item"; empty.textContent = "No songs found.";
    guessDD.appendChild(empty);
  }
  showDD();
}
function highlight(index: number): void {
  [...guessDD.children].forEach((c, i) => c.setAttribute("aria-selected", i === index ? "true" : "false"));
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
let t:any = null;
let guessElement = $("guess") as HTMLInputElement;

guessElement.addEventListener("input", (e)=>{
  const eventTarget = e.target as HTMLInputElement;
  const q = eventTarget.value.trim();
  clearTimeout(t);
  if (q.length < 2) { hideDD(); return; }
  t = setTimeout(() => searchArtistSongs(q), DEBOUNCE_MS);
});
guessElement.addEventListener("keydown", (e)=>{
  if (guessDD.classList.contains("hidden")) return;
  if (e.key === "ArrowDown") { e.preventDefault(); ddIndex = Math.min(ddIndex + 1, ddItems.length - 1); highlight(ddIndex); }
  else if (e.key === "ArrowUp") { e.preventDefault(); ddIndex = Math.max(ddIndex - 1, 0); highlight(ddIndex); }
  else if (e.key === "Enter") { if (ddIndex >= 0) { e.preventDefault(); selectItem(ddIndex); } }
  else if (e.key === "Escape") { hideDD(); }
});

// click outside to close
document.addEventListener("click", (e)=>{
  const wrap = document.querySelector(".guess-wrap")
  if(!wrap) return;
  if (!wrap.contains(e.target as Node)) hideDD();
});
