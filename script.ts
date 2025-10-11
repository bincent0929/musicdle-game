// Vincent game-start logic
// this is for restoring the page back to a new game state
//const gameDiv = document.getElementById('game').innerHTML;

/*
const gameStartHTML = `
            <h1>test</h1>
            
            <div class="reset_button_div">
                <button id="reset_button">
                    Do you want to reset the game?
                </button>
            </div>
        `;

const gameResetHTML = `
            <div class="start_button_div">
                <button id="start_button">
                    Do you want to start the game?
                </button>
            </div>
        `;
*/

// Nathan Game Logic
/*
function setGuessButtons(options) {
  const btns = [
    document.getElementById("guessBtn1"),
    document.getElementById("guessBtn2"),
    document.getElementById("guessBtn3"),
  ];

  // enable + set labels and data attributes
  btns.forEach((btn, idx) => {
    btn.disabled = false;
    btn.textContent = options[idx];
    btn.setAttribute("data-guess", options[idx]);
  });

  // clear result
  document.getElementById("result").textContent = "";
}

function guessFromButton(btn) {
  const guess = btn.getAttribute("data-guess");
  const resultEl = document.getElementById("result");

  if (guess === correctAnswer) {
    resultEl.textContent = "✅ Correct!";
    resultEl.style.color = "green";
  } else {
    resultEl.textContent = "❌ Wrong — try again.";
    resultEl.style.color = "red";
  }
}
*/
// NATHAN GAME LOGIC!!!!!!!!!!!!!!


// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

// VINCENT GAME LOGIC!!!!!!!!!!!!!!

/**
 * the document.addEventListener('DOMContentLoaded', function() {});
 * is for making sure that the page is loaded and that the elements
 * are present/findable before the functions in here try to work on them.
 * make sure that all of your scripting is inside this to avoid
 * your functions from not being able to find the elements
 */
document.addEventListener('DOMContentLoaded', function(): void {
    /**
     * this allows us to have functions work on newly added HTML
     */
    document.body.addEventListener('click', function(event: MouseEvent): void {
        const clickedElement = event.target as HTMLElement;

        if (clickedElement.id == 'start_button') {
            event.preventDefault()
            startGame();
        } else if (clickedElement.id == 'reset_button') {
            event.preventDefault()
            resetGame();
        }
    });
    
    function startGame(): void {
      fetch('game.html')
        .then((response: Response) => response.text())
        .then((gameStartHTML: string) => {
          const gameElement = document.getElementById('game') as HTMLElement;
          gameElement.innerHTML = gameStartHTML;
        })
        .catch((error: Error) => console.error('Error loading HTML:', error));
    }

    function resetGame():void {
      fetch('game-reset.html')
        .then((response: Response) => response.text())
        .then((gameResetHtml: string) => {
          const gameElement = document.getElementById('game') as HTMLElement;
          gameElement.innerHTML = gameResetHtml;
        })
        .catch((error: Error) => console.error('Error loading HTML:', error));
    }
});

// API Response Type Definitions
interface TrackData {
  [songName: string]: string;
}

interface ApiResponse {
  success: boolean;
  data?: TrackData;
  album_path?: string;
  error?: string;
}

interface Track {
  name: string;
  path: string;
}

interface AlbumInfo {
  albumPath: string;
  tracks: Track[];
  trackMap: Map<string, string>;
}

// Handles the music data
class MusicDataManager {
  private apiUrl: string;
  private albumInfo: AlbumInfo | null = null;
  private lastFetchTime: Date | null = null;

  constructor(apiUrl: string = 'http://localhost:5000/api/tracks') {
    this.apiUrl = apiUrl;
  }

  // fetches the track info from the backend
  async fetchTracks(): Promise<AlbumInfo> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Unknown error occurred');
      }

      if (!data.data || !data.album_path) {
        throw new Error('Invalid response structure');
        // shouldn't have to worry about this.
      }

      this.albumInfo = this.processTrackData(data.data, data.album_path);
      this.lastFetchTime = new Date();

      return this.albumInfo;
    } catch (error) {
      console.error('Error fetching tracks:', error);
      throw error;
    }
  }

  /**
   * Processes raw track data into a structured format
   */
  private processTrackData(trackData: TrackData, albumPath: string): AlbumInfo {
    const tracks: Track[] = [];
    const trackMap = new Map<string, string>();

    for (const [name, path] of Object.entries(trackData)) {
      tracks.push({ name, path });
      trackMap.set(name, path);
    }

    // Sort tracks alphabetically by name
    tracks.sort((a, b) => a.name.localeCompare(b.name));

    return {
      albumPath,
      tracks,
      trackMap,
    };
  }
}



function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function pickTrackToBeGuessed(tracks: Map<string, string>): number {
    const correctTrackToBeGuessedIndex: number = 
    randomInt(0, tracks.size - 1); // picks between 0 and the length of the map

    return correctTrackToBeGuessedIndex;
}

function loadCorrectTrackPreview(correctIndex: number, tracks: Array<{name: string, previewUrl: string}>): void {
  const audio = document.getElementById("audio") as HTMLAudioElement;
  
  audio.pause();
  audio.src = tracks[correctIndex].previewUrl;
  audio.load();
  audio.play().catch(() => {});
}

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!