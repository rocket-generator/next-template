import '@testing-library/jest-dom'
import * as React from 'react';

// Web Crypto API and Text encoding polyfills for testing
import { webcrypto } from 'crypto';
import { TextEncoder, TextDecoder } from 'util';

// Mock better-auth to avoid ESM issues until actual implementation is in place
jest.mock('better-auth', () => ({
  __esModule: true,
  betterAuth: jest.fn(() => ({
    handler: {},
    api: {
      getSession: jest.fn(),
      signInEmail: jest.fn(),
      signInPassword: jest.fn(),
      signOut: jest.fn(),
    },
  })),
}));

jest.mock('better-auth/next-js', () => ({
  __esModule: true,
  toNextJsHandler: jest.fn(() => ({ GET: jest.fn(), POST: jest.fn() })),
  nextCookies: jest.fn(() => ({})),
}));

jest.mock('better-auth/react', () => ({
  __esModule: true,
  createAuthClient: jest.fn(() => ({
    signIn: {
      email: jest.fn(),
      password: jest.fn(),
      social: jest.fn(),
    },
    signOut: jest.fn(),
    useSession: jest.fn(() => ({ data: null, status: 'unauthenticated' })),
    Provider: ({ children }: { children: React.ReactNode }) => children,
  })),
}));

jest.mock('@better-fetch/fetch', () => ({
  __esModule: true,
  betterFetch: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  })),
}));

jest.mock('better-auth/adapters/prisma', () => ({
  __esModule: true,
  prismaAdapter: jest.fn(() => () => ({
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    findOne: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    transaction: jest.fn(async (cb: (adapter: unknown) => Promise<unknown>) => {
      if (cb) {
        await cb({
          create: jest.fn(),
          update: jest.fn(),
          updateMany: jest.fn(),
          findOne: jest.fn(),
          findMany: jest.fn(),
          delete: jest.fn(),
          deleteMany: jest.fn(),
          count: jest.fn(),
        });
      }
    }),
  })),
}));

// Set up global crypto with webcrypto
global.crypto = webcrypto as Crypto;

// Set up TextEncoder and TextDecoder
global.TextEncoder = TextEncoder as typeof globalThis.TextEncoder;
global.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;

// Ensure crypto.subtle is available in test environment
if (!global.crypto.subtle) {
  Object.defineProperty(global.crypto, 'subtle', {
    value: webcrypto.subtle,
    configurable: true,
    writable: true
  });
}

// Mock crypto.getRandomValues if not available
if (!global.crypto.getRandomValues) {
  Object.defineProperty(global.crypto, 'getRandomValues', {
    value: (array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    },
    configurable: true,
    writable: true
  });
}

// Mock window.matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver for components that use it
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
