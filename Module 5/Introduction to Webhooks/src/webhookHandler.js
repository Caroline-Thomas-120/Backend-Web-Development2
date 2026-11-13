
'use strict';

const crypto = require('crypto');
const { handleEvent } = require('./eventHandlers');

const _processedIds = new Set();

async function handleWebhook(req, res) {
  try {
    // 1. Get the signature from request headers
    const signature = req.headers['x-webhook-signature'];

    // 2. Check whether signature exists and has correct format
    if (!signature || !signature.startsWith('sha256=')) {
      return res.status(401).json({
        error: 'Invalid signature'
      });
    }

    // 3. Calculate expected HMAC signature
    const received = signature.slice(7);

    const expected = crypto
      .createHmac('sha256', process.env.WEBHOOK_SECRET)
      .update(req.body)
      .digest('hex');

    // 4. Compare signatures safely
    const expectedBuffer = Buffer.from(expected, 'hex');
    const receivedBuffer = Buffer.from(received, 'hex');

    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      return res.status(401).json({
        error: 'Invalid signature'
      });
    }

    // 5. Parse the request body
    const event = JSON.parse(req.body);

    // 6. Check for duplicate events
    if (_processedIds.has(event.id)) {
      return res.status(200).json({
        status: 'already_processed'
      });
    }

    // 7. Mark event as processed
    _processedIds.add(event.id);

    // 8. Send response immediately
    res.status(200).json({
      status: 'received'
    });

    // 9. Process event asynchronously
    setImmediate(() => {
      handleEvent(event);
    });

  } catch (error) {
    return res.status(400).json({
      error: 'Invalid request body'
    });
  }
}

module.exports = {
  handleWebhook,
  _processedIds
};
