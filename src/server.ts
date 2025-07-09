import dotenv from 'dotenv'
import next from 'next'
import nextBuild from 'next/dist/build'
import path from 'path'

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
})

import express from 'express'
import payload from 'payload'
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node' // Import Clerk middleware

import { seed } from './payload/seed'

const app = express()
const PORT = process.env.PORT || 3000

// Define options for ClerkExpressRequireAuth if needed, e.g., for error handling
// const clerkAuthOptions = {
//   onError: (error) => {
//     console.error('Clerk Auth Error:', error);
//   },
//   authorizedParties: [ /* process.env.CLERK_AZP_URL or similar if you have multiple authorized parties */ ]
// };


const start = async (): Promise<void> => {
  // Initialize Payload
  await payload.init({
    secret: process.env.PAYLOAD_SECRET || '',
    express: app,
    onInit: () => {
      payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`)
    },
  })

  // IMPORTANT: Add Clerk middleware *before* Payload's request handlers
  // but *after* Payload init if Payload adds its own global middlewares first.
  // Typically, auth middleware should come very early.
  // ClerkExpressRequireAuth will protect all routes after it.
  // We might need more granular protection if some Payload API routes should be public.
  // For now, let's apply it broadly to requests that might reach Payload's API.
  // The Next.js middleware (`middleware.ts`) already protects frontend routes.
  // This server-side middleware is for direct API calls to Payload (e.g. from frontend forms).

  // This will protect all routes handled by Payload's Express app.
  // If specific Payload endpoints (e.g., /api/graphql) need to be public or have different auth,
  // this needs to be more granular, potentially by applying it only to specific routers/paths.
  // The `ClerkExpressRequireAuth` will throw an error for unauthenticated requests.
  // `ClerkExpressWithAuth` would make `req.auth` available but not throw an error,
  // allowing downstream handlers/access controls to decide.
  // Given Payload access controls will check req.auth, `ClerkExpressWithAuth` is more appropriate.

  // Let's use ClerkExpressWithAuth to make req.auth available but not block unauthed requests here,
  // as Payload's own access controls (like `anyone` for read) should still function.
  // The frontend Next.js middleware will handle UI route protection.
  // This server.ts middleware ensures req.auth is populated for Payload's backend context.
  const { ClerkExpressWithAuth } = await import('@clerk/clerk-sdk-node');
  app.use(ClerkExpressWithAuth({
    // Optional: Configure options like frontendApi, publishableKey if not picked from env automatically
    // Or if you need to handle errors more specifically.
    // For now, default options should work if CLERK_SECRET_KEY is set.
  }));

  // Middleware to bridge Clerk auth to a simplified req.user for Payload Admin
  app.use((req: any, res, next) => { // Use 'any' for req to attach custom props
    if (req.auth && req.auth.userId && req.auth.claims?.metadata?.role === 'admin_marketplace') {
      // This user is considered a Payload admin based on Clerk role/metadata.
      // Create a minimal user object that Payload's admin UI might look for.
      // This does NOT re-create the full Payload user/auth system.
      req.user = {
        id: req.auth.userId, // Use Clerk ID
        // collection: 'users', // 'users' collection is removed
        // roles: ['admin'], // This might be useful if some deep Payload UI checks it
                            // but true permissioning should come from Clerk role via req.auth
        _payloadAdminAccess: true, // Custom flag
        // Add email or name if Payload admin UI uses it for display for the logged-in user
        email: req.auth.claims?.email,
        // name: req.auth.claims?.name // if available
      };
    }
    next();
  });

  if (process.env.PAYLOAD_SEED === 'true') {
    await seed(payload)
    process.exit()
  }

  if (process.env.NEXT_BUILD) {
    app.listen(PORT, async () => {
      payload.logger.info(`Next.js is now building...`)
      // @ts-expect-error
      await nextBuild(path.join(__dirname, '../'))
      process.exit()
    })

    return
  }

  const nextApp = next({
    dev: process.env.NODE_ENV !== 'production',
  })

  const nextHandler = nextApp.getRequestHandler()

  app.use((req, res) => nextHandler(req, res))

  nextApp.prepare().then(() => {
    payload.logger.info('Starting Next.js...')

    app.listen(PORT, async () => {
      payload.logger.info(`Next.js App URL: ${process.env.PAYLOAD_PUBLIC_SERVER_URL}`)
    })
  })
}

start()
