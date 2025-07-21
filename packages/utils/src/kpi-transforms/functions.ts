import type { KpiTransformArgs, KpiTransformFn } from './types';

/**
 * Count the total number of items returned from the query
 * Use this when the GraphQL query already handles all filtering
 * Example: Count all items returned from a filtered query
 * Use Case: "Total leads from last 7 days" (when query filters by date)
 */
export async function countResults(args: KpiTransformArgs): Promise<number> {
  const { rawData } = args;
  
  if (!rawData?.boards) {
    throw new Error('No boards data found in rawData');
  }
  
  let totalCount = 0;
  
  for (const board of rawData.boards) {
    const items = getBoardItems(board);
    totalCount += items.length;
  }
  
  return totalCount;
}

/**
 * Count items with a specific status
 * Example: Count all items with status "Done"
 */
export async function countItemsWithStatus(args: KpiTransformArgs): Promise<number> {
  const { rawData, config } = args;
  
  // Extract the status from config notes or use a default
  const targetStatus = config.notes?.split(':')[1]?.trim() || 'Done';
  
  if (!rawData?.boards) {
    throw new Error('No boards data found in rawData');
  }
  
  let totalCount = 0;
  
  for (const board of rawData.boards) {
    const items = getBoardItems(board);
    if (!items) continue;
    
    for (const item of items) {
      if (item.column_values) {
        const statusColumn = item.column_values.find((col: any) => 
          col.column?.title?.toLowerCase().includes('status')
        );
        
        if (statusColumn?.text === targetStatus) {
          totalCount++;
        }
      }
    }
  }
  
  return totalCount;
}

/**
 * Sum values from a specific column
 * Example: Sum all values in "Budget" column
 */
export async function sumColumnValues(args: KpiTransformArgs): Promise<number> {
  const { rawData, config } = args;
  
  // Extract the column name from config notes
  const columnName = config.notes?.split(':')[1]?.trim() || 'Budget';
  
  if (!rawData?.boards) {
    throw new Error('No boards data found in rawData');
  }
  
  let totalSum = 0;
  
  for (const board of rawData.boards) {
    const items = getBoardItems(board);
    if (!items) continue;
    
    for (const item of items) {
      if (item.column_values) {
        const targetColumn = item.column_values.find((col: any) => 
          col.column?.title === columnName
        );
        
        if (targetColumn?.value) {
          try {
            const value = JSON.parse(targetColumn.value);
            if (typeof value === 'number') {
              totalSum += value;
            }
          } catch (e) {
            // Skip non-numeric values
          }
        }
      }
    }
  }
  
  return totalSum;
}

/**
 * Calculate percentage of items with specific status
 * Example: Percentage of items with status "In Progress"
 */
export async function calculateStatusPercentage(args: KpiTransformArgs): Promise<number> {
  const { rawData, config } = args;
  
  // Extract the target status from config notes
  const targetStatus = config.notes?.split(':')[1]?.trim() || 'In Progress';
  
  if (!rawData?.boards) {
    throw new Error('No boards data found in rawData');
  }
  
  let targetCount = 0;
  let totalCount = 0;
  
  for (const board of rawData.boards) {
    const items = getBoardItems(board);
    if (!items) continue;
    
    for (const item of items) {
      totalCount++;
      
      if (item.column_values) {
        const statusColumn = item.column_values.find((col: any) => 
          col.column?.title?.toLowerCase().includes('status')
        );
        
        if (statusColumn?.text === targetStatus) {
          targetCount++;
        }
      }
    }
  }
  
  if (totalCount === 0) return 0;
  
  return (targetCount / totalCount) * 100;
}

/**
 * Count items created within a date range
 * Example: Count items created in the last 7 days
 */
export async function countItemsInDateRange(args: KpiTransformArgs): Promise<number> {
  const { rawData, config, date } = args;
  
  // Extract days from config notes or default to 7
  const daysStr = config.notes?.split(':')[1]?.trim();
  const days = daysStr ? parseInt(daysStr) : 7;
  
  if (!rawData?.boards) {
    throw new Error('No boards data found in rawData');
  }
  
  const targetDate = new Date(date);
  const startDate = new Date(targetDate);
  startDate.setDate(startDate.getDate() - days);
  
  let count = 0;
  
  for (const board of rawData.boards) {
    const items = getBoardItems(board);
    if (!items) continue;
    
    for (const item of items) {
      if (item.created_at) {
        const itemDate = new Date(item.created_at);
        if (itemDate >= startDate && itemDate <= targetDate) {
          count++;
        }
      }
    }
  }
  
  return count;
}

