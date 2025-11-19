import { IPolicyRepository } from '@/domain/policies/repositories/IPolicyRepository'
import { db } from '@/lib/db'
import { UserContext } from '@/application/shared/types/UserContext'

export interface UploadPolicyDocumentDTO {
  policyId: string
  filename: string
  path: string // URL or file path
  size?: number
  mimeType?: string
  externalId?: string | null
}

/**
 * Use case for uploading a policy document
 */
export class UploadPolicyDocumentUseCase {
  constructor(private readonly policyRepository: IPolicyRepository) {}

  async execute(dto: UploadPolicyDocumentDTO, user: UserContext): Promise<{ id: string }> {
    // Verify policy exists
    const policy = await this.policyRepository.findById(dto.policyId)
    if (!policy) {
      throw new Error('Polisa nie znaleziona')
    }

    // Create document record
    const document = await db.policyDocument.create({
      data: {
        policyId: dto.policyId,
        filename: dto.filename,
        path: dto.path,
        size: dto.size || null,
        mimeType: dto.mimeType || null,
        uploadedBy: user.id,
      },
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'POLICY_DOCUMENT_UPLOADED',
        entityType: 'PolicyDocument',
        entityId: document.id,
        details: {
          policyId: dto.policyId,
          filename: dto.filename,
        },
      },
    })

    return { id: document.id }
  }
}

