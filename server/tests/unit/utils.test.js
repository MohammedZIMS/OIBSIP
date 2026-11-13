import test from 'node:test';
import assert from 'node:assert/strict';
import { randomToken, sha256, sixDigitCode, safeEqual } from '../../src/utils/tokens.js';
import { percentOf, toPaise } from '../../src/utils/money.js';
import { ORDER_STATUS, canTransition } from '../../src/constants/orderStatus.js';
import { requirementsFromItems } from '../../src/services/inventoryService.js';
import { pageMeta, toSkipLimit } from '../../src/utils/pagination.js';

test('tokens: random, hashed, 6-digit code', () => {
  assert.notEqual(randomToken(), randomToken());
  assert.equal(sha256('a').length, 64);
  assert.match(sixDigitCode(), /^\d{6}$/);
  assert.equal(safeEqual('abc', 'abc'), true);
  assert.equal(safeEqual('abc', 'abd'), false);
  assert.equal(safeEqual('abc', 'abcd'), false);
});

test('money stays in integer paise', () => {
  assert.equal(toPaise(459.5), 45950);
  assert.equal(percentOf(142800, 5), 7140);
});

test('order status moves forward only', () => {
  assert.equal(canTransition(ORDER_STATUS.ORDER_RECEIVED, ORDER_STATUS.IN_KITCHEN), true);
  assert.equal(canTransition(ORDER_STATUS.IN_KITCHEN, ORDER_STATUS.SENT_TO_DELIVERY), true);
  assert.equal(canTransition(ORDER_STATUS.ORDER_RECEIVED, ORDER_STATUS.SENT_TO_DELIVERY), false);
  assert.equal(canTransition(ORDER_STATUS.IN_KITCHEN, ORDER_STATUS.ORDER_RECEIVED), false);
  assert.equal(canTransition(ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.IN_KITCHEN), false);
});

test('requirementsFromItems multiplies components by quantity and merges items', () => {
  const items = [
    { qty: 2, components: [{ ingredient: 'base1' }, { ingredient: 'sauce1' }] },
    { qty: 1, components: [{ ingredient: 'base1' }, { ingredient: 'veg1' }] },
  ];
  assert.deepEqual([...requirementsFromItems(items)], [['base1', 3], ['sauce1', 2], ['veg1', 1]]);
});

test('pagination helpers', () => {
  assert.deepEqual(toSkipLimit({ page: 3, limit: 20 }), { skip: 40, limit: 20 });
  assert.equal(pageMeta({ page: 1, limit: 20 }, 41).totalPages, 3);
});
