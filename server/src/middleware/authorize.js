import { AppError } from '../utils/AppError.js';

// Allows only the given roles. Must be used AFTER authenticate (it needs req.user).
// Usage: router.get('/', authenticate, authorize('ADMIN'), listUsers);
//        authorize('ADMIN', 'TRAINER') allows both roles.
export function authorize(...allowedRoles) {
  const middleware = (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      // 403 = "we know who you are, but you are not allowed to do this".
      throw new AppError(403, 'You do not have permission to do this');
    }
    next();
  };
  // Readable by tests: route-protection.test.js checks every endpoint against its declared roles.
  middleware.allowedRoles = allowedRoles;
  return middleware;
}
