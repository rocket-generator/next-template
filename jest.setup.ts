import '@testing-library/jest-dom'

// Web Crypto API and Text encoding polyfills for testing
import { webcrypto } from 'crypto';
import { TextEncoder, TextDecoder } from 'util';

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
