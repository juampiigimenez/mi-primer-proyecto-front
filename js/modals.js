/**
 * Modal system for confirmations and editing
 */
import { getCategoryOptionsHTML } from './categories.js';

/**
 * Show confirmation modal
 * @param {Object} options - Modal options
 * @param {string} options.title - Modal title
 * @param {string} options.message - Modal message
 * @param {string} options.confirmText - Confirm button text
 * @param {string} options.cancelText - Cancel button text
 * @param {boolean} options.requireText - Whether to require text input for confirmation
 * @param {string} options.requiredValue - Required text value for confirmation
 * @param {Function} options.onConfirm - Optional async function to execute on confirm (for loading state and error handling)
 * @returns {Promise<boolean>} True if confirmed, false if cancelled
 */
export function showConfirmModal({
  title = 'Confirmar',
  message = '',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  requireText = false,
  requiredValue = '',
  onConfirm = null
}) {
  return new Promise((resolve) => {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';

    // Modal content
    modal.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
      </div>
      <div class="modal-body">
        <p class="modal-message">${message}</p>
        ${requireText ? `
          <div class="form-group">
            <label>Escribe "<strong>${requiredValue}</strong>" para confirmar:</label>
            <input type="text" class="modal-input" id="confirmInput" autocomplete="off">
            <div class="modal-error" id="confirmError" style="display: none;">
              El texto no coincide
            </div>
          </div>
        ` : ''}
        <div class="modal-error" id="actionError" style="display: none; margin-top: 10px;"></div>
      </div>
      <div class="modal-footer">
        <button class="modal-button modal-button-cancel" id="cancelBtn">${cancelText}</button>
        <button class="modal-button modal-button-confirm" id="confirmBtn" ${requireText ? 'disabled' : ''}>${confirmText}</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const confirmBtn = modal.querySelector('#confirmBtn');
    const cancelBtn = modal.querySelector('#cancelBtn');
    const actionError = modal.querySelector('#actionError');
    const originalConfirmText = confirmText;

    // Handle text input validation
    if (requireText) {
      const input = modal.querySelector('#confirmInput');
      const error = modal.querySelector('#confirmError');

      input.addEventListener('input', () => {
        const isValid = input.value === requiredValue;
        confirmBtn.disabled = !isValid;
        error.style.display = isValid || input.value === '' ? 'none' : 'block';
      });

      // Focus input
      setTimeout(() => input.focus(), 100);
    } else {
      // Focus confirm button
      setTimeout(() => confirmBtn.focus(), 100);
    }

    // Handle confirm
    confirmBtn.addEventListener('click', async () => {
      if (onConfirm) {
        // Show loading state
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Procesando...';
        cancelBtn.disabled = true;
        actionError.style.display = 'none';

        try {
          await onConfirm();
          closeModal();
          resolve(true);
        } catch (error) {
          // Show error inside modal
          actionError.textContent = error.message || 'Error al procesar la acción';
          actionError.style.display = 'block';

          // Re-enable buttons to allow retry
          confirmBtn.disabled = false;
          confirmBtn.textContent = originalConfirmText;
          cancelBtn.disabled = false;

          // Reset input validation if required
          if (requireText) {
            const input = modal.querySelector('#confirmInput');
            input.value = '';
            confirmBtn.disabled = true;
          }
        }
      } else {
        closeModal();
        resolve(true);
      }
    });

    // Handle cancel
    cancelBtn.addEventListener('click', () => {
      closeModal();
      resolve(false);
    });

    // Handle overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal();
        resolve(false);
      }
    });

    // Handle escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        resolve(false);
      }
    };
    document.addEventListener('keydown', handleEscape);

    function closeModal() {
      document.removeEventListener('keydown', handleEscape);
      overlay.classList.add('modal-closing');
      setTimeout(() => overlay.remove(), 200);
    }
  });
}

/**
 * Show edit transaction modal
 * @param {Object} transaction - Transaction to edit
 * @returns {Promise<Object|null>} Updated transaction data or null if cancelled
 */
