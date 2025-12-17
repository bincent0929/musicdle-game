import type { ITunesTrack, ITunesSearchResponse, ITunesRSSEntry, ITunesRSSResponse } from "./api-types";

import type { currentSong } from "./game-logic-types";

import { $ } from "./additional-functions";

/**
 * Type for explicit content ratings
 */
type ExplicitnessRating = "explicit" | "cleaned" | "notExplicit";

/**
 * Extract year from release date string
 */
export function extractYear(releaseDate?: string): string {
  if (!releaseDate) return "Unknown";
  return new Date(releaseDate).getFullYear().toString();
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