import type { CollectionConfig } from 'payload/types'
import { anyone } from '../../access/anyone'
import { isClerkAuthenticated } from '../../access/isClerkAuthenticated'
import { isOwnerOrAdmin } from './access/isOwnerOrAdmin'
import { populateAuthorClerkId } from './hooks/populateAuthorClerkId' // Import the new hook

export const Ads: CollectionConfig = {
  slug: 'ads',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'adType', 'status', 'authorClerkId'], // Changed author to authorClerkId
  },
  access: {
    read: anyone,
    create: isClerkAuthenticated, // Use the new Clerk-based check
    update: isOwnerOrAdmin,
    delete: isOwnerOrAdmin,
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
      name: 'authorClerkId',
      label: 'Author Clerk ID',
      type: 'text',
      required: true,
      index: true, // Good to index this field for lookups
      admin: {
        readOnly: true, // Should be set automatically by a hook
        position: 'sidebar',
      },
      // The hook to set this will be part of the collection-level hooks
      // or a dedicated hook that extracts Clerk user ID from req.auth (after Clerk middleware)
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
    beforeChange: [
      populateAuthorClerkId, // Use the imported hook
      // Add other beforeChange hooks here if needed, e.g., for slug generation if not field-level
    ],
    // beforeValidate: [ /* other hooks like slug generation */ ],
  },
}

export default Ads;
