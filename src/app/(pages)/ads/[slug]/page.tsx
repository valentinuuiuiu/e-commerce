import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Gutter } from '../../../_components/Gutter'
import { HR } from '../../../_components/HR'
import RichText from '../../../_components/RichText' // Assuming description is RichText
import { Ad } from '../../../../payload/payload-types' // Generated Payload type for a single Ad
import { AD_QUERY } from '../../../_graphql/ads' // GraphQL query for a single Ad
import classes from './index.module.scss' // We'll create this SCSS module

type Props = {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  // In a real app, you might fetch a list of all ad slugs here
  // to pre-render them at build time if desired.
  // For now, returning empty array means pages will be generated on-demand.
  return []
}

export default async function AdPage({ params }: Props) {
  const { slug } = params
  let ad: Ad | null = null
  let error: string | null = null

  try {
    const response = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: AD_QUERY,
        variables: { slug },
      }),
      next: { tags: [`ads_${slug}`] }, // Cache tag for revalidation
    })

    if (!response.ok) {
      const errorData = await response.json()
      error = `Error fetching ad: ${response.statusText}. Details: ${JSON.stringify(errorData)}`
    } else {
      const result = await response.json()
      if (result.errors) {
        error = `GraphQL Errors: ${result.errors.map((e: any) => e.message).join(', ')}`
      } else if (result.data?.Ads?.docs && result.data.Ads.docs.length > 0) {
        ad = result.data.Ads.docs[0]
      } else {
        return notFound() // Ad not found
      }
    }
  } catch (e) {
    error = `Network or parsing error: ${e.message}`
    console.error(e)
  }

  if (error) {
    return (
      <Gutter className={classes.container}>
        <p className={classes.error}>{error}</p>
        <Link href="/ads">Back to Ads</Link>
      </Gutter>
    )
  }

  if (!ad) {
    // This case should be handled by notFound() or the error block above,
    // but as a fallback:
    return (
      <Gutter className={classes.container}>
        <p>Ad not found or error loading data.</p>
        <Link href="/ads">Back to Ads</Link>
      </Gutter>
    )
  }

  // Determine contact info, preferring ad-specific then author, then generic
  const contactName = ad.contactName || ad.author?.name || 'N/A'
  // For email and phone, ensure they are actually present before displaying
  const displayContactEmail = ad.contactEmail || (typeof ad.author?.email === 'string' ? ad.author.email : null)
  const displayContactPhone = ad.contactPhone // Assuming contactPhone is only from ad specific field for now

  return (
    <Gutter className={classes.container}>
      <Link href="/ads" className={classes.backLink}>
        &larr; Back to Ads
      </Link>
      <div className={classes.adDetail}>
        <h1>{ad.title}</h1>
        <HR />
        <div className={classes.metaInfo}>
          <p>
            <strong>Price:</strong> {ad.price} {ad.currency}
          </p>
          <p>
            <strong>Location:</strong> {ad.location}
          </p>
          <p>
            <strong>Type:</strong> {ad.adType}
          </p>
          <p>
            <strong>Status:</strong> {ad.status}
          </p>
          {ad.categories && ad.categories.length > 0 && (
            <p>
              <strong>Categories:</strong>{' '}
              {ad.categories
                .map(category => (typeof category === 'object' ? category.title : category))
                .join(', ')}
            </p>
          )}
        </div>

        <div className={classes.description}>
          <h2>Description</h2>
          {typeof ad.description === 'string' ? (
            <p>{ad.description}</p>
          ) : (
            <RichText content={ad.description} />
          )}
        </div>

        {/* TODO: Display Ad Images here if the field 'adImages' is populated */}

        <div className={classes.contactInfo}>
          <h2>Contact Seller</h2>
          <p>
            <strong>Name:</strong> {contactName}
          </p>
          {displayContactEmail && (
            <p>
              <strong>Email:</strong> <a href={`mailto:${displayContactEmail}`}>{displayContactEmail}</a>
            </p>
          )}
          {displayContactPhone && (
            <p>
              <strong>Phone:</strong> <a href={`tel:${displayContactPhone}`}>{displayContactPhone}</a>
            </p>
          )}
          {!displayContactEmail && !displayContactPhone && (
             <p>Contact information not provided by seller.</p>
          )}
        </div>
      </div>
    </Gutter>
  )
}

export async function generateMetadata({ params }: Props) {
  const { slug } = params
  // Fetch minimal ad data for metadata, or use data from the main fetch if structured properly
  // For now, a generic approach:
  try {
    const response = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query AdMeta($slug: String) { Ads(where: { slug: { equals: $slug } }) { docs { title description } } }`,
        variables: { slug },
      }),
    })
    const result = await response.json()
    const adData = result.data?.Ads?.docs?.[0]

    if (adData) {
      return {
        title: adData.title || 'Ad Details',
        description: (typeof adData.description === 'string' ? adData.description : 'View ad details').substring(0, 150),
      }
    }
  } catch (e) {
    // console.error("Error fetching metadata:", e)
  }

  return {
    title: 'Ad Details',
    description: 'View details for this ad.',
  }
}
