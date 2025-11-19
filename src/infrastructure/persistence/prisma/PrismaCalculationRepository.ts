import { Calculation } from '@/domain/calculations/entities/Calculation'
import {
  ICalculationRepository,
  CalculationFilter,
  FindCalculationsOptions,
} from '@/domain/calculations/repositories/ICalculationRepository'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

/**
 * Prisma implementation of ICalculationRepository
 */
export class PrismaCalculationRepository implements ICalculationRepository {
  async findById(id: string, options?: FindCalculationsOptions): Promise<Calculation | null> {
    const include: any = {}
    if (options?.include?.client) {
      include.client = {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          companyName: true,
        },
      }
    }
    if (options?.include?.vehicle) {
      include.vehicle = {
        select: {
          id: true,
          vin: true,
          registrationNumber: true,
        },
      }
    }
    if (options?.include?.agent) {
      include.agent = {
        select: {
          id: true,
          name: true,
          email: true,
        },
      }
    }

    const calculationData = await db.calculation.findUnique({
      where: { id },
      include: Object.keys(include).length > 0 ? include : undefined,
    })

    if (!calculationData) {
      return null
    }

    return Calculation.fromPersistence({
      id: calculationData.id,
      pesel: calculationData.pesel,
      firstName: calculationData.firstName,
      lastName: calculationData.lastName,
      previousLastName: calculationData.previousLastName,
      phone: calculationData.phone,
      email: calculationData.email,
      postalCode: calculationData.postalCode,
      city: calculationData.city,
      street: calculationData.street,
      houseNumber: calculationData.houseNumber,
      apartmentNumber: calculationData.apartmentNumber,
      correspondenceAddress: calculationData.correspondenceAddress as Record<string, any> | null,
      hasDrivingLicense: calculationData.hasDrivingLicense,
      drivingLicenseDate: calculationData.drivingLicenseDate,
      occupation: calculationData.occupation,
      maritalStatus: calculationData.maritalStatus,
      hasChildUnder26: calculationData.hasChildUnder26,
      clientId: calculationData.clientId,
      vehicleId: calculationData.vehicleId,
      agentId: calculationData.agentId,
      organizationId: calculationData.organizationId,
      status: calculationData.status,
      value: calculationData.value ? Number(calculationData.value) : null,
      validUntil: calculationData.validUntil,
      variant: calculationData.variant,
      scopes: calculationData.scopes,
      externalId: calculationData.externalId,
      syncedAt: calculationData.syncedAt,
      createdAt: calculationData.createdAt,
      updatedAt: calculationData.updatedAt,
    })
  }

  async findMany(filter: CalculationFilter, options?: FindCalculationsOptions): Promise<Calculation[]> {
    const where: any = {}

    if (filter.status) {
      where.status = filter.status
    }

    if (filter.clientId) {
      where.clientId = filter.clientId
    }

    if (filter.vehicleId) {
      where.vehicleId = filter.vehicleId
    }

    if (filter.agentId) {
      where.agentId = filter.agentId
    }

    if (filter.organizationId) {
      where.organizationId = filter.organizationId
    }

    if (filter.validUntil) {
      if (filter.validUntil.from) {
        where.validUntil = { ...where.validUntil, gte: filter.validUntil.from }
      }
      if (filter.validUntil.to) {
        where.validUntil = { ...where.validUntil, lte: filter.validUntil.to }
      }
    }

    if (filter.search) {
      where.OR = [
        { firstName: { contains: filter.search, mode: 'insensitive' } },
        { lastName: { contains: filter.search, mode: 'insensitive' } },
        { pesel: { contains: filter.search } },
        { email: { contains: filter.search, mode: 'insensitive' } },
      ]
    }

    const orderBy: any = {}
    if (options?.orderBy) {
      orderBy[options.orderBy.field] = options.orderBy.direction
    } else {
      orderBy.updatedAt = 'desc'
    }

    const calculationDataList = await db.calculation.findMany({
      where,
      orderBy,
    })

    return calculationDataList.map((data) =>
      Calculation.fromPersistence({
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
        correspondenceAddress: data.correspondenceAddress as Record<string, any> | null,
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
        value: data.value ? Number(data.value) : null,
        validUntil: data.validUntil,
        variant: data.variant,
        scopes: data.scopes,
        externalId: data.externalId,
        syncedAt: data.syncedAt,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      })
    )
  }

  async findByClientId(clientId: string, options?: FindCalculationsOptions): Promise<Calculation[]> {
    return this.findMany({ clientId }, options)
  }

  async findByVehicleId(vehicleId: string, options?: FindCalculationsOptions): Promise<Calculation[]> {
    return this.findMany({ vehicleId }, options)
  }

  async findByAgentId(agentId: string, options?: FindCalculationsOptions): Promise<Calculation[]> {
    return this.findMany({ agentId }, options)
  }

  async save(calculation: Calculation): Promise<Calculation> {
    if (await this.exists(calculation.getId())) {
      return this.update(calculation)
    } else {
      return this.create(calculation)
    }
  }

  async create(calculation: Calculation): Promise<Calculation> {
    const data = calculation.toPersistence()

    const created = await db.calculation.create({
      data: {
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
        correspondenceAddress: data.correspondenceAddress ?? Prisma.JsonNull,
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
      },
    })

    return Calculation.fromPersistence({
      id: created.id,
      pesel: created.pesel,
      firstName: created.firstName,
      lastName: created.lastName,
      previousLastName: created.previousLastName,
      phone: created.phone,
      email: created.email,
      postalCode: created.postalCode,
      city: created.city,
      street: created.street,
      houseNumber: created.houseNumber,
      apartmentNumber: created.apartmentNumber,
      correspondenceAddress: created.correspondenceAddress as Record<string, any> | null,
      hasDrivingLicense: created.hasDrivingLicense,
      drivingLicenseDate: created.drivingLicenseDate,
      occupation: created.occupation,
      maritalStatus: created.maritalStatus,
      hasChildUnder26: created.hasChildUnder26,
      clientId: created.clientId,
      vehicleId: created.vehicleId,
      agentId: created.agentId,
      organizationId: created.organizationId,
      status: created.status,
      value: created.value ? Number(created.value) : null,
      validUntil: created.validUntil,
      variant: created.variant,
      scopes: created.scopes,
      externalId: created.externalId,
      syncedAt: created.syncedAt,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    })
  }

  async update(calculation: Calculation): Promise<Calculation> {
    const data = calculation.toPersistence()

    const updated = await db.calculation.update({
      where: { id: calculation.getId() },
      data: {
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
        correspondenceAddress: data.correspondenceAddress ?? Prisma.JsonNull,
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
      },
    })

    return Calculation.fromPersistence({
      id: updated.id,
      pesel: updated.pesel,
      firstName: updated.firstName,
      lastName: updated.lastName,
      previousLastName: updated.previousLastName,
      phone: updated.phone,
      email: updated.email,
      postalCode: updated.postalCode,
      city: updated.city,
      street: updated.street,
      houseNumber: updated.houseNumber,
      apartmentNumber: updated.apartmentNumber,
      correspondenceAddress: updated.correspondenceAddress as Record<string, any> | null,
      hasDrivingLicense: updated.hasDrivingLicense,
      drivingLicenseDate: updated.drivingLicenseDate,
      occupation: updated.occupation,
      maritalStatus: updated.maritalStatus,
      hasChildUnder26: updated.hasChildUnder26,
      clientId: updated.clientId,
      vehicleId: updated.vehicleId,
      agentId: updated.agentId,
      organizationId: updated.organizationId,
      status: updated.status,
      value: updated.value ? Number(updated.value) : null,
      validUntil: updated.validUntil,
      variant: updated.variant,
      scopes: updated.scopes,
      externalId: updated.externalId,
      syncedAt: updated.syncedAt,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    })
  }

  async delete(id: string): Promise<void> {
    await db.calculation.delete({
      where: { id },
    })
  }

  async exists(id: string): Promise<boolean> {
    const count = await db.calculation.count({
      where: { id },
    })
    return count > 0
  }
}

