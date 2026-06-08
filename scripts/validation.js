import { DOM } from "./dom.js";
import { state } from "./state.js";
import { showError, hideError, setFieldError, clearFieldError } from "./ui.js";
import { getIniciaisData } from "./iniciais.js";
import { getRetornoData } from "./retornos.js";
import { iniciaisFields as fieldsIniciais } from "./fields.js";
import { collectEquipamentos } from "./equipment.js";

// Cache de uso único: validateSection popula, collectSectionData consome e limpa.
// Isso evita a re-leitura do DOM quando collectSectionData segue validateSection.
const _validatedData = {};

// Limpa o cache (usado nos testes entre execuções)
export function _resetValidationCache() {
  Object.keys(_validatedData).forEach((k) => delete _validatedData[k]);
}

export function validateSection(n) {
  hideError();
  let valid = true;

  if (n === 1) {
    // Single DOM pass: collect all field values + element refs
    const data = {};
    fieldsIniciais.forEach((field) => {
      const el = document.getElementById(field.nome);
      if (!el) return;
      data[field.nome] = el.value;

      if (!field.obrigatorio) return;
      if (!data[field.nome] || data[field.nome].trim() === "") {
        el.classList.add("error");
        setFieldError(el, "Campo obrigat\u00F3rio");
        valid = false;
      } else {
        el.classList.remove("error");
        clearFieldError(el);
      }
    });

    if (!valid) {
      showError("Preencha todos os campos obrigat\u00F3rios.");
      return false;
    }

    // Special checks using cached data
    let errorMsg = "";
    const dataEl = document.getElementById("data");
    if (dataEl && data.data) {
      const selectedDate = new Date(data.data);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate > today) {
        dataEl.classList.add("error");
        setFieldError(dataEl, "Data n\u00E3o pode ser futura.");
        errorMsg = "Data não pode ser futura.";
      } else {
        dataEl.classList.remove("error");
        clearFieldError(dataEl);
      }
    }
    const horaInicioEl = document.getElementById("hora_inicio");
    const horaFimEl = document.getElementById("hora_fim");
    if (horaInicioEl && horaFimEl && data.hora_inicio && data.hora_fim) {
      if (data.hora_fim <= data.hora_inicio) {
        horaFimEl.classList.add("error");
        setFieldError(horaFimEl, "Hora fim deve ser maior que hora in\u00EDcio.");
        errorMsg = errorMsg
          ? errorMsg + " Hora fim deve ser maior que hora início."
          : "Hora fim deve ser maior que hora início.";
      } else {
        horaFimEl.classList.remove("error");
        clearFieldError(horaFimEl);
      }
    }
    if (errorMsg) {
      showError(errorMsg);
      valid = false;
    }

    // Cache + state — collectSectionData usa o cache em vez de reler o DOM
    if (valid) {
      state.iniciais = data;
      _validatedData[1] = data;
    }
  }

  if (n === 2) {
    const rows = DOM.equipList.querySelectorAll(".equip-row");
    if (rows.length > 0) {
      let hasError = false;
      let hasDuplicate = false;
      const nums = [];
      rows.forEach((row) => {
        const tipo = row.querySelector(".equip-tipo");
        const categoria = row.querySelector(".equip-categoria");
        const inp = row.querySelector(".equip-numero");
        [tipo, categoria, inp].forEach((el) => {
          el.classList.remove("error");
          clearFieldError(el);
        });
        if (tipo.value === "") { tipo.classList.add("error"); setFieldError(tipo, "Selecione o tipo"); hasError = true; }
        if (categoria.value === "") { categoria.classList.add("error"); setFieldError(categoria, "Selecione a categoria"); hasError = true; }
        if (inp.value === "") { inp.classList.add("error"); setFieldError(inp, "Informe o n\u00FAmero"); hasError = true; }
        else if (nums.includes(inp.value)) { inp.classList.add("error"); setFieldError(inp, "N\u00FAmero duplicado"); hasError = true; hasDuplicate = true; }
        else { nums.push(inp.value); }
      });
      if (hasError) {
        showError(hasDuplicate
          ? "N\u00BA de equipamento duplicado."
          : "Preencha todos os campos de cada equipamento.");
        valid = false;
      }
    }
    // Populate state so collectSectionData(2) can skip re-read
    if (valid) {
      collectEquipamentos();
      _validatedData[2] = state.equipamentos;
    }
  }

  if (n === 3) {
    if (DOM.retornoCampos.children.length === 0) {
      showError("Navegue at\u00E9 a se\u00E7\u00E3o de Retorno primeiro.");
      return false;
    }
    const campos = DOM.retornoCampos.querySelectorAll("textarea, input");
    let descricao = "";
    campos.forEach((el) => {
      if (el.hasAttribute("data-required") && el.value.trim() === "") {
        el.classList.add("error");
        setFieldError(el, "Campo obrigat\u00F3rio");
        valid = false;
      } else {
        el.classList.remove("error");
        clearFieldError(el);
        if (el.id === "descricao-retorno") descricao = el.value;
      }
    });
    if (!valid) {
      showError("Preencha todos os campos obrigat\u00F3rios.");
    } else {
      state.retorno = { descricao };
      _validatedData[3] = { descricao };
    }
  }

  if (n === 4) {
    if (state.attachments.length > 12) {
      showError("M\u00E1ximo de 12 anexos permitido.");
      valid = false;
    } else {
      const oversized = state.attachments.filter((f) => f.size > 8 * 1024 * 1024);
      if (oversized.length > 0) {
        showError(
          "Anexo(s) excedem 8 MB: " +
            oversized.map((f) => f.name).join(", ") +
            "."
        );
        valid = false;
      }
    }
  }

  if (n === 5) {
    // Seção de revisão — nenhum campo novo para validar
    valid = true;
  }

  return valid;
}

export function addBlurValidation(el) {
  el.addEventListener("blur", () => {
    if (el.hasAttribute("required") || el.hasAttribute("data-required")) {
      const empty = !el.value || el.value.trim() === "";
      if (empty) {
        el.classList.add("error");
        setFieldError(el, "Campo obrigat\u00F3rio");
      } else {
        el.classList.remove("error");
        clearFieldError(el);
      }
    }
  });
  el.addEventListener("input", () => {
    el.classList.remove("error");
    clearFieldError(el);
  });
  el.addEventListener("change", () => {
    if (el.value && el.value.trim() !== "") {
      el.classList.remove("error");
      clearFieldError(el);
    }
  });
}

export function collectSectionData(n) {
  if (n === 1) {
    if (_validatedData[1] && typeof _validatedData[1] === 'object' && _validatedData[1].lider) {
      state.iniciais = _validatedData[1];
      delete _validatedData[1];
    } else {
      state.iniciais = getIniciaisData();
    }
  }
  if (n === 2) {
    if (Array.isArray(_validatedData[2])) {
      state.equipamentos = _validatedData[2];
      delete _validatedData[2];
    } else {
      collectEquipamentos();
    }
  }
  if (n === 3) {
    if (_validatedData[3] && typeof _validatedData[3] === 'object' && _validatedData[3].descricao !== undefined) {
      state.retorno = _validatedData[3];
      delete _validatedData[3];
    } else {
      state.retorno = getRetornoData();
    }
  }
}
