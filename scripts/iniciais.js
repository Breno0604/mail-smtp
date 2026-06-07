import { DOM } from "./dom.js";
import { addBlurValidation } from "./validation.js";

const nomesTecnicos = ["ANDRE DE SOUSA CARVALHO","ANTONIO MAURIELLTON DE ARAUJO MARTINS","BERKSON EVANGELISTA DE OLIVEIRA","CARLOS CRISTIANO DO NASCIMENTO SILVA","DIEGO DA SILVA DE LIMA","DOUGLAS MONTEIRO DE ABREU","FRANCISCO ADRIANO DE SOUSA VIANA","JOSE DOGIVAN DA SILVA","LEANDRO OLIVEIRA SOUSA","MARCIO JOHNNATAN CHAGAS CAETANO","RENATO RODRIGUES VIEIRA","VALDI DOS SANTOS VIANA FILHO"];

export const iniciaisFields = [
  { linha: 1, nome: "lider",     label: "Líder",     tipo: "select", obrigatorio: true, opcoes: nomesTecnicos },
  { linha: 2, nome: "parceiro",  label: "Parceiro",  tipo: "select", obrigatorio: true, opcoes: nomesTecnicos },
  { linha: 3, nome: "municipio", label: "Município", tipo: "select", obrigatorio: true, opcoes: ["ACARAPE","AQUIRAZ","ARACOIABA","ARATUBA","BARREIRA","BATURITE","BEBERIBE","CAPISTRANO","CASCAVEL","CAUCAIA","CHOROZINHO","EUSÉBIO","FORTALEZA","GUAIUBA","GUARAMIRANGA","HORIZONTE","ITAITINGA","ITAPIUNA","MARACANAU","MARANGUAPE","MULUNGU","OCARA","PACAJUS","PACATUBA","PACOTI","PALMACIA","PINDORETAMA","REDENCAO","SAO GONCALO"] },
  { linha: 4, nome: "uc",        label: "UC",        tipo: "number", obrigatorio: true },
  { linha: 4, nome: "os",        label: "OS",        tipo: "text",   obrigatorio: true },
  { linha: 5, nome: "notificado", label: "Notificado", tipo: "select", obrigatorio: true, opcoes: ["SIM","NÃO"] },
  { linha: 5, nome: "placa",     label: "Placa",     tipo: "select", obrigatorio: true, opcoes: ["RHS6G02","RIE0D84","RIH3H88","SDZ7E43","SDZ9B15","SDZ9B16","SRT8J10","SRW6J12","SRW6J13","SRW6J41","TCI4F69","TUL0I49"] },
  { linha: 6, nome: "data",       label: "Data",     tipo: "date",   obrigatorio: true },
  { linha: 6, nome: "hora_inicio", label: "Início", tipo: "time", obrigatorio: true },
  { linha: 6, nome: "hora_fim",   label: "Fim",      tipo: "time",  obrigatorio: true },
  { linha: 7, nome: "tipo-ordem", label: "Tipo de Ordem", tipo: "select", obrigatorio: true, opcoes: ["ADEQUACAO SMF","AFERIÇÃO DE MEDIDOR","AFERIÇÃO MEDIDOR CLIENTE LIVRE","COLHER LEITURA","CORTE DE UC POR DEF TECNICO","CORTE DEFINITIVO A PEDIDO","CORTE POR FALTA DE PAGAMENTO","DESLIG.PROG.MANUTENÇÃO","DESLOCAMENTO DE SUBESTAÇÃO","DISPON. SAIDA SERIAL MEDIDOR","EXECUÇÃO DE MUDANÇA DE TARIFA","EXECUCAO DO ACRESCIMO DE POTENCIA","EXECUCAO DO DECRESCIMO DE POTENCIA","GRANDES CLIENTES SELO ROMPIDO","GRANDES CLIENTES SEM MEDIÇÃO","INSPECAO UC CORTADA I15","INSPECAO UC CORTADA I180","INSPECAO UC CORTADA I30","INSPECAO UC CORTADA I90","INSTALACAO DO DISPLAY","LIBERAÇÃO DE PULSO","LIGAÇÃO NOVA ISOLADA","LIGACAO NOVA MEDIA TENSAO","LIGACAO NOVA MT - CLIENTE LIVRE","LIGAÇÃO NOVA SIMULTÂNEA","RELIGACAO NORMAL RURAL","RELIGAÇÃO NORMAL URBANA","RESELAR MEDICAO","RESSERVICO","RETIRAR EQUIPAMENTOS","RETIRAR RAMAL","SERVIÇO ESPECIAL OPERAÇÃO GRUPO A","SUBST. DE EQUIPAMENTO DE MEDICAO","SUBST. MEDIDOR A PEDIDO","SUBST. MEDIDOR INICIATIVA COELCE","SUBSTITUIÇÃO DA BATERIA DO MEDIDOR","SUBSTITUIÇÃO DE DISPLAY","TELEMEDIÇÃO MANUTENÇÃO","TELEMEDIÇÃO MANUTENÇÃO CLIENTE LIVRE","TELEMEDIÇÃO MANUTENÇÃO LOTE","VISITA TECNICA GRUPO A","VISTORIA DA UC","VISTORIA GERAÇÃO DISTRIBUIDA"] },
];

