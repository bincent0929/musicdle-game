import { currentSong } from "../game-logic-types";

// Daily song structure with ID for validation
export interface DailySong {
  id: string;           // Date-based ID: "YYYY-MM-DD"
  song: currentSong;    // The song data
  generatedAt: Date;    // Timestamp
}