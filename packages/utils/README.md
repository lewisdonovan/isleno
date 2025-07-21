# @isleno/utils

Shared utilities for the Isleno platform, including KPI transform functions.

## KPI Transform System

The KPI transform system provides a modular way to process Monday.com data into KPI values.

### Architecture

1. **Configuration**: `kpi_snapshot_configs` table defines what data to pull and how to process it
2. **Data Extraction**: GraphQL queries pull raw data from Monday.com boards  
3. **Data Transformation**: Named functions process the raw data into KPI values
4. **Execution**: API endpoints orchestrate the entire process

### Transform Function Signature

```typescript
type KpiTransformArgs = {
  rawData: any; // Monday GraphQL result
  config: KpiSnapshotConfig; // Row from Supabase
  date: string; // ISO date string for the snapshot
};

type KpiTransformFn = (args: KpiTransformArgs) => Promise<number>;
```

### Available Transform Functions

#### Basic Functions
- `countItemsWithStatus` - Count items with specific status
- `sumColumnValues` - Sum values from a specific column
- `calculateStatusPercentage` - Calculate percentage of items with status
- `countItemsInDateRange` - Count items created in date range

#### Advanced Functions
- `countItemsByTag` - Count items with a specific tag in a tag column
  - **Use Case**: "# of Leads Tagged as VIP"
  - **Config**: `"Tag: VIP"` or `"Tag: VIP,Priority"`

- `averageColumnValue` - Average the numeric values in a column
  - **Use Case**: "Average Time on Market", "Avg Price per sqm"
  - **Config**: `"Column: Price"`

- `countItemsWhereLinkedItemHasValue` - Count items where linked item has a specific value
  - **Use Case**: "# of Activities whose linked property has Qualified = SI"
  - **Config**: `"LinkedColumn: Property,TargetColumn: Qualified,TargetValue: SI"`

### Configuration Examples

```sql
-- Count VIP leads
INSERT INTO kpi_snapshot_configs (kpi_id, transform_function, notes)
VALUES ('uuid', 'countItemsByTag', 'Tag: VIP');

-- Average property prices
INSERT INTO kpi_snapshot_configs (kpi_id, transform_function, notes)
VALUES ('uuid', 'averageColumnValue', 'Column: Price');

-- Count qualified viewings
INSERT INTO kpi_snapshot_configs (kpi_id, transform_function, notes)
VALUES ('uuid', 'countItemsWhereLinkedItemHasValue', 'LinkedColumn: Property,TargetColumn: Qualified,TargetValue: SI');
```

### API Usage

Execute a KPI snapshot:

```bash
POST /api/kpis/snapshots/execute
{
  "kpi_id": "uuid",
  "date": "2025-07-16"
}
``` 