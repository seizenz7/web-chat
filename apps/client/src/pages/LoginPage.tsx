/**
 * Login Page
 *
 * UX note:
 * - If the backend responds with TOTP_REQUIRED, we reveal the TOTP field.
 * - This teaches beginners how 2FA changes the login flow.
 */

import { useEffect, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Link,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const login = useAuthStore((s) => s.login);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [showTotp, setShowTotp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (error?.code === 'TOTP_REQUIRED') {
      setShowTotp(true);
    }
  }, [error?.code]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();

    setIsSubmitting(true);
    try {
      await login({ identifier, password, totpCode: showTotp ? totpCode : undefined });

      const to = (location.state as any)?.from || '/account';
      navigate(to);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Box maxW="lg" mx="auto" mt={10} bg="white" p={8} rounded="lg" boxShadow="sm">
      <VStack align="start" spacing={6}>
        <Box>
          <Heading size="lg">Log in</Heading>
          <Text mt={2} color="gray.600">
            Access tokens are short-lived and stored in memory. Refresh tokens stay in a secure httpOnly
            cookie, so the browser can refresh your session without exposing the refresh token to JS.
          </Text>
        </Box>

        {error ? (
          <Alert status="error">
            <AlertIcon />
            {error.message}
          </Alert>
        ) : null}

        <Box as="form" w="full" onSubmit={onSubmit}>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>Email or username</FormLabel>
              <Input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="alice@example.com or alice_wonderland"
                autoComplete="username"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Password</FormLabel>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••••••"
                autoComplete="current-password"
              />
            </FormControl>

            {showTotp ? (
              <FormControl isRequired>
                <FormLabel>2FA code</FormLabel>
                <Input
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="123456"
                  inputMode="numeric"
                />
                <Text fontSize="sm" color="gray.600" mt={1}>
                  This is the 6-digit code from your authenticator app.
                </Text>
              </FormControl>
            ) : null}

            <Button type="submit" colorScheme="blue" isLoading={isSubmitting}>
              Log in
            </Button>

            <Text fontSize="sm" color="gray.600">
              No account yet?{' '}
              <Link as={RouterLink} to="/register" color="blue.600">
                Create one
              </Link>
            </Text>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
}
