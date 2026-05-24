import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined. Check your .env file and dotenv configuration.');
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`Database is Connected`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};f

export default connectDB;