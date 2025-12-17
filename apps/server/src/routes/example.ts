/**
 * Example Routes
 *
 * This file demonstrates the basic structure for creating API endpoints.
 * Each endpoint follows this pattern:
 *
 * 1. Router.METHOD(path, handler)
 * 2. Handler validates input
 * 3. Handler calls service for business logic
 * 4. Handler formats and returns response
 * 5. Errors are caught and passed to error handler middleware
 */

import { Router, Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../utils/errors';

export const exampleRouter = Router();

/**
 * GET /api/example
 * Fetch all examples (or filtered list)
 *
 * Query params:
 *   limit (number): Items per page (default: 10)
 *   offset (number): Items to skip (default: 0)
 */
exampleRouter.get('/', (req: Request, res: Response) => {
  // In a real app, fetch from database
  const examples = [
    { id: 1, name: 'Example 1', createdAt: new Date() },
    { id: 2, name: 'Example 2', createdAt: new Date() },
  ];

  res.json({
    data: examples,
    total: examples.length,
    pagination: {
      limit: 10,
      offset: 0,
    },
  });
});

/**
 * GET /api/example/:id
 * Fetch a single example by ID
 */
exampleRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  // Validate that ID is a number
  if (isNaN(Number(id))) {
    return next(new ValidationError('ID must be a number'));
  }

  // In a real app, fetch from database
  const example = { id: Number(id), name: 'Example', createdAt: new Date() };

  res.json({ data: example });
});

/**
 * POST /api/example
 * Create a new example
 *
 * Request body:
 *   {
 *     name: string (required)
 *     description?: string
 *   }
 */
exampleRouter.post('/', (req: Request, res: Response, next: NextFunction) => {
  // Define validation schema using Joi
  const schema = Joi.object({
    name: Joi.string().required().min(1).max(255),
    description: Joi.string().max(1000),
  });

  // Validate request body
  const { error, value } = schema.validate(req.body);
  if (error) {
    return next(new ValidationError(error.message, { details: error.details }));
  }

  // In a real app, save to database
  const newExample = {
    id: Math.floor(Math.random() * 1000),
    ...value,
    createdAt: new Date(),
  };

  // Return 201 Created with the new resource
  res.status(201).json({ data: newExample, message: 'Example created' });
});

/**
 * PUT /api/example/:id
 * Update an entire example (all fields)
 */
exampleRouter.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  if (isNaN(Number(id))) {
    return next(new ValidationError('ID must be a number'));
  }

  const schema = Joi.object({
    name: Joi.string().required().min(1).max(255),
    description: Joi.string().max(1000),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return next(new ValidationError(error.message));
  }

  // In a real app, update in database
  const updated = {
    id: Number(id),
    ...value,
    updatedAt: new Date(),
  };

  res.json({ data: updated, message: 'Example updated' });
});

/**
 * PATCH /api/example/:id
 * Partially update an example (only provided fields)
 */
exampleRouter.patch('/:id', (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  if (isNaN(Number(id))) {
    return next(new ValidationError('ID must be a number'));
  }

  // For PATCH, all fields are optional
  const schema = Joi.object({
    name: Joi.string().min(1).max(255),
    description: Joi.string().max(1000),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return next(new ValidationError(error.message));
  }

  // In a real app, merge with existing and update
  const patched = {
    id: Number(id),
    name: 'Example',
    ...value,
    updatedAt: new Date(),
  };

  res.json({ data: patched, message: 'Example updated' });
});

/**
 * DELETE /api/example/:id
 * Delete an example
 */
exampleRouter.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  if (isNaN(Number(id))) {
    return next(new ValidationError('ID must be a number'));
  }

  // In a real app, delete from database
  res.json({ message: `Example ${id} deleted successfully` });
});
