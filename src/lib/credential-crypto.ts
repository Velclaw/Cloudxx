import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
function getKey() {
  const value = process.env.CLOUDXX_CREDENTIALS_ENCRYPTION_KEY;
  if (!value) throw new Error('CLOUDXX_CREDENTIALS_ENCRYPTION_KEY is not configured');
  const key = Buffer.from(value, 'base64');
  if (key.length !== 32) throw new Error('CLOUDXX_CREDENTIALS_ENCRYPTION_KEY must be a base64-encoded 32-byte key');
  return key;
}
export function encryptCredentials(value: Record<string, string>) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map(part => part.toString('base64')).join('.');
}
export function decryptCredentials(payload: string): Record<string, string> {
  const [ivText, tagText, dataText] = payload.split('.');
  if (!ivText || !tagText || !dataText) throw new Error('Invalid encrypted credential payload');
  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivText, 'base64'));
  decipher.setAuthTag(Buffer.from(tagText, 'base64'));
  const plain = Buffer.concat([decipher.update(Buffer.from(dataText, 'base64')), decipher.final()]).toString('utf8');
  return JSON.parse(plain) as Record<string, string>;
}
