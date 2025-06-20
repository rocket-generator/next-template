// Mock auth library for Storybook

export const signIn = () => Promise.resolve();
export const signOut = () => Promise.resolve();

export const authConfig = {
  providers: [],
  pages: {},
  callbacks: {},
};

export default {
  signIn,
  signOut,
  authConfig,
};