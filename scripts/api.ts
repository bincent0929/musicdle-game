//import type { ITunesTrack, ITunesSearchResponse, ITunesRSSEntry, ITunesRSSResponse } from "./api-types.js";

import type { currentSong } from "./game-logic-types.js";

//import { extractYear } from "./additional-functions.js";

export async function daily_url_fetch(): Promise<string> {
  try {
    // we need to add something here to have it call the local backend instead
    // of the cloud backend
    const response = await fetch('http://localhost:3000/api/daily-song-url');
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    const song: currentSong = await response.json();
    return song.preview;
  } catch (error) {
    console.error("Failed to fetch daily song:", error);
    throw error;
  }
}