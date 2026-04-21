/**
 * Dashboard functionality
 */
import { api } from './api.js';
import { formatCurrency, showMessage, showLoading, showToast } from './ui.js';
import { getCategoryOptionsHTML, DEFAULT_CATEGORY } from './categories.js';
import { groupTransactionsByWeek, sortWeekKeysDesc } from './weeks.js';
import { showConfirmModal, showEditModal } from './modals.js';
import { drawStackedBarChart, getMonthRangeString } from './charts.js';

let transactions = [];
let validatedWeeks = new Set();

// Chart state - show last 3 months by default
let chartMonthOffset = 0; // 0 = current period (last 3 months)

export async function initDashboard() {
  // Populate category dropdown
  const categorySelect = document.getElementById('category');
  if (categorySelect) {
    categorySelect.innerHTML = getCategoryOptionsHTML();
  }

  // Load initial data
  await loadDashboardData();

  // Setup form handler
  const form = document.getElementById('transactionForm');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }

  // Setup window resize handler for charts
  window.addEventListener('resize', () => {
    const totals = calculateTotals();
    updateChart(totals);
    updateStackedBarChart();
  });

  // Setup chart navigation handlers
  const prevMonthsBtn = document.getElementById('prevMonths');
  const nextMonthsBtn = document.getElementById('nextMonths');

  if (prevMonthsBtn) {
    prevMonthsBtn.addEventListener('click', () => {
      chartMonthOffset -= 3;
      updateStackedBarChart();
    });
  }

  if (nextMonthsBtn) {
    nextMonthsBtn.addEventListener('click', () => {
      chartMonthOffset += 3;
      updateStackedBarChart();
    });
  }

  // Setup reset button handler
  const resetButton = document.getElementById('resetButton');
  if (resetButton) {
    resetButton.addEventListener('click', handleResetAllData);
  }
}

async function loadValidatedWeeks() {
  try {
    const data = await api.getValidatedWeeks();
    validatedWeeks = new Set(
      data.validated_weeks.map(w => `${w.year}-${w.week_number}`)
    );
  } catch (error) {
    console.error('Error loading validated weeks:', error);
    validatedWeeks = new Set();
  }
}

export async function loadDashboardData() {
  // Load balance, transactions, and validated weeks data
  await loadBalance();
  await loadValidatedWeeks();
  await loadTransactions();
}

async function loadBalance() {
  try {
    const data = await api.getBalance();
    const balanceElement = document.getElementById('balanceAmount');
    if (balanceElement) {
      balanceElement.textContent = formatCurrency(data.balance);
      balanceElement.className = 'balance-amount' + (data.balance < 0 ? ' negative' : '');
    }
  } catch (error) {
    console.error('Error loading balance:', error);
  }
}

async function loadTransactions() {
  try {
    showLoading('transactionsList');
    transactions = await api.getTransactions();
    updateUI();
  } catch (error) {
    console.error('Error loading transactions:', error);
    const listElement = document.getElementById('transactionsList');
    if (listElement) {
      listElement.innerHTML = '<div class="empty-state">Error al cargar transacciones. Verifica que la API esté funcionando.</div>';
    }
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const categoryValue = document.getElementById('category').value;
  const formData = {
    monto: parseFloat(document.getElementById('amount').value),
    tipo: document.getElementById('type').value,
    descripcion: document.getElementById('description').value,
    categoria: categoryValue || DEFAULT_CATEGORY
  };

  try {
    const newTransaction = await api.createTransaction(formData);
    transactions.push(newTransaction);
    updateUI();
    await loadBalance();
    showMessage('formMessage', 'Transacción agregada exitosamente', 'success');
    e.target.reset();
  } catch (error) {
    console.error('Error creating transaction:', error);
    showMessage('formMessage', error.message || 'Error al agregar transacción', 'error');
  }
}

async function handleResetAllData() {
  await showConfirmModal({
    title: '⚠️ Borrar Todos los Datos',
    message: `
      Esto eliminará PERMANENTEMENTE:
      <ul style="text-align: left; margin: 10px 0 10px 20px;">
        <li>Todas las transacciones (manuales e importadas)</li>
        <li>Todo el historial de importaciones</li>
        <li>Todas las semanas validadas</li>
      </ul>
      <p style="margin-top: 10px;"><strong>Esta acción NO se puede deshacer.</strong></p>
      <p style="margin-top: 10px;">Escribí <strong>"CONFIRMAR"</strong> para continuar:</p>
    `,
    confirmText: 'Borrar Todo',
    cancelText: 'Cancelar',
    requireText: true,
    requiredValue: 'CONFIRMAR',
    onConfirm: async () => {
      await api.resetAllData();

      // Clear local state
      transactions = [];
      validatedWeeks.clear();

      // Show success toast
      showToast('Todos los datos han sido eliminados exitosamente');

      // Reload page after 1 second
      setTimeout(() => {
        location.reload();
      }, 1000);
    }
  });
}

function filterCurrentMonth(transactions) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  return transactions.filter(tx => {
    const txDate = new Date(tx.fecha);
    return txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth;
  });
}

