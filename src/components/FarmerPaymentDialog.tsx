
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
import type { FarmerPayment } from "@/lib/types";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { format, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight } from "lucide-react";

interface FarmerPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: FarmerPayment | null;
  farmerId: string;
  date: Date;
}

export function FarmerPaymentDialog({ open, onOpenChange, payment, farmerId, date }: FarmerPaymentDialogProps) {
  const { addFarmerPayment, updateFarmerPayment, t } = useAppContext();
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

  useEffect(() => {
    if (open) {
      if (payment) {
        form.reset({
          amount: payment.amount,
          note: payment.note ?? "",
          date: new Date(payment.date),
        });
      } else {
        form.reset({
          amount: 0,
          note: "",
          date: date,
        });
      }
    }
  }, [payment, open, form, date]);

  const handleDateChange = (days: number) => {
    const currentDate = form.getValues('date');
    form.setValue('date', addDays(currentDate, days));
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    const paymentData = {
      farmerId,
      amount: values.amount,
      date: format(values.date, 'yyyy-MM-dd'),
      note: values.note,
    };

    if (payment) {
      updateFarmerPayment({ ...payment, ...paymentData });
      toast({ title: t('updatePaymentSuccess') });
    } else {
      addFarmerPayment(paymentData as Omit<FarmerPayment, 'id'>);
      toast({ title: t('addPaymentSuccess') });
    }
    onOpenChange(false);
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-3xl">{payment ? t('editPayment') : t('addPayment')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('paymentAmount')}</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-center block">{t('paymentDate')}</FormLabel>
                        <div className="flex items-center justify-center gap-4 pt-2">
                            <Button variant="outline" size="icon" type="button" onClick={() => handleDateChange(-1)}>
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <span className="font-medium text-lg text-center w-40">{field.value ? format(field.value, "PPP") : ''}</span>
                            <Button variant="outline" size="icon" type="button" onClick={() => handleDateChange(1)}>
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('paymentNote')}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t('paymentNotePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
