import type { ValidationIssue } from '@nexastack/shared';
import type { RequestHandler, Response } from 'express';
import type { z, ZodType } from 'zod';

import { ValidationError } from '../lib/errors.js';

type RequestLocation = ValidationIssue['location'];

export interface RequestSchemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

const LOCATIONS: readonly RequestLocation[] = ['body', 'params', 'query'];

/**
 * Validate `req.body`, `req.params` and `req.query` against schemas from @nexastack/shared.
 * All issues across all locations are reported together as a 400 VALIDATION_ERROR.
 *
 * Parsed (trimmed, coerced) values are stored on `res.locals.validated`, because Express 5
 * makes `req.query` read-only. Controllers read them with `validatedBody()` etc.
 */
export function validate(schemas: RequestSchemas): RequestHandler {
  return async (req, res, next) => {
    const issues: ValidationIssue[] = [];
    const validated: NonNullable<Response['locals']['validated']> = {};

    for (const location of LOCATIONS) {
      const schema = schemas[location];
      if (!schema) continue;

      // Express 5 leaves req.body undefined when no body parser matched the Content-Type.
      if (location === 'body' && req.body === undefined) {
        issues.push({
          location,
          path: '',
          message: 'Send the request body as JSON with the header Content-Type: application/json',
        });
        continue;
      }

      const result = await schema.safeParseAsync(req[location]);
      if (result.success) {
        validated[location] = result.data;
      } else {
        for (const issue of result.error.issues) {
          issues.push({ location, path: issue.path.map(String).join('.'), message: issue.message });
        }
      }
    }

    // Express 5 forwards a rejected promise to the error handler.
    if (issues.length > 0) throw new ValidationError(issues);

    res.locals.validated = validated;
    next();
  };
}

function readValidated(res: Response, location: RequestLocation): unknown {
  const validated = res.locals.validated;
  if (!validated || !(location in validated)) {
    // Programmer error: the route is missing validate({ [location]: schema }).
    throw new Error(`validate() did not run for "${location}" on this route`);
  }
  return validated[location];
}

/** Validated body. Pass the same schema given to validate(); it supplies the type. */
export function validatedBody<S extends ZodType>(res: Response, _schema: S): z.output<S> {
  return readValidated(res, 'body') as z.output<S>;
}

/** Validated route params. Pass the same schema given to validate(). */
export function validatedParams<S extends ZodType>(res: Response, _schema: S): z.output<S> {
  return readValidated(res, 'params') as z.output<S>;
}

/** Validated query string. Pass the same schema given to validate(). */
export function validatedQuery<S extends ZodType>(res: Response, _schema: S): z.output<S> {
  return readValidated(res, 'query') as z.output<S>;
}
