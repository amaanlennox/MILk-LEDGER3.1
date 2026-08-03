"use client";

import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Tractor, Home, ChevronRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";

export default function FarmerSummaryListPage() {
  const { farmers, t, isDataLoaded } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFarmers = useMemo(() => 
    farmers.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [farmers, searchTerm]
  );

  if (!isDataLoaded) {
    return (
      <div className="container mx-auto p-6 animate-pulse">
        <div className="h-8 w-32 bg-slate-100 mb-6 rounded-lg" />
        <div className="grid gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl bg-slate-50" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6 max-w-3xl page-transition">
      <div className="mb-6 px-1">
        <Link href="/" className="text-[10px] font-black text-secondary hover:text-primary flex items-center gap-1.5 mb-1 uppercase tracking-widest transition-colors">
            <Home className="w-3 h-3"/> {t('backToHome')}
        </Link>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t('purchaseSummary')}</h1>
      </div>

      <div className="relative mb-6 px-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
          <input 
            placeholder={t('searchFarmer')} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-11 bg-slate-50 border border-slate-100 rounded-xl focus:ring-secondary focus:bg-white transition-all text-slate-900 placeholder:text-slate-300 text-sm outline-none px-4"
          />
      </div>

      <div className="grid gap-2 px-1">
        {filteredFarmers.map((farmer) => (
          <Link key={farmer.id} href={`/farmer-summary/${farmer.id}`} className="group">
              <Card className="glass-card border-slate-100 hover:border-secondary/40 hover:bg-slate-50 transition-all duration-300 rounded-xl overflow-hidden group-active:scale-[0.98]">
                  <div className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <div className="bg-secondary/10 p-2 rounded-lg group-hover:bg-secondary/20 transition-colors">
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
        {filteredFarmers.length === 0 && (
            <div className="py-16 text-center text-slate-300 font-black uppercase tracking-widest text-[9px] border-2 border-dashed border-slate-100 rounded-2xl">
                {searchTerm ? t('noFarmersFound') : t('noFarmers')}
            </div>
        )}
      </div>
    </div>
  );
}