// Server-side enforcement
if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
  throw new Error('@isleno/monday-client should only be used server-side');
}

const MONDAY_API_URL = process.env.MONDAY_API_URL || 'https://api.monday.com/v2';
const MONDAY_API_TOKEN = process.env.MONDAY_API_TOKEN;

if (!MONDAY_API_TOKEN) {
  throw new Error('MONDAY_API_TOKEN environment variable is required');
}

// Export template utilities
export * from './template';
import { generateTemplateContext, interpolateQuery, validateTemplate } from './template';

export interface MondayGraphQLResponse<T = any> {
  data: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

export interface MondayGraphQLOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface PaginationOptions {
  maxPages?: number; // Maximum number of pages to fetch (default: no limit)
  pageSize?: number; // Items per page (default: 500, max: 500)
  delayBetweenPages?: number; // Delay between page requests in ms (default: 100)
}

/**
 * Execute a GraphQL query against Monday.com API
 * @param query - GraphQL query string
 * @param variables - Variables for the query
 * @param options - Additional options for the request
 * @returns Promise with the query result
 */
export async function mondayGraphQL<T = any>(
  query: string,
  variables?: Record<string, any>,
  options: MondayGraphQLOptions = {}
): Promise<T> {
  const { timeout = 30000, retries = 3, retryDelay = 1000 } = options;

  const executeQuery = async (attempt: number = 1): Promise<T> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(MONDAY_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': MONDAY_API_TOKEN!,
          'Content-Type': 'application/json',
          'API-Version': '2024-01',
        },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json() as MondayGraphQLResponse<T>;

      if (result.errors && result.errors.length > 0) {
        const errorMessages = result.errors.map(e => e.message).join(', ');
        throw new Error(`GraphQL errors: ${errorMessages}`);
      }

      return result.data;
    } catch (error) {
      if (attempt < retries && (error instanceof Error && error.name === 'AbortError')) {
        // Retry on timeout
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        return executeQuery(attempt + 1);
      }
      throw error;
    }
  };

  return executeQuery();
}

/**
 * Execute a GraphQL query with template interpolation
 * @param template - GraphQL query template with Mustache variables
 * @param baseDate - Base date for generating date variables
 * @param variables - Additional variables for the query
 * @param options - Additional options for the request
 * @returns Promise with the query result
 */
export async function mondayGraphQLWithTemplate<T = any>(
  template: string,
  baseDate: string | Date,
  variables?: Record<string, any>,
  options: MondayGraphQLOptions = {}
): Promise<T> {
  const context = generateTemplateContext(baseDate);
  const query = interpolateQuery(template, context);
  
  // Validate that all required variables are available
  const missingVars = validateTemplate(template, context);
  if (missingVars.length > 0) {
    throw new Error(`Missing template variables: ${missingVars.join(', ')}`);
  }
  
  return mondayGraphQL<T>(query, variables, options);
}

/**
 * Execute a paginated items_page query, automatically fetching all pages
 * @param query - GraphQL query template that uses items_page
 * @param variables - Variables for the query
 * @param paginationOptions - Pagination configuration
 * @param options - Additional options for the request
 * @returns Promise with aggregated results from all pages
 */
export async function mondayGraphQLPaginated<T = any>(
  query: string,
  variables?: Record<string, any>,
  paginationOptions: PaginationOptions = {},
  options: MondayGraphQLOptions = {}
): Promise<T> {
  const { maxPages, pageSize = 500, delayBetweenPages = 100 } = paginationOptions;
  
  // Check if the query contains items_page
  if (!query.includes('items_page')) {
    throw new Error('Query must contain items_page to use pagination');
  }

  // Ensure pageSize doesn't exceed Monday's limit
  const limit = Math.min(pageSize, 500);
  
  // Add limit to variables if not already present
  const queryVariables = { ...variables, limit };
  
  let currentPage = 0;
  let cursor: string | null = null;
  let allItems: any[] = [];
  let hasMorePages = true;

  while (hasMorePages && (!maxPages || currentPage < maxPages)) {
    currentPage++;
    
    // Add cursor to variables if we have one
    const pageVariables = cursor ? { ...queryVariables, cursor } : queryVariables;
    
    try {
      const result = await mondayGraphQL<any>(query, pageVariables, options);
      
      // Find the items_page object in the result
      const itemsPage = findItemsPageInResult(result);
      
      if (!itemsPage) {
        throw new Error('No items_page found in query result. Make sure your query includes items_page with cursor and items fields.');
      }
      
      // Add items from this page
      if (itemsPage.items && Array.isArray(itemsPage.items)) {
        allItems.push(...itemsPage.items);
      }
      
      // Check if there are more pages
      cursor = itemsPage.cursor;
      hasMorePages = cursor !== null;
      
      // Add delay between requests to be respectful to the API
      if (hasMorePages && delayBetweenPages > 0) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenPages));
      }
      
    } catch (error) {
      throw new Error(`Failed to fetch page ${currentPage}: ${(error as Error).message}`);
    }
  }

  // Replace the items_page.items in the result with our aggregated items
  const finalResult = replaceItemsPageInResult(query, allItems);
  
  return finalResult as T;
}

