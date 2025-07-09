# Isleno KPI UI

A Next.js application with Monday.com OAuth integration and chart visualization capabilities.

## Features

- **Monday.com OAuth Integration**: Secure authentication using Monday.com OAuth 2.0
- **Board Management**: Browse and view Monday.com boards with pagination
- **Chart Examples**: Various chart types using Recharts
- **Modern UI**: Built with shadcn/ui components
- **TypeScript**: Full type safety
- **Responsive Design**: Works on all device sizes

## Setup

### 1. Monday.com App Registration

1. Go to [Monday.com Developer Center](https://monday.com/developers/apps)
2. Create a new app
3. Note down your **Client ID** and **Client Secret**
4. Set the **Redirect URI** to: `http://localhost:3000/api/auth/monday/callback` (for development)

### 2. Environment Variables

Create a `.env.local` file in the root directory with:

```bash
# Monday.com OAuth Configuration
MONDAY_CLIENT_ID=your_monday_client_id_here
MONDAY_CLIENT_SECRET=your_monday_client_secret_here
MONDAY_REDIRECT_URI=http://localhost:3000/api/auth/monday/callback
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Development Server

```bash
npm run dev
```

### 5. Open Your Browser

Navigate to [http://localhost:3000](http://localhost:3000)

## Authentication Flow

1. **Login**: Users are redirected to Monday.com OAuth
2. **Authorization**: Users grant permissions to your app
3. **Callback**: Monday.com redirects back with authorization code
4. **Token Exchange**: App exchanges code for access token
5. **Session**: Access token stored in secure HTTP-only cookie
6. **Protected Routes**: All board and chart pages require authentication

## Pages

- **Login (`/auth/login`)**: OAuth login page
- **Error (`/auth/error`)**: Authentication error handling
- **Home (`/`)**: Welcome page (redirects to boards)
- **Boards (`/boards`)**: Paginated list of all Monday.com boards (requires auth)
- **Board Details (`/boards/[id]`)**: Individual board information in JSON format (requires auth)
- **Charts (`/charts`)**: Various chart examples with dummy data (requires auth)

## API Routes

- `GET /api/auth/monday/login`: Initiates OAuth flow
- `GET /api/auth/monday/callback`: Handles OAuth callback
- `POST /api/auth/monday/logout`: Logs out user
- `GET /api/monday/boards?page={page}&limit={limit}`: Get paginated list of boards (requires auth)
- `GET /api/monday/boards/[id]`: Get board details by ID (requires auth)

## Technologies Used

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **shadcn/ui**: UI components
- **Recharts**: Chart library
- **Monday.com OAuth 2.0**: Authentication
- **Monday.com API v2**: Data source

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/monday/
│   │   │   ├── login/route.ts
│   │   │   ├── callback/route.ts
│   │   │   └── logout/route.ts
│   │   └── monday/boards/
│   │       ├── route.ts
│   │       └── [id]/route.ts
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── error/page.tsx
│   ├── boards/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── charts/
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── command.tsx
│   │   ├── input.tsx
│   │   ├── popover.tsx
│   │   └── table.tsx
│   └── navigation.tsx
├── types/
│   ├── auth.ts
│   └── monday.ts
├── lib/
│   └── utils.ts
└── middleware.ts
```

## Development

- **Build**: `npm run build`
- **Start**: `npm start`
- **Lint**: `npm run lint`

## Security Features

- **OAuth 2.0**: Secure authentication flow
- **State Parameter**: CSRF protection
- **HTTP-Only Cookies**: Secure session storage
- **Session Expiration**: Automatic token refresh handling
- **Route Protection**: Middleware-based authentication
- **Secure Headers**: Proper cookie security settings

## Production Deployment

For production deployment:

1. Update `MONDAY_REDIRECT_URI` to your production domain
2. Set `NODE_ENV=production` for secure cookies
3. Use HTTPS for all OAuth callbacks
4. Consider implementing token refresh logic for long-lived sessions
