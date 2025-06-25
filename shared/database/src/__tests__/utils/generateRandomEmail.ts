export function generateRandomEmail(domain = 'example.com') {
  const randomPart = Math.random().toString(36).substring(2, 10); // random alphanumeric string
  return `user_${randomPart}@${domain}`;
}
