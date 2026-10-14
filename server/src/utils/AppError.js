// An error we throw on purpose, with the HTTP status code the client should get.
// Example: throw new AppError(409, 'Email is already registered');
// The central error handler turns it into a JSON response.
export class AppError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    // Optional extra information, e.g. which form fields are invalid.
    this.details = details;
  }
}
