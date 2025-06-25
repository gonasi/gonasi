export type EmailType = 'user' | 'staff';

export function generateRandomEmail(type: string = 'user', prefix: string = ''): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const domain = type === 'staff' ? 'gonasi.com' : 'test.com';
  return `${prefix}-${timestamp}-${random}@${domain}`;
}
