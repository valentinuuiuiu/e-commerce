import type { Access } from 'payload/types'
import type { User } from '../payload-types'

export const loggedIn: Access<any, User> = ({ req: { user } }) => {
  // If there is a user, grant access
  if (user) {
    return true
  }
  // Otherwise, block access
  return false
}
