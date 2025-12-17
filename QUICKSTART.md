# 🚀 PERN Stack - Quick Start Guide

Get a fully functional PERN (PostgreSQL, Express, React, Node) application running in **5 minutes**.

## ⚡ One-Command Setup

```bash
bash setup.sh
```

This script will:
- ✅ Check prerequisites (Node.js, Docker, yarn)
- ✅ Install all dependencies
- ✅ Configure environment variables
- ✅ Set up Git hooks
- ✅ Start Docker containers (PostgreSQL + Redis)

## 🎯 Start Development

After setup completes, in a new terminal:

```bash
yarn dev
```

You'll see both servers starting:

```
┌─────────────────────────────────────┐
│   ▲ Frontend: http://localhost:5173 │
│   │ (Vite - hot reload enabled)     │
│                                     │
│   ▲ Backend: http://localhost:5000  │
│   │ (Express - auto-restart)        │
│                                     │
│   ▲ PostgreSQL on localhost:5432    │
│   │ (Docker - ready for queries)    │
│                                     │
│   ▲ Redis on localhost:6379         │
│   │ (Docker - caching & jobs)       │
└─────────────────────────────────────┘
```

## 📖 Next Steps

1. **Open the app**: http://localhost:5173
   - You'll see the PERN home page with documentation
   - Click "Examples" to see API integration in action

2. **Explore the code**:
   - Backend: `apps/server/src/` - Express API
   - Frontend: `apps/client/src/` - React components
   - Shared: `packages/shared/src/` - Shared types & utilities

3. **Make a change**:
   - Edit `apps/client/src/pages/HomePage.tsx`
   - Save the file → Hot reload in browser (instant!)
   - Edit `apps/server/src/routes/example.ts`
   - Server restarts automatically

4. **Read the docs**:
   - `README.md` - Full architecture & tech stack
   - `DEVELOPMENT.md` - Development workflow & patterns
   - Code comments - Detailed explanations for learning

## 🐛 Common Commands

```bash
# Start everything
yarn dev

# Backend only
yarn dev:server

# Frontend only  
yarn dev:client

# Check code quality
yarn lint
yarn lint:fix
yarn format

# Type checking (also runs on git push)
yarn type-check

# Docker management
yarn docker:up      # Start services
yarn docker:down    # Stop services
yarn docker:logs    # View logs
```

## 📚 Key Files to Know

```
pern-monorepo/
├── README.md              # Architecture overview & tech stack
├── DEVELOPMENT.md         # Development guide & patterns
├── QUICKSTART.md          # This file!
├── docker-compose.yml     # PostgreSQL & Redis config
├── apps/
│   ├── server/            # Express backend
│   │   ├── src/
│   │   │   ├── index.ts   # Server entry point
│   │   │   ├── config/    # Environment & configuration
│   │   │   ├── routes/    # API routes
│   │   │   └── services/  # Business logic
│   │   └── .env.example   # Copy to .env to configure
│   │
│   └── client/            # React frontend
│       ├── src/
│       │   ├── main.tsx   # App entry point
│       │   ├── App.tsx    # Root component
│       │   ├── pages/     # Page components
│       │   ├── stores/    # Zustand state management
│       │   └── hooks/     # Custom React hooks
│       └── .env.example   # Copy to .env to configure
│
└── packages/
    └── shared/            # Shared types, constants, utilities
        ├── src/
        │   ├── api/       # API helpers
        │   ├── types/     # TypeScript types
        │   └── constants/ # Shared constants
```

## 🌐 API Endpoints

The backend provides these example endpoints:

```bash
# Health checks
GET /api/health              # Simple status check
GET /api/health/deep         # Detailed dependency status

# Examples CRUD
GET    /api/example          # List all examples
GET    /api/example/:id      # Get single example
POST   /api/example          # Create example
PUT    /api/example/:id      # Replace example
PATCH  /api/example/:id      # Partial update
DELETE /api/example/:id      # Delete example
```

Test with curl:

```bash
# Get all examples
curl http://localhost:5000/api/example

# Create an example
curl -X POST http://localhost:5000/api/example \
  -H "Content-Type: application/json" \
  -d '{"name": "My Example"}'

# Get health status
curl http://localhost:5000/api/health
```

## 💡 Architecture at a Glance

