import { generateTestEmail } from '../utils/generateTestEmail';

export const SU_EMAIL = 'gonasiapp@gmail.com';
export const SU_PASSWORD = 'SuPass123';

if (!SU_EMAIL || !SU_PASSWORD) {
  throw new Error('SU_EMAIL and SU_PASSWORD must be defined');
}

const DEFAULT_PASSWORD = 'TestPass123';

export const TEST_USERS = [
  {
    email: SU_EMAIL,
    password: SU_PASSWORD,
    fullName: 'Super User',
    username: 'superuser',
  },
  {
    email: generateTestEmail('staff', 1),
    password: DEFAULT_PASSWORD,
    fullName: 'Staff One',
    username: 'staff_one',
  },
  {
    email: generateTestEmail('staff', 2),
    password: DEFAULT_PASSWORD,
    fullName: 'Staff Two',
    username: 'staff_two',
  },
  {
    email: generateTestEmail('staff', 3),
    password: DEFAULT_PASSWORD,
    fullName: 'Staff Three',
    username: 'staff_three',
  },
  {
    email: generateTestEmail('user', 1),
    password: DEFAULT_PASSWORD,
    fullName: 'User One',
    username: 'user_one',
  },
  {
    email: generateTestEmail('user', 2),
    password: DEFAULT_PASSWORD,
    fullName: 'User Two',
    username: 'user_two',
  },
  {
    email: generateTestEmail('user', 3),
    password: DEFAULT_PASSWORD,
    fullName: 'User Three',
    username: 'user_three',
  },
  {
    email: generateTestEmail('user', 4),
    password: DEFAULT_PASSWORD,
    fullName: 'User Four',
    username: 'user_four',
  },
  {
    email: generateTestEmail('user', 5),
    password: DEFAULT_PASSWORD,
    fullName: 'User Five',
    username: 'user_five',
  },
  {
    email: generateTestEmail('user', 6),
    password: DEFAULT_PASSWORD,
    fullName: 'User Six',
    username: 'user_six',
  },
  {
    email: generateTestEmail('user', 7),
    password: DEFAULT_PASSWORD,
    fullName: 'User Seven',
    username: 'user_seven',
  },
  {
    email: generateTestEmail('user', 8),
    password: DEFAULT_PASSWORD,
    fullName: 'User Eight',
    username: 'user_eight',
  },
  {
    email: generateTestEmail('user', 9),
    password: DEFAULT_PASSWORD,
    fullName: 'User Nine',
    username: 'user_nine',
  },
  {
    email: generateTestEmail('user', 10),
    password: DEFAULT_PASSWORD,
    fullName: 'User Ten',
    username: 'user_ten',
  },
];
