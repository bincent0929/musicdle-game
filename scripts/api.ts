async function pickSongWithPreview(tries = 6) {
  const country = "US";
  //const genre = $("genre").value;
  //$("status").textContent = "Loading top songs…";
  $("meta").textContent = "";
  $("guess").value = "";
  $("player").src = "";

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
      .then(r => r.json()).catch(() => null);
    const item = looked?.results?.find(x => x.kind === "song") || looked?.results?.[0];
    const preview = item?.previewUrl;
    if (preview) {
      return {
        preview,
        artist: item?.artistName || fallbackArtist,
        title: item?.trackName || fallbackTitle
      };
    }
  }
  throw new Error("Could not find a preview for any of the picked tracks. Try again.");
}

async function pickSong() {
  try {
    const info = await pickSongWithPreview();
    current = { artist: info.artist, title: info.title };
    const player = $("player");
    player.src = info.preview; player.load();
    const p = player.play();
    if (p && p.catch) await p.catch(() => { $("status").textContent = "Tap ▶️ to start playback (autoplay blocked)."; });
    if (!player.paused) $("status").textContent = "Playing preview… guess the title!";
    $("meta").textContent = "";
  } catch (e) {
    $("status").textContent = e.message || "Error fetching song.";
    $("meta").textContent = "";
  }
}

function checkGuess() {
  if (!current) return;
  const g = normalize($("guess").value);
  const correct = normalize(current.title);
  if (!g) { $("status").textContent = "Type a guess first!"; return; }
  $("status").textContent = (g && (correct.includes(g) || g === correct)) ? "✅ Correct!" : "❌ Not quite. Try again or Reveal.";
}
// This is not working right now
function reveal() {
  if (!current) return;
  $("status").textContent = "🔎 Revealed.";
  $("meta").innerHTML = `Answer: <b>${current.title}</b> — ${current.artist}`;
}
$("new").onclick = pickSong;
$("submit").onclick = checkGuess;
$("guess").addEventListener("keydown", e => { if (e.key === "Enter") checkGuess(); });

/* ------------ integrated dropdown on the Guess input ------------ */
const guessDD = $("guessDD");
let ddIndex = -1, ddItems = [], aborter = null;

function hideDD() { guessDD.classList.add("hidden"); guessDD.innerHTML = ""; ddIndex = -1; ddItems = []; }
function showDD() { guessDD.classList.remove("hidden"); }

function renderDD(items) {
  guessDD.innerHTML = "";
  items.forEach((it, i) => {
    const el = document.createElement("div");
    el.className = "dd-item"; el.setAttribute("role", "option"); el.dataset.idx = i;
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
function highlight(index) {
  [...guessDD.children].forEach((c, i) => c.setAttribute("aria-selected", i === index ? "true" : "false"));
  if (index >= 0 && guessDD.children[index]) guessDD.children[index].scrollIntoView({ block: "nearest" });
}
function selectItem(index) {
  const it = ddItems[index]; if (!it) return;
  // Fill the guess input with the song title (so they can submit)
  $("guess").value = it.title;
  hideDD();
  $("guess").focus();
}

function dedupeByTitle(results) {
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

async function searchArtistSongs(q) {
  if (aborter) aborter.abort();
  aborter = new AbortController();
  const signal = aborter.signal;

  const country = $("country").value;
  // Use artistTerm so typing an artist yields their tracks
  const url = `https://itunes.apple.com/search?media=music&entity=song&attribute=artistTerm&country=${country}&limit=50&term=${encodeURIComponent(q)}`;

  const data = await fetch(url, { signal }).then(r => r.json()).catch(() => ({ results: [] }));
  const items = dedupeByTitle(data.results || []).slice(0, 30);
  ddItems = items; renderDD(items);
  ddIndex = items.length ? 0 : -1; highlight(ddIndex);
}

const DEBOUNCE_MS = 180;
let t = null;
$("guess").addEventListener("input", (e) => {
  const q = e.target.value.trim();
  clearTimeout(t);
  if (q.length < 2) { hideDD(); return; }
  t = setTimeout(() => searchArtistSongs(q), DEBOUNCE_MS);
});
$("guess").addEventListener("keydown", (e) => {
  if (guessDD.classList.contains("hidden")) return;
  if (e.key === "ArrowDown") { e.preventDefault(); ddIndex = Math.min(ddIndex + 1, ddItems.length - 1); highlight(ddIndex); }
  else if (e.key === "ArrowUp") { e.preventDefault(); ddIndex = Math.max(ddIndex - 1, 0); highlight(ddIndex); }
  else if (e.key === "Enter") { if (ddIndex >= 0) { e.preventDefault(); selectItem(ddIndex); } }
  else if (e.key === "Escape") { hideDD(); }
});

// click outside to close
document.addEventListener("click", (e) => {
  const wrap = document.querySelector(".guess-wrap");
  if (!wrap.contains(e.target)) hideDD();
});