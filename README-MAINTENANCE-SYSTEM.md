# Maintenance Mode System

A comprehensive maintenance mode system for the Isleño Admin UI that allows administrators to schedule maintenance windows and automatically redirect users to a maintenance page during scheduled downtime.

## Features

- **Scheduled Maintenance Windows**: Create maintenance windows with specific start/end times
- **CET Timezone Support**: All times are handled in CET (Europe/Madrid) timezone
- **Automatic User Redirection**: Users are automatically redirected to maintenance page during active windows
- **Internationalization**: Maintenance messages in English and Spanish
- **Admin Management**: Admin interface for creating and managing maintenance windows
- **Automatic Cleanup**: Expired maintenance windows are automatically deactivated
- **Database-Level Enforcement**: Uses PostgreSQL functions and RLS for reliable enforcement

## Database Schema

### `maintenance_status` Table

```sql
CREATE TABLE public.maintenance_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean NOT NULL DEFAULT false,
  start_time timestamp with time zone NOT NULL, -- CET timezone
  end_time timestamp with time zone NOT NULL,   -- CET timezone
  reason text, -- Optional reason for maintenance
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT single_active_maintenance EXCLUDE USING gist (
    (CASE WHEN is_active THEN 1 ELSE 0 END) WITH =,
    tstzrange(start_time, end_time) WITH &&
  ) WHERE (is_active = true)
);
```

### Database Functions

- `is_maintenance_active()`: Returns boolean indicating if maintenance is currently active
- `get_current_maintenance()`: Returns information about the current active maintenance window
- `cleanup_expired_maintenance()`: Automatically deactivates expired maintenance windows

## API Endpoints

### `GET /api/maintenance`
Get current maintenance status (admin only)

**Response:**
```json
{
  "isActive": boolean,
  "maintenanceInfo": {
    "id": "uuid",
    "start_time": "2024-01-28T10:00:00Z",
    "end_time": "2024-01-28T12:00:00Z",
    "reason": "Database migration",
    "created_by": "uuid"
  }
}
```

### `POST /api/maintenance`
Create new maintenance window (admin only)

**Request Body:**
```json
{
  "startTime": "2024-01-28T10:00:00Z",
  "endTime": "2024-01-28T12:00:00Z",
  "reason": "Database migration"
}
```

### `DELETE /api/maintenance`
End current maintenance window (admin only)

## Components

### `MaintenancePage` (`/maintenance`)
The maintenance page displayed to users during maintenance windows. Features:
- Displays maintenance end time in CET timezone
- Shows reason for maintenance (if provided)
- Provides contact email (lewis@isleno.es)
- Auto-refresh functionality
- Internationalized messages

### `MaintenanceManager`
Admin component for managing maintenance windows. Features:
- Schedule new maintenance windows
- Set default times (1 hour from now)
- End current maintenance windows
- Form validation
- Error/success feedback

## Services

### `ServerMaintenanceService`
Server-side service for API routes and server components:
- `isMaintenanceActive()`: Check if maintenance is active
- `getCurrentMaintenance()`: Get current maintenance info
- `createMaintenanceWindow()`: Create new maintenance window
- `endMaintenanceWindow()`: End current maintenance
- `cleanupExpiredMaintenance()`: Cleanup expired windows

### `ClientMaintenanceService`
Client-side service for React components:
- `isMaintenanceActive()`: Check maintenance status
- `getCurrentMaintenance()`: Get maintenance info

### `MaintenanceUtils`
Utility functions:
- `toCET()`: Convert time to CET timezone
- `formatDateTime()`: Format datetime for display
- `getCurrentCETTime()`: Get current CET time
- `createMaintenanceWindow()`: Create maintenance window object
- `validateMaintenanceWindow()`: Validate maintenance window

## Hooks

### `useMaintenance()`
React hook for checking maintenance status:
```typescript
const { isMaintenanceActive, maintenanceInfo, loading, error, refresh } = useMaintenance()
```

### `useMaintenanceStatus()`
Simplified hook that returns only the maintenance status boolean.

## Middleware Integration

The middleware (`src/middleware.ts`) automatically checks for active maintenance before processing any requests:

