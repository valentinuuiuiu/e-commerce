'use client'

import React, { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { useUser, useAuth } from '@clerk/nextjs' // Import Clerk hooks

import { Button } from '../../../../../_components/Button'
import { Input } from '../../../../../_components/Input'
import { Message } from '../../../../../_components/Message'
import { Category, Ad } from '../../../../../../payload/payload-types' // User from Payload types no longer needed
import { UPDATE_AD_MUTATION } from '../../../../../_graphql/ads'
// import { getCookie } from '../../../../../_api/token' // Old token method
// import RichTextEditor from './RichTextEditor' // Assuming a basic RichText editor component - not used currently

import classes from './index.module.scss'

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
  ad: Ad // The ad data to pre-fill the form
  categories: Category[]
  // User prop is no longer needed as we'll use Clerk hooks
}

export const EditAdForm: React.FC<Props> = ({ ad, categories }) => {
  const router = useRouter()
  const { user: clerkUser, isLoaded: isClerkUserLoaded } = useUser() // Clerk hook
  const { getToken } = useAuth() // Clerk hook
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Prepare default values for the form using the passed 'ad' prop
  const defaultValues: Partial<AdFormData> = {
    title: ad?.title || '',
    description: ad?.description || '', // Assuming description is string (textarea)
    price: ad?.price || 0,
    currency: (ad?.currency as 'RON' | 'EUR') || 'RON',
    location: ad?.location || '',
    adType: (ad?.adType as 'for-sale' | 'wanted' | 'service') || 'for-sale',
    categories: (ad?.categories?.map(cat => (typeof cat === 'string' ? cat : cat.id)) || []) as string[],
    contactName: ad?.contactName || '',
    contactEmail: ad?.contactEmail || '',
    contactPhone: ad?.contactPhone || '',
    status: (ad?.status as 'draft' | 'published' | 'archived') || 'draft',
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isLoading },
    control,
    reset,
    setValue,
  } = useForm<AdFormData>({ defaultValues })

  // Effect to reset form or prefill contact details if clerkUser loads after initial render
  // and if the ad's contact fields were empty.
  useEffect(() => {
    reset(defaultValues); // Initialize/reset form with ad data

    if (isClerkUserLoaded && clerkUser) {
      // If ad's contact fields are empty, try to prefill from Clerk user
      if (!defaultValues.contactName) {
        setValue('contactName', `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.username || '');
      }
      if (!defaultValues.contactEmail) {
        setValue('contactEmail', clerkUser.primaryEmailAddress?.emailAddress || '');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ad, reset, isClerkUserLoaded, clerkUser, setValue]) // defaultValues is not stable, so ad is the primary dependency


  const onSubmit = async (data: AdFormData) => {
    setError(null)
    setSuccess(null)

    if (!isClerkUserLoaded || !clerkUser) {
      setError("User not fully loaded or not signed in. Please try again.");
      return;
    }

    const token = await getToken({ template: 'payload' }); // Get Clerk JWT for Payload

    if (!token) {
        setError("Authentication token not available. Please ensure you are signed in.");
        return;
    }

    // Prepare data for mutation
    // Omit fields that are empty strings if they are optional and you want them to be undefined
    const variablesToSubmit: any = { id: ad.id }
    Object.keys(data).forEach(key => {
      const formKey = key as keyof AdFormData;
      if (data[formKey] !== undefined && data[formKey] !== '') { // Only include non-empty/defined values
        variablesToSubmit[formKey] = data[formKey];
      }
    });
    if (variablesToSubmit.price) {
      variablesToSubmit.price = parseFloat(variablesToSubmit.price as any);
    }


    // Ensure description is correctly formatted if it was RichText
    // (Current Ad collection uses 'textarea', so data.description is string)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Use Clerk token
        },
        body: JSON.stringify({
          query: UPDATE_AD_MUTATION,
          variables: variablesToSubmit,
        }),
      })

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
