/**
 * Chart rendering utilities
 */
import { getCategoryColor } from './categories.js';
import { formatCurrency } from './ui.js';

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const MONTH_NAMES_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                           'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/**
 * Draw stacked bar chart for expenses by category
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Array} transactions - All transactions
 * @param {Date} startDate - Start date for the period
 * @param {Date} endDate - End date for the period
 */
export function drawStackedBarChart(canvas, transactions, startDate, endDate) {
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // Filter to expenses only in the date range
  const expenses = transactions.filter(tx => {
    if (tx.tipo !== 'gasto') return false;
    const txDate = new Date(tx.fecha);
    return txDate >= startDate && txDate <= endDate;
  });

  // Set canvas dimensions
  const containerWidth = canvas.parentElement.clientWidth;
  const containerHeight = 400;
  canvas.width = containerWidth;
  canvas.height = containerHeight;

  // Check for empty state
  if (expenses.length === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '16px Inter';
    ctx.fillStyle = '#a0a0a0';
    ctx.textAlign = 'center';
    ctx.fillText('No hay gastos registrados en este período', canvas.width / 2, canvas.height / 2);
    return;
  }

  // Group expenses by month and category
  const monthlyData = groupExpensesByMonthAndCategory(expenses, startDate, endDate);

  // Get all unique categories
  const allCategories = getAllCategories(monthlyData);

  // Calculate layout dimensions
  const padding = { top: 40, right: 20, bottom: 80, left: 70 };
  const chartWidth = canvas.width - padding.left - padding.right;
  const chartHeight = canvas.height - padding.top - padding.bottom;

  // Calculate max value for Y-axis
  const maxValue = getMaxMonthlyTotal(monthlyData);
  const yAxisMax = Math.ceil(maxValue * 1.1 / 1000) * 1000; // Round up to nearest 1000

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw Y-axis grid and labels
  drawYAxis(ctx, padding, chartWidth, chartHeight, yAxisMax);

  // Draw bars
  const months = Object.keys(monthlyData).sort();
  const barWidth = Math.min(chartWidth / months.length * 0.7, 80);
  const barSpacing = chartWidth / months.length;

  months.forEach((monthKey, index) => {
    const monthData = monthlyData[monthKey];
    const x = padding.left + barSpacing * index + (barSpacing - barWidth) / 2;

    drawStackedBar(ctx, x, padding.top, barWidth, chartHeight, monthData, allCategories, yAxisMax);
  });

  // Draw X-axis labels
  drawXAxisLabels(ctx, padding, chartWidth, chartHeight, months, barSpacing);

  // Draw legend
  drawLegend(ctx, canvas.width, canvas.height, allCategories, padding);

  // Setup mouse interaction
  setupMouseInteraction(canvas, ctx, months, monthlyData, allCategories, padding, chartWidth, chartHeight, barWidth, barSpacing, yAxisMax);
}

/**
 * Group expenses by month and category
 */
function groupExpensesByMonthAndCategory(expenses, startDate, endDate) {
  const data = {};

  // Initialize all months in range
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  while (current <= endDate) {
    const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
    data[key] = {};
    current.setMonth(current.getMonth() + 1);
  }

  // Group expenses
  expenses.forEach(tx => {
    const date = new Date(tx.fecha);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const category = tx.categoria || 'Sin categoría';

    if (!data[monthKey]) data[monthKey] = {};
    if (!data[monthKey][category]) data[monthKey][category] = 0;

    data[monthKey][category] += parseFloat(tx.monto);
  });

  return data;
}

/**
 * Get all unique categories from monthly data
 */
function getAllCategories(monthlyData) {
  const categories = new Set();
  Object.values(monthlyData).forEach(month => {
    Object.keys(month).forEach(cat => categories.add(cat));
  });
  return Array.from(categories).sort();
}

/**
 * Get maximum monthly total
 */
function getMaxMonthlyTotal(monthlyData) {
  let max = 0;
  Object.values(monthlyData).forEach(month => {
    const total = Object.values(month).reduce((sum, val) => sum + val, 0);
    if (total > max) max = total;
  });
  return max;
}

/**
 * Draw Y-axis with grid lines and labels
 */
function drawYAxis(ctx, padding, chartWidth, chartHeight, yAxisMax) {
  const steps = 5;
  const stepValue = yAxisMax / steps;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.font = '12px Inter';
  ctx.fillStyle = '#a0a0a0';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  for (let i = 0; i <= steps; i++) {
    const value = stepValue * i;
    const y = padding.top + chartHeight - (chartHeight / steps * i);

    // Draw grid line
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + chartWidth, y);
    ctx.stroke();

    // Draw label
    ctx.fillText(`$${formatThousands(value)}`, padding.left - 10, y);
  }

  // Y-axis title
  ctx.save();
  ctx.translate(20, padding.top + chartHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.font = 'bold 14px Inter';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Monto ($)', 0, 0);
  ctx.restore();
}

/**
 * Draw a single stacked bar
 */
function drawStackedBar(ctx, x, topPadding, width, height, monthData, allCategories, yAxisMax) {
  let currentY = topPadding + height;

  allCategories.forEach(category => {
    const value = monthData[category] || 0;
    if (value === 0) return;

    const barHeight = (value / yAxisMax) * height;
    currentY -= barHeight;

    // Draw bar segment
    ctx.fillStyle = getCategoryColor(category);
    ctx.fillRect(x, currentY, width, barHeight);

    // Draw border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, currentY, width, barHeight);
  });
}

