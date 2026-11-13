import { env } from '../src/config/env.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { Admin } from '../src/models/index.js';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []));
const { email, password, name = 'Operations Admin' } = args;

if (!email || !password) { console.error('Usage: npm run seed:admin -- --email <email> --password <password> [--name <name>]'); process.exit(1); }
if (password.length < 10) { console.error('Use a password of at least 10 characters.'); process.exit(1); }

await connectDB(env.MONGO_URI);
const passwordHash = await Admin.hashPassword(password);
const res = await Admin.updateOne({ email: email.toLowerCase() }, { $set: { name, passwordHash, isActive: true, failedAttempts: 0, lockedUntil: null, passwordChangedAt: new Date() } }, { upsert: true });
console.log(res.upsertedCount ? `Admin created: ${email}` : `Admin updated: ${email}`);
await disconnectDB();
