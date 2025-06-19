import '@testing-library/jest-dom'

// Web Crypto API and Text encoding polyfills for testing
const { webcrypto } = require('crypto');
const { TextEncoder, TextDecoder } = require('util');

// Set up global crypto with webcrypto
global.crypto = webcrypto;

// Set up TextEncoder and TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

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
    value: (array: any) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    },
    configurable: true,
    writable: true
  });
}
