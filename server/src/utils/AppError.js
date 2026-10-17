// An error we throw on purpose, with the HTTP status code the client should get.
// Example: throw new AppError(409, 'Email is already registered');
// The central error handler turns it into a JSON response.
// `code` is optional: a fixed name for the error that the client can check,
// e.g. to tell "membership expired" apart from "you are not allowed" (both are 403).
export class AppError extends Error {
  constructor(statusCode, message, details, code) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    // Optional extra information, e.g. which form fields are invalid.
    this.details = details;
    this.code = code;
  }
}
