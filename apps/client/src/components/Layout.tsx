/**
 * Layout Component
 *
 * Wraps all pages with common UI elements:
 * - Header/Navigation
 * - Sidebar (if needed)
 * - Footer
 *
 * The children prop contains the current page.
 */

import React from 'react';
import { Box, Container, Flex, Heading, HStack, Link } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <Flex direction="column" minH="100vh" bg="gray.50">
      {/* Header/Navigation */}
      <Box bg="white" boxShadow="sm" borderBottom="1px" borderColor="gray.200">
        <Container maxW="container.xl" py={4}>
          <Flex justify="space-between" align="center">
            <Heading as="h1" size="lg" color="blue.600">
              PERN App
            </Heading>
            <HStack spacing={6}>
              <Link as={RouterLink} to="/" _hover={{ textDecoration: 'none', color: 'blue.600' }}>
                Home
              </Link>
              <Link
                as={RouterLink}
                to="/examples"
                _hover={{ textDecoration: 'none', color: 'blue.600' }}
              >
                Examples
              </Link>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Box flex={1}>{children}</Box>

      {/* Footer */}
      <Box bg="gray.800" color="white" py={6} mt={8}>
        <Container maxW="container.xl">
          <Flex justify="space-between" align="start" mb={4}>
            <Box>
              <Heading as="h4" size="sm" mb={2}>
                PERN Stack
              </Heading>
              <Box fontSize="sm" color="gray.300">
                PostgreSQL • Express • React • Node.js
              </Box>
            </Box>
            <Box>
              <Heading as="h4" size="sm" mb={2}>
                Links
              </Heading>
              <Box as="ul" fontSize="sm" color="gray.300">
                <li>
                  <Link href="https://expressjs.com/" isExternal>
                    Express
                  </Link>
                </li>
                <li>
                  <Link href="https://react.dev/" isExternal>
                    React
                  </Link>
                </li>
                <li>
                  <Link href="https://www.postgresql.org/" isExternal>
                    PostgreSQL
                  </Link>
                </li>
              </Box>
            </Box>
          </Flex>
          <Box borderTop="1px solid" borderColor="gray.700" pt={4} fontSize="sm" color="gray.400">
            © 2024 PERN Monorepo. Built with ❤️ for beginners learning full-stack development.
          </Box>
        </Container>
      </Box>
    </Flex>
  );
}
