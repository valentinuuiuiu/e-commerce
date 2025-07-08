import { authMiddleware } from "@clerk/nextjs/server"; // Updated import for v5

export default authMiddleware({
  // Public routes are accessible to all users
  publicRoutes: [
    "/",
    "/ads",
    "/ads/:slug", // Clerk middleware might need a regex or more specific pattern for dynamic routes if not matching directly
    "/sign-in",
    "/sign-in/(.*)", // To match all subpaths of sign-in if Clerk uses them
    "/sign-up",
    "/sign-up/(.*)", // To match all subpaths of sign-up
    "/api/graphql", // Payload GraphQL endpoint
    "/api/payload-token", // If you have an endpoint to get payload token after clerk auth for admin bar
    // Add any other public static assets or API routes here if needed
    // e.g., /favicon.ico, /og-image.png
  ],

  // Routes that should be ignored by the middleware (e.g., Next.js internals, static files)
  // Clerk's authMiddleware usually handles common static assets well, but explicit ignores can be added.
  // ignoredRoutes: ["/api/webhook", "/_next/static/(.*)"],

  // For Payload Admin UI access:
  // If you want to protect the Payload admin panel with Clerk,
  // you'll need to ensure that users authenticated via Clerk
  // can be recognized as Payload admins. This might involve:
  // 1. Redirecting to Clerk sign-in for '/admin'.
  // 2. After Clerk sign-in, if the user has an 'admin' role in Clerk metadata,
  //    they could be allowed into '/admin'.
  // 3. Payload itself would need to either:
  //    a) Also use Clerk for its admin user determination (complex change to Payload core).
  //    b) Have a way to map Clerk users to Payload admin roles, perhaps via a custom endpoint
  //       that generates a Payload JWT for an admin Clerk user.
  // For now, `/admin` is not explicitly in publicRoutes, so it will be protected by default.
});

export const config = {
  // Protects all routes, including api/trpc.
  // See https://clerk.com/docs/references/nextjs/auth-middleware
  // for more information about configuring your Middleware
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!.+\\.[\\w]+$|_next).*)",
    // Match root route explicitly
    "/",
    // Match API routes
    "/(api|trpc)(.*)"
  ],
};
