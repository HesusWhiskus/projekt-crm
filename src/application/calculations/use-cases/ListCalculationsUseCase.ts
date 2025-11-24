import { Calculation } from '@/domain/calculations/entities/Calculation'
import {
  ICalculationRepository,
  CalculationFilter,
} from '@/domain/calculations/repositories/ICalculationRepository'
import { CalculationDTO, CalculationFilterDTO } from '../dto'
import { PaginatedResponse, PaginationMeta, calculatePagination } from '@/lib/types/pagination'
import { db } from '@/lib/db'

/**
 * Use case for listing calculations
 */
export class ListCalculationsUseCase {
  constructor(private readonly calculationRepository: ICalculationRepository) {}

  async execute(filter: CalculationFilterDTO): Promise<CalculationDTO[] | PaginatedResponse<CalculationDTO>> {
    const domainFilter: CalculationFilter = {
      status: filter.status,
      clientId: filter.clientId,
      vehicleId: filter.vehicleId,
      agentId: filter.agentId,
      organizationId: filter.organizationId,
      search: filter.search,
      validUntil: filter.validUntil
        ? {
            from: filter.validUntil.from ? new Date(filter.validUntil.from) : undefined,
            to: filter.validUntil.to ? new Date(filter.validUntil.to) : undefined,
          }
        : undefined,
    }

    // Build where clause for count
    const where: any = {}
    if (domainFilter.status) where.status = domainFilter.status
    if (domainFilter.clientId) where.clientId = domainFilter.clientId
    if (domainFilter.vehicleId) where.vehicleId = domainFilter.vehicleId
    if (domainFilter.agentId) where.agentId = domainFilter.agentId
    if (domainFilter.organizationId) where.organizationId = domainFilter.organizationId
    if (domainFilter.validUntil) {
      if (domainFilter.validUntil.from) {
        where.validUntil = { ...where.validUntil, gte: domainFilter.validUntil.from }
      }
      if (domainFilter.validUntil.to) {
        where.validUntil = { ...where.validUntil, lte: domainFilter.validUntil.to }
      }
    }
    if (domainFilter.search) {
      where.OR = [
        { firstName: { contains: domainFilter.search, mode: 'insensitive' } },
        { lastName: { contains: domainFilter.search, mode: 'insensitive' } },
        { pesel: { contains: domainFilter.search } },
        { email: { contains: domainFilter.search, mode: 'insensitive' } },
      ]
    }

    // Fetch calculations and total count in parallel if pagination is used
    const usePagination = filter.pagination !== undefined

    if (usePagination && filter.pagination) {
      const [calculations, total] = await Promise.all([
        this.calculationRepository.findMany(domainFilter, {
          include: {
            client: true,
            vehicle: true,
            agent: true,
          },
          pagination: filter.pagination,
        }),
        db.calculation.count({ where }),
      ])

      const { page: validPage, limit: validLimit } = calculatePagination(
        filter.pagination.page,
        filter.pagination.limit,
        50
      )
      const totalPages = Math.ceil(total / validLimit)
      const pagination: PaginationMeta = {
        page: validPage,
        limit: validLimit,
        total,
        totalPages,
        hasMore: validPage * validLimit < total,
      }

      return {
        data: calculations.map((calculation) => this.toDTO(calculation)),
        pagination,
      }
    }

    const calculations = await this.calculationRepository.findMany(domainFilter, {
      include: {
        client: true,
        vehicle: true,
        agent: true,
      },
    })

    return calculations.map((calculation) => this.toDTO(calculation))
  }

  private toDTO(calculation: Calculation): CalculationDTO {
    const data = calculation.toPersistence()
    return {
      id: data.id,
      pesel: data.pesel,
      firstName: data.firstName,
      lastName: data.lastName,
      previousLastName: data.previousLastName,
      phone: data.phone,
      email: data.email,
      postalCode: data.postalCode,
      city: data.city,
      street: data.street,
      houseNumber: data.houseNumber,
      apartmentNumber: data.apartmentNumber,
      correspondenceAddress: data.correspondenceAddress,
      hasDrivingLicense: data.hasDrivingLicense,
      drivingLicenseDate: data.drivingLicenseDate,
      occupation: data.occupation,
      maritalStatus: data.maritalStatus,
      hasChildUnder26: data.hasChildUnder26,
      clientId: data.clientId,
      vehicleId: data.vehicleId,
      agentId: data.agentId,
      organizationId: data.organizationId,
      status: data.status,
      value: data.value,
      validUntil: data.validUntil,
      variant: data.variant,
      scopes: data.scopes,
      externalId: data.externalId,
      syncedAt: data.syncedAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    }
  }
}

