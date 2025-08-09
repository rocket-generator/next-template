import '@testing-library/jest-dom'

// Web Crypto API and Text encoding polyfills for testing
import { webcrypto } from 'crypto';
import { TextEncoder, TextDecoder } from 'util';

// Mock next-auth to avoid ESM issues
jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    auth: jest.fn(),
    handlers: { GET: jest.fn(), POST: jest.fn() },
    signIn: jest.fn(),
    signOut: jest.fn(),
  })),
}));

jest.mock('next-auth/providers/credentials', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    id: 'credentials',
    name: 'credentials',
    type: 'credentials',
    authorize: jest.fn(),
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
