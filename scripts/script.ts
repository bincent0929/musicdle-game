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

// prints out the names of the songs and which is correct

// prints out the audio element

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!