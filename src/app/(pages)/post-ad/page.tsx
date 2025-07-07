import React from 'react'
import { redirect } from 'next/navigation'

import { Gutter } from '../../_components/Gutter'
import { getMeUser } from '../../_utilities/getMeUser'
import { PostAdForm } from './PostAdForm' // Client component
import classes from './index.module.scss' // Optional: styles for the page wrapper
import { HR } from '../../_components/HR'
import { CATEGORIES_QUERY } from '../../_graphql/categories' // Query for categories

export default async function PostAdPage() {
  const { user } = await getMeUser({
    nullUserRedirect: `/login?error=${encodeURIComponent(
      'You must be logged in to post an ad.',
    )}&redirect=${encodeURIComponent('/post-ad')}`,
  })

  // If user is not found (e.g. cookie expired, etc.), getMeUser will redirect.
  // But as a safeguard:
  if (!user) {
    // This redirect might be hit if getMeUser's internal redirect doesn't happen first
    // or if there's an unexpected state.
    return redirect(`/login?error=${encodeURIComponent(
      'You must be logged in to post an ad.',
    )}&redirect=${encodeURIComponent('/post-ad')}`);
  }

  // Fetch categories for the form
  let categories: any[] = [] // Payload Category type
  let error: string | null = null

  try {
    const response = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: CATEGORIES_QUERY }), // Using the existing categories query
      // cache: 'no-store', // Or use revalidation tags if categories change often
      next: { tags: ['categories_list'] }
    })

    if (!response.ok) {
      error = `Error fetching categories: ${response.statusText}`
    } else {
      const result = await response.json()
      if (result.errors) {
        error = `GraphQL Error: ${result.errors.map((e:any) => e.message).join(', ')}`
      } else {
        categories = result.data?.Categories?.docs || []
      }
    }
  } catch (e) {
    error = `Network error fetching categories: ${e.message}`
    console.error(e)
  }


  return (
    <Gutter className={classes.container}>
      <h1>Post a New Ad</h1>
      <HR />
      {error && <p className={classes.error}>{error}</p>}
      <PostAdForm user={user} categories={categories} />
    </Gutter>
  )
}

export async function generateMetadata() {
  return {
    title: 'Post New Ad',
    description: 'Create and publish a new ad on our marketplace.',
  }
}
