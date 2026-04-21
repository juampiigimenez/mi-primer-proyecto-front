# Test Plan: Task 12 - Stacked Bar Chart

## Manual Testing Steps

### 1. Visual Verification
**Test:** Open the application in a browser
- [ ] Chart section appears after pie chart
- [ ] Navigation controls (◀ Anterior / Siguiente ▶) are visible
- [ ] Month range display shows current 3-month period
- [ ] Canvas renders with proper dimensions
- [ ] Chart fits within card container

### 2. Chart Rendering
**Test:** Verify chart displays correctly with expense data

**Prerequisites:** Add some test expense transactions with different categories

**Expected Results:**
- [ ] Vertical bars appear for each month with data
- [ ] Bars are stacked with different colored segments
- [ ] Each segment represents a different category
- [ ] Colors match categories from getCategoryColor()
- [ ] Y-axis shows scale with grid lines
- [ ] X-axis shows month names (Ene, Feb, Mar, etc.)
- [ ] Year appears below month name
- [ ] Legend displays all categories with color boxes

### 3. Empty State
**Test:** View chart with no expense data in period

**Steps:**
1. Navigate to a period with no expenses (use ◀ to go back far enough)
2. Or test with fresh database

**Expected Results:**
- [ ] Message displays: "No hay gastos registrados en este período"
- [ ] No bars are drawn
- [ ] Navigation controls still functional

### 4. Navigation - Previous Period
**Test:** Navigate to previous 3 months

**Steps:**
1. Note current month range display
2. Click "◀ Anterior" button
3. Verify chart updates

**Expected Results:**
- [ ] Month range updates to show 3 months earlier
- [ ] Chart re-renders with new period data
- [ ] Button becomes disabled when earliest transaction reached
- [ ] Bars display data for the new period

### 5. Navigation - Next Period
**Test:** Navigate to next 3 months

**Steps:**
1. Click "◀ Anterior" to go back
2. Click "▶ Siguiente" to go forward
3. Verify chart updates

**Expected Results:**
- [ ] Month range updates to show 3 months later
- [ ] Chart re-renders with new period data
- [ ] Button becomes disabled when current period reached
- [ ] Bars display data for the new period

### 6. Navigation - Button States
**Test:** Verify button disable logic

**Steps:**
1. Navigate to earliest transaction period
2. Navigate to current period
3. Try navigating beyond limits

**Expected Results:**
- [ ] "◀ Anterior" disabled at earliest data
- [ ] "▶ Siguiente" disabled at current period
- [ ] Disabled buttons show reduced opacity
- [ ] Disabled buttons don't respond to clicks
- [ ] Cursor shows not-allowed on disabled buttons

### 7. Tooltips
**Test:** Hover interaction shows tooltips

**Steps:**
1. Hover over different bar segments
2. Move cursor across multiple segments
3. Move cursor outside chart

**Expected Results:**
- [ ] Tooltip appears near cursor on hover
- [ ] Tooltip shows month name (e.g., "Abril 2026")
- [ ] Tooltip shows category name
- [ ] Tooltip shows formatted amount
- [ ] Tooltip updates as cursor moves
- [ ] Tooltip disappears when cursor leaves
- [ ] Cursor changes to pointer over segments

### 8. Responsive Behavior
**Test:** Resize window

**Steps:**
1. Start with full-width window
2. Resize to narrower width
3. Resize to wider width
4. Test on mobile viewport size

**Expected Results:**
- [ ] Chart re-renders on window resize
- [ ] Bars adjust to container width
- [ ] Text remains legible
- [ ] Legend adjusts to available space
- [ ] No horizontal scrolling
- [ ] Navigation controls remain visible

### 9. Data Filtering
**Test:** Verify only expenses are shown

**Steps:**
1. Add transactions of different types:
   - Ingreso (income)
   - Gasto (expense)
   - Transferencia (transfer)
2. View chart

**Expected Results:**
- [ ] Only expense (gasto) transactions appear
- [ ] Income transactions excluded
- [ ] Transfer transactions excluded
- [ ] Chart title: "Gastos por Categoría"

### 10. Category Colors
**Test:** Verify color consistency

**Steps:**
1. Note colors in chart legend
2. Check colors match transaction list
3. Add new expense with existing category
4. Verify color remains consistent

