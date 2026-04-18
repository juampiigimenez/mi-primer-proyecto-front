/**
 * Dashboard functionality
 */
import { api } from './api.js';
import { formatCurrency, showMessage, showLoading } from './ui.js';

let transactions = [];

export async function initDashboard() {
  // Load initial data
  await loadDashboardData();

  // Setup form handler
  const form = document.getElementById('transactionForm');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }

  // Setup window resize handler for chart
  window.addEventListener('resize', () => {
    const totals = calculateTotals();
    updateChart(totals);
  });
}

export async function loadDashboardData() {
  // Load balance and transactions data
  await loadBalance();
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

  const formData = {
    monto: parseFloat(document.getElementById('amount').value),
    tipo: document.getElementById('type').value,
    descripcion: document.getElementById('description').value
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

function calculateTotals() {
  const totals = transactions.reduce((acc, transaction) => {
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
  const totals = calculateTotals();

  // Update balance
  const balanceElement = document.getElementById('balanceAmount');
  if (balanceElement) {
    balanceElement.textContent = formatCurrency(totals.balance);
    balanceElement.className = 'balance-amount' + (totals.balance < 0 ? ' negative' : '');
  }

  // Update totals
  const incomeElement = document.getElementById('totalIncome');
  const expenseElement = document.getElementById('totalExpense');
  if (incomeElement) incomeElement.textContent = formatCurrency(totals.income);
  if (expenseElement) expenseElement.textContent = formatCurrency(totals.expense);

  // Update list
  renderTransactions();

  // Update chart
  updateChart(totals);
}

function renderTransactions() {
  const listElement = document.getElementById('transactionsList');
  if (!listElement) return;

  if (transactions.length === 0) {
    listElement.innerHTML = '<div class="empty-state">No hay transacciones registradas</div>';
    return;
  }

  const html = transactions
    .sort((a, b) => b.id - a.id)
    .map(transaction => `
      <div class="transaction-item ${transaction.tipo}">
        <div class="transaction-header">
          <span class="transaction-type ${transaction.tipo}">
            ${transaction.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}
          </span>
          <span class="transaction-amount ${transaction.tipo}">
            ${transaction.tipo === 'ingreso' ? '+' : '-'}${formatCurrency(Math.abs(transaction.monto))}
          </span>
        </div>
        <div class="transaction-description">${transaction.descripcion}</div>
      </div>
    `).join('');

  listElement.innerHTML = html;
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
  const radius = Math.min(centerX, centerY) - 20;

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
