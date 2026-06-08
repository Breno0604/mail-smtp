import { state } from "./state.js";

export function animateSectionTransition(current, next, direction, noAnimation) {
  if (!noAnimation && state.animating) return false;
  if (!noAnimation) state.animating = true;

  const currentEl = document.getElementById(`section-${current}`);
  const nextEl = document.getElementById(`section-${next}`);
  const goingForward = direction !== "prev";

  if (!noAnimation && current !== next) {
    currentEl.classList.remove("active");
    currentEl.classList.add(goingForward ? "slide-out-left" : "slide-out-right");

    setTimeout(() => {
      currentEl.classList.remove("slide-out-left", "slide-out-right");
      currentEl.style.display = "none";

      nextEl.style.display = "block";
      nextEl.classList.add(goingForward ? "section-enter-next" : "section-enter-prev");

      setTimeout(() => {
        nextEl.classList.remove("section-enter-next", "section-enter-prev");
        nextEl.classList.add("active");
        state.animating = false;
      }, 220);
    }, 220);
  } else {
    currentEl.classList.remove("active");
    currentEl.style.display = "none";
    nextEl.style.display = "block";
    nextEl.classList.add("active");
    state.animating = false;
  }

  return true;
}
