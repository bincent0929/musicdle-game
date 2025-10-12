//!!!!!!!!!!!!!!!!!! API Response Type Definitions

// This creates a global namespace when compiled to JS
namespace AlbumManager {
  // Type definitions
  export interface AlbumData {
    album_path: string;
    correct_choice_and_path: [string, string];
    song_names: string[];
    success: boolean;
  }

  export interface CorrectChoice {
    name: string;
    path: string;
  }

  // Store the data
  let currentData: AlbumData | null = null;

  // Public methods
  export function setAlbumData(data: AlbumData): void {
    currentData = data;
  }

  export function getAlbumData(): AlbumData | null {
    return currentData;
  }

  export function getCorrectChoice(): CorrectChoice | null {
    if (!currentData) return null;
    return {
      name: currentData.correct_choice_and_path[0],
      path: currentData.correct_choice_and_path[1]
    };
  }

  export function getSongNames(): string[] {
    return currentData?.song_names || [];
  }

  export async function fetchAndSetAlbumData(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:5000/api/tracks');

      const data: AlbumData = await response.json();

      if (data.success && data.album_path && data.song_names && data.correct_choice_and_path) {
        setAlbumData(data);
        console.log('Album data loaded successfully');
        return true;
      } else {
        throw new Error('Invalid data structure received from API');
      }
    } catch(error) {
        console.error('Error fetching album data:', error);
        return false;
    }
  }
}

async function initializeAlbum() {
  const success = await AlbumManager.fetchAndSetAlbumData();
  // or: const success = await fetchAlbumData();
  
  if (success) {
    console.log("data received from backend!")
  } else {
    // Handle the error case
    alert('Failed to load album data');
  }
}

// Call on page load
window.addEventListener('DOMContentLoaded', initializeAlbum);

function loadAudioPlayer(): void {
  const correctChoice = AlbumManager.getCorrectChoice();
  
  if (!correctChoice) {
    console.error("jump ship");
    return;
  }

  const audioEl = document.getElementById("audio") as HTMLAudioElement | null;
  
  if (!audioEl) {   // this was why audio element was working do to type safe locality
    console.error("Audio element with id='audio' not found in DOM");
    return;
  }
  
  audioEl.src = correctChoice.path;
  audioEl.load()
  console.log("music player loaded");
}

function loadButton(): void {
  const songNames = AlbumManager.getSongNames();
  const correctChoice = AlbumManager.getCorrectChoice();
  if (!correctChoice) {
    console.error("jump ship");
    return;
  }
  for(let i = 1; i <= 9 ; i++){
    const b = document.getElementById('gussBtn{i}') as HTMLButtonElement | null;
    if (!b) {
      console.error("b is null dumbass");
      return
    }
    b.textContent = songNames[i];
    
  }
}
