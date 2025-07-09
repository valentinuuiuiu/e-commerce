import React from 'react'
import { currentUser } from '@clerk/nextjs/server' // Import currentUser from Clerk for server components
import type { User as ClerkUser } from '@clerk/nextjs/api' // Type for Clerk user

import { Gutter } from '../../_components/Gutter'
// import { getMeUser } from '../../_utilities/getMeUser' // Removed old auth utility
import { PostAdForm } from './PostAdForm' // Client component
import classes from './index.module.scss'
import { HR } from '../../_components/HR'
import { CATEGORIES_QUERY } from '../../_graphql/categories' // Query for categories

export default async function PostAdPage() {
  // Route protection is handled by Clerk middleware.
  // Fetch Clerk user data on the server.
  const user: ClerkUser | null = await currentUser();

  // Although middleware protects the route, it's good practice to check for user
  // especially if you need user data. If middleware failed or is misconfigured,
  // this would be a fallback. For a page that *requires* auth, user should always exist.
  if (!user) {
    // This should ideally not be reached if middleware is correctly set up.
    // Clerk's middleware will typically redirect to sign-in.
    // If it is reached, it implies an issue or a direct access attempt bypassing normal flow.
    // You could throw an error or redirect, though middleware should handle this.
    // For now, we assume middleware has done its job.
    // Consider what to do if user is null despite protected route.
    // Perhaps redirect('/sign-in'); or throw new Error('User not authenticated for protected route');
  }

  // Prepare a simplified user object for the form, if needed for pre-filling
  // The PostAdForm will use Clerk's useUser() hook on the client-side for most up-to-date info
  // but we can pass initial values from server if desired (e.g., for non-sensitive defaults).
  const initialUserFormData = user ? {
    id: user.id, // Clerk User ID
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || '',
    email: user.primaryEmailAddress?.emailAddress || '',
  } : null;


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
      {/* Pass the simplified Clerk user data for potential pre-filling.
          The PostAdForm client component will primarily use useUser() for up-to-date Clerk data. */}
      <PostAdForm initialUserData={initialUserFormData} categories={categories} />
    </Gutter>
  )
}

export async function generateMetadata() {
  return {
    title: 'Post New Ad',
    description: 'Create and publish a new ad on our marketplace.',
  }
}
