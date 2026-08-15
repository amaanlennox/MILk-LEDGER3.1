
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Customer, MilkEntry, Farmer, FarmerMilkEntry, FarmerPayment, ProductEntry, LeftoverSale, MilkType, QuickSaleCustomer, QuickSaleEntry, QuickSalePayment, RateHistoryEntry } from '@/lib/types';
import { translations, Language } from '@/lib/i18n';
import * as db from '@/lib/db';
import { format, subDays, startOfMonth } from 'date-fns';

interface AppContextType {
  customers: Customer[];
  entries: MilkEntry[];
  farmers: Farmer[];
  farmerEntries: FarmerMilkEntry[];
  farmerPayments: FarmerPayment[];
  productEntries: ProductEntry[];
  leftoverSales: LeftoverSale[];
  quickSaleCustomers: QuickSaleCustomer[];
  quickSaleEntries: QuickSaleEntry[];
  quickSalePayments: QuickSalePayment[];
  addCustomer: (customer: Omit<Customer, 'id'>) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  updateCustomerOrder: (orderedIds: string[]) => void;
  addOrUpdateEntry: (entry: Omit<MilkEntry, 'id'>) => void;
  getEntry: (customerId: string, date: string) => MilkEntry | undefined;
  getCustomerById: (id: string) => Customer | undefined;
  addFarmer: (farmer: Omit<Farmer, 'id'>) => void;
  updateFarmer: (farmer: Farmer) => void;
  deleteFarmer: (id: string) => void;
  updateFarmerOrder: (orderedIds: string[]) => void;
  addOrUpdateFarmerEntry: (entry: Omit<FarmerMilkEntry, 'id'>) => void;
  getFarmerEntry: (farmerId: string, date: string) => FarmerMilkEntry | undefined;
  getFarmerById: (id: string) => Farmer | undefined;
  addFarmerPayment: (payment: Omit<FarmerPayment, 'id'>) => void;
  updateFarmerPayment: (payment: FarmerPayment) => void;
  deleteFarmerPayment: (id: string) => void;
  addOrUpdateProductEntry: (entry: Omit<ProductEntry, 'id'>) => void;
  deleteProductEntry: (id: string) => void;
  addLeftoverSale: (sale: Omit<LeftoverSale, 'id'>) => void;
  addQuickSaleCustomer: (customer: Omit<QuickSaleCustomer, 'id'>) => QuickSaleCustomer;
  addQuickSaleEntry: (entry: Omit<QuickSaleEntry, 'id'>) => void;
  addQuickSalePayment: (payment: Omit<QuickSalePayment, 'id'>) => void;
  deleteQuickSalePayment: (id: string) => void;
  getQuickSaleCustomerById: (id: string) => QuickSaleCustomer | undefined;
  getLatestPreviousQuantities: (customerId: string, date: string) => { cow: number, buffalo: number } | null;
  getLatestPreviousFarmerQuantities: (farmerId: string, date: string) => { cow: number, buffalo: number } | null;
  getEffectiveRate: (rateHistory: RateHistoryEntry[] | undefined, dateStr: string) => RateHistoryEntry | null;
  copyYesterdayEntries: (date: Date) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.en) => string;
  exportBackup: () => void;
  restoreBackup: (backupData: any) => boolean;
  inAppRemindersEnabled: boolean;
  setInAppRemindersEnabled: (enabled: boolean) => void;
  resetAllData: () => void;
  isDataLoaded: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const INITIAL_CUSTOMERS_DATA = [
  { name: "Arora ji", milkTypes: ["cow"], cowRate: 60, buffaloRate: 0, defaultCowQuantity: 2.5, defaultBuffaloQuantity: 0 },
  { name: "Manager", milkTypes: ["cow"], cowRate: 60, buffaloRate: 0, defaultCowQuantity: 1.5, defaultBuffaloQuantity: 0 },
  { name: "Saraswati Enclave", milkTypes: ["cow"], cowRate: 55, buffaloRate: 0, defaultCowQuantity: 2.5, defaultBuffaloQuantity: 0 },
  { name: "Mohan lal", milkTypes: ["buffalo"], cowRate: 0, buffaloRate: 70, defaultCowQuantity: 1.0, defaultBuffaloQuantity: 0 },
  { name: "Mohan kiraydaar", milkTypes: ["cow"], cowRate: 70, buffaloRate: 0, defaultCowQuantity: 1.0, defaultBuffaloQuantity: 0 },
  { name: "Mukesh", milkTypes: ["buffalo"], cowRate: 0, buffaloRate: 70, defaultCowQuantity: 0, defaultBuffaloQuantity: 2.0 },
  { name: "Dr vishal", milkTypes: ["buffalo"], cowRate: 0, buffaloRate: 70, defaultCowQuantity: 0, defaultBuffaloQuantity: 1.5 },
  { name: "EBRO I 004", milkTypes: ["cow", "buffalo"], cowRate: 60, buffaloRate: 70, defaultCowQuantity: 1.5, defaultBuffaloQuantity: 2.0 },
  { name: "EBRO G 002", milkTypes: ["cow", "buffalo"], cowRate: 60, buffaloRate: 70, defaultCowQuantity: 1.0, defaultBuffaloQuantity: 2.5 },
  { name: "GAMA 20", milkTypes: ["cow"], cowRate: 60, buffaloRate: 0, defaultCowQuantity: 2.0, defaultBuffaloQuantity: 0 },
  { name: "ALPHA 61", milkTypes: ["buffalo"], cowRate: 0, buffaloRate: 70, defaultCowQuantity: 0, defaultBuffaloQuantity: 3.0 },
  { name: "THAMES A 202", milkTypes: ["buffalo"], cowRate: 0, buffaloRate: 70, defaultCowQuantity: 0, defaultBuffaloQuantity: 3.0 },
  { name: "Dr aperna", milkTypes: ["buffalo"], cowRate: 0, buffaloRate: 70, defaultCowQuantity: 0, defaultBuffaloQuantity: 1.0 },
  { name: "Gangej 304", milkTypes: [], cowRate: 0, buffaloRate: 0, defaultCowQuantity: 0, defaultBuffaloQuantity: 0 },
  { name: "NAIGER C 301", milkTypes: ["buffalo"], cowRate: 0, buffaloRate: 70, defaultCowQuantity: 0, defaultBuffaloQuantity: 1.5 },
  { name: "NAIGER C 207", milkTypes: ["buffalo"], cowRate: 0, buffaloRate: 70, defaultCowQuantity: 0, defaultBuffaloQuantity: 1.5 },
  { name: "ROHAN C 201", milkTypes: ["cow", "buffalo"], cowRate: 60, buffaloRate: 70, defaultCowQuantity: 1.0, defaultBuffaloQuantity: 0.5 },
  { name: "ROHAN D 301", milkTypes: ["cow"], cowRate: 60, buffaloRate: 0, defaultCowQuantity: 3.0, defaultBuffaloQuantity: 0 },
  { name: "EBRO B 406", milkTypes: ["cow"], cowRate: 60, buffaloRate: 0, defaultCowQuantity: 1.5, defaultBuffaloQuantity: 0 },
  { name: "EBRO B 204", milkTypes: ["cow"], cowRate: 60, buffaloRate: 0, defaultCowQuantity: 1.0, defaultBuffaloQuantity: 0 },
  { name: "EBRO B 104", milkTypes: ["cow"], cowRate: 60, buffaloRate: 0, defaultCowQuantity: 2.0, defaultBuffaloQuantity: 0 },
  { name: "EBRO C 308", milkTypes: [], cowRate: 0, buffaloRate: 0, defaultCowQuantity: 0, defaultBuffaloQuantity: 0 },
  { name: "EBRO F", milkTypes: ["buffalo"], cowRate: 0, buffaloRate: 70, defaultCowQuantity: 0, defaultBuffaloQuantity: 2.5 },
  { name: "KASTURI", milkTypes: ["buffalo"], cowRate: 0, buffaloRate: 70, defaultCowQuantity: 0, defaultBuffaloQuantity: 1.5 },
  { name: "KASTURI 45", milkTypes: ["buffalo"], cowRate: 0, buffaloRate: 70, defaultCowQuantity: 0, defaultBuffaloQuantity: 1.0 },
  { name: "KAUSHALYA POLICE", milkTypes: ["buffalo"], cowRate: 0, buffaloRate: 65, defaultCowQuantity: 0, defaultBuffaloQuantity: 1.0 },
  { name: "POLICE KIRAYDAAR", milkTypes: ["buffalo"], cowRate: 0, buffaloRate: 65, defaultCowQuantity: 0, defaultBuffaloQuantity: 1.0 },
  { name: "KAUSHALYA PUNJABI", milkTypes: ["buffalo"], cowRate: 0, buffaloRate: 65, defaultCowQuantity: 0, defaultBuffaloQuantity: 1.5 },
  { name: "KAUSHALYA gaay", milkTypes: ["cow"], cowRate: 60, buffaloRate: 0, defaultCowQuantity: 1.5, defaultBuffaloQuantity: 0 },
  { name: "KAUSHALYA KIRAYDAAR", milkTypes: ["cow"], cowRate: 55, buffaloRate: 0, defaultCowQuantity: 0.5, defaultBuffaloQuantity: 0 },
  { name: "JPS", milkTypes: ["buffalo"], cowRate: 0, buffaloRate: 65, defaultCowQuantity: 0, defaultBuffaloQuantity: 1.5 },
  { name: "JPS PADOSI", milkTypes: ["cow"], cowRate: 55, buffaloRate: 0, defaultCowQuantity: 2.0, defaultBuffaloQuantity: 0 },
  { name: "PARVEJ", milkTypes: ["buffalo"], cowRate: 0, buffaloRate: 65, defaultCowQuantity: 0, defaultBuffaloQuantity: 1.0 },
  { name: "BABU", milkTypes: ["buffalo"], cowRate: 0, buffaloRate: 70, defaultCowQuantity: 0, defaultBuffaloQuantity: 2.5 },
  { name: "PANDEY JI", milkTypes: ["buffalo"], cowRate: 0, buffaloRate: 65, defaultCowQuantity: 0, defaultBuffaloQuantity: 1.5 },
];

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [entries, setEntries] = useState<MilkEntry[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [farmerEntries, setFarmerEntries] = useState<FarmerMilkEntry[]>([]);
  const [farmerPayments, setFarmerPayments] = useState<FarmerPayment[]>([]);
  const [productEntries, setProductEntries] = useState<ProductEntry[]>([]);
  const [leftoverSales, setLeftoverSales] = useState<LeftoverSale[]>([]);
  const [quickSaleCustomers, setQuickSaleCustomers] = useState<QuickSaleCustomer[]>([]);
  const [quickSaleEntries, setQuickSaleEntries] = useState<QuickSaleEntry[]>([]);
  const [quickSalePayments, setQuickSalePayments] = useState<QuickSalePayment[]>([]);
  const [language, setLanguageState] = useState<Language>('en');
  const [inAppRemindersEnabled, setInAppRemindersEnabledState] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // CRITICAL: Strict ordering by "order" field ONLY. No name-based fallback.
  const sortEntities = useCallback(<T extends { order?: number }>(entities: T[]): T[] => {
    return [...entities].sort((a, b) => {
      const orderA = Number(a.order ?? 999999);
      const orderB = Number(b.order ?? 999999);
      return orderA - orderB;
    });
  }, []);

  const getEffectiveRate = useCallback((rateHistory: RateHistoryEntry[] | undefined, dateStr: string): RateHistoryEntry | null => {
    if (!rateHistory || rateHistory.length === 0) return null;
    const targetMonth = dateStr.substring(0, 7); // YYYY-MM
    // Sort descending to find the closest record that is not in the future relative to target
    const sorted = [...rateHistory].sort((a, b) => b.effectiveMonth.localeCompare(a.effectiveMonth));
    const match = sorted.find(r => r.effectiveMonth <= targetMonth);
    // If no match found (e.g., target is older than earliest record), use the oldest available record
    return match || sorted[sorted.length - 1];
  }, []);

  useEffect(() => {
    async function loadData() {
      if (typeof window !== 'undefined') {
        const [
          storedCustomers, 
          storedEntries, 
          storedFarmers,
          storedFarmerEntries,
          storedFarmerPayments,
          storedProductEntries,
          storedLeftoverSales,
          storedQuickSaleCustomers,
          storedQuickSaleEntries,
          storedQuickSalePayments,
          storedLanguage, 
          storedRemindersEnabled,
          isSeeded
        ] = await Promise.all([
          db.get<Customer[]>('customers'),
          db.get<MilkEntry[]>('entries'),
          db.get<Farmer[]>('farmers'),
          db.get<FarmerMilkEntry[]>('farmerEntries'),
          db.get<FarmerPayment[]>('farmerPayments'),
          db.get<ProductEntry[]>('productEntries'),
          db.get<LeftoverSale[]>('leftoverSales'),
          db.get<QuickSaleCustomer[]>('quickSaleCustomers'),
          db.get<QuickSaleEntry[]>('quickSaleEntries'),
          db.get<QuickSalePayment[]>('quickSalePayments'),
          db.get<Language>('language'),
          db.get<boolean>('inAppRemindersEnabled'),
          db.get<boolean>('isSeeded')
        ]);

        let finalCustomers = storedCustomers || [];
        let finalFarmers = storedFarmers || [];
        let finalQuickSale = storedQuickSaleCustomers || [];

        // Rate History Migration & Number Coercion
        // Baseline for existing rates set to early 2024 to cover historical entries
        const baselineMonth = "2024-01"; 
        
        const migrateRates = (entities: any[]) => {
          return entities.map(e => {
            const hasRateHistory = e.rateHistory && e.rateHistory.length > 0;
            if (!hasRateHistory) {
              return {
                ...e,
                rateHistory: [{
                  cowRate: Number(e.cowRate || 0),
                  buffaloRate: Number(e.buffaloRate || 0),
                  effectiveMonth: baselineMonth
                }]
              };
            }
            // Ensure existing rate history entries are numbers
            return {
              ...e,
              rateHistory: e.rateHistory.map((rh: any) => ({
                ...rh,
                cowRate: Number(rh.cowRate || 0),
                buffaloRate: Number(rh.buffaloRate || 0)
              }))
            };
          });
        };

        finalCustomers = migrateRates(finalCustomers);
        finalFarmers = migrateRates(finalFarmers);

        // SEEDING
        if (!isSeeded && finalCustomers.length === 0) {
          const seededCustomers: Customer[] = INITIAL_CUSTOMERS_DATA.map((c, idx) => ({
            ...c,
            id: generateId(),
            milkTypes: c.milkTypes as MilkType[],
            order: idx,
            rateHistory: [{
              cowRate: Number(c.cowRate || 0),
              buffaloRate: Number(c.buffaloRate || 0),
              effectiveMonth: baselineMonth
            }]
          }));
          finalCustomers = seededCustomers;
          await db.set('isSeeded', true);
        }

        // MIGRATION: Ensure order
        let migrated = false;
        const ensureOrder = (list: any[]) => {
          if (list.length > 0 && list.some(item => item.order === undefined)) {
            migrated = true;
            return list.map((item, idx) => ({ ...item, order: item.order ?? idx }));
          }
          return list;
        };

        const migratedCustomers = ensureOrder(finalCustomers);
        const migratedFarmers = ensureOrder(finalFarmers);
        const migratedQuickSale = ensureOrder(finalQuickSale);

        setCustomers(sortEntities(migratedCustomers));
        setFarmers(sortEntities(migratedFarmers));
        setQuickSaleCustomers(sortEntities(migratedQuickSale));
        
        if (migrated) {
            db.set('customers', migratedCustomers);
            db.set('farmers', migratedFarmers);
            db.set('quickSaleCustomers', migratedQuickSale);
        }

        setEntries(storedEntries || []);
        setFarmerEntries(storedFarmerEntries || []);
        setFarmerPayments(storedFarmerPayments || []);
        setProductEntries(storedProductEntries || []);
        setLeftoverSales(storedLeftoverSales || []);
        setQuickSaleEntries(storedQuickSaleEntries || []);
        setQuickSalePayments(storedQuickSalePayments || []);
        setLanguageState(storedLanguage || 'en');
        setInAppRemindersEnabledState(storedRemindersEnabled ?? true);
        setIsDataLoaded(true);
      }
    }
    loadData();
  }, [sortEntities]);

  useEffect(() => { if (isDataLoaded) db.set('customers', customers); }, [customers, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) db.set('entries', entries); }, [entries, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) db.set('farmers', farmers); }, [farmers, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) db.set('farmerEntries', farmerEntries); }, [farmerEntries, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) db.set('farmerPayments', farmerPayments); }, [farmerPayments, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) db.set('productEntries', productEntries); }, [productEntries, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) db.set('leftoverSales', leftoverSales); }, [leftoverSales, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) db.set('quickSaleCustomers', quickSaleCustomers); }, [quickSaleCustomers, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) db.set('quickSaleEntries', quickSaleEntries); }, [quickSaleEntries, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) db.set('quickSalePayments', quickSalePayments); }, [quickSalePayments, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) db.set('language', language); }, [language, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) db.set('inAppRemindersEnabled', inAppRemindersEnabled); }, [inAppRemindersEnabled, isDataLoaded]);

  const addCustomer = useCallback((customerData: Omit<Customer, 'id'>) => {
    const baselineMonth = "2024-01";
    const maxOrder = customers.reduce((max, c) => Math.max(max, Number(c.order ?? 0)), -1);
    const newCustomer = { 
      ...customerData, 
      id: generateId(), 
      order: maxOrder + 1,
      rateHistory: [{
        cowRate: Number(customerData.cowRate || 0),
        buffaloRate: Number(customerData.buffaloRate || 0),
        effectiveMonth: baselineMonth
      }]
    };
    setCustomers(prev => sortEntities([...prev, newCustomer]));
  }, [customers, sortEntities]);

  const updateCustomer = useCallback((updatedCustomer: Customer) => {
    setCustomers(prev => sortEntities(prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c)));
  }, [sortEntities]);

  const deleteCustomer = useCallback((id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    setEntries(prev => prev.filter(e => e.customerId !== id));
    setProductEntries(prev => prev.filter(e => e.customerId !== id));
  }, []);

  const updateCustomerOrder = useCallback((orderedIds: string[]) => {
    setCustomers(prev => {
      const updated = prev.map(c => {
        const newOrder = orderedIds.indexOf(c.id);
        return { ...c, order: newOrder !== -1 ? newOrder : c.order };
      });
      return sortEntities(updated);
    });
  }, [sortEntities]);

  const addOrUpdateEntry = useCallback((entryData: Omit<MilkEntry, 'id'>) => {
    setEntries(prevEntries => {
      const entryDate = entryData.date;
      const existingEntryIndex = prevEntries.findIndex(e => e.customerId === entryData.customerId && e.date === entryDate);
      if (existingEntryIndex > -1) {
        const updatedEntries = [...prevEntries];
        updatedEntries[existingEntryIndex] = { ...updatedEntries[existingEntryIndex], ...entryData };
        return updatedEntries;
      } else {
        return [...prevEntries, { ...entryData, id: generateId() }];
      }
    });
  }, []);

  const getEntry = useCallback((customerId: string, date: string): MilkEntry | undefined => {
    return entries.find(e => e.customerId === customerId && e.date === date);
  }, [entries]);
  
  const getCustomerById = useCallback((id: string) => {
    return customers.find(c => c.id === id);
  }, [customers]);

  const addFarmer = useCallback((farmerData: Omit<Farmer, 'id'>) => {
    const baselineMonth = "2024-01";
    const maxOrder = farmers.reduce((max, f) => Math.max(max, Number(f.order ?? 0)), -1);
    const newFarmer = { 
      ...farmerData, 
      id: generateId(), 
      order: maxOrder + 1,
      rateHistory: [{
        cowRate: Number(farmerData.cowRate || 0),
        buffaloRate: Number(farmerData.buffaloRate || 0),
        effectiveMonth: baselineMonth
      }]
    };
    setFarmers(prev => sortEntities([...prev, newFarmer]));
  }, [farmers, sortEntities]);

  const updateFarmer = useCallback((updatedFarmer: Farmer) => {
    setFarmers(prev => sortEntities(prev.map(f => f.id === updatedFarmer.id ? updatedFarmer : f)));
  }, [sortEntities]);

  const deleteFarmer = useCallback((id: string) => {
    setFarmers(prev => prev.filter(f => f.id !== id));
    setFarmerEntries(prev => prev.filter(e => e.farmerId !== id));
    setFarmerPayments(prev => prev.filter(p => p.farmerId !== id));
  }, []);

  const updateFarmerOrder = useCallback((orderedIds: string[]) => {
    setFarmers(prev => {
      const updated = prev.map(f => {
        const newOrder = orderedIds.indexOf(f.id);
        return { ...f, order: newOrder !== -1 ? newOrder : f.order };
      });
      return sortEntities(updated);
    });
  }, [sortEntities]);

  const addOrUpdateFarmerEntry = useCallback((entryData: Omit<FarmerMilkEntry, 'id'>) => {
    setFarmerEntries(prevEntries => {
      const entryDate = entryData.date;
      const existingEntryIndex = prevEntries.findIndex(e => e.farmerId === entryData.farmerId && e.date === entryDate);
      if (existingEntryIndex > -1) {
        const updatedEntries = [...prevEntries];
        updatedEntries[existingEntryIndex] = { ...updatedEntries[existingEntryIndex], ...entryData };
        return updatedEntries;
      } else {
        return [...prevEntries, { ...entryData, id: generateId() }];
      }
    });
  }, []);

  const getFarmerEntry = useCallback((farmerId: string, date: string): FarmerMilkEntry | undefined => {
    return farmerEntries.find(e => e.farmerId === farmerId && e.date === date);
  }, [farmerEntries]);

  const getFarmerById = useCallback((id: string) => {
    return farmers.find(f => f.id === id);
  }, [farmers]);

  const addFarmerPayment = useCallback((payment: Omit<FarmerPayment, 'id'>) => {
    const newPayment = { ...payment, id: generateId() };
    setFarmerPayments(prev => [...prev, newPayment]);
  }, []);

  const updateFarmerPayment = useCallback((updatedPayment: FarmerPayment) => {
    setFarmerPayments(prev => prev.map(p => p.id === updatedPayment.id ? updatedPayment : p));
  }, []);

  const deleteFarmerPayment = useCallback((id: string) => {
    setFarmerPayments(prev => prev.filter(p => p.id !== id));
  }, []);

  const addOrUpdateProductEntry = useCallback((entryData: Omit<ProductEntry, 'id'>) => {
    setProductEntries(prevEntries => [...prevEntries, { ...entryData, id: generateId() }]);
  }, []);

  const deleteProductEntry = useCallback((id: string) => {
    setProductEntries(prev => prev.filter(p => p.id !== id));
  }, []);

  const addLeftoverSale = useCallback((sale: Omit<LeftoverSale, 'id'>) => {
    const newSale = { ...sale, id: generateId() };
    setLeftoverSales(prev => [...prev, newSale]);
  }, []);

  const addQuickSaleCustomer = useCallback((customerData: Omit<QuickSaleCustomer, 'id'>) => {
    const maxOrder = quickSaleCustomers.reduce((max, c) => Math.max(max, Number(c.order ?? 0)), -1);
    const newCustomer = { ...customerData, id: generateId(), order: maxOrder + 1 };
    setQuickSaleCustomers(prev => sortEntities([...prev, newCustomer]));
    return newCustomer;
  }, [quickSaleCustomers, sortEntities]);

  const addQuickSaleEntry = useCallback((entryData: Omit<QuickSaleEntry, 'id'>) => {
    const newEntry = { ...entryData, id: generateId() };
    setQuickSaleEntries(prev => [...prev, newEntry]);
    setQuickSaleCustomers(prev => prev.map(c => 
      c.id === entryData.customerId 
        ? { ...c, lastQuantity: entryData.quantity, lastRate: entryData.rate, lastMilkType: entryData.milkType } 
        : c
    ));
  }, []);

  const addQuickSalePayment = useCallback((paymentData: Omit<QuickSalePayment, 'id'>) => {
    const newPayment = { ...paymentData, id: generateId() };
    setQuickSalePayments(prev => [...prev, newPayment]);
  }, []);

  const deleteQuickSalePayment = useCallback((id: string) => {
    setQuickSalePayments(prev => prev.filter(p => p.id !== id));
  }, []);

  const getQuickSaleCustomerById = useCallback((id: string) => {
    return quickSaleCustomers.find(c => c.id === id);
  }, [quickSaleCustomers]);

  const getLatestPreviousQuantities = useCallback((customerId: string, date: string) => {
    const previousEntries = entries
      .filter(e => e.customerId === customerId && e.date < date)
      .sort((a, b) => b.date.localeCompare(a.date));
    
    if (previousEntries.length > 0) {
      return {
        cow: Number(previousEntries[0].cowQuantity) || 0,
        buffalo: Number(previousEntries[0].buffaloQuantity) || 0
      };
    }
    return null;
  }, [entries]);

  const getLatestPreviousFarmerQuantities = useCallback((farmerId: string, date: string) => {
    const previousEntries = farmerEntries
      .filter(e => e.farmerId === farmerId && e.date < date)
      .sort((a, b) => b.date.localeCompare(a.date));
    
    if (previousEntries.length > 0) {
      return {
        cow: Number(previousEntries[0].cowQuantity) || 0,
        buffalo: Number(previousEntries[0].buffaloQuantity) || 0
      };
    }
    return null;
  }, [farmerEntries]);

  const copyYesterdayEntries = useCallback((targetDate: Date) => {
    const yesterdayStr = format(subDays(targetDate, 1), 'yyyy-MM-dd');
    const todayStr = format(targetDate, 'yyyy-MM-dd');
    const yesterdayCustomerEntries = entries.filter(e => e.date === yesterdayStr);
    yesterdayCustomerEntries.forEach(yEntry => {
        addOrUpdateEntry({ ...yEntry, date: todayStr, id: undefined as any });
    });
    const yesterdayFarmerEntries = farmerEntries.filter(e => e.date === yesterdayStr);
    yesterdayFarmerEntries.forEach(yEntry => {
        addOrUpdateFarmerEntry({ ...yEntry, date: todayStr, id: undefined as any });
    });
  }, [entries, farmerEntries, addOrUpdateEntry, addOrUpdateFarmerEntry]);

  const setLanguage = useCallback((lang: Language) => { setLanguageState(lang); }, []);
  const setInAppRemindersEnabled = useCallback((enabled: boolean) => { setInAppRemindersEnabledState(enabled); }, []);

  const t = useCallback((key: keyof typeof translations.en) => {
    return translations[language]?.[key] || translations.en[key];
  }, [language]);
  
  const exportBackup = useCallback(() => {
    const backupData = { customers, entries, farmers, farmerEntries, farmerPayments, productEntries, leftoverSales, quickSaleCustomers, quickSaleEntries, quickSalePayments, language, inAppRemindersEnabled };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `milk-ledger-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
  }, [customers, entries, farmers, farmerEntries, farmerPayments, productEntries, leftoverSales, quickSaleCustomers, quickSaleEntries, quickSalePayments, language, inAppRemindersEnabled]);

  const restoreBackup = useCallback((backupData: any): boolean => {
    try {
      if (backupData && Array.isArray(backupData.customers)) {
        setCustomers(sortEntities(backupData.customers || []));
        setEntries(backupData.entries || []);
        setFarmers(sortEntities(backupData.farmers || []));
        setFarmerEntries(backupData.farmerEntries || []);
        setFarmerPayments(backupData.farmerPayments || []);
        setProductEntries(backupData.productEntries || []);
        setLeftoverSales(backupData.leftoverSales || []);
        setQuickSaleCustomers(sortEntities(backupData.quickSaleCustomers || []));
        setQuickSaleEntries(backupData.quickSaleEntries || []);
        setQuickSalePayments(backupData.quickSalePayments || []);
        setLanguageState(backupData.language || 'en');
        setInAppRemindersEnabledState(backupData.inAppRemindersEnabled ?? true);
        return true;
      }
      return false;
    } catch (e) { return false; }
  }, [sortEntities]);

  const resetAllData = useCallback(async () => {
    setCustomers([]); setEntries([]); setFarmers([]); setFarmerEntries([]); setFarmerPayments([]);
    setProductEntries([]); setLeftoverSales([]); setQuickSaleCustomers([]); setQuickSaleEntries([]); setQuickSalePayments([]);
    await db.del('customers'); await db.del('entries'); await db.del('farmers'); await db.del('farmerEntries');
    await db.del('farmerPayments'); await db.del('productEntries'); await db.del('leftoverSales');
    await db.del('quickSaleCustomers'); await db.del('quickSaleEntries'); await db.del('quickSalePayments');
  }, []);

  return (
    <AppContext.Provider value={{ customers, entries, farmers, farmerEntries, farmerPayments, productEntries, leftoverSales, quickSaleCustomers, quickSaleEntries, quickSalePayments, addCustomer, updateCustomer, deleteCustomer, updateCustomerOrder, addOrUpdateEntry, getEntry, getCustomerById, addFarmer, updateFarmer, deleteFarmer, updateFarmerOrder, addOrUpdateFarmerEntry, getFarmerEntry, getFarmerById, addFarmerPayment, updateFarmerPayment, deleteFarmerPayment, addOrUpdateProductEntry, deleteProductEntry, addLeftoverSale, addQuickSaleCustomer, addQuickSaleEntry, addQuickSalePayment, deleteQuickSalePayment, getQuickSaleCustomerById, getLatestPreviousQuantities, getLatestPreviousFarmerQuantities, getEffectiveRate, copyYesterdayEntries, language, setLanguage, t, exportBackup, restoreBackup, inAppRemindersEnabled, setInAppRemindersEnabled, resetAllData, isDataLoaded }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
