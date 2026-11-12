import 'dotenv/config';
import app from './app.js';

const port = process.env.PORT || 5000;
const server = app.listen(port, () => console.log(`API listening on :${port}`));

process.on('SIGTERM', () => server.close(() => process.exit(0)));
