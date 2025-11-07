/**
 * User context for authorization
 */
export interface UserContext {
  id: string
  role: 'ADMIN' | 'USER'
  email: string
}

