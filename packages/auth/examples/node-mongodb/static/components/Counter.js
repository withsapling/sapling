import canvasConfetti from "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/+esm";

let count = 0;

window.increment = () => {
  count++;
  const counterElement = document.getElementById("counter-count");
  if (counterElement) {
      counterElement.textContent = count.toString();
  }
  if (count === 3) {
    canvasConfetti({ particleCount: 100, colors: ["#cdac26", "#d0d0d1", "#292929", "#1b791f"], spread: 70, origin: { y: 0.6 } });
  }
};