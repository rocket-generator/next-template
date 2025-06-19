// Mock NextAuth Credentials Provider for Storybook

const CredentialsProvider = (config: any) => ({
  id: 'credentials',
  name: 'Credentials',
  type: 'credentials',
  credentials: config.credentials || {},
  authorize: config.authorize || (() => null),
});

export default CredentialsProvider;