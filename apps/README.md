# Apps

This directory contains application projects that are built using packages from the `/packages` directory.

Each subdirectory represents a separate application that can be deployed independently.

## Structure

Each app should have its own `package.json` and follow the monorepo conventions.

## Example

```
apps/
├── kpis/
│   ├── package.json
│   ├── src/
│   └── ...
└── other-app/
    ├── package.json
    ├── src/
    └── ...
``` 