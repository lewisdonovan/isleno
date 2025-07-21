# Monday Client Template Examples

## Basic Template Usage

### Example 1: Items Created in Last 7 Days

```typescript
import { mondayGraphQLWithTemplate } from '@isleno/monday-client';

const template = `
  query ($boardId: Int!) {
    boards(ids: [$boardId]) {
      id
      name
      items {
        id
        name
        created_at
        column_values {
          id
          title
          text
          value
        }
      }
    }
  }
`;

// This will interpolate {{date}} and {{date_minus_7}} into the query
const data = await mondayGraphQLWithTemplate(template, '2024-01-15', { boardId: 123456 });
```

### Example 2: Using Date Variables in Query Logic

```typescript
const template = `
  query ($boardId: Int!, $startDate: String!, $endDate: String!) {
    boards(ids: [$boardId]) {
      id
      name
      items {
        id
        name
        created_at
        column_values {
          id
          title
          text
          value
        }
      }
    }
  }
`;

// The template will be interpolated with:
// startDate: "2024-01-08" (7 days ago)
// endDate: "2024-01-15" (current date)
const data = await mondayGraphQLWithTemplate(
  template, 
  '2024-01-15', 
  { 
    boardId: 123456,
    startDate: '{{date_minus_7}}',
    endDate: '{{date}}'
  }
);
```

## Pagination Examples

### Example 3: Paginated Query with items_page

```typescript
import { mondayGraphQLPaginatedWithTemplate } from '@isleno/monday-client';

const template = `
  query ($boardId: Int!, $limit: Int!, $cursor: String) {
    boards(ids: [$boardId]) {
      id
      name
      items_page(limit: $limit, cursor: $cursor) {
        cursor
        items {
          id
          name
          created_at
          column_values {
            id
            title
            text
            value
          }
        }
      }
    }
  }
`;

// This will automatically fetch all pages and aggregate results
const data = await mondayGraphQLPaginatedWithTemplate(
  template, 
  '2024-01-15', 
  { boardId: 123456 },
  {
    pageSize: 500, // Maximum items per page
    maxPages: 10, // Limit to 10 pages
    delayBetweenPages: 100 // 100ms delay between requests
  }
);

// The result will contain all items from all pages in a single items_page.items array
console.log(`Total items fetched: ${data.boards[0].items_page.items.length}`);
```

### Example 4: KPI Snapshot with Pagination

```typescript
import { mondayGraphQLPaginatedWithTemplate } from '@isleno/monday-client';

// KPI query that counts all items in a board
const kpiQuery = `
  query ($boardId: Int!, $limit: Int!, $cursor: String) {
    boards(ids: [$boardId]) {
      id
      name
      items_page(limit: $limit, cursor: $cursor) {
        cursor
        items {
          id
          name
          created_at
          column_values {
            id
            title
            text
            value
          }
        }
      }
    }
  }
`;

// Execute the KPI snapshot with pagination
const rawData = await mondayGraphQLPaginatedWithTemplate(
  kpiQuery,
  '2024-01-15',
  { boardId: 123456 },
  {
    pageSize: 500,
    maxPages: 50, // Allow up to 50 pages
    delayBetweenPages: 100
  }
);

// Use a transform function to count all items
const totalItems = rawData.boards[0].items_page.items.length;
console.log(`Total items in board: ${totalItems}`);
```

### Example 5: Filtered Query with Pagination

```typescript
import { mondayGraphQLPaginated } from '@isleno/monday-client';

const query = `
  query ($boardId: Int!, $limit: Int!, $cursor: String) {
    boards(ids: [$boardId]) {
      id
      name
      items_page(
        limit: $limit, 
        cursor: $cursor,
        query_params: {
          operator: and,
          rules: [
            { column_id: "status", compare_value: [1], operator: any_of }
          ]
        }
      ) {
        cursor
        items {
          id
          name
          column_values {
            id
            title
            text
            value
          }
        }
      }
    }
  }
`;

// This will fetch all items with status = 1 across all pages
const data = await mondayGraphQLPaginated(
  query,
  { boardId: 123456 },
  { pageSize: 500, maxPages: 20 }
);
```

### Example 3: KPI Snapshot Configuration

In your `kpi_snapshot_configs` table, you can store templates like:

```sql
INSERT INTO kpi_snapshot_configs (
  kpi_id, 
  graphql_query, 
  transform_function, 
  notes
) VALUES (
  'uuid-here',
  'query ($boardId: Int!) { boards(ids: [$boardId]) { id name items { id name created_at column_values { id title text value } } } }',
  'countItemsInDateRange',
  'Days: 7'
);
```

The API will automatically interpolate date variables when executing the snapshot.

## Available Date Variables

| Variable | Description | Example (for 2024-01-15) |
|----------|-------------|---------------------------|
| `{{date}}` | Current date | `2024-01-15` |
| `{{date_minus_7}}` | 7 days ago | `2024-01-08` |
| `{{date_minus_30}}` | 30 days ago | `2023-12-16` |
| `{{date_minus_60}}` | 60 days ago | `2023-11-16` |
| `{{date_minus_90}}` | 90 days ago | `2023-10-17` |

## Pagination Best Practices

1. **Use appropriate page sizes**: 500 is the maximum and usually optimal
2. **Set reasonable page limits**: Use `maxPages` to prevent runaway queries
3. **Add delays**: Use `delayBetweenPages` to be respectful to the API
4. **Handle large datasets**: Consider using filters in `query_params` to reduce data volume
5. **Monitor performance**: Large paginated queries can take time to complete

## Error Handling

```typescript
try {
  const data = await mondayGraphQLPaginatedWithTemplate(
    template,
    '2024-01-15',
    { boardId: 123456 },
    { pageSize: 500, maxPages: 10 }
  );
} catch (error) {
  if (error.message.includes('No items_page found')) {
    console.error('Query must use items_page for pagination');
  } else if (error.message.includes('Failed to fetch page')) {
    console.error('Pagination failed:', error.message);
  } else {
    console.error('Monday API error:', error.message);
  }
}
``` 