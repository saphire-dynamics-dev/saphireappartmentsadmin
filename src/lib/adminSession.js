import { createHmac, timingSafeEqual } from 'crypto';

function getSigningSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
}

export function createAdminSession(username) {
  const session = {
    isAuthenticated: true,
    username,
    timestamp: Date.now(),
  };
  const payload = JSON.stringify(session);
  const secret = getSigningSecret();

  if (!secret) throw new Error('Admin session secret is not configured.');

  return JSON.stringify({
    ...session,
    signature: createHmac('sha256', secret).update(payload).digest('hex'),
  });
}

export function verifyAdminSession(cookieValue) {
  try {
    const { signature, ...session } = JSON.parse(cookieValue || '');
    if (!session.isAuthenticated || !session.username || !session.timestamp || !signature) return false;

    const secret = getSigningSecret();
    if (!secret) return false;

    const expected = createHmac('sha256', secret).update(JSON.stringify(session)).digest('hex');
    return signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}