**Expected Results:**
- [ ] Each category has unique color
- [ ] Colors consistent across refreshes
- [ ] Colors match getCategoryColor() output
- [ ] Legend colors match bar segment colors

### 11. Month Range Calculation
**Test:** Verify date range logic

**Current date assumed:** April 2026

**Expected Ranges:**
- Offset 0: Feb - Apr 2026
- Offset -3: Nov 2025 - Jan 2026
- Offset -6: Aug - Oct 2025
- [ ] Default shows last 3 months
- [ ] Each click shifts by exactly 3 months
- [ ] Range spans 3 complete months
- [ ] First day of start month to last day of end month

### 12. Multiple Categories
**Test:** Chart with many categories

**Steps:**
1. Add expenses in 10+ different categories
2. View chart

**Expected Results:**
- [ ] All categories stack correctly
- [ ] Bar heights represent total expense
- [ ] Segments visible and distinguishable
- [ ] Legend wraps to multiple rows if needed
- [ ] No category segments overlap

### 13. Large Values
**Test:** Chart with large expense amounts

**Steps:**
1. Add expenses with amounts > $10,000
2. View chart

**Expected Results:**
- [ ] Y-axis scales appropriately
- [ ] Values display with "k" notation (e.g., "10k")
- [ ] Bars don't overflow chart area
- [ ] Grid lines evenly spaced
- [ ] Tooltips show full amounts

### 14. Integration with Dashboard
**Test:** Chart updates with new data

**Steps:**
1. Add new expense transaction
2. View chart

**Expected Results:**
- [ ] Chart automatically updates
- [ ] New expense appears in appropriate month
- [ ] Bar height increases accordingly
- [ ] Legend updates if new category added

### 15. Browser Compatibility
**Test:** Different browsers

**Browsers to test:**
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari

**Expected Results:**
- [ ] Canvas renders correctly
- [ ] Tooltips work
- [ ] Navigation functions
- [ ] Fonts display properly
- [ ] Colors accurate

## Automated Testing (Optional)

### Unit Tests (to be implemented)
```javascript
// Test groupExpensesByMonthAndCategory
// Test getAllCategories
// Test getMaxMonthlyTotal
// Test date range calculation
// Test month range string formatting
```

### Integration Tests (to be implemented)
```javascript
// Test chart renders with mock data
// Test navigation updates chart
// Test tooltip display
// Test button enable/disable logic
```

## Performance Testing

### Metrics to Monitor
- [ ] Chart renders in < 100ms with 100 transactions
- [ ] Navigation response time < 50ms
- [ ] Tooltip appearance < 10ms
- [ ] No memory leaks on repeated navigation
- [ ] No console errors or warnings

## Regression Testing

### Existing Features to Verify
- [ ] Pie chart still works
- [ ] Transaction list still works
- [ ] Form submission still works
- [ ] Balance display still works
- [ ] Week validation still works

## Known Issues / Limitations

1. **Legend Overflow:** With 20+ categories, legend may extend beyond visible area
   - Workaround: Scroll or zoom out
   
2. **Small Segments:** Very small expense amounts may be hard to click for tooltip
   - Acceptable: Segment still visible, just requires precise hovering
   
3. **Year Transition:** Chart spanning Dec-Feb shows two different years
   - Expected behavior: Year label shows below each month

## Success Criteria

All test cases should pass with the following results:
- ✓ Chart displays correctly with expense data
- ✓ Navigation controls work as expected
- ✓ Tooltips provide accurate information
- ✓ Chart responds to window resize
- ✓ Only expenses are displayed (no income/transfers)
- ✓ Button states update correctly
- ✓ Empty state handles gracefully
- ✓ Category colors remain consistent
- ✓ Integration with dashboard seamless
- ✓ No console errors
- ✓ Cross-browser compatible

## Testing Status

**Status:** Ready for testing
**Tested by:** [To be filled]
**Date:** [To be filled]
**Result:** [PASS / FAIL / PENDING]

## Issues Found

[To be documented during testing]

| Issue | Severity | Status | Notes |
|-------|----------|--------|-------|
| | | | |

## Sign-off

- [ ] Developer: Implementation complete
- [ ] QA: Manual testing complete
- [ ] Product: Feature accepted
- [ ] Ready for deployment
