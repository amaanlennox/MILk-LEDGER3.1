export type MilkType = "cow" | "buffalo";

export interface Customer {
  id: string;
  name: string;
  milkTypes: MilkType[];
  cowRate: number;
  buffaloRate: number;
  defaultCowQuantity?: number;
  defaultBuffaloQuantity?: number;
}

export interface MilkEntry {
  id:string;
  customerId: string;
  date: string; // YYYY-MM-DD
  cowQuantity: number;
  cowRate: number;
  buffaloQuantity: number;
  buffaloRate: number;
}

export interface Farmer {
  id: string;
  name: string;
  milkTypes: MilkType[];
  cowRate: number;
  buffaloRate: number;
  defaultCowQuantity?: number;
  defaultBuffaloQuantity?: number;
}

export interface FarmerMilkEntry {
  id: string;
  farmerId: string;
  date: string; // YYYY-MM-DD
  cowQuantity: number;
  cowRate: number;
  buffaloQuantity: number;
  buffaloRate: number;
}

export interface FarmerPayment {
  id: string;
  farmerId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  note?: string;
}

export type ProductType = "paneer" | "ghee";

export interface ProductEntry {
  id: string;
  customerId: string;
  date: string; // YYYY-MM-DD
  productType: ProductType;
  quantity: number; // in kg
  price: number; // total price
}

export interface LeftoverSale {
  id: string;
  milkType: MilkType;
  quantity: number;
  rate: number;
  total: number;
  buyer: string;
  date: string; // YYYY-MM-DD
}

// Quick Sale System Types
export interface QuickSaleCustomer {
  id: string;
  name: string;
  lastQuantity?: number;
  lastRate?: number;
  lastMilkType?: MilkType;
}

export interface QuickSaleEntry {
  id: string;
  customerId: string;
  date: string;
  milkType: MilkType;
  quantity: number;
  rate: number;
  amount: number;
}

export interface QuickSalePayment {
  id: string;
  customerId: string;
  date: string;
  amount: number;
  note?: string;
}