/**
 * Execute a paginated items_page query with template interpolation
 * @param template - GraphQL query template with Mustache variables
 * @param baseDate - Base date for generating date variables
 * @param variables - Additional variables for the query
 * @param paginationOptions - Pagination configuration
 * @param options - Additional options for the request
 * @returns Promise with aggregated results from all pages
 */
export async function mondayGraphQLPaginatedWithTemplate<T = any>(
  template: string,
  baseDate: string | Date,
  variables?: Record<string, any>,
  paginationOptions: PaginationOptions = {},
  options: MondayGraphQLOptions = {}
): Promise<T> {
  const context = generateTemplateContext(baseDate);
  const query = interpolateQuery(template, context);
  
  // Validate that all required variables are available
  const missingVars = validateTemplate(template, context);
  if (missingVars.length > 0) {
    throw new Error(`Missing template variables: ${missingVars.join(', ')}`);
  }
  
  return mondayGraphQLPaginated<T>(query, variables, paginationOptions, options);
}

/**
 * Helper function to find items_page object in query result
 */
function findItemsPageInResult(result: any): { cursor: string | null; items: any[] } | null {
  // Recursively search for items_page in the result object
  function search(obj: any): any {
    if (!obj || typeof obj !== 'object') return null;
    
    if (obj.items_page && typeof obj.items_page === 'object') {
      return obj.items_page;
    }
    
    for (const key in obj) {
      if (obj[key] && typeof obj[key] === 'object') {
        const found = search(obj[key]);
        if (found) return found;
      }
    }
    
    return null;
  }
  
  return search(result);
}

/**
 * Helper function to replace items_page.items with aggregated items
 */
function replaceItemsPageInResult(query: string, aggregatedItems: any[]): any {
  // This is a simplified implementation - in practice, you might want to
  // parse the GraphQL query to understand the exact structure
  // For now, we'll return a structure that matches common patterns
  
  // If the query mentions boards, assume it's a boards query
  if (query.includes('boards')) {
    return {
      boards: [{
        items_page: {
          cursor: null,
          items: aggregatedItems
        }
      }]
    };
  }
  
  // Default fallback
  return {
    items_page: {
      cursor: null,
      items: aggregatedItems
    }
  };
}

/**
 * Get boards with items using items_page for better pagination
 * @param boardIds - Array of board IDs to fetch
 * @param paginationOptions - Pagination configuration
 * @returns Promise with boards data
 */
export async function getBoardsWithItemsPaginated(
  boardIds: number[],
  paginationOptions: PaginationOptions = {}
): Promise<any> {
  const query = `
    query ($boardIds: [Int!]!, $limit: Int!, $cursor: String) {
      boards(ids: $boardIds) {
        id
        name
        items_page(limit: $limit, cursor: $cursor) {
          cursor
          items {
            id
            name
            created_at
            updated_at
            column_values {
              id
              title
              text
              value
              type
              additional_info
            }
          }
        }
      }
    }
  `;

  return mondayGraphQLPaginated(query, { boardIds }, paginationOptions);
}

/**
 * Get items from a specific board using items_page for better pagination
 * @param boardId - Board ID to fetch items from
 * @param paginationOptions - Pagination configuration
 * @returns Promise with items data
 */
