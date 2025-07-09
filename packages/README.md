# Packages

This directory contains shared packages and libraries that can be used across multiple projects in the monorepo.

Each package should be designed to be reusable and follow semantic versioning.

## Structure

Each package should have its own `package.json` and be publishable (either to npm or for internal use).

## Example

```
packages/
├── types/
│   ├── package.json
│   ├── src/
│   └── ...
├── supabase/
│   ├── package.json
│   ├── src/
│   └── ...
└── your-package-name-here/
    ├── package.json
    ├── src/
    └── ...
```

## Usage

Packages can be referenced by projects using their package names in dependencies:

```json
{
  "dependencies": {
    "@isleno/types": "workspace:*",
    "@isleno/supabase": "workspace:*",
    "@isleno/your-package-name-here": "workspace:*"
  }
}
``` 