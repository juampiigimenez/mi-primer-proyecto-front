/**
 * Category management for transactions
 */

// 26 predefined expense categories
export const CATEGORIES = [
  'Expensas', 'Supermercado', 'Pedidos', 'Restaurantes', 'Auto',
  'Boliche', 'Ocio', 'Limpieza', 'Gastos dpto.', 'Psicóloga',
  'Salud gral/Farmacia', 'Entrenamiento', 'Indumentaria', 'Kuni',
  'Tel./Intern./Luz', 'Suscripciones', 'ABL', 'Consumo personal',
  'Transporte', 'Viajes', 'Regalos', 'Cuidado personal', 'Peluquería',
  'Impuestos', 'Imprevistos', 'Reembolsos'
];

/** Default category for uncategorized transactions */
export const DEFAULT_CATEGORY = 'Sin categoría';

/**
 * Simple hash function for consistent color generation
 * @param {string} str - String to hash
 * @returns {number} Hash value
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/** Color saturation for category colors */
const CATEGORY_COLOR_SATURATION = 70;

/** Color lightness for category colors */
const CATEGORY_COLOR_LIGHTNESS = 65;

/**
 * Get consistent color for a category
 * @param {string} category - Category name
 * @returns {string} HSL color string
 */
export function getCategoryColor(categoryName) {
  if (!categoryName || categoryName === DEFAULT_CATEGORY) {
    return 'hsl(0, 0%, 70%)'; // Gray for uncategorized
  }
  const hash = simpleHash(categoryName);
  const hue = hash % 360;
  return `hsl(${hue}, ${CATEGORY_COLOR_SATURATION}%, ${CATEGORY_COLOR_LIGHTNESS}%)`;
}

/**
 * Generate HTML options for category dropdown
 * @returns {string} HTML options string
 */
export function getCategoryOptionsHTML(selectedCategory = '') {
  const options = [DEFAULT_CATEGORY, ...CATEGORIES];
  return options.map(cat => {
    const selected = cat === selectedCategory ? 'selected' : '';
    return `<option value="${cat}" ${selected}>${cat}</option>`;
  }).join('');
}
