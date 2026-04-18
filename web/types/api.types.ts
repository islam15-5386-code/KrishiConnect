export interface PriceData {
  crop: string;
  pricePerKg: number;
  changePercent: number;
}

export interface CropListing {
  id: number;
  cropNameBn: string;
  farmerName: string;
  district: string;
  quantityKg: number;
  askingPrice: number;
  marketBenchmark: number;
  grade: 'A' | 'B' | 'C';
  cropType: string;
}

export interface User {
  id: number;
  name: string;
  phone: string;
  role: 'farmer' | 'officer' | 'company' | 'vendor';
  district: string;
  joinedAt: string;
  status: 'active' | 'pending' | 'suspended';
}

export interface AdvisoryTicket {
  id: number;
  farmer: string;
  cropProblem: string;
  district: string;
  officerName?: string;
  submittedAt: string;
  status: 'open' | 'escalated' | 'resolved';
  images?: string[];
  thread?: Array<{ sender: string; message: string; timestamp: string }>;
  escalationHistory?: Array<{ note: string; timestamp: string }>;
}
