'use client'

import React, { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useRouter } from 'next/navigation' // Changed from next/navigation

import { Button } from '../../../_components/Button'
import { Input } from '../../../_components/Input'
import { Message } from '../../../_components/Message'
import { User, Category } from '../../../../payload/payload-types' // Assuming these types exist
import { CREATE_AD_MUTATION } from '../../../_graphql/ads'
import { getCookie } from '../../../_api/token' // For sending auth token

import classes from './index.module.scss'

type AdFormData = {
  title: string
  description: string // For simple textarea. If RichText, this needs a different editor.
  price: number
  currency: 'RON' | 'EUR'
  location: string
  adType: 'for-sale' | 'wanted' | 'service'
  categories: string[] // Array of category IDs
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  status: 'draft' | 'published'
}

type Props = {
  user: User
  categories: Category[]
}

export const PostAdForm: React.FC<Props> = ({ user, categories }) => {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isLoading },
    control,
    reset,
  } = useForm<AdFormData>({
    defaultValues: {
      currency: 'RON',
      status: 'draft', // Default to draft
      contactName: user?.name || '',
      contactEmail: user?.email || '',
      categories: [],
    }
  })

  const onSubmit = async (data: AdFormData) => {
    setError(null)
    setSuccess(null)

    const token = getCookie('payload-token') // Get auth token

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `JWT ${token}` }), // Add token if available
        },
        body: JSON.stringify({
          query: CREATE_AD_MUTATION,
          variables: {
            ...data,
            price: parseFloat(data.price as any), // Ensure price is a float
            // Description needs to be structured if Payload expects RichText JSON
            // For now, assuming it's a simple string and Payload field is 'textarea'
            // If Payload 'description' is RichText, this needs to send JSON:
            // description: { root: { children: [{ type: 'p', children: [{ text: data.description }] }] } },
          },
        }),
      })

      const result = await response.json()

      if (result.errors) {
        throw new Error(result.errors.map((e: any) => e.message).join(', '))
      }

      if (!result.data?.createAd?.id) {
        throw new Error('Ad creation failed. No ID returned.')
      }

      setSuccess(`Ad "${result.data.createAd.title}" created successfully! Redirecting...`)
      reset() // Reset form
      // Redirect to the new ad page or a "my ads" page
      router.push(`/ads/${result.data.createAd.slug || result.data.createAd.id}`)

    } catch (err) {
      console.error('Ad Creation Error:', err)
      setError(err.message || 'An error occurred while creating the ad.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={classes.form}>
      {error && <Message error={error} />}
      {success && <Message success={success} />}

      <Input
        label="Title"
        name="title"
        placeholder="e.g., iPhone 12 Pro Max"
        required
        register={register}
        error={errors.title}
        type="text"
      />

      <div>
        <label htmlFor="description" className={classes.label}>Description</label>
        <textarea
          id="description"
          {...register('description', { required: 'Description is required' })}
          className={classes.textarea}
          rows={6}
          placeholder="Detailed description of your item or service..."
        />
        {errors.description && <span className={classes.errorMessage}>{errors.description.message}</span>}
      </div>

      <div className={classes.priceCurrency}>
        <Input
            label="Price"
            name="price"
            type="number"
            step="0.01"
            required
            register={register}
            error={errors.price}
            placeholder="e.g., 2500"
        />
        <Controller
            name="currency"
            control={control}
            defaultValue="RON"
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
        placeholder="e.g., Bucharest, Sector 1"
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
            defaultValue="for-sale"
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

      <h3 className={classes.subheading}>Contact Information (Optional)</h3>
      <p className={classes.fieldDescription}>This information will be displayed publicly on your ad. If left blank, your account information might be used if applicable.</p>

      <Input
        label="Contact Name"
        name="contactName"
        register={register}
        error={errors.contactName}
        type="text"
        placeholder="Defaults to your account name"
      />
      <Input
        label="Contact Phone"
        name="contactPhone"
        register={register}
        error={errors.contactPhone}
        type="tel"
        placeholder="e.g., 07xx xxx xxx"
      />
      <Input
        label="Contact Email"
        name="contactEmail"
        register={register}
        error={errors.contactEmail}
        type="email"
        placeholder="Defaults to your account email"
      />

      <div>
        <label htmlFor="status" className={classes.label}>Status</label>
        <Controller
            name="status"
            control={control}
            defaultValue="draft"
            render={({ field }) => (
                <select {...field} id="status" className={classes.select}>
                    <option value="draft">Draft (Save and publish later)</option>
                    <option value="published">Published (Make it live immediately)</option>
                </select>
            )}
        />
      </div>

      <Button
        type="submit"
        label={isLoading ? 'Creating...' : 'Create Ad'}
        appearance="primary"
        disabled={isLoading}
        className={classes.submitButton}
      />
    </form>
  )
}
