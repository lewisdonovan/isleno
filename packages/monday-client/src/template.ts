import Mustache from 'mustache';

export interface TemplateContext {
  date: string; // YYYY-MM-DD format
  date_minus_1: string; // 1 day ago in YYYY-MM-DD format
  date_minus_7: string; // 7 days ago in YYYY-MM-DD format
  date_minus_30: string; // 30 days ago in YYYY-MM-DD format
  date_minus_60: string; // 60 days ago in YYYY-MM-DD format
  date_minus_90: string; // 90 days ago in YYYY-MM-DD format
  [key: string]: string; // Allow for additional custom variables
}

/**
 * Generate template context from a base date
 * @param baseDate - Base date string in YYYY-MM-DD format or Date object
 * @returns Template context with various date variables
 */
export function generateTemplateContext(baseDate: string | Date): TemplateContext {
  const date = typeof baseDate === 'string' ? new Date(baseDate) : baseDate;
  
  // Ensure we're working with a valid date
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date provided to generateTemplateContext');
  }

  const formatDate = (d: Date): string => {
    return d.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  const date_minus_1 = new Date(date);
  date_minus_1.setDate(date_minus_1.getDate() - 1);

  const date_minus_7 = new Date(date);
  date_minus_7.setDate(date_minus_7.getDate() - 7);

  const date_minus_30 = new Date(date);
  date_minus_30.setDate(date_minus_30.getDate() - 30);

  const date_minus_60 = new Date(date);
  date_minus_60.setDate(date_minus_60.getDate() - 60);

  const date_minus_90 = new Date(date);
  date_minus_90.setDate(date_minus_90.getDate() - 90);

  return {
    date: formatDate(date),
    date_minus_1: formatDate(date_minus_1),
    date_minus_7: formatDate(date_minus_7),
    date_minus_30: formatDate(date_minus_30),
    date_minus_60: formatDate(date_minus_60),
    date_minus_90: formatDate(date_minus_90),
  };
}

/**
 * Interpolate variables into a GraphQL query template
 * @param template - GraphQL query template with Mustache variables
 * @param context - Template context with date variables
 * @returns Interpolated GraphQL query
 */
export function interpolateQuery(template: string, context: TemplateContext): string {
  try {
    return Mustache.render(template, context);
  } catch (error) {
    throw new Error(`Failed to interpolate query template: ${(error as Error).message}`);
  }
}

/**
 * Validate that all required variables are present in the template
 * @param template - GraphQL query template
 * @param context - Template context
 * @returns Array of missing variables, empty if all are present
 */
export function validateTemplate(template: string, context: TemplateContext): string[] {
  const requiredVars = extractTemplateVariables(template);
  const availableVars = Object.keys(context);
  
  return requiredVars.filter(varName => !availableVars.includes(varName));
}

/**
 * Extract variable names from a Mustache template
 * @param template - GraphQL query template
 * @returns Array of variable names used in the template
 */
export function extractTemplateVariables(template: string): string[] {
  const variables: string[] = [];
  const regex = /\{\{([^}]+)\}\}/g;
  let match;
  
  while ((match = regex.exec(template)) !== null) {
    const varName = match[1].trim();
    if (!variables.includes(varName)) {
      variables.push(varName);
    }
  }
  
  return variables;
} 