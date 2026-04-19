/**
 * Import functionality
 */
import { api } from './api.js';
import { CONFIG } from './config.js';
import { formatCurrency, formatDate, showMessage, escapeHtml, switchTab, formatDateTime, showToast } from './ui.js';

let selectedFile = null;
let importedTransactions = [];
let currentBatchId = null;

export function initImports() {
  setupFileUpload();
  setupImportButton();
  setupConfirmButton();
  loadImportHistory();
}

function setupFileUpload() {
  const uploadArea = document.getElementById('uploadArea');
  const fileInput = document.getElementById('fileInput');
  const removeFileBtn = document.getElementById('removeFile');

  if (uploadArea && fileInput) {
    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFileSelect(e.target.files[0]));

    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
      if (e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });
  }

  if (removeFileBtn) {
    removeFileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearFileSelection();
    });
  }
}

function handleFileSelect(file) {
  if (!file) return;

  const fileExt = '.' + file.name.split('.').pop().toLowerCase();

  if (!CONFIG.SUPPORTED_FORMATS.includes(fileExt)) {
    showMessage('importMessage', 'Formato de archivo no válido. Usa CSV o XLSX.', 'error');
    return;
  }

  if (file.size > CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024) {
    showMessage('importMessage', `El archivo es demasiado grande. Máximo ${CONFIG.MAX_FILE_SIZE_MB}MB.`, 'error');
    return;
  }

  selectedFile = file;

  const fileName = document.getElementById('fileName');
  const fileInfo = document.getElementById('fileInfo');
  const uploadArea = document.getElementById('uploadArea');
  const importButton = document.getElementById('importButton');

  if (fileName) fileName.textContent = file.name;
  if (fileInfo) fileInfo.style.display = 'flex';
  if (uploadArea) uploadArea.classList.add('has-file');
  if (importButton) importButton.disabled = false;

  const importResults = document.getElementById('importResults');
  if (importResults) importResults.style.display = 'none';
}

function clearFileSelection() {
  selectedFile = null;

  const fileInput = document.getElementById('fileInput');
  const fileInfo = document.getElementById('fileInfo');
  const uploadArea = document.getElementById('uploadArea');
  const importButton = document.getElementById('importButton');

  if (fileInput) fileInput.value = '';
  if (fileInfo) fileInfo.style.display = 'none';
  if (uploadArea) uploadArea.classList.remove('has-file');
  if (importButton) importButton.disabled = true;
}

function setupImportButton() {
  const importButton = document.getElementById('importButton');
  if (!importButton) return;

  importButton.addEventListener('click', async () => {
    if (!selectedFile) {
      showMessage('importMessage', 'Por favor selecciona un archivo primero.', 'error');
      return;
    }

    const sourceType = document.getElementById('sourceType')?.value || 'mercadopago_csv';

    importButton.disabled = true;
    importButton.innerHTML = '<div class="spinner" style="margin: 0 auto; width: 20px; height: 20px;"></div>';

    try {
      const result = await api.uploadImportFile(selectedFile, sourceType);

      if (result && result.batch) {
        showMessage('importMessage', '¡Importación completada exitosamente!', 'success');
        displayImportResults(result.batch);
        currentBatchId = result.batch.id; // Save batch ID for confirmation
        await loadImportedTransactions(result.batch.id);
      } else {
        throw new Error('Respuesta inesperada del servidor');
      }
    } catch (error) {
      console.error('Error en importación:', error);
      showMessage('importMessage', error.message || 'Error al importar archivo', 'error');
    } finally {
      importButton.disabled = false;
      importButton.textContent = 'Importar Transacciones';
    }
  });
}