/**
 * Count items with a specific tag in a tag column
 * Example: Count items tagged as "VIP" in a "Tags" column
 * Use Case: "# of Leads Tagged as VIP"
 */
export async function countItemsByTag(args: KpiTransformArgs): Promise<number> {
  const { rawData, config } = args;
  
  // Extract the tag name from config notes
  // Format: "Tag: VIP" or "Tag: VIP,Priority"
  const tagInfo = config.notes?.split(':')[1]?.trim() || 'VIP';
  const [tagName, columnName] = tagInfo.split(',').map(s => s.trim());
  
  if (!rawData?.boards) {
    throw new Error('No boards data found in rawData');
  }
  
  let totalCount = 0;
  
  for (const board of rawData.boards) {
    const items = getBoardItems(board);
    if (!items) continue;
    
    for (const item of items) {
      if (item.column_values) {
        // Find the tag column (either specified or default to "Tags")
        const tagColumn = item.column_values.find((col: any) => 
          col.column?.title === (columnName || 'Tags') || 
          col.column?.title?.toLowerCase().includes('tag')
        );
        
        if (tagColumn?.value && tagColumn.text.includes(tagName)) {
          totalCount++;
        }
      }
    }
  }
  
  return totalCount;
}

/**
 * Average the numeric values in a column
 * Example: Average values in "Price" column
 * Use Case: "Average Time on Market", "Avg Price per sqm"
 */
export async function averageColumnValue(args: KpiTransformArgs): Promise<number> {
  const { rawData, config } = args;
  
  // Extract the column name from config notes
  const columnName = config.notes?.split(':')[1]?.trim() || 'Price';
  
  if (!rawData?.boards) {
    throw new Error('No boards data found in rawData');
  }
  
  let totalSum = 0;
  let count = 0;
  
  for (const board of rawData.boards) {
    const items = getBoardItems(board);
    if (!items) continue;
    
    for (const item of items) {
      if (item.column_values) {
        const targetColumn = item.column_values.find((col: any) => 
          col.column?.title === columnName
        );
        
        if (targetColumn?.value) {
          try {
            const value = JSON.parse(targetColumn.value);
            if (typeof value === 'number' && !isNaN(value)) {
              totalSum += value;
              count++;
            }
          } catch (e) {
            // Skip non-numeric values
          }
        }
      }
    }
  }
  
  if (count === 0) return 0;
  
  return totalSum / count;
}

/**
 * Count items where linked item has a specific value
 * Used for nested logic, like the qualified_viewings example
 * Use Case: "# of Activities whose linked property has Qualified = SI"
 */
export async function countItemsWhereLinkedItemHasValue(args: KpiTransformArgs): Promise<number> {
  const { rawData, config } = args;
  
  // Extract parameters from config notes
  // Format: "LinkedColumn: Property,TargetColumn: Qualified,TargetValue: SI"
  const notes = config.notes || '';
  const params = notes.split(',').reduce((acc: any, param: string) => {
    const [key, value] = param.split(':').map(s => s.trim());
    if (key && value) {
      acc[key] = value;
    }
    return acc;
  }, {});
  
  const linkedColumnName = params.LinkedColumn || 'Property';
  const targetColumnName = params.TargetColumn || 'Qualified';
  const targetValue = params.TargetValue || 'SI';
  
  if (!rawData?.boards) {
    throw new Error('No boards data found in rawData');
  }
  
  let totalCount = 0;
  
  for (const board of rawData.boards) {
    const items = getBoardItems(board);
    if (!items) continue;
    
    for (const item of items) {
      if (item.column_values) {
        // Find the linked items column
        const linkedColumn = item.column_values.find((col: any) => 
          col.column?.title === linkedColumnName ||
          col.column?.title?.toLowerCase().includes('linked') ||
          col.column?.title?.toLowerCase().includes('property')
        );
        
        if (linkedColumn?.linked_item_ids && linkedColumn.linked_item_ids.length > 0) {
          // Check if any of the linked items have the target value
          const hasTargetValue = linkedColumn.linked_item_ids.some((linkedItemId: string) => {
            // Find the linked item in the raw data
            for (const board of rawData.boards) {
              const linkedItems = getBoardItems(board);
              if (!linkedItems) continue;
              const linkedItem = linkedItems.find((boardItem: any) => 
                boardItem.id === linkedItemId
              );
              if (linkedItem && linkedItem.column_values) {
                const targetColumn = linkedItem.column_values.find((col: any) => 
                  col.column?.title === targetColumnName
                );
                if (targetColumn?.text === targetValue) {
                  return true;
                }
              }
            }
            return false;
          });
          
          if (hasTargetValue) {
            totalCount++;
          }
        }
      }
    }
  }
  
  return totalCount;
}

