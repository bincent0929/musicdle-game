import { pickSongWithPreview } from './server-functions.js';
import { currentSong } from '../scripts/game-logic-types.js';

import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

let currentDaily: currentSong | null = null;

async function updateDailySong() {
  try {
    const song = await pickSongWithPreview();
    currentDaily = song;
    console.log(`Daily song updated at ${new Date().toISOString()}`);
  } catch (err) {
    console.error("Error fetching daily song:", err);
  }
}

// Initial fetch on server start
updateDailySong();

function scheduleNextUpdate() {
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
    updateDailySong();
    
    // Then update every 24 hours thereafter
    setInterval(updateDailySong, 24 * 60 * 60 * 1000);
  }, msUntilTarget);
}

scheduleNextUpdate();

app.get('/api/daily-song', (req: Request, res: Response) => {
  if (currentDaily) {
    res.json(currentDaily);
  } else {
    res.status(503).json({ error: "Daily song not available yet. Please try again later." });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});