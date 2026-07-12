// tests/dom.test.js
// Unit tests for dom.js — DOM element caching module
// Note: dom.js is extensively tested indirectly by all integration tests.
// These unit tests verify the caching contract directly.

import { describe, it, expect, beforeEach } from 'vitest';
import { cacheDOM, DOM } from '../scripts/dom.js';
import { createTestDOM } from './helpers/dom-fixture.js';

describe('dom — element caching', () => {
  beforeEach(() => {
    createTestDOM();
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
