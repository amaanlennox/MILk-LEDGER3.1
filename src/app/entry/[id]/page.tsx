
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Home, ChevronLeft } from "lucide-react";
import { format } from "date-fns";

export default function DailyEntryPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { getCustomerById, addOrUpdateEntry, t } = useAppContext();
  const { toast } = useToast();
  
  const customer = getCustomerById(id);

  const [total, setTotal] = useState(0);

  const formSchema = z.object({
    quantity: z.coerce.number().min(0.1, { message: t('quantityRequired') }),
    rate: z.coerce.number().min(0),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: 1,
      rate: 0,
    },
  });

  const quantity = form.watch("quantity");
  const rate = form.watch("rate");

  useEffect(() => {
    setTotal(quantity * rate);
  }, [quantity, rate]);

  useEffect(() => {
    if (customer) {
        form.reset({
            quantity: customer.defaultCowQuantity || customer.defaultBuffaloQuantity || 1,
            rate: customer.cowRate || customer.buffaloRate || 0,
        });
    }
  }, [customer, form]);

  if (!customer) {
    return (
      <div className="container mx-auto p-8 text-center">
        <p>{t('customers')} not found.</p>
        <Link href="/" className="mt-4 inline-block">
          <Button>{t('backToHome')}</Button>
        </Link>
      </div>
    );
  }
  
  function onSubmit(values: z.infer<typeof formSchema>) {
    const isCow = customer!.milkTypes.includes('cow');
    const isBuffalo = customer!.milkTypes.includes('buffalo');

    addOrUpdateEntry({
      customerId: customer!.id,
      date: format(new Date(), 'yyyy-MM-dd'),
      cowQuantity: isCow ? values.quantity : 0,
      cowRate: isCow ? values.rate : 0,
      buffaloQuantity: isBuffalo ? values.quantity : 0,
      buffaloRate: isBuffalo ? values.rate : 0,
    });
    toast({
      title: "Entry Saved",
      description: `Saved ${values.quantity}L for ${customer!.name}.`,
    });
    router.push("/");
  }
  
  const [currentDate, setCurrentDate] = useState('');
  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString(t('language') === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  }, [t]);

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-2xl">
        <Link href="/" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2 mb-2">
            <ChevronLeft className="w-4 h-4"/> {t('backToHome')}
        </Link>
        <h1 className="text-3xl font-bold mb-6">{t('dailyEntry')} for {customer.name}</h1>
        <Card>
            <CardHeader>
                <CardTitle>{currentDate}</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-lg">{t('quantityInLitre')}</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.1" {...field} className="h-14 text-2xl"/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="rate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-lg">{t('ratePerLitre')}</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} className="h-14 text-2xl"/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="text-center p-6 bg-secondary rounded-lg">
                            <p className="text-lg text-muted-foreground">{t('amount')}</p>
                            <p className="text-5xl font-bold">₹{total.toFixed(2)}</p>
                        </div>
                        <Button type="submit" size="lg" className="w-full h-14 text-xl">{t('save')}</Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    </div>
  )
}
