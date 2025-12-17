/**
 * Examples Page
 *
 * Demonstrates:
 * - Fetching data from the API
 * - Using custom hooks
 * - State management with Zustand
 * - Error handling
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Button,
  VStack,
  HStack,
  Input,
  Text,
  Spinner,
  useToast,
  Card,
  CardBody,
} from '@chakra-ui/react';
import { useApiClient } from '../hooks/useApiClient';
import { useExampleStore } from '../stores/exampleStore';

interface Example {
  id: number;
  name: string;
  createdAt: string;
}

export default function ExamplesPage() {
  const toast = useToast();
  const apiClient = useApiClient();
  const { examples, setExamples, isLoading, setIsLoading, error, setError } = useExampleStore();
  const [newName, setNewName] = useState('');

  /**
   * Fetch examples on mount
   */
  useEffect(() => {
    fetchExamples();
  }, []);

  /**
   * Fetch examples from API
   */
  const fetchExamples = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get('/example');
      setExamples(response.data.data);
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || 'Failed to fetch examples';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create a new example
   */
  const handleCreateExample = async () => {
    if (!newName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a name',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      const response = await apiClient.post('/example', { name: newName });
      setExamples([...examples, response.data.data]);
      setNewName('');
      toast({
        title: 'Success',
        description: 'Example created successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (err: any) {
      const message = err.response?.data?.error || err.message;
      toast({
        title: 'Error',
        description: message,
        status: 'error',
        duration: 5000,
      });
    }
  };

  /**
   * Delete an example
   */
  const handleDeleteExample = async (id: number) => {
    try {
      await apiClient.delete(`/example/${id}`);
      setExamples(examples.filter((ex) => ex.id !== id));
      toast({
        title: 'Success',
        description: 'Example deleted successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.error || err.message,
        status: 'error',
        duration: 5000,
      });
    }
  };

  return (
    <VStack spacing={6} align="start" w="full">
      <Box>
        <Heading as="h1" size="xl" mb={2}>
          Examples
        </Heading>
        <Text color="gray.600">
          This page demonstrates API integration, state management, and error handling.
        </Text>
      </Box>

      {/* Create Example Form */}
      <Card w="full" bg="blue.50" borderColor="blue.200" borderWidth="1px">
        <CardBody>
          <Heading as="h3" size="md" mb={4}>
            Add New Example
          </Heading>
          <HStack spacing={2}>
            <Input
              placeholder="Enter example name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleCreateExample();
              }}
            />
            <Button colorScheme="blue" onClick={handleCreateExample}>
              Create
            </Button>
            <Button variant="outline" onClick={fetchExamples}>
              Refresh
            </Button>
          </HStack>
        </CardBody>
      </Card>

      {/* Error Message */}
      {error && (
        <Box bg="red.50" borderColor="red.200" borderWidth="1px" p={4} rounded="lg" w="full">
          <Text color="red.700">
            <strong>Error:</strong> {error}
          </Text>
        </Box>
      )}

      {/* Loading State */}
      {isLoading && (
        <Box textAlign="center" w="full" py={8}>
          <Spinner color="blue.500" size="lg" />
          <Text mt={4}>Loading examples...</Text>
        </Box>
      )}

      {/* Examples List */}
      {!isLoading && examples.length > 0 && (
        <VStack spacing={3} w="full">
          <Heading as="h3" size="md">
            Examples ({examples.length})
          </Heading>
          {examples.map((example) => (
            <ExampleCard
              key={example.id}
              example={example}
              onDelete={() => handleDeleteExample(example.id)}
            />
          ))}
        </VStack>
      )}

      {/* Empty State */}
      {!isLoading && examples.length === 0 && (
        <Box bg="gray.50" p={8} rounded="lg" textAlign="center" w="full">
          <Text color="gray.500">No examples yet. Create one above to get started!</Text>
        </Box>
      )}

      {/* Code Examples */}
      <Box w="full">
        <Heading as="h3" size="md" mb={4}>
          How This Works
        </Heading>
        <VStack align="start" spacing={4}>
          <Box>
            <Text fontWeight="bold" mb={2}>
              1. API Client Hook (useApiClient)
            </Text>
            <Code bg="gray.100" p={3} rounded="md">
              <pre>{`const apiClient = useApiClient();
const response = await apiClient.get('/example');`}</pre>
            </Code>
          </Box>

          <Box>
            <Text fontWeight="bold" mb={2}>
              2. State Management (Zustand Store)
            </Text>
            <Code bg="gray.100" p={3} rounded="md">
              <pre>{`const { examples, setExamples } = useExampleStore();
// Zustand provides simple, hook-based state`}</pre>
            </Code>
          </Box>

          <Box>
            <Text fontWeight="bold" mb={2}>
              3. Error Handling
            </Text>
            <Code bg="gray.100" p={3} rounded="md">
              <pre>{`try {
  const response = await apiClient.post('/example', data);
  // Update state on success
} catch (error) {
  // Show user-friendly error message
}`}</pre>
            </Code>
          </Box>
        </VStack>
      </Box>
    </VStack>
  );
}

/**
 * Example Card Component
 */
function ExampleCard({
  example,
  onDelete,
}: {
  example: Example;
  onDelete: () => void;
}) {
  return (
    <Card w="full">
      <CardBody>
        <HStack justify="space-between" align="start">
          <Box>
            <Heading as="h4" size="sm" mb={2}>
              {example.name}
            </Heading>
            <Text fontSize="sm" color="gray.600">
              ID: {example.id}
            </Text>
            <Text fontSize="sm" color="gray.600">
              Created: {new Date(example.createdAt).toLocaleString()}
            </Text>
          </Box>
          <Button size="sm" colorScheme="red" variant="outline" onClick={onDelete}>
            Delete
          </Button>
        </HStack>
      </CardBody>
    </Card>
  );
}

/**
 * Code component with proper formatting
 */
function Code({ children, ...props }: any) {
  return (
    <Box fontFamily="monospace" fontSize="sm" whiteSpace="pre-wrap" {...props}>
      {children}
    </Box>
  );
}
