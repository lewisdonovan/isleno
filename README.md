# Isleno Monorepo

A monorepo built with [pnpm workspaces](https://pnpm.io/workspaces), [Turborepo](https://turbo.build/), and [Next.js](https://nextjs.org/).

## Structure

```
isleno/
├── apps/              # Application projects
│   └── kpis/          # KPIs dashboard (Next.js)
├── packages/          # Shared packages and libraries
│   ├── types/         # TypeScript type definitions
│   └── supabase/      # Supabase utilities
├── package.json       # Root package.json with Turborepo configuration
├── pnpm-workspace.yaml # pnpm workspace configuration
├── turbo.json         # Turborepo configuration
└── README.md
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

Install all dependencies:
```bash
pnpm install
```

## Workspace Commands

The following commands will run across all packages in the workspace using Turborepo:

- `pnpm build` - Build all packages
- `pnpm dev` - Start development mode for all packages  
- `pnpm lint` - Lint all packages
- `pnpm type-check` - Type check all packages
- `pnpm clean` - Clean build artifacts for all packages

### Development Modes

For the KPIs app specifically:

- `pnpm dev --filter=@isleno/kpis` - Standard Next.js dev server (recommended)
- `pnpm run dev:turbo --filter=@isleno/kpis` - Turbopack dev server (experimental)

> **Note**: Turbopack is currently experiencing compatibility issues in monorepo setups. Use the standard dev server for reliable development.

## Working with Packages

### Adding a New Package

1. Create a new directory in either `packages/` or `apps/`
2. Add a `package.json` file with appropriate name and dependencies
3. Run `pnpm install` to update the workspace

### Installing Dependencies

- **Add a dependency to a specific package:**
  ```bash
  pnpm add <dependency> --filter <package-name>
  ```

- **Add a dev dependency to a specific package:**
  ```bash
  pnpm add -D <dependency> --filter <package-name>
  ```

- **Add a workspace dependency:**
  ```bash
  pnpm add @isleno/package-name --filter <target-package> --workspace
  ```

### Running Commands in Specific Packages

```bash
# Run a command in a specific package
pnpm <command> --filter <package-name>

# Example: Start dev server for a specific app
pnpm dev --filter @isleno/kpis

# Example: Build a specific package
pnpm build --filter @isleno/types
```

## Package Naming Convention

- Packages: `@isleno/<package-name>`
- Apps: `@isleno/<app-name>`

## Workspace Dependencies

When referencing other packages in the monorepo, use the `workspace:*` protocol:

```json
{
  "dependencies": {
    "@isleno/types": "workspace:*",
    "@isleno/supabase": "workspace:*"
  }
}
```

## Contributing

1. Make changes in the appropriate package or app
2. Test your changes locally with `pnpm dev --filter <package-name>`
3. Build and type-check with `pnpm build` and `pnpm type-check`
4. Commit and push your changes

## Learn More

- [pnpm Workspaces Documentation](https://pnpm.io/workspaces)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Next.js 15 Documentation](https://nextjs.org/docs) 