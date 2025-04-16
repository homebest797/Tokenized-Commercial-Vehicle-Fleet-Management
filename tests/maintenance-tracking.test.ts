import { describe, it, expect, beforeEach } from 'vitest';

// Mock the Clarity contract calls
const mockContractCalls = {
  records: new Map(),
  mileage: new Map(),
  lastId: 0,
  contractOwner: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  txSender: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  
  addRecord(vehicleId, serviceType, date, miles, cost, notes, nextMiles) {
    if (this.txSender !== this.contractOwner) {
      return { type: 'err', value: 403 };
    }
    
    const newId = this.lastId + 1;
    this.lastId = newId;
    
    this.records.set(newId, {
      'vehicle-id': vehicleId,
      'service-type': serviceType,
      date,
      mileage: miles,
      cost,
      notes,
      'next-mileage': nextMiles
    });
    
    this.mileage.set(vehicleId, { current: miles });
    
    return { type: 'ok', value: newId };
  },
  
  updateMileage(vehicleId, miles) {
    if (this.txSender !== this.contractOwner) {
      return { type: 'err', value: 403 };
    }
    
    this.mileage.set(vehicleId, { current: miles });
    
    return { type: 'ok', value: true };
  },
  
  getRecord(id) {
    return this.records.get(id) || null;
  },
  
  getMileage(vehicleId) {
    return this.mileage.get(vehicleId) || { current: 0 };
  },
  
  getCount() {
    return this.lastId;
  }
};

describe('Maintenance Tracking Contract', () => {
  beforeEach(() => {
    // Reset the mock state
    mockContractCalls.records = new Map();
    mockContractCalls.mileage = new Map();
    mockContractCalls.lastId = 0;
    mockContractCalls.txSender = mockContractCalls.contractOwner;
  });
  
  it('should add a maintenance record', () => {
    const result = mockContractCalls.addRecord(
        1,                    // vehicleId
        'Oil Change',         // serviceType
        1640995200,           // date (Jan 1, 2022)
        5000,                 // miles
        50,                   // cost
        'Regular maintenance', // notes
        10000                 // nextMiles
    );
    
    expect(result.type).toBe('ok');
    expect(result.value).toBe(1);
    
    const record = mockContractCalls.getRecord(1);
    expect(record).not.toBeNull();
    expect(record['service-type']).toBe('Oil Change');
    expect(record.mileage).toBe(5000);
    expect(record['next-mileage']).toBe(10000);
    
    const mileage = mockContractCalls.getMileage(1);
    expect(mileage.current).toBe(5000);
  });
  
  it('should update vehicle mileage', () => {
    // First add a maintenance record
    mockContractCalls.addRecord(
        1, 'Tire Rotation', 1640995200, 5000, 30, 'Regular maintenance', 10000
    );
    
    // Then update mileage
    const result = mockContractCalls.updateMileage(1, 7500);
    
    expect(result.type).toBe('ok');
    expect(result.value).toBe(true);
    
    const mileage = mockContractCalls.getMileage(1);
    expect(mileage.current).toBe(7500);
  });
  
  it('should fail operations if not contract owner', () => {
    // Change tx-sender to someone else
    mockContractCalls.txSender = 'ST2REHHS5J3CERCRBEPMGH7KZ55NZSECX1DA93S2S';
    
    // Try to add a maintenance record
    const result = mockContractCalls.addRecord(
        1, 'Oil Change', 1640995200, 5000, 50, 'Regular maintenance', 10000
    );
    
    expect(result.type).toBe('err');
    expect(result.value).toBe(403);
  });
});
