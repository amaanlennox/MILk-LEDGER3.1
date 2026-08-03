
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAppContext } from "@/context/AppContext";
import type { Customer, MilkType } from "@/lib/types";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "./ui/checkbox";
import { useRouter } from "next/navigation";

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
}

const milkTypes: { id: MilkType; label: string }[] = [
    { id: 'cow', label: 'Cow Milk' },
    { id: 'buffalo', label: 'Buffalo Milk' },
];

export function CustomerDialog({ open, onOpenChange, customer }: CustomerDialogProps) {
  const { addCustomer, updateCustomer, t } = useAppContext();
  const { toast } = useToast();
  const router = useRouter();

  const formSchema = z.object({
    name: z.string().min(1, { message: t('customerRequired') }),
    milkTypes: z.array(z.string()).refine(value => value.some(v => v), { message: t('milkTypeRequired') }),
    cowRate: z.coerce.number().min(0),
    buffaloRate: z.coerce.number().min(0),
    defaultCowQuantity: z.coerce.number().min(0).optional(),
    defaultBuffaloQuantity: z.coerce.number().min(0).optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      milkTypes: ['cow'],
      cowRate: 0,
      buffaloRate: 0,
      defaultCowQuantity: 1,
      defaultBuffaloQuantity: 1,
    },
  });

  useEffect(() => {
    if (open) {
      if (customer) {
        form.reset({
          name: customer.name,
          milkTypes: customer.milkTypes ?? ['cow'],
          cowRate: customer.cowRate ?? 0,
          buffaloRate: customer.buffaloRate ?? 0,
          defaultCowQuantity: customer.defaultCowQuantity ?? 1,
          defaultBuffaloQuantity: customer.defaultBuffaloQuantity ?? 1,
        });
      } else {
        form.reset({
          name: "",
          milkTypes: ['cow'],
          cowRate: 50,
          buffaloRate: 60,
          defaultCowQuantity: 1,
          defaultBuffaloQuantity: 1,
        });
      }
    }
  }, [customer, open, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    const customerData = {
      ...values,
      milkTypes: values.milkTypes as MilkType[],
      defaultCowQuantity: values.defaultCowQuantity,
      defaultBuffaloQuantity: values.defaultBuffaloQuantity,
    };

    if (customer) {
      updateCustomer({ ...customer, ...customerData });
      toast({ title: t('save'), description: `${values.name} data updated.`});
    } else {
      addCustomer(customerData);
      toast({ title: t('save'), description: `${values.name} added.`});
    }
    onOpenChange(false);
  }
  
  const watchedMilkTypes = form.watch('milkTypes');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl">{customer ? t('editCustomer') : t('addCustomer')}</DialogTitle>
          <DialogDescription className="text-base">
            {t('customerManagement')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('customerName')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('customerName')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
                control={form.control}
                name="milkTypes"
                render={() => (
                    <FormItem>
                    <div className="mb-4">
                        <FormLabel className="text-lg">{t('milkType')}</FormLabel>
                        <FormDescription>{t('selectMilkTypes')}</FormDescription>
                    </div>
                    {milkTypes.map((item) => (
                        <FormField
                        key={item.id}
                        control={form.control}
                        name="milkTypes"
                        render={({ field }) => {
                            return (
                            <FormItem
                                key={item.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                            >
                                <FormControl>
                                <Checkbox
                                    checked={(field.value || []).includes(item.id)}
                                    onCheckedChange={(checked) => {
                                    return checked
                                        ? field.onChange([...(field.value || []), item.id])
                                        : field.onChange(
                                            (field.value || []).filter(
                                            (value) => value !== item.id
                                            )
                                        )
                                    }}
                                />
                                </FormControl>
                                <FormLabel className="font-normal capitalize text-base">
                                    {t(item.id as 'cow' | 'buffalo')}
                                </FormLabel>
                            </FormItem>
                            )
                        }}
                        />
                    ))}
                    <FormMessage />
                    </FormItem>
                )}
                />

            {(watchedMilkTypes || []).includes('cow') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="cowRate"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('cowRatePerLitre')}</FormLabel>
                        <FormControl>
                            <Input type="number" step="0.01" placeholder="50" {...field} value={field.value ?? 0} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="defaultCowQuantity"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('defaultCowQuantity')}</FormLabel>
                        <FormControl>
                            <Input type="number" step="0.1" placeholder="1" {...field} value={field.value ?? 0}/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                </div>
            )}

            {(watchedMilkTypes || []).includes('buffalo') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="buffaloRate"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('buffaloRatePerLitre')}</FormLabel>
                        <FormControl>
                            <Input type="number" step="0.01" placeholder="60" {...field} value={field.value ?? 0} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="defaultBuffaloQuantity"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('defaultBuffaloQuantity')}</FormLabel>
                        <FormControl>
                            <Input type="number" step="0.1" placeholder="1" {...field} value={field.value ?? 0} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                </div>
            )}

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
