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
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAppContext } from "@/context/AppContext";
import { useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { format, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickSalePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
}

export function QuickSalePaymentDialog({ open, onOpenChange, customerId }: QuickSalePaymentDialogProps) {
  const { addQuickSalePayment, quickSaleEntries, quickSalePayments, t } = useAppContext();
  const { toast } = useToast();

  const formSchema = z.object({
    amount: z.coerce.number().min(0.01, { message: "Amount must be greater than 0" }),
    note: z.string().optional(),
    date: z.date(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      note: "",
      date: new Date(),
    },
  });

  const receivedAmount = form.watch('amount');

  // Calculate Current Due
  const currentDue = useMemo(() => {
    const sales = quickSaleEntries.filter(e => e.customerId === customerId).reduce((sum, e) => sum + e.amount, 0);
    const payments = quickSalePayments.filter(p => p.customerId === customerId).reduce((sum, p) => sum + p.amount, 0);
    return sales - payments;
  }, [customerId, quickSaleEntries, quickSalePayments]);

  const remainingDue = Math.max(0, currentDue - receivedAmount);

  useEffect(() => {
    if (open) {
      form.reset({
        amount: currentDue > 0 ? currentDue : 0,
        note: "",
        date: new Date(),
      });
    }
  }, [open, form, currentDue]);

  const handleDateChange = (days: number) => {
    const currentDate = form.getValues('date');
    form.setValue('date', addDays(currentDate, days));
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    addQuickSalePayment({
      customerId,
      amount: values.amount,
      date: format(values.date, 'yyyy-MM-dd'),
      note: values.note,
    });
    toast({ title: t('addPaymentSuccess') });
    onOpenChange(false);
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-4 pb-2 bg-slate-50 border-b">
          <DialogTitle className="text-xl font-black text-slate-900">{t('recordPayment')}</DialogTitle>
        </DialogHeader>

        <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest opacity-50">{t('currentBalance')}</p>
              <p className="text-xl font-black">₹{currentDue.toFixed(0)}</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black uppercase tracking-widest opacity-50">{t('balance')}</p>
              <p className={cn("text-xl font-black", remainingDue === 0 ? "text-emerald-400" : "text-white")}>
                ₹{remainingDue.toFixed(0)}
              </p>
            </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('paymentAmount')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-400">₹</span>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} className="h-10 pl-7 rounded-xl bg-slate-50 border-slate-200 text-lg font-black focus:bg-white transition-all" />
                    </div>
                  </FormControl>
                  <FormMessage className="text-[8px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-center block mb-1">{t('paymentDate')}</FormLabel>
                  <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl border-2 bg-slate-50">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        type="button" 
                        onClick={() => handleDateChange(-1)}
                        className="h-8 w-8 rounded-lg hover:bg-white"
                      >
                          <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                        <span className="font-black text-xs">{field.value ? format(field.value, "dd MMM yyyy") : ''}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        type="button" 
                        onClick={() => handleDateChange(1)}
                        className="h-8 w-8 rounded-lg hover:bg-white"
                        disabled={format(field.value, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')}
                      >
                          <ChevronRight className="h-4 w-4" />
                      </Button>
                  </div>
                  <FormMessage className="text-[8px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('paymentNote')}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t('paymentNotePlaceholder_QS')} {...field} className="rounded-xl bg-slate-50 border-slate-200 font-medium min-h-[60px] text-xs focus:bg-white transition-all" />
                  </FormControl>
                  <FormMessage className="text-[8px]" />
                </FormItem>
              )}
            />

            <DialogFooter className="flex-row gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="flex-1 h-10 rounded-xl font-black text-slate-500 uppercase tracking-widest text-[10px]">
                {t('cancel')}
              </Button>
              <Button type="submit" className="flex-1 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-[10px] shadow-xl transition-all active:scale-95">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {t('save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