function calculateTotals(filteredTransactions = transactions) {
  const totals = filteredTransactions.reduce((acc, transaction) => {
    if (transaction.tipo === 'ingreso') {
      acc.income += parseFloat(transaction.monto);
    } else {
      acc.expense += parseFloat(transaction.monto);
    }
    return acc;
  }, { income: 0, expense: 0 });

  totals.balance = totals.income - totals.expense;
  return totals;
}

function updateUI() {
  // Calculate current month totals for chart and legend
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthTransactions = filterCurrentMonth(transactions);
  const currentMonthTotals = calculateTotals(currentMonthTransactions);

  // Update chart title with current month name
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const chartTitle = document.getElementById('chartTitle');
  if (chartTitle) {
    chartTitle.textContent = `${monthNames[currentMonth]} ${currentYear}`;
  }

  // Calculate all-time totals for balance only
  const allTimeTotals = calculateTotals(transactions);

  // Update balance (all-time)
  const balanceElement = document.getElementById('balanceAmount');
  if (balanceElement) {
    balanceElement.textContent = formatCurrency(allTimeTotals.balance);
    balanceElement.className = 'balance-amount' + (allTimeTotals.balance < 0 ? ' negative' : '');
  }

  // Update legend with CURRENT MONTH totals
  const incomeElement = document.getElementById('totalIncome');
  const expenseElement = document.getElementById('totalExpense');
  if (incomeElement) incomeElement.textContent = formatCurrency(currentMonthTotals.income);
  if (expenseElement) expenseElement.textContent = formatCurrency(currentMonthTotals.expense);

  // Update list
  renderTransactions();

  // Update pie chart with current month data
  const pieChartCtx = document.getElementById('pieChart');
  if (pieChartCtx) {
    updateChart(currentMonthTotals);
  }

  // Update stacked bar chart
  updateStackedBarChart();
}

function renderTransactions() {
  const listElement = document.getElementById('transactionsList');
  if (!listElement) return;

  if (transactions.length === 0) {
    listElement.innerHTML = '<div class="empty-state">No hay transacciones registradas</div>';
    return;
  }

  // Save current accordion states before re-rendering
  const collapsedWeeks = new Set();
  document.querySelectorAll('.week-transactions').forEach(weekDiv => {
    if (weekDiv.style.display === 'none') {
      collapsedWeeks.add(weekDiv.dataset.week);
    }
  });

  // Group transactions by week
  const grouped = groupTransactionsByWeek(transactions);
  const weekKeys = sortWeekKeysDesc(Object.keys(grouped));

  if (weekKeys.length === 0) {
    listElement.innerHTML = '<div class="empty-state">No hay transacciones registradas</div>';
    return;
  }

  const html = weekKeys.map(weekKey => {
    const weekData = grouped[weekKey];
    const isValidated = validatedWeeks.has(weekKey);

    // Sort transactions within week by date descending
    const sortedTransactions = weekData.transactions.sort((a, b) => {
      return new Date(b.fecha) - new Date(a.fecha);
    });

    const transactionsHtml = sortedTransactions.map(tx => `
      <div class="week-transaction-item ${tx.tipo}">
        <div class="week-transaction-left">
          <span class="week-transaction-date">${new Date(tx.fecha).toLocaleDateString('es-AR')}</span>
          <span class="week-transaction-desc">
            ${tx.descripcion}
            ${tx.categoria && tx.categoria !== 'Sin categoría' ? `<span class="week-transaction-category">${tx.categoria}</span>` : ''}
          </span>
          ${tx.metodo_pago === 'mercadopago' ? '<span class="week-transaction-badge mp-badge">MP</span>' : ''}
        </div>
        <div class="week-transaction-right">
          <span class="week-transaction-amount ${tx.tipo}">
            ${tx.tipo === 'ingreso' ? '+' : '-'}${formatCurrency(Math.abs(tx.monto))}
          </span>
          <div class="week-transaction-actions">
            <button class="week-action-btn edit-btn" data-id="${tx.id}" title="Editar">✏️</button>
            <button class="week-action-btn delete-btn" data-id="${tx.id}" title="Eliminar">🗑️</button>
          </div>
        </div>
      </div>
    `).join('');

    return `
      <div class="week-group ${isValidated ? 'validated' : ''}">
        <div class="week-header">
          <div class="week-header-left">
            <button class="week-collapse-btn" data-week="${weekKey}">▼</button>
            <div class="week-title">
              <span class="week-label">Semana ${weekData.week} - ${weekData.year}</span>
              ${isValidated ? '<span class="week-validated-badge">✓ Validada</span>' : ''}
            </div>
          </div>
          <div class="week-header-right">
            <div class="week-summary">
              <span class="week-summary-item income">
                +${formatCurrency(weekData.totalIngresos)}
              </span>
              <span class="week-summary-item expense">
                -${formatCurrency(weekData.totalGastos)}
              </span>
              <span class="week-summary-item total ${weekData.total >= 0 ? 'positive' : 'negative'}">
                ${weekData.total >= 0 ? '+' : ''}${formatCurrency(weekData.total)}
              </span>
            </div>
            ${!isValidated ? `
              <button class="week-confirm-btn" data-week="${weekKey}" title="Validar semana">
                ✓ Validar
              </button>
            ` : ''}
          </div>
        </div>
        <div class="week-transactions" data-week="${weekKey}">
          ${transactionsHtml}
        </div>
      </div>
    `;
  }).join('');

  listElement.innerHTML = html;

  // Restore collapsed state for previously collapsed weeks
  collapsedWeeks.forEach(weekKey => {
    const transactionsDiv = document.querySelector(`.week-transactions[data-week="${weekKey}"]`);
    const collapseBtn = document.querySelector(`.week-collapse-btn[data-week="${weekKey}"]`);
    if (transactionsDiv && collapseBtn) {
      transactionsDiv.style.display = 'none';
      collapseBtn.textContent = '▶';
    }
  });

  // Attach event listeners
  attachWeekEventListeners();
}

