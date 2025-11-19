import { IVehicleRepository } from '@/domain/vehicles/repositories/IVehicleRepository'
import { UserContext } from '@/application/shared/types/UserContext'
import { db } from '@/lib/db'

/**
 * Use case for assigning a vehicle to a client
 */
export class AssignVehicleToClientUseCase {
  constructor(private readonly vehicleRepository: IVehicleRepository) {}

  async execute(
    vehicleId: string,
    clientId: string,
    isPrimary: boolean,
    user: UserContext
  ): Promise<void> {
    // Verify vehicle exists
    const vehicle = await this.vehicleRepository.findById(vehicleId)
    if (!vehicle) {
      throw new Error('Pojazd nie znaleziony')
    }

    // Verify client exists
    const client = await db.client.findUnique({
      where: { id: clientId },
    })
    if (!client) {
      throw new Error('Klient nie znaleziony')
    }

    // Assign vehicle to client
    await this.vehicleRepository.assignToClient(vehicleId, clientId, isPrimary)

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'VEHICLE_ASSIGNED_TO_CLIENT',
        entityType: 'Vehicle',
        entityId: vehicleId,
        details: {
          clientId,
          isPrimary,
        },
      },
    })
  }
}

