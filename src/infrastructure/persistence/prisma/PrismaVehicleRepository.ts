import { Vehicle } from '@/domain/vehicles/entities/Vehicle'
import {
  IVehicleRepository,
  VehicleFilter,
  FindVehiclesOptions,
} from '@/domain/vehicles/repositories/IVehicleRepository'
import { db } from '@/lib/db'

/**
 * Prisma implementation of IVehicleRepository
 */
export class PrismaVehicleRepository implements IVehicleRepository {
  async findById(id: string, options?: FindVehiclesOptions): Promise<Vehicle | null> {
    const include: any = {}
    if (options?.include?.owners) {
      include.owners = {
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              companyName: true,
            },
          },
        },
      }
    }
    if (options?.include?.organization) {
      include.organization = {
        select: {
          id: true,
          name: true,
        },
      }
    }

    const vehicleData = await db.vehicle.findUnique({
      where: { id },
      include: Object.keys(include).length > 0 ? include : undefined,
    })

    if (!vehicleData) {
      return null
    }

    return Vehicle.fromPersistence({
      id: vehicleData.id,
      vin: vehicleData.vin,
      registrationNumber: vehicleData.registrationNumber,
      firstRegistrationDate: vehicleData.firstRegistrationDate,
      brand: vehicleData.brand,
      model: vehicleData.model,
      productionYear: vehicleData.productionYear,
      infoEkspertId: vehicleData.infoEkspertId,
      eurotaxId: vehicleData.eurotaxId,
      eurotaxData: vehicleData.eurotaxData as Record<string, any> | null,
      infoEkspertData: vehicleData.infoEkspertData as Record<string, any> | null,
      importedFromAbroad: vehicleData.importedFromAbroad,
      hasValidInspection: vehicleData.hasValidInspection,
      hasLpgInstallation: vehicleData.hasLpgInstallation,
      purchaseYear: vehicleData.purchaseYear,
      currentMileage: vehicleData.currentMileage,
      organizationId: vehicleData.organizationId,
      createdAt: vehicleData.createdAt,
      updatedAt: vehicleData.updatedAt,
    })
  }

  async findByVIN(vin: string, options?: FindVehiclesOptions): Promise<Vehicle | null> {
    const vehicleData = await db.vehicle.findUnique({
      where: { vin },
    })

    if (!vehicleData) {
      return null
    }

    return Vehicle.fromPersistence({
      id: vehicleData.id,
      vin: vehicleData.vin,
      registrationNumber: vehicleData.registrationNumber,
      firstRegistrationDate: vehicleData.firstRegistrationDate,
      brand: vehicleData.brand,
      model: vehicleData.model,
      productionYear: vehicleData.productionYear,
      infoEkspertId: vehicleData.infoEkspertId,
      eurotaxId: vehicleData.eurotaxId,
      eurotaxData: vehicleData.eurotaxData as Record<string, any> | null,
      infoEkspertData: vehicleData.infoEkspertData as Record<string, any> | null,
      importedFromAbroad: vehicleData.importedFromAbroad,
      hasValidInspection: vehicleData.hasValidInspection,
      hasLpgInstallation: vehicleData.hasLpgInstallation,
      purchaseYear: vehicleData.purchaseYear,
      currentMileage: vehicleData.currentMileage,
      organizationId: vehicleData.organizationId,
      createdAt: vehicleData.createdAt,
      updatedAt: vehicleData.updatedAt,
    })
  }

  async findByRegistrationNumber(
    registrationNumber: string,
    options?: FindVehiclesOptions
  ): Promise<Vehicle | null> {
    const vehicleData = await db.vehicle.findFirst({
      where: { registrationNumber },
    })

    if (!vehicleData) {
      return null
    }

    return Vehicle.fromPersistence({
      id: vehicleData.id,
      vin: vehicleData.vin,
      registrationNumber: vehicleData.registrationNumber,
      firstRegistrationDate: vehicleData.firstRegistrationDate,
      brand: vehicleData.brand,
      model: vehicleData.model,
      productionYear: vehicleData.productionYear,
      infoEkspertId: vehicleData.infoEkspertId,
      eurotaxId: vehicleData.eurotaxId,
      eurotaxData: vehicleData.eurotaxData as Record<string, any> | null,
      infoEkspertData: vehicleData.infoEkspertData as Record<string, any> | null,
      importedFromAbroad: vehicleData.importedFromAbroad,
      hasValidInspection: vehicleData.hasValidInspection,
      hasLpgInstallation: vehicleData.hasLpgInstallation,
      purchaseYear: vehicleData.purchaseYear,
      currentMileage: vehicleData.currentMileage,
      organizationId: vehicleData.organizationId,
      createdAt: vehicleData.createdAt,
      updatedAt: vehicleData.updatedAt,
    })
  }

  async findMany(filter: VehicleFilter, options?: FindVehiclesOptions): Promise<Vehicle[]> {
    const where: any = {}

    if (filter.vin) {
      where.vin = filter.vin
    }

    if (filter.registrationNumber) {
      where.registrationNumber = filter.registrationNumber
    }

    if (filter.organizationId) {
      where.organizationId = filter.organizationId
    }

    if (filter.clientId) {
      where.owners = {
        some: {
          clientId: filter.clientId,
        },
      }
    }

    if (filter.search) {
      where.OR = [
        { vin: { contains: filter.search, mode: 'insensitive' } },
        { registrationNumber: { contains: filter.search, mode: 'insensitive' } },
      ]
    }

    const orderBy: any = {}
    if (options?.orderBy) {
      orderBy[options.orderBy.field] = options.orderBy.direction
    } else {
      orderBy.updatedAt = 'desc'
    }

    const vehicleDataList = await db.vehicle.findMany({
      where,
      orderBy,
    })

    return vehicleDataList.map((data) =>
      Vehicle.fromPersistence({
        id: data.id,
        vin: data.vin,
        registrationNumber: data.registrationNumber,
        firstRegistrationDate: data.firstRegistrationDate,
        brand: data.brand,
        model: data.model,
        productionYear: data.productionYear,
        infoEkspertId: data.infoEkspertId,
        eurotaxId: data.eurotaxId,
        eurotaxData: data.eurotaxData as Record<string, any> | null,
        infoEkspertData: data.infoEkspertData as Record<string, any> | null,
        importedFromAbroad: data.importedFromAbroad,
        hasValidInspection: data.hasValidInspection ?? null,
        hasLpgInstallation: data.hasLpgInstallation ?? null,
        purchaseYear: data.purchaseYear,
        currentMileage: data.currentMileage,
        organizationId: data.organizationId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      })
    )
  }

  async findByClientId(clientId: string, options?: FindVehiclesOptions): Promise<Vehicle[]> {
    const vehicleOwners = await db.vehicleOwner.findMany({
      where: { clientId },
      include: {
        vehicle: true,
      },
    })

    return vehicleOwners.map((vo) =>
      Vehicle.fromPersistence({
        id: vo.vehicle.id,
        vin: vo.vehicle.vin,
        registrationNumber: vo.vehicle.registrationNumber,
        firstRegistrationDate: vo.vehicle.firstRegistrationDate,
        brand: vo.vehicle.brand,
        model: vo.vehicle.model,
        productionYear: vo.vehicle.productionYear,
        infoEkspertId: vo.vehicle.infoEkspertId,
        eurotaxId: vo.vehicle.eurotaxId,
        eurotaxData: vo.vehicle.eurotaxData as Record<string, any> | null,
        infoEkspertData: vo.vehicle.infoEkspertData as Record<string, any> | null,
        importedFromAbroad: vo.vehicle.importedFromAbroad,
        hasValidInspection: vo.vehicle.hasValidInspection,
        hasLpgInstallation: vo.vehicle.hasLpgInstallation,
        purchaseYear: vo.vehicle.purchaseYear,
        currentMileage: vo.vehicle.currentMileage,
        organizationId: vo.vehicle.organizationId,
        createdAt: vo.vehicle.createdAt,
        updatedAt: vo.vehicle.updatedAt,
      })
    )
  }

  async save(vehicle: Vehicle): Promise<Vehicle> {
    if (await this.exists(vehicle.getId())) {
      return this.update(vehicle)
    } else {
      return this.create(vehicle)
    }
  }

  async create(vehicle: Vehicle): Promise<Vehicle> {
    const data = vehicle.toPersistence()

    const created = await db.vehicle.create({
      data: {
        vin: data.vin,
        registrationNumber: data.registrationNumber,
        firstRegistrationDate: data.firstRegistrationDate,
        brand: data.brand,
        model: data.model,
        productionYear: data.productionYear,
        infoEkspertId: data.infoEkspertId,
        eurotaxId: data.eurotaxId,
        eurotaxData: (data.eurotaxData ?? null) as any,
        infoEkspertData: (data.infoEkspertData ?? null) as any,
        importedFromAbroad: data.importedFromAbroad,
        hasValidInspection: data.hasValidInspection ?? null,
        hasLpgInstallation: data.hasLpgInstallation ?? null,
        purchaseYear: data.purchaseYear,
        currentMileage: data.currentMileage,
        organizationId: data.organizationId,
      },
    })

    return Vehicle.fromPersistence({
      id: created.id,
      vin: created.vin,
      registrationNumber: created.registrationNumber,
      firstRegistrationDate: created.firstRegistrationDate,
      brand: created.brand,
      model: created.model,
      productionYear: created.productionYear,
      infoEkspertId: created.infoEkspertId,
      eurotaxId: created.eurotaxId,
      eurotaxData: created.eurotaxData as Record<string, any> | null,
      infoEkspertData: created.infoEkspertData as Record<string, any> | null,
      importedFromAbroad: created.importedFromAbroad,
      hasValidInspection: created.hasValidInspection,
      hasLpgInstallation: created.hasLpgInstallation,
      purchaseYear: created.purchaseYear,
      currentMileage: created.currentMileage,
      organizationId: created.organizationId,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    })
  }

  async update(vehicle: Vehicle): Promise<Vehicle> {
    const data = vehicle.toPersistence()

    const updated = await db.vehicle.update({
      where: { id: vehicle.getId() },
      data: {
        vin: data.vin,
        registrationNumber: data.registrationNumber,
        firstRegistrationDate: data.firstRegistrationDate,
        brand: data.brand,
        model: data.model,
        productionYear: data.productionYear,
        infoEkspertId: data.infoEkspertId,
        eurotaxId: data.eurotaxId,
        eurotaxData: (data.eurotaxData ?? null) as any,
        infoEkspertData: (data.infoEkspertData ?? null) as any,
        importedFromAbroad: data.importedFromAbroad,
        hasValidInspection: data.hasValidInspection ?? null,
        hasLpgInstallation: data.hasLpgInstallation ?? null,
        purchaseYear: data.purchaseYear,
        currentMileage: data.currentMileage,
        organizationId: data.organizationId,
      },
    })

    return Vehicle.fromPersistence({
      id: updated.id,
      vin: updated.vin,
      registrationNumber: updated.registrationNumber,
      firstRegistrationDate: updated.firstRegistrationDate,
      brand: updated.brand,
      model: updated.model,
      productionYear: updated.productionYear,
      infoEkspertId: updated.infoEkspertId,
      eurotaxId: updated.eurotaxId,
      eurotaxData: updated.eurotaxData as Record<string, any> | null,
      infoEkspertData: updated.infoEkspertData as Record<string, any> | null,
      importedFromAbroad: updated.importedFromAbroad,
      hasValidInspection: updated.hasValidInspection,
      hasLpgInstallation: updated.hasLpgInstallation,
      purchaseYear: updated.purchaseYear,
      currentMileage: updated.currentMileage,
      organizationId: updated.organizationId,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    })
  }

  async delete(id: string): Promise<void> {
    await db.vehicle.delete({
      where: { id },
    })
  }

  async exists(id: string): Promise<boolean> {
    const count = await db.vehicle.count({
      where: { id },
    })
    return count > 0
  }

  async assignToClient(vehicleId: string, clientId: string, isPrimary: boolean = false): Promise<void> {
    await db.vehicleOwner.upsert({
      where: {
        vehicleId_clientId: {
          vehicleId,
          clientId,
        },
      },
      create: {
        vehicleId,
        clientId,
        isPrimary,
      },
      update: {
        isPrimary,
      },
    })
  }

  async removeFromClient(vehicleId: string, clientId: string): Promise<void> {
    await db.vehicleOwner.delete({
      where: {
        vehicleId_clientId: {
          vehicleId,
          clientId,
        },
      },
    })
  }

  async getVehicleOwners(vehicleId: string): Promise<Array<{ clientId: string; isPrimary: boolean }>> {
    const owners = await db.vehicleOwner.findMany({
      where: { vehicleId },
      select: {
        clientId: true,
        isPrimary: true,
      },
    })

    return owners
  }
}

