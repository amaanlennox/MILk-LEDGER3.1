"use client";

import { useState, useCallback } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Home, Plus, Search, Package, ShoppingBag } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Customer, ProductType } from "@/lib/types";
import { ProductEntryDialog } from "@/components/ProductEntryDialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

function CustomerListForProduct({ productType }: { productType: ProductType }) {
  const { customers, t, isDataLoaded } = useAppContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleAddProductEntry = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setDialogOpen(true);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setTimeout(() => setSelectedCustomer(null), 300);
    }
  }, []);
  
  if (!isDataLoaded) {
    return (
      <div className="grid gap-2 pt-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl bg-slate-50" />
        ))}
      </div>
    )
  }

  // Strictly follow AppContext order, only filtering by name search
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (customers.length === 0) {
    return (
      <div className="py-16 text-center border-2 border-dashed border-slate-100 rounded-2xl mt-4">
        <p className="text-slate-300 mb-4 text-xs font-black uppercase tracking-widest">{t('noCustomers')}</p>
        <Link href="/customers">
          <Button size="sm" className="rounded-xl bg-primary hover:bg-primary/90 font-black">{t('addCustomer')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-2">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
        <Input
          placeholder={t('searchCustomer')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-9 pl-10 bg-slate-50 border-slate-100 rounded-xl focus:ring-accent focus:bg-white transition-all text-slate-900 placeholder:text-slate-300 text-sm"
        />
      </div>
      
      <div className="grid gap-2">
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer) => (
            <div 
                key={customer.id} 
                onClick={() => handleAddProductEntry(customer)}
                className="glass-card flex items-center justify-between p-3 rounded-xl border-slate-100 hover:border-accent/40 hover:bg-slate-50 transition-all cursor-pointer group active:scale-[0.98]"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="bg-accent/10 p-2 rounded-lg group-hover:bg-accent/20 transition-colors">
                    <Package className="h-4 w-4 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-sm text-slate-900 truncate leading-tight">{customer.name}</p>
                  <p className="text-[8px] text-slate-400 uppercase tracking-widest font-black mt-0.5">
                    {(customer.milkTypes || []).map(t).join(' • ')}
                  </p>
                </div>
              </div>
              <div className="bg-accent h-8 w-8 rounded-lg flex items-center justify-center shadow-md shadow-accent/10 group-hover:scale-105 transition-transform">
                <Plus className="h-4 w-4 text-white" />
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-slate-200 py-10 text-[9px] font-black uppercase tracking-widest">{t('noCustomersFound')}</p>
        )}
      </div>

      {selectedCustomer && (
        <ProductEntryDialog
          key={`${productType}-${selectedCustomer.id}`}
          open={dialogOpen}
          onOpenChange={handleOpenChange}
          customer={selectedCustomer}
          productType={productType}
        />
      )}
    </div>
  );
}

export default function ProductsPage() {
  const { t } = useAppContext();

  return (
    <div className="container py-6 max-w-2xl page-transition">
      <div className="mb-6 px-1">
          <Link href="/" className="text-[10px] font-black text-secondary hover:text-primary flex items-center gap-1.5 mb-1 uppercase tracking-widest transition-colors">
              <Home className="w-3 h-3"/> {t('backToHome')}
          </Link>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t('addProducts')}</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-0.5">{t('addTodaysProducts')}</p>
      </div>
      
      <Tabs defaultValue="paneer" className="w-full px-1">
        <TabsList className="grid w-full grid-cols-2 h-10 bg-slate-50 p-1 rounded-xl mb-6 border border-slate-100 shadow-sm">
            <TabsTrigger value="paneer" className="rounded-lg font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">{t('paneer')}</TabsTrigger>
            <TabsTrigger value="ghee" className="rounded-lg font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-secondary data-[state=active]:text-white transition-all">{t('ghee')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="paneer" className="mt-0 focus-visible:ring-0">
            <Card className="bg-transparent border-0 shadow-none">
                <div className="flex items-center gap-1.5 mb-1.5 px-0.5">
                    <ShoppingBag className="h-3 w-3 text-primary" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary">{t('paneer')} {t('productEntry')}</span>
                </div>
                <CustomerListForProduct productType="paneer" />
            </Card>
        </TabsContent>
        
        <TabsContent value="ghee" className="mt-0 focus-visible:ring-0">
             <Card className="bg-transparent border-0 shadow-none">
                <div className="flex items-center gap-1.5 mb-1.5 px-0.5">
                    <ShoppingBag className="h-3 w-3 text-secondary" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-secondary">{t('ghee')} {t('productEntry')}</span>
                </div>
                <CustomerListForProduct productType="ghee" />
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}