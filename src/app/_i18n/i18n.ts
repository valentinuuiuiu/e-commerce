// A very basic i18n utility for demonstration.
// In a real app, consider using a robust library like next-intl or react-i18next.

import en from './locales/en.json'
import ro from './locales/ro.json'

// For this basic example, we'll hardcode the locale.
// A real app would get this from user preference, URL, browser settings, etc.
const defaultLocale = 'ro' // Set to Romanian as requested

type Translations = typeof en; // Assuming 'en' has all keys

const translations: Record<string, Translations> = {
  en,
  ro,
}

// Helper function to get a nested property from an object using a dot-separated path
function getNestedValue(obj: any, path: string): string | undefined {
  const keys = path.split('.')
  let current = obj
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key]
    } else {
      return undefined // Path not found
    }
  }
  return typeof current === 'string' ? current : undefined
}


/**
 * Gets a translated string.
 * Fallbacks: current locale -> English -> key itself.
 * @param key The key for the translation string (e.g., "homepage.welcomeTitle")
 * @param locale The current locale (e.g., "ro", "en"). Defaults to `defaultLocale`.
 * @param params Optional parameters to replace in the string (e.g., { title: "Ad Title" })
 */
export function t(key: string, params?: Record<string, string | number>, locale: string = defaultLocale): string {
  let translationSet = translations[locale] || translations.en
  let translatedString = getNestedValue(translationSet, key)

  // Fallback to English if not found in current locale (and current locale is not English)
  if (translatedString === undefined && locale !== 'en') {
    translationSet = translations.en
    translatedString = getNestedValue(translationSet, key)
  }

  // Fallback to the key itself if no translation is found
  if (translatedString === undefined) {
    // console.warn(`Translation not found for key: ${key} in locale: ${locale}`);
    translatedString = key
  }

  if (params) {
    Object.keys(params).forEach(paramKey => {
      const regex = new RegExp(`{${paramKey}}`, 'g')
      translatedString = translatedString.replace(regex, String(params[paramKey]))
    })
  }

  return translatedString
}

// Example of a function to get the current locale (very basic)
// In a Next.js app, this would typically involve middleware, server components, or context.
export function getCurrentLocale(): string {
  // For server components, this might be passed down or determined from request headers.
  // For client components, it might come from a context provider.
  // Hardcoded for this example.
  return defaultLocale;
}
