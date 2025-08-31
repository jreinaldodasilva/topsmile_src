// backend/src/types/express.d.ts
// Augment the Express Request type to include `user` and a small User type.
// This file must be included by TypeScript (see notes below).

declare global {
  namespace Express {
    interface User {
      id: string;
      email?: string;
      role?: string;
      // add other fields you attach to req.user
    }

    interface Request {
      // optional because some requests (e.g. public endpoints) won't have a user
      user?: User;
    }
  }
}

// Keep the file a module to avoid global scope pollution if your TS config requires it
export {};
