import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

export const validateBody = (schema: z.ZodTypeAny) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.body = await schema.parseAsync(request.body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          error: 'Validation Error', 
          details: error.errors 
        });
      }
      return reply.status(400).send({ error: 'Invalid request' });
    }
  };
};

export const validateQuery = (schema: z.ZodTypeAny) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.query = await schema.parseAsync(request.query);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          error: 'Query Validation Error', 
          details: error.errors 
        });
      }
      return reply.status(400).send({ error: 'Invalid query parameters' });
    }
  };
};

export const validateParams = (schema: z.ZodTypeAny) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.params = await schema.parseAsync(request.params);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          error: 'Params Validation Error', 
          details: error.errors 
        });
      }
      return reply.status(400).send({ error: 'Invalid URL parameters' });
    }
  };
};
