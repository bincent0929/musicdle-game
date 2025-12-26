// API.TS NEEDS TO BE MOVED HERE
// THIS DIDN'T PROPERLY IMPORT THE TYPES

import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const port = 3000;

app.use(cors());

// --- Types ---

interface ITunesTrack {
  wrapperType: string;
  kind: string;
  trackId: number;
  artistId: number;
  collectionId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  previewUrl?: string;
  releaseDate: string;
  primaryGenreName: string;
  // Add other fields as needed
}

interface ITunesSearchResponse {
  resultCount: number;
  results: ITunesTrack[];
}

interface ITunesRSSEntry {
  "im:name": { label: string };
  "im:image": { label: string; attributes: { height: string } }[];
  "im:collection": {
    "im:name": { label: string };
    link: { attributes: { href: string } };
    "im:contentType": { attributes: { term: string; label: string } };
  };
  "im:price": { label: string; attributes: { amount: string; currency: string } };
  "im:contentType": { attributes: { term: string; label: string } };
  rights: { label: string };
  title: { label: string };
  link: { attributes: { rel: string; type: string; href: string } }[];
  id: { label: string; attributes: { "im:id": string } };
  "im:artist": { label: string; attributes: { href: string } };
  category: { attributes: { "im:id": string; term: string; scheme: string; label: string } };
  "im:releaseDate": { label: string; attributes: { label: string } };
}

interface ITunesRSSResponse {
  feed: {
    entry: ITunesRSSEntry[];
  };
}

interface CurrentSong {
  preview: string;
  artist: string;
  title: string;
  genre: string;
  releaseYear: string;
  albumName: string;
  fullTrack: ITunesTrack;
}

// --- Logic ---

/**
 * Extract year from release date string
 */
function extractYear(releaseDate?: string): string {
  if (!releaseDate) return "Unknown";
  return new Date(releaseDate).getFullYear().toString();
}

async function song_fetch(): Promise<ITunesRSSEntry[]> {
  // the max amount of songs you can get is 200 from iTunes
  const response = await fetch('https://itunes.apple.com/us/rss/topsongs/limit=200/genre=1/json');
  const feed = (await response.json()) as ITunesRSSResponse;
  
  const entries = feed?.feed?.entry || [];
  if (!entries.length) throw new Error("No songs found for that genre/country.");
  
  return entries;
}

app.get('/api/pick-song', async (req: Request, res: Response) => {
  const tries = parseInt(req.query.tries as string) || 6;

  try {
    const entries = await song_fetch();

    // We need to try multiple times in case the song doesn't have a preview
    for (let i = 0; i < tries; i++) {
      const chosen = entries[Math.floor(Math.random() * entries.length)];
      const trackId = chosen?.id?.attributes?.["im:id"];
      if (!trackId) continue;

      const lookedResponse = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(trackId)}&entity=song`);
      const looked = (await lookedResponse.json()) as ITunesSearchResponse;
      
      const item = looked?.results?.find((x) => x.kind === "song") || looked?.results?.[0];
      
      const preview = item?.previewUrl;
      if (preview && item) {
        const song: CurrentSong = {
          preview,
          artist: item.artistName,
          title: item.trackName,
          genre: item.primaryGenreName,
          releaseYear: extractYear(item.releaseDate),
          albumName: item.collectionName,
          fullTrack: item
        };
        res.json(song);
        return;
      }
    }
    res.status(500).json({ error: "Could not find a preview for any of the picked tracks. Try again." });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
