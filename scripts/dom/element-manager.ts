/**
 * Configuration for element grabbing behavior
 */
interface ElementConfig {
  required?: boolean; // Throw if not found (default: true)
  type?: "input" | "audio" | "div" | "button" | "generic";
}

/**
 * Singleton manager for all DOM elements in the game.
 * Grabs each element ONCE at initialization and caches references.
 *
 * Performance benefits:
 * - Zero repeated DOM queries after initialization
 * - All elements cached in memory
 * - Type-safe access through domain-specific accessors
 */
class ElementManager {
  private static instance: ElementManager | null = null;
  private elements: Map<string, HTMLElement> = new Map();
  private initialized: boolean = false;

  // Private constructor ensures singleton
  private constructor() {}

  /**
   * Get the singleton instance
   */
  static getInstance(): ElementManager {
    if (!ElementManager.instance) {
      ElementManager.instance = new ElementManager();
    }
    return ElementManager.instance;
  }

  /**
   * Initialize all elements at once. Call this ONCE at app startup.
   * This is where ALL DOM queries happen.
   */
  initialize(elementIds: Record<string, ElementConfig>): void {
    if (this.initialized) {
      console.warn("ElementManager already initialized");
      return;
    }

    for (const [id, config] of Object.entries(elementIds)) {
      const element = document.getElementById(id);
      const isRequired = config.required ?? true;

      if (!element && isRequired) {
        throw new Error(`Required element not found: ${id}`);
      }

      if (element) {
        this.elements.set(id, element);
      }
    }

    this.initialized = true;
  }

  /**
   * Get a cached element by ID. Never queries DOM after initialization.
   */
  get<T extends HTMLElement = HTMLElement>(id: string): T {
    if (!this.initialized) {
      throw new Error(
        "ElementManager not initialized. Call initialize() first."
      );
    }

    const element = this.elements.get(id);
    if (!element) {
      throw new Error(`Element not found in cache: ${id}`);
    }

    return element as T;
  }

  /**
   * Check if an element exists in cache
   */
  has(id: string): boolean {
    return this.elements.has(id);
  }

  /**
   * Replace an element reference (for handling cloned elements like audio player)
   */
  replace(id: string, newElement: HTMLElement): void {
    if (!this.initialized) {
      throw new Error("ElementManager not initialized");
    }
    this.elements.set(id, newElement);
  }

  /**
   * Reset the manager (useful for testing)
   */
  reset(): void {
    this.elements.clear();
    this.initialized = false;
    ElementManager.instance = null;
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

export default ElementManager;
