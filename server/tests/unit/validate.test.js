import test from 'node:test';
import assert from 'node:assert/strict';
import { validate } from '../../src/middleware/validate.js';
import { listIngredientsQuery, idParams } from '../../src/validators/index.js';

const run = (schemas, req) => new Promise((resolve) => validate(schemas)(req, {}, (err) => resolve({ err, req })));

test('applies defaults and coerces query values', async () => {
  const { err, req } = await run({ query: listIngredientsQuery }, { query: { limit: '5', category: 'base' } });
  assert.equal(err, undefined);
  assert.deepEqual(req.query, { page: 1, limit: 5, category: 'base' });
});

test('rejects bad enum, out-of-range numbers and bad ids', async () => {
  assert.ok((await run({ query: listIngredientsQuery }, { query: { category: 'pasta' } })).err);
  assert.ok((await run({ query: listIngredientsQuery }, { query: { limit: '9999' } })).err);
  assert.ok((await run({ params: idParams }, { params: { id: 'not-an-id' } })).err);
});

test('strips unknown keys', async () => {
  const { req } = await run({ query: listIngredientsQuery }, { query: { hack: '$where' } });
  assert.equal('hack' in req.query, false);
});
