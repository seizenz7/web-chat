/**
 * Register Page
 *
 * Educational UI notes:
 * - Client-side validation is UX only. The backend enforces password strength.
 * - Enabling 2FA returns a TOTP secret that should be saved immediately.
 */

import { useMemo, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Checkbox,
  Code,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Link,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

function passwordRules(password: string) {
  return {
    minLength: password.length >= 12,
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
    noSpaces: !/\s/.test(password),
  };
}

export default function RegisterPage() {
  const navigate = useNavigate();

  const register = useAuthStore((s) => s.register);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);
  const totpSetup = useAuthStore((s) => s.totpSetup);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [enable2fa, setEnable2fa] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rules = useMemo(() => passwordRules(password), [password]);
  const passwordOk = Object.values(rules).every(Boolean);

  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();

    if (mismatch) return;

    setIsSubmitting(true);
    try {
      await register({ username, email, displayName, password, enable2fa });

      // If the user enabled 2FA, we intentionally stay on this screen so they can copy the secret.
      if (!enable2fa) {
        navigate('/account');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Box maxW="lg" mx="auto" mt={10} bg="white" p={8} rounded="lg" boxShadow="sm">
      <VStack align="start" spacing={6}>
        <Box>
          <Heading size="lg">Create your account</Heading>
          <Text mt={2} color="gray.600">
            We hash your password with <b>bcrypt</b> (slow-by-design), and we keep refresh tokens in an{' '}
            <b>httpOnly</b> cookie so JavaScript can’t read them.
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
              <FormLabel>Username</FormLabel>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="alice_wonderland"
                autoComplete="username"
              />
              <Text fontSize="sm" color="gray.500" mt={1}>
                Lowercase letters, numbers, underscores. (This is enforced on the backend.)
              </Text>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="alice@example.com"
                autoComplete="email"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Display name</FormLabel>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Alice Wonderland"
                autoComplete="name"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Password</FormLabel>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••••••"
                autoComplete="new-password"
              />
              <Box mt={2} fontSize="sm" color="gray.600">
                <Text fontWeight="semibold" mb={1}>
                  Password rules (server-enforced)
                </Text>
                <VStack align="start" spacing={0}>
                  <Text color={rules.minLength ? 'green.600' : 'gray.600'}>• At least 12 characters</Text>
                  <Text color={rules.lower ? 'green.600' : 'gray.600'}>• Lowercase letter</Text>
                  <Text color={rules.upper ? 'green.600' : 'gray.600'}>• Uppercase letter</Text>
                  <Text color={rules.number ? 'green.600' : 'gray.600'}>• Number</Text>
                  <Text color={rules.symbol ? 'green.600' : 'gray.600'}>• Symbol</Text>
                  <Text color={rules.noSpaces ? 'green.600' : 'gray.600'}>• No spaces</Text>
                </VStack>
              </Box>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Confirm password</FormLabel>
              <Input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type="password"
                placeholder="••••••••••••"
                autoComplete="new-password"
              />
              {mismatch ? (
                <Text mt={1} fontSize="sm" color="red.600">
                  Passwords do not match.
                </Text>
              ) : null}
            </FormControl>

            <Checkbox isChecked={enable2fa} onChange={(e) => setEnable2fa(e.target.checked)}>
              Enable 2FA (TOTP) — optional but recommended
            </Checkbox>

            <Button type="submit" colorScheme="blue" isLoading={isSubmitting} isDisabled={!passwordOk || mismatch}>
              Create account
            </Button>

            <Text fontSize="sm" color="gray.600">
              Already have an account?{' '}
              <Link as={RouterLink} to="/login" color="blue.600">
                Log in
              </Link>
            </Text>
          </VStack>
        </Box>

        {totpSetup ? (
          <Box w="full" p={4} bg="yellow.50" border="1px" borderColor="yellow.200" rounded="md">
            <Heading size="sm" mb={2}>
              2FA setup (copy this now)
            </Heading>
            <Text fontSize="sm" color="gray.700" mb={3}>
              Scan the QR in an authenticator app (Google Authenticator, 1Password, Authy) using this
              otpauth URL, or copy the secret.
            </Text>
            <Text fontSize="sm" fontWeight="semibold">
              Secret
            </Text>
            <Code display="block" p={2} whiteSpace="pre-wrap" mb={3}>
              {totpSetup.secret}
            </Code>
            <Text fontSize="sm" fontWeight="semibold">
              otpauth URL
            </Text>
            <Code display="block" p={2} whiteSpace="pre-wrap" mb={3}>
              {totpSetup.otpauthUrl}
            </Code>
            <Button colorScheme="blue" onClick={() => navigate('/account')}>
              Continue
            </Button>
          </Box>
        ) : null}
      </VStack>
    </Box>
  );
}