1. **Maintenance Check**: Calls `is_maintenance_active()` RPC function
2. **Route Protection**: Redirects all routes (except `/maintenance` and `/auth/*`) to maintenance page
3. **Error Handling**: Continues normal flow if maintenance check fails

## Internationalization

Maintenance messages are available in both English and Spanish:

### English (`messages/en.json`)
```json
{
  "maintenance": {
    "title": "Scheduled Maintenance",
    "message": "The Isleño Admin UI is currently unavailable due to scheduled maintenance. It will be available again at {time} on {date}. If this time has already passed, please email lewis@isleno.es.",
    "contactEmail": "lewis@isleno.es",
    "timeFormat": "HH:mm",
    "dateFormat": "DD/MM/YYYY",
    "timezone": "CET"
  }
}
```

### Spanish (`messages/es.json`)
```json
{
  "maintenance": {
    "title": "Mantenimiento Programado",
    "message": "La interfaz de administración de Isleño no está disponible actualmente debido a un mantenimiento programado. Estará disponible nuevamente a las {time} del {date}. Si esta hora ya ha pasado, por favor envía un email a lewis@isleno.es.",
    "contactEmail": "lewis@isleno.es",
    "timeFormat": "HH:mm",
    "dateFormat": "DD/MM/YYYY",
    "timezone": "CET"
  }
}
```

## Usage Examples

### Creating a Maintenance Window (Admin)

```typescript
import { MaintenanceManager } from '@/components/MaintenanceManager'

// In admin dashboard
<MaintenanceManager />
```

### Checking Maintenance Status (Programmatic)

```typescript
import { serverMaintenanceService } from '@/lib/services/maintenance'

// Server-side
const isActive = await serverMaintenanceService.isMaintenanceActive()
if (isActive) {
  const info = await serverMaintenanceService.getCurrentMaintenance()
  console.log('Maintenance active until:', info?.end_time)
}
```

### Using Maintenance Hook (Client)

```typescript
import { useMaintenance } from '@/hooks/useMaintenance'

function MyComponent() {
  const { isMaintenanceActive, maintenanceInfo, loading } = useMaintenance()
  
  if (loading) return <div>Loading...</div>
  if (isMaintenanceActive) return <div>Maintenance in progress</div>
  
  return <div>Normal app content</div>
}
```

## Deployment

1. **Run Migration**: Execute the database migration to create the maintenance system
2. **Deploy Code**: Deploy the updated application code
3. **Test**: Verify maintenance mode works correctly

### Database Migration
```bash
# Run the migration
supabase db push
```

## Security Considerations

- **Admin Only**: Only users with 'admin' role can manage maintenance windows
- **RLS Policies**: Row Level Security ensures proper access control
- **Input Validation**: All maintenance window data is validated
- **Error Handling**: Graceful fallbacks if maintenance check fails

## Monitoring

- **Logs**: Maintenance operations are logged for audit purposes
- **Automatic Cleanup**: Expired maintenance windows are automatically deactivated
- **Error Tracking**: Failed maintenance checks are logged but don't break the app

## Troubleshooting

### Common Issues

1. **Maintenance Check Fails**: App continues normally, check database connection
2. **Users Not Redirected**: Verify middleware is working and RPC function exists
3. **Time Zone Issues**: Ensure all times are properly converted to CET
4. **Admin Access**: Verify user has 'admin' role in `user_roles` table

### Debug Commands

```sql
-- Check if maintenance is active
SELECT public.is_maintenance_active();

-- Get current maintenance info
SELECT * FROM public.get_current_maintenance();

-- View all maintenance windows
SELECT * FROM public.maintenance_status ORDER BY created_at DESC;

-- Cleanup expired maintenance
SELECT public.cleanup_expired_maintenance();
```

## Future Enhancements

- **Recurring Maintenance**: Support for recurring maintenance windows
- **Maintenance Notifications**: Email notifications before maintenance starts
- **Maintenance History**: Detailed audit log of all maintenance activities
- **Custom Maintenance Pages**: Allow custom maintenance page content
- **Maintenance Status API**: Public API for checking maintenance status
