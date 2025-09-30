import { faker } from '@faker-js/faker'
import { HospitalAsset } from '@/models/HospitalAsset'
import type { HospitalConfig } from '@/models/HospitalConfig'

// Seed for reproducible test data
faker.seed(42)

/**
 * Medical Equipment Data Generator
 *
 * AI-Assisted: Equipment catalog and pricing data generated with Claude 3.5
 * Prompt: "Generate realistic UK hospital equipment list with categories,
 * typical quantities, reorder points, and NHS pricing estimates"
 *
 * Creates varied stock levels with 70% normal, 20% low, 10% critical distribution
 * for realistic inventory simulation.
 */
export class MedicalDataGenerator {
  // Realistic hospital equipment with typical quantities
  private static readonly EQUIPMENT_DATA = [
    // Life Support Equipment - Critical, low quantities
    { name: 'Ventilator', category: 'Life Support', typical: 8, reorderPoint: 5, price: 45000, department: 'ICU' },
    { name: 'ECMO Machine', category: 'Life Support', typical: 2, reorderPoint: 1, price: 280000, department: 'ICU' },
    { name: 'Dialysis Machine', category: 'Life Support', typical: 6, reorderPoint: 4, price: 35000, department: 'Nephrology' },
    { name: 'Defibrillator', category: 'Life Support', typical: 15, reorderPoint: 10, price: 25000, department: 'Emergency' },
    { name: 'BiPAP Machine', category: 'Life Support', typical: 12, reorderPoint: 8, price: 8000, department: 'Respiratory' },

    // Diagnostic Equipment - Essential, very low quantities
    { name: 'MRI Scanner', category: 'Diagnostic Equipment', typical: 1, reorderPoint: 1, price: 1500000, department: 'Radiology' },
    { name: 'CT Scanner', category: 'Diagnostic Equipment', typical: 2, reorderPoint: 1, price: 800000, department: 'Radiology' },
    { name: 'X-Ray Machine', category: 'Diagnostic Equipment', typical: 4, reorderPoint: 3, price: 150000, department: 'Radiology' },
    { name: 'Ultrasound Machine', category: 'Diagnostic Equipment', typical: 8, reorderPoint: 5, price: 75000, department: 'Radiology' },
    { name: 'ECG Machine', category: 'Diagnostic Equipment', typical: 25, reorderPoint: 15, price: 3500, department: 'Cardiology' },

    // Surgical Equipment - Essential, moderate quantities
    { name: 'Operating Table', category: 'Surgical Instruments', typical: 8, reorderPoint: 6, price: 25000, department: 'Surgery' },
    { name: 'Surgical Light', category: 'Surgical Instruments', typical: 8, reorderPoint: 6, price: 15000, department: 'Surgery' },
    { name: 'Anesthesia Machine', category: 'Surgical Instruments', typical: 8, reorderPoint: 6, price: 35000, department: 'Surgery' },
    { name: 'Electrocautery Unit', category: 'Surgical Instruments', typical: 12, reorderPoint: 8, price: 8000, department: 'Surgery' },
    { name: 'Surgical Microscope', category: 'Surgical Instruments', typical: 3, reorderPoint: 2, price: 85000, department: 'Surgery' },

    // Patient Monitoring - Routine, higher quantities
    { name: 'Patient Monitor', category: 'Patient Monitoring', typical: 50, reorderPoint: 30, price: 8000, department: 'General Ward' },
    { name: 'Pulse Oximeter', category: 'Patient Monitoring', typical: 100, reorderPoint: 60, price: 250, department: 'General Ward' },
    { name: 'Blood Pressure Monitor', category: 'Patient Monitoring', typical: 80, reorderPoint: 50, price: 500, department: 'General Ward' },
    { name: 'Thermometer', category: 'Patient Monitoring', typical: 200, reorderPoint: 100, price: 50, department: 'General Ward' },
    { name: 'Infusion Pump', category: 'Patient Monitoring', typical: 60, reorderPoint: 40, price: 3000, department: 'General Ward' },

    // Medical Supplies - Consumables, very high quantities
    { name: 'Surgical Gloves (Box)', category: 'Medical Supplies', typical: 500, reorderPoint: 200, price: 15, department: 'Central Supply' },
    { name: 'Syringes (Box of 100)', category: 'Medical Supplies', typical: 300, reorderPoint: 150, price: 25, department: 'Pharmacy' },
    { name: 'IV Bags (Case)', category: 'Medical Supplies', typical: 400, reorderPoint: 200, price: 80, department: 'Pharmacy' },
    { name: 'Surgical Masks (Box)', category: 'Medical Supplies', typical: 600, reorderPoint: 300, price: 20, department: 'Central Supply' },
    { name: 'Gauze Rolls (Case)', category: 'Medical Supplies', typical: 250, reorderPoint: 100, price: 45, department: 'Central Supply' },
  ]

