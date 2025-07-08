import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Gutter } from '../../../_components/Gutter'
import { HR } from '../../../_components/HR'
import { Button } from '../../../_components/Button' // For Edit/Delete buttons
import { getMeUser } from '../../../_utilities/getMeUser'
import { Ads, User } from '../../../../payload/payload-types' // Payload types
import { ADS_QUERY } from '../../../_graphql/ads' // Re-use ads query
import classes from './index.module.scss'
// import { AdActions } from './AdActions'; // Client component for delete/edit actions if needed

export default async function MyAdsPage() {
  const { user } = await getMeUser({
    nullUserRedirect: `/login?error=${encodeURIComponent(
      'You must be logged in to view your ads.',
    )}&redirect=${encodeURIComponent('/account/my-ads')}`,
  })

  if (!user) {
    // Safeguard redirect, should be handled by getMeUser
    return redirect(`/login?error=${encodeURIComponent(
        'You must be logged in to view your ads.',
      )}&redirect=${encodeURIComponent('/account/my-ads')}`);
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
          limit: 100, // Show more ads, or implement pagination
          sort: '-createdAt',
          // This 'where' clause assumes direct querying by author ID is possible and efficient.
          // Payload's default GraphQL might require specific setup for complex 'where' on relationships.
          // A common pattern is `where: { author: { equals: user.id } }`
          where: {
            author: {
              equals: user.id,
            },
          },
        },
      }),
      next: { tags: [`my_ads_${user.id}`] }, // Cache tag for revalidation
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
