# Budget Integration MVP - Test Plan

## Overview
This document outlines the testing approach for the Budget Integration MVP feature that shows budget impact in invoice approval flow.

## Features Implemented

### 1. Budget Types and Interfaces ✅
- **File**: `/packages/types/src/odoo.ts`
- **Added**: `OdooBudget`, `BudgetImpact`, `SessionBudgetState` interfaces
- **Purpose**: Type definitions for budget data and session management

### 2. Budget Services ✅
- **File**: `/apps/kpis/src/lib/odoo/services.ts`
- **Added**: 
  - `getBudgetForAnalyticAccount()` - Fetch budget from Odoo
  - `calculateBudgetImpact()` - Calculate before/after impact
  - `getBudgetsForAnalyticAccounts()` - Bulk budget fetching
- **Purpose**: Core business logic for budget calculations

### 3. API Endpoints ✅
- **Files**: 
  - `/apps/kpis/src/app/api/budgets/[analyticAccountId]/route.ts`
  - `/apps/kpis/src/app/api/budgets/impact/route.ts`
- **Purpose**: REST endpoints for budget data access

### 4. Session Management ✅
- **Files**:
  - `/apps/kpis/src/lib/services/budgetSessionService.ts`
  - `/apps/kpis/src/contexts/BudgetContext.tsx`
- **Purpose**: Track approved invoices and running totals without database storage

### 5. Budget Impact Component ✅
- **File**: `/apps/kpis/src/components/BudgetImpactCard.tsx`
- **Purpose**: Visual component showing before/after budget impact

### 6. Integration with Invoice Detail Page ✅
- **File**: `/apps/kpis/src/app/invoices/[invoice_id]/page.tsx`
- **Changes**:
  - Added BudgetImpactCard component
  - Integrated session tracking in approval flow
  - Updated button states for session-approved invoices

### 7. Layout Integration ✅
- **File**: `/apps/kpis/src/app/layout.tsx`
- **Changes**: Added BudgetProvider to app context

## Test Scenarios

### Scenario 1: Budget Display
**Given**: User views invoice detail page with department/project selected
**When**: Invoice amount and analytic account are available
**Then**: Budget impact card should display:
- Current budget status (spent/remaining)
- Projected budget status after approval
- Visual indicators (progress bars, warnings)
- Before/after comparison

### Scenario 2: Budget Exceeded Warning
**Given**: Invoice approval would exceed budget
**When**: Budget impact is calculated
**Then**: Warning should appear indicating budget will be exceeded

### Scenario 3: Session Tracking
**Given**: User approves multiple invoices in same session
**When**: Viewing subsequent invoice details
**Then**: Running total should reflect previously approved invoices in session

### Scenario 4: API Integration
**Given**: Valid analytic account ID
**When**: Budget API endpoints are called
**Then**: Should return budget data from Odoo crossovered.budget.lines model

### Scenario 5: Permission Handling
**Given**: User without budget view permissions
**When**: Attempting to access budget endpoints
**Then**: Should return 403 Forbidden

## Manual Testing Steps

### 1. Basic Budget Display
1. Navigate to invoice detail page
2. Select a department (and project if construction)
3. Verify budget impact card appears
4. Check data accuracy against Odoo

### 2. Session Persistence
1. Approve an invoice
2. Navigate to another invoice for same department
3. Verify running total includes previous approval
4. Refresh browser - session should persist
5. Open new browser tab - new session should start

### 3. Budget Warnings
1. Find invoice that would exceed budget
2. Verify warning appears in budget impact card
3. Check percentage calculations are accurate

### 4. Error Handling
1. Try with analytic account that has no budget
2. Verify graceful error handling
3. Check with invalid analytic account IDs

## Known Limitations (MVP)

1. **No Database Storage**: Session data only persists in browser session
2. **Single Invoice View**: Only integrated in invoice detail page
3. **Basic Error Handling**: Minimal error recovery mechanisms
4. **No Bulk Operations**: Each invoice calculated individually
5. **Limited Budget Models**: Only supports crossovered.budget.lines model

## Success Criteria

✅ **Core Functionality**
- Budget data is fetched from Odoo
- Before/after impact is calculated correctly
- Session tracking works without database

✅ **User Experience**
- Clear visual representation of budget impact
- Warnings for budget overruns
- Intuitive before/after comparison

✅ **Technical Implementation**
- No database schema changes
- Proper TypeScript types
- Clean API design
- Session management without persistence

## Next Steps (Post-MVP)

1. **Enhanced Error Handling**: Better error messages and recovery
2. **Bulk Budget Loading**: Optimize for multiple invoices
3. **Database Integration**: Optional persistence for audit trails
4. **Additional Views**: Integrate in other parts of the app
5. **Advanced Calculations**: Support for complex budget scenarios
6. **Real-time Updates**: WebSocket integration for live budget updates

## Conclusion

The Budget Integration MVP successfully provides users with contextual budget information during invoice approval, enabling informed decision-making without requiring database changes or complex infrastructure modifications.
