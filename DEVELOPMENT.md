# Development Guide

This guide explains how to set up your development environment and start building with the PERN stack.

## 🔧 Prerequisites

Before you start, make sure you have:

- **Node.js** v18 or higher - [Download](https://nodejs.org/)
- **Git** for version control - [Download](https://git-scm.com/)
- **Docker & Docker Compose** for running PostgreSQL and Redis - [Download](https://www.docker.com/products/docker-desktop)
- **A code editor** - We recommend [VS Code](https://code.visualstudio.com/)
- **yarn** v3.6+ - Install with `npm install -g yarn`

## 📋 First-Time Setup

### Step 1: Clone and Navigate

```bash
git clone <repository-url>
cd pern-monorepo
```

### Step 2: Install Dependencies

```bash
yarn install
```

This installs dependencies for all workspaces (root, apps/server, apps/client, packages/shared).

### Step 3: Environment Configuration

Copy the environment template files:

```bash
cp .env.example .env
cp apps/server/.env.example apps/server/.env
cp apps/client/.env.example apps/client/.env
```

Edit `.env` files as needed (the examples are set up for local development).

### Step 4: Start Docker Services

```bash
yarn docker:up
```

This starts PostgreSQL and Redis in Docker containers. Wait a few seconds for them to be ready.

Verify services are running:

```bash
docker-compose ps
```

Should show `postgres` and `redis` containers as "Up".

### Step 5: Start Development Servers

In a new terminal:

```bash
yarn dev
```

This starts both the backend (port 5000) and frontend (port 5173) concurrently.

Open http://localhost:5173 in your browser. You should see the PERN app homepage!

## 🚀 Daily Development Workflow

### Starting Your Day

```bash
# Make sure Docker services are running
yarn docker:up

# Start development servers
yarn dev
```

### Making Changes

**Backend Changes** (`apps/server/src/`):
- Edit files (auto-restart is available with proper setup)
- Changes are reflected immediately

**Frontend Changes** (`apps/client/src/`):
- Edit files and save
- Hot Module Replacement (HMR) auto-refreshes the browser

**Shared Package Changes** (`packages/shared/src/`):
- Edit types, constants, or utilities
- Both apps will automatically reload

### Code Quality Checks

Before committing:

```bash
# Check for linting issues
yarn lint

# Auto-fix linting issues
yarn lint:fix

# Format code
yarn format

# Type checking (also runs as pre-push hook)
yarn type-check
```

**Git Hooks (Automatic)**:
- **Pre-commit**: Lints and formats staged files
- **Pre-push**: Runs type checking

## 📁 Project Structure Cheat Sheet

```
apps/server/src/
├── index.ts           # Entry point, middleware setup
├── config/            # Configuration, environment variables
├── middleware/        # Express middleware
├── routes/            # API route definitions
├── controllers/       # Request handlers
├── services/          # Business logic (use for reusable code)
├── models/            # Database models (Sequelize)
├── utils/             # Utilities (logging, errors)
└── types/             # TypeScript types

apps/client/src/
├── main.tsx           # React entry point
├── App.tsx            # Root component with routing
├── pages/             # Page-level components (one per route)
├── components/        # Reusable components
├── stores/            # Zustand state management
├── api/               # API client configuration
├── hooks/             # Custom React hooks
├── types/             # TypeScript types
└── styles/            # CSS and Tailwind config

packages/shared/src/
├── api/               # Shared API utilities
├── types/             # Shared TypeScript types
└── constants/         # Shared constants
```

## 🔑 Key Commands Reference

### Installation & Setup

```bash
yarn install                # Install all dependencies
yarn docker:up             # Start PostgreSQL & Redis
yarn docker:down           # Stop Docker services
yarn docker:logs           # View Docker logs
```

### Development

```bash
yarn dev                   # Run backend & frontend together
yarn dev:server           # Backend only
yarn dev:client           # Frontend only
```

### Building

```bash
yarn build                # Build backend & frontend
yarn build:server         # Backend build only
yarn build:client         # Frontend build only
```

### Code Quality

```bash
yarn lint                 # Check for linting issues
yarn lint:fix             # Fix linting issues automatically
yarn format               # Format code with Prettier
yarn type-check           # TypeScript type checking
```

### Database (When Using Sequelize)

```bash
# From apps/server/:
yarn sequelize migration:create --name description
yarn sequelize db:migrate
yarn sequelize db:migrate:undo
```

## 🔌 API Integration Examples

### Making API Calls from Frontend

```typescript
import { useApiClient } from '@/hooks/useApiClient';

function MyComponent() {
  const apiClient = useApiClient();

  const fetchData = async () => {
    try {
      const response = await apiClient.get('/example');
      console.log(response.data);
    } catch (error) {
      console.error('API error:', error);
    }
  };

  return <button onClick={fetchData}>Fetch Data</button>;
}
```

### Creating API Endpoints on Backend

```typescript
// apps/server/src/routes/items.ts
import { Router, Request, Response, NextFunction } from 'express';
import { getAllItems } from '../controllers/itemsController';

const router = Router();
router.get('/', getAllItems);

export default router;

// apps/server/src/index.ts
import itemsRouter from './routes/items';
app.use('/api/items', itemsRouter);
```

## 📊 Understanding State Management

### Zustand (Frontend)

Simple, hook-based state management without providers:

```typescript
// Define store
import { create } from 'zustand';

const useUserStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

// Use in component
function Profile() {
  const { user, setUser } = useUserStore();
  // ...
}
```

### Backend State (Services & Middleware)

Backend state is managed through:
- **Request context**: Passed via req object
- **Databases**: PostgreSQL for persistent data
- **Cache**: Redis for temporary data
- **Queues**: Bull/Redis for async processing

## 🐛 Debugging Tips

### Backend Debugging

1. **Check logs**: `yarn docker:logs` to see PostgreSQL/Redis output
2. **Health check**: `curl http://localhost:5000/api/health`
3. **Database**: Connect directly with:
   ```bash
   docker-compose exec postgres psql -U postgres -d pern_dev
   ```
4. **Add console logs**: They appear in your terminal

### Frontend Debugging

1. **Browser DevTools**: F12 or right-click → Inspect
2. **Network tab**: See API requests and responses
3. **Console**: Check for errors and logs
4. **React DevTools**: Extension for inspecting components
5. **Vite HMR**: If changes don't reflect, refresh the page

## 📖 Common Development Scenarios

### Scenario: Modify Database Schema

1. Create a migration:
   ```bash
   cd apps/server
   yarn sequelize migration:create --name add_user_avatar
   ```

2. Edit the migration file in `migrations/`

3. Run it:
   ```bash
   yarn sequelize db:migrate
   ```

### Scenario: Add a New API Endpoint

1. Create a route file: `apps/server/src/routes/newFeature.ts`
2. Create a controller: `apps/server/src/controllers/newFeatureController.ts`
3. Register in `apps/server/src/index.ts`
4. Test with curl or Postman: `curl http://localhost:5000/api/newfeature`

### Scenario: Add Frontend State

1. Create a Zustand store: `apps/client/src/stores/myStore.ts`
2. Use in component:
   ```typescript
   const { state, setState } = useMyStore();
   ```

### Scenario: Real-time Feature

1. Client emits Socket.io event:
   ```typescript
   socket.emit('event_name', data);
   ```

2. Server listens:
   ```typescript
   socket.on('event_name', (data) => {
     io.emit('response', result);
   });
   ```

## 🚨 Troubleshooting

### Port Already in Use

```bash
# Find process on port 5000 (macOS/Linux)
lsof -i :5000

# Kill it
kill -9 <PID>

# Or change port in .env
SERVER_PORT=5001
```

### Docker Services Not Responding

```bash
# Restart containers
yarn docker:down
yarn docker:up

# Check logs
yarn docker:logs
```

### TypeScript Errors

```bash
# Full type check
yarn type-check

# Build to see all errors
yarn build
```

### Import Errors (Can't find module '@shared/...')

```bash
# Reinstall dependencies
rm -rf node_modules yarn.lock
yarn install

# Verify tsconfig paths are correct
# Check apps/server/tsconfig.json and apps/client/tsconfig.json
```

## 📚 Learning Resources

- **Express**: https://expressjs.com/
- **React**: https://react.dev/
- **TypeScript**: https://www.typescriptlang.org/
- **Vite**: https://vitejs.dev/
- **Zustand**: https://github.com/pmndrs/zustand
- **Chakra UI**: https://chakra-ui.com/
- **PostgreSQL**: https://www.postgresql.org/docs/

## 🆘 Getting Help

1. **Check the main README.md** - Has architecture diagrams and detailed explanations
2. **Review existing code** - Look at example implementations in the codebase
3. **Check documentation links** - Every major section has links to official docs
4. **Read inline comments** - Code is well-commented for learning
5. **Test in isolation** - Use Postman for API testing, console for debugging

## ✨ Next Steps

Now that you're set up:

1. **Read the main README** for architecture overview
2. **Explore the example routes** in `apps/server/src/routes/example.ts`
3. **Check the example page** in `apps/client/src/pages/ExamplesPage.tsx`
4. **Build something small** - Add a new API endpoint and frontend form
5. **Review error handling** - See how errors are standardized
6. **Experiment with Socket.io** - Send real-time events

Happy coding! 🚀
