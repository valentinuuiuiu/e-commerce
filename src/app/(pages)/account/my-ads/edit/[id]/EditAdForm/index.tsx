'use client'

import React, { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useRouter } from 'next/navigation'

import { Button } from '../../../../../_components/Button'
import { Input } from '../../../../../_components/Input'
import { Message } from '../../../../../_components/Message'
import { User, Category, Ad } from '../../../../../../payload/payload-types'
import { UPDATE_AD_MUTATION } from '../../../../../_graphql/ads'
import { getCookie } from '../../../../../_api/token'
import RichTextEditor from './RichTextEditor' // Assuming a basic RichText editor component

import classes from './index.module.scss' // Can reuse PostAdForm styles or create new

type AdFormData = {
  title: string
  description: any // For RichText, this will be Payload's RichText JSON structure
  price: number
  currency: 'RON' | 'EUR'
  location: string
  adType: 'for-sale' | 'wanted' | 'service'
  categories: string[] // Array of category IDs
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  status: 'draft' | 'published' | 'archived'
}

type Props = {
  user: User
  ad: Ad // The ad data to pre-fill the form
  categories: Category[]
}

// Helper to convert Payload RichText to plain text for textarea (if not using RichText editor)
// Or, if description is already plain text from Payload, this is not needed.
const getPlainTextFromRichText = (content: any): string => {
  if (!content || !content.root || !content.root.children) return ''
  return content.root.children
    .map((child: any) =>
      child.children?.map((grandChild: any) => grandChild.text).join('') || ''
    )
    .join('\\n') // Or some other separator
}


