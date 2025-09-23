// this is for restoring the page back to a new game state
//const gameDiv = document.getElementById('game').innerHTML;

/**
 * the document.addEventListener('DOMContentLoaded', function() {});
 * is for making sure that the page is loaded and that the elements
 * are present/findable before the functions in here try to work on them.
 * make sure that all of your scripting is inside this to avoid
 * your functions from not being able to find the elements
 */
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('start_button').addEventListener('click', function() {
        startGame();
    });
    
    function startGame() {
        const game = document.getElementById('game');
        game.innerHTML = `
            <h1>test</h1>
        `;
    }
});