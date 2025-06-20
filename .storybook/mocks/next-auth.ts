// Mock NextAuth for Storybook

export const getServerSession = async () => null;

export const NextAuthProvider = ({ children }: { children: any }) => children;

export default {
  providers: [],
  pages: {},
  callbacks: {},
};