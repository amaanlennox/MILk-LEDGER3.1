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
import type { Customer, ProductType } from "@/lib/types";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

interface ProductEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
  productType: ProductType;
}

export function ProductEntryDialog({ open, onOpenChange, customer, productType }: ProductEntryDialogProps) {
  const { addOrUpdateProductEntry, t } = useAppContext();
  const { toast } = useToast();

  const formSchema = z.object({
    quantity: z.coerce.number().min(0.01, { message: t('quantityRequired') }),
    rate: z.coerce.number().min(0),
    price: z.coerce.number().min(0.01, { message: t('priceRequired') }),
    paidAmount: z.coerce.number().min(0),
    paymentStatus: z.enum(["full", "partial", "none"]),
    date: z.date(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: 1,
      rate: 160,
      price: 160,
      paidAmount: 160,
      paymentStatus: "full",
      date: new Date(),
    },
  });

  const quantity = form.watch("quantity");
  const rate = form.watch("rate");
  const price = form.watch("price");
  const paymentStatus = form.watch("paymentStatus");
  const paidAmount = form.watch("paidAmount");

  // Auto-calculate Total Price when qty or rate changes
  useEffect(() => {
    const total = (Number(quantity) || 0) * (Number(rate) || 0);
    form.setValue("price", total);
  }, [quantity, rate, form]);

  // Handle Payment Status changes
  useEffect(() => {
    if (paymentStatus === "full") {
      form.setValue("paidAmount", price);
    } else if (paymentStatus === "none") {
      form.setValue("paidAmount", 0);
    }
  }, [paymentStatus, price, form]);

  const remainingBalance = price - paidAmount;

  useEffect(() => {
    if (open) {
      form.reset({
        quantity: 1,
        rate: productType === 'paneer' ? 160 : 600,
        price: productType === 'paneer' ? 160 : 600,
        paidAmount: productType === 'paneer' ? 160 : 600,
        paymentStatus: "full",
        date: new Date(),
      });
    }
  }, [open, form, productType]);
  
  const handleDateChange = (days: number) => {
    const currentDate = form.getValues('date');
    form.setValue('date', addDays(currentDate, days));
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    addOrUpdateProductEntry({
      customerId: customer.id,
      productType,
      quantity: values.quantity,
      price: values.price,
      paidAmount: values.paidAmount,
      date: format(values.date, 'yyyy-MM-dd'),
    });
    toast({ 
      title: t('save'), 
      description: `${t(productType)} entry for ${customer.name} saved.`
    });
    onOpenChange(false);
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-[95vw] rounded-3xl overflow-hidden p-0 shadow-2xl">
        <DialogHeader className="p-6 pb-4 bg-slate-50 border-b">
          <DialogTitle className="text-2xl font-black text-slate-900 capitalize">{t(productType)} {t('productEntry')}</DialogTitle>
          <DialogDescription className="text-sm font-bold text-slate-500">{customer.name}</DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('quantityInKg')}</FormLabel>
                      <FormControl>
                        <Input 
                            type="number" 
                            step="0.01" 
                            {...field} 
                            className="h-12 rounded-xl font-black text-center text-lg bg-slate-50 border-slate-200"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('rate')} (₹)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="1" 
                          {...field}
                          className="h-12 rounded-xl font-black text-center text-lg bg-slate-50 border-slate-200"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
            </div>

            <div className="bg-slate-900 rounded-2xl p-4 text-white flex justify-between items-center shadow-lg">
                <div>
                   <p className="text-[8px] font-black uppercase tracking-widest text-white/40">{t('totalAmount')}</p>
                   <p className="text-2xl font-black">₹{price.toFixed(0)}</p>
                </div>
                <div className="text-right">
                   <p className="text-[8px] font-black uppercase tracking-widest text-white/40">{t('remainingDue')}</p>
                   <p className={cn("text-2xl font-black", remainingBalance <= 0 ? "text-emerald-400" : "text-rose-400")}>
                      ₹{Math.abs(remainingBalance).toFixed(0)}
                      {remainingBalance < 0 && <span className="text-[10px] ml-1 text-emerald-400/60 uppercase">({t('advanceAmount')})</span>}
                   </p>
                </div>
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest block text-center">{t('paymentStatus')}</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-3 gap-2">
                        {[
                          { value: "full", label: t('paidFull'), color: "bg-emerald-50 text-emerald-600 border-emerald-100", active: "bg-emerald-500 text-white border-emerald-500" },
                          { value: "partial", label: t('paidPartial'), color: "bg-amber-50 text-amber-600 border-amber-100", active: "bg-amber-500 text-white border-amber-500" },
                          { value: "none", label: t('notPaid'), color: "bg-slate-50 text-slate-600 border-slate-100", active: "bg-slate-900 text-white border-slate-900" }
                        ].map(status => (
                          <div key={status.value}>
                             <RadioGroupItem value={status.value} id={status.value} className="sr-only" />
                             <label 
                                htmlFor={status.value}
                                className={cn(
                                    "flex items-center justify-center h-10 rounded-xl border text-[10px] font-black uppercase tracking-tighter cursor-pointer transition-all",
                                    field.value === status.value ? status.active : status.color
                                )}
                             >
                                {status.label}
                             </label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              {paymentStatus !== "none" && (
                  <FormField
                    control={form.control}
                    name="paidAmount"
                    render={({ field }) => (
                      <FormItem className="animate-in slide-in-from-top-2 duration-300">
                        <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('paidAmount')} (₹)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">₹</span>
                            <Input 
                              type="number" 
                              step="1" 
                              {...field}
                              className="h-12 pl-8 rounded-xl font-black text-lg bg-slate-50 border-slate-200"
                            />
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
              )}
            </div>

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center block mb-2">{t('date')}</FormLabel>
                  <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl border-2 bg-slate-50">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        type="button" 
                        onClick={() => handleDateChange(-1)}
                        className="h-8 w-8 rounded-lg"
                      >
                          <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                        <span className="font-black text-sm">{field.value ? format(field.value, "dd MMM yyyy") : ''}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        type="button" 
                        onClick={() => handleDateChange(1)}
                        className="h-8 w-8 rounded-lg"
                        disabled={format(field.value, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')}
                      >
                          <ChevronRight className="h-4 w-4" />
                      </Button>
                  </div>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <DialogFooter className="flex-row gap-3 pt-2">
              <Button type="button" variant="ghost" size="default" onClick={() => onOpenChange(false)} className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-xs text-slate-400">
                {t('cancel')}
              </Button>
              <Button type="submit" size="default" className="flex-[2] h-12 rounded-xl font-black shadow-xl bg-primary hover:bg-primary/90 text-white uppercase tracking-widest text-xs">
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
