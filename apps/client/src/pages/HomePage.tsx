/**
 * Home Page
 *
 * Landing page with:
 * - Welcome message
 * - Architecture overview
 * - Links to key features
 * - Getting started guide
 */

import { Box, Heading, Text, Button, VStack, HStack, Code, useColorMode } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

export default function HomePage() {
  const { colorMode } = useColorMode();

  return (
    <VStack spacing={8} align="start">
      {/* Hero Section */}
      <Box w="full" py={8} bg="blue.50" rounded="lg" p={8}>
        <Heading as="h1" size="2xl" mb={4} color="blue.700">
          Welcome to PERN Stack
        </Heading>
        <Text fontSize="lg" color="gray.600" mb={6}>
          A production-ready PostgreSQL + Express + React + Node.js monorepo scaffold with modern
          tooling, Docker support, and comprehensive documentation.
        </Text>
        <HStack spacing={4}>
          <Button as={RouterLink} to="/examples" colorScheme="blue">
            View Examples
          </Button>
          <Button variant="outline" colorScheme="blue">
            Read Docs
          </Button>
        </HStack>
      </Box>

      {/* Tech Stack Overview */}
      <Box w="full">
        <Heading as="h2" size="lg" mb={4}>
          Tech Stack
        </Heading>
        <HStack spacing={4} wrap="wrap">
          <TechBadge name="PostgreSQL 16" description="Persistent data storage" />
          <TechBadge name="Express 5" description="Backend framework" />
          <TechBadge name="React 19" description="UI library" />
          <TechBadge name="Node.js" description="Runtime" />
          <TechBadge name="TypeScript" description="Type safety" />
          <TechBadge name="Redis" description="Cache & queues" />
          <TechBadge name="Socket.io" description="Real-time" />
          <TechBadge name="Zustand" description="State management" />
        </HStack>
      </Box>

      {/* Architecture Overview */}
      <Box w="full">
        <Heading as="h2" size="lg" mb={4}>
          Architecture
        </Heading>
        <Box bg="gray.100" p={4} rounded="lg" fontFamily="monospace" fontSize="sm" overflowX="auto">
          <pre>{`
┌─────────────────────────────────────────────┐
│          React Browser App                  │
│       (Vite + React + Zustand)              │
└─────────────────┬───────────────────────────┘
                  │ HTTP/WebSocket
                  ▼
┌─────────────────────────────────────────────┐
│      Express Server (Node.js)               │
│  ├─ API Routes                              │
│  ├─ Socket.io Real-time                     │
│  └─ Bull Job Queue                          │
└─────────────────┬───────────────────────────┘
                  │
        ┌─────────┼─────────┐
        │         │         │
        ▼         ▼         ▼
     PostgreSQL  Redis   External APIs
        (DB)    (Cache)
          `}</pre>
        </Box>
      </Box>

      {/* Key Features */}
      <Box w="full">
        <Heading as="h2" size="lg" mb={4}>
          ✨ Features
        </Heading>
        <VStack align="start" spacing={3}>
          <FeatureItem
            title="Monorepo Structure"
            description="apps/server, apps/client, packages/shared with yarn workspaces"
          />
          <FeatureItem
            title="Docker Compose"
            description="PostgreSQL & Redis ready to go with one command"
          />
          <FeatureItem
            title="TypeScript Support"
            description="Full type safety on both frontend and backend"
          />
          <FeatureItem
            title="Real-time Features"
            description="Socket.io configured for live updates and notifications"
          />
          <FeatureItem
            title="Job Queues"
            description="Bull integration for background tasks (emails, reports, etc.)"
          />
          <FeatureItem
            title="Code Quality"
            description="ESLint, Prettier, and Husky git hooks for consistency"
          />
          <FeatureItem title="Production Ready" description="Error handling, logging, and security best practices" />
        </VStack>
      </Box>

      {/* Quick Start */}
      <Box w="full">
        <Heading as="h2" size="lg" mb={4}>
          🚀 Quick Start
        </Heading>
        <VStack align="start" spacing={2} bg="gray.100" p={4} rounded="lg">
          <Text fontWeight="bold">1. Install dependencies</Text>
          <Code bg="gray.200" p={2} rounded="md">
            yarn install
          </Code>

          <Text fontWeight="bold" mt={2}>
            2. Start Docker services
          </Text>
          <Code bg="gray.200" p={2} rounded="md">
            yarn docker:up
          </Code>

          <Text fontWeight="bold" mt={2}>
            3. Run development servers
          </Text>
          <Code bg="gray.200" p={2} rounded="md">
            yarn dev
          </Code>

          <Text mt={2} fontSize="sm" color="gray.600">
            Frontend: http://localhost:5173 | Backend: http://localhost:5000
          </Text>
        </VStack>
      </Box>
    </VStack>
  );
}

/**
 * Reusable component for tech stack badges
 */
function TechBadge({ name, description }: { name: string; description: string }) {
  return (
    <Box bg="blue.50" p={3} rounded="lg" border="1px" borderColor="blue.200" flex="1" minW="150px">
      <Text fontWeight="bold" color="blue.700">
        {name}
      </Text>
      <Text fontSize="sm" color="gray.600">
        {description}
      </Text>
    </Box>
  );
}

/**
 * Reusable component for feature list items
 */
function FeatureItem({ title, description }: { title: string; description: string }) {
  return (
    <Box>
      <Text fontWeight="bold" color="blue.600">
        {title}
      </Text>
      <Text color="gray.600" fontSize="sm">
        {description}
      </Text>
    </Box>
  );
}