  private static readonly MANUFACTURERS = [
    'MedTech Solutions UK Ltd.',
    'British Medical Systems',
    'GE Healthcare UK',
    'Siemens Healthineers',
    'Phillips Medical',
    'Stryker UK',
    'Boston Scientific',
    'Johnson & Johnson Medical'
  ]

  private static readonly DEPARTMENTS = [
    'Emergency',
    'ICU',
    'Surgery',
    'Radiology',
    'Laboratory',
    'Pharmacy',
    'Pediatrics',
    'Cardiology',
    'Oncology',
    'Orthopedics',
    'Maternity',
    'General Ward',
    'Central Supply'
  ]

  private static readonly LOCATIONS = [
    'Main Storage',
    'Basement Storage',
    'Floor 1 Supply Room',
    'Floor 2 Supply Room',
    'Floor 3 Supply Room',
    'ICU Storage',
    'Theatre Storage',
    'Emergency Storage'
  ]

  static generateAsset(hospitalConfig?: HospitalConfig): HospitalAsset {
    const equipment = faker.helpers.arrayElement(this.EQUIPMENT_DATA)
    const manufacturer = faker.helpers.arrayElement(this.MANUFACTURERS)

    // Generate realistic quantity variations
    // 70% chance of normal stock, 20% low, 10% critical
    const stockStatus = faker.helpers.weightedArrayElement([
      { value: 'normal', weight: 70 },
      { value: 'low', weight: 20 },
      { value: 'critical', weight: 10 }
    ])

    // Generate stock levels based on HOPCo thresholds:
    // Critical: 0-30% of reorder point
    // Low: 31-99% of reorder point
    // Normal: 100%+ of reorder point
    let quantity: number
    if (stockStatus === 'critical') {
      quantity = Math.max(0, Math.floor(equipment.reorderPoint * faker.number.float({ min: 0, max: 0.3 })))
    } else if (stockStatus === 'low') {
      // Low: between 30% and 100% of reorder point
      quantity = Math.floor(equipment.reorderPoint * faker.number.float({ min: 0.31, max: 0.99 }))
    } else {
      // Normal: at or above reorder point
      quantity = Math.floor(faker.number.float({
        min: equipment.reorderPoint,
        max: equipment.typical * 1.2
      }))
    }

    const baseData = {
      id: faker.string.uuid(),
      name: equipment.name,
      manufacturer,
      category: equipment.category,
      serialNumber: `${faker.string.alpha({ length: 2, casing: 'upper' })}-${faker.string.numeric(6)}`,
      quantity,
      reorderPoint: equipment.reorderPoint,
      lastMaintenance: faker.date.recent({ days: 90 }),
      expiryDate: equipment.category === 'Medical Supplies'
        ? faker.date.future({ years: 2 })
        : undefined,
      location: faker.helpers.arrayElement(this.LOCATIONS),
      condition: faker.helpers.weightedArrayElement([
        { value: 'New' as const, weight: 30 },
        { value: 'Good' as const, weight: 50 },
        { value: 'Fair' as const, weight: 15 },
        { value: 'Maintenance Required' as const, weight: 5 }
      ]),
      customFields: {
        purchasePrice: Math.round(equipment.price * faker.number.float({ min: 0.9, max: 1.1 })),
        department: faker.helpers.arrayElement(this.DEPARTMENTS),
        warrantyExpiry: faker.date.future({ years: faker.number.int({ min: 1, max: 3 }) }),
        lastCalibration: equipment.category === 'Diagnostic Equipment'
          ? faker.date.recent({ days: 30 })
          : undefined
      }
    }

    const config = hospitalConfig || this.getDefaultConfig()
    return new HospitalAsset(baseData, config)
  }

