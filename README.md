# PERN Stack Monorepo

A production-ready PostgreSQL + Express + React + Node.js monorepo scaffold with modern tooling, Docker support, and comprehensive documentation for beginners.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Authentication (Week 2)](#authentication-week-2)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Docker Services](#docker-services)
- [Deployment](#deployment)
- [Architecture Deep Dive](#architecture-deep-dive)
- [Contributing](#contributing)

---

## 🏗️ Architecture Overview

This is a **monorepo** - a single repository containing multiple applications and shared packages. Think of it as a house where different rooms (apps) share common utilities (packages) while maintaining clear boundaries.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PERN Monorepo                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────┐         ┌──────────────────────┐  │
│  │   Browser (React)    │◄───────►│   Express Server     │  │
│  │  - Vite bundling     │ HTTP/WS │  - Node.js runtime   │  │
│  │  - React 19          │         │  - TypeScript        │  │
│  │  - Zustand state     │         │  - Bull + Redis      │  │
│  │  - Tailwind/Chakra   │         │  - Socket.io         │  │
│  └──────────────────────┘         └──────────────────────┘  │
│           │                                │                 │
│           │                                │                 │
│           └────────────┬───────────────────┘                 │
│                        │                                      │
│                        ▼                                      │
│           ┌──────────────────────────┐                       │
│           │  Shared Utilities Pkg    │                       │
│           │ - API client helpers     │                       │
│           │ - Type definitions       │                       │
│           │ - Constants              │                       │
│           └──────────────────────────┘                       │
│                        │                                      │
│        ┌───────────────┼───────────────┐                     │
│        │               │               │                     │
│        ▼               ▼               ▼                     │
│    ┌────────┐    ┌─────────┐    ┌──────────┐               │
│    │   DB   │    │  Redis  │    │ External │               │
│    │  Pg13  │    │  Cache  │    │  APIs    │               │
│    └────────┘    └─────────┘    └──────────┘               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Diagram

```
React Frontend
       │
       │ HTTP POST/GET + WebSocket
       │
       ▼
Express Router
       │
       ├─────────────────────────────────────┐
       │                                     │
       ▼                                     ▼
   Business Logic               Socket.io Events
   (Controllers/Services)        (Real-time updates)
       │                                     │
       │                                     │
       ├──────────────┬──────────────────────┤
       │              │                      │
       ▼              ▼                      ▼
   PostgreSQL     Redis Cache          Bull Queue
   (Persist)      (Temporary)           (Async Jobs)
```

---

## 🛠️ Tech Stack

### Backend (`apps/server`)

- **Runtime**: Node.js 18+
- **Framework**: Express 5
- **Language**: TypeScript
- **Database**: PostgreSQL 16 (via Sequelize ORM)
- **Cache**: Redis 7
- **Job Queue**: Bull (backed by Redis)
- **Real-time**: Socket.io
- **Logging**: winston (configured, extensible)
- **Validation**: joi (validation schemas)
- **Security**: bcryptjs (passwords), jsonwebtoken (auth tokens)

### Frontend (`apps/client`)

- **Build Tool**: Vite
- **Framework**: React 19
- **Language**: TypeScript
- **State Management**: Zustand (lightweight, minimal boilerplate)
- **Routing**: React Router v6
- **Styling**: Tailwind CSS + Chakra UI (both configured)
- **HTTP Client**: Axios with custom interceptors
- **Real-time**: Socket.io client

### Shared (`packages/shared`)

- Type definitions
- API client helpers
- Constants and utilities
- Shared validation schemas

### Development Tools

- **Code Quality**: ESLint + Prettier
- **Git Hooks**: Husky (pre-commit, pre-push)
- **Task Running**: yarn workspaces
- **Containerization**: Docker + Docker Compose
- **Package Manager**: yarn (v3+)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v18 or higher
- **yarn**: v3.6+ (or npm v9+)
- **Docker & Docker Compose**: For running PostgreSQL and Redis

### Installation (One Command!)

```bash
# 1. Clone and enter the repository
git clone <repo-url>
cd pern-monorepo

# 2. Install all dependencies across all workspaces
yarn install

# 3. Set up environment variables
cp .env.example .env

# 4. Start Docker services (PostgreSQL + Redis)
yarn docker:up

# 5. Run development servers (backend + frontend concurrently)
yarn dev
```

That's it! Your application will be running:

- **Frontend**: http://localhost:5173 (Vite default)
- **Backend API**: http://localhost:5000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Individual Development Commands

```bash
# Start only the backend server
yarn dev:server

# Start only the frontend
yarn dev:client

# Run linting and formatting
yarn lint
yarn lint:fix
yarn format

# Type checking
yarn type-check

# View Docker logs
yarn docker:logs

# Stop Docker services
yarn docker:down
```

---

## Authentication (Week 2)

This scaffold includes a full **bcrypt + TOTP + JWT access/refresh** auth flow:

- Backend endpoints: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/refresh`, `/api/auth/logout`
- Rate limiting on sensitive endpoints (login/register/refresh)
- Refresh tokens in **httpOnly cookies**, access tokens kept **in memory** (Zustand)
- Refresh rotation and session storage (`auth_sessions` table)

See: **[AUTH_FLOW.md](./AUTH_FLOW.md)** for request/response samples, sequence diagrams, and troubleshooting tips.

---

## 📁 Project Structure

```
pern-monorepo/
├── apps/
│   ├── server/              # Express backend application
│   │   ├── src/
│   │   │   ├── index.ts     # Entry point
│   │   │   ├── config/      # Configuration management (db, env, logging)
│   │   │   ├── middleware/  # Express middleware (auth, errors, logging)
│   │   │   ├── routes/      # API endpoints
│   │   │   ├── controllers/ # Business logic (request handlers)
│   │   │   ├── services/    # Business logic (data access, external APIs)
│   │   │   ├── models/      # Sequelize database models
│   │   │   ├── utils/       # Utility functions (errors, logging)
│   │   │   └── types/       # TypeScript type definitions
│   │   ├── package.json     # Backend-specific dependencies
│   │   ├── tsconfig.json    # Backend TypeScript config
│   │   └── .env.example     # Backend environment example
│   │
│   └── client/              # Vite + React frontend application
│       ├── src/
│       │   ├── main.tsx     # Entry point
│       │   ├── App.tsx      # Root component
│       │   ├── components/  # Reusable React components
│       │   ├── pages/       # Page-level components (with routing)
│       │   ├── stores/      # Zustand state management
│       │   ├── api/         # API client & hooks
│       │   ├── types/       # TypeScript types
│       │   ├── utils/       # Utility functions
│       │   ├── styles/      # Global CSS/Tailwind config
│       │   └── hooks/       # Custom React hooks
│       ├── package.json     # Frontend-specific dependencies
│       ├── vite.config.ts   # Vite configuration
│       ├── tsconfig.json    # Frontend TypeScript config
│       └── .env.example     # Frontend environment example
│
├── packages/
│   └── shared/              # Shared code between apps
│       ├── src/
│       │   ├── api/         # Shared API client
│       │   ├── types/       # Shared types
│       │   ├── constants/   # Shared constants
│       │   └── utils/       # Shared utilities
│       └── package.json
│
├── docker-compose.yml       # Docker services (PostgreSQL, Redis)
├── package.json            # Root workspace configuration
├── .prettierrc              # Code formatting config
├── .eslintrc.json          # Linting config
├── .env.example            # Root environment example
├── .gitignore              # Git ignore rules
├── .husky/                 # Git hooks configuration
├── .lintstagedrc.json      # Lint-staged config
└── README.md              # This file!
```

---

## 💻 Development Workflow

### 1. Starting Development

```bash
# Terminal 1: Start backend and frontend together
yarn dev

# OR Terminal 1: Backend only
yarn dev:server

# Terminal 2 (if needed): Frontend only
yarn dev:client
```

### 2. Making Changes

- **Backend changes**: Edit files in `apps/server/src/`. The server auto-restarts (if nodemon is configured).
- **Frontend changes**: Edit files in `apps/client/src/`. Vite hot-reloads automatically.
- **Shared code changes**: Edit in `packages/shared/src/`. Both apps will reload.

### 3. Code Quality

Before committing, git hooks will automatically:

1. **Pre-commit**: Run linting and formatting on staged files
2. **Pre-push**: Run type checking across the workspace

You can also run manually:

```bash
# Check for linting issues
yarn lint

# Auto-fix linting issues
yarn lint:fix

# Format code
yarn format

# Full type check
yarn type-check
```

### 4. Database Changes (When Using Sequelize)

```bash
# In apps/server/:
# Create a new migration
yarn sequelize migration:create --name create_users_table

# Run migrations
yarn sequelize db:migrate

# Undo migrations
yarn sequelize db:migrate:undo
```

---

## 🐳 Docker Services

### What's Included

The `docker-compose.yml` defines two services:

1. **PostgreSQL 16**
   - Database for persistent data storage
   - Port: 5432
   - Default credentials: `postgres:postgres`
   - Database: `pern_dev`
   - Data persists in `pgdata/` volume

2. **Redis 7**
   - In-memory cache and job queue backend
   - Port: 6379
   - Used by Bull for job queuing
   - Used by Socket.io for real-time features

### Common Docker Commands

```bash
# Start all services in the background
yarn docker:up

# View logs in real-time
yarn docker:logs

# Stop services
yarn docker:down

# Docker commands with manual docker-compose
docker-compose ps                 # See running containers
docker-compose logs postgres      # View PostgreSQL logs
docker-compose exec postgres psql -U postgres  # Connect to DB
docker-compose restart            # Restart all services
```

---

## 🌍 Environment Configuration

### .env File Structure

The `.env.example` file is pre-configured with sensible defaults. Copy and customize it:

```bash
cp .env.example .env
```

**Key Environment Variables:**

- `NODE_ENV`: Set to `development` for dev, `production` for production
- `DATABASE_URL`: PostgreSQL connection string (Sequelize format)
- `REDIS_URL`: Redis connection string
- `SERVER_PORT`: Backend server port (default: 5000)
- `VITE_API_URL`: Frontend API endpoint (default: http://localhost:5000/api)
- `LOG_LEVEL`: Winston logger level (info, debug, error, etc.)
- `JWT_SECRET`, `SESSION_SECRET`: Cryptographic secrets (change in production!)

### How Configuration Works (Backend)

```
apps/server/src/config/
├── index.ts      # Loads .env and exports config object
├── database.ts   # PostgreSQL/Sequelize config
├── redis.ts      # Redis config
└── logging.ts    # Winston logger config
```

The config is loaded once at startup and validated. If required env vars are missing, the app will exit with a clear error message.

---

## 📦 Understanding the Monorepo

### Workspaces

A yarn workspace allows multiple packages to be installed and linked together in a single repository. Dependencies are deduplicated at the root level.

**Key Benefits:**

- Single `node_modules` at root (shared dependencies, faster installs)
- Easy local development (import from `@shared/something` without npm link)
- Can build and publish packages independently
- Cleaner separation of concerns

**Working with Workspaces:**

```bash
# Install dependencies across all workspaces
yarn install

# Install a specific package to a workspace
yarn workspace server add express

# Run a script in a specific workspace
yarn workspace client build

# Run a script in all workspaces
yarn workspaces run test
```

### Shared Package

The `packages/shared` package exports types, constants, and utilities used by both frontend and backend:

```typescript
// In backend or frontend
import { createApiClient, API_BASE_URL } from '@shared/api';
import type { User } from '@shared/types';
import { API_ENDPOINTS } from '@shared/constants';
```

### Adding New Workspaces

To add a new app or package:

1. Create the directory: `mkdir -p apps/newapp` or `mkdir -p packages/newpkg`
2. Create `package.json` with name like `@pern/newapp` or `@shared/newpkg`
3. Add `workspaces` entry in root `package.json` (usually already done with `apps/*` and `packages/*`)
4. Run `yarn install`

---

## 🚀 Deployment

### Building for Production

```bash
# Build both frontend and backend
yarn build

# Or individually
yarn build:server    # Creates dist/ folder with compiled JS
yarn build:client    # Creates dist/ folder with optimized bundle
```

### Backend Deployment

The backend is a standard Node.js/Express application:

1. **Build**: `yarn build:server`
2. **Install production dependencies**: `yarn install --production`
3. **Set environment**: Configure `.env` on the server
4. **Run**: `node dist/index.js`

**Using Docker:**

Create a `Dockerfile` in `apps/server/`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN yarn install --production
COPY dist/ ./dist/
EXPOSE 5000
CMD ["node", "dist/index.js"]
```

### Frontend Deployment

The frontend is a static SPA that can be served by any HTTP server:

1. **Build**: `yarn build:client`
2. **Upload**: Push the `apps/client/dist/` folder to:
   - **Vercel** (recommended for React SPAs)
   - **Netlify**
   - **AWS S3 + CloudFront**
   - **Any static hosting** (GitHub Pages, etc.)
   - **Your own web server** (nginx, Apache)

**Environment Variables:**

Vite exposes variables prefixed with `VITE_` at build time. Set `VITE_API_URL` to your production backend URL before building.

---

## 🏗️ Architecture Deep Dive

### Backend Architecture Layers

```
┌─────────────────────────────┐
│    HTTP Request (Client)    │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│         Express Middleware Chain            │
│  ├─ CORS/Security headers                  │
│  ├─ Body parsing (JSON)                    │
│  ├─ Authentication/JWT validation          │
│  ├─ Error handling middleware              │
│  └─ Logging middleware                     │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│          Express Router                     │
│  Maps HTTP routes to controllers           │
│  (e.g., GET /api/users → usersController)  │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Controllers (Route Handlers)               │
│  ├─ Validate request data                  │
│  ├─ Call services for business logic       │
│  ├─ Format response                        │
│  └─ Handle and pass errors down            │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Services (Business Logic)                  │
│  ├─ Database queries via ORM              │
│  ├─ External API calls                     │
│  ├─ Job queue (Bull) interactions          │
│  ├─ Cache operations (Redis)               │
│  └─ Complex algorithms/computations        │
└──────────┬──────────────┬──────────────────┘
           │              │
           ▼              ▼
    ┌──────────┐   ┌─────────────┐
    │ Database │   │ Redis Cache │
    │(Sequelize)   │             │
    └──────────┘   └─────────────┘
```

**Why These Layers?**

- **Middleware**: Consistent request handling (compression, CORS, auth)
- **Router**: Maps URLs to logic, supports HTTP verbs
- **Controllers**: Thin handlers, separate concerns
- **Services**: Reusable business logic (can be called from controllers, websockets, jobs)
- **ORM/Database**: Abstraction over raw SQL (easier to test, migrate, switch databases)

### Frontend Architecture

```
┌─────────────────────────────────────────────┐
│          main.tsx (Vite Entry)              │
│  Bootstraps React app, mounts to DOM       │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  App.tsx (Root Component)                   │
│  ├─ Providers (Zustand, Theme, etc.)       │
│  └─ Route configuration (React Router)     │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Pages (Route Components)                   │
│  ├─ Dashboard page                         │
│  ├─ User list page                         │
│  ├─ etc.                                    │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Components (Reusable UI Pieces)            │
│  ├─ Button, Card, Modal, etc.              │
│  ├─ Use hooks for data fetching            │
│  ├─ Styled with Tailwind/Chakra            │
│  └─ Connect to Zustand stores              │
└──────────────┬──────────────────────────────┘
               │
         ┌─────┴─────┐
         │           │
         ▼           ▼
    ┌────────┐   ┌──────────┐
    │ Zustand│   │ API Hooks│
    │ Stores │   │(Axios)   │
    └────────┘   └──────────┘
         │           │
         └─────┬─────┘
               │
               ▼
    ┌──────────────────────┐
    │  Backend API         │
    │ (Express + Database) │
    └──────────────────────┘
```

**Why This Structure?**

- **Separation of concerns**: Pages handle routing, components handle UI
- **Reusability**: Components used across pages
- **State management**: Zustand for global state (user auth, theme, etc.)
- **Data fetching**: Hooks abstract API calls (easier to mock, test)
- **Styling**: Tailwind for utility classes, Chakra for component library

### Real-time Communication (Socket.io)

When you need **two-way, persistent connections** (chat, notifications, live updates):

```
Browser                              Server
  │                                    │
  │──── Initial HTTP Connection ─────► │
  │                                    │
  │◄──── Upgrade to WebSocket ────────│
  │                                    │
  │                                    │
  │ Socket.io connection established! │
  │                                    │
  │──── Emit Event (JSON) ────────────►│
  │     { type: 'message', data: {} }  │
  │                                    │
  │◄──── Emit Event (JSON) ───────────│
  │     { type: 'notification', ... }  │
  │                                    │
```

**Backend (apps/server/):**

```typescript
// apps/server/src/index.ts
import { Server } from 'socket.io';

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle incoming events
  socket.on('message', (data) => {
    // Process message, save to DB, etc.
    io.emit('message_broadcast', data); // Send to all clients
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});
```

**Frontend (apps/client/):**

```typescript
// apps/client/src/hooks/useSocket.ts
import { useEffect } from 'react';
import { io } from 'socket.io-client';

export function useSocket() {
  useEffect(() => {
    const socket = io(process.env.VITE_API_URL);

    socket.on('message_broadcast', (data) => {
      console.log('Received:', data);
      // Update Zustand store with new message
    });

    return () => socket.disconnect();
  }, []);
}
```

### Job Queue with Bull + Redis

For **long-running or scheduled tasks** (sending emails, processing images, batch jobs):

```
Frontend                                         Backend
  │                                               │
  │ POST /api/send-email                        │
  │────────────────────────────────────────────►│
  │                                               │
  │ 202 Accepted (with job ID)                   │
  │◄────────────────────────────────────────────│
  │                                               │
  │                                         Queue (Redis)
  │                                          {
  │                                            type: 'send-email',
  │                                            to: 'user@example.com'
  │                                          }
  │                                               │
  │                                        Worker Process
  │                                         (separate thread)
  │                                               │
  │                                        Sends actual email
  │                                               │
  │                                        Marks job as done
```

**Backend Usage:**

```typescript
// apps/server/src/index.ts
import Queue from 'bull';
import redis from './config/redis';

// Create a job queue backed by Redis
const emailQueue = new Queue('send-email', redis);

// Process jobs from the queue
emailQueue.process(async (job) => {
  const { to, subject, body } = job.data;
  await sendEmailViaSMTP(to, subject, body);
  return { success: true };
});

// In a controller: Add job to queue
export async function sendEmailHandler(req, res) {
  const { to, subject, body } = req.body;
  
  // Add to queue and return immediately
  const job = await emailQueue.add({ to, subject, body });
  
  res.json({ jobId: job.id, status: 'queued' });
}
```

---

## 🔐 Security Best Practices

### Implemented in This Scaffold

1. **Environment Secrets**: Database credentials, JWT secrets stored in `.env` (never committed)
2. **CORS Configuration**: Express configured to accept requests from frontend only
3. **Error Handling**: Sensitive error details not exposed to clients
4. **Input Validation**: joi schemas validate request payloads
5. **Password Hashing**: bcryptjs hashes passwords before storage

### Before Deployment

1. Change all secrets in production:
   - `JWT_SECRET`
   - `SESSION_SECRET`
   - `DB_PASSWORD`
2. Set `NODE_ENV=production`
3. Set `LOG_LEVEL=error` (don't leak debug info)
4. Use HTTPS (never HTTP in production!)
5. Configure CORS to specific frontend domain
6. Run security audit: `npm audit`

---

## 📚 Useful Documentation Links

- **Express.js**: https://expressjs.com/
- **React**: https://react.dev/
- **TypeScript**: https://www.typescriptlang.org/
- **Vite**: https://vitejs.dev/
- **Zustand**: https://github.com/pmndrs/zustand
- **Sequelize ORM**: https://sequelize.org/
- **Bull (Job Queue)**: https://github.com/OptimalBits/bull
- **Socket.io**: https://socket.io/
- **Tailwind CSS**: https://tailwindcss.com/
- **Chakra UI**: https://chakra-ui.com/
- **Docker Compose**: https://docs.docker.com/compose/
- **PostgreSQL**: https://www.postgresql.org/docs/

---

## 🤝 Contributing

### Making a Change

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes following code style
3. Git hooks will automatically lint and format before commit
4. Push your branch: `git push origin feature/my-feature`
5. Open a pull request

### Code Style

Automatically enforced by Prettier and ESLint:

```bash
yarn format   # Format all files
yarn lint:fix # Fix linting issues
```

### Testing (Future)

```bash
yarn test     # Run all tests
```

---

## 📝 Common Tasks & Recipes

### Adding a New API Endpoint

**1. Create/update the route** (`apps/server/src/routes/users.ts`):

```typescript
import { Router } from 'express';
import { getUsers } from '../controllers/usersController';

const router = Router();

router.get('/', getUsers);

export default router;
```

**2. Create the controller** (`apps/server/src/controllers/usersController.ts`):

```typescript
import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';

export async function getUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const users = await User.findAll();
    res.json({ data: users });
  } catch (error) {
    next(error);
  }
}
```

**3. Register the route** (`apps/server/src/index.ts`):

```typescript
import usersRouter from './routes/users';

app.use('/api/users', usersRouter);
```

### Adding a New Frontend Component

**1. Create the component** (`apps/client/src/components/UserCard.tsx`):

```typescript
import React from 'react';
import { Box, Text, Button } from '@chakra-ui/react';

interface UserCardProps {
  name: string;
  email: string;
  onDelete?: () => void;
}

export function UserCard({ name, email, onDelete }: UserCardProps) {
  return (
    <Box p={4} border="1px" borderColor="gray.300" rounded="md">
      <Text fontWeight="bold">{name}</Text>
      <Text color="gray.600">{email}</Text>
      {onDelete && <Button onClick={onDelete}>Delete</Button>}
    </Box>
  );
}
```

**2. Use the component** (`apps/client/src/pages/Users.tsx`):

```typescript
import { useEffect, useState } from 'react';
import { UserCard } from '../components/UserCard';
import { apiClient } from '../api/client';

export function UsersPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    apiClient.get('/users').then((res) => setUsers(res.data));
  }, []);

  return (
    <div>
      {users.map((user) => (
        <UserCard key={user.id} name={user.name} email={user.email} />
      ))}
    </div>
  );
}
```

### Setting Up Authentication (JWT)

See the auth examples in `apps/server/src/middleware/` and implement token validation on protected routes.

---

## 🐛 Troubleshooting

### "Cannot find module '@shared/...'"

**Solution**: Ensure `packages/shared/src/` exists and is exported from `packages/shared/package.json`:

```json
{
  "exports": {
    "./api": "./src/api/index.ts",
    "./types": "./src/types/index.ts"
  }
}
```

Then run `yarn install` to rebuild symlinks.

### PostgreSQL Connection Refused

**Solution**: Check Docker is running:

```bash
docker-compose ps
```

If containers aren't running, start them:

```bash
yarn docker:up
```

### Port Already in Use

**Solution**: Change the port in `.env` or stop the process using the port:

```bash
# macOS/Linux: Find process on port 5000
lsof -i :5000

# Windows: Find process on port 5000
netstat -ano | findstr :5000
```

---

## 📄 License

MIT

---

**Happy coding! 🚀 Questions? Check the docs or open an issue!**
