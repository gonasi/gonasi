import { generateRandomEmail } from '../utils/generateRandomEmail';
import { SU_EMAIL, SU_PASSWORD } from '../utils/getTestUser';

const DEFAULT_PASSWORD = 'TestPass123';

export const TEST_USERS = [
  {
    email: SU_EMAIL,
    password: SU_PASSWORD,
    fullName: 'Super User',
  },
  {
    email: generateRandomEmail('staff', 'staff1'),
    password: DEFAULT_PASSWORD,
    fullName: 'Staff One',
  },
  {
    email: generateRandomEmail('staff', 'staff2'),
    password: DEFAULT_PASSWORD,
    fullName: 'Staff Two',
  },
  {
    email: generateRandomEmail('user', 'user1'),
    password: DEFAULT_PASSWORD,
    fullName: 'User One',
  },
  {
    email: generateRandomEmail('user', 'user2'),
    password: DEFAULT_PASSWORD,
    fullName: 'User Two',
  },
  {
    email: generateRandomEmail('user', 'user3'),
    password: DEFAULT_PASSWORD,
    fullName: 'User Three',
  },
  {
    email: generateRandomEmail('user', 'user4'),
    password: DEFAULT_PASSWORD,
    fullName: 'User Four',
  },
];
