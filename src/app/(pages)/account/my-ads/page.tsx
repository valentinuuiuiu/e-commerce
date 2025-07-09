import React from 'react'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server' // Import auth from Clerk for server components

import { Gutter } from '../../../_components/Gutter'
import { HR } from '../../../_components/HR'
import { Button } from '../../../_components/Button'
// import { getMeUser } from '../../../_utilities/getMeUser' // Removed
import { Ads } from '../../../../payload/payload-types' // User from Payload types no longer needed here
import { ADS_QUERY } from '../../../_graphql/ads'
import classes from './index.module.scss'
// import { AdActions } from './AdActions'; // Client component for delete/edit actions if needed

export default async function MyAdsPage() {
  // Route protection is handled by Clerk middleware.
  // Get Clerk authenticated userId.
  const { userId: clerkUserId } = auth();

  if (!clerkUserId) {
    // This case should ideally be handled by Clerk's middleware redirecting to sign-in.
    // If reached, it's an unexpected state for a protected route.
    // Consider a redirect or an error message, though middleware should prevent this.
    // For now, let component render "no ads" or error if data fetching fails.
    // redirect('/sign-in'); // Or handle as an error
  }

  let userAdsData: Ads | null = null
  let error: string | null = null

  try {
    // Fetch ads authored by the current user
    const response = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // TODO: Add Authorization header with JWT token for protected queries if needed
        // For fetching ads by author, if author field is public, token might not be strictly needed here
        // but for editing/deleting actions, it will be.
      },
      body: JSON.stringify({
        query: ADS_QUERY, // Using the general ads query
        variables: {
          limit: 100,
          sort: '-createdAt',
          where: {
            // Query by the new 'authorClerkId' field
            authorClerkId: {
              equals: clerkUserId,
            },
          },
        },
      }),
      // Use clerkUserId for cache tagging if it's available
      next: { tags: clerkUserId ? [`my_ads_${clerkUserId}`] : ['my_ads_unknown'] },
    })

    if (!response.ok) {
      const errorData = await response.json()
      error = `Error fetching your ads: ${response.statusText}. Details: ${JSON.stringify(errorData)}`
    } else {
      const result = await response.json()
      if (result.errors) {
        error = `GraphQL Errors: ${result.errors.map((e: any) => e.message).join(', ')}`
      } else {
        userAdsData = result.data?.Ads
      }
    }
  } catch (e) {
    error = `Network or parsing error: ${e.message}`
    console.error(e)
  }

  const hasAds = userAdsData && userAdsData.docs && userAdsData.docs.length > 0

  return (
    <Gutter className={classes.container}>
      <h1>My Ads</h1>
      <HR />
      <Button href="/post-ad" label="Post New Ad" appearance="primary" className={classes.postAdButton} />

      {error && <p className={classes.error}>{error}</p>}
      {!error && !hasAds && (
        <p>You haven't posted any ads yet. <Link href="/post-ad">Post one now!</Link></p>
      )}

      {hasAds && (
        <div className={classes.adsList}>
          {userAdsData.docs.map(ad => (
            <div key={ad.id} className={classes.adItem}>
              <div className={classes.adInfo}>
                <Link href={`/ads/${ad.slug}`} className={classes.adTitle}>
                  {ad.title}
                </Link>
                <p className={classes.adMeta}>
                  Status: <span className={`${classes.status} ${classes[ad.status]}`}>{ad.status}</span> |
                  Price: {ad.price} {ad.currency} |
                  Location: {ad.location}
                </p>
              </div>
              <div className={classes.adActions}>
                <Button
                  href={`/account/my-ads/edit/${ad.id}`} // Link to edit page
                  label="Edit"
                  appearance="secondary"
                  el="link"
                />
                {/* Delete button would trigger a client-side action.
                    For now, let's defer the actual delete functionality implementation.
                    It would typically involve a client component making a GraphQL mutation.
                <Button
                  label="Delete"
                  appearance="danger"
                  onClick={() => handleDelete(ad.id)} // handleDelete would be in a client component
                />
                */}
                 <span className={classes.deletePlaceholder}>Delete (coming soon)</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* TODO: Add pagination if many ads */}
    </Gutter>
  )
}

export async function generateMetadata() {
  return {
    title: 'My Ads',
    description: 'Manage your ads.',
    // Discourage search engines from indexing this page directly if it's user-specific content
    robots: {
      index: false,
      follow: true
    },
  }
}
