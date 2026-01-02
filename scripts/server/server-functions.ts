import type { ITunesTrack, ITunesSearchResponse, ITunesRSSEntry, ITunesRSSResponse } from "../api-types";

import type { currentSong } from "../game-scripting/game-logic-types";

import { normalize, extractYear } from "../additional-functions";

import type { DailySong } from './server-types.ts';

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
async function pickSongWithPreview(tries = 6): Promise<currentSong> {
  
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
        artist: normalize(item.artistName),
        title: normalize(item.trackName),
        genre: normalize(item.primaryGenreName),
        releaseYear: extractYear(item.releaseDate),
        albumName: normalize(item.collectionName),
        fullTrack: item
      };
    }
  }
  throw new Error("Could not find a preview for any of the picked tracks. Try again.");
}

// Helper function to search iTunes for a track
export async function searchItunesTrack(guessText: string): Promise<ITunesTrack | null> {
  const searchUrl = new URL("https://itunes.apple.com/search");
  searchUrl.searchParams.set("media", "music");
  searchUrl.searchParams.set("entity", "song");
  searchUrl.searchParams.set("term", guessText);
  searchUrl.searchParams.set("limit", "5");

  const response = await fetch(searchUrl.toString());
  const data: ITunesSearchResponse = await response.json();

  if (data.results.length === 0) {
    return null;
  }

  // Find best match - prefer exact title match
  const normalizedGuess = normalize(guessText);
  let guessedTrack = data.results.find(t => normalize(t.trackName) === normalizedGuess);
  if (!guessedTrack) guessedTrack = data.results[0];

  return guessedTrack;
}

// Helper function to compare guessed track to daily song
export function compareGuessToDaily(guessedTrack: ITunesTrack, correctSong: currentSong) {
  return {
    artist: normalize(guessedTrack.artistName) === correctSong.artist,
    genre: normalize(guessedTrack.primaryGenreName) === correctSong.genre,
    year: extractYear(guessedTrack.releaseDate) === correctSong.releaseYear,
    album: normalize(guessedTrack.collectionName) === correctSong.albumName,
    isCorrect: normalize(guessedTrack.trackName) === correctSong.title
  };
}

function generateDailySongId(): string {
  const now = new Date();
  return now.toISOString().split('T')[0]; // "2024-12-31"
}

export async function updateDailySong(): Promise<DailySong | null> {
  try {
    const song = await pickSongWithPreview();
    const dailySong = {
      id: generateDailySongId(),
      song: song,
      generatedAt: new Date()
    };
    console.log(`Daily song updated at ${new Date().toISOString()}`);
    return dailySong;
  } catch (err) {
    console.error("Error fetching daily song:", err);
    return null;
  }
}

export function scheduleNextUpdate(updateCallback: (song: DailySong | null) => void) {
  const now = new Date();
  const target = new Date(now);

  // Set target to 11:59:59.999 PM
  target.setHours(23, 59, 59, 999);

  // If we are already past 11:59:59.999 PM today, schedule for tomorrow
  if (now.getTime() >= target.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  const msUntilTarget = target.getTime() - now.getTime();
  console.log(`Next update scheduled in ${msUntilTarget}ms (at ${target.toISOString()})`);

  setTimeout(() => {
    // Update the song at 11:59:59.999 PM
    updateDailySong().then(updateCallback);

    // Then update every 24 hours thereafter
    setInterval(() => updateDailySong().then(updateCallback), 24 * 60 * 60 * 1000);
  }, msUntilTarget);
}