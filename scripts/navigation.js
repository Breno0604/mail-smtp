import { DOM } from "./dom.js";
import { state, saveState } from "./state.js";
import { hideError } from "./ui.js";
import { validateSection, collectSectionData } from "./validation.js";
import { renderIniciais, iniciaisFields } from "./iniciais.js";
import { renderEquipamentos } from "./equipment.js";
import { renderRetorno, setRetornoData } from "./retornos.js";
import { renderPreviews } from "./attachments.js";
import { composeEmail } from "./email.js";
import { sendEmail } from "./send.js";

function getSectionName(n) {
  const nomes = ["", "Iniciais", "Equipamentos", "Retorno", "Anexos", "Revis\u00E3o"];
  return nomes[n] || "";
}

export function showSection(n, direction, noAnimation) {
  if (!noAnimation && state.animating) return;
  if (!noAnimation) state.animating = true;

  const current = state.currentSection;
  const goingForward = direction !== "prev";
  const currentEl = document.getElementById(`section-${current}`);
  const nextEl = document.getElementById(`section-${n}`);

  if (!noAnimation && current !== n) {
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

  DOM.steps.forEach((el, i) => {
    const num = i + 1;
    el.classList.toggle("active", num === n);
    el.classList.toggle("completed", num < n);
    el.classList.toggle("done", num < n);
  });

  DOM.lines.forEach((el, i) => {
    el.classList.toggle("completed", i + 1 < n);
  });

  DOM.btnAnterior.disabled = n === 1;

  if (n === state.totalSections) {
    DOM.btnProximo.textContent = "Enviar";
    DOM.btnProximo.className = "btn btn-success";
    composeEmail();
  } else if (n === state.totalSections - 1) {
    DOM.btnProximo.textContent = "Revisar \u2192";
    DOM.btnProximo.className = "btn btn-primary";
  } else {
    DOM.btnProximo.textContent = "Avan\u00E7ar \u2192";
    DOM.btnProximo.className = "btn btn-primary";
  }

  if (n === 1) {
    renderIniciais();
    DOM.tipoOrdem = document.getElementById("tipo-ordem");
    if (state.iniciais && Object.keys(state.iniciais).length > 0) {
      iniciaisFields.forEach((field) => {
        const el = document.getElementById(field.nome);
        if (el) el.value = state.iniciais[field.nome] || "";
      });
    }
  }
  if (n === 2) renderEquipamentos();
  if (n === 3) {
    renderRetorno();
    setRetornoData(state.retorno);
    state.visitedRetorno = true;
  }
  if (n === 4) renderPreviews();

  hideError();
  DOM.wrapper.scrollTop = 0;
  state.currentSection = n;
  saveState();
}

export function prevSection() {
  if (state.currentSection <= 1) return;
  collectSectionData(state.currentSection);
  showSection(state.currentSection - 1, "prev");
}

export async function nextSection() {
  if (!validateSection(state.currentSection)) return;
  collectSectionData(state.currentSection);

  if (state.currentSection === state.totalSections) {
    const success = await sendEmail();
    return;
  }

  showSection(state.currentSection + 1, "next");
}
