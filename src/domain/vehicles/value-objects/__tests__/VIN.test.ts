import { VIN } from '../VIN'

describe('VIN Value Object', () => {
  describe('create', () => {
    it('should create valid VIN', () => {
      const vin = VIN.create('19UUA7652SA006117')
      expect(vin).toBeDefined()
      expect(vin?.value).toBe('19UUA7652SA006117')
    })

    it('should return null for invalid VIN (too short)', () => {
      const vin = VIN.create('12345678901234567') // 17 characters, should be 17
      expect(vin).toBeNull()
    })

    it('should return null for invalid VIN (too long)', () => {
      const vin = VIN.create('19UUA7652SA0061178') // 18 characters
      expect(vin).toBeNull()
    })

    it('should return null for empty string', () => {
      const vin = VIN.create('')
      expect(vin).toBeNull()
    })

    it('should normalize VIN to uppercase', () => {
      const vin = VIN.create('19uua7652sa006117')
      expect(vin?.value).toBe('19UUA7652SA006117')
    })
  })

  describe('equals', () => {
    it('should return true for same VIN', () => {
      const vin1 = VIN.create('19UUA7652SA006117')
      const vin2 = VIN.create('19UUA7652SA006117')
      expect(vin1?.equals(vin2!)).toBe(true)
    })

    it('should return false for different VINs', () => {
      const vin1 = VIN.create('19UUA7652SA006117')
      const vin2 = VIN.create('19UUA7652SA006118')
      expect(vin1?.equals(vin2!)).toBe(false)
    })
  })
})

