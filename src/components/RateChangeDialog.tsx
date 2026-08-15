
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAppContext } from "@/context/AppContext";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { format, getYear } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, TrendingUp } from "lucide-react";
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

interface RateChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string;
  type: 'customer' | 'farmer';
}

export function RateChangeDialog({ open, onOpenChange, entityId, type }: RateChangeDialogProps) {
  const { getCustomerById, getFarmerById, updateCustomer, updateFarmer, getEffectiveRate, t } = useAppContext();
  const { toast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);

  const entity = type === 'customer' ? getCustomerById(entityId) : getFarmerById(entityId);
  const currentMonthStr = format(new Date(), 'yyyy-MM');
  const currentRate = useMemo(() => getEffectiveRate(entity?.rateHistory, currentMonthStr), [entity, getEffectiveRate, currentMonthStr]);

  const formSchema = z.object({
    cowRate: z.coerce.number().min(0),
    buffaloRate: z.coerce.number().min(0),
    month: z.string(),
    year: z.string(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cowRate: currentRate?.cowRate || 0,
      buffaloRate: currentRate?.buffaloRate || 0,
      month: format(new Date(), 'M'),
      year: format(new Date(), 'yyyy'),
    },
  });

  useEffect(() => {
    if (open && currentRate) {
      form.reset({
        cowRate: currentRate.cowRate,
        buffaloRate: currentRate.buffaloRate,
        month: format(new Date(), 'M'),
        year: format(new Date(), 'yyyy'),
      });
    }
  }, [open, currentRate, form]);

  const years = useMemo(() => {
    const currentYear = getYear(new Date());
    return [currentYear - 1, currentYear, currentYear + 1].map(String);
  }, []);

  const months = useMemo(() => 
    Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: format(new Date(2000, i), 'MMMM') })), 
  []);

  // Safety cleanup for UI freeze issues
  const closeAll = () => {
    setShowConfirm(false);
    onOpenChange(false);
    setTimeout(() => {
      document.body.style.pointerEvents = "auto";
      document.body.style.overflow = "auto";
    }, 300);
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setShowConfirm(true);
  };

  const handleConfirmedSave = () => {
    const values = form.getValues();
    const effectiveMonth = `${values.year}-${values.month.padStart(2, '0')}`;
    
    if (!entity) return;

    const newHistoryEntry = {
      cowRate: Number(values.cowRate),
      buffaloRate: Number(values.buffaloRate),
      effectiveMonth,
    };

    const newHistory = [...(entity.rateHistory || [])];
    const existingIndex = newHistory.findIndex(h => h.effectiveMonth === effectiveMonth);
    
    if (existingIndex > -1) {
      newHistory[existingIndex] = newHistoryEntry;
    } else {
      newHistory.push(newHistoryEntry);
    }

    const updatedEntity = { ...entity, rateHistory: newHistory };

    if (type === 'customer') {
      updateCustomer(updatedEntity as any);
    } else {
      updateFarmer(updatedEntity as any);
    }

    toast({ title: t('save'), description: "Rate history updated successfully." });
    closeAll();
  };

  if (!entity) return null;

  const displayMonth = format(new Date(parseInt(form.watch('year')), parseInt(form.watch('month')) - 1), 'MMMM yyyy');

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden shadow-2xl border-0">
          <DialogHeader className="p-6 pb-4 bg-[#02182B] text-white">
            <DialogTitle className="text-xl font-black flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              {t('changeRate')}
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
              {entity.name}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6 bg-white">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">{t('currentRates')}</p>
                    <div className="space-y-1">
                        <p className="text-sm font-black text-slate-700">C: ₹{Number(currentRate?.cowRate || 0).toFixed(0)}</p>
                        <p className="text-sm font-black text-slate-700">B: ₹{Number(currentRate?.buffaloRate || 0).toFixed(0)}</p>
                    </div>
                </div>
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                    <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-2">{t('newRates')}</p>
                    <div className="space-y-1">
                        <p className="text-sm font-black text-slate-900">C: ₹{Number(form.watch('cowRate') || 0).toFixed(0)}</p>
                        <p className="text-sm font-black text-slate-900">B: ₹{Number(form.watch('buffaloRate') || 0).toFixed(0)}</p>
                    </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cowRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('cow')} (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} className="h-12 rounded-xl font-black text-center text-lg bg-slate-50 border-slate-200" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="buffaloRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('buffalo')} (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} className="h-12 rounded-xl font-black text-center text-lg bg-slate-50 border-slate-200" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">{t('effectiveFrom')}</FormLabel>
                <div className="grid grid-cols-2 gap-2">
                   <FormField
                    control={form.control}
                    name="month"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl bg-slate-50 font-black border-slate-200">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl font-bold">
                          {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl bg-slate-50 font-black border-slate-200">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl font-bold">
                          {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <DialogFooter className="flex-row gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={closeAll} className="flex-1 h-12 rounded-xl font-black text-slate-400 uppercase tracking-widest text-xs">
                  {t('cancel')}
                </Button>
                <Button type="submit" className="flex-[2] h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20">
                  {t('saveRate')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="rounded-3xl border-0 shadow-2xl">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center mb-4">
               <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <AlertDialogTitle className="text-xl font-black">{t('areYouSure')}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium">
              {t('rateUpdateConfirm').replace('{month}', displayMonth)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3">
            <AlertDialogCancel className="flex-1 h-12 rounded-xl font-black bg-slate-50 border-0">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmedSave} className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 font-black text-white shadow-lg shadow-primary/20">
              {t('proceed')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
