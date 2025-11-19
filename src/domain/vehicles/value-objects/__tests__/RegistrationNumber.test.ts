import { RegistrationNumber } from '../RegistrationNumber'

describe('RegistrationNumber Value Object', () => {
  describe('create', () => {
    it('should create valid registration number', () => {
      const regNumber = RegistrationNumber.create('GA4567')
      expect(regNumber).toBeDefined()
      expect(regNumber?.value).toBe('GA4567')
    })

    it('should normalize to uppercase', () => {
      const regNumber = RegistrationNumber.create('ga4567')
      expect(regNumber?.value).toBe('GA4567')
    })

    it('should return null for empty string', () => {
      const regNumber = RegistrationNumber.create('')
      expect(regNumber).toBeNull()
    })

    it('should return null for invalid format (too short)', () => {
      const regNumber = RegistrationNumber.create('A1')
      expect(regNumber).toBeNull()
    })
  })

  describe('equals', () => {
    it('should return true for same registration number', () => {
      const reg1 = RegistrationNumber.create('GA4567')
      const reg2 = RegistrationNumber.create('GA4567')
      expect(reg1?.equals(reg2!)).toBe(true)
    })

    it('should return false for different registration numbers', () => {
      const reg1 = RegistrationNumber.create('GA4567')
      const reg2 = RegistrationNumber.create('GA4568')
      expect(reg1?.equals(reg2!)).toBe(false)
    })
  })
})

