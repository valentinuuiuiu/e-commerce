import type { Access, AccessArgs } from 'payload/types'
import type { Ad } from '../../../payload-types' // User type from Payload is no longer relevant here for auth state

// This function assumes that `req.auth.userId` and potentially `req.auth.sessionClaims`
// are populated by a preceding middleware or handler that validates the Clerk JWT
// and extracts relevant information.
export const isOwnerOrAdmin: Access<Ad> = (args: AccessArgs<Ad>) => {
  const { req, id, doc } = args;

  // @ts-ignore req.auth is not part of default PayloadRequest type yet
  const clerkUserId = req.auth?.userId;
  // @ts-ignore
  const clerkUserRole = req.auth?.sessionClaims?.metadata?.role; // Example: get role from Clerk metadata

  // If no Clerk user ID is found in the request, deny access.
  // This implies the request is not authenticated via Clerk.
  if (!clerkUserId) {
    return false;
  }

  // If the user has an 'admin' role (defined in Clerk custom claims/metadata), grant access.
  // Adjust 'admin_marketplace' to whatever role you define in Clerk for platform admins.
  if (clerkUserRole === 'admin_marketplace') {
    return true;
  }

  // For existing documents (operations like 'update', 'delete'),
  // 'id' and 'doc' should be present.
  if (id && doc) {
    // Check if the authenticated Clerk user's ID matches the ad's authorClerkId.
    if (doc.authorClerkId === clerkUserId) {
      return true;
    }
  }

  // This access control is typically used for 'update' and 'delete'.
  // If it were somehow used for 'create' (which it shouldn't be, as 'create'
  // should use a simpler 'isClerkAuthenticated'), we would deny by default here
  // if the above conditions (admin or owner of existing doc) are not met.
  // For 'read' of a single document, if this were applied, it would also restrict.
  // However, 'read' for Ads is currently 'anyone'.

  // Default deny if none of the above conditions are met.
  return false;
}
