import { DOM } from "./dom.js";
import { state } from "./state.js";
import { hideError } from "./ui.js";
import { validateSection, collectSectionData } from "./validation.js";
import { renderIniciais, iniciaisFields } from "./iniciais.js";
import { renderEquipamentos } from "./equipment.js";
import { renderRetorno, setRetornoData } from "./retornos.js";
import { renderPreviews } from "./attachments.js";
import { composeEmail } from "./email.js";
import { sendEmail } from "./send.js";
import { animateSectionTransition } from "./animator.js";
import { saveState } from "./persistence.js";

function updateStepIndicators(n) {
  DOM.steps.forEach((el, i) => {
    const num = i + 1;
    el.classList.toggle("active", num === n);
    el.classList.toggle("completed", num < n);
  });

  DOM.steps.forEach((el, i) => {
    el.onclick = () => {
      if (state.animating) return;
      showSection(i + 1, i + 1 > state.currentSection ? "next" : "prev", true);
    };
  });
}

function updateNavButtons(n) {
  DOM.btnAnterior.disabled = n === 1;

  if (n === state.totalSections) {
    DOM.btnProximo.textContent = "Enviar";
    DOM.btnProximo.className = "btn btn-success";
  } else if (n === state.totalSections - 1) {
    DOM.btnProximo.textContent = "Revisar \u2192";
    DOM.btnProximo.className = "btn btn-primary";
  } else {
    DOM.btnProximo.textContent = "Avan\u00E7ar \u2192";
    DOM.btnProximo.className = "btn btn-primary";
  }
}

function renderSectionContent(n) {
  if (n === 1) {
    renderIniciais();
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
  if (n === 5) {
    const emailData = {
      iniciais: state.iniciais,
      equipamentos: state.equipamentos,
      retorno: state.retorno,
    };
    DOM.previewCorpo.textContent = composeEmail(emailData);
  }
}

export function showSection(n, direction, noAnimation) {
  const current = state.currentSection;
  const ok = animateSectionTransition(current, n, direction, noAnimation);
  if (!ok) return;

  updateStepIndicators(n);
  updateNavButtons(n);
  renderSectionContent(n);

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

  if (state.currentSection === 1) {
    state.iniciaisValido = true;
  }

  if (state.currentSection === state.totalSections) {
    const success = await sendEmail();
    return;
  }

  showSection(state.currentSection + 1, "next");
}
