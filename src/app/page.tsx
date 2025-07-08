import React from 'react'
import Link from 'next/link'

import { Gutter } from './_components/Gutter'
import { HR } from './_components/HR'
import { Ad, Category } from '../payload/payload-types' // Adjusted path
import { ADS_QUERY } from './_graphql/ads'
import { CATEGORIES_QUERY } from './_graphql/categories'
import { t, getCurrentLocale } from './_i18n/i18n' // Import the translation function
import classes from './page.module.scss'

export default async function HomePage() {
  const locale = getCurrentLocale() // Get current locale
  let categories: Category[] = []
  let recentAds: Ad[] = []
  let error: string | null = null

  try {
    // Fetch Categories
    const catResponse = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: CATEGORIES_QUERY, variables: { limit: 12 } }), // Limit categories on homepage
      next: { tags: ['categories_homepage'] },
    })
    if (!catResponse.ok) throw new Error(`Error fetching categories: ${catResponse.statusText}`)
    const catResult = await catResponse.json()
    if (catResult.errors) throw new Error(`GraphQL Error (Categories): ${catResult.errors.map((e:any) => e.message).join(', ')}`)
    categories = catResult.data?.Categories?.docs || []

    // Fetch Recent Ads
    const adsResponse = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: ADS_QUERY,
        variables: {
          limit: 8, // Show a few recent ads
          sort: '-createdAt', // Or -publishedOn if ads have that field
          where: { status: { equals: 'published' } }, // Only show published ads
        },
      }),
      next: { tags: ['recent_ads_homepage'] },
    })
    if (!adsResponse.ok) throw new Error(`Error fetching ads: ${adsResponse.statusText}`)
    const adsResult = await adsResponse.json()
    if (adsResult.errors) throw new Error(`GraphQL Error (Ads): ${adsResult.errors.map((e:any) => e.message).join(', ')}`)
    recentAds = adsResult.data?.Ads?.docs || []

  } catch (e) {
    console.error("Homepage fetch error:", e)
    error = e.message || "An error occurred while loading the homepage."
  }

  return (
    <Gutter className={classes.homePage}>
      <div className={classes.hero}>
        <h1>{t('homepage.welcomeTitle', {}, locale)}</h1>
        <p>{t('homepage.welcomeSubtitle', {}, locale)}</p>
        <Link href="/post-ad" className={classes.ctaButton}>{t('homepage.postAdButton', {}, locale)}</Link>
        <Link href="/ads" className={classes.ctaButtonSecondary}>{t('homepage.browseAdsButton', {}, locale)}</Link>
      </div>

      {error && <p className={classes.error}>{error}</p>}

      <section className={classes.categoriesSection}>
        <h2>{t('homepage.categoriesTitle', {}, locale)}</h2>
        <HR />
        {categories.length > 0 ? (
          <div className={classes.categoriesGrid}>
            {categories.map(category => (
              // Category titles from CMS should ideally be localized in CMS if possible,
              // or have a mapping if they are slugs/keys.
              <Link key={category.id} href={`/ads?category=${category.id}`} className={classes.categoryCard}>
                {category.title}
              </Link>
            ))}
          </div>
        ) : (
          <p>{t('homepage.noCategoriesFound', {}, locale)}</p>
        )}
         <Link href="/ads" className={classes.viewAllLink}>{t('homepage.viewAllCategoriesLink', {}, locale)} &rarr;</Link>
      </section>

      <section className={classes.recentAdsSection}>
        <h2>{t('homepage.recentAdsTitle', {}, locale)}</h2>
        <HR />
        {recentAds.length > 0 ? (
          <div className={classes.adsGrid}>
            {recentAds.map(ad => (
              <div key={ad.id} className={classes.adCard}>
                <h3><Link href={`/ads/${ad.slug}`}>{ad.title}</Link></h3> {/* Ad titles are from user input */}
                <p className={classes.adPrice}>{ad.price} {ad.currency}</p>
                <p className={classes.adLocation}>{ad.location}</p>
                {/* Assuming 'View Details' is a generic button text */}
                <Link href={`/ads/${ad.slug}`} className={classes.detailsLink}>{t('adsPage.viewDetailsButton', {}, locale)}</Link>
              </div>
            ))}
          </div>
        ) : (
          <p>{t('homepage.noRecentAds', {}, locale)}</p>
        )}
        <Link href="/ads" className={classes.viewAllLink}>{t('homepage.viewAllAdsLink', {}, locale)} &rarr;</Link>
      </section>
    </Gutter>
  )
}

export async function generateMetadata() {
  // Metadata should also be localized if possible.
  // This might involve fetching translations within this function.
  // For simplicity, keeping it static for now or using default locale.
  const locale = getCurrentLocale();
  return {
    title: t('homepage.welcomeTitle', {}, locale), // Example: Use a key for homepage title
    description: t('homepage.welcomeSubtitle', {}, locale), // Example
    // Add other metadata as needed
  }
}
