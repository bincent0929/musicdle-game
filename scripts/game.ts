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
    return true;
  } else {
    // Handle the error case
    alert('Failed to load album data');
  }
}

function loadAudioPlayer(): void {
  const correctChoice = AlbumManager.getCorrectChoice();
  
  if (!correctChoice) {
    console.error("jump ship");
    return;
  } else {
    console.log(correctChoice);
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
    const btn1 = document.getElementById(`guessBtn${i}`) as HTMLButtonElement | null;
    if (!btn1) {
      console.error("button is null dumbass");
      continue
    }
    btn1.textContent = songNames[i - 1];
    btn1.disabled = false;
    if (songNames[i-1] === correctChoice.name){
      btn1.setAttribute("data-correct", "true");
    }else {
      btn1.setAttribute("data-correct", "false");
    }
    btn1.classList.remove("btn-success", "btn-danger", "hidden");
    btn1.classList.add("btn-outline-primary");
  }
}

function guessFromButton(button: HTMLButtonElement): void {
  const tstf = button.getAttribute("data-correct") === "true";
  if (tstf === true){
    const gameCompleteAnchor = document.getElementById(`game-completed-link`) as HTMLAnchorElement | null;
    if (!gameCompleteAnchor) {
      console.error("game completed anchor not found");
      return;
    }
    button.textContent = "Correct";
    button.classList.remove("btn-outline-primary");
    button.style.backgroundColor = "green";
    button.style.color = "white";
    gameCompleteAnchor.classList.remove("hidden");
  }else {
    button.textContent = "Wrong";
    button.classList.remove("btn-outline-primary");
    button.style.backgroundColor = "red";
    button.style.color = "white";
    button.disabled = true;
  }
}

async function startApp() {
  const success = await initializeAlbum();

  if(success) {
    loadAudioPlayer();
    loadButton();
    // add any functions here that need the backend data
  } else {
    console.error("Failed to load the album's data")
  }
}

window.addEventListener('DOMContentLoaded', startApp);