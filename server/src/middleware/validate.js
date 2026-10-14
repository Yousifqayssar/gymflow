import { AppError } from '../utils/AppError.js';

// Checks req.body against a Zod schema before the controller runs.
// Usage in a route: router.post('/register', validate(registerSchema), register);
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body ?? {});

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(new AppError(400, 'Validation failed', details));
    }

    // Replace the body with the cleaned data: Zod removes fields that are not
    // in the schema, so a client cannot sneak in extra fields (e.g. "role").
    req.body = result.data;
    next();
  };
}
