'use client'

'use client'

import React from 'react'
import Link from 'next/link'
import { useAuth, UserButton, SignedIn, SignedOut } from '@clerk/nextjs' // Import from Clerk

import { Header as HeaderType } from '../../../../payload/payload-types'
// import { useAuth as useOldAuth } from '../../../_providers/Auth' // Old auth provider
import { CMSLink } from '../../Link'
import { Button } from '../../Button'

import classes from './index.module.scss'

export const HeaderNav: React.FC<{ header: HeaderType }> = ({ header }) => {
  const navItems = header?.navItems || []
  const { isSignedIn } = useAuth() // Use Clerk's useAuth to get isSignedIn status

  return (
    <nav
      className={[
        classes.nav,
        // Clerk's `isSignedIn` is boolean, or undefined during loading.
        // Hide if undefined to prevent flash, similar to original logic with `user === undefined`.
        isSignedIn === undefined && classes.hide,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Static link for browsing ads, or this could come from CMS */}
      <Link href="/ads" className={classes.navLink}>Browse Ads</Link>

      {/* CMS-driven links from Payload Global */}
      {navItems.map(({ link }, i) => {
        return <CMSLink key={i} {...link} appearance="none" className={classes.navLink} />
      })}

      <div className={classes.userControls}>
        <SignedIn>
          {/* User specific links - only show when signed in */}
          <Link href="/account/my-ads" className={classes.navLink}>My Ads</Link>
          <Button href="/post-ad" label="Post Ad" appearance="primary" el="link" className={classes.postAdButton} />
          <UserButton afterSignOutUrl="/" />
        </SignedIn>

        <SignedOut>
          {/* Auth links - only show when signed out */}
          {/* Using Button component for consistent styling, assuming it can render as a link */}
          <Button href="/sign-in" label="Login" appearance="secondary" el="link" className={classes.navLink} />
          <Button href="/sign-up" label="Create Account" appearance="primary" el="link" className={classes.navLink} />
        </SignedOut>
      </div>
    </nav>
  )
}
