/**
 * Example Store (Zustand)
 *
 * Zustand is a lightweight state management library that:
 * - Uses React hooks directly (no Provider needed if not required)
 * - Has minimal boilerplate
 * - Supports DevTools
 * - Works with TypeScript
 *
 * This store manages the state for the Examples page:
 * - List of examples
 * - Loading state
 * - Error state
 */

import { create } from 'zustand';

interface Example {
  id: number;
  name: string;
  createdAt: string;
}

interface ExampleState {
  // State
  examples: Example[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setExamples: (examples: Example[]) => void;
  addExample: (example: Example) => void;
  removeExample: (id: number) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

/**
 * Create the store
 */
export const useExampleStore = create<ExampleState>((set) => ({
  // Initial state
  examples: [],
  isLoading: false,
  error: null,

  // Actions
  setExamples: (examples) => set({ examples }),

  addExample: (example) =>
    set((state) => ({
      examples: [...state.examples, example],
    })),

  removeExample: (id) =>
    set((state) => ({
      examples: state.examples.filter((ex) => ex.id !== id),
    })),

  setIsLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  reset: () =>
    set({
      examples: [],
      isLoading: false,
      error: null,
    }),
}));

/**
 * Usage in components:
 *
 *   const { examples, isLoading, error, setExamples } = useExampleStore();
 *
 * Or with destructuring for specific state:
 *
 *   const examples = useExampleStore((state) => state.examples);
 *   const setExamples = useExampleStore((state) => state.setExamples);
 */
