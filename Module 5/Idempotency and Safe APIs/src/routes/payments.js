'use strict';

const router = require('express').Router();
const { charges, idempotency, nextChargeId } = require('../store');

/**
 * POST /payments
 * Handles card charges with idempotency checks to prevent duplicate charges.
 */
router.post('/', (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];

  // RULE 1: MISSING KEY
  // Reject request if no Idempotency-Key header is provided.
  if (!idempotencyKey) {
    return res.status(400).json({
      error: {
        code: 'IDEMPOTENCY_KEY_REQUIRED',
        message: 'Idempotency-Key header is required for processing payments.',
      },
    });
  }

  // RULE 2: REPEAT KEY
  // If the key has been processed before, return the cached HTTP status and body.
  if (idempotency.has(idempotencyKey)) {
    const cachedResponse = idempotency.get(idempotencyKey);
    return res.status(cachedResponse.status).json(cachedResponse.body);
  }

  // RULE 3 & 4: NEW / DIFFERENT KEY
  // Process payment, create record, store response in cache, and return 201.
  const chargeId = nextChargeId();
  const charge = {
    id: chargeId,
    amount: (req.body && req.body.amount) || 1000,
    status: 'created',
  };

  // Record real charge
  charges.push(charge);

  const responseBody = {
    id: charge.id,
    amount: charge.amount,
    status: charge.status,
  };

  // Cache response for future retries
  idempotency.set(idempotencyKey, {
    status: 201,
    body: responseBody,
  });

  return res.status(201).json(responseBody);
});

module.exports = router;
