import type { StorybookConfig } from "@storybook/nextjs-vite";

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest"
  ],
  "framework": {
    "name": "@storybook/nextjs-vite",
    "options": {}
  },
  "staticDirs": [
    "../public"
  ],
  async viteFinal(config) {
    const { resolve, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const mockPath = resolve(__dirname, 'mocks/prisma.ts');
    
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/generated/prisma': mockPath,
      '@/libraries/prisma': mockPath,
      '../generated/prisma': mockPath,
      '../../generated/prisma': mockPath,
    };
    
    config.define = {
      ...config.define,
      'process.env.NODE_ENV': JSON.stringify('development'),
      'global.prisma': 'undefined',
      '__dirname': '"/storybook"',
      '__filename': '"/storybook/index.js"',
      'process.cwd': '() => "/storybook"',
      'global': 'globalThis',
    };
    
    // Exclude Prisma from optimization to prevent issues
    config.optimizeDeps = config.optimizeDeps || {};
    config.optimizeDeps.exclude = [...(config.optimizeDeps.exclude || []), '@prisma/client', '.prisma/client'];
    
    return config;
  }
};
export default config;