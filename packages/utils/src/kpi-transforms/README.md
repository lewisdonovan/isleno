# KPI Transforms

## Overview

The `kpi-transforms` module provides a registry of reusable data transformation functions for KPI (Key Performance Indicator) snapshotting and reporting. These functions are designed to process raw data (typically from Monday.com GraphQL queries) and extract, aggregate, or compute meaningful KPI values. The system is extensible: new transform functions can be added and registered for use in the KPI snapshot configuration system.

### Core Concepts
- **Transform Function:** An async function that takes raw data (and config) and returns a numeric KPI value.
- **Registry:** All available transform functions are registered in `registry.ts` and can be referenced by name in configuration.
- **Config Notes:** Many transforms use the `notes` field from the config to parameterize their behavior (e.g., which column to sum, which status to count).
- **Intended Use:** These transforms are used by the backend to process data fetched from Monday.com and store computed KPI snapshots in the database.

## How It Works
1. **Data Fetch:** Raw data is fetched from Monday.com using a GraphQL query.
2. **Transform Selection:** The config for a KPI specifies which transform function to use (by name).
3. **Execution:** The transform function is called with `{ rawData, config, date }` and returns a numeric value.
4. **Result Storage:** The result is stored as a KPI snapshot.

## Adding a New Transform
- Implement your function in `functions.ts` (it must match the `KpiTransformFn` signature).
- Add it to the `transformRegistry` in `registry.ts`.
- (Optional) Document it in this README.

---

## Transform Functions

### countResults
**Counts the total number of items returned from the query.**
- Use when the GraphQL query already filters the data as needed.
- Example: "Total leads from last 7 days" (when query filters by date).

### countItemsWithStatus
**Counts items with a specific status.**
- Status is taken from `config.notes` (e.g., `Status: Done`), defaults to "Done".
- Example: Count all items with status "Done".

### sumColumnValues
**Sums values from a specific column.**
- Column name from `config.notes` (e.g., `Column: Budget`), defaults to "Budget".
- Example: Sum all values in "Budget" column.

### calculateStatusPercentage
**Calculates the percentage of items with a specific status.**
- Status from `config.notes` (e.g., `Status: In Progress`), defaults to "In Progress".
- Returns a percentage (0-100).

### countItemsInDateRange
**Counts items created within a date range.**
- Days from `config.notes` (e.g., `Days: 7`), defaults to 7.
- Uses the `created_at` field of items.

### countItemsByTag
**Counts items with a specific tag in a tag column.**
- Tag and column from `config.notes` (e.g., `Tag: VIP,Tags`). Defaults to tag "VIP" and column "Tags".
- Example: "# of Leads Tagged as VIP".

### averageColumnValue
**Averages the numeric values in a column.**
- Column name from `config.notes` (e.g., `Column: Price`), defaults to "Price".
- Example: "Average Time on Market".

### countItemsWhereLinkedItemHasValue
**Counts items where a linked item has a specific value in a column.**
- Parameters from `config.notes` (e.g., `LinkedColumn: Property,TargetColumn: Qualified,TargetValue: SI`).
- Example: "# of Activities whose linked property has Qualified = SI".

### countItemsWhereLinkedItemColumnNotNull
**Counts items where any linked item's specified column has a non-null value.**
- Parameters from `config.notes` (e.g., `LinkedColumn: <column_title>,TargetColumn: <column_id or title>`).
- Optional: `TargetConditional` for additional filtering.

### countItemsWhereLinkedItemColumnTruthy
**Counts items where any linked item's specified column resolves to true.**
- Parameters from `config.notes` (e.g., `LinkedColumn: <column_id>,TargetColumn: <column_id>`).
- Truthy values include "yes", "true", "1", etc.

### countItemsWhereLinkedItemHasLinkedItems
**Counts items where any linked item has a non-empty linked_item_ids array in a target column.**
- Parameters from `config.notes` (e.g., `LinkedColumn: <column_id>,TargetColumn: <column_id>`).

### countItemsWhereNestedLinkedItemHasLinkedItems
**Counts items where any nested linked item has a non-empty linked_item_ids array.**
- Parameters from `config.notes` (e.g., `LinkedColumn: <column_id>,TargetColumn: <column_id>`).
- Handles nested structures where linked items themselves have linked_item_ids.

---

## Usage Example

In your KPI snapshot config, set the `transform_function` field to one of the function names above, and use the `notes` field to pass parameters as described.

---

For more details, see the code and comments in `functions.ts` and `registry.ts`. 