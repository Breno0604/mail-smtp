import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  handleUploadClick,
  handleFileChange,
  removeFile,
  renderPreviews,
  updateFileCount,
  closeLightbox,
} from '../scripts/attachments.js';
import { createTestDOM } from './helpers/dom-fixture.js';
import { DOM } from '../scripts/dom.js';
import { state } from '../scripts/state.js';

describe('attachments', () => {
  beforeEach(() => {
    createTestDOM();
    state.attachments = [];
    state.equipamentos = [];
  });

  describe('handleUploadClick', () => {
    it('should trigger click on file input', () => {
      const spy = vi.spyOn(DOM.fileInput, 'click');
      handleUploadClick();
      expect(spy).toHaveBeenCalledOnce();
      spy.mockRestore();
    });
  });

  describe('handleFileChange', () => {
    function createFile(name, size = 100, type = 'image/jpeg') {
      const blob = new Blob(['x'.repeat(size)], { type });
      return new File([blob], name, { type });
    }

    function createFileEvent(files) {
      return {
        target: { files },
      };
    }

    it('should add files to state.attachments', () => {
      const file = createFile('test.jpg');
      const event = createFileEvent([file]);
      handleFileChange(event);
      expect(state.attachments).toHaveLength(1);
      expect(state.attachments[0].name).toBe('test.jpg');
    });

    it('should render previews after adding files', () => {
      const file = createFile('test.jpg');
      const event = createFileEvent([file]);
      handleFileChange(event);
      const items = DOM.previewGrid.querySelectorAll('.preview-item');
      expect(items.length).toBe(1);
    });

    it('should update file count after adding files', () => {
      const file = createFile('test.jpg');
      const event = createFileEvent([file]);
      handleFileChange(event);
      expect(DOM.fileCount.textContent).toBe('1 / 12');
    });

    it('should limit to maximum 12 files', () => {
      // Fill up with 12 files first
      for (let i = 0; i < 12; i++) {
        state.attachments.push(createFile(`existing-${i}.jpg`));
      }
      // Try to add 2 more
      const file1 = createFile('extra1.jpg');
      const file2 = createFile('extra2.jpg');
      const event = createFileEvent([file1, file2]);
      handleFileChange(event);
      // Still 12 (only remaining slots filled, which is 0)
      expect(state.attachments.length).toBe(12);
    });

    it('should add remaining slots when over limit', () => {
      state.attachments.push(createFile('existing.jpg'));
      // 11 remaining slots, try to add 15 files
      const files = [];
      for (let i = 0; i < 15; i++) {
        files.push(createFile(`file-${i}.jpg`));
      }
      const event = createFileEvent(files);
      handleFileChange(event);
      // 1 existing + 11 remaining = 12
      expect(state.attachments.length).toBe(12);
    });

    it('should show error when files exceed remaining slots', () => {
      state.attachments.push(createFile('existing.jpg'));
      const files = [];
      for (let i = 0; i < 15; i++) {
        files.push(createFile(`file-${i}.jpg`));
      }
      const event = createFileEvent(files);
      handleFileChange(event);
      const errorMsg = document.getElementById('error-msg');
      expect(errorMsg.style.display).not.toBe('none');
      expect(errorMsg.textContent).toContain('Máximo');
    });

    it('should clear file input value after processing', () => {
      const file = createFile('test.jpg');
      const event = createFileEvent([file]);
      handleFileChange(event);
      // In jsdom, file input value must always be empty string
      expect(DOM.fileInput.value).toBe('');
    });

    it('should reject non-image files', () => {
      const file = createFile('test.pdf', 100, 'application/pdf');
      const event = createFileEvent([file]);
      handleFileChange(event);
      expect(state.attachments).toHaveLength(0);
    });
  });

  describe('removeFile', () => {
    it('should remove file from state.attachments', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      state.attachments.push(file);
      removeFile(0);
      expect(state.attachments).toHaveLength(0);
    });

    it('should update previews after removal', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      state.attachments.push(file);
      renderPreviews();
      expect(DOM.previewGrid.querySelectorAll('.preview-item').length).toBe(1);
      removeFile(0);
      expect(DOM.previewGrid.querySelectorAll('.preview-item').length).toBe(0);
    });

    it('should update file count after removal', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      state.attachments.push(file);
      updateFileCount();
      expect(DOM.fileCount.textContent).toBe('1 / 12');
      removeFile(0);
      expect(DOM.fileCount.textContent).toBe('0 / 12');
    });
  });

  describe('renderPreviews', () => {
    it('should create preview elements for each file', () => {
      const file1 = new File(['test1'], 'img1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['test2'], 'img2.png', { type: 'image/png' });
      state.attachments.push(file1, file2);
      renderPreviews();
      const items = DOM.previewGrid.querySelectorAll('.preview-item');
      expect(items.length).toBe(2);
    });

    it('should display file names', () => {
      const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });
      state.attachments.push(file);
      renderPreviews();
      const name = DOM.previewGrid.querySelector('.preview-name');
      expect(name.textContent).toBe('photo.jpg');
    });

    it('should show remove button on each preview', () => {
      const file = new File(['test'], 'img.jpg', { type: 'image/jpeg' });
      state.attachments.push(file);
      renderPreviews();
      const removeBtn = DOM.previewGrid.querySelector('.preview-remove');
      expect(removeBtn).toBeTruthy();
    });

    it('should clear preview grid before re-rendering', () => {
      const file1 = new File(['test1'], 'img1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['test2'], 'img2.jpg', { type: 'image/jpeg' });
      state.attachments.push(file1);
      renderPreviews();
      expect(DOM.previewGrid.querySelectorAll('.preview-item').length).toBe(1);
      state.attachments.push(file2);
      renderPreviews();
      expect(DOM.previewGrid.querySelectorAll('.preview-item').length).toBe(2);
    });

    it('should set lightbox on click', () => {
      const file = new File(['test'], 'img.jpg', { type: 'image/jpeg' });
      state.attachments.push(file);
      renderPreviews();
      const item = DOM.previewGrid.querySelector('.preview-item');
      item.click();
      expect(DOM.lightbox.classList.contains('hidden')).toBe(false);
    });
  });

  describe('updateFileCount', () => {
    it('should show current file count', () => {
      state.attachments.push(
        new File(['a'], 'a.jpg', { type: 'image/jpeg' }),
        new File(['b'], 'b.jpg', { type: 'image/jpeg' })
      );
      updateFileCount();
      expect(DOM.fileCount.textContent).toBe('2 / 12');
    });

    it('should show 0 / 12 when no files', () => {
      updateFileCount();
      expect(DOM.fileCount.textContent).toBe('0 / 12');
    });

    it('should show max count when at limit', () => {
      for (let i = 0; i < 12; i++) {
        state.attachments.push(new File(['x'], `f-${i}.jpg`, { type: 'image/jpeg' }));
      }
      updateFileCount();
      expect(DOM.fileCount.textContent).toBe('12 / 12');
    });
  });

  describe('closeLightbox', () => {
    it('should hide the lightbox', () => {
      DOM.lightbox.classList.remove('hidden');
      closeLightbox();
      expect(DOM.lightbox.classList.contains('hidden')).toBe(true);
    });

    it('should not throw if lightbox already hidden', () => {
      DOM.lightbox.classList.add('hidden');
      expect(() => closeLightbox()).not.toThrow();
    });
  });
});
