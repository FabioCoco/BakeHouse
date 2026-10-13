import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDB = async () => {
  const conn = await mongoose.connect(env.mongodbUri);
  console.log(`MongoDB connected: ${conn.connection.host}`);
  return conn;
};

export const disconnectDB = () => mongoose.disconnect();
