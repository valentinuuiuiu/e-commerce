import { webpackBundler } from '@payloadcms/bundler-webpack' // bundler-import
import { mongooseAdapter } from '@payloadcms/db-mongodb' // database-adapter-import
import { payloadCloud } from '@payloadcms/plugin-cloud'
// import formBuilder from '@payloadcms/plugin-form-builder'
import nestedDocs from '@payloadcms/plugin-nested-docs'
import redirects from '@payloadcms/plugin-redirects'
import seo from '@payloadcms/plugin-seo'
import type { GenerateTitle } from '@payloadcms/plugin-seo/types'
import stripePlugin from '@payloadcms/plugin-stripe'
import { slateEditor } from '@payloadcms/richtext-slate' // editor-import
import dotenv from 'dotenv'
import path from 'path'
import { buildConfig } from 'payload/config'

import Ads from './collections/Ads' // Import the new Ads collection
import Categories from './collections/Categories'
import { Media } from './collections/Media'
// import { Orders } from './collections/Orders' // Removed Orders
import { Pages } from './collections/Pages'
// import Products from './collections/Products' // Removed Products
// import Users from './collections/Users' // Removed Users collection import
import BeforeDashboard from './components/BeforeDashboard'
import BeforeLogin from './components/BeforeLogin' // Re-importing to comment out its usage properly
// import { createPaymentIntent } from './endpoints/create-payment-intent' // Removed
// import { customersProxy } from './endpoints/customers' // Removed
// import { productsProxy } from './endpoints/products' // Removed
// import { seed } from './endpoints/seed' // Removed for now
import { Footer } from './globals/Footer'
import { Header } from './globals/Header'
import { Settings } from './globals/Settings'
// import { priceUpdated } from './stripe/webhooks/priceUpdated' // Removed as product webhooks are disabled
// import { productUpdated } from './stripe/webhooks/productUpdated' // Removed as product webhooks are disabled

const generateTitle: GenerateTitle = () => {
  return 'My Store'
}

const mockModulePath = path.resolve(__dirname, './emptyModuleMock.js')

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
})

export default buildConfig({
  admin: {
    // user: Users.slug, // This was removed as Payload's Users collection is gone for auth.
    // Admin panel access control will now be primarily gated by Clerk middleware for the /admin route,
    // and this access function for Payload's internal admin permission checks.
    access: ({ req }: { req: any }) => { // Use 'any' for req to access custom req.auth
      // Check for a specific role/claim in Clerk's JWT that designates an admin.
      // This role ('admin_marketplace') must be set in your Clerk dashboard for admin users.
      // @ts-ignore req.auth might not be typed on default Payload Request type yet
      if (req.auth && req.auth.userId && req.auth.claims?.metadata?.role === 'admin_marketplace') {
        return true; // Allow access to Payload admin panel
      }
      // Deny access if not a designated Clerk admin, even if they passed Clerk's route protection.
      return false;
    },
    bundler: webpackBundler(), // bundler-config
    components: {
      // The `BeforeLogin` component might not be relevant if Clerk handles the login to admin.
      // beforeLogin: [BeforeLogin], // Commented out
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeDashboard` statement on line 15.
      beforeDashboard: [BeforeDashboard], // This can likely stay
    },
    webpack: config => {
      return {
        ...config,
        resolve: {
          ...config.resolve,
          alias: {
            ...config.resolve?.alias,
            dotenv: path.resolve(__dirname, './dotenv.js'),
            // Removed mock for Products hooks: [path.resolve(__dirname, 'collections/Products/hooks/beforeChange')]: mockModulePath,
            // Removed Users related mocks as Users collection is being removed
            // [path.resolve(__dirname, 'collections/Users/hooks/createStripeCustomer')]: mockModulePath,
            // [path.resolve(__dirname, 'collections/Users/endpoints/customer')]: mockModulePath,
            [path.resolve(__dirname, 'endpoints/create-payment-intent')]: mockModulePath,
            [path.resolve(__dirname, 'endpoints/customers')]: mockModulePath,
            [path.resolve(__dirname, 'endpoints/products')]: mockModulePath,
            [path.resolve(__dirname, 'endpoints/seed')]: mockModulePath,
            stripe: mockModulePath,
            express: mockModulePath,
          },
        },
      }
    },
  },
  editor: slateEditor({}), // editor-config
  // database-adapter-config-start
  db: mongooseAdapter({
    url: process.env.DATABASE_URI,
  }),
  // database-adapter-config-end
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
  collections: [Pages, Ads, Media, Categories], // Removed Users
  globals: [Settings, Header, Footer],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },
  cors: ['https://checkout.stripe.com', process.env.PAYLOAD_PUBLIC_SERVER_URL || ''].filter(
    Boolean,
  ),
  csrf: ['https://checkout.stripe.com', process.env.PAYLOAD_PUBLIC_SERVER_URL || ''].filter(
    Boolean,
  ),
  endpoints: [
    // All e-commerce and seed endpoints removed for now
    // If a new seed endpoint is needed for 'Ads', it will be added here later.
  ],
  plugins: [
    // formBuilder({}),
    stripePlugin({ // Stripe plugin kept for potential future use (e.g. ad credits)
      stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
      isTestKey: Boolean(process.env.PAYLOAD_PUBLIC_STRIPE_IS_TEST_KEY),
      stripeWebhooksEndpointSecret: process.env.STRIPE_WEBHOOKS_SIGNING_SECRET,
      rest: false,
      // Removed product-specific webhooks as Products collection is removed
      // webhooks: {
      //   'product.created': productUpdated,
      //   'product.updated': productUpdated,
      //   'price.updated': priceUpdated,
      // },
    }),
    redirects({
      collections: ['pages', 'ads'], // Removed 'products'
    }),
    nestedDocs({
      collections: ['categories'],
    }),
    seo({
      collections: ['pages', 'ads'], // Removed 'products'
      generateTitle,
      uploadsCollection: 'media',
    }),
    payloadCloud(),
  ],
})
