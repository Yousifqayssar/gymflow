import { AppError } from '../utils/AppError.js';

// Runs a Zod schema and turns a failure into a 400 AppError listing every invalid field.
function parseOrThrow(schema, data) {
  const result = schema.safeParse(data);

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    throw new AppError(400, 'Validation failed', details);
  }

  return result.data;
}

// Checks req.body against a Zod schema before the controller runs.
// Usage in a route: router.post('/register', validate(registerSchema), register);
export function validate(schema) {
  return (req, res, next) => {
    // Replace the body with the cleaned data: Zod removes fields that are not
    // in the schema, so a client cannot sneak in extra fields (e.g. "role").
    req.body = parseOrThrow(schema, req.body ?? {});
    next();
  };
}

// Checks the query string (?role=MEMBER&search=ali) inside a controller.
// (In Express 5 req.query is read-only, so the cleaned values are returned instead.)
export function parseQuery(schema, query) {
  return parseOrThrow(schema, query);
}
