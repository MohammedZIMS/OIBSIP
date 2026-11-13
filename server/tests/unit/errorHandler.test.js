import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { z } from 'zod';
import ApiError from '../../src/utils/ApiError.js';
import { normalizeError } from '../../src/middleware/errorHandler.js';

test('ApiError keeps status, code and details', () => {
  const r = normalizeError(ApiError.conflict('Out', 'OUT_OF_STOCK', [{ a: 1 }]));
  assert.deepEqual([r.status, r.code, r.details], [409, 'OUT_OF_STOCK', [{ a: 1 }]]);
});

test('ZodError becomes 400 VALIDATION_ERROR with field paths', () => {
  const res = z.object({ email: z.string().email() }).safeParse({ email: 'nope' });
  const r = normalizeError(res.error);
  assert.equal(r.status, 400);
  assert.equal(r.code, 'VALIDATION_ERROR');
  assert.equal(r.details[0].path, 'email');
});

test('Mongoose validation errors are mapped to 400 with details', () => {
  const m = mongoose.model('TmpErr', new mongoose.Schema({ n: { type: Number, min: 5 } }));
  const err = new m({ n: 1 }).validateSync();
  const r = normalizeError(err);
  assert.equal(r.status, 400);
  assert.equal(r.details[0].path, 'n');
});

test('duplicate key (11000) becomes 409 DUPLICATE naming the field', () => {
  const r = normalizeError({ code: 11000, keyPattern: { email: 1 } });
  assert.deepEqual([r.status, r.code], [409, 'DUPLICATE']);
  assert.match(r.message, /email/);
});

test('JWT errors become 401', () => {
  assert.equal(normalizeError({ name: 'TokenExpiredError' }).code, 'TOKEN_EXPIRED');
  assert.equal(normalizeError({ name: 'JsonWebTokenError' }).status, 401);
});

test('unknown errors become 500 and hide details in production', () => {
  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  const r = normalizeError(new Error('secret db detail'));
  process.env.NODE_ENV = prev;
  assert.equal(r.status, 500);
  assert.equal(r.message, 'Something went wrong');
});
