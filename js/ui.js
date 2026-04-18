/**
 * UI utility functions
 */
import { CONFIG } from './config.js';

export function formatCurrency(amount) {
  return new Intl.NumberFormat(CONFIG.LOCALE, {
    style: 'currency',
    currency: CONFIG.CURRENCY
  }).format(amount);
}

export function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(CONFIG.LOCALE, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return dateString;
  }
}

export function showMessage(elementId, message, type = 'success') {
  const messageDiv = document.getElementById(elementId);
  if (!messageDiv) return;

  messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
  messageDiv.textContent = message;

  setTimeout(() => {
    messageDiv.textContent = '';
    messageDiv.className = '';
  }, 5000);
}

export function showLoading(elementId, show = true) {
  const element = document.getElementById(elementId);
  if (!element) return;

  if (show) {
    element.innerHTML = '<div class="loading"><div class="spinner"></div>Cargando...</div>';
  }
}

export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
  if (activeTab) activeTab.classList.add('active');

  // Update tab content
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  const activeContent = document.getElementById(tabName);
  if (activeContent) activeContent.classList.add('active');
}
