//import type { ITunesTrack, ITunesSearchResponse, ITunesRSSEntry, ITunesRSSResponse } from "./api-types.js";

import type { currentSong } from "./game-logic-types.js";

//import { extractYear } from "./additional-functions.js";

export async function daily_fetch(): Promise<currentSong> {
  try {
    const response = await fetch('https://backend.musicdle.xyz/api/daily-song');
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    const song: currentSong = await response.json();
    return song;
  } catch (error) {
    console.error("Failed to fetch daily song:", error);
    throw error;
  }
}