// Turns the API's validation details into an object keyed by field name.
// [{ field: 'email', message: 'Invalid email address' }]  →  { email: 'Invalid email address' }
export function toFieldErrors(details = []) {
  const errors = {};
  for (const { field, message } of details) {
    // Keep the first message per field.
    if (!errors[field]) errors[field] = message;
  }
  return errors;
}
