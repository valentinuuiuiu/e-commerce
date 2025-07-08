import type { Access, AccessArgs } from 'payload/types'

// This access control function checks if there is a Clerk user ID present in req.auth,
// which implies the user has been authenticated by Clerk's middleware.
export const isClerkAuthenticated: Access = ({ req }: AccessArgs<any, any>) => {
  // @ts-ignore req.auth is not part of default PayloadRequest type yet
  if (req.auth && req.auth.userId) {
    return true; // User is authenticated via Clerk
  }

  // No valid Clerk session/user ID found
  return false;
}