/**
 * Draw X-axis labels
 */
function drawXAxisLabels(ctx, padding, chartWidth, chartHeight, months, barSpacing) {
  ctx.font = '13px Inter';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  months.forEach((monthKey, index) => {
    const [year, month] = monthKey.split('-');
    const monthName = MONTH_NAMES_SHORT[parseInt(month) - 1];
    const x = padding.left + barSpacing * index + barSpacing / 2;
    const y = padding.top + chartHeight + 10;

    ctx.fillText(monthName, x, y);

    // Year label (smaller, below month)
    ctx.font = '11px Inter';
    ctx.fillStyle = '#a0a0a0';
    ctx.fillText(year, x, y + 18);
    ctx.font = '13px Inter';
    ctx.fillStyle = '#ffffff';
  });
}

/**
 * Draw legend
 */
function drawLegend(ctx, canvasWidth, canvasHeight, categories, padding) {
  const legendItemWidth = 120;
  const legendItemHeight = 20;
  const legendSpacing = 10;
  const maxColumns = Math.floor((canvasWidth - padding.left - padding.right) / (legendItemWidth + legendSpacing));

  const startX = padding.left;
  const startY = canvasHeight - padding.bottom + 50;

  ctx.font = '11px Inter';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  categories.forEach((category, index) => {
    const col = index % maxColumns;
    const row = Math.floor(index / maxColumns);
    const x = startX + col * (legendItemWidth + legendSpacing);
    const y = startY + row * (legendItemHeight + 5);

    // Draw color box
    ctx.fillStyle = getCategoryColor(category);
    ctx.fillRect(x, y, 14, 14);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, 14, 14);

    // Draw label
    ctx.fillStyle = '#ffffff';
    const labelText = category.length > 12 ? category.substring(0, 12) + '...' : category;
    ctx.fillText(labelText, x + 18, y + 7);
  });
}

/**
 * Setup mouse interaction for tooltips
 */
function setupMouseInteraction(canvas, ctx, months, monthlyData, allCategories, padding, chartWidth, chartHeight, barWidth, barSpacing, yAxisMax) {
  let tooltip = null;

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check if mouse is over a bar
    let hoveredData = null;
    months.forEach((monthKey, index) => {
      const barX = padding.left + barSpacing * index + (barSpacing - barWidth) / 2;
      if (mouseX >= barX && mouseX <= barX + barWidth) {
        // Find which segment is hovered
        let currentY = padding.top + chartHeight;
        const monthData = monthlyData[monthKey];

        for (const category of allCategories) {
          const value = monthData[category] || 0;
          if (value === 0) continue;

          const barHeight = (value / yAxisMax) * chartHeight;
          currentY -= barHeight;

          if (mouseY >= currentY && mouseY <= currentY + barHeight) {
            const [year, month] = monthKey.split('-');
            const monthName = MONTH_NAMES[parseInt(month) - 1];
            hoveredData = {
              month: `${monthName} ${year}`,
              category: category,
              value: value
            };
            break;
          }
        }
      }
    });

    // Show/update tooltip
    if (hoveredData) {
      if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.style.position = 'fixed';
        tooltip.style.background = 'rgba(22, 33, 62, 0.95)';
        tooltip.style.border = '1px solid #00d4ff';
        tooltip.style.borderRadius = '6px';
        tooltip.style.padding = '10px 14px';
        tooltip.style.color = '#ffffff';
        tooltip.style.fontSize = '13px';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.zIndex = '10000';
        tooltip.style.fontFamily = 'Inter, sans-serif';
        tooltip.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        document.body.appendChild(tooltip);
      }

      tooltip.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 4px;">${hoveredData.month}</div>
        <div style="color: #a0a0a0;">${hoveredData.category}</div>
        <div style="font-size: 15px; font-weight: bold; color: #ff4757; margin-top: 4px;">
          ${formatCurrency(hoveredData.value)}
        </div>
      `;

      tooltip.style.left = `${e.clientX + 15}px`;
      tooltip.style.top = `${e.clientY - 10}px`;
      canvas.style.cursor = 'pointer';
    } else {
      if (tooltip) {
        tooltip.remove();
        tooltip = null;
      }
      canvas.style.cursor = 'default';
    }
  });

  canvas.addEventListener('mouseleave', () => {
    if (tooltip) {
      tooltip.remove();
      tooltip = null;
    }
    canvas.style.cursor = 'default';
  });
}

/**
 * Format number with thousands separator
 */
function formatThousands(num) {
  if (num >= 1000) {
    return (num / 1000).toFixed(num >= 10000 ? 0 : 1) + 'k';
  }
  return num.toFixed(0);
}

/**
 * Get month range display string
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {string} Display string like "Febrero - Abril 2026"
 */
export function getMonthRangeString(startDate, endDate) {
  const startMonth = MONTH_NAMES[startDate.getMonth()];
  const endMonth = MONTH_NAMES[endDate.getMonth()];
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  if (startYear === endYear) {
    return `${startMonth} - ${endMonth} ${endYear}`;
  } else {
    return `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
  }
}
