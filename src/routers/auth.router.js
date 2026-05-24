import express from 'express';
import { 
  signup, 
  signin, 
  logout, 
  forgotPassword, 
  resetPassword, 
  getProfile, 
  updateProfile 
} from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const authRoute = express.Router();

// Public routes
authRoute.post('/signup', signup);
authRoute.post('/signin', signin);
authRoute.post('/logout', logout);
authRoute.post('/forgot-password', forgotPassword);
authRoute.post('/reset-password/:token', resetPassword);

// Protected routes (requires valid JWT token)
authRoute.get('/profile', protect, getProfile);
authRoute.put('/profile', protect, updateProfile);

export default authRoute;

