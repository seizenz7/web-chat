/**
 * 404 Not Found Page
 *
 * Shown when user navigates to a non-existent route.
 */

import { Box, Heading, Text, Button } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <Box textAlign="center" py={20}>
      <Heading as="h1" size="2xl" mb={4} color="blue.600">
        404
      </Heading>
      <Text fontSize="lg" color="gray.600" mb={6}>
        Page not found. It might have been moved or deleted.
      </Text>
      <Button as={RouterLink} to="/" colorScheme="blue">
        Go Home
      </Button>
    </Box>
  );
}
