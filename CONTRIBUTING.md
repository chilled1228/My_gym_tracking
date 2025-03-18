# Contributing to Tracker

Thank you for your interest in contributing to Tracker! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style Guidelines](#code-style-guidelines)
- [Pull Request Process](#pull-request-process)
- [Database Changes](#database-changes)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

Please be respectful and considerate of others when contributing to this project. We welcome contributions from everyone regardless of level of experience, gender, gender identity and expression, sexual orientation, disability, personal appearance, body size, race, ethnicity, age, religion, or nationality.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork to your local machine
3. Create a new branch for your feature or bugfix
4. Set up the project following instructions in the README.md
5. Make your changes
6. Submit a pull request

## Development Workflow

1. Before starting work, make sure to pull the latest changes from the main branch
2. Create a new branch with a descriptive name (feature/..., bugfix/..., etc.)
3. Write clean, maintainable, and testable code
4. Commit your changes with clear, descriptive commit messages
5. Push your branch to your fork
6. Create a pull request against the main repository

## Code Style Guidelines

### TypeScript and JavaScript

- Use TypeScript for all new code
- Use functional components with hooks for React components
- Follow the existing project patterns for state management
- Use interfaces over types for object definitions
- Add proper TypeScript typing for all functions and components

### React Guidelines

- Use the function keyword for component definitions
- Use React Hooks for state and side effects
- Keep components small and focused on a single responsibility
- Split large components into smaller, reusable pieces
- Use JSX spread attributes sparingly

### File Structure

- Keep files under 300 lines of code when possible
- Follow the established directory structure
- Place components in the appropriate directories
- Name files according to their primary content

### Naming Conventions

- Use PascalCase for component names
- Use camelCase for functions, variables, and props
- Use lowercase with hyphens for directory names
- Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError)

### Component Structure

For each component file, follow this order:
1. Imports
2. Types and interfaces
3. Component definition
4. Helper functions
5. Exports

Example:
```tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface ExampleProps {
  title: string
  onAction: () => void
}

export function Example({ title, onAction }: ExampleProps) {
  const [isActive, setIsActive] = useState(false)
  
  function handleClick() {
    setIsActive(true)
    onAction()
  }
  
  return (
    <div>
      <h2>{title}</h2>
      <Button onClick={handleClick}>
        {isActive ? 'Active' : 'Inactive'}
      </Button>
    </div>
  )
}
```

## Pull Request Process

1. Ensure your code follows the style guidelines
2. Update the README.md with details of changes to the interface, if applicable
3. Update the documentation if you're changing functionality
4. Increase the version numbers in any examples files and the README.md to the new version
5. Your pull request will be reviewed by the maintainers, who may request changes
6. Once approved, your PR will be merged

## Database Changes

When making changes to the database schema:

1. Update the `setup-supabase.ts` file with the new table definitions
2. Add appropriate Row-Level Security (RLS) policies for the new tables
3. Update the `database.ts` with new functions for interacting with the tables
4. Add appropriate TypeScript types in `lib/supabase.ts`
5. Document the changes in your pull request

## Testing

- Test your changes in both development and production modes
- Verify that your changes work on different browsers
- Test the offline functionality if applicable
- If adding new features, make sure they degrade gracefully when offline

## Documentation

- Update documentation when changing functionality
- Use inline comments for complex logic
- Document any workarounds or browser-specific code
- Keep the README.md up to date with any new features or configuration changes

Thank you for contributing to Tracker! 