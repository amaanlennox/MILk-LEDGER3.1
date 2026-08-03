"use client";

import { useAppContext } from "@/context/AppContext";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { User, Home, Tractor, ChevronRight, Search, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export default function SummaryListPage() {
  const { 
    customers, 
    farmers, 
    quickSaleCustomers, 
    quickSaleEntries, 
    quickSalePayments, 
    t, 
    isDataLoaded 
  } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCustomers = useMemo(() => 
    customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [customers, searchTerm]
  );

  const filteredFarmers = useMemo(() => 
    farmers.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [farmers, searchTerm]
  );

  const filteredQuickSale = useMemo(() => 
    quickSaleCustomers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [quickSaleCustomers, searchTerm]
  );

  // Helper to get balance for Quick Sale display
  const getQuickSaleBalance = (customerId: string) => {
    const sales = quickSaleEntries.filter(e => e.customerId === customerId).reduce((sum, e) => sum + e.amount, 0);
    const payments = quickSalePayments.filter(p => p.customerId === customerId).reduce((sum, p) => sum + p.amount, 0);
    return sales - payments;
  };

  if (!isDataLoaded) {
    return (
      <div className="container mx-auto p-4 animate-pulse">
        <div className="h-8 w-32 bg-slate-100 mb-6 rounded-lg" />
        <div className="grid gap-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl bg-slate-50" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container py-4 max-w-3xl page-transition">
      <div className="mb-6 px-1">
        <Link href="/" className="text-[9px] font-black text-secondary hover:text-primary flex items-center gap-1 mb-1 uppercase tracking-widest transition-colors">
            <Home className="w-3 h-3"/> {t('backToHome')}
        </Link>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t('monthlySummary')}</h1>
      </div>

      <div className="relative mb-6 px-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
          <Input 
            placeholder={t('searchCustomer')} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 pl-10 bg-slate-50 border-slate-100 rounded-xl focus:ring-primary focus:bg-white transition-all text-slate-900 placeholder:text-slate-300 text-sm"
          />
      </div>

      <Tabs defaultValue="customers" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-10 bg-slate-50 p-1 rounded-xl mb-6 border border-slate-100 shadow-sm">
            <TabsTrigger value="customers" className="rounded-lg font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">{t('customers')}</TabsTrigger>
            <TabsTrigger value="farmers" className="rounded-lg font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-secondary data-[state=active]:text-white transition-all">{t('farmers')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="customers" className="mt-0 focus-visible:ring-0">
          <div className="space-y-8">
            <div className="grid gap-2 px-1">
              {filteredCustomers.map((customer) => (
                <Link key={customer.id} href={`/summary/${customer.id}`} className="group">
                    <Card className="glass-card border-slate-100 hover:border-primary/40 hover:bg-slate-50 transition-all duration-300 rounded-xl overflow-hidden group-active:scale-[0.98]">
                        <div className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                                    <User className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 group-hover:text-primary transition-colors">{customer.name}</h3>
                                    <Badge variant="outline" className="text-[7px] h-3.5 font-black uppercase tracking-tighter border-accent/30 text-accent bg-accent/5">SALES CLIENT</Badge>
                                </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-200 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                    </Card>
                </Link>
              ))}
            </div>

            <div className="pt-2 px-1">
              <div className="flex items-center gap-2 mb-4">
                 <Separator className="flex-1 opacity-50" />
                 <div className="flex items-center gap-1.5">
                    <History className="h-3 w-3 text-slate-400" />
                    <h3 className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">{t('quickSaleAccounts')}</h3>
                 </div>
                 <Separator className="flex-1 opacity-50" />
              </div>

              <div className="grid gap-2">
                {filteredQuickSale.map((cust) => {
                  const balance = getQuickSaleBalance(cust.id);
                  return (
                    <Link key={cust.id} href={`/quick-sale/${cust.id}`} className="group">
                      <Card className="glass-card border-slate-100 hover:border-primary/40 hover:bg-slate-50 transition-all duration-300 rounded-xl overflow-hidden group-active:scale-[0.98]">
                        <div className="p-3 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="bg-slate-100 p-2 rounded-lg group-hover:bg-slate-200 transition-colors">
                              <User className="h-4 w-4 text-slate-600" />
                            </div>
                            <div>
                              <h4 className="font-black text-sm text-slate-900">{cust.name}</h4>
                              <p className="text-[9px] font-black uppercase tracking-tighter text-slate-400">
                                {t('outstanding')}: <span className={cn(balance > 0 ? "text-rose-500" : "text-emerald-500")}>₹{balance.toFixed(0)}</span>
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-200 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </Card>
                    </Link>
                  );
                })}
                {filteredQuickSale.length === 0 && (
                    <div className="py-10 text-center border border-dashed rounded-xl text-[9px] font-black text-slate-300 uppercase tracking-widest">{t('noEntries')}</div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="farmers" className="mt-0 focus-visible:ring-0">
          <div className="grid gap-2 px-1">
            {filteredFarmers.map((farmer) => (
              <Link key={farmer.id} href={`/farmer-summary/${farmer.id}`} className="group">
                  <Card className="glass-card border-slate-100 hover:border-secondary/40 hover:bg-slate-50 transition-all duration-300 rounded-xl overflow-hidden group-active:scale-[0.98]">
                      <div className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <div className="bg-secondary/10 p-2 rounded-lg group-hover:bg-secondary/30 transition-colors">
                                  <Tractor className="h-4 w-4 text-secondary" />
                              </div>
                              <div>
                                  <h3 className="text-sm font-black text-slate-900 group-hover:text-secondary transition-colors">{farmer.name}</h3>
                                  <Badge variant="outline" className="text-[7px] h-3.5 font-black uppercase tracking-tighter border-secondary/30 text-secondary bg-secondary/5">PURCHASE VENDOR</Badge>
                              </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-200 group-hover:text-secondary group-hover:translate-x-1 transition-all" />
                      </div>
                  </Card>
              </Link>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
