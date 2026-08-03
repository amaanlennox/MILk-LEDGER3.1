"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Customer, MilkEntry, Farmer, FarmerMilkEntry, FarmerPayment, ProductEntry, LeftoverSale, MilkType, QuickSaleCustomer, QuickSaleEntry, QuickSalePayment } from '@/lib/types';
import { translations, Language } from '@/lib/i18n';
import * as db from '@/lib/db';
import { format, subDays } from 'date-fns';

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
  addOrUpdateEntry: (entry: Omit<MilkEntry, 'id'>) => void;
  getEntry: (customerId: string, date: string) => MilkEntry | undefined;
  getCustomerById: (id: string) => Customer | undefined;
  addFarmer: (farmer: Omit<Farmer, 'id'>) => void;
  updateFarmer: (farmer: Farmer) => void;
  deleteFarmer: (id: string) => void;
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

        if (!isSeeded && finalCustomers.length === 0) {
          const seededCustomers: Customer[] = INITIAL_CUSTOMERS_DATA.map(c => ({
            ...c,
            id: generateId(),
            milkTypes: c.milkTypes as MilkType[]
          }));
          finalCustomers = seededCustomers;
          await db.set('isSeeded', true);
        }

        setCustomers(finalCustomers);
        setEntries(storedEntries || []);
        setFarmers(storedFarmers || []);
        setFarmerEntries(storedFarmerEntries || []);
        setFarmerPayments(storedFarmerPayments || []);
        setProductEntries(storedProductEntries || []);
        setLeftoverSales(storedLeftoverSales || []);
        setQuickSaleCustomers(storedQuickSaleCustomers || []);
        setQuickSaleEntries(storedQuickSaleEntries || []);
        setQuickSalePayments(storedQuickSalePayments || []);
        setLanguageState(storedLanguage || 'en');
        setInAppRemindersEnabledState(storedRemindersEnabled ?? true);
        setIsDataLoaded(true);
      }
    }
    loadData();
  }, []);

  // Global body-lock safety cleanup
  useEffect(() => {
    const handleGlobalCleanup = () => {
      // Small delay to let animations finish
      setTimeout(() => {
        const isDialogOpen = !!document.querySelector('[role="dialog"], [data-radix-menu-content], .radix-overlay');
        if (!isDialogOpen) {
          document.body.style.pointerEvents = "";
          document.body.style.overflow = "";
          document.documentElement.style.pointerEvents = "";
          document.documentElement.style.overflow = "";
        }
      }, 400);
    };

    window.addEventListener('click', handleGlobalCleanup);
    window.addEventListener('touchend', handleGlobalCleanup);
    return () => {
      window.removeEventListener('click', handleGlobalCleanup);
      window.removeEventListener('touchend', handleGlobalCleanup);
    };
  }, []);

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

  const addCustomer = useCallback((customer: Omit<Customer, 'id'>) => {
    const newCustomer = { ...customer, id: generateId() };
    setCustomers(prev => [...prev, newCustomer]);
  }, []);

  const updateCustomer = useCallback((updatedCustomer: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
  }, []);

  const deleteCustomer = useCallback((id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    setEntries(prev => prev.filter(e => e.customerId !== id));
    setProductEntries(prev => prev.filter(e => e.customerId !== id));
  }, []);

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

  const addFarmer = useCallback((farmer: Omit<Farmer, 'id'>) => {
    const newFarmer = { ...farmer, id: generateId() };
    setFarmers(prev => [...prev, newFarmer]);
  }, []);

  const updateFarmer = useCallback((updatedFarmer: Farmer) => {
    setFarmers(prev => prev.map(f => f.id === updatedFarmer.id ? updatedFarmer : f));
  }, []);

  const deleteFarmer = useCallback((id: string) => {
    setFarmers(prev => prev.filter(f => f.id !== id));
    setFarmerEntries(prev => prev.filter(e => e.farmerId !== id));
    setFarmerPayments(prev => prev.filter(p => p.farmerId !== id));
  }, []);

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

  // Quick Sale Methods
  const addQuickSaleCustomer = useCallback((customerData: Omit<QuickSaleCustomer, 'id'>) => {
    const newCustomer = { ...customerData, id: generateId() };
    setQuickSaleCustomers(prev => [...prev, newCustomer]);
    return newCustomer;
  }, []);

  const addQuickSaleEntry = useCallback((entryData: Omit<QuickSaleEntry, 'id'>) => {
    const newEntry = { ...entryData, id: generateId() };
    setQuickSaleEntries(prev => [...prev, newEntry]);
    
    // Update customer last values
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
        setCustomers(backupData.customers || []);
        setEntries(backupData.entries || []);
        setFarmers(backupData.farmers || []);
        setFarmerEntries(backupData.farmerEntries || []);
        setFarmerPayments(backupData.farmerPayments || []);
        setProductEntries(backupData.productEntries || []);
        setLeftoverSales(backupData.leftoverSales || []);
        setQuickSaleCustomers(backupData.quickSaleCustomers || []);
        setQuickSaleEntries(backupData.quickSaleEntries || []);
        setQuickSalePayments(backupData.quickSalePayments || []);
        setLanguageState(backupData.language || 'en');
        setInAppRemindersEnabledState(backupData.inAppRemindersEnabled ?? true);
        return true;
      }
      return false;
    } catch (e) { return false; }
  }, []);

  const resetAllData = useCallback(async () => {
    setCustomers([]); setEntries([]); setFarmers([]); setFarmerEntries([]); setFarmerPayments([]);
    setProductEntries([]); setLeftoverSales([]); setQuickSaleCustomers([]); setQuickSaleEntries([]); setQuickSalePayments([]);
    await db.del('customers'); await db.del('entries'); await db.del('farmers'); await db.del('farmerEntries');
    await db.del('farmerPayments'); await db.del('productEntries'); await db.del('leftoverSales');
    await db.del('quickSaleCustomers'); await db.del('quickSaleEntries'); await db.del('quickSalePayments');
  }, []);

  return (
    <AppContext.Provider value={{ customers, entries, farmers, farmerEntries, farmerPayments, productEntries, leftoverSales, quickSaleCustomers, quickSaleEntries, quickSalePayments, addCustomer, updateCustomer, deleteCustomer, addOrUpdateEntry, getEntry, getCustomerById, addFarmer, updateFarmer, deleteFarmer, addOrUpdateFarmerEntry, getFarmerEntry, getFarmerById, addFarmerPayment, updateFarmerPayment, deleteFarmerPayment, addOrUpdateProductEntry, deleteProductEntry, addLeftoverSale, addQuickSaleCustomer, addQuickSaleEntry, addQuickSalePayment, deleteQuickSalePayment, getQuickSaleCustomerById, copyYesterdayEntries, language, setLanguage, t, exportBackup, restoreBackup, inAppRemindersEnabled, setInAppRemindersEnabled, resetAllData, isDataLoaded }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
