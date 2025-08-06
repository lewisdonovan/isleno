# Monday Board ID Configuration

## Overview

This document describes the centralized configuration system for Monday.com board IDs used throughout the application.

## Configuration

All Monday.com board IDs are now configured through environment variables with fallbacks to the current hardcoded values. This allows for easy configuration across different environments without code changes.

## Environment Variables

The following environment variables should be set in your `.env` file:

```bash
# Required Board IDs
BOARD_ID_KPI=9076494835                    # KPI management and tracking
BOARD_ID_ACTIVITIES=9076281262             # General activity tracking
BOARD_ID_LEADS=5740801783                  # Lead management from collaborators
BOARD_ID_POINT_ACTIVITIES=9076318311       # Point-based activity tracking

# Optional Board IDs (already configured)
BOARD_ID_HIGH_LEVEL_DEVELOPMENT=<your_id>  # Development project tracking
BOARD_ID_PROPERTY_DATABASE=<your_id>       # Property information
```

## Usage

### In Code

```typescript
import { MONDAY_BOARD_IDS, getMondayBoardId } from '@/lib/constants/mondayBoards';

// Access board IDs directly
const kpiBoardId = MONDAY_BOARD_IDS.KPI;

// Or use the helper function with validation
const activitiesBoardId = getMondayBoardId('ACTIVITIES');
```

### Validation

The configuration system includes validation to ensure all required board IDs are properly configured:

```typescript
import { validateMondayBoardIds } from '@/lib/constants/mondayBoards';

// This will throw an error if any required board IDs are missing
validateMondayBoardIds();
```

## Migration from Hardcoded Values

The following hardcoded values have been replaced:

| Old Hardcoded Value | New Environment Variable | Description |
|-------------------|-------------------------|-------------|
| `9076494835` | `BOARD_ID_KPI` | KPI Board |
| `9076281262` | `BOARD_ID_ACTIVITIES` | Activities Board |
| `5740801783` | `BOARD_ID_LEADS` | Leads Board |
| `9076318311` | `BOARD_ID_POINT_ACTIVITIES` | Point Activities Board |

## Benefits

1. **Environment-specific configuration**: Different board IDs for development, staging, and production
2. **No code changes required**: Update board IDs without deploying new code
3. **Centralized management**: All board IDs in one place
4. **Validation**: Automatic validation of required configuration
5. **Fallback support**: Graceful fallback to current values if environment variables are not set

## Files Updated

- `apps/kpis/src/lib/constants/mondayBoards.ts` - New centralized configuration
- `apps/kpis/src/lib/monday/services.ts` - Updated to use new configuration
- `apps/kpis/src/app/forms/point-activities/actions.ts` - Updated to use new configuration
- `apps/kpis/src/lib/monday/queries.ts` - Updated queries to use parameters
- `turbo.json` - Added new environment variables to globalEnv

## Testing

To test the configuration:

1. Set the environment variables in your `.env` file
2. Restart your development server
3. Verify that all Monday.com integrations work correctly
4. Check that the correct board IDs are being used in API calls

## Troubleshooting

If you encounter issues:

1. **Missing board ID error**: Ensure all required environment variables are set
2. **Wrong board data**: Verify the board IDs match your Monday.com workspace
3. **Build errors**: Check that all imports are correct and the types package is built

## Future Considerations

- Consider adding board ID validation against the Monday.com API
- Add support for board-specific configuration (columns, views, etc.)
- Implement board ID caching for performance 