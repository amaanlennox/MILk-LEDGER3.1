
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
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, addDays } from 'date-fns';

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
    price: z.coerce.number().min(0.01, { message: t('priceRequired') }),
    date: z.date(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: 0.5,
      price: 0,
      date: new Date(),
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        quantity: 0.5,
        price: 0,
        date: new Date(),
      });
    }
  }, [open, form]);
  
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
      <DialogContent className="sm:max-w-md max-w-[90vw] rounded-2xl overflow-hidden p-0">
        <DialogHeader className="p-6 pb-4 bg-secondary/5 border-b">
          <DialogTitle className="text-2xl font-black text-secondary capitalize">{t(productType)} {t('productEntry')}</DialogTitle>
          <DialogDescription className="text-sm font-bold text-muted-foreground">{customer.name}</DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-muted-foreground">{t('quantityInKg')}</FormLabel>
                      <FormControl>
                        <Input 
                            type="number" 
                            step="0.01" 
                            {...field} 
                            className="h-10 rounded-xl font-bold text-center"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-muted-foreground">{t('totalPrice')} (₹)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0"
                          {...field}
                          className="h-10 rounded-xl font-bold text-center"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
            </div>

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase text-muted-foreground text-center block mb-2">{t('date')}</FormLabel>
                  <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl border-2 bg-muted/20">
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
                        <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
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

            <DialogFooter className="flex-row gap-2 pt-2">
              <Button type="button" variant="outline" size="default" onClick={() => onOpenChange(false)} className="flex-1 rounded-xl font-bold border-2">
                {t('cancel')}
              </Button>
              <Button type="submit" size="default" className="flex-1 rounded-xl font-black shadow-md">
                {t('save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
