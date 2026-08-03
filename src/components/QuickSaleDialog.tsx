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
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAppContext } from "@/context/AppContext";
import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuickSalePaymentDialog } from "./QuickSalePaymentDialog";

interface QuickSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickSaleDialog({ open, onOpenChange }: QuickSaleDialogProps) {
  const { quickSaleCustomers, quickSaleEntries, quickSalePayments, addQuickSaleCustomer, addQuickSaleEntry, t } = useAppContext();
  const { toast } = useToast();
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null);

  const formSchema = z.object({
    customerId: z.string().optional(),
    newCustomerName: z.string().optional(),
    milkType: z.enum(["cow", "buffalo"]),
    quantity: z.coerce.number().min(0.01),
    rate: z.coerce.number().min(0),
    date: z.string(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      milkType: "cow",
      quantity: 1,
      rate: 60,
      date: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const customerId = form.watch('customerId');
  const quantity = form.watch('quantity');
  const rate = form.watch('rate');

  const previousDue = useMemo(() => {
    const id = isNewCustomer ? null : customerId;
    if (!id || id === 'new') return 0;
    const sales = quickSaleEntries.filter(e => e.customerId === id).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const payments = quickSalePayments.filter(p => p.customerId === id).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return sales - payments;
  }, [customerId, quickSaleEntries, quickSalePayments, isNewCustomer]);

  const currentSaleAmount = (Number(quantity) || 0) * (Number(rate) || 0);
  const currentTotalDue = previousDue + currentSaleAmount;

  useEffect(() => {
    if (customerId && customerId !== 'new' && !isNewCustomer) {
      const customer = quickSaleCustomers.find(c => c.id === customerId);
      if (customer) {
        form.setValue('milkType', customer.lastMilkType || 'cow');
        form.setValue('quantity', customer.lastQuantity || 1);
        form.setValue('rate', customer.lastRate || 60);
      }
    }
  }, [customerId, quickSaleCustomers, form, isNewCustomer]);

  useEffect(() => {
    if (open) {
      form.reset({
        customerId: "",
        newCustomerName: "",
        milkType: "cow",
        quantity: 1,
        rate: 60,
        date: format(new Date(), 'yyyy-MM-dd'),
      });
      setIsNewCustomer(false);
      setPaymentDialogOpen(false);
      setActiveCustomerId(null);
    }
  }, [open, form]);

  async function handleSaveSale(values: z.infer<typeof formSchema>) {
    let finalCustomerId = values.customerId;

    if (isNewCustomer && values.newCustomerName) {
      const newCust = addQuickSaleCustomer({ name: values.newCustomerName });
      finalCustomerId = newCust.id;
    }

    if (!finalCustomerId) {
      toast({ variant: "destructive", title: "Error", description: t('customerRequired') });
      return null;
    }

    addQuickSaleEntry({
      customerId: finalCustomerId,
      date: values.date,
      milkType: values.milkType,
      quantity: values.quantity,
      rate: values.rate,
      amount: (Number(values.quantity) || 0) * (Number(values.rate) || 0),
    });

    return finalCustomerId;
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const savedId = await handleSaveSale(values);
    if (savedId) {
      toast({ title: t('save'), description: t('leftoverSaleSuccess') });
      onOpenChange(false);
    }
  };

  const handleSettlePayment = async () => {
    const values = form.getValues();
    const savedId = await handleSaveSale(values);
    if (savedId) {
      setActiveCustomerId(savedId);
      // Close current dialog first to prevent body-lock overlap
      onOpenChange(false);
      // Wait for Radix to finish closing before opening next
      setTimeout(() => {
        setPaymentDialogOpen(true);
      }, 350);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-w-[95vw] rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2 bg-slate-50 border-b">
            <DialogTitle className="text-xl font-black text-slate-900">{t('quickSale')}</DialogTitle>
            <DialogDescription className="text-[10px] text-slate-500 font-medium">{t('addTodaysMilk')}</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('customerName')}</FormLabel>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsNewCustomer(!isNewCustomer)}
                    className="h-5 text-[8px] font-black uppercase text-primary hover:bg-primary/5"
                  >
                    {isNewCustomer ? t('selectQuickSaleCustomer') : t('newQuickSaleCustomer')}
                  </Button>
                </div>

                {isNewCustomer ? (
                  <FormField
                    control={form.control}
                    name="newCustomerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder={t('customerName')} {...field} className="h-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all font-bold text-sm" />
                        </FormControl>
                        <FormMessage className="text-[8px]" />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all font-bold text-sm">
                              <SelectValue placeholder={t('selectQuickSaleCustomer')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl border-slate-200">
                            {quickSaleCustomers.map(c => (
                              <SelectItem key={c.id} value={c.id} className="h-10 font-bold focus:bg-slate-50">
                                <div className="flex items-center gap-2">
                                  <User className="h-3.5 w-3.5 text-slate-400" />
                                  {c.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[8px]" />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {customerId && !isNewCustomer && (
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-black uppercase text-slate-400">{t('previousDue')}</span>
                  <span className={cn("text-xs font-black", previousDue > 0 ? "text-rose-600" : "text-emerald-600")}>₹{previousDue.toFixed(2)}</span>
                </div>
              )}

              <FormField
                control={form.control}
                name="milkType"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('milkType')}</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-2">
                        <FormItem className="flex-1">
                          <FormControl><RadioGroupItem value="cow" className="sr-only" /></FormControl>
                          <FormLabel className={cn(
                            "flex flex-col items-center justify-center h-10 rounded-xl border transition-all cursor-pointer font-black text-[10px] uppercase tracking-widest",
                            field.value === 'cow' ? "bg-primary border-primary text-white shadow-sm" : "bg-slate-50 border-slate-100 text-slate-400"
                          )}>
                            {t('cow')}
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex-1">
                          <FormControl><RadioGroupItem value="buffalo" className="sr-only" /></FormControl>
                          <FormLabel className={cn(
                            "flex flex-col items-center justify-center h-10 rounded-xl border transition-all cursor-pointer font-black text-[10px] uppercase tracking-widest",
                            field.value === 'buffalo' ? "bg-secondary border-secondary text-white shadow-sm" : "bg-slate-50 border-slate-100 text-slate-400"
                          )}>
                            {t('buffalo')}
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('quantityInLitre')}</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} value={field.value === 0 ? '' : field.value} placeholder="0" className="h-10 rounded-xl bg-slate-50 border-slate-200 text-center text-lg font-black" /></FormControl>
                      <FormMessage className="text-[8px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('ratePerLitre')}</FormLabel>
                      <FormControl><Input type="number" step="1" {...field} value={field.value === 0 ? '' : field.value} placeholder="0" className="h-10 rounded-xl bg-slate-50 border-slate-200 text-center text-lg font-black" /></FormControl>
                      <FormMessage className="text-[8px]" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-900 text-white text-center shadow-lg space-y-1">
                <div className="flex justify-between items-center opacity-60">
                   <p className="text-[8px] font-black uppercase tracking-widest">{t('currentSale')}</p>
                   <p className="text-[10px] font-bold">₹{currentSaleAmount.toFixed(2)}</p>
                </div>
                <div className="flex justify-between items-center border-t border-white/10 pt-1">
                   <p className="text-[9px] font-black uppercase tracking-widest">{t('currentBalance')}</p>
                   <p className="text-xl font-black">₹{currentTotalDue.toFixed(2)}</p>
                </div>
              </div>

              <DialogFooter className="flex-col gap-2 pt-2">
                <Button type="submit" className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs shadow-md">
                   {t('save')}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleSettlePayment}
                  className="w-full h-11 rounded-xl border-secondary text-secondary hover:bg-secondary/5 font-black uppercase tracking-widest text-xs"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  {t('recordPayment')}
                </Button>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="w-full h-8 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {t('cancel')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {activeCustomerId && (
        <QuickSalePaymentDialog 
            open={paymentDialogOpen} 
            onOpenChange={setPaymentDialogOpen} 
            customerId={activeCustomerId} 
        />
      )}
    </>
  );
}
