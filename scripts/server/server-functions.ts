import type { ITunesTrack, ITunesSearchResponse, ITunesRSSEntry, ITunesRSSResponse } from "../api-types";

import type { currentSong } from "../game-logic-types";

import { extractYear } from "../additional-functions";

async function song_fetch(): Promise<ITunesRSSEntry[]> {
  // the max amount of songs you can get is 200 from iTunes
  const feed: ITunesRSSResponse = await fetch('https://itunes.apple.com/us/rss/topsongs/limit=200/genre=1/json')
    .then(r => r.json()).catch(e => ({ feed: { entry: [] } }));
  
  const entries = feed?.feed?.entry || [];
  if (!entries.length) throw new Error("No songs found for that genre/country.");
  
  return entries;
}

/* ------------ main game: pick & play a popular track ------------ */
/**
 * 1. pulls from the itunes API for the top songs.
 * 2. randomly picks one songs from the fetched songs.
 * 3. pulls the artist name, preview, and title from the lookup API.
 * @param tries 
 * @returns Promise<{preview: string, artist: string, title: string}>
 */
export async function pickSongWithPreview(tries = 6): Promise<currentSong> {
  
  const entries: ITunesRSSEntry[] = await song_fetch();

  // We need to try multiple times in case the song doesn't have a preview
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