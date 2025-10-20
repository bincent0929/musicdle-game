async function pickSongWithPreview(tries=6){
  const country = "US";
  //const genre = $("genre").value;
  //$("status").textContent = "Loading top songs…";
  $("meta").textContent = "";
  $("guess").value = "";
  const player = $("player");
  player.src = "";

  // 1) Get top songs feed
  const feed = await fetch(rssTopSongs(country, genre, 100)).then(r => r.json()).catch(e => ({feed:{entry:[]}}));
  const entries = feed?.feed?.entry || [];
  if (!entries.length) throw new Error("No songs found for that genre/country.");

  // 2) Try up to N random entries until one has previewUrl
  for (let i=0; i<tries; i++){
    const chosen = entries[Math.floor(Math.random()*entries.length)];
    const trackId = chosen?.id?.attributes?.["im:id"];
    const fallbackArtist = chosen?.["im:artist"]?.label || "";
    const fallbackTitle  = chosen?.["im:name"]?.label || "";
    if (!trackId) continue;

    // 3) Lookup details to get preview
    const looked = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(trackId)}&entity=song`)
      .then(r => r.json()).catch(()=>null);
    const item = looked?.results?.find(x => x.kind === "song") || looked?.results?.[0];
    const preview = item?.previewUrl;
    if (preview){
      return {
        preview,
        artist: item?.artistName || fallbackArtist,
        title:  item?.trackName || fallbackTitle
      };
    }
  }
  throw new Error("Could not find a preview for any of the picked tracks. Try again.");
}