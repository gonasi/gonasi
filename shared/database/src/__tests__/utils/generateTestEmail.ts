export type EmailType = 'user' | 'staff';

export function generateTestEmail(type: EmailType, id: number): string {
  const domain = type === 'staff' ? 'gonasi.com' : 'test.com';
  return `${type}${id}@${domain}`;
}