function attachWeekEventListeners() {
  // Collapse/expand buttons
  document.querySelectorAll('.week-collapse-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const weekKey = e.target.dataset.week;
      const transactionsDiv = document.querySelector(`.week-transactions[data-week="${weekKey}"]`);
      const isCollapsed = transactionsDiv.style.display === 'none';

      if (isCollapsed) {
        transactionsDiv.style.display = 'block';
        e.target.textContent = '▼';
      } else {
        transactionsDiv.style.display = 'none';
        e.target.textContent = '▶';
      }
    });
  });

  // Edit buttons
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = parseInt(e.target.dataset.id);
      const transaction = transactions.find(tx => tx.id === id);
      if (!transaction) return;

      const result = await showEditModal(transaction);
      if (result) {
        try {
          await api.updateTransaction(id, result);
          await loadTransactions();
          showMessage('formMessage', 'Transacción actualizada exitosamente', 'success');
        } catch (error) {
          console.error('Error updating transaction:', error);
          showMessage('formMessage', error.message || 'Error al actualizar transacción', 'error');
        }
      }
    });
  });

  // Delete buttons
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = parseInt(e.target.dataset.id);
      const transaction = transactions.find(tx => tx.id === id);
      if (!transaction) return;

      const confirmed = await showConfirmModal({
        title: 'Eliminar Transacción',
        message: `¿Estás seguro de que deseas eliminar esta transacción?<br><br><strong>${transaction.descripcion}</strong><br>${formatCurrency(transaction.monto)}`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      });

      if (confirmed) {
        try {
          await api.deleteTransaction(id);
          await loadTransactions();
          await loadBalance();
          showMessage('formMessage', 'Transacción eliminada exitosamente', 'success');
        } catch (error) {
          console.error('Error deleting transaction:', error);
          showMessage('formMessage', error.message || 'Error al eliminar transacción', 'error');
        }
      }
    });
  });

  // Confirm week buttons
  document.querySelectorAll('.week-confirm-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const weekKey = e.target.dataset.week;
      const [year, week] = weekKey.split('-').map(Number);

      const confirmed = await showConfirmModal({
        title: 'Validar Semana',
        message: `¿Validar la semana ${week} del ${year}?<br><br>Una vez validada, no podrás editar ni eliminar las transacciones de esta semana.`,
        confirmText: 'Validar',
        cancelText: 'Cancelar',
        requireText: true,
        requiredValue: 'VALIDAR'
      });

      if (confirmed) {
        try {
          await api.validateWeek(year, week);
          validatedWeeks.add(weekKey);
          renderTransactions();
          showMessage('formMessage', `Semana ${week}-${year} validada exitosamente`, 'success');
        } catch (error) {
          console.error('Error validating week:', error);
          showMessage('formMessage', error.message || 'Error al validar semana', 'error');
        }
      }
    });
  });
}

