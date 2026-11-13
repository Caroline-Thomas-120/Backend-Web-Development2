'use strict';

const store = new Map();

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function storeOTP(email, otp) {
  store.set(email, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000,
    attempts: 0,
  });
}

function verifyOTP(email, code) {
  const record = store.get(email);

  // 1. Check whether an OTP exists.
  if (!record) {
    return { ok: false, reason: 'not_found' };
  }

  // 2. Check whether the OTP has expired.
  if (Date.now() > record.expiresAt) {
    return { ok: false, reason: 'expired' };
  }

  // 3. Check whether the maximum attempts have been reached.
  if (record.attempts >= 3) {
    return { ok: false, reason: 'too_many_attempts' };
  }

  // 4. Check whether the submitted code is incorrect.
  if (record.otp !== code) {
    record.attempts += 1;
    return { ok: false, reason: 'wrong_code' };
  }

  // 5. Correct OTP: delete it so it cannot be reused.
  store.delete(email);

  return { ok: true };
}

function markVerified(email) {
   console.log(`Your email ${email} is verified.`);
}

module.exports = {
  generateOTP,
  storeOTP,
  verifyOTP,
  markVerified,
  _store: store,
};