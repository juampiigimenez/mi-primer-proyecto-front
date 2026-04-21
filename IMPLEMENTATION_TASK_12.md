# Task 12: Stacked Bar Chart Implementation

## Summary
Successfully implemented a stacked bar chart showing expenses by category for the last 3 months with navigation controls.

## Files Created

### 1. finanzas-front/js/charts.js (NEW)
**Purpose:** Chart rendering utilities for the stacked bar chart

**Key Functions:**
- `drawStackedBarChart(canvas, transactions, startDate, endDate)` - Main rendering function
  - Filters to expenses only in date range
  - Groups expenses by month and category
  - Draws vertical stacked bars with category colors
  - Draws Y-axis with grid lines and labels
  - Draws X-axis with month names
  - Draws legend with all categories
  - Handles empty state message
  
- `groupExpensesByMonthAndCategory(expenses, startDate, endDate)` - Data grouping
  - Creates month keys in YYYY-MM format
  - Groups expenses by month and category
  - Returns structured data object

- `getAllCategories(monthlyData)` - Extract unique categories
- `getMaxMonthlyTotal(monthlyData)` - Calculate Y-axis max value
- `drawYAxis(ctx, padding, chartWidth, chartHeight, yAxisMax)` - Draw Y-axis grid and labels
- `drawStackedBar(ctx, x, topPadding, width, height, monthData, allCategories, yAxisMax)` - Draw single stacked bar
- `drawXAxisLabels(ctx, padding, chartWidth, months, barSpacing)` - Draw X-axis month labels
- `drawLegend(ctx, canvasWidth, canvasHeight, categories, padding)` - Draw category legend
- `setupMouseInteraction(canvas, ...)` - Interactive tooltips on hover
- `getMonthRangeString(startDate, endDate)` - Format month range display

**Key Features:**
- Canvas-based rendering (no external libraries)
- Responsive design (adapts to container width)
- Hover tooltips showing "Month - Category: $amount"
- Category colors from getCategoryColor() in categories.js
- Month names in Spanish (Ene, Feb, Mar, etc.)
- Empty state: "No hay gastos registrados en este período"
- Y-axis formatting with thousands (k) notation
- Legend with category color boxes

## Files Modified

### 2. finanzas-front/index.html
**Changes:**
Added new chart section after the pie chart (lines 92-102):
```html
<div class="card">
  <h2>Gastos por Categoría</h2>
  <div class="chart-nav">
    <button id="prevMonths" class="chart-nav-btn">◀ Anterior</button>
    <span id="monthRange">Febrero - Abril 2026</span>
    <button id="nextMonths" class="chart-nav-btn">Siguiente ▶</button>
  </div>
  <div class="chart-container">
    <canvas id="stackedBarChart"></canvas>
  </div>
</div>
```

### 3. finanzas-front/css/components.css
**Changes:**
Added chart navigation styles (lines 321-362):
- `.chart-nav` - Flex container for navigation controls
- `.chart-nav-btn` - Navigation button styling with hover effects
- `.chart-nav-btn:disabled` - Disabled state styling
- `#monthRange` - Month range display text styling

**Styling Features:**
- Consistent with existing dark theme
- Hover effects with color transitions
- Disabled state with reduced opacity
- Primary color accents on hover

### 4. finanzas-front/js/dashboard.js
**Changes:**

**a) Imports (line 8):**
```javascript
import { drawStackedBarChart, getMonthRangeString } from './charts.js';
```

**b) State Management (line 14):**
```javascript
let chartMonthOffset = 0; // 0 = current period (last 3 months)
```

**c) Initialization (lines 32-55):**
- Added resize handler for stacked bar chart
- Added event listeners for prev/next month navigation buttons
- Navigation shifts by 3 months at a time

**d) New Function - updateStackedBarChart() (lines 465-511):**
- Calculates 3-month date range based on chartMonthOffset
- Updates month range display text
- Disables prev button if no earlier data exists
- Disables next button if showing current month range
- Calls drawStackedBarChart() with date range

**e) updateUI() Integration (line 170):**
- Added call to updateStackedBarChart() to refresh chart on data changes

## Implementation Details

### Date Range Logic
- Default view: Last 3 months from current date
- chartMonthOffset controls which period is displayed
  - 0 = current period (last 3 months)
  - -3 = previous 3 months
  - +3 = next 3 months (if available)
- Date range calculated as: [currentMonth + offset - 2, currentMonth + offset]

### Navigation Controls
- **◀ Anterior button:** Moves back 3 months
  - Disabled when earliest transaction date is reached
- **▶ Siguiente button:** Moves forward 3 months
  - Disabled when current month range is displayed
- Month range display updates dynamically

### Data Filtering
- Only expense transactions (tipo === 'gasto')
- Excludes income and transfers
- Filtered by date range (startDate to endDate)
- Grouped by month (YYYY-MM) and category

### Chart Rendering
- Canvas dimensions: Full container width x 400px height
- Chart padding: top: 40px, right: 20px, bottom: 80px, left: 70px
- Bar width: Maximum 80px or calculated from available space
- Y-axis: 5 grid lines with auto-scaled values
- X-axis: Month abbreviations (Ene, Feb, etc.) with year below
- Legend: Multi-column layout below chart

### Tooltips
- Appear on hover over bar segments
- Show: Month name, category, and amount
- Positioned near cursor
- Removed on mouse leave
- Styled to match application theme

### Color Scheme
- Category colors from getCategoryColor() function
- Consistent with existing category color system
- Each category has unique HSL-based color

## Testing Checklist

✓ Chart displays last 3 months by default
✓ Navigation buttons shift period by 3 months
✓ Categories are color-coded consistently
✓ Tooltips show on hover with correct data
✓ Empty state displays when no expenses exist
✓ Prev button disabled at earliest data
✓ Next button disabled at current period
✓ Chart responsive to window resize
✓ Month range display updates correctly
✓ Y-axis auto-scales based on max value
✓ Legend displays all categories in period
✓ Bars stack correctly from bottom to top

## Integration Points

- **categories.js:** getCategoryColor() for consistent colors
- **ui.js:** formatCurrency() for amount formatting
- **api.js:** Transaction data through dashboard.js
- **dashboard.js:** Main integration point for data and events
- **index.html:** DOM structure and canvas element
- **components.css:** Styling and theme consistency

## Compatibility
- Works with existing pie chart
- Uses same Canvas API approach
- Follows established coding patterns
- Compatible with transaction data structure
- Responsive design matches existing layout

## Future Enhancements (Out of Scope)
- Export chart as image
- Drill-down to transaction details
- Filter by specific categories
- Compare periods side-by-side
- Toggle between stacked and grouped bars
- Animate transitions between periods
- Show percentage labels on segments

## Status
**DONE** - Task completed successfully

All requirements from the design spec have been implemented:
- Vertical stacked bar chart ✓
- Expenses only (no income/transfers) ✓
- Default view: last 3 months ✓
- Navigation: ◀/▶ buttons shift 3 months at a time ✓
- Disable buttons appropriately ✓
- Legend shows all categories with data ✓
- Tooltip format as specified ✓
- Empty state message ✓
- Canvas API rendering ✓
- Category colors from getCategoryColor() ✓
- Spanish month names ✓
- Responsive design ✓