function updateChart(totals) {
  const canvas = document.getElementById('pieChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  if (totals.income === 0 && totals.expense === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '16px Inter';
    ctx.fillStyle = '#a0a0a0';
    ctx.textAlign = 'center';
    ctx.fillText('No hay datos para mostrar', canvas.width / 2, canvas.height / 2);
    return;
  }

  const size = Math.min(canvas.parentElement.clientWidth, canvas.parentElement.clientHeight);
  canvas.width = size;
  canvas.height = size;

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.max(Math.min(centerX, centerY) - 20, 10); // Ensure minimum radius of 10px

  const total = totals.income + totals.expense;
  const incomeAngle = (totals.income / total) * 2 * Math.PI;
  const expenseAngle = (totals.expense / total) * 2 * Math.PI;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw income segment
  if (totals.income > 0) {
    ctx.beginPath();
    ctx.fillStyle = '#2ed573';
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + incomeAngle);
    ctx.closePath();
    ctx.shadowColor = 'rgba(46, 213, 115, 0.5)';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Draw expense segment
  if (totals.expense > 0) {
    ctx.beginPath();
    ctx.fillStyle = '#ff4757';
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, -Math.PI / 2 + incomeAngle, -Math.PI / 2 + incomeAngle + expenseAngle);
    ctx.closePath();
    ctx.shadowColor = 'rgba(255, 71, 87, 0.5)';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Draw center circle (donut style)
  ctx.beginPath();
  ctx.fillStyle = 'rgba(22, 33, 62, 0.9)';
  ctx.arc(centerX, centerY, radius * 0.6, 0, 2 * Math.PI);
  ctx.fill();

  // Draw percentages
  ctx.font = 'bold 18px Inter';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';

  if (totals.income > 0) {
    const incomePercent = ((totals.income / total) * 100).toFixed(1);
    const incomeAnglePos = -Math.PI / 2 + incomeAngle / 2;
    const incomeX = centerX + Math.cos(incomeAnglePos) * (radius * 0.75);
    const incomeY = centerY + Math.sin(incomeAnglePos) * (radius * 0.75);
    ctx.fillText(`${incomePercent}%`, incomeX, incomeY);
  }

  if (totals.expense > 0) {
    const expensePercent = ((totals.expense / total) * 100).toFixed(1);
    const expenseAnglePos = -Math.PI / 2 + incomeAngle + expenseAngle / 2;
    const expenseX = centerX + Math.cos(expenseAnglePos) * (radius * 0.75);
    const expenseY = centerY + Math.sin(expenseAnglePos) * (radius * 0.75);
    ctx.fillText(`${expensePercent}%`, expenseX, expenseY);
  }
}

function updateStackedBarChart() {
  const canvas = document.getElementById('stackedBarChart');
  if (!canvas) return;

  // Calculate date range (3 months)
  const now = new Date();
  const endDate = new Date(now.getFullYear(), now.getMonth() + chartMonthOffset, 0); // Last day of end month
  const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 2, 1); // First day of start month (3 months total)

  // Adjust endDate to last day of month
  endDate.setDate(new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate());

  // Update month range display
  const monthRangeElement = document.getElementById('monthRange');
  if (monthRangeElement) {
    monthRangeElement.textContent = getMonthRangeString(startDate, endDate);
  }

  // Update navigation buttons state
  const prevBtn = document.getElementById('prevMonths');
  const nextBtn = document.getElementById('nextMonths');

  // Disable prev if no earlier data
  if (prevBtn) {
    const earliestTransaction = transactions.reduce((earliest, tx) => {
      const txDate = new Date(tx.fecha);
      return !earliest || txDate < earliest ? txDate : earliest;
    }, null);

    if (earliestTransaction) {
      const earliestMonth = new Date(earliestTransaction.getFullYear(), earliestTransaction.getMonth(), 1);
      prevBtn.disabled = startDate <= earliestMonth;
    } else {
      prevBtn.disabled = true;
    }
  }

  // Disable next if showing current month range
  if (nextBtn) {
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    nextBtn.disabled = endDate >= currentMonthEnd;
  }

  // Draw the chart
  drawStackedBarChart(canvas, transactions, startDate, endDate);
}
