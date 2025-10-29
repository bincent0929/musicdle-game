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
 * @returns 
 */
async function pickSongWithPreview(tries=6): Promise<{preview: string, artist: string, title: string}> {
  // this are taken from the user's input on the page
  const country = ($("country") as HTMLInputElement).value;
  const genre = ($("genre") as HTMLInputElement).value;
  
  ($("status") as HTMLElement).textContent = "Loading top songs…";
  ($("meta") as HTMLElement).textContent = "";
  ($("guess") as HTMLInputElement).value = "";
  ($("player") as HTMLAudioElement).src = "";

  // fetches the top 100 songs
  const feed = await fetch(rssTopSongs(country, genre, 100)).then(r => r.json()).catch(()=>({feed:{entry:[]}}));
  const entries = feed?.feed?.entry || [];
  if (!entries.length) throw new Error("No songs found for that genre/country.");

  for (let i=0; i<tries; i++){
    // randomly chooses a song
    const chosen = entries[Math.floor(Math.random()*entries.length)];
    // grabs the info for the song
    const trackId : number = chosen?.id?.attributes?.["im:id"];
    // !! the artist could be a number value or it could be the string. It needs to be double checked.
    const fallbackArtist : string = chosen?.["im:artist"]?.label || "";
    const fallbackTitle : string  = chosen?.["im:name"]?.label || "";
    if (!trackId) continue;
    
    // looks up the song using its id from the iTunes lookup API
    const looked = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(trackId)}&entity=song`)
      .then(r => r.json()).catch(()=>null);
    // !! x needs to be properly typed based on the API
    const item = looked?.results?.find(x => x.kind === "song") || looked?.results?.[0];
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
  try {
    const info = await pickSongWithPreview();
    current = { artist: info.artist, title: info.title };
    const player = $("player");
    player.src = info.preview; player.load();
    const p = player.play();
    if (p && p.catch) await p.catch(()=>{$("status").textContent="Tap ▶️ to start playback (autoplay blocked).";});
    if (!player.paused) $("status").textContent = "Playing preview… guess the title!";
    $("meta").textContent = "";
  } catch (e){
    $("status").textContent = e.message || "Error fetching song.";
    $("meta").textContent = "";
  }
}

function checkGuess(){
  if(!current) return;
  const g = normalize(($("guess") as HTMLInputElement).value);
  const correct = normalize(current.title);
  if (!g) { $("status").textContent = "Type a guess first!"; return; }
  $("status").textContent = (g && (correct.includes(g) || g === correct)) ? "✅ Correct!" : "❌ Not quite. Try again or Reveal.";
}
// This is not working right now
function reveal(){
  if(!current) return;
  $("status").textContent = "🔎 Revealed.";
  $("meta").innerHTML = `Answer: <b>${current.title}</b> — ${current.artist}`;
}
$("new").onclick = pickSong;
$("submit").onclick = checkGuess;
$("guess").addEventListener("keydown", e => { if(e.key==="Enter") checkGuess(); });

/* ------------ integrated dropdown on the Guess input ------------ */
const guessDD = $("guessDD");
let ddIndex = -1, ddItems = [], aborter = null;

function hideDD(){ guessDD.classList.add("hidden"); guessDD.innerHTML=""; ddIndex=-1; ddItems=[]; }
function showDD(){ guessDD.classList.remove("hidden"); }

function renderDD(items){
  guessDD.innerHTML = "";
  items.forEach((it, i) => {
    const el = document.createElement("div");
    el.className = "dd-item"; el.setAttribute("role","option"); el.dataset.idx = i;
    el.innerHTML = `<img src="${it.artwork}" alt="">
      <div><div class="dd-title">${it.title}</div><div class="muted">${it.artist}</div></div>`;
    el.onclick = () => selectItem(i);
    guessDD.appendChild(el);
  });
  if (!items.length) {
    const empty = document.createElement("div");
    empty.className="dd-item"; empty.textContent="No songs found.";
    guessDD.appendChild(empty);
  }
  showDD();
}

function highlight(index){
  [...guessDD.children].forEach((c, i) => c.setAttribute("aria-selected", i===index ? "true" : "false"));
  if (index>=0 && guessDD.children[index]) guessDD.children[index].scrollIntoView({block:"nearest"});
}

function selectItem(index){
  const it = ddItems[index]; if (!it) return;
  // Fill the guess input with the song title (so they can submit)
  $("guess").value = it.title;
  hideDD();
  $("guess").focus();
}

function dedupeByTitle(results){
  const seen = new Set(); const out = [];
  for (const r of results){
    const key = (r.trackName || "").toLowerCase();
    if (!key || seen.has(key) || !r.previewUrl) continue;  // require preview
    seen.add(key);
    out.push({
      title: r.trackName,
      artist: r.artistName,
      artwork: (r.artworkUrl100 || "").replace("100x100bb","60x60bb")
    });
  }
  return out;
}

async function searchArtistSongs(q){
  if (aborter) aborter.abort();
  aborter = new AbortController();
  const signal = aborter.signal;

  const country = $("country").value;
  // Use artistTerm so typing an artist yields their tracks
  const url = `https://itunes.apple.com/search?media=music&entity=song&attribute=artistTerm&country=${country}&limit=50&term=${encodeURIComponent(q)}`;

  const data = await fetch(url, { signal }).then(r=>r.json()).catch(()=>({results:[]}));
  const items = dedupeByTitle(data.results || []).slice(0, 30);
  ddItems = items; renderDD(items);
  ddIndex = items.length ? 0 : -1; highlight(ddIndex);
}

const DEBOUNCE_MS = 180;
let t = null;
$("guess").addEventListener("input", (e)=>{
  const q = e.target.value.trim();
  clearTimeout(t);
  if (q.length < 2){ hideDD(); return; }
  t = setTimeout(()=>searchArtistSongs(q), DEBOUNCE_MS);
});
$("guess").addEventListener("keydown", (e)=>{
  if (guessDD.classList.contains("hidden")) return;
  if (e.key === "ArrowDown"){ e.preventDefault(); ddIndex = Math.min(ddIndex+1, ddItems.length-1); highlight(ddIndex); }
  else if (e.key === "ArrowUp"){ e.preventDefault(); ddIndex = Math.max(ddIndex-1, 0); highlight(ddIndex); }
  else if (e.key === "Enter"){ if (ddIndex>=0){ e.preventDefault(); selectItem(ddIndex); } }
  else if (e.key === "Escape"){ hideDD(); }
});

// click outside to close
document.addEventListener("click", (e)=>{
  const wrap = document.querySelector(".guess-wrap");
  if (!wrap.contains(e.target)) hideDD();
});