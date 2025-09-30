# Hospital Inventory Management System

A modern hospital inventory management application built with Vue 3 and TypeScript.

## Features

- **Multi-Hospital Support**: Dynamic configurations for different hospitals
- **Asset Management**: Full CRUD operations for medical equipment
- **Smart Filtering**: Search, category filters, and sorting
- **Stock Monitoring**: Critical item alerts and low stock warnings
- **Real-time Statistics**: Total value tracking and inventory metrics

## Quick Start

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```
Access at: http://localhost:5177/

### Testing
```bash
# Run all tests
npm test

# Run tests once (no watch mode)
npm test -- --run

# Run tests with coverage
npm test -- --coverage

# Run tests in UI mode
npm test -- --ui
```

### Build
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Type Checking
```bash
# Run TypeScript type checking
npm run type-check
```

## Test Credentials

| User | Username | Password | Hospital |
|------|----------|----------|----------|
| Dr. Sarah Johnson | thomas | thomas123 | St Thomas' Hospital |
| Dr. Michael Chen | kings | kings123 | King's College Hospital |

## Testing

The project includes a comprehensive test suite:

- **Unit Tests**: Models, stores, and repositories
- **Component Tests**: Vue components with mocking
- **Integration Tests**: CRUD operations
- **Framework**: Vitest with Vue Test Utils

## Tech Stack

- **Vue 3** with Composition API
- **TypeScript** with strict mode
- **Pinia** for state management
- **Tailwind CSS** for styling
- **Vite** for build tooling

## Project Structure
```
src/
├── models/          # Domain models
├── repositories/    # Data access layer
├── stores/          # Pinia state management
├── components/      # Reusable Vue components
├── views/           # Page components
├── fixtures/        # Test data generators
├── router/          # Vue Router configuration
└── utils/           # Helper functions
```

## Keyboard Shortcuts

- `Ctrl+K` - Focus search box
- `Ctrl+N` - Add new asset
- `Ctrl+Shift+V` - Toggle between table and card view
- `Escape` - Close modals
- `?` - Show keyboard shortcuts help

## Key Features

- **Pagination**: Efficient browsing of large inventories (25 items per page)
- **LocalStorage Persistence**: Data persists between sessions
- **Real-time Search**: Instant filtering as you type
- **Category Filters**: Filter by equipment category
- **Critical Alerts**: Highlight critical and low-stock items
- **UK Localization**: GBP currency, UK date format
