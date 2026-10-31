import { ApiComplaintRepository } from './ApiComplaintRepository';
import { IComplaintRepository } from './IComplaintRepository';
import { MockComplaintRepository } from './MockComplaintRepository';

// Check data provider selection: 'mock' (default) or 'api'
const providerMode = ((import.meta as any).env?.VITE_DATA_PROVIDER || 'mock').toLowerCase();

export const complaintRepository: IComplaintRepository =
  providerMode === 'api' ? new ApiComplaintRepository() : new MockComplaintRepository();

export * from './IComplaintRepository';
export * from './MockComplaintRepository';
export * from './ApiComplaintRepository';
