import ElementManager from "./element-manager.js";

/**
 * Game-specific element accessor. Provides semantic access to game elements.
 * All elements are cached - zero DOM queries after initialization.
 */
export class GameElements {
  private manager: ElementManager;

  constructor(manager?: ElementManager) {
    // Allow injection for testing, default to singleton
    this.manager = manager || ElementManager.getInstance();
  }

  // ===== Input Elements =====
  get guessInput(): HTMLInputElement {
    return this.manager.get<HTMLInputElement>("guess");
  }

  // ===== Audio Elements =====
  get audioPlayer(): HTMLAudioElement {
    return this.manager.get<HTMLAudioElement>("player");
  }

  /**
   * Update audio player reference after cloning (for setupAudioRestrictions)
   */
  updateAudioPlayer(newPlayer: HTMLAudioElement): void {
    this.manager.replace("player", newPlayer);
  }

  // ===== Custom Player UI Elements =====
  get playBtn(): HTMLElement {
    return this.manager.get("play-btn");
  }

  get playIcon(): HTMLElement {
    return this.manager.get("play-icon");
  }

  get pauseIcon(): HTMLElement {
    return this.manager.get("pause-icon");
  }

  get progressContainer(): HTMLElement {
    return this.manager.get("progress-container");
  }

  get progressBar(): HTMLElement {
    return this.manager.get("progress-bar");
  }

  get unlockedBar(): HTMLElement {
    return this.manager.get("unlocked-bar");
  }

  /**
   * Update play button reference after cloning (for setupAudioRestrictions)
   */
  updatePlayBtn(newBtn: HTMLElement): void {
    this.manager.replace("play-btn", newBtn);
  }

  /**
   * Update progress container reference after cloning (for setupAudioRestrictions)
   */
  updateProgressContainer(newContainer: HTMLElement): void {
    this.manager.replace("progress-container", newContainer);
  }

  /**
   * Update unlocked bar reference after cloning (for setupAudioRestrictions)
   */
  updateUnlockedBar(newBar: HTMLElement): void {
    this.manager.replace("unlocked-bar", newBar);
  }

  // ===== Button Elements =====
  get revealBtn(): HTMLButtonElement {
    return this.manager.get<HTMLButtonElement>("reveal");
  }

  // ===== Status Elements =====
  get statusElement(): HTMLElement {
    return this.manager.get("status");
  }

  get metaElement(): HTMLElement {
    return this.manager.get("meta");
  }

  get attemptsElement(): HTMLElement {
    return this.manager.get("attempts");
  }

  // ===== Dropdown Elements =====
  get guessDropdown(): HTMLDivElement {
    return this.manager.get<HTMLDivElement>("guessDD");
  }

  // ===== Popup Elements =====
  get gameInfoPopup(): HTMLElement {
    return this.manager.get("game-info-popup");
  }

  get gameInfoCloseBtn(): HTMLElement {
    return this.manager.get("game-info-close");
  }

  get completionPopup(): HTMLElement {
    return this.manager.get("completion-Popup");
  }

  get popupScore(): HTMLElement | null {
    return this.manager.has("Popup-score")
      ? this.manager.get("Popup-score")
      : null;
  }

  get popupGuesses(): HTMLElement | null {
    return this.manager.has("Popup-guesses")
      ? this.manager.get("Popup-guesses")
      : null;
  }

  get popupSongTitle(): HTMLElement | null {
    return this.manager.has("Popup-song-title")
      ? this.manager.get("Popup-song-title")
      : null;
  }

  get popupArtistName(): HTMLElement | null {
    return this.manager.has("Popup-artist-name")
      ? this.manager.get("Popup-artist-name")
      : null;
  }

  get popupAlbumArt(): HTMLImageElement | null {
    return this.manager.has("Popup-album-art")
      ? this.manager.get<HTMLImageElement>("Popup-album-art")
      : null;
  }

  get popupYesBtn(): HTMLButtonElement | null {
    return this.manager.has("Popup-yes")
      ? this.manager.get<HTMLButtonElement>("Popup-yes")
      : null;
  }

  get popupNoBtn(): HTMLButtonElement | null {
    return this.manager.has("Popup-no")
      ? this.manager.get<HTMLButtonElement>("Popup-no")
      : null;
  }

  get popupPlayAgainBtn(): HTMLButtonElement | null {
    return this.manager.has("Popup-play-again")
      ? this.manager.get<HTMLButtonElement>("Popup-play-again")
      : null;
  }

  get popupNote(): HTMLElement | null {
    return this.manager.has("Popup-note")
      ? this.manager.get("Popup-note")
      : null;
  }
}

/**
 * Hint-specific element accessor
 */
export class HintElements {
  private manager: ElementManager;

  constructor(manager?: ElementManager) {
    this.manager = manager || ElementManager.getInstance();
  }

  get container(): HTMLElement {
    return this.manager.get("hint-container");
  }

  get artistBox(): HTMLElement {
    return this.manager.get("hint-artist");
  }

  get genreBox(): HTMLElement {
    return this.manager.get("hint-genre");
  }

  get yearBox(): HTMLElement {
    return this.manager.get("hint-year");
  }

  get albumBox(): HTMLElement {
    return this.manager.get("hint-album");
  }
}
