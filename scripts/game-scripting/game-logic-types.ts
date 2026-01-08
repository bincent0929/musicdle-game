import { ITunesTrack } from "../api-types";

export interface currentSong {
  preview: string;
  artist: string;
  title: string;
  genre: string;
  releaseYear: string;
  albumName: string;
  fullTrack: ITunesTrack | null;
}

/**dropdownItem definition */
export interface DropdownItem {
  title: string;
  artist: string;
  artwork: string;
}

export interface GameState {
  attemptsRemaining: number;
  wrongGuesses: number;
  maxListenTime: number;
  hasWon: boolean;
}
