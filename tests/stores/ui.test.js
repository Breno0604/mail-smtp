// tests/stores/ui.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUIStore } from '../../src/stores/ui';

describe('UI Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('showToast sets message and shows toast', () => {
    const ui = useUIStore();
    ui.showToast('Test message', true);
    expect(ui.toastMessage).toBe('Test message');
    expect(ui.toastSuccess).toBe(true);
    expect(ui.toastVisible).toBe(true);
  });

  it('showError sets message and shows error', () => {
    const ui = useUIStore();
    ui.showError('Error message');
    expect(ui.errorMessage).toBe('Error message');
    expect(ui.errorVisible).toBe(true);
  });

  it('hideError hides error and clears message', () => {
    const ui = useUIStore();
    ui.showError('Error message');
    ui.hideError();
    expect(ui.errorVisible).toBe(false);
    expect(ui.errorMessage).toBe('');
  });

  it('showConfirm opens modal and returns promise', async () => {
    const ui = useUIStore();
    const promise = ui.showConfirm('Confirm?');
    expect(ui.confirmOpen).toBe(true);
    expect(ui.confirmMessage).toBe('Confirm?');
    
    ui.resolveConfirm(true);
    const result = await promise;
    expect(result).toBe(true);
    expect(ui.confirmOpen).toBe(false);
  });

  it('resolveConfirm with false returns false', async () => {
    const ui = useUIStore();
    const promise = ui.showConfirm('Confirm?');
    ui.resolveConfirm(false);
    const result = await promise;
    expect(result).toBe(false);
  });
});