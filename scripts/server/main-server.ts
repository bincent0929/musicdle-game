import {
  scheduleNextUpdate,
  updateDailySong,
  searchItunesTrack,
  compareGuess,
} from "./server-functions";

import type { compared, DailySong } from "./server-types";

import express, { Request, Response } from "express";
import cors from "cors";
import { ITunesTrack } from "../api-types";

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

let currentDaily: DailySong | null = null;

// ==Initial fetch and then schedule==
// avoids issue where the scheduled next update call is finished
// before the daily song is updated on server start
updateDailySong().then((song) => {
  currentDaily = song;
  scheduleNextUpdate((song) => {
    currentDaily = song;
  });
});

app.get("/api/daily-song-url", (req: Request, res: Response) => {
  if (currentDaily) {
    res.json({
      previewUrl: currentDaily.song.preview,
      songId: currentDaily.id,
    });
  } else {
    res
      .status(503)
      .json({ error: "Daily song not available yet. Please try again later." });
  }
});

app.post("/api/validate-guess", async (req: Request, res: Response) => {
  try {
    const {
      guessText,
      songId,
      gameOver,
    }: {
      guessText: string | null;
      songId: string | null;
      gameOver: boolean | null;
    } = req.body;

    if (!currentDaily) {
      return res.status(503).json({
        success: false,
        error: "SERVICE_UNAVAILABLE",
        message: "Daily song not available yet. Please try again later.",
      });
    }

    if (gameOver === null || typeof gameOver !== "boolean") {
      return res.status(400).json({
        success: false,
        error: "INVALID_GAME_OVER_FLAG",
        message: "Invalid game over flag.",
      });
    }

    let dailyFullTrack: ITunesTrack | null = null;
    let comparison: compared;
    if (!gameOver) {
      if (!guessText || typeof guessText !== "string" || !guessText.trim()) {
        return res.status(400).json({
          success: false,
          error: "EMPTY_GUESS",
          message: "Please enter a guess.",
        });
      }

      // Validate song ID (prevent replay attacks)
      if (songId !== currentDaily.id) {
        return res.status(400).json({
          success: false,
          error: "INVALID_SONG_ID",
          message: "Song ID mismatch. Please refresh the page.",
        });
      }

      // Search iTunes for the guess
      const guessedTrack = await searchItunesTrack(guessText.trim());

      if (!guessedTrack) {
        return res.status(404).json({
          success: false,
          error: "NO_RESULTS",
          message: "Song not found. Try selecting from the dropdown.",
        });
      }

      // Compare guess to correct song
      comparison = compareGuess(guessedTrack, currentDaily.song);
      if (comparison.isCorrect) {
        dailyFullTrack = currentDaily.song.fullTrack;
      }
    } else {
      comparison = {
        artist: currentDaily.song.artist,
        genre: currentDaily.song.genre,
        year: currentDaily.song.releaseYear,
        album: currentDaily.song.albumName,
        isCorrect: true,
      };
      dailyFullTrack = currentDaily.song.fullTrack;
    }

    // I think I might want this to return an object
    // that uses the already establish currentSong type
    return res.json({
      success: true,
      isCorrect: comparison.isCorrect,
      trackData: dailyFullTrack,
      matches: {
        artist: comparison.artist,
        genre: comparison.genre,
        year: comparison.year,
        album: comparison.album,
      },
      message: comparison.isCorrect ? "Correct!" : undefined,
    });
  } catch (error) {
    console.error("Error validating guess:", error);
    return res.status(502).json({
      success: false,
      error: "ITUNES_ERROR",
      message: "Error searching iTunes. Please try again.",
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
