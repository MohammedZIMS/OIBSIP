import mongoose from 'mongoose';
import { logger } from './logger.js';

mongoose.set('strictQuery', true);

export async function connectDB(uri) {
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  } catch (err) {
    // Do not print the URI: it contains credentials.
    throw new Error(`Could not connect to MongoDB (${err.name}: ${err.message.split('\n')[0]})`);
  }
  logger.info({ db: mongoose.connection.name }, 'MongoDB connected');
}

export const disconnectDB = () => mongoose.disconnect();
export const isDbReady = () => mongoose.connection.readyState === 1;
