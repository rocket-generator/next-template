// Mock NextAuth React hooks for Storybook

export const useSession = () => ({
  data: null,
  status: 'unauthenticated',
  update: () => Promise.resolve(null),
});

export const signIn = () => Promise.resolve();
export const signOut = () => Promise.resolve();

export const SessionProvider = ({ children }: { children: any }) => children;