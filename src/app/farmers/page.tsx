"use client";

import { useState, useMemo } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Plus, MoreVertical, Edit, Trash2, Home, Search, X, Tractor, ArrowUpDown } from "lucide-react";
import { FarmerDialog } from "@/components/FarmerDialog";
import { ReorderDialog } from "@/components/ReorderDialog";
import type { Farmer } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function FarmersPage() {
  const { farmers, deleteFarmer, t, isDataLoaded } = useAppContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reorderOpen, setReorderOpen] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleAdd = () => {
    setSelectedFarmer(null);
    setDialogOpen(true);
  };

  const handleEdit = (farmer: Farmer) => {
    setSelectedFarmer(farmer);
    setDialogOpen(true);
  };

  // Strictly follow AppContext orderIndex
  const filteredFarmers = useMemo(() => {
    return farmers.filter((f) => {
      return f.name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [farmers, searchTerm]);
  
  if (!isDataLoaded) {
    return (
      <div className="container py-6 animate-pulse space-y-4">
        <div className="space-y-2">
            <Skeleton className="h-4 w-24 bg-slate-100" />
            <Skeleton className="h-8 w-64 bg-slate-100" />
        </div>
        <div className="grid gap-3">
            {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl bg-slate-50" />
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-2xl page-transition">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <Link href="/" className="text-[10px] font-black text-secondary hover:text-primary flex items-center gap-1.5 mb-1 uppercase tracking-widest transition-colors">
            <Home className="w-3 h-3"/> {t('backToHome')}
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t('farmerManagement')}</h1>
            <Badge variant="secondary" className="h-6 rounded-lg bg-slate-100 text-slate-600 font-black text-xs border-0">
              {farmers.length}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
            <Button 
                onClick={() => setReorderOpen(true)} 
                variant="outline" 
                className="flex-1 sm:flex-none h-10 rounded-xl font-black border-slate-200 px-2 text-[10px] sm:text-xs md:text-sm min-w-0"
            >
                <ArrowUpDown className="mr-1.5 h-4 w-4 shrink-0" />
                <span className="truncate">{t('manageEntryOrder')}</span>
            </Button>
            <Button 
                onClick={handleAdd} 
                className="flex-1 sm:flex-none h-10 font-black rounded-xl bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20 text-white px-2 text-[10px] sm:text-xs md:text-sm min-w-0"
            >
                <Plus className="mr-1.5 h-4 w-4 shrink-0" />
                <span className="truncate">{t('addFarmer')}</span>
            </Button>
        </div>
      </div>

      <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
          <Input
            placeholder={t('searchFarmer')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 pl-11 bg-slate-50 border-slate-200 rounded-xl focus:ring-secondary focus:bg-white transition-all text-slate-900 placeholder:text-slate-300"
          />
          {searchTerm && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-slate-900"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
      </div>

      <div className="space-y-2">
        {filteredFarmers.map((farmer) => (
          <div key={farmer.id} className="glass-card flex items-center justify-between p-3 rounded-xl border-slate-100 transition-all hover:bg-slate-50 group active:scale-[0.98]">
            <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="bg-secondary/10 p-2.5 rounded-lg group-hover:bg-secondary/20 transition-colors shrink-0">
                    <Tractor className="h-5 w-5 text-secondary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-base text-slate-900 truncate leading-tight">{farmer.name}</p>
                    <Badge variant="outline" className="text-[8px] font-black text-slate-300 opacity-60 uppercase border-0 p-0">[{farmer.order ?? 0}]</Badge>
                  </div>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black mt-0.5">
                    {(farmer.milkTypes || []).map(t).join(' • ')}
                  </p>
                </div>
            </div>
            
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg text-slate-300 hover:text-slate-600">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl border-slate-200 bg-white shadow-xl p-1.5 min-w-[160px]">
                  <DropdownMenuItem 
                    onSelect={(e) => {
                      e.preventDefault();
                      handleEdit(farmer);
                    }} 
                    className="text-xs font-black p-2.5 rounded-lg text-slate-900 hover:bg-slate-50"
                  >
                    <Edit className="mr-2.5 h-4 w-4 text-primary" />
                    <span>{t('editFarmer')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onSelect={(e) => {
                      e.preventDefault();
                      setDeleteId(farmer.id);
                    }}
                    className="text-destructive focus:text-destructive focus:bg-destructive/5 text-xs font-black p-2.5 rounded-lg"
                  >
                    <Trash2 className="mr-2.5 h-4 w-4" />
                    <span>{t('deleteFarmer')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
         
        {filteredFarmers.length === 0 && (
            <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl">
              <Tractor className="h-8 w-8 text-slate-100 mx-auto mb-3" />
              <p className="text-slate-300 font-black text-xs uppercase tracking-widest">
                {searchTerm ? t('noFarmersFound') : t('noFarmers')}
              </p>
            </div>
         )}
      </div>

      <FarmerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        farmer={selectedFarmer}
      />

      <ReorderDialog
        open={reorderOpen}
        onOpenChange={setReorderOpen}
        type="farmer"
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl bg-white border-slate-200 max-w-[90vw] p-5">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-slate-900">{t('areYouSure')}</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-slate-500">{t('deleteConfirmation')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3 mt-4">
            <AlertDialogCancel className="flex-1 rounded-xl h-10 mt-0 font-black text-slate-700 border-slate-200 bg-slate-50">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction 
                onClick={() => { 
                  if (deleteId) {
                    const id = deleteId;
                    setDeleteId(null);
                    setTimeout(() => deleteFarmer(id), 100);
                  }
                }} 
                className="flex-1 rounded-xl h-10 bg-destructive hover:bg-destructive/90 font-black text-white"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}