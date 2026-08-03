"use client";

import { useState, useMemo } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Plus, MoreVertical, Edit, Trash2, Home, Search, X, Users } from "lucide-react";
import { CustomerDialog } from "@/components/CustomerDialog";
import type { Customer } from "@/lib/types";
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

export default function CustomersPage() {
  const { customers, deleteCustomer, t, isDataLoaded } = useAppContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleAdd = () => {
    setSelectedCustomer(null);
    setDialogOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDialogOpen(true);
  };

  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        return c.name.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, searchTerm]);

  if (!isDataLoaded) {
    return (
      <div className="container py-8 animate-pulse space-y-6">
        <div className="space-y-2">
            <Skeleton className="h-4 w-24 bg-slate-100" />
            <Skeleton className="h-10 w-64 bg-slate-100" />
        </div>
        <div className="grid gap-4">
            {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl bg-slate-100" />
            ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-8 max-w-2xl page-transition">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
        <div>
          <Link href="/" className="text-[10px] font-black text-secondary hover:text-primary flex items-center gap-1.5 mb-2 uppercase tracking-widest transition-colors">
            <Home className="w-3 h-3"/> {t('backToHome')}
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">{t('customerManagement')}</h1>
            <Badge variant="secondary" className="h-6 rounded-lg bg-slate-100 text-slate-600 font-black text-xs border-0">
              {customers.length}
            </Badge>
          </div>
        </div>
        <Button onClick={handleAdd} size="lg" className="w-full sm:w-auto font-black rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 text-white">
          <Plus className="mr-2 h-5 w-5" />
          {t('addCustomer')}
        </Button>
      </div>

      <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder={t('searchCustomer')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-14 pl-12 bg-slate-50 border-slate-200 rounded-2xl focus:ring-primary focus:bg-white transition-all text-slate-900 placeholder:text-slate-400 text-lg"
          />
          {searchTerm && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 text-slate-400 hover:text-slate-900"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
      </div>

      <div className="space-y-3">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="glass-card flex items-center justify-between p-5 rounded-[24px] border-slate-100 transition-all hover:bg-slate-50 group active:scale-[0.98]">
            <div className="flex items-center gap-5 min-w-0 flex-1">
                <div className="bg-primary/10 p-3.5 rounded-2xl group-hover:bg-primary/20 transition-colors shrink-0">
                    <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-lg text-slate-900 truncate leading-tight">{customer.name}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-1">
                    {(customer.milkTypes || []).map(t).join(' • ')}
                  </p>
                </div>
            </div>
            
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl text-slate-300 hover:text-slate-600 hover:bg-slate-100">
                    <MoreVertical className="h-6 w-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl border-slate-200 bg-white shadow-2xl p-2 min-w-[180px]">
                  <DropdownMenuItem 
                    onSelect={(e) => {
                      e.preventDefault();
                      handleEdit(customer);
                    }} 
                    className="text-sm font-black p-3 rounded-xl m-1 text-slate-900 hover:bg-slate-50 focus:bg-slate-50"
                  >
                    <Edit className="mr-3 h-4 w-4 text-primary" />
                    <span>{t('editCustomer')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onSelect={(e) => {
                      e.preventDefault();
                      setDeleteId(customer.id);
                    }}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10 text-sm font-black p-3 rounded-xl m-1"
                  >
                    <Trash2 className="mr-3 h-4 w-4" />
                    <span>{t('deleteCustomer')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
         
        {filteredCustomers.length === 0 && (
           <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-[32px]">
             <div className="bg-slate-50 p-4 rounded-full w-fit mx-auto mb-4">
                <Users className="h-10 w-10 text-slate-200" />
             </div>
             <p className="text-slate-400 font-black text-sm uppercase tracking-widest px-6">
               {searchTerm ? t('noCustomersFound') : t('noCustomers')}
             </p>
           </div>
         )}
      </div>

      <CustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customer={selectedCustomer}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-[32px] bg-white border-slate-200 max-w-[90vw]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-slate-900">{t('areYouSure')}</AlertDialogTitle>
            <AlertDialogDescription className="text-lg font-medium text-slate-500">{t('deleteConfirmation')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3 mt-6">
            <AlertDialogCancel className="flex-1 rounded-2xl h-14 mt-0 font-black text-slate-700 border-slate-200 bg-slate-50 hover:bg-slate-100">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction 
                onClick={() => { 
                  if (deleteId) {
                    const id = deleteId;
                    setDeleteId(null);
                    setTimeout(() => deleteCustomer(id), 100);
                  }
                }} 
                className="flex-1 rounded-2xl h-14 bg-destructive hover:bg-destructive/90 font-black text-white"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