```
┌────────────────────────────────────────────────┐
│  Browser (React 19 + Vite + Zustand)           │
│  - Renders UI                                   │
│  - Manages client state                        │
│  - Makes API calls                             │
└────────────────────┬─────────────────────────────┘
                     │ HTTP + WebSocket
                     │ (Socket.io)
                     ▼
┌────────────────────────────────────────────────┐
│  Server (Express 5 + Node.js + TypeScript)     │
│  - Routes HTTP requests                        │
│  - Handles WebSocket connections               │
│  - Business logic in services                  │
│  - Jobs queued with Bull                       │
└────────────┬───────────────┬────────┬──────────┘
             │               │        │
             ▼               ▼        ▼
        PostgreSQL        Redis   External
        (Persist)      (Cache)      APIs
```

## 🔑 Key Features

- ✅ **Monorepo**: Multiple apps in one repo
- ✅ **TypeScript**: Full type safety throughout
- ✅ **Real-time**: Socket.io configured and ready
- ✅ **Background Jobs**: Bull job queue with Redis
- ✅ **Database**: PostgreSQL + Sequelize ORM
- ✅ **Styling**: Tailwind CSS + Chakra UI
- ✅ **State Management**: Zustand (lightweight)
- ✅ **Code Quality**: ESLint, Prettier, Husky
- ✅ **Docker**: PostgreSQL & Redis ready to go
- ✅ **Logging**: Winston configured
- ✅ **Error Handling**: Centralized middleware
- ✅ **Validation**: Joi schemas

## ⚙️ Environment Variables

Default values are ready for local development. Change if needed:

**Backend** (apps/server/.env):
- `SERVER_PORT`: Backend server port (default: 5000)
- `DATABASE_URL`: PostgreSQL connection
- `REDIS_URL`: Redis connection
- `LOG_LEVEL`: debug, info, warn, error

**Frontend** (apps/client/.env):
- `VITE_API_URL`: Backend API URL (default: http://localhost:5000/api)
- `VITE_SOCKET_URL`: WebSocket server (default: http://localhost:5000)

## 🆘 Troubleshooting

### "Port 5000 already in use"
```bash
# Find and kill the process
lsof -i :5000
kill -9 <PID>

# Or change port in .env
echo "SERVER_PORT=5001" >> .env
```

### "Cannot connect to Docker services"
```bash
# Check if Docker is running
docker ps

# Start containers
yarn docker:up

# Check logs
yarn docker:logs
```

### "Module not found '@shared/...' "
```bash
# Reinstall dependencies
rm -rf node_modules yarn.lock
yarn install
```

### "Changes not showing up"
- **Frontend**: Refresh the browser (usually auto-reloads)
- **Backend**: Check the terminal for errors
- **Shared package**: May need to restart dev servers

## 📖 Learn More

- **Full Documentation**: See `README.md`
- **Development Patterns**: See `DEVELOPMENT.md`
- **Code Comments**: Every file has detailed comments for learning
- **Official Docs**:
  - Express: https://expressjs.com/
  - React: https://react.dev/
  - Vite: https://vitejs.dev/
  - Zustand: https://github.com/pmndrs/zustand
  - PostgreSQL: https://www.postgresql.org/

## 🚀 What's Next?

1. **Add a new API endpoint**
   - Create route in `apps/server/src/routes/`
   - Create controller in `apps/server/src/controllers/`
   - Test with curl or Postman

2. **Add a new frontend page**
   - Create component in `apps/client/src/pages/`
   - Add route in `App.tsx`
   - Use custom hooks for API calls

3. **Understand the database**
   - Models go in `apps/server/src/models/`
   - Migrations in `apps/server/migrations/`
   - Run: `yarn sequelize db:migrate`

4. **Real-time features**
   - Emit events in `apps/server/src/services/socketService.ts`
   - Listen in frontend with `socket.on()`
   - See examples in the code

5. **Background jobs**
   - Add jobs in `apps/server/src/services/queueService.ts`
   - Queue them from controllers
   - Process asynchronously

## 🎓 Educational Value

This scaffold is designed to teach full-stack development. Every file includes:
- Clear explanations of what code does
- Why patterns are used
- Links to official documentation
- Best practices for production use

Great for:
- Learning full-stack development
- Understanding PERN architecture
- Reference for your own projects
- Teaching others

## 💬 Got Questions?

1. Check the inline code comments
2. Read the full documentation (README.md)
3. Look at existing examples in the code
4. Check official documentation for libraries

---

**Happy coding! 🎉**

You now have a professional, production-ready PERN stack. Start building!
