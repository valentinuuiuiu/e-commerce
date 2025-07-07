import type { Access, AccessArgs } from 'payload/types'
import type { Ad, User } from '../../../payload-types'

export const isOwnerOrAdmin: Access<Ad, User> = (args: AccessArgs<Ad, User>) => {
  const { req: { user }, id } = args; // Only destructure req and id initially

  // If there is no user, block access
  if (!user) {
    return false
  }

  // If user is an admin, grant access
  if (user.roles?.includes('admin')) {
    return true
  }

  // For existing documents (update/delete), 'id' will be present and 'doc' should be available.
  // This access control is primarily for update and delete.
  // 'create' is handled by 'loggedIn' at collection level.
  // 'read' (single doc) should also have 'doc'. Collection 'read' is 'anyone'.
  if (id && args.doc) {
    const doc = args.doc;
    // The 'author' field in 'Ads' collection stores the user ID or the User object.
    const authorId = typeof doc.author === 'string' ? doc.author : doc.author?.id;

    if (authorId === user.id) {
      return true;
    }
  } else if (!id && args.operation === 'create') {
    // This case should not be gated by isOwnerOrAdmin if 'create' access is 'loggedIn'
    // but if it were, allowing a logged-in user to proceed to create makes sense.
    // However, this function is applied to update/delete in Ads collection.
    return false; // Deny if somehow used for create and doc is not present
  }


  // Default deny
  return false
}
