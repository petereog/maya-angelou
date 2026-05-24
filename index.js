import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDB from './config/db.js';
import authRoute from './src/routers/auth.router.js';
import globalErrorHandler from './src/middlewares/error.middleware.js';
import { APIError } from './src/utils/apiError.js';

// Handle synchronous uncaught exceptions to prevent silent crashes
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down gracefully...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

// 1. Load environment variables
const envResult = dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });
if (envResult.error) {
  console.error('❌ Failed to load .env file:', envResult.error);
  process.exit(1);
}

// Ensure NODE_ENV defaults to production if not defined
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Configuration checks
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'JWT_EXPIRES_IN'];
const missingVars = requiredEnvVars.filter((v) => !process.env[v]);

if (missingVars.length > 0) {
  console.error(`💥 CONFIGURATION ERROR: Missing required environment variables: [ ${missingVars.join(', ')} ]`);
  process.exit(1);
}

// If in production, require SMTP configurations as well
if (process.env.NODE_ENV === 'production') {
  const requiredSmtpVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
  const missingSmtp = requiredSmtpVars.filter((v) => !process.env[v]);
  
  if (missingSmtp.length > 0) {
    console.error(`💥 SECURITY ERROR: SMTP configurations are mandatory in production: [ ${missingSmtp.join(', ')} ]`);
    process.exit(1);
  }
}

// 2. Connect to Database
connectDB();

const app = express();

// Global Security & Logging Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// 3. Connect Routes
app.use('/api/auth', authRoute);

// 4. Handle Unhandled Routes (404)
app.use((req, res, next) => {
  next(new APIError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

// 5. Global Error Handling Middleware (Must be defined last in the middleware chain)
app.use(globalErrorHandler);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle asynchronous unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down gracefully...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});