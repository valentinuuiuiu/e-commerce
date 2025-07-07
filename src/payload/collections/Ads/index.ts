import type { CollectionConfig } from 'payload/types'
import { anyone } from '../../access/anyone'
import { loggedIn } from '../../access/loggedIn' // Assuming a generic loggedIn access control, will create if not present
import { isOwnerOrAdmin } from './access/isOwnerOrAdmin' // To be created

export const Ads: CollectionConfig = {
  slug: 'ads',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'adType', 'status', 'author'], // Added author
  },
  access: {
    read: anyone,
    create: loggedIn, // Placeholder, will refine
    update: isOwnerOrAdmin, // To be created
    delete: isOwnerOrAdmin, // To be created
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea', // Using textarea for simplicity, could be richText
      required: true,
    },
    {
      name: 'price',
      type: 'number',
      required: true,
    },
    {
      name: 'currency',
      type: 'select',
      options: [
        { label: 'RON', value: 'RON' },
        { label: 'EUR', value: 'EUR' },
      ],
      defaultValue: 'RON',
      required: true,
    },
    {
      name: 'location', // Simple text for now
      type: 'text',
      required: true,
    },
    {
      name: 'adType',
      type: 'select',
      options: [
        { label: 'For Sale', value: 'for-sale' },
        { label: 'Wanted', value: 'wanted' },
        { label: 'Service', value: 'service' },
      ],
      required: true,
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
    },
    {
      name: 'author', // Link to the user who created the ad
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        readOnly: true, // Should be set automatically
      },
      hooks: {
        beforeChange: [
          ({ req, operation, data }) => {
            if (operation === 'create') {
              if (req.user) {
                data.author = req.user.id
                return data.author
              }
            }
            // For updates, ensure author is not changed unless by admin (handled by access control)
            // Return undefined to prevent changes if not during create by user
            return undefined
          },
        ],
      },
    },
    {
      name: 'contactName',
      type: 'text',
    },
    {
      name: 'contactPhone',
      type: 'text',
    },
    {
      name: 'contactEmail',
      type: 'email',
    },
    // TODO: Add image/media field later. Payload's Media collection can be used.
    // Example:
    // {
    //   name: 'adImages',
    //   type: 'relationship',
    //   relationTo: 'media', // Assuming you have a 'media' collection
    //   hasMany: true,
    // },
    {
      name: 'status', // For draft/published/archived status
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
      defaultValue: 'draft',
      admin: {
        position: 'sidebar',
      },
    },
    // Slug field for SEO friendly URLs
    {
      name: 'slug',
      label: 'Slug',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value && data?.title) {
              return data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
            }
            return value;
          }
        ]
      },
      unique: true,
    }
  ],
  hooks: {
    // Hook to automatically populate contact fields from user profile on create if empty
    beforeChange: [
      async ({ req, operation, data }) => {
        if (operation === 'create' && req.user) {
          if (!data.contactName && req.user.name) {
            data.contactName = req.user.name;
          }
          if (!data.contactEmail && req.user.email) {
            data.contactEmail = req.user.email;
          }
          // Note: contactPhone would need to be a field on the user object if we want to auto-populate it.
          // For now, it remains manual or can be added to user profile later.

          // Set author on create
          if (req.user) {
            data.author = req.user.id;
          }
        }
        return data;
      }
    ]
  }
}

export default Ads;
