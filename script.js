function sayHello() {
  alert("Hello from JavaScript! 🚀");
}

function makeGuess() {
  let src = document.getElementById("song").value;
  alert("Printing: " + src);
}

// CorrectAnswer + Distractors
const correctAnswer = "Sample Song";
const distractors = ["Wrong Song A", "Wrong Song B"]; // two wrong choices

// simple shuffle
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
