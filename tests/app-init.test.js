import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

describe('DOM readiness', () => {
  let dom;
  let html;

  beforeAll(() => {
    html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf-8');
    dom = new JSDOM(html, {
      url: 'http://localhost',
      pretendToBeVisual: true,
      runScripts: 'outside-only',
    });
    global.document = dom.window.document;
    global.window = dom.window;
    global.navigator = dom.window.navigator;
    global.Element = dom.window.Element;
    global.HTMLElement = dom.window.HTMLElement;
    global.HTMLInputElement = dom.window.HTMLInputElement;
    global.HTMLSelectElement = dom.window.HTMLSelectElement;
    global.HTMLTextAreaElement = dom.window.HTMLTextAreaElement;
    global.HTMLButtonElement = dom.window.HTMLButtonElement;
  });

  it('should find all DOM elements that cacheDOM expects', () => {
    const ids = [
      'hamburger', 'btn-novo-form',
      'sidebar', 'sidebar-list', 'sidebar-overlay', 'sidebar-close', 'sidebar-filter',
      'error-msg',
      'sec-inicio', 'iniciais-campos',
      'sec-retorno', 'retorno-desc', 'retorno-placeholder', 'retorno-campos',
      'sec-equipamentos', 'equipamentos-list', 'btn-add-equip',
      'sec-anexos', 'file-input', 'file-count', 'preview-grid', 'file-upload-area',
      'sec-revisao', 'preview-corpo', 'complemento-corpo',
      'btn-enviar',
      'toast',
      'lightbox', 'lightbox-img', 'lightbox-close',
      'dup-modal', 'dup-modal-title', 'dup-modal-body', 'dup-modal-cancel', 'dup-modal-confirm',
      'confirm-modal', 'confirm-modal-text', 'confirm-modal-cancel', 'confirm-modal-ok',
    ];
    ids.forEach((id) => {
      expect(document.getElementById(id), `Element #${id} not found in HTML`).toBeTruthy();
    });
    expect(document.querySelectorAll('.sec-card')).toHaveLength(5);
  });

  it('should execute cacheDOM without errors', async () => {
    const { cacheDOM, DOM } = await import('../scripts/dom.js');
    expect(typeof cacheDOM).toBe('function');
    expect(() => cacheDOM()).not.toThrow();
    expect(DOM.hamburger).toBeTruthy();
    expect(DOM.btnNovoForm).toBeTruthy();
    expect(DOM.sidebarFilter).toBeTruthy();
    expect(DOM.sidebarList).toBeTruthy();
  });

  it('should execute initSidebarFilter without errors', async () => {
    const { initSidebarFilter } = await import('../scripts/sidebar.js');
    expect(typeof initSidebarFilter).toBe('function');
    expect(() => initSidebarFilter()).not.toThrow();
  });

  it('should execute renderIniciais without errors', async () => {
    // Need cacheDOM first
    const { cacheDOM } = await import('../scripts/dom.js');
    cacheDOM();
    const { renderIniciais } = await import('../scripts/iniciais.js');
    expect(typeof renderIniciais).toBe('function');
    expect(() => renderIniciais()).not.toThrow();
  });
});
