/**
 * Account Page (Protected)
 */

import { Box, Button, Code, Heading, Text, VStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function AccountPage() {
  const navigate = useNavigate();

  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);

  if (!user) {
    return null;
  }

  return (
    <Box maxW="lg" mx="auto" mt={10} bg="white" p={8} rounded="lg" boxShadow="sm">
      <VStack align="start" spacing={4}>
        <Heading size="lg">Your account</Heading>

        <Text color="gray.700">
          Logged in as <b>{user.displayName}</b> ({user.email})
        </Text>

        <Text fontSize="sm" color="gray.600">
          2FA: {user.totpEnabled ? 'Enabled' : 'Disabled'}
        </Text>

        <Box w="full">
          <Text fontSize="sm" color="gray.600" mb={2}>
            Access token (stored in-memory only)
          </Text>
          <Code display="block" p={3} whiteSpace="pre-wrap" maxH="120px" overflowY="auto">
            {accessToken}
          </Code>
          <Text mt={2} fontSize="sm" color="gray.600">
            This value disappears on full page reload. The app re-fetches a fresh access token using the
            refresh cookie.
          </Text>
        </Box>

        <Button
          colorScheme="red"
          onClick={async () => {
            await logout();
            navigate('/login');
          }}
        >
          Log out
        </Button>
      </VStack>
    </Box>
  );
}
