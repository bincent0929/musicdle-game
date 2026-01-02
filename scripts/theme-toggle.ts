(() => {
  type Theme = "light" | "dark";

  const storageKey = "musicdle-theme";
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)");

  const getStoredTheme = (): Theme | null => {
    const value = localStorage.getItem(storageKey);
    return value === "light" || value === "dark" ? value : null;
  };

  const applyTheme = (theme: Theme): void => {
    const isLight = theme === "light";
    document.body.classList.toggle("light-mode", isLight);
    document.body.classList.toggle("dark-mode", !isLight);

    const toggle = document.getElementById("theme-toggle") as HTMLButtonElement | null;
    const icon = toggle?.querySelector<HTMLElement>(".theme-toggle-icon");

    if (icon) {
      icon.textContent = isLight ? "☀" : "☾";
    }

    if (toggle) {
      toggle.setAttribute(
        "aria-label",
        isLight ? "Switch to dark mode" : "Switch to light mode"
      );
    }
  };

  const setTheme = (theme: Theme): void => {
    localStorage.setItem(storageKey, theme);
    applyTheme(theme);
  };

  const resolveTheme = (): Theme => {
    const stored = getStoredTheme();
    if (stored) return stored;
    return prefersLight.matches ? "light" : "dark";
  };

  const initThemeToggle = (): void => {
    applyTheme(resolveTheme());

    const toggle = document.getElementById("theme-toggle") as HTMLButtonElement | null;
    if (toggle) {
      toggle.addEventListener("click", () => {
        const nextTheme: Theme = document.body.classList.contains("light-mode")
          ? "dark"
          : "light";
        setTheme(nextTheme);
      });
    }

    prefersLight.addEventListener("change", (event: MediaQueryListEvent) => {
      if (!getStoredTheme()) {
        applyTheme(event.matches ? "light" : "dark");
      }
    });
  };

  document.addEventListener("DOMContentLoaded", initThemeToggle);
})();