export const EditAdForm: React.FC<Props> = ({ user, ad, categories }) => {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Prepare default values for the form
  const defaultValues: Partial<AdFormData> = {
    title: ad.title || '',
    // If ad.description is RichText JSON, and your form field is a simple textarea,
    // you need to convert it. If using a RichText editor, pass the JSON directly.
    description: typeof ad.description === 'string' ? ad.description : ad.description, // Assuming it's already plain text or handled by editor
    price: ad.price || 0,
    currency: ad.currency as 'RON' | 'EUR' || 'RON',
    location: ad.location || '',
    adType: ad.adType as 'for-sale' | 'wanted' | 'service' || 'for-sale',
    categories: (ad.categories?.map(cat => (typeof cat === 'string' ? cat : cat.id)) || []) as string[],
    contactName: ad.contactName || user?.name || '',
    contactEmail: ad.contactEmail || user?.email || '',
    contactPhone: ad.contactPhone || '',
    status: ad.status as 'draft' | 'published' | 'archived' || 'draft',
  }

  // If description is RichText and you want to use a simple textarea (not recommended for editing RT)
  // defaultValues.description = getPlainTextFromRichText(ad.description);

  const {
    register,
    handleSubmit,
    formState: { errors, isLoading },
    control,
    reset,
    setValue, // To set RichText editor value if needed
  } = useForm<AdFormData>({ defaultValues })

  // Handle description: If it's RichText (object), the form needs a RichText editor.
  // If it was saved as plain text from Payload (e.g. a 'textarea' field type), then string is fine.
  // The Ad collection has 'description' as 'textarea', so it should be a string.

  useEffect(() => {
    // Reset form with ad data when `ad` prop changes (though typically it won't after initial load)
    reset(defaultValues)
  }, [ad, reset])


  const onSubmit = async (data: AdFormData) => {
    setError(null)
    setSuccess(null)
    const token = getCookie('payload-token')

    // Prepare data for mutation, especially description if it's RichText
    const mutationVariables: any = { ...data, id: ad.id, price: parseFloat(data.price as any) }

    // If your Payload 'description' field is RichText and you used a simple textarea:
    // you need to convert the string back to Payload RichText JSON format.
    // This is error-prone. It's better to use a RichText editor that outputs the correct JSON.
    // For now, assuming 'description' in Payload's 'Ads' collection is 'textarea' (string).
    // If it were RichText:
    // if (typeof data.description === 'string') {
    //   mutationVariables.description = { root: { children: [{ type: 'p', children: [{ text: data.description }] }]}};
    // }


    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `JWT ${token}` }),
        },
        body: JSON.stringify({
          query: UPDATE_AD_MUTATION,
          variables: mutationVariables,
        }),
      })

      const result = await response.json()

      if (result.errors) {
        throw new Error(result.errors.map((e: any) => e.message).join(', '))
      }

      if (!result.data?.updateAd?.id) {
        throw new Error('Ad update failed. No ID returned.')
      }

      setSuccess(`Ad "${result.data.updateAd.title}" updated successfully!`)
      // Optionally redirect or update UI
      // router.push(`/ads/${result.data.updateAd.slug || result.data.updateAd.id}`);
      router.refresh(); // Refresh server components on the page if any, or redirect.

    } catch (err) {
      console.error('Ad Update Error:', err)
      setError(err.message || 'An error occurred while updating the ad.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={classes.form}>
      {error && <Message error={error} />}
      {success && <Message success={success} />}

      <Input
        label="Title"
        name="title"
        required
        register={register}
        error={errors.title}
        type="text"
      />

      {/* Assuming description is a simple textarea as per Ad collection */}
      <div>
        <label htmlFor="description" className={classes.label}>Description</label>
        <textarea
          id="description"
          {...register('description', { required: 'Description is required' })}
          className={classes.textarea}
          rows={6}
        />
        {errors.description && <span className={classes.errorMessage}>{errors.description.message}</span>}
      </div>

      {/*
        If using a RichText editor:
        <Controller
            name="description"
            control={control}
            render={({ field }) => (
                <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                />
            )}
        />
        {errors.description && <span className={classes.errorMessage}>{errors.description.message}</span>}
      */}

      <div className={classes.priceCurrency}>
        <Input
            label="Price"
            name="price"
            type="number"
            step="0.01"
            required
            register={register}
            error={errors.price}
        />
        <Controller
            name="currency"
            control={control}
            rules={{ required: "Currency is required" }}
            render={({ field }) => (
                <select {...field} className={classes.select}>
                    <option value="RON">RON</option>
                    <option value="EUR">EUR</option>
                </select>
            )}
        />
        {errors.currency && <span className={classes.errorMessage}>{errors.currency.message}</span>}
      </div>

      <Input
        label="Location"
        name="location"
        required
        register={register}
        error={errors.location}
        type="text"
      />

      <div>
        <label htmlFor="adType" className={classes.label}>Ad Type</label>
        <Controller
            name="adType"
            control={control}
            rules={{ required: "Ad type is required" }}
            render={({ field }) => (
                <select {...field} id="adType" className={classes.select}>
                    <option value="for-sale">For Sale</option>
                    <option value="wanted">Wanted</option>
                    <option value="service">Service</option>
                </select>
            )}
        />
        {errors.adType && <span className={classes.errorMessage}>{errors.adType.message}</span>}
      </div>

      <div>
        <label htmlFor="categories" className={classes.label}>Categories</label>
        <Controller
            name="categories"
            control={control}
            render={({ field }) => (
                <select
                    {...field}
                    id="categories"
                    multiple
                    className={classes.selectMultiple}
                    onChange={(e) => {
                        const values = Array.from(e.target.selectedOptions, option => option.value);
                        field.onChange(values);
                    }}
                >
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.title}</option>
                    ))}
                </select>
            )}
        />
        {errors.categories && <span className={classes.errorMessage}>{errors.categories.message}</span>}
        <p className={classes.fieldDescription}>Hold Ctrl/Cmd to select multiple categories.</p>
      </div>

      <h3 className={classes.subheading}>Contact Information</h3>
      <Input
        label="Contact Name"
        name="contactName"
        register={register}
        error={errors.contactName}
        type="text"
      />
      <Input
        label="Contact Phone"
        name="contactPhone"
        register={register}
        error={errors.contactPhone}
        type="tel"
      />
      <Input
        label="Contact Email"
        name="contactEmail"
        register={register}
        error={errors.contactEmail}
        type="email"
      />

      <div>
        <label htmlFor="status" className={classes.label}>Status</label>
        <Controller
            name="status"
            control={control}
            render={({ field }) => (
                <select {...field} id="status" className={classes.select}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value: "archived">Archived</option>
                </select>
            )}
        />
      </div>

      <Button
        type="submit"
        label={isLoading ? 'Saving...' : 'Save Changes'}
        appearance="primary"
        disabled={isLoading}
        className={classes.submitButton}
      />
    </form>
  )
}
