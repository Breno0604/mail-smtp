// tests/dom.test.js
// Unit tests for dom.js — DOM element caching module
// Note: dom.js is extensively tested indirectly by all integration tests.
// These unit tests verify the caching contract directly.

import { describe, it, expect, beforeEach } from 'vitest';
import { cacheDOM, DOM } from '../scripts/dom.js';

describe('dom — element caching', () => {
  beforeEach(() => {
    // Setup full DOM structure matching cacheDOM expectations
    document.body.innerHTML = `
      <!-- Header -->
      <button id="hamburger"></button>
      <button id="btn-novo-form"></button>

      <!-- Sections -->
      <section id="sec-inicio"></section>
      <section id="sec-retorno"></section>
      <section id="sec-equipamentos"></section>
      <section id="sec-anexos"></section>
      <section id="sec-revisao"></section>

      <!-- Error & Toast -->
      <div id="error-msg"></div>
      <div id="toast"></div>

      <!-- Início -->
      <div id="iniciais-campos"></div>
      <select id="tipo-ordem"></select>

      <!-- Retorno -->
      <p id="retorno-desc"></p>
      <div id="retorno-placeholder"></div>
      <div id="retorno-campos"></div>

      <!-- Equipamentos -->
      <select id="instalado-equip"><option value="NAO">NAO</option><option value="SIM">SIM</option></select>
      <select id="retirado-equip"><option value="NAO">NAO</option><option value="SIM">SIM</option></select>
      <div id="sec-equip-instalados" class="hidden"></div>
      <div id="sec-equip-retirados" class="hidden"></div>
      <div id="checkboxes-instalados"></div>
      <div id="checkboxes-retirados"></div>
      <div id="campos-instalados"></div>
      <div id="campos-retirados"></div>

      <!-- Anexos -->
      <input type="file" id="file-input">
      <span id="file-count"></span>
      <div id="preview-grid"></div>
      <div id="file-upload-area"></div>

      <!-- Revisão -->
      <div id="preview-corpo"></div>
      <textarea id="complemento-corpo"></textarea>

      <!-- Send -->
      <button id="btn-enviar"></button>

      <!-- Sidebar -->
      <div id="sidebar"></div>
      <div id="sidebar-overlay"></div>
      <button id="sidebar-close"></button>
      <div id="sidebar-list"></div>
      <input id="sidebar-filter">

      <!-- Modals -->
      <div id="dup-modal"></div>
      <div id="dup-modal-title"></div>
      <div id="dup-modal-body"></div>
      <button id="dup-modal-cancel"></button>
      <button id="dup-modal-confirm"></button>
      <div id="lightbox"></div>
      <img id="lightbox-img">
      <button id="lightbox-close"></button>
      <div id="confirm-modal"></div>
      <div id="confirm-modal-text"></div>
      <button id="confirm-modal-ok"></button>
      <button id="confirm-modal-cancel"></button>
      <div id="update-modal"></div>
      <button id="update-modal-ok"></button>
    `;
  });

  it('should populate DOM with expected element references', () => {
    cacheDOM();

    // Header
    expect(DOM.hamburger).toBeInstanceOf(HTMLElement);
    expect(DOM.btnNovoForm).toBeInstanceOf(HTMLElement);

    // Sections
    expect(DOM.secInicio).toBeInstanceOf(HTMLElement);
    expect(DOM.secRetorno).toBeInstanceOf(HTMLElement);
    expect(DOM.secEquipamentos).toBeInstanceOf(HTMLElement);
    expect(DOM.secAnexos).toBeInstanceOf(HTMLElement);
    expect(DOM.secRevisao).toBeInstanceOf(HTMLElement);

    // Error & Toast
    expect(DOM.errorMsg).toBeInstanceOf(HTMLElement);
    expect(DOM.toast).toBeInstanceOf(HTMLElement);

    // Início
    expect(DOM.iniciaisCampos).toBeInstanceOf(HTMLElement);
    expect(DOM.tipoOrdem).toBeInstanceOf(HTMLElement);

    // Retorno
    expect(DOM.retornoDesc).toBeInstanceOf(HTMLElement);
    expect(DOM.retornoPlaceholder).toBeInstanceOf(HTMLElement);
    expect(DOM.retornoCampos).toBeInstanceOf(HTMLElement);

    // Equipamentos
    expect(DOM.instaladoEquip).toBeInstanceOf(HTMLElement);
    expect(DOM.retiradoEquip).toBeInstanceOf(HTMLElement);
    expect(DOM.secEquipInstalados).toBeInstanceOf(HTMLElement);
    expect(DOM.secEquipRetirados).toBeInstanceOf(HTMLElement);
    expect(DOM.checkboxesInstalados).toBeInstanceOf(HTMLElement);
    expect(DOM.checkboxesRetirados).toBeInstanceOf(HTMLElement);
    expect(DOM.camposInstalados).toBeInstanceOf(HTMLElement);
    expect(DOM.camposRetirados).toBeInstanceOf(HTMLElement);

    // Anexos
    expect(DOM.fileInput).toBeInstanceOf(HTMLElement);
    expect(DOM.fileCount).toBeInstanceOf(HTMLElement);
    expect(DOM.previewGrid).toBeInstanceOf(HTMLElement);
    expect(DOM.fileUploadArea).toBeInstanceOf(HTMLElement);

    // Revisão
    expect(DOM.previewCorpo).toBeInstanceOf(HTMLElement);

    // Send
    expect(DOM.btnEnviar).toBeInstanceOf(HTMLElement);

    // Sidebar
    expect(DOM.sidebar).toBeInstanceOf(HTMLElement);
    expect(DOM.sidebarOverlay).toBeInstanceOf(HTMLElement);
    expect(DOM.sidebarClose).toBeInstanceOf(HTMLElement);
    expect(DOM.sidebarList).toBeInstanceOf(HTMLElement);
    expect(DOM.sidebarFilter).toBeInstanceOf(HTMLElement);

    // Modals
    expect(DOM.dupModal).toBeInstanceOf(HTMLElement);
    expect(DOM.dupModalTitle).toBeInstanceOf(HTMLElement);
    expect(DOM.dupModalBody).toBeInstanceOf(HTMLElement);
    expect(DOM.dupModalCancel).toBeInstanceOf(HTMLElement);
    expect(DOM.dupModalConfirm).toBeInstanceOf(HTMLElement);
    expect(DOM.lightbox).toBeInstanceOf(HTMLElement);
    expect(DOM.lightboxImg).toBeInstanceOf(HTMLElement);
    expect(DOM.lightboxClose).toBeInstanceOf(HTMLElement);
    expect(DOM.confirmModal).toBeInstanceOf(HTMLElement);
    expect(DOM.confirmModalText).toBeInstanceOf(HTMLElement);
    expect(DOM.confirmModalOk).toBeInstanceOf(HTMLElement);
    expect(DOM.confirmModalCancel).toBeInstanceOf(HTMLElement);
    expect(DOM.updateModal).toBeInstanceOf(HTMLElement);
    expect(DOM.updateModalOk).toBeInstanceOf(HTMLElement);
  });

  it('should set null for missing DOM elements (graceful degradation)', () => {
    document.body.innerHTML = ''; // No elements
    cacheDOM();

    // All properties should be null (nullish), not throw
    expect(DOM.hamburger).toBeNull();
    expect(DOM.btnEnviar).toBeNull();
    expect(DOM.secInicio).toBeNull();
    expect(DOM.sidebar).toBeNull();
    expect(DOM.iniciaisCampos).toBeNull();
    expect(DOM.updateModalOk).toBeNull();
  });

  it('should not throw when called multiple times', () => {
    cacheDOM();
    expect(() => {
      cacheDOM();
      cacheDOM();
    }).not.toThrow();
  });

  it('should correctly reference input/select/textarea elements', () => {
    document.body.innerHTML = `
      <select id="tipo-ordem"></select>
      <input type="file" id="file-input">
      <input id="sidebar-filter">
    `;
    cacheDOM();

    expect(DOM.tipoOrdem).toBeInstanceOf(HTMLSelectElement);
    expect(DOM.fileInput).toBeInstanceOf(HTMLInputElement);
    expect(DOM.sidebarFilter).toBeInstanceOf(HTMLInputElement);
  });
});