function displayImportResults(batch) {
  const resultsSection = document.getElementById('importResults');
  if (resultsSection) {
    resultsSection.style.display = 'block';
  }

  document.getElementById('kpiTotal').textContent = batch.total_rows || 0;
  document.getElementById('kpiProcessed').textContent = batch.processed_rows || 0;
  document.getElementById('kpiDuplicated').textContent = batch.duplicated_rows || 0;
  document.getElementById('kpiFailed').textContent = batch.failed_rows || 0;

  const reviewRequired = batch.metadata?.review_required || 0;
  document.getElementById('kpiReview').textContent = reviewRequired;

  setTimeout(() => {
    resultsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

async function loadImportedTransactions(batchId) {
  try {
    const data = await api.getBatchTransactions(batchId);
    renderImportedTransactions(data.transactions || []);
  } catch (error) {
    console.error('Error loading imported transactions:', error);
    const tbody = document.getElementById('importedTransactionsBody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: #ff4757;">Error al cargar transacciones</td></tr>';
    }
  }
}

function renderImportedTransactions(transactions) {
  const tbody = document.getElementById('importedTransactionsBody');
  const confirmButton = document.getElementById('confirmButton');

  if (!tbody) return;

  if (transactions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #a0a0a0;">No hay transacciones para mostrar</td></tr>';
    if (confirmButton) confirmButton.style.display = 'none';
    return;
  }

  importedTransactions = transactions;

  const html = transactions.map(tx => {
    const date = formatDate(tx.operation_date);
    const displayAmount = tx.real_amount !== undefined ? tx.real_amount : tx.amount;
    const amount = formatCurrency(Math.abs(displayAmount || 0));
    const type = formatTransactionType(tx.transaction_type);

    let paymentMethod = tx.payment_method || '-';
    if (tx.payment_method_type && tx.payment_method_type !== tx.payment_method) {
      paymentMethod = `${tx.payment_method} (${tx.payment_method_type})`;
    }

    return `
      <tr>
        <td>${date}</td>
        <td style="font-weight: bold;">${amount}</td>
        <td>${type}</td>
        <td>${escapeHtml(paymentMethod)}</td>
      </tr>
    `;
  }).join('');

  tbody.innerHTML = html;

  const confirmedTransactions = transactions.filter(tx =>
    tx.status && tx.status.toLowerCase() === 'confirmada'
  );

  if (confirmButton) {
    confirmButton.style.display = confirmedTransactions.length > 0 ? 'block' : 'none';
  }
}

function formatTransactionType(type) {
  const typeMap = {
    'ingreso': '<span class="badge ingreso">Ingreso</span>',
    'gasto': '<span class="badge gasto">Gasto</span>',
    'transferencia': '<span class="badge transferencia">Transferencia</span>',
  };
  return typeMap[type?.toLowerCase()] || `<span class="badge">${type || '-'}</span>`;
}

function formatStatus(status) {
  const statusMap = {
    'confirmada': '<span class="badge confirmada">Confirmada</span>',
    'pendiente': '<span class="badge pendiente">Pendiente</span>',
    'duplicada': '<span class="badge duplicada">Duplicada</span>',
    'ignorada': '<span class="badge ignorada">Ignorada</span>',
  };
  return statusMap[status?.toLowerCase()] || `<span class="badge">${status || '-'}</span>`;
}

function setupConfirmButton() {
  const confirmButton = document.getElementById('confirmButton');
  if (!confirmButton) return;

  confirmButton.addEventListener('click', async () => {
    if (!currentBatchId) {
      showMessage('importMessage', 'No hay un batch para confirmar.', 'error');
      return;
    }

    const confirmedTransactions = importedTransactions.filter(tx =>
      tx.status && tx.status.toLowerCase() === 'confirmada'
    );

    if (confirmedTransactions.length === 0) {
      showMessage('importMessage', 'No hay transacciones confirmadas para registrar.', 'error');
      return;
    }

    confirmButton.disabled = true;
    confirmButton.innerHTML = '<div class="spinner" style="margin: 0 auto; width: 20px; height: 20px;"></div>';

    try {
      // Call backend confirm endpoint - this creates history AND registers transactions
      const confirmResult = await api.confirmBatch(currentBatchId);

      if (confirmResult.success) {
        const totalTransactions = confirmResult.summary.total_transacciones;

        // Show toast notification
        showToast(`Importación completada - ${totalTransactions} transacción(es) registradas`);

        showMessage(
          'importMessage',
          `✓ ${totalTransactions} transacción(es) registrada(s) exitosamente.`,
          'success'
        );

        // Clear the import UI
        clearImportState();

        // Reload import history
        await loadImportHistory();

        // Reload dashboard data and switch tabs
        setTimeout(async () => {
          const { loadDashboardData } = await import('./dashboard.js');
          await loadDashboardData();
          switchTab('dashboard');
        }, 2000);
      } else {
        throw new Error('Error al confirmar el batch');
      }
    } catch (error) {
      console.error('Error confirming batch:', error);
      showMessage('importMessage', error.message || 'Error al procesar las transacciones.', 'error');
    } finally {
      confirmButton.disabled = false;
      confirmButton.textContent = 'Confirmar y Registrar en Dashboard';
    }
  });
}

function clearImportState() {
  // Clear selected file
  selectedFile = null;
  currentBatchId = null;
  importedTransactions = [];

  // Reset file input
  const fileInput = document.getElementById('fileInput');
  const fileInfo = document.getElementById('fileInfo');
  const uploadArea = document.getElementById('uploadArea');
  const importButton = document.getElementById('importButton');
  const importResults = document.getElementById('importResults');

  if (fileInput) fileInput.value = '';
  if (fileInfo) fileInfo.style.display = 'none';
  if (uploadArea) uploadArea.classList.remove('has-file');
  if (importButton) importButton.disabled = true;
  if (importResults) importResults.style.display = 'none';
}

async function loadImportHistory() {
  try {
    const response = await api.getImportHistory();

    if (response.success && response.history.length > 0) {
      renderImportHistory(response.history);
      document.getElementById('importHistorySection').style.display = 'block';
    }
  } catch (error) {
    console.error('Error loading import history:', error);
    // Don't show error to user, just keep section hidden
  }
}

function renderImportHistory(historyItems) {
  const listElement = document.getElementById('importHistoryList');

  if (!listElement) return;

  if (historyItems.length === 0) {
    listElement.innerHTML = '<div class="history-empty">No hay importaciones registradas aún</div>';
    return;
  }

  const html = historyItems.map(item => `
    <div class="history-item">
      <div class="history-header">
        <span class="history-icon">✓</span>
        <span class="history-title">${escapeHtml(item.display_name)}</span>
      </div>
      <div class="history-stats">
        <span class="history-stat">
          ${item.total_transactions} transacciones
        </span>
        <span class="history-stat">
          Ingresos: ${formatCurrency(item.total_ingresos)}
        </span>
        <span class="history-stat">
          Gastos: ${formatCurrency(item.total_gastos)}
        </span>
      </div>
      <div class="history-timestamp">
        Confirmado el ${formatDateTime(item.confirmed_at)}
      </div>
    </div>
  `).join('');

  listElement.innerHTML = html;
}
