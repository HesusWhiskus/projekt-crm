import { ContactType } from '@prisma/client'
import { Contact } from '../entities/Contact'

/**
 * Filter criteria for finding contacts
 */
export interface ContactFilter {
  clientId?: string
  type?: ContactType
  userId?: string
  isNote?: boolean
  userIdForAccess?: string // For access control
  userRole?: 'ADMIN' | 'USER'
}

/**
 * Options for finding contacts
 */
export interface FindContactsOptions {
  include?: {
    client?: boolean
    user?: boolean
    attachments?: boolean
    sharedGroups?: boolean
  }
  orderBy?: {
    field: 'date' | 'createdAt'
    direction: 'asc' | 'desc'
  }
}

/**
 * Contact Repository Interface
 * Defines the contract for contact data access
 */
export interface IContactRepository {
  /**
   * Finds a contact by ID
   */
  findById(id: string, options?: FindContactsOptions): Promise<Contact | null>

  /**
   * Finds multiple contacts based on filter criteria
   */
  findMany(filter: ContactFilter, options?: FindContactsOptions): Promise<Contact[]>

  /**
   * Creates a new contact
   */
  create(contact: Contact): Promise<Contact>

  /**
   * Updates an existing contact
   */
  update(contact: Contact): Promise<Contact>

  /**
   * Deletes a contact by ID
   */
  delete(id: string): Promise<void>

  /**
   * Checks if a contact exists
   */
  exists(id: string): Promise<boolean>
}

