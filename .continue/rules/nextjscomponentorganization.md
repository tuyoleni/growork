---
globs: app/**/*.tsx
description: Apply when organizing components in Next.js applications using the App Router
---

When organizing Next.js components:
1. Use page.tsx for server components that serve as page entry points
2. Use client components in separate files with descriptive names
3. Group related components in a components/ folder within feature directories
4. Properly separate UI concerns into small, focused components
5. Use 'use client' directive only on components that require client-side interactivity