// Vincent game-start logic
// this is for restoring the page back to a new game state
//const gameDiv = document.getElementById('game').innerHTML;

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

/**
 * the document.addEventListener('DOMContentLoaded', function() {});
 * is for making sure that the page is loaded and that the elements
 * are present/findable before the functions in here try to work on them.
 * make sure that all of your scripting is inside this to avoid
 * your functions from not being able to find the elements
 */
document.addEventListener('DOMContentLoaded', function() {
    /**
     * this allows us to have functions work on newly added HTML
     */
    document.body.addEventListener('click', function(event) {
        const clickedElement = event.target;

        if (clickedElement.id == 'start_button') {
            startGame();
        } else if (clickedElement.id == 'reset_button') {
            resetGame();
        }
    });
    
    function startGame() {
        document.getElementById('game').innerHTML = gameStartHTML;
    }

    function resetGame() {
        document.getElementById('game').innerHTML = gameResetHTML;
    }
});

async function printSongs() {
    const albumDirectory = './assets/music/The-Latin-Side-Of-Vince-Guaraldi-By-Vince-Guaraldi';

    // reads the songs from the dir
    const songs = await FileSystem.readdir(albumDirectory);

    
}
function makeGuess() {
  let src = document.getElementById("song").value;
  alert("Printing: " + src);
}

// Nathan Game Logic

// CorrectAnswer + Distractors
const correctAnswer = "Lord of the Rings";
const distractors = ["Chronicles of Narnia", "Avatar"]; // two wrong choices

// simple shuffle logic
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

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

function loadSample() {
  const audio = document.getElementById("audio");

  // ensure sample is loaded/played
  audio.pause();
  audio.src = "sample.mp3";
  audio.load();
  audio.play().catch(() => {});

  // throw all guess into random order
  const options = shuffle([correctAnswer, ...distractors]);
  setGuessButtons(options);
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