/**
 * Count items where any linked item's specified column has a non-null text value
 * Use Case: Count items where a linked property has a non-null value in a specific column
 * Config notes: "LinkedColumn: <column_title>,TargetColumn: <column_id or title>"
 * Optional: "LinkedColumn: <column_title>,TargetColumn: <column_id>,TargetConditional: <column_id>"
 */
export async function countItemsWhereLinkedItemColumnNotNull(args: KpiTransformArgs): Promise<number> {
  const { rawData, config } = args;

  // Extract parameters from config notes
  // Format: "LinkedColumn: board_relation_mkqp9gz1,TargetColumn: board_relation_mksd5fya,TargetConditional: color_mksmx33k"
  const notes = config.notes || '';
  const params = notes.split(',').reduce((acc: any, param: string) => {
    const [key, value] = param.split(':').map(s => s.trim());
    if (key && value) {
      acc[key] = value;
    }
    return acc;
  }, {});

  const linkedColumnKey = params.LinkedColumn;
  const targetColumnKey = params.TargetColumn;
  const targetConditionalKey = params?.TargetConditional ?? null;

  if (!linkedColumnKey || !targetColumnKey) {
    throw new Error('Both LinkedColumn and TargetColumn must be specified in config notes');
  }

  if (!rawData?.boards) {
    throw new Error('No boards data found in rawData');
  }

  let totalCount = 0;

  for (const board of rawData.boards) {
    const items = getBoardItems(board);
    if (!items) continue;

    for (const item of items) {
      if (!item.column_values) continue;
      // Find the linked items column (by id or title)
      // Handle both cases: column with id field, or column with linked_items directly
      const linkedColumn = item.column_values.find((col: any) =>
        col.id === linkedColumnKey || 
        col.column?.title === linkedColumnKey ||
        (col.linked_items && col.linked_item_ids) // If it has linked_items, it's a board relation column
      );
      if (!linkedColumn?.linked_items || !Array.isArray(linkedColumn.linked_items)) continue;

      // Check if any linked item meets both conditions:
      // 1. Target column has non-null text
      // 2. If TargetConditional is specified, that column is truthy
      const hasValidLinkedItem = linkedColumn.linked_items.some((linkedItem: any) => {
        if (!linkedItem.column_values) return false;
        
        // Check target column is not null
        const targetCol = linkedItem.column_values.find((col: any) =>
          col.id === targetColumnKey || col.column?.title === targetColumnKey
        );
        if (!targetCol || targetCol.value == null) return false;
        
        // If conditional is specified, check it's truthy
        if (targetConditionalKey) {
          const conditionalCol = linkedItem.column_values.find((col: any) =>
            col.id === targetConditionalKey || col.column?.title === targetConditionalKey
          );
          if (!conditionalCol) return false;
          return textStatusToBoolean(conditionalCol.text);
        }
        
        // If no conditional, just check target is not null (already done above)
        return true;
      });
      
      if (hasValidLinkedItem) totalCount++;
    }
  }

  return totalCount;
}

/**
 * Count items where any linked item's specified column resolves to true
 * Use Case: Count items where a linked property has a truthy value in a specific column
 * Config notes: "LinkedColumn: <column_id>,TargetColumn: <column_id>"
 * Example: "LinkedColumn: board_relation_mkqp9gz1,TargetColumn: color_mksmx33k"
 */
