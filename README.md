# Payload Marketplace Template 

This template, originally forked from the official [Payload E-Commerce Template](https://github.com/payloadcms/payload/blob/main/templates/ecommerce), has been modified to function as a classified ads marketplace, similar to sites like Publi24.ro. It allows users to post, browse, and manage ads across various categories. This repo includes a fully-working backend using PayloadCMS, an admin panel, and a Next.js frontend.

This template is right for you if you need a platform for:

- Users posting classified ads for goods or services.
- Browsing ads by category, location, or keywords.
- Managing user accounts and their posted ads.
- A starting point for a community marketplace or local classifieds site.

Core features:

- [Pre-configured Payload Config](#how-it-works) for a marketplace.
- [User Authentication](#users-authentication) (for posting and managing ads).
- [Role-Based Access Control](#access-control).
- [Ad Posting & Management](#ad-management) by users.
- [Categorized Ad Listings](#ad-listings) with basic search/filter capabilities.
- [Responsive Website](#website) built with Next.js.
- [SEO](#seo) capabilities for ads and pages.
- (Future Potential: Shopping Cart for ad promotions/credits).

## Quick Start

To spin up this example locally, follow these steps:

### Clone

If you have not done so already, you need to have standalone copy of this repo on your machine. If you've already cloned this repo, skip to [Development](#development).

#### Method 1 (recommended)

  Go to Payload Cloud and [clone this template](https://payloadcms.com/new/clone/ecommerce). This will create a new repository on your GitHub account with this template's code which you can then clone to your own machine.

#### Method 2

  Use the `create-payload-app` CLI to clone this template directly to your machine:

    npx create-payload-app@latest my-project -t ecommerce

#### Method 3

  Use the `git` CLI to clone this template directly to your machine:

    git clone -n --depth=1 --filter=tree:0 https://github.com/payloadcms/payload my-project && cd my-project && git sparse-checkout set --no-cone templates/ecommerce && git checkout && rm -rf .git && git init && git add . && git mv -f templates/ecommerce/{.,}* . && git add . && git commit -m "Initial commit"

### Development

1. First [clone the repo](#clone) if you have not done so already
1. `cd my-project && cp .env.example .env` to copy the example environment variables
1. `yarn && yarn dev` to install dependencies and start the dev server
1. `open http://localhost:3000` to open the app in your browser

That's it! Changes made in `./src` will be reflected in your app. Follow the on-screen instructions to login and create your first admin user (e.g., `ionutbaltag3@gmail.com` or your preferred email). The Stripe integration for direct product sales has been altered; see the [Stripe](#stripe) section for its current status. Then check out [Production](#production) once you're ready to build and serve your app, and [Deployment](#deployment) when you're ready to go live.

## How it works

The Payload config has been adapted for a marketplace/classified ads platform.

### Collections

See the [Collections](https://payloadcms.com/docs/configuration/collections)  docs for details on how to extend this functionality.

- #### Users (Authentication)

  Users are auth-enabled. There are two primary roles: `admin` and `user`.
  - `admin` users can access the Payload admin panel to manage the entire platform (users, ads, categories, site settings).
  - `user` roles can register, log in, post ads, and manage their own ads through the frontend interface.
  See [Access Control](#access-control) for more details.

  For additional help on authentication, see the official [Payload Authentication](https://payloadcms.com/docs/authentication/overview#authentication-overview) docs.

- #### Ads (Replaces Products) <a name="ad-management"></a> <a name="ad-listings"></a>

  This is the core collection for marketplace listings, replacing the original `Products` collection. Key fields include:
  - `title`: The title of the ad.
  - `description`: Detailed description of the item/service.
  - `price` & `currency`: Price set by the user.
  - `location`: Location of the item/service.
  - `adType`: Type of ad (e.g., 'For Sale', 'Wanted', 'Service').
  - `author`: A relationship to the `Users` collection, indicating who posted the ad.
  - `categories`: Relationship to the `Categories` collection.
  - `status`: Draft, Published, Archived.
  - `contactName`, `contactPhone`, `contactEmail`: Optional contact details specific to the ad.
  - `slug`: Auto-generated for SEO-friendly URLs.

  The original `Products` collection still exists in the codebase but is not actively used by the marketplace frontend. It can be removed or repurposed later.

- #### Orders

  The `Orders` collection, previously used for e-commerce transactions, is currently not directly used by the ad posting flow. It might be repurposed if features like paid ad promotions or credit packages are implemented.

- #### Pages

  All pages are layout builder enabled so you can generate unique layouts for each page using layout-building blocks, see [Layout Builder](#layout-builder) for more details.

- #### Media

  This is the uploads enabled collection used by products and pages to contain media like images, videos, downloads, and other assets.

- #### Categories

  A taxonomy used to group products together. Categories can be nested inside of one another, for example "Courses > Technology". See the official [Payload Nested Docs Plugin](https://github.com/payloadcms/plugin-nested-docs) for more details.

### Globals

See the [Globals](https://payloadcms.com/docs/configuration/globals) docs for details on how to extend this functionality.

- `Header`

  The data required by the header on your front-end like nav links.

- `Footer`

  Same as above but for the footer of your site.

## Access control

Role-based access control is configured for the marketplace:

- `admin`: Can access the Payload admin panel, manage all data (users, ads, categories, etc.).
- `user`: Can register and log in via the frontend. They can create new ads, and view, edit, or delete their own ads. They cannot access the Payload admin panel.

This applies to collections:

- `Users`:
    - Admins can manage all users.
    - Logged-in users can view and update their own profile.
    - Anyone can create a new user account.
- `Ads`:
    - Logged-in users can create ads (author is automatically assigned).
    - Users can only update or delete ads they authored. Admins can update/delete any ad.
    - All users (including guests) can read/view published ads.
- `Categories`, `Pages`, `Media`: Generally readable by anyone; creation/modification restricted to admins.

For more details on extending access control, see the [Payload Access Control](https://payloadcms.com/docs/access-control/overview#access-control) docs.

## Shopping Cart (Potential Future Use)

The `cart` field on the `User` collection and related Cart UI components have been kept, though they are not used in the current ad posting flow. This is in anticipation of potentially using a cart system for users to purchase ad promotion packages or site credits in the future. If this functionality is not desired, these components and fields can be removed.
The original e-commerce `CartLink` in the header has been removed.

```ts
{
  name: 'cart',
  label: 'Shopping Cart',
  type: 'object',
  fields: [
    {
      name: 'items',
      label: 'Items',
      type: 'array',
      fields: [
        // product, quantity, etc
      ]
    },
    // other metadata like `createdOn`, etc
  ]
}
```

## Stripe Integration (Altered)

The original e-commerce template had a deep Stripe integration for selling products directly. This has been significantly altered:
- The direct link between `Products` (now `Ads`) and Stripe products for automatic syncing has been removed. Ads have user-defined prices.
- The `/api/create-payment-intent` endpoint and related checkout flow for purchasing platform products have been disabled.
- User `purchases` and `stripeCustomerID` fields related to buying platform products have been removed from the `User` collection.

The Payload Stripe Plugin is still active in the configuration. This allows for future implementation of Stripe for marketplace-specific monetization, such as:
- Charging users for posting ads.
- Selling ad promotion packages or site credits (potentially using the [Shopping Cart](#shopping-cart) functionality).

If you plan to implement such features, you will still need to `Connect Stripe` (see original instructions below, but adapt for your new use case) by providing your API keys in the `.env` file. The existing webhooks for `product.created`, `product.updated`, and `price.updated` might not be relevant unless you re-introduce a similar product concept for ad packages. The `user.create` hook for creating Stripe customers might still be useful.

### Connect Stripe (For Future Monetization)

To integrate with Stripe for potential future monetization features (original instructions adapted):

1. Create a [Stripe](https://stripe.com) account if you do not already have one.
1. Retrieve your [Stripe API keys](https://dashboard.stripe.com/test/apikeys) and paste them into your `.env`:
   ```bash
   STRIPE_SECRET_KEY=
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
   ```
1. If using webhooks for new Stripe functionalities (e.g., for credit purchases), set them up:
   ```bash
   stripe login # follow the prompts
   yarn stripe:webhooks # Or configure webhooks manually in Stripe dashboard
   ```
1. Paste the relevant webhook signing secret into your `.env`:
   ```bash
   STRIPE_WEBHOOKS_SIGNING_SECRET=
   ```
1. Reboot Payload to ensure that Stripe connects.

## Checkout and Paywall (Removed)

The original e-commerce checkout process and product paywall features have been removed as they are not directly applicable to the current classified ads model.
If monetization features (like paid ads or premium access) are added, a new checkout or access control mechanism specific to those features would need to be implemented.

```ts
{
  name: 'purchases',
  label: 'Purchases',
  type: 'array',
  fields: [
    {
      name: 'product',
      label: 'Product',
      type: 'relationship',
      relationTo: 'products',
    },
    // other metadata like `createdOn`, etc
  ]
}
```

Then, a `paywall` field is added to the `product` with `read` access control set to check for associated purchases. Every time a user requests a product, this will only return data to those who have purchased it:

```ts
{
  name: 'paywall',
  label: 'Paywall',
  type: 'blocks',
  access: {
    read: checkUserPurchases,
  },
  fields: [
    // assets
  ]
}
```

## Layout Builder

Create unique product and page layouts for any type fo content using a powerful layout builder. This template comes pre-configured with the following layout building blocks:

- Hero (can be used for static pages)
- Content (for static pages like "About Us", "Terms")
- Media (for images in static pages)
- Call To Action (for static pages)
- Archive (can be adapted to list Ads if needed, though current Ad listings are custom)

The `Ads` collection itself does not use the layout builder for its content field, opting for a simpler description field.

## Draft Preview

Pages and Ads support Payload's draft preview functionality using [Versions](https://payloadcms.com/docs/configuration/collections#versions). This means you can save drafts and preview them before publishing. The necessary hooks for revalidation on publish are generally in place.

For more details, see the official [Draft Preview Example](https://github.com/payloadcms/payload/tree/main/examples/draft-preview).

## SEO

The [Payload SEO Plugin](https://github.com/payloadcms/plugin-seo) is configured for `Pages` and `Ads`, allowing SEO data (title, description, image) to be managed from the admin panel. This data is used in the frontend to generate meta tags.

## Redirects

The [Payload Redirects Plugin](https://github.com/payloadcms/plugin-redirects) is configured for `Pages` and `Ads`, enabling management of URL redirects.

## Website

The frontend is a Next.js application using the App Router, served alongside PayloadCMS.

Core frontend features for the marketplace:

- User Authentication (Login, Register, Account Management)
- Ad Listings: Browse ads, basic filtering (by category planned).
- Single Ad View: Detailed page for each ad.
- Ad Posting: Form for registered users to post new ads.
- My Ads: Dashboard for users to view and manage their posted ads (edit, delete - delete is WIP).
- Homepage: Displays categories and recent ads.
- Dark Mode support (inherited from original template).
- SEO integration for ads and pages.
- (Future Potential: Shopping cart for ad credits/promotions).

The original e-commerce frontend pages (product listings, product detail, cart, checkout, order history) have been mostly removed or repurposed. The `Products` collection and its data are no longer the primary focus of the frontend.

### Cache

Although Next.js includes a robust set of caching strategies out of the box, Payload Cloud proxies and caches all files through Cloudflare using the [Official Cloud Plugin](https://github.com/payloadcms/plugin-cloud). This means that Next.js caching is not needed and is disabled by default. If you are hosting your app outside of Payload Cloud, you can easily reenable the Next.js caching mechanisms by removing the `no-store` directive from all fetch requests in `./src/app/_api` and then removing all instances of `export const dynamic = 'force-dynamic'` from pages files, such as `./src/app/(pages)/[slug]/page.tsx`. For more details, see the official [Next.js Caching Docs](https://nextjs.org/docs/app/building-your-application/caching).

### Eject

If you prefer another front-end framework or would like to use Payload as a standalone CMS, you can easily eject the front-end from this template. To eject, simply run `yarn eject`. This will uninstall all Next.js related dependencies and delete all files and folders related to the Next.js front-end. It also removes all custom routing from your `server.ts` file and updates your `eslintrc.js`.

> Note: Your eject script may not work as expected if you've made significant modifications to your project. If you run into any issues, compare your project's dependencies and file structure with this template. See [./src/eject](./src/eject) for full details.

For more details on how setup a custom server, see the official [Custom Server Example](https://github.com/payloadcms/payload/tree/main/examples/custom-server).

##  Development

To spin up this example locally, follow the [Quick Start](#quick-start).
The original Stripe connection for e-commerce payments is altered; see the [Stripe Integration (Altered)](#stripe-integration-altered) section.
The original database seed script (`yarn seed` and `/api/seed` endpoint) was for e-commerce products and has been disabled. You will need to create categories and ads manually via the Payload admin panel or develop a new seed script for marketplace content.

### Docker

Alternatively, you can use [Docker](https://www.docker.com) to spin up this template locally. To do so, follow these steps:

1. Follow [steps 1 and 2 from Development](#development), the docker-compose file will automatically use the `.env` file in your project root.
1. Next run `docker-compose up`.
1. Follow step 4 from [Development](#development) to open the app and create your first admin user.

That's it! The Docker instance will help you get up and running quickly while also standardizing the development environment across your teams.

### Seed (Updated)

The original seed command (`yarn seed`) and `GET /api/seed` endpoint were designed for the e-commerce template and populated `Products`. These have been disabled as they are no longer relevant.

To populate your marketplace with initial data (e.g., categories, sample ads):
- **Manual Entry:** Use the Payload admin panel (`/admin`) to create categories and ads.
- **Custom Seed Script:** You can develop a new seed script (e.g., in `src/payload/seed/`) that creates `Ads` and `Categories` documents. This script could be triggered manually (e.g., `yarn seed:marketplace`) or by a new custom endpoint if desired.

> NOTICE: If you create a new destructive seed script, ensure it's used with caution on existing databases.

## Production

To run Payload in production, you need to build and serve the Admin panel. To do so, follow these steps:

1. Invoke the `payload build` script by running `yarn build` or `npm run build` in your project root. This creates a `./build` directory with a production-ready admin bundle.
1. Finally run `yarn serve` or `npm run serve` to run Node in production and serve Payload from the `./build` directory.
1. When you're ready to go live, see [Deployment](#deployment) for more details.

### Deployment

Before deploying your app, you need to:

1. Switch [your Stripe account to live mode](https://stripe.com/docs/test-mode) and update your [Stripe API keys](https://dashboard.stripe.com/test/apikeys). See [Connect Stripe](#connect-stripe) for more details.
1. Ensure your app builds and serves in production. See [Production](#production) for more details.

The easiest way to deploy your project is to use [Payload Cloud](https://payloadcms.com/new/import), a one-click hosting solution to deploy production-ready instances of your Payload apps directly from your GitHub repo. You can also deploy your app manually, check out the [deployment documentation](https://payloadcms.com/docs/production/deployment) for full details.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
