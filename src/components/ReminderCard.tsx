"use client";

import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Customer } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export function ReminderCard({ customer, date }: { customer: Customer, date?: Date }) {
    const { addOrUpdateEntry, getLatestPreviousQuantities, t } = useAppContext();
    const { toast } = useToast();
    const activeDate = date || new Date();
    const dateString = format(activeDate, 'yyyy-MM-dd');

    const [cowQuantity, setCowQuantity] = useState(0);
    const [buffaloQuantity, setBuffaloQuantity] = useState(0);
    const [isNoMilk, setIsNoMilk] = useState(false);
    
    useEffect(() => {
        // AUTO-FILL FROM PREVIOUS
        const prev = getLatestPreviousQuantities(customer.id, dateString);
        if (prev) {
            setCowQuantity(prev.cow);
            setBuffaloQuantity(prev.buffalo);
        } else {
            const milkTypes = customer.milkTypes || [];
            setCowQuantity(milkTypes.includes('cow') ? (customer.defaultCowQuantity ?? 0) : 0);
            setBuffaloQuantity(milkTypes.includes('buffalo') ? (customer.defaultBuffaloQuantity ?? 0) : 0);
        }
        setIsNoMilk(false);
    }, [customer, dateString, getLatestPreviousQuantities]);

    const handleSave = () => {
        addOrUpdateEntry({
            customerId: customer.id,
            date: dateString,
            cowQuantity: isNoMilk ? 0 : cowQuantity,
            cowRate: customer.cowRate || 0,
            buffaloQuantity: isNoMilk ? 0 : buffaloQuantity,
            buffaloRate: customer.buffaloRate || 0,
        });
        toast({
            title: t('save'),
            description: `Entry for ${customer.name} saved.`,
        });
    };

    return (
        <Card className="h-20 bg-slate-50 rounded-xl border-slate-100 flex flex-col justify-between overflow-hidden shadow-sm">
            <div className="px-2.5 py-1 bg-slate-100/50 flex justify-between items-center border-b border-slate-100">
                <h3 className="text-[10px] font-black text-slate-900 truncate max-w-[120px]">{customer.name}</h3>
                <div className="flex items-center gap-1.5">
                    <Checkbox id={`rem-check-${customer.id}`} checked={isNoMilk} onCheckedChange={(val) => setIsNoMilk(!!val)} className="h-3 w-3 border-slate-300" />
                    <Label htmlFor={`rem-check-${customer.id}`} className="text-[8px] font-black text-slate-400 uppercase">{t('noMilk')}</Label>
                </div>
            </div>
            <div className="p-2 flex items-center justify-around gap-2">
                {(customer.milkTypes || []).includes('cow') && (
                    <div className="flex items-center gap-1">
                        <span className="text-[9px] font-black text-primary/60 uppercase">C</span>
                        <Input 
                            type="number" 
                            step="0.01" 
                            value={isNoMilk || cowQuantity === 0 ? '' : cowQuantity} 
                            placeholder="0"
                            onChange={(e) => setCowQuantity(parseFloat(e.target.value) || 0)} 
                            className="h-6 w-10 text-[10px] p-0 text-center font-black bg-white border-slate-200 text-slate-900" 
                            disabled={isNoMilk} 
                        />
                    </div>
                )}
                {(customer.milkTypes || []).includes('buffalo') && (
                    <div className="flex items-center gap-1">
                        <span className="text-[9px] font-black text-primary/60 uppercase">B</span>
                        <Input 
                            type="number" 
                            step="0.01" 
                            value={isNoMilk || buffaloQuantity === 0 ? '' : buffaloQuantity} 
                            placeholder="0"
                            onChange={(e) => setBuffaloQuantity(parseFloat(e.target.value) || 0)} 
                            className="h-6 w-10 text-[10px] p-0 text-center font-black bg-white border-slate-200 text-slate-900" 
                            disabled={isNoMilk} 
                        />
                    </div>
                )}
                <Button onClick={handleSave} size="sm" className="h-7 px-3 text-[9px] font-black rounded-lg bg-primary text-white hover:bg-primary/90">
                    {t('save')}
                </Button>
            </div>
        </Card>
    )
}