export function showEditModal(transaction) {
  return new Promise((resolve) => {
    const isMercadoPago = transaction.metodo_pago === 'mercadopago';

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal modal-large';

    // Helper function to escape HTML
    const escapeHtml = (text) => {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };

    // Modal content
    modal.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">Editar Transacción</h3>
      </div>
      <div class="modal-body">
        <form id="editForm">
          ${isMercadoPago ? `
            <div class="form-group">
              <label for="editDescripcion">Descripción</label>
              <input type="text" id="editDescripcion" class="modal-input" value="${escapeHtml(transaction.descripcion)}" required>
            </div>
            <div class="form-group">
              <label for="editCategoria">Categoría</label>
              <select id="editCategoria" class="modal-input" required>
                ${getCategoryOptionsHTML(transaction.categoria || 'Sin categoría')}
              </select>
            </div>
            <div class="form-group">
              <label for="editMonto">Monto</label>
              <input type="number" id="editMonto" class="modal-input" value="${transaction.monto}" disabled>
              <small style="color: var(--text-secondary);">Campo bloqueado (Mercado Pago)</small>
            </div>
            <div class="form-group">
              <label for="editTipo">Tipo</label>
              <input type="text" id="editTipo" class="modal-input" value="${transaction.tipo}" disabled>
              <small style="color: var(--text-secondary);">Campo bloqueado (Mercado Pago)</small>
            </div>
            <div class="form-group">
              <label for="editFecha">Fecha</label>
              <input type="date" id="editFecha" class="modal-input" value="${transaction.fecha}" disabled>
              <small style="color: var(--text-secondary);">Campo bloqueado (Mercado Pago)</small>
            </div>
          ` : `
            <div class="form-group">
              <label for="editMonto">Monto</label>
              <input type="number" id="editMonto" class="modal-input" step="0.01" min="0" value="${transaction.monto}" required>
            </div>
            <div class="form-group">
              <label for="editTipo">Tipo</label>
              <select id="editTipo" class="modal-input" required>
                <option value="ingreso" ${transaction.tipo === 'ingreso' ? 'selected' : ''}>Ingreso</option>
                <option value="gasto" ${transaction.tipo === 'gasto' ? 'selected' : ''}>Gasto</option>
              </select>
            </div>
            <div class="form-group">
              <label for="editDescripcion">Descripción</label>
              <textarea id="editDescripcion" class="modal-input" required>${escapeHtml(transaction.descripcion)}</textarea>
            </div>
            <div class="form-group">
              <label for="editCategoria">Categoría</label>
              <select id="editCategoria" class="modal-input" required>
                ${getCategoryOptionsHTML(transaction.categoria || 'Sin categoría')}
              </select>
            </div>
          `}
        </form>
      </div>
      <div class="modal-footer">
        <button class="modal-button modal-button-cancel" id="cancelBtn">Cancelar</button>
        <button class="modal-button modal-button-confirm" id="saveBtn">Guardar</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const cancelBtn = modal.querySelector('#cancelBtn');
    const saveBtn = modal.querySelector('#saveBtn');

    // Focus first editable input
    if (isMercadoPago) {
      setTimeout(() => modal.querySelector('#editDescripcion').focus(), 100);
    } else {
      setTimeout(() => modal.querySelector('#editMonto').focus(), 100);
    }

    // Handle save
    saveBtn.addEventListener('click', () => {
      const descripcion = modal.querySelector('#editDescripcion').value.trim();
      const categoria = modal.querySelector('#editCategoria').value;

      if (isMercadoPago) {
        // For MP transactions, only update descripcion and categoria
        if (!descripcion) {
          alert('Por favor completa todos los campos requeridos');
          return;
        }

        closeModal();
        resolve({ descripcion, categoria });
      } else {
        // For manual transactions, update all fields
        const monto = parseFloat(modal.querySelector('#editMonto').value);
        const tipo = modal.querySelector('#editTipo').value;

        if (!monto || monto <= 0 || !descripcion) {
          alert('Por favor completa todos los campos requeridos');
          return;
        }

        closeModal();
        resolve({ monto, tipo, descripcion, categoria });
      }
    });

    // Handle form submit
    modal.querySelector('#editForm').addEventListener('submit', (e) => {
      e.preventDefault();
      saveBtn.click();
    });

    // Handle cancel
    cancelBtn.addEventListener('click', () => {
      closeModal();
      resolve(null);
    });

    // Handle overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal();
        resolve(null);
      }
    });

    // Handle escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        resolve(null);
      }
    };
    document.addEventListener('keydown', handleEscape);

    function closeModal() {
      document.removeEventListener('keydown', handleEscape);
      overlay.classList.add('modal-closing');
      setTimeout(() => overlay.remove(), 200);
    }
  });
}
