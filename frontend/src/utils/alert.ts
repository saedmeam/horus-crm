export const showAlert = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app-alert', { detail: { message, type } }));
  }
};
