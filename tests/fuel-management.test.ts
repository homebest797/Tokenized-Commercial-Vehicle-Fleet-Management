import { describe, it, expect, beforeEach } from 'vitest';

// Mock the Clarity contract calls
const mockContractCalls = {
  records: new Map(),
  efficiency: new Map(),
  lastId: 0,
  contractOwner: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  txSender: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  
  addRecord(vehicleId, date, gallons, price, odometer, fuelType, location) {
    if (this.txSender !== this.contractOwner) {
      return { type: 'err', value: 403 };
    }
    
    const newId = this.lastId + 1;
    this.lastId = newId;
    
    const total = gallons * price;
    
    // Get existing efficiency data or create default
    const eff = this.efficiency.get(vehicleId) || {
      gallons: 0,
      miles: 0,
      'last-odometer': 0
    };
    
    // Calculate miles driven
    const milesDriven = eff['last-odometer'] > 0
        ? odometer - eff['last-odometer']
        : 0;
    
    // Update efficiency data
    this.efficiency.set(vehicleId, {
      gallons: eff.gallons + gallons,
      miles: eff.miles + milesDriven,
      'last-odometer': odometer
    });
    
    // Store the fuel record
    this.records.set(newId, {
      'vehicle-id': vehicleId,
      date,
      gallons,
      price,
      total,
      odometer,
      'fuel-type': fuelType,
      location
    });
    
    return { type: 'ok', value: newId };
  },
  
  getRecord(id) {
    return this.records.get(id) || null;
  },
  
  getMpg(vehicleId) {
    const eff = this.efficiency.get(vehicleId);
    
    if (!eff || eff.gallons === 0) {
      return 0;
    }
    
    return Math.floor(eff.miles / eff.gallons);
  },
  
  getCount() {
    return this.lastId;
  }
};

describe('Fuel Management Contract', () => {
  beforeEach(() => {
    // Reset the mock state
    mockContractCalls.records = new Map();
    mockContractCalls.efficiency = new Map();
    mockContractCalls.lastId = 0;
    mockContractCalls.txSender = mockContractCalls.contractOwner;
  });
  
  it('should add a fuel record', () => {
    const result = mockContractCalls.addRecord(
        1,                // vehicleId
        1640995200,       // date (Jan 1, 2022)
        10,               // gallons
        3,                // price
        5000,             // odometer
        'Regular',        // fuelType
        'Gas Station #1'  // location
    );
    
    expect(result.type).toBe('ok');
    expect(result.value).toBe(1);
    
    const record = mockContractCalls.getRecord(1);
    expect(record).not.toBeNull();
    expect(record.gallons).toBe(10);
    expect(record.price).toBe(3);
    expect(record.total).toBe(30);
    expect(record.odometer).toBe(5000);
  });
  
  it('should fail operations if not contract owner', () => {
    // Change tx-sender to someone else
    mockContractCalls.txSender = 'ST2REHHS5J3CERCRBEPMGH7KZ55NZSECX1DA93S2S';
    
    // Try to add a fuel record
    const result = mockContractCalls.addRecord(
        1, 1640995200, 10, 3, 5000, 'Regular', 'Gas Station #1'
    );
    
    expect(result.type).toBe('err');
    expect(result.value).toBe(403);
  });
});
