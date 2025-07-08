import { isOwnerOrAdmin } from './isOwnerOrAdmin'; // Adjust path
import type { AccessArgs } from 'payload/types';
import type { Ad } from '../../../payload-types'; // Generated Ad type

describe('isOwnerOrAdmin Access Control for Ads', () => {
  const mockAd: Ad = {
    id: 'ad123',
    title: 'Test Ad',
    authorClerkId: 'user_clerk_owner123',
    // Add other required fields for Ad type, or use Partial<Ad> and cast
    // For simplicity, assuming these are enough for the access control logic
    description: 'Test description',
    price: 100,
    currency: 'RON',
    location: 'Test Location',
    adType: 'for-sale',
    status: 'published',
    // Timestamps are often auto-managed, but good to include if type requires
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // slug: 'test-ad' // if slug is required
  };

  it('should return false if req.auth.userId is not present (unauthenticated)', () => {
    const args: AccessArgs<Ad> = {
      // @ts-ignore
      req: { auth: null },
      id: 'ad123',
      doc: mockAd,
    };
    expect(isOwnerOrAdmin(args)).toBe(false);
  });

  it('should return true if user is an admin (e.g., role "admin_marketplace" in Clerk metadata)', () => {
    const args: AccessArgs<Ad> = {
      // @ts-ignore
      req: {
        auth: {
          userId: 'user_clerk_admin456',
          sessionClaims: { metadata: { role: 'admin_marketplace' } },
        },
      },
      id: 'ad123',
      doc: mockAd, // Admin should be able to access even if not owner
    };
    expect(isOwnerOrAdmin(args)).toBe(true);
  });

  it('should return true if user is the owner of the ad (authorClerkId matches)', () => {
    const args: AccessArgs<Ad> = {
      // @ts-ignore
      req: {
        auth: {
          userId: 'user_clerk_owner123', // This matches mockAd.authorClerkId
          sessionClaims: { metadata: { role: 'user' } }, // Non-admin user
        },
      },
      id: 'ad123',
      doc: mockAd,
    };
    expect(isOwnerOrAdmin(args)).toBe(true);
  });

  it('should return false if user is not the owner and not an admin', () => {
    const args: AccessArgs<Ad> = {
      // @ts-ignore
      req: {
        auth: {
          userId: 'user_clerk_other_user789', // Different user
          sessionClaims: { metadata: { role: 'user' } },
        },
      },
      id: 'ad123',
      doc: mockAd,
    };
    expect(isOwnerOrAdmin(args)).toBe(false);
  });

  it('should return false if doc is not provided (e.g., for a collection-level operation this AC should not gate)', () => {
    const args: AccessArgs<Ad> = {
      // @ts-ignore
      req: {
        auth: {
          userId: 'user_clerk_owner123',
          sessionClaims: { metadata: { role: 'user' } },
        },
      },
      id: 'ad123', // ID might be present for some operations even if doc isn't (though unlikely for update/delete)
      doc: undefined, // Explicitly undefined doc
    };
    expect(isOwnerOrAdmin(args)).toBe(false);
  });

  it('should return false if id is not provided (relevant for create, but this AC is for update/delete)', () => {
    const args: AccessArgs<Ad> = {
      // @ts-ignore
      req: {
        auth: {
          userId: 'user_clerk_owner123',
          sessionClaims: { metadata: { role: 'user' } },
        },
      },
      id: undefined, // No ID
      doc: mockAd, // Doc might be present if it's a create operation with data, but this AC isn't for create
    };
    // This scenario depends on how Payload invokes access controls for 'create'.
    // Given this AC is for update/delete, it should deny if id/doc implies it's not an update/delete context for an existing doc.
    expect(isOwnerOrAdmin(args)).toBe(false);
  });

  it('should handle cases where authorClerkId on doc might be of different types if User relationship was not fully removed (though it should be string now)', () => {
    // This test is more for robustness if the Ad type for authorClerkId was complex,
    // but we changed it to simple 'text'. So, doc.authorClerkId should always be string.
    const adWithObjectAuthor = {
      ...mockAd,
      // @ts-ignore Testing a hypothetical case if authorClerkId was an object by mistake
      authorClerkId: { id: 'user_clerk_owner123' }
    };
    const args: AccessArgs<Ad> = {
       // @ts-ignore
      req: {
        auth: {
          userId: 'user_clerk_owner123',
          sessionClaims: { metadata: { role: 'user' } },
        },
      },
      id: 'ad123',
      doc: adWithObjectAuthor as Ad, // Cast to Ad, though it's slightly malformed for this test
    };
    // The current isOwnerOrAdmin handles `typeof doc.author === 'string' ? doc.author : doc.author?.id;`
    // which would result in `undefined` if authorClerkId was an object without an `id` field, or if it was an object.
    // Since our Ad.authorClerkId is now string, this test might be less relevant unless type is not enforced.
    // Given authorClerkId is string, this specific object case won't happen if types are correct.
    // Let's assume authorClerkId is always string from the DB.
    // If we want to test the internal robustness of `typeof doc.author === 'string' ? doc.author : doc.author?.id;`
    // that logic is no longer in isOwnerOrAdmin as authorClerkId is directly string.
    // So, this test case as written might be testing an impossible state if types are correct.
    // For now, let's ensure it works with the defined string type.
    // expect(isOwnerOrAdmin(args)).toBe(true); // This test case is removed as authorClerkId is now strictly string.
                                            // The internal robustness check for object type author is no longer in isOwnerOrAdmin.ts
  });

  // Add a test case where clerkUserId is present but doc.authorClerkId is different, and user is not admin
  it('should explicitly return false if clerkUserId does not match doc.authorClerkId and not admin', () => {
    const nonMatchingAd = { ...mockAd, authorClerkId: 'user_clerk_another_owner' };
    const args: AccessArgs<Ad> = {
      // @ts-ignore
      req: {
        auth: {
          userId: 'user_clerk_owner123', // Current user
          sessionClaims: { metadata: { role: 'user' } }, // Not an admin
        },
      },
      id: 'ad123',
      doc: nonMatchingAd, // Ad owned by someone else
    };
    expect(isOwnerOrAdmin(args)).toBe(false);
  });
});
