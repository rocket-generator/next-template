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
    const appActionsMockPath = resolve(__dirname, 'mocks/app-actions.ts');
    const settingsActionsMockPath = resolve(__dirname, 'mocks/settings-actions.ts');
    const nextImageMockPath = resolve(__dirname, 'mocks/next-image.tsx');
    const nextLinkMockPath = resolve(__dirname, 'mocks/next-link.tsx');
    const nextNavigationMockPath = resolve(__dirname, 'mocks/next-navigation.ts');
    const paginationMockPath = resolve(__dirname, 'mocks/pagination.tsx');
    
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/generated/prisma': mockPath,
      '@/libraries/prisma': mockPath,
      '@/app/(site)/(authorized)/(app)/actions': appActionsMockPath,
      '@/app/(site)/(authorized)/(app)/settings/actions': settingsActionsMockPath,
      'next/image': nextImageMockPath,
      'next/link': nextLinkMockPath,
      'next/navigation': nextNavigationMockPath,
      '@/components/molecules/Pagination': paginationMockPath,
      '../generated/prisma': mockPath,
      '../../generated/prisma': mockPath,
    };
    
    config.define = {
      ...config.define,
      'process.env.NODE_ENV': JSON.stringify('development'),
      'global.prisma': 'undefined',
      '__dirname': '"/storybook"',
      '__filename': '"/storybook/index.js"',
      'global': 'globalThis',
    };
    
    // Exclude Prisma from optimization to prevent issues
    config.optimizeDeps = config.optimizeDeps || {};
    config.optimizeDeps.include = (config.optimizeDeps.include || []).filter(
      (dependency) => dependency !== 'next/image'
    );
    config.optimizeDeps.exclude = [...(config.optimizeDeps.exclude || []), '@prisma/client', '.prisma/client'];
    
    return config;
  }
};
export default config;
