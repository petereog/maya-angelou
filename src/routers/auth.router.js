import express from 'express';
// Import the controller functions (remember the .js extension!)
import { signup, signin, logout } from '../controllers/auth.controller.js';

const authRoute = express.Router();

// Route pathways connected straight to your controller logic
authRoute.post('/Signup', signup);
authRoute.post('/Signin', signin);
authRoute.post('/Logout', logout);

export default authRoute;
