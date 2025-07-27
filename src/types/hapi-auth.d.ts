import '@hapi/hapi';

declare module '@hapi/hapi' {
  interface AuthCredentials {
    userId: string;
    email?: string;
    role?: string;
  }
}