import type { CollectionConfig } from 'payload/types'

import { admins } from '../../access/admins'
import { anyone } from '../../access/anyone'
import adminsAndUser from './access/adminsAndUser'
import { checkRole } from './checkRole'
import { ensureFirstUserIsAdmin } from './hooks/ensureFirstUserIsAdmin'
import { loginAfterCreate } from './hooks/loginAfterCreate'
// Removed Stripe customer related imports: customerProxy, createStripeCustomer, CustomerSelect, resolveDuplicatePurchases

const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email'],
  },
  access: {
    read: adminsAndUser,
    create: anyone,
    update: adminsAndUser,
    delete: admins,
    admin: ({ req: { user } }) => checkRole(['admin'], user),
  },
  hooks: {
    // beforeChange: [createStripeCustomer], // Removed createStripeCustomer
    afterChange: [loginAfterCreate], // loginAfterCreate hook is fine
  },
  auth: true,
  endpoints: [ // Removed customerProxy endpoints
  ],
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      defaultValue: ['user'], // Changed default role to 'user'
      options: [
        {
          label: 'Admin', // Changed label for clarity
          value: 'admin',
        },
        {
          label: 'User', // Changed label for clarity
          value: 'user',
        },
      ],
      hooks: {
        beforeChange: [ensureFirstUserIsAdmin],
      },
      access: {
        read: admins,
        create: admins,
        update: admins,
      },
    },
    // Removed 'purchases' field
    // Removed 'stripeCustomerID' field
    // Removed 'cart' field
    {
      name: 'skipSync', // This field seems generic, keeping it for now.
      label: 'Skip Sync',
      type: 'checkbox',
      admin: {
        position: 'sidebar',
        readOnly: true,
        hidden: true,
      },
    },
  ],
  timestamps: true,
}

export default Users