export async function countItemsWhereLinkedItemColumnTruthy(args: KpiTransformArgs): Promise<number> {
  const { rawData, config } = args;

  // Extract parameters from config notes
  // Format: "LinkedColumn: board_relation_mkqp9gz1,TargetColumn: color_mksmx33k"
  const notes = config.notes || '';
  const params = notes.split(',').reduce((acc: any, param: string) => {
    const [key, value] = param.split(':').map(s => s.trim());
    if (key && value) {
      acc[key] = value;
    }
    return acc;
  }, {});

  const linkedColumnKey = params.LinkedColumn;
  const targetColumnKey = params.TargetColumn;

  if (!linkedColumnKey || !targetColumnKey) {
    throw new Error('Both LinkedColumn and TargetColumn must be specified in config notes');
  }

  if (!rawData?.boards) {
    throw new Error('No boards data found in rawData');
  }

  let totalCount = 0;

  for (const board of rawData.boards) {
    const items = getBoardItems(board);
    if (!items) continue;

    for (const item of items) {
      if (!item.column_values) continue;
      
      // Find the linked items column (by id or title)
      // Handle both cases: column with id field, or column with linked_items directly
      const linkedColumn = item.column_values.find((col: any) =>
        col.id === linkedColumnKey || 
        col.column?.title === linkedColumnKey ||
        (col.linked_items && col.linked_item_ids) // If it has linked_items, it's a board relation column
      );
      
      if (!linkedColumn?.linked_items || !Array.isArray(linkedColumn.linked_items)) continue;

      // Check if any linked item has the target column with a truthy value
      const hasTruthyLinkedItem = linkedColumn.linked_items.some((linkedItem: any) => {
        if (!linkedItem.column_values) return false;
        
        const targetCol = linkedItem.column_values.find((col: any) =>
          col.id === targetColumnKey || col.column?.title === targetColumnKey
        );
        
        if (!targetCol) return false;
        
        // Check if the value is truthy using textStatusToBoolean
        return textStatusToBoolean(targetCol.text);
      });
      
      if (hasTruthyLinkedItem) totalCount++;
    }
  }

  return totalCount;
}

/**
 * Count items where any linked item has a non-empty linked_item_ids array
 * Use Case: Count items where a linked property has linked items
 * Config notes: "LinkedColumn: <column_id>,TargetColumn: <column_id>"
 * Example: "LinkedColumn: board_relation_mkqp9gz1,TargetColumn: board_relation_mksd5fya"
 */
export async function countItemsWhereLinkedItemHasLinkedItems(args: KpiTransformArgs): Promise<number> {
  const { rawData, config } = args;

  // Extract parameters from config notes
  // Format: "LinkedColumn: board_relation_mkqp9gz1,TargetColumn: board_relation_mksd5fya"
  const notes = config.notes || '';
  const params = notes.split(',').reduce((acc: any, param: string) => {
    const [key, value] = param.split(':').map(s => s.trim());
    if (key && value) {
      acc[key] = value;
    }
    return acc;
  }, {});

  const linkedColumnKey = params.LinkedColumn;
  const targetColumnKey = params.TargetColumn;

  if (!linkedColumnKey || !targetColumnKey) {
    throw new Error('Both LinkedColumn and TargetColumn must be specified in config notes');
  }

  if (!rawData?.boards) {
    throw new Error('No boards data found in rawData');
  }

  let totalCount = 0;

  for (const board of rawData.boards) {
    const items = getBoardItems(board);
    if (!items) continue;

    for (const item of items) {
      if (!item.column_values) continue;
      
      // Find the linked items column (by id or title)
      // Handle both cases: column with id field, or column with linked_items directly
      const linkedColumn = item.column_values.find((col: any) =>
        col.id === linkedColumnKey || 
        col.column?.title === linkedColumnKey ||
        (col.linked_items && col.linked_item_ids) // If it has linked_items, it's a board relation column
      );
      
      if (!linkedColumn?.linked_items || !Array.isArray(linkedColumn.linked_items)) continue;

      // Check if any linked item has the target column with a non-empty linked_item_ids array
      const hasLinkedItems = linkedColumn.linked_items.some((linkedItem: any) => {
        if (!linkedItem.column_values) return false;
        
        const targetCol = linkedItem.column_values.find((col: any) =>
          col.id === targetColumnKey || col.column?.title === targetColumnKey
        );
        
        if (!targetCol) return false;
        
        // Check if linked_item_ids array exists and is not empty
        return targetCol.linked_item_ids && 
               Array.isArray(targetCol.linked_item_ids) && 
               targetCol.linked_item_ids.length > 0;
      });
      
      if (hasLinkedItems) totalCount++;
    }
  }

  return totalCount;
}

