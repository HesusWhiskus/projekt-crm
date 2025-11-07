import { db } from '@/lib/db'

/**
 * Activity log entry
 */
export interface ActivityLogEntry {
  userId: string
  action: string
  entityType: string
  entityId?: string | null
  details?: Record<string, any>
  ipAddress?: string | null
  userAgent?: string | null
}

/**
 * Activity Logger Service
 * Centralized service for logging user activities
 */
export class ActivityLogger {
  /**
   * Logs an activity
   */
  async log(entry: ActivityLogEntry): Promise<void> {
    try {
      await db.activityLog.create({
        data: {
          userId: entry.userId,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId || null,
          details: entry.details || null,
          ipAddress: entry.ipAddress || null,
          userAgent: entry.userAgent || null,
        },
      })
    } catch (error) {
      // Log error but don't throw - logging should not break the main flow
      console.error('Failed to log activity:', error)
    }
  }

  /**
   * Logs client-related activity
   */
  async logClientActivity(
    userId: string,
    action: 'CLIENT_CREATED' | 'CLIENT_UPDATED' | 'CLIENT_DELETED',
    clientId: string,
    details?: Record<string, any>,
    request?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.log({
      userId,
      action,
      entityType: 'Client',
      entityId: clientId,
      details,
      ipAddress: request?.ipAddress || null,
      userAgent: request?.userAgent || null,
    })
  }

  /**
   * Logs contact-related activity
   */
  async logContactActivity(
    userId: string,
    action: 'CONTACT_CREATED' | 'CONTACT_UPDATED' | 'CONTACT_DELETED',
    contactId: string,
    details?: Record<string, any>,
    request?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.log({
      userId,
      action,
      entityType: 'Contact',
      entityId: contactId,
      details,
      ipAddress: request?.ipAddress || null,
      userAgent: request?.userAgent || null,
    })
  }

  /**
   * Logs task-related activity
   */
  async logTaskActivity(
    userId: string,
    action: 'TASK_CREATED' | 'TASK_UPDATED' | 'TASK_DELETED' | 'TASK_COMPLETED',
    taskId: string,
    details?: Record<string, any>,
    request?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.log({
      userId,
      action,
      entityType: 'Task',
      entityId: taskId,
      details,
      ipAddress: request?.ipAddress || null,
      userAgent: request?.userAgent || null,
    })
  }

  /**
   * Extracts IP address and user agent from Request
   */
  static extractRequestInfo(request: Request): {
    ipAddress: string | null
    userAgent: string | null
  } {
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      null

    const userAgent = request.headers.get('user-agent') || null

    return { ipAddress, userAgent }
  }
}

