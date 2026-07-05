import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    accessToken: string;
    user: {
      id: string;
      name: string;
      firstName: string;
      lastName: string;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    token: string;
    name: string;
    firstName: string;
    lastName: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken: string;
    id: string;
    name: string;
    firstName: string;
    lastName: string;
  }
}