  static generateBatch(count: number, config?: HospitalConfig): HospitalAsset[] {
    const assets: HospitalAsset[] = []
    const usedCombinations = new Set<string>()

    // Ensure variety by cycling through equipment types
    let equipmentIndex = 0

    while (assets.length < count) {
      // Cycle through equipment to ensure variety
      // const equipment = this.EQUIPMENT_DATA[equipmentIndex % this.EQUIPMENT_DATA.length]
      equipmentIndex++

      // Generate asset with this equipment
      const asset = this.generateAsset(config)

      // Ensure we don't have duplicate serial numbers
      const serialKey = `${asset.get('name')}-${asset.get('serialNumber')}`
      if (!usedCombinations.has(serialKey)) {
        assets.push(asset)
        usedCombinations.add(serialKey)
      }
    }

    // Shuffle to make it look more natural
    return assets.sort(() => Math.random() - 0.5)
  }

  /**
   * Generates hospital-specific equipment sets.
   * St Thomas' focuses on emergency/surgical equipment.
   * King's College focuses on diagnostic/lab equipment.
   */
  static generateBatchForHospital(count: number, hospitalId: string, config: HospitalConfig): HospitalAsset[] {
    const assets: HospitalAsset[] = []
    const usedCombinations = new Set<string>()

    // Different equipment focus for each hospital
    let equipmentData: typeof this.EQUIPMENT_DATA

    if (hospitalId === 'hospital-1') {
      // St Thomas' - Focus on emergency and surgical equipment
      equipmentData = this.EQUIPMENT_DATA.filter(e =>
        e.category === 'Life Support' ||
        e.category === 'Surgical Instruments' ||
        e.category === 'Patient Monitoring'
      )
    } else {
      // King's College - Focus on diagnostic and lab equipment
      equipmentData = this.EQUIPMENT_DATA.filter(e =>
        e.category === 'Diagnostic Equipment' ||
        e.category === 'Laboratory Equipment' ||
        e.category === 'Medical Supplies'
      )
    }

    // Ensure we have equipment to work with
    if (equipmentData.length === 0) {
      equipmentData = this.EQUIPMENT_DATA
    }

    let equipmentIndex = 0

    while (assets.length < count) {
      // Cycle through filtered equipment
      const equipment = equipmentData[equipmentIndex % equipmentData.length]
      equipmentIndex++

      // Generate asset with specific equipment
      const asset = this.generateAssetWithEquipment(equipment, config)

      // Ensure no duplicate serial numbers
      const serialKey = `${asset.get('name')}-${asset.get('serialNumber')}`
      if (!usedCombinations.has(serialKey)) {
        assets.push(asset)
        usedCombinations.add(serialKey)
      }
    }

    // Shuffle for natural distribution
    return assets.sort(() => Math.random() - 0.5)
  }

  static generateAssetWithEquipment(equipment: any, config: HospitalConfig): HospitalAsset {
    const manufacturer = faker.helpers.arrayElement(this.MANUFACTURERS)

    // Generate realistic quantity variations
    const stockStatus = faker.helpers.weightedArrayElement([
      { value: 'normal', weight: 70 },
      { value: 'low', weight: 20 },
      { value: 'critical', weight: 10 }
    ])

    let quantity: number
    if (stockStatus === 'critical') {
      quantity = Math.max(0, Math.floor(equipment.reorderPoint * faker.number.float({ min: 0, max: 0.3 })))
    } else if (stockStatus === 'low') {
      quantity = Math.floor(equipment.reorderPoint * faker.number.float({ min: 0.31, max: 0.99 }))
    } else {
      quantity = Math.floor(faker.number.float({
        min: equipment.reorderPoint,
        max: equipment.typical * 1.2
      }))
    }

    const baseData = {
      id: faker.string.uuid(),
      name: equipment.name,
      manufacturer,
      category: equipment.category,
      serialNumber: `${faker.string.alpha({ length: 2, casing: 'upper' })}-${faker.string.numeric(6)}`,
      quantity,
      reorderPoint: equipment.reorderPoint,
      lastMaintenance: faker.date.recent({ days: 90 }),
      expiryDate: equipment.category === 'Medical Supplies'
        ? faker.date.future({ years: 2 })
        : undefined,
      location: faker.helpers.arrayElement(this.LOCATIONS),
      condition: faker.helpers.weightedArrayElement([
        { value: 'New' as const, weight: 30 },
        { value: 'Good' as const, weight: 50 },
        { value: 'Fair' as const, weight: 15 },
        { value: 'Maintenance Required' as const, weight: 5 }
      ]),
      customFields: {
        purchasePrice: Math.round(equipment.price * faker.number.float({ min: 0.9, max: 1.1 })),
        department: faker.helpers.arrayElement(this.DEPARTMENTS),
        warrantyExpiry: faker.date.future({ years: faker.number.int({ min: 1, max: 3 }) }),
        lastCalibration: equipment.category === 'Diagnostic Equipment'
          ? faker.date.recent({ days: 30 })
          : undefined
      }
    }

    return new HospitalAsset(baseData, config)
  }

