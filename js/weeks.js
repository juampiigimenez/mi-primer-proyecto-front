/**
 * ISO 8601 week calculation utilities
 */

/**
 * Calculate ISO 8601 week number for a given date
 * @param {Date} date - The date to calculate week number for
 * @returns {number} Week number (1-53)
 */
export function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNo;
}

/**
 * Get year that the week belongs to (might differ from date year)
 * @param {Date} date - The date
 * @returns {number} Year number
 */
export function getWeekYear(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  return d.getUTCFullYear();
}

/**
 * Group transactions by week
 * @param {Array} transactions - Array of transaction objects with fecha field
 * @returns {Object} Transactions grouped by "year-week" key
 */
export function groupTransactionsByWeek(transactions) {
  if (!Array.isArray(transactions)) {
    return {};
  }

  const grouped = {};

  transactions.forEach(tx => {
    const date = new Date(tx.fecha);
    const year = getWeekYear(date);
    const week = getWeekNumber(date);
    const key = `${year}-${week}`;

    if (!grouped[key]) {
      grouped[key] = {
        year,
        week,
        transactions: [],
        total: 0,
        totalIngresos: 0,
        totalGastos: 0
      };
    }

    grouped[key].transactions.push(tx);

    const amount = parseFloat(tx.monto) || 0;
    if (tx.tipo === 'ingreso') {
      grouped[key].totalIngresos += amount;
    } else {
      grouped[key].totalGastos += amount;
    }
    grouped[key].total += (tx.tipo === 'ingreso' ? amount : -amount);
  });

  return grouped;
}

/**
 * Sort week keys in descending order (newest first)
 * @param {Array<string>} weekKeys - Array of "year-week" keys
 * @returns {Array<string>} Sorted keys
 */
export function sortWeekKeysDesc(weekKeys) {
  return weekKeys.sort((a, b) => {
    const [yearA, weekA] = a.split('-').map(Number);
    const [yearB, weekB] = b.split('-').map(Number);

    if (yearA !== yearB) return yearB - yearA;
    return weekB - weekA;
  });
}
