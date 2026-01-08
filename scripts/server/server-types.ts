import { currentSong } from "../game-scripting/game-logic-types";

// Daily song structure with ID for validation
export interface DailySong {
  song: currentSong; // The song data
  generatedAt: Date; // Timestamp
}

export interface compared {
  artist: string | false;
  genre: string | false;
  year: string | false;
  album: string | false;
  isCorrect: boolean;
}
