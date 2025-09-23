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
        const game = document.getElementById('game');
        game.innerHTML = gameStartHTML;
    }

    document.getElementById('reset_button').addEventListener('click', function() {
        resetGame();
    });

    function resetGame() {
        const game = document.getElementById('game');
        game.innerHTML = gameResetHTML;
    }
});