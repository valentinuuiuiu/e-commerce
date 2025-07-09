'use client'

import React from 'react'

// import { AuthProvider } from '../_providers/Auth' // Removed AuthProvider
import { CartProvider } from '../_providers/Cart' // CartProvider kept for now
import { ThemeProvider } from './Theme'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      {/* AuthProvider removed, ClerkProvider is at the root layout level */}
      <CartProvider>{children}</CartProvider>
    </ThemeProvider>
  )
}
