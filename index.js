import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDB from './config/db.js'; // Adjust path if needed!
import authRoute from './src/routers/auth.router.js'; // Fixed path to your router

// 1. Load environment variables
const envResult = dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });
if (envResult.error) {
  console.error('❌ Failed to load .env file:', envResult.error);
  process.exit(1);
}
if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI is not defined in .env');
  process.exit(1);
}

// 2. Connect to Database
connectDB();

const app = express();

// Global Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// 3. Connect your Authentication Routes
app.use('/api/auth', authRoute);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});