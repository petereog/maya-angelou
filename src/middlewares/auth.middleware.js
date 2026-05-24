import jwt from 'jsonwebtoken';
import User from '../models/usermodel.js';
import { APIError, asyncHandler } from '../utils/apiError.js';

/**
 * Authentication middleware - checks for a valid JWT token
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Extract token from Authorization header (Bearer <token>)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new APIError('You are not logged in. Please log in to get access.', 401));
  }

  // 2. Verify token
  let decoded;
  try {
    const secret = process.env.JWT_SECRET || 'yourSuperSecretKey';
    decoded = jwt.verify(token, secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new APIError('Your session has expired. Please log in again.', 401));
    }
    return next(new APIError('Invalid session. Please log in again.', 401));
  }

  // 3. Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new APIError('The user belonging to this token no longer exists.', 401));
  }

  // 4. Grant access to protected route (attach user to request object)
  req.user = currentUser;
  next();
});

/**
 * Authorization middleware - restricts access to specific roles
 * @param {...string} roles - Allowed roles (e.g. 'admin', 'user')
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new APIError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};