const linhaConfig = {
  4: "grid grid-cols-2 gap-3 mb-4",
  5: "grid grid-cols-2 gap-3 mb-4",
  6: "grid grid-cols-3 gap-3 mb-4",
};

const inputClass = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base font-sans text-gray-900 bg-white outline-none transition-all focus:border-blue-600 focus:ring-3 focus:ring-blue-600/15";

export function renderIniciais() {
  DOM.iniciaisCampos.innerHTML = "";

  let currentLinha = null;
  let wrapper = null;

  iniciaisFields.forEach((field) => {
    if (field.linha !== currentLinha) {
      const config = linhaConfig[field.linha] || "mb-4";
      wrapper = document.createElement("div");
      wrapper.className = config;
      DOM.iniciaisCampos.appendChild(wrapper);
      currentLinha = field.linha;
    }

    const group = document.createElement("div");

    const label = document.createElement("label");
    label.setAttribute("for", field.nome);
    label.className = "block font-semibold text-base text-gray-700 mb-1";
    label.innerHTML = field.label + (field.obrigatorio ? ' <span class="text-red-600">*</span>' : "");

    let input;
    if (field.tipo === "select") {
      input = document.createElement("select");
      input.className = inputClass;
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Selecione";
      input.appendChild(placeholder);
      (field.opcoes || []).forEach((opt) => {
        const option = document.createElement("option");
        option.value = opt;
        option.textContent = opt;
        input.appendChild(option);
      });
    } else if (field.tipo === "number") {
      input = document.createElement("input");
      input.type = "text";
      input.inputMode = "numeric";
      input.pattern = "[0-9]*";
      input.className = inputClass;
    } else if (field.tipo === "date") {
      input = document.createElement("input");
      input.type = "date";
      input.className = inputClass;
    } else if (field.tipo === "time") {
      input = document.createElement("input");
      input.type = "time";
      input.className = inputClass;
    } else {
      input = document.createElement("input");
      input.type = "text";
      input.className = inputClass;
    }

    input.id = field.nome;
    input.placeholder = field.label;
    if (field.obrigatorio) input.setAttribute("data-required", "");

    addBlurValidation(input);
    group.appendChild(label);
    group.appendChild(input);
    wrapper.appendChild(group);
  });
}

export function getIniciaisData() {
  const data = {};
  iniciaisFields.forEach((field) => {
    const el = document.getElementById(field.nome);
    data[field.nome] = el ? el.value : "";
  });
  return data;
}
