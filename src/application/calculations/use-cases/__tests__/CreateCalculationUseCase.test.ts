import { CreateCalculationUseCase } from '../CreateCalculationUseCase'
import { CalculationRepository } from '@/domain/calculations/repositories/CalculationRepository'
import { CreateCalculationDTO } from '../dto/CreateCalculationDTO'

describe('CreateCalculationUseCase', () => {
  let useCase: CreateCalculationUseCase
  let mockRepository: jest.Mocked<CalculationRepository>

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByClientId: jest.fn(),
      findByVehicleId: jest.fn(),
      findByAgentId: jest.fn(),
      findByStatus: jest.fn(),
      delete: jest.fn(),
    } as any

    useCase = new CreateCalculationUseCase(mockRepository)
  })

  it('should create calculation successfully', async () => {
    const dto: CreateCalculationDTO = {
      clientId: 'client-1',
      vehicleId: 'vehicle-1',
      status: 'DRAFT',
      firstName: 'Jan',
      lastName: 'Kowalski',
      pesel: '81120203216',
    }

    const mockCalculation = {
      id: 'calc-1',
      ...dto,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockRepository.save.mockResolvedValue(mockCalculation as any)

    const user = { id: 'user-1', organizationId: 'org-1' } as any

    const result = await useCase.execute(dto, user)

    expect(result).toBeDefined()
    expect(mockRepository.save).toHaveBeenCalledTimes(1)
  })

  it('should throw error if clientId is missing', async () => {
    const dto: CreateCalculationDTO = {
      status: 'DRAFT',
    } as any

    const user = { id: 'user-1', organizationId: 'org-1' } as any

    await expect(useCase.execute(dto, user)).rejects.toThrow()
  })
})

