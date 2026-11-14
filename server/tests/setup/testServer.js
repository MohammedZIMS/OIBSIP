// Starts an in-memory MongoDB and the real Express app on a random port.
// First run downloads a MongoDB binary (or set MONGOMS_SYSTEM_BINARY to an installed mongod).
import { MongoMemoryServer } from 'mongodb-memory-server';

export async function startTestServer() {
  const mongo = await MongoMemoryServer.create();
  Object.assign(process.env, {
    NODE_ENV: 'test',
    MONGO_URI: mongo.getUri('pizza_test'),
    JWT_SECRET: 'u'.repeat(48),
    JWT_ADMIN_SECRET: 'a'.repeat(48),
    CLIENT_URL: 'http://localhost:5173',
  });
  const { default: app } = await import('../../src/app.js');
  const { connectDB, disconnectDB } = await import('../../src/config/db.js');
  await connectDB(process.env.MONGO_URI);
  const server = await new Promise((resolve) => { const s = app.listen(0, () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;

  const api = async (method, path, { body, token, headers } = {}) => {
    const res = await fetch(base + path, {
      method,
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: res.status, body: await res.json().catch(() => ({})) };
  };

  const stop = async () => {
    await new Promise((r) => server.close(r));
    await disconnectDB();
    await mongo.stop();
  };
  return { api, stop, base };
}