export async function getBoardItemsPaginated(
  boardId: number,
  paginationOptions: PaginationOptions = {}
): Promise<any> {
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
            created_at
            updated_at
            column_values {
              id
              title
              text
              value
              type
              additional_info
            }
          }
        }
      }
    }
  `;

  return mondayGraphQLPaginated(query, { boardId }, paginationOptions);
}

/**
 * Get a specific item with all its column values
 * @param itemId - Item ID to fetch
 * @returns Promise with item data
 */
export async function getItem(itemId: number): Promise<any> {
  const query = `
    query ($itemId: Int!) {
      items(ids: [$itemId]) {
        id
        name
        created_at
        updated_at
        column_values {
          id
          title
          text
          value
          type
          additional_info
        }
      }
    }
  `;

  return mondayGraphQL(query, { itemId });
}

/**
 * Get items created within a date range using items_page for better pagination
 * @param boardId - Board ID to search in
 * @param startDate - Start date (ISO string)
 * @param endDate - End date (ISO string)
 * @param paginationOptions - Pagination configuration
 * @returns Promise with items data
 */
export async function getItemsInDateRangePaginated(
  boardId: number,
  startDate: string,
  endDate: string,
  paginationOptions: PaginationOptions = {}
): Promise<any> {
  const query = `
    query ($boardId: Int!, $startDate: String!, $endDate: String!, $limit: Int!, $cursor: String) {
      boards(ids: [$boardId]) {
        id
        name
        items_page(limit: $limit, cursor: $cursor) {
          cursor
          items {
            id
            name
            created_at
            updated_at
            column_values {
              id
              title
              text
              value
              type
              additional_info
            }
          }
        }
      }
    }
  `;

  const result = await mondayGraphQLPaginated(query, { boardId, startDate, endDate }, paginationOptions);
  
  // Filter items by date range on the client side since Monday API doesn't support date filtering in queries
  if (result.boards?.[0]?.items_page?.items) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    result.boards[0].items_page.items = result.boards[0].items_page.items.filter((item: any) => {
      const itemDate = new Date(item.created_at);
      return itemDate >= start && itemDate <= end;
    });
  }

  return result;
}

// Backward compatibility functions
/**
 * Get boards with items and column values (legacy function)
 * @param boardIds - Array of board IDs to fetch
 * @param itemLimit - Maximum number of items per board (default: 100)
 * @returns Promise with boards data
 */
export async function getBoardsWithItems(
  boardIds: number[],
  itemLimit: number = 100
): Promise<any> {
  const query = `
    query ($boardIds: [Int!]!, $itemLimit: Int!) {
      boards(ids: $boardIds) {
        id
        name
        items(limit: $itemLimit) {
          id
          name
          created_at
          updated_at
          column_values {
            id
            title
            text
            value
            type
            additional_info
          }
        }
      }
    }
  `;

  return mondayGraphQL(query, { boardIds, itemLimit });
}

/**
 * Get items from a specific board (legacy function)
 * @param boardId - Board ID to fetch items from
 * @param itemLimit - Maximum number of items (default: 100)
 * @returns Promise with items data
 */
export async function getBoardItems(
  boardId: number,
  itemLimit: number = 100
): Promise<any> {
  const query = `
    query ($boardId: Int!, $itemLimit: Int!) {
      boards(ids: [$boardId]) {
        id
        name
        items(limit: $itemLimit) {
          id
          name
          created_at
          updated_at
          column_values {
            id
            title
            text
            value
            type
            additional_info
          }
        }
      }
    }
  `;

  return mondayGraphQL(query, { boardId, itemLimit });
}

/**
 * Get items created within a date range (legacy function)
 * @param boardId - Board ID to search in
 * @param startDate - Start date (ISO string)
 * @param endDate - End date (ISO string)
 * @returns Promise with items data
 */
export async function getItemsInDateRange(
  boardId: number,
  startDate: string,
  endDate: string
): Promise<any> {
  const query = `
    query ($boardId: Int!, $startDate: String!, $endDate: String!) {
      boards(ids: [$boardId]) {
        id
        name
        items {
          id
          name
          created_at
          updated_at
          column_values {
            id
            title
            text
            value
            type
            additional_info
          }
        }
      }
    }
  `;

  const result = await mondayGraphQL(query, { boardId, startDate, endDate });
  
  // Filter items by date range on the client side since Monday API doesn't support date filtering in queries
  if (result.boards?.[0]?.items) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    result.boards[0].items = result.boards[0].items.filter((item: any) => {
      const itemDate = new Date(item.created_at);
      return itemDate >= start && itemDate <= end;
    });
  }

  return result;
} 