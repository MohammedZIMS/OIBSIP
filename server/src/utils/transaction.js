import mongoose from 'mongoose';

/** Runs `fn(session)` inside a MongoDB transaction (requires a replica set; Atlas is one). */
export async function runInTransaction(fn) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => { result = await fn(session); });
    return result;
  } finally {
    await session.endSession();
  }
}
