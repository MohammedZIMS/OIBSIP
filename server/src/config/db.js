import mongoose from 'mongoose';
import { logger } from './logger.js';

mongoose.set('strictQuery', true);

// Database name from the URI path (mongodb+srv://user:pw@host/NAME?...), if there is one.
const dbNameFromUri = (uri) => uri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/)?.[1];

export async function connectDB(uri) {
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));
  const options = { serverSelectionTimeoutMS: 8000 };
  if (!dbNameFromUri(uri)) options.dbName = process.env.DB_NAME || 'pizza'; // otherwise Mongo would use "test"
  try {
    await mongoose.connect(uri, options);
  } catch (err) {
    const first = err.message.split('\n')[0]; // never print the URI: it holds credentials
    const hint = /bad auth|authentication failed/i.test(first)
      ? 'Atlas rejected the username or password. Check Database Access, and URL-encode special characters in the password.'
      : /ENOTFOUND|querySrv/i.test(first)
        ? 'Cluster address not found. Re-copy the host from Atlas > Connect.'
        : /timed out|ReplicaSetNoPrimary|server selection/i.test(first)
          ? 'Cannot reach the cluster. Add your IP under Atlas > Network Access.'
          : '';
    throw new Error(`Could not connect to MongoDB (${err.name}: ${first}). ${hint}`.trim());
  }
  logger.info({ db: mongoose.connection.name }, 'MongoDB connected');
}

export const disconnectDB = () => mongoose.disconnect();
export const isDbReady = () => mongoose.connection.readyState === 1;
