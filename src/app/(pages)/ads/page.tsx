import React from 'react'
import Link from 'next/link'

import { Gutter } from '../../_components/Gutter'
import { HR } from '../../_components/HR'
import { RenderParams } from '../../_components/RenderParams'
import { Ads } from '../../../payload/payload-types' // Assuming Ads type will be generated
import { ADS_QUERY } from '../../_graphql/ads' // New GraphQL query for Ads
import RichText from '../../_components/RichText' // For description if it's RichText
import classes from './index.module.scss' // We'll create this SCSS module

type Props = {
  searchParams?: {
    [key: string]: string | string[] | undefined
  }
}

export default async function AdsPage({ searchParams }: Props) {
  const { page = 1 } = searchParams || {}

  // TODO: Implement actual fetching logic.
  // This requires access to the Payload API, typically via a fetch function.
  // The e-commerce template uses fetchDoc, fetchDocs in src/app/_api/
  // We'll need to adapt or use a similar pattern.

  let adsData: Ads | null = null // Payload type for a list of Ads
  let error: string | null = null

  try {
    const response = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: ADS_QUERY,
        variables: {
          limit: 10, // Example limit
          page: Number(page),
          sort: '-createdAt', // Example sort
        },
      }),
      next: { tags: ['ads_listing'] }, // For cache revalidation
    })

    if (!response.ok) {
      const errorData = await response.json()
      error = `Error fetching ads: ${response.statusText}. Details: ${JSON.stringify(errorData)}`
    } else {
      const result = await response.json()
      if (result.errors) {
        error = `GraphQL Errors: ${result.errors.map((e: any) => e.message).join(', ')}`
      } else {
        adsData = result.data?.Ads
      }
    }
  } catch (e) {
    error = `Network or parsing error: ${e.message}`
    console.error(e) // Log error to server console
  }

  const hasAds = adsData && adsData.docs && adsData.docs.length > 0

  return (
    <div className={classes.container}>
      <Gutter>
        <RenderParams />
        <h1>Ads</h1>
        <HR />
        {error && <p className={classes.error}>{error}</p>}
        {!error && !hasAds && <p>No ads found.</p>}
        {hasAds && (
          <div className={classes.adsGrid}>
            {adsData.docs.map(ad => (
              <div key={ad.id} className={classes.adCard}>
                <h3>
                  <Link href={`/ads/${ad.slug}`}>{ad.title}</Link>
                </h3>
                <p>
                  <strong>Price:</strong> {ad.price} {ad.currency}
                </p>
                <p>
                  <strong>Location:</strong> {ad.location}
                </p>
                <p>
                  <strong>Type:</strong> {ad.adType}
                </p>
                {/*
                  Consider using a summary component for description if it's long
                  or if it's RichText, use the RichText component.
                  For now, a snippet:
                */}
                {ad.description && (
                  <p>
                    {typeof ad.description === 'string'
                      ? ad.description.substring(0, 100) + (ad.description.length > 100 ? '...' : '')
                      : 'View details for description.'}
                  </p>
                )}
                <Link href={`/ads/${ad.slug}`} className={classes.detailsLink}>
                  View Details
                </Link>
              </div>
            ))}
          </div>
        )}
        {/* TODO: Add Pagination controls if totalPages > 1 */}
      </Gutter>
    </div>
  )
}

// Basic metadata, can be enhanced
export async function generateMetadata() {
  return {
    title: 'Ads Listings',
    description: 'Browse all available ads.',
  }
}
