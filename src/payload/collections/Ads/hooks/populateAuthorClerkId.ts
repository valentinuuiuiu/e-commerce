import type { CollectionBeforeChangeHook } from 'payload/types';
import type { Ad } from '../../../payload-types'; // Assuming Ad type is generated

/**
 * Populates the authorClerkId field on an Ad document during creation.
 * It expects req.auth.userId to be populated by Clerk authentication middleware.
 */
export const populateAuthorClerkId: CollectionBeforeChangeHook<Ad> = async ({
  req,
  operation,
  data,
}) => {
  if (operation === 'create') {
    // @ts-ignore req.auth might not be typed on default Payload Request type yet
    const clerkUserId = req.auth?.userId;

    if (clerkUserId) {
      data.authorClerkId = clerkUserId;
    } else {
      // This scenario should ideally be prevented by access control.
      // If it occurs, it indicates a potential issue upstream (e.g., create access granted without auth).
      console.warn(
        'populateAuthorClerkId hook: Attempted to create an ad without a Clerk user ID in req.auth. authorClerkId will not be set.',
      );
      // Depending on business rules, you might want to throw an error here to prevent creation:
      // throw new Error('Cannot create ad: Clerk User ID is missing.');
    }
  }
  return data;
};
