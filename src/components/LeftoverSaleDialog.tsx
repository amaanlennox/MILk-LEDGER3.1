
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
import { useAppContext } from "@/context/AppContext";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "@/components/ui/label";

interface LeftoverSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
}

export function LeftoverSaleDialog({ open, onOpenChange, date }: LeftoverSaleDialogProps) {
  const { addLeftoverSale, t } = useAppContext();
  const { toast } = useToast();

  const formSchema = z.object({
    milkType: z.enum(["cow", "buffalo"], { required_error: t('milkTypeRequired')}),
    quantity: z.coerce.number().min(0.01, { message: t('quantityRequired') }),
    total: z.coerce.number().min(0.01, { message: t('priceRequired') }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      milkType: "cow",
      quantity: 1,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        milkType: "cow",
        quantity: 1,
        total: undefined,
      });
    }
  }, [open, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    const finalRate = values.quantity > 0 ? (values.total / values.quantity) : 0;

    addLeftoverSale({
      milkType: values.milkType,
      quantity: values.quantity,
      rate: finalRate,
      total: values.total,
      buyer: t('buyerNamePlaceholder'), // Default buyer
      date: format(date, 'yyyy-MM-dd'),
    });
    toast({ title: t('save'), description: t('leftoverSaleSuccess') });
    onOpenChange(false);
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl">{t('addLeftoverSale')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            
            <FormField
              control={form.control}
              name="milkType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>{t('milkType')}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="cow" />
                        </FormControl>
                        <FormLabel className="font-normal">{t('cow')}</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="buffalo" />
                        </FormControl>
                        <FormLabel className="font-normal">{t('buffalo')}</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('quantityInLitre')}</FormLabel>
                        <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="total"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('totalAmount')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            value={field.value ?? ''}
                            onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
            <div className="space-y-1">
                <Label>{t('date')}</Label>
                <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-muted px-3 py-2 text-sm">
                    {format(date, "PPP")}
                </div>
            </div>


            <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-4">
              <Button type="submit" size="lg" className="w-full sm:w-auto">{t('save')}</Button>
              <Button type="button" variant="outline" size="lg" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                {t('cancel')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
