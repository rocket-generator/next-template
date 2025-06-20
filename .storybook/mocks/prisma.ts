// Mock PrismaClient and related types for Storybook

// Mock user data structure
const mockUserData = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  password: 'hashed_password',
  permissions: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock user model methods
const mockUserModel = {
  findMany: async () => [],
  findUnique: async () => null,
  findFirst: async () => null,
  create: async (data: any) => ({
    ...mockUserData,
    ...(data?.data || {}),
  }),
  update: async (data: any) => ({
    ...mockUserData,
    ...(data?.data || {}),
  }),
  delete: async () => mockUserData,
  count: async () => 0,
};

// Mock PrismaClient class
export class PrismaClient {
  constructor() {}
  
  $connect = async () => {};
  $disconnect = async () => {};
  $transaction = async (fn: any) => fn(this);
  
  user = mockUserModel;
}

// Export User type
export type User = typeof mockUserData;

// Export Prisma namespace
export const Prisma = {
  UserScalarFieldEnum: {
    id: 'id',
    name: 'name',
    email: 'email',
    password: 'password',
    permissions: 'permissions',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  }
};

// Export prisma instance
export const prisma = new PrismaClient();

// Default export
export default {
  PrismaClient,
  User: mockUserData,
  Prisma,
  prisma,
};