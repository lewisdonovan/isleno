import type { TransformRegistry } from './types';
import {
  countItemsWithStatus,
  sumColumnValues,
  calculateStatusPercentage,
  countItemsInDateRange,
  countItemsByTag,
  averageColumnValue,
  countItemsWhereLinkedItemHasValue,
  countResults,
  countItemsWhereLinkedItemColumnNotNull,
  countItemsWhereLinkedItemColumnTruthy,
  countItemsWhereLinkedItemHasLinkedItems,
  countItemsWhereNestedLinkedItemHasLinkedItems,
} from './functions';

/**
 * Registry of all available KPI transform functions
 * Add new functions here to make them available for use in kpi_snapshot_configs
 */
export const transformRegistry: TransformRegistry = {
  countItemsWithStatus,
  sumColumnValues,
  calculateStatusPercentage,
  countItemsInDateRange,
  countItemsByTag,
  averageColumnValue,
  countItemsWhereLinkedItemHasValue,
  countResults,
  countItemsWhereLinkedItemColumnNotNull,
  countItemsWhereLinkedItemColumnTruthy,
  countItemsWhereLinkedItemHasLinkedItems,
  countItemsWhereNestedLinkedItemHasLinkedItems,
};

/**
 * Get a transform function by name
 * @param functionName - The name of the transform function
 * @returns The transform function or undefined if not found
 */
export function getTransformFunction(functionName: string) {
  return transformRegistry[functionName];
}

/**
 * Check if a transform function exists
 * @param functionName - The name of the transform function
 * @returns True if the function exists, false otherwise
 */
export function hasTransformFunction(functionName: string): boolean {
  return functionName in transformRegistry;
}

/**
 * Get all available transform function names
 * @returns Array of available function names
 */
export function getAvailableTransformFunctions(): string[] {
  return Object.keys(transformRegistry);
} 