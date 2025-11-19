import { Vehicle } from '../entities/Vehicle'

/**
 * Filter criteria for finding vehicles
 */
export interface VehicleFilter {
  vin?: string
  registrationNumber?: string
  organizationId?: string
  clientId?: string // Find vehicles owned by a specific client
  search?: string
}

/**
 * Options for finding vehicles
 */
export interface FindVehiclesOptions {
  include?: {
    owners?: boolean
    organization?: boolean
  }
  orderBy?: {
    field: 'updatedAt' | 'createdAt' | 'firstRegistrationDate'
    direction: 'asc' | 'desc'
  }
}

/**
 * Vehicle Repository Interface
 * Defines the contract for vehicle data access
 */
export interface IVehicleRepository {
  /**
   * Finds a vehicle by ID
   */
  findById(id: string, options?: FindVehiclesOptions): Promise<Vehicle | null>

  /**
   * Finds a vehicle by VIN
   */
  findByVIN(vin: string, options?: FindVehiclesOptions): Promise<Vehicle | null>

  /**
   * Finds a vehicle by registration number
   */
  findByRegistrationNumber(registrationNumber: string, options?: FindVehiclesOptions): Promise<Vehicle | null>

  /**
   * Finds multiple vehicles based on filter criteria
   */
  findMany(filter: VehicleFilter, options?: FindVehiclesOptions): Promise<Vehicle[]>

  /**
   * Finds vehicles owned by a specific client
   */
  findByClientId(clientId: string, options?: FindVehiclesOptions): Promise<Vehicle[]>

  /**
   * Saves a vehicle (creates if new, updates if exists)
   */
  save(vehicle: Vehicle): Promise<Vehicle>

  /**
   * Creates a new vehicle
   */
  create(vehicle: Vehicle): Promise<Vehicle>

  /**
   * Updates an existing vehicle
   */
  update(vehicle: Vehicle): Promise<Vehicle>

  /**
   * Deletes a vehicle by ID
   */
  delete(id: string): Promise<void>

  /**
   * Checks if a vehicle exists
   */
  exists(id: string): Promise<boolean>

  /**
   * Assigns a vehicle to a client (creates VehicleOwner relation)
   */
  assignToClient(vehicleId: string, clientId: string, isPrimary?: boolean): Promise<void>

  /**
   * Removes vehicle assignment from a client
   */
  removeFromClient(vehicleId: string, clientId: string): Promise<void>

  /**
   * Gets all clients (owners) for a vehicle
   */
  getVehicleOwners(vehicleId: string): Promise<Array<{ clientId: string; isPrimary: boolean }>>
}

