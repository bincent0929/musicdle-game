import ElementManager from "./element-manager.js";

/**
 * Initialize all DOM elements at application startup.
 * This is called ONCE and performs ALL DOM queries.
 *
 * Performance: ~15 DOM queries total, all executed once
 */
export function initializeElements(): void {
  const manager = ElementManager.getInstance();

  manager.initialize({
    // Input elements
    guess: { required: true, type: "input" },

    // Audio elements
    player: { required: true, type: "audio" },

    // Button elements
    submit: { required: true, type: "button" },
    reveal: { required: true, type: "button" },

    // Status elements
    status: { required: true },
    meta: { required: true },
    attempts: { required: true },
    unlocked: { required: true },

    // Dropdown elements
    guessDD: { required: true, type: "div" },

    // Popup elements
    "game-info-popup": { required: true },
    "game-info-close": { required: true },
    "completion-Popup": { required: true },

    // Popup detail elements (created dynamically, so optional)
    "Popup-score": { required: false },
    "Popup-guesses": { required: false },
    "Popup-song-title": { required: false },
    "Popup-artist-name": { required: false },
    "Popup-album-art": { required: false },
    "Popup-yes": { required: false },
    "Popup-no": { required: false },
    "Popup-play-again": { required: false },
    "Popup-note": { required: false },

    // Hint elements (created dynamically after initialization)
    "hint-container": { required: false },
    "hint-artist": { required: false },
    "hint-genre": { required: false },
    "hint-year": { required: false },
    "hint-album": { required: false },
  });
}
