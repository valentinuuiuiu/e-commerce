import React from 'react'
import { redirect, notFound } from 'next/navigation'

import { Gutter } from '../../../../../_components/Gutter'
import { getMeUser } from '../../../../../_utilities/getMeUser'
import { EditAdForm } from './EditAdForm' // Client component
import { Ad, Category } from '../../../../../../payload/payload-types'
import { AD_QUERY_BY_ID } from '../../../../../_graphql/ads' // Corrected: Query for a single ad by ID
import { CATEGORIES_QUERY } from '../../../../../_graphql/categories'
import { HR } from '../../../../../_components/HR'
import classes from './index.module.scss' // Page specific styles

type Props = {
  params: {
    id: string // Ad ID
  }
}

export default async function EditAdPage({ params }: Props) {
  const { id: adId } = params

  const { user } = await getMeUser({
    nullUserRedirect: `/login?error=${encodeURIComponent(
      'You must be logged in to edit an ad.',
    )}&redirect=${encodeURIComponent(`/account/my-ads/edit/${adId}`)}`,
  })

  if (!user) {
    return redirect(`/login?error=${encodeURIComponent( // Should be handled by getMeUser
        'You must be logged in to edit an ad.',
      )}&redirect=${encodeURIComponent(`/account/my-ads/edit/${adId}`)}`);
  }

  // Fetch Ad data
  let adToEdit: Ad | null = null
  let categories: Category[] = []
  let error: string | null = null

  try {
    // Fetch Ad
    const adResponse = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: AD_QUERY_BY_ID, // Use the specific query for fetching by ID
        variables: { id: adId },
      }),
      next: { tags: [`ad_${adId}`] }, // Keep specific cache tag
    })

    if (!adResponse.ok) throw new Error(`Error fetching ad: ${adResponse.statusText}`)
    const adResult = await adResponse.json()
    if (adResult.errors) throw new Error(`GraphQL Error: ${adResult.errors.map((e:any) => e.message).join(', ')}`)

    adToEdit = adResult.data?.Ads?.docs?.[0]
    if (!adToEdit) return notFound()

    // Check ownership
    const authorId = typeof adToEdit.author === 'string' ? adToEdit.author : adToEdit.author?.id
    if (authorId !== user.id && !user.roles?.includes('admin')) {
       // If not owner and not admin, redirect or show error
      return redirect(`/account/my-ads?error=${encodeURIComponent("You don't have permission to edit this ad.")}`)
    }

    // Fetch Categories
    const catResponse = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: CATEGORIES_QUERY }),
      next: { tags: ['categories_list'] }
    })
    if (!catResponse.ok) throw new Error(`Error fetching categories: ${catResponse.statusText}`)
    const catResult = await catResponse.json()
    if (catResult.errors) throw new Error(`GraphQL Error: ${catResult.errors.map((e:any) => e.message).join(', ')}`)
    categories = catResult.data?.Categories?.docs || []

  } catch (e) {
    console.error(e)
    error = e.message || "An error occurred while fetching data."
  }

  if (error) {
    return (
      <Gutter className={classes.container}>
        <p className={classes.error}>{error}</p>
      </Gutter>
    )
  }

  if (!adToEdit) {
    // Should be caught by notFound() earlier
    return <p>Ad not found.</p>
  }

  return (
    <Gutter className={classes.container}>
      <h1>Edit Ad: {adToEdit.title}</h1>
      <HR />
      <EditAdForm user={user} ad={adToEdit} categories={categories} />
    </Gutter>
  )
}

export async function generateMetadata({ params }: Props) {
  // In a real app, fetch ad title for metadata
  return {
    title: `Edit Ad`,
    description: 'Edit your existing ad.',
     robots: {
      index: false,
      follow: false // Discourage indexing of edit pages
    },
  }
}
