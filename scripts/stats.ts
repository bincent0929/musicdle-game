/**
 * This isn't being used currently.
 */
declare const Chart: any; //was having issue with Chart object in Typescript, this seemed to fix it

document.addEventListener("DOMContentLoaded", function (): void {
  /**
   * this allows us to have functions work on newly added HTML
   */

  /*
    info for the bar graph's stats and colors
    */

  const xLine = ["1", "2", "3", "4", "5+"];
  const yLine = [7, 15, 10, 12, 3];

  const bar = document.getElementById("barChart");

  (document.getElementById("currStreak") as HTMLElement).textContent =
    getCurrStreak();
  (document.getElementById("maxStreak") as HTMLElement).textContent =
    getMaxStreak();
  (document.getElementById("topGenre") as HTMLElement).textContent =
    getTopGenre();
  (document.getElementById("topSong") as HTMLElement).textContent =
    getTopSong();

  //functions for retrieving info from the current user
  function getCurrStreak() {
    return "3";
  }
  function getMaxStreak() {
    return "7";
  }

  function getTopGenre() {
    return "Pop";
  }
  function getTopSong() {
    return "Blinding Lights";
  }

  new Chart(bar, {
    type: "line",
    data: {
      labels: xLine,
      datasets: [
        {
          borderColor: "black",
          backgroundColor: "black",
          data: yLine,
        },
      ],
    },
    options: {
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Your Song Guessing Streaks",
          font: { size: 20 },
        },
      },
    },
  });
});
