# @isleno/monday-client

Server-side Monday.com GraphQL client for the Isleno platform.

## ⚠️ Server-Side Only

This package is designed for server-side use only. It will throw an error if imported in client-side code.

## Environment Variables

Required:
- `MONDAY_API_TOKEN` - Your Monday.com API token

Optional:
- `MONDAY_API_URL` - Monday.com API URL (defaults to `https://api.monday.com/v2`)

## Installation

```bash
npm install @isleno/monday-client
```

## Usage

### Basic GraphQL Query

```typescript
import { mondayGraphQL } from '@isleno/monday-client';

const query = `
  query ($boardId: Int!) {
    boards(ids: [$boardId]) {
      id
      name
      items {
        id
        name
      }
    }
  }
`;

const data = await mondayGraphQL(query, { boardId: 123456 });
```

### Template Interpolation

The client supports Mustache template interpolation for dynamic queries with date variables:

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

// Available date variables: {{date}}, {{date_minus_7}}, {{date_minus_30}}, {{date_minus_60}}, {{date_minus_90}}
const data = await mondayGraphQLWithTemplate(template, '2024-01-15', { boardId: 123456 });
```

**Available Date Variables:**
- `{{date}}` - Current date (YYYY-MM-DD)
- `{{date_minus_7}}` - 7 days ago
- `{{date_minus_30}}` - 30 days ago
- `{{date_minus_60}}` - 60 days ago
- `{{date_minus_90}}` - 90 days ago

### Pagination with items_page

For queries that use `items_page`, the client provides automatic pagination that iterates through all pages and aggregates results:

```typescript
import { mondayGraphQLPaginated, mondayGraphQLPaginatedWithTemplate } from '@isleno/monday-client';

// Basic paginated query
const query = `
  query ($boardId: Int!, $limit: Int!, $cursor: String) {
    boards(ids: [$boardId]) {
      id
      name
      items_page(limit: $limit, cursor: $cursor) {
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

const data = await mondayGraphQLPaginated(query, { boardId: 123456 }, {
  pageSize: 500, // Items per page (max: 500)
  maxPages: 10, // Maximum pages to fetch (optional)
  delayBetweenPages: 100 // Delay between requests in ms
});

// Paginated query with template interpolation
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

const data = await mondayGraphQLPaginatedWithTemplate(
  template, 
  '2024-01-15', 
  { boardId: 123456 },
  { pageSize: 500, maxPages: 50 }
);
```

**Pagination Options:**
- `pageSize` - Number of items per page (default: 500, max: 500)
- `maxPages` - Maximum number of pages to fetch (default: no limit)
- `delayBetweenPages` - Delay between page requests in ms (default: 100)

### Pre-built Functions

#### Get Boards with Items (Paginated)

```typescript
import { getBoardsWithItemsPaginated } from '@isleno/monday-client';

const boards = await getBoardsWithItemsPaginated([123456, 789012], {
  pageSize: 500,
  maxPages: 10
});
```

#### Get Board Items (Paginated)

```typescript
import { getBoardItemsPaginated } from '@isleno/monday-client';

const items = await getBoardItemsPaginated(123456, {
  pageSize: 500,
  maxPages: 20
});
```

#### Get Items in Date Range (Paginated)

```typescript
import { getItemsInDateRangePaginated } from '@isleno/monday-client';

const items = await getItemsInDateRangePaginated(
  123456,
  '2024-01-01',
  '2024-01-31',
  { pageSize: 500, maxPages: 50 }
);
```

### Legacy Functions

For backward compatibility, the original functions are still available:

```typescript
import { getBoardsWithItems, getBoardItems, getItemsInDateRange } from '@isleno/monday-client';

// These use the old 'items' field instead of 'items_page'
const boards = await getBoardsWithItems([123456], 100);
const items = await getBoardItems(123456, 100);
const dateItems = await getItemsInDateRange(123456, '2024-01-01', '2024-01-31');
```

## Error Handling

The client includes robust error handling with retries for timeouts:

```typescript
import { mondayGraphQL } from '@isleno/monday-client';

try {
  const data = await mondayGraphQL(query, variables, {
    timeout: 30000, // 30 seconds
    retries: 3, // Retry failed requests up to 3 times
    retryDelay: 1000 // Wait 1 second between retries
  });
} catch (error) {
  console.error('Monday API error:', error.message);
}
```

## KPI Snapshot Integration

The client is designed to work seamlessly with the KPI snapshot system. When using `items_page` queries in your `kpi_snapshot_configs`, the system will automatically:

1. Detect if the query uses `items_page`
2. Use pagination to fetch all items across all pages
3. Aggregate the results before passing to transform functions

Example KPI configuration:

```sql
INSERT INTO kpi_snapshot_configs (
  kpi_id, 
  graphql_query, 
  transform_function, 
  notes
) VALUES (
  'uuid-here',
  'query ($boardId: Int!, $limit: Int!, $cursor: String) { boards(ids: [$boardId]) { id name items_page(limit: $limit, cursor: $cursor) { cursor items { id name created_at column_values { id title text value } } } } }',
  'countResults',
  'Counts all items across all pages'
);
```

## API Reference

### Core Functions

- `mondayGraphQL<T>(query, variables?, options?)` - Execute a GraphQL query
- `mondayGraphQLWithTemplate<T>(template, baseDate, variables?, options?)` - Execute a templated query
- `mondayGraphQLPaginated<T>(query, variables?, paginationOptions?, options?)` - Execute a paginated query
- `mondayGraphQLPaginatedWithTemplate<T>(template, baseDate, variables?, paginationOptions?, options?)` - Execute a paginated templated query

### Pre-built Functions

- `getBoardsWithItemsPaginated(boardIds, paginationOptions?)` - Get boards with paginated items
- `getBoardItemsPaginated(boardId, paginationOptions?)` - Get paginated items from a board
- `getItemsInDateRangePaginated(boardId, startDate, endDate, paginationOptions?)` - Get paginated items in date range
- `getItem(itemId)` - Get a specific item

### Legacy Functions

- `getBoardsWithItems(boardIds, itemLimit)` - Get boards with items (legacy)
- `getBoardItems(boardId, itemLimit)` - Get items from a board (legacy)
- `getItemsInDateRange(boardId, startDate, endDate)` - Get items in date range (legacy) 