/**
 * Count items where any nested linked item has a non-empty linked_item_ids array
 * Use Case: Count items where a linked property has linked items (nested structure)
 * Config notes: "LinkedColumn: <column_id>,TargetColumn: <column_id>"
 * Example: "LinkedColumn: board_relation_mkqp9gz1,TargetColumn: board_relation_mksd5fya"
 * 
 * This function handles nested structures where linked items themselves have linked_item_ids
 */
export async function countItemsWhereNestedLinkedItemHasLinkedItems(args: KpiTransformArgs): Promise<number> {
  const { rawData, config } = args;

  // Extract parameters from config notes
  // Format: "LinkedColumn: board_relation_mkqp9gz1,TargetColumn: board_relation_mksd5fya"
  const notes = config.notes || '';
  const params = notes.split(',').reduce((acc: any, param: string) => {
    const [key, value] = param.split(':').map(s => s.trim());
    if (key && value) {
      acc[key] = value;
    }
    return acc;
  }, {});

  const linkedColumnKey = params.LinkedColumn;
  const targetColumnKey = params.TargetColumn;

  if (!linkedColumnKey || !targetColumnKey) {
    throw new Error('Both LinkedColumn and TargetColumn must be specified in config notes');
  }

  if (!rawData?.boards) {
    throw new Error('No boards data found in rawData');
  }

  let totalCount = 0;

  for (const board of rawData.boards) {
    const items = getBoardItems(board);
    if (!items) continue;

    for (const item of items) {
      if (!item.column_values) continue;
      
      // Find the linked items column (by id or title)
      // Handle both cases: column with id field, or column with linked_items directly
      const linkedColumn = item.column_values.find((col: any) =>
        col.id === linkedColumnKey || 
        col.column?.title === linkedColumnKey ||
        (col.linked_items && col.linked_item_ids) // If it has linked_items, it's a board relation column
      );
      
      // If we didn't find by id/title, try to find any column with linked_items
      // Note: linked_item_ids might be on the nested items, not the main column
      const fallbackLinkedColumn = !linkedColumn ? 
        item.column_values.find((col: any) => col.linked_items) : null;
      
      const finalLinkedColumn = linkedColumn || fallbackLinkedColumn;
      
      if (!finalLinkedColumn?.linked_items || !Array.isArray(finalLinkedColumn.linked_items)) continue;

      // Check if any linked item has the target column with a non-empty linked_item_ids array
      const hasNestedLinkedItems = finalLinkedColumn.linked_items.some((linkedItem: any) => {
        if (!linkedItem.column_values) return false;
        
        // Find the target column on the linked item
        const targetCol = linkedItem.column_values.find((col: any) =>
          col.id === targetColumnKey || col.column?.title === targetColumnKey
        );
        
        // If we didn't find by id/title, try to find any column with linked_item_ids
        const fallbackTargetCol = !targetCol ? 
          linkedItem.column_values.find((col: any) => col.linked_item_ids) : null;
        
        const finalTargetCol = targetCol || fallbackTargetCol;
        
        if (!finalTargetCol) return false;
        
        // Check if linked_item_ids array exists and is not empty
        const hasLinkedItems = finalTargetCol.linked_item_ids && 
               Array.isArray(finalTargetCol.linked_item_ids) && 
               finalTargetCol.linked_item_ids.length > 0;
        
        return hasLinkedItems;
      });
      
      if (hasNestedLinkedItems) {
        totalCount++;
      }
    }
  }

  return totalCount;
}

function getBoardItems(board: any): any[] {
  return board.items_page?.items || board.items || [];
}

function textStatusToBoolean(value: string): boolean {
  const val = value.toLowerCase();
  return ['yes', 'si', 'sí', 'true', '1', 'on', 'active', 'enabled', 'complete', 'completed', 'completada', 'completado'].includes(val);
}
