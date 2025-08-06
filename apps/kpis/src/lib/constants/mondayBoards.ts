/**
 * Monday.com Board ID Configuration
 * 
 * These board IDs are used throughout the application for various Monday.com integrations.
 * They should be configured via environment variables, with fallbacks to the current values.
 */

export const MONDAY_BOARD_IDS = {
  // KPI Board - used for KPI management and tracking
  KPI: process.env.BOARD_ID_KPI || '9076494835',
  
  // Activities Board - used for general activity tracking
  ACTIVITIES: process.env.BOARD_ID_ACTIVITIES || '9076281262',
  
  // Leads Board - used for lead management from collaborators
  LEADS: process.env.BOARD_ID_LEADS || '5740801783',
  
  // Point Activities Board - used for point-based activity tracking
  POINT_ACTIVITIES: process.env.BOARD_ID_POINT_ACTIVITIES || '9076318311',
  
  // Development Projects Board - used for high-level development project tracking
  DEVELOPMENT_PROJECTS: process.env.BOARD_ID_HIGH_LEVEL_DEVELOPMENT,
  
  // Property Database Board - used for property information
  PROPERTY_DATABASE: process.env.BOARD_ID_PROPERTY_DATABASE || '5740801783',
} as const;

/**
 * Get a board ID by key, with validation
 */
export function getMondayBoardId(key: keyof typeof MONDAY_BOARD_IDS): string {
  const boardId = MONDAY_BOARD_IDS[key];
  
  if (!boardId) {
    throw new Error(`Monday board ID for '${key}' is not configured. Please set the appropriate environment variable.`);
  }
  
  return boardId;
}

/**
 * Validate that all required board IDs are configured
 */
export function validateMondayBoardIds(): void {
  const requiredBoards = ['KPI', 'ACTIVITIES', 'LEADS', 'POINT_ACTIVITIES'] as const;
  
  for (const board of requiredBoards) {
    if (!MONDAY_BOARD_IDS[board]) {
      throw new Error(`Required Monday board ID '${board}' is not configured. Please set BOARD_ID_${board} environment variable.`);
    }
  }
} 