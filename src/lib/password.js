import crypto from 'crypto';

const ITERATIONS = 120000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  if (!password) {
    throw new Error('Password is required');
  }

  const hash = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST)
    .toString('hex');

  return { hash, salt };
}

export function verifyPassword(password, hash, salt) {
  if (!password || !hash || !salt) {
    return false;
  }

  const computed = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST)
    .toString('hex');

  return crypto.timingSafeEqual(
    Buffer.from(hash, 'hex'),
    Buffer.from(computed, 'hex')
  );
}
