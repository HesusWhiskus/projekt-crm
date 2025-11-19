import { db } from '@/lib/db'
import { UserContext } from '@/application/shared/types/UserContext'

export interface PolicyDocumentInfo {
  id: string
  filename: string
  path: string
  size: number | null
  mimeType: string | null
  uploadedAt: Date
}

/**
 * Use case for downloading a policy document
 */
export class DownloadPolicyDocumentUseCase {
  async execute(documentId: string, user: UserContext): Promise<PolicyDocumentInfo | null> {
    const document = await db.policyDocument.findUnique({
      where: { id: documentId },
      include: {
        policy: true,
      },
    })

    if (!document) {
      return null
    }

    // Verify user has access to the policy
    // In a real implementation, you'd check organization membership, etc.
    if (document.policy.organizationId && document.policy.organizationId !== user.organizationId) {
      throw new Error('Brak dostępu do dokumentu')
    }

    // Log access
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'POLICY_DOCUMENT_ACCESSED',
        entityType: 'PolicyDocument',
        entityId: document.id,
        details: {
          policyId: document.policyId,
        },
      },
    })

    return {
      id: document.id,
      filename: document.filename,
      path: document.path,
      size: document.size,
      mimeType: document.mimeType,
      uploadedAt: document.createdAt,
    }
  }
}

