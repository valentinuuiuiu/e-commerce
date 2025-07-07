'use client'

import React from 'react'
import Link from 'next/link'

import { Header as HeaderType } from '../../../../payload/payload-types' // User type might not be needed directly here
import { useAuth } from '../../../_providers/Auth'
// import { CartLink } from '../../CartLink' // Removed CartLink
import { CMSLink } from '../../Link'
import { Button } from '../../Button' // For "Post Ad" button styling

import classes from './index.module.scss'

export const HeaderNav: React.FC<{ header: HeaderType }> = ({ header }) => {
  const navItems = header?.navItems || []
  const { user } = useAuth()

  return (
    <nav
      className={[
        classes.nav,
        user === undefined && classes.hide,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Static link for browsing ads, or this could come from CMS */}
      <Link href="/ads">Browse Ads</Link>

      {/* CMS-driven links */}
      {navItems.map(({ link }, i) => {
        return <CMSLink key={i} {...link} appearance="none" />
      })}

      {/* User specific links */}
      {user && (
        <>
          <Link href="/account/my-ads">My Ads</Link>
          {/* Use Button component for Post Ad for better styling if desired */}
          <Button href="/post-ad" label="Post Ad" appearance="primary" el="link" className={classes.postAdButton} />
          {/* <Link href="/account">Account Settings</Link> Consider a separate settings page later */}
        </>
      )}

      {/* Auth links */}
      {!user && (
        <>
          <Link href="/login">Login</Link>
          <Link href="/create-account">Create Account</Link>
        </>
      )}
    </nav>
  )
}
