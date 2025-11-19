import { Client } from '@/domain/clients/entities/Client'
import { Vehicle } from '@/domain/vehicles/entities/Vehicle'
import { Calculation } from '@/domain/calculations/entities/Calculation'
import { Policy } from '@/domain/policies/entities/Policy'

/**
 * External System Mapper
 * Maps CRM entities to/from external system format
 */
export class ExternalSystemMapper {
  /**
   * Maps Client entity to external system format
   */
  mapClientToExternal(client: Client): Record<string, any> {
    return {
      id: client.getId(),
      firstName: client.getFirstName().getValue(),
      lastName: client.getLastName().getValue(),
      email: client.getEmail()?.getValue() || null,
      phone: client.getPhone()?.getValue() || null,
      pesel: (client as any).pesel || null, // Assuming Client has pesel field
      address: client.getAddress(),
      // Add other fields as needed based on external system requirements
    }
  }

  /**
   * Maps Vehicle entity to external system format
   */
  mapVehicleToExternal(vehicle: Vehicle): Record<string, any> {
    return {
      id: vehicle.getId(),
      vin: vehicle.getVIN()?.getValue() || null,
      registrationNumber: vehicle.getRegistrationNumber()?.getValue() || null,
      firstRegistrationDate: vehicle.getFirstRegistrationDate()?.toISOString() || null,
      eurotaxData: vehicle.getEurotaxData(),
      infoEkspertData: vehicle.getInfoEkspertData(),
      importedFromAbroad: vehicle.getImportedFromAbroad(),
      hasValidInspection: vehicle.getHasValidInspection(),
      hasLpgInstallation: vehicle.getHasLpgInstallation(),
      purchaseYear: vehicle.getPurchaseYear(),
      currentMileage: vehicle.getCurrentMileage(),
    }
  }

  /**
   * Maps Calculation entity to external system format
   */
  mapCalculationToExternal(calculation: Calculation): Record<string, any> {
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
      drivingLicenseDate: data.drivingLicenseDate?.toISOString() || null,
      occupation: data.occupation,
      maritalStatus: data.maritalStatus,
      hasChildUnder26: data.hasChildUnder26,
      clientId: data.clientId,
      vehicleId: data.vehicleId,
      status: data.status,
      value: data.value,
      validUntil: data.validUntil?.toISOString() || null,
      variant: data.variant,
      scopes: data.scopes,
    }
  }

  /**
   * Maps Policy entity to external system format
   */
  mapPolicyToExternal(policy: Policy): Record<string, any> {
    return {
      id: policy.getId(),
      policyNumber: policy.getPolicyNumber().getValue(),
      issueDate: policy.getIssueDate().toISOString(),
      validFrom: policy.getValidFrom().toISOString(),
      validTo: policy.getValidTo().toISOString(),
      status: policy.getStatus(),
      calculationId: policy.getCalculationId(),
      clientId: policy.getClientId(),
      vehicleId: policy.getVehicleId(),
      insuranceCompanyId: policy.getInsuranceCompanyId(),
      agentId: policy.getAgentId(),
    }
  }

  /**
   * Maps external system data to Client entity format
   */
  mapClientFromExternal(data: Record<string, any>): Partial<Client> {
    // This would need to be implemented based on external system format
    // For now, return a partial object that can be used to update/create Client
    return {
      // Map fields as needed
    }
  }

  /**
   * Maps external system data to Vehicle entity format
   */
  mapVehicleFromExternal(data: Record<string, any>): Partial<Vehicle> {
    // This would need to be implemented based on external system format
    return {
      // Map fields as needed
    }
  }

  /**
   * Maps external system data to Calculation entity format
   */
  mapCalculationFromExternal(data: Record<string, any>): Partial<Calculation> {
    // This would need to be implemented based on external system format
    return {
      // Map fields as needed
    }
  }

  /**
   * Maps external system data to Policy entity format
   */
  mapPolicyFromExternal(data: Record<string, any>): Partial<Policy> {
    // This would need to be implemented based on external system format
    return {
      // Map fields as needed
    }
  }
}

