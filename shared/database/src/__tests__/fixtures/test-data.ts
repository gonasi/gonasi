import { generateRandomEmail } from '../utils/generateRandomEmail';
import { SU_EMAIL, SU_PASSWORD } from '../utils/getTestUser';

const DEFAULT_PASSWORD = 'TestPass123';

export const TEST_USERS = [
  {
    email: SU_EMAIL,
    password: SU_PASSWORD,
    fullName: 'Super User',
    username: 'superuser',
  },
  {
    email: generateRandomEmail('staff', 'staff1'),
    password: DEFAULT_PASSWORD,
    fullName: 'Staff One',
    username: 'staff_one',
  },
  {
    email: generateRandomEmail('staff', 'staff2'),
    password: DEFAULT_PASSWORD,
    fullName: 'Staff Two',
    username: 'staff_two',
  },
  {
    email: generateRandomEmail('user', 'user1'),
    password: DEFAULT_PASSWORD,
    fullName: 'User One',
    username: 'user_one',
  },
  {
    email: generateRandomEmail('user', 'user2'),
    password: DEFAULT_PASSWORD,
    fullName: 'User Two',
    username: 'user_two',
  },
  {
    email: generateRandomEmail('user', 'user3'),
    password: DEFAULT_PASSWORD,
    fullName: 'User Three',
    username: 'user_three',
  },
  {
    email: generateRandomEmail('user', 'user4'),
    password: DEFAULT_PASSWORD,
    fullName: 'User Four',
    username: 'user_four',
  },
  {
    email: generateRandomEmail('user', 'user5'),
    password: DEFAULT_PASSWORD,
    fullName: 'User Five',
    username: 'user_five',
  },
  {
    email: generateRandomEmail('user', 'user6'),
    password: DEFAULT_PASSWORD,
    fullName: 'User Six',
    username: 'user_six',
  },
  {
    email: generateRandomEmail('user', 'user7'),
    password: DEFAULT_PASSWORD,
    fullName: 'User Seven',
    username: 'user_seven',
  },
  {
    email: generateRandomEmail('user', 'user8'),
    password: DEFAULT_PASSWORD,
    fullName: 'User Eight',
    username: 'user_eight',
  },
  {
    email: generateRandomEmail('user', 'user9'),
    password: DEFAULT_PASSWORD,
    fullName: 'User Nine',
    username: 'user_nine',
  },
  {
    email: generateRandomEmail('user', 'user10'),
    password: DEFAULT_PASSWORD,
    fullName: 'User Ten',
    username: 'user_ten',
  },
];
