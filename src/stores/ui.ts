// src/stores/ui.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUIStore = defineStore('ui', () => {
  // Toast notifications
  const toastMessage = ref('');
  const toastSuccess = ref(true);
  const toastVisible = ref(false);

  // Error banner
  const errorMessage = ref('');
  const errorVisible = ref(false);

  // Confirm modal
  const confirmMessage = ref('');
  const confirmOpen = ref(false);
  let confirmResolve: ((value: boolean) => void) | null = null;

  function showToast(message: string, success = true) {
    toastMessage.value = message;
    toastSuccess.value = success;
    toastVisible.value = true;
    setTimeout(() => {
      toastVisible.value = false;
    }, 3000);
  }

  function showError(message: string) {
    errorMessage.value = message;
    errorVisible.value = true;
  }

  function hideError() {
    errorVisible.value = false;
    errorMessage.value = '';
  }

  function showConfirm(message: string): Promise<boolean> {
    confirmMessage.value = message;
    confirmOpen.value = true;
    return new Promise((resolve) => {
      confirmResolve = resolve;
    });
  }

  function resolveConfirm(result: boolean) {
    confirmOpen.value = false;
    if (confirmResolve) {
      confirmResolve(result);
      confirmResolve = null;
    }
  }

  return {
    // State
    toastMessage,
    toastSuccess,
    toastVisible,
    errorMessage,
    errorVisible,
    confirmMessage,
    confirmOpen,
    // Actions
    showToast,
    showError,
    hideError,
    showConfirm,
    resolveConfirm,
  };
});