  static getDefaultConfig(): HospitalConfig {
    return {
      id: 'default',
      name: 'Default Hospital',
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: true, visible: true },
        { key: 'manufacturer', label: 'Manufacturer', type: 'text', required: true, visible: true },
        { key: 'category', label: 'Category', type: 'text', required: true, visible: true },
        { key: 'serialNumber', label: 'Serial Number', type: 'text', required: true, visible: true },
        { key: 'quantity', label: 'Quantity', type: 'number', required: true, visible: true },
        { key: 'department', label: 'Department', type: 'text', required: false, visible: true },
        { key: 'purchasePrice', label: 'Purchase Price', type: 'currency', required: false, visible: false },
        { key: 'warrantyExpiry', label: 'Warranty Expiry', type: 'date', required: false, visible: false },
        { key: 'lastCalibration', label: 'Last Calibration', type: 'date', required: false, visible: false }
      ]
    }
  }

  static getHospitalConfigs(): Record<string, HospitalConfig> {
    return {
      'hospital-1': {
        id: 'hospital-1',
        name: "St Thomas' Hospital",
        fields: [
          { key: 'name', label: 'Name', type: 'text', required: true, visible: true },
          { key: 'manufacturer', label: 'Manufacturer', type: 'text', required: true, visible: true },
          { key: 'category', label: 'Category', type: 'text', required: true, visible: true },
          { key: 'quantity', label: 'Quantity', type: 'number', required: true, visible: true },
          { key: 'serialNumber', label: 'Serial Number', type: 'text', required: true, visible: true },
          // St Thomas' doesn't need these additional fields
          { key: 'expiryDate', label: 'Expiry Date', type: 'date', required: false, visible: false },
          { key: 'purchasePrice', label: 'Price', type: 'currency', required: false, visible: false },
          { key: 'department', label: 'Department', type: 'text', required: false, visible: false }
        ]
      },
      'hospital-2': {
        id: 'hospital-2',
        name: "King's College Hospital",
        fields: [
          { key: 'name', label: 'Name', type: 'text', required: true, visible: true },
          { key: 'manufacturer', label: 'Manufacturer', type: 'text', required: true, visible: true },
          { key: 'category', label: 'Category', type: 'text', required: true, visible: true },
          { key: 'quantity', label: 'Quantity', type: 'number', required: true, visible: true },
          { key: 'serialNumber', label: 'Serial Number', type: 'text', required: true, visible: true },
          // King's College wants to see additional fields as per requirement
          { key: 'expiryDate', label: 'Expiry Date', type: 'date', required: false, visible: true },
          { key: 'purchasePrice', label: 'Price', type: 'currency', required: false, visible: true },
          { key: 'department', label: 'Department', type: 'text', required: false, visible: true }
        ]
      }
    }
  }

  static generateTestUsers() {
    return [
      {
        id: '1',
        username: 'thomas',
        password: 'thomas123',
        fullName: 'Dr. Sarah Johnson',
        role: 'Clinician',
        hospitalId: 'hospital-1',
        hospitalName: "St Thomas' Hospital",
        email: 'sarah.johnson@stthomas.nhs.uk'
      },
      {
        id: '2',
        username: 'kings',
        password: 'kings123',
        fullName: 'Dr. Michael Chen',
        role: 'Clinician',
        hospitalId: 'hospital-2',
        hospitalName: "King's College Hospital",
        email: 'michael.chen@kch.nhs.uk'
      }
    ]
  }
}