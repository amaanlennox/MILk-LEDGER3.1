"use client";

import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Farmer } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export function FarmerReminderCard({ farmer, date }: { farmer: Farmer, date?: Date }) {
    const { addOrUpdateFarmerEntry, getLatestPreviousFarmerQuantities, t } = useAppContext();
    const { toast } = useToast();
    const activeDate = date || new Date();
    const dateString = format(activeDate, 'yyyy-MM-dd');

    const [cowQuantity, setCowQuantity] = useState(0);
    const [buffaloQuantity, setBuffaloQuantity] = useState(0);
    const [isNoMilk, setIsNoMilk] = useState(false);
    
    useEffect(() => {
        // AUTO-FILL FROM PREVIOUS
        const prev = getLatestPreviousFarmerQuantities(farmer.id, dateString);
        if (prev) {
            setCowQuantity(prev.cow);
            setBuffaloQuantity(prev.buffalo);
        } else {
            const milkTypes = farmer.milkTypes || [];
            setCowQuantity(milkTypes.includes('cow') ? (farmer.defaultCowQuantity ?? 0) : 0);
            setBuffaloQuantity(milkTypes.includes('buffalo') ? (farmer.defaultBuffaloQuantity ?? 0) : 0);
        }
        setIsNoMilk(false);
    }, [farmer, dateString, getLatestPreviousFarmerQuantities]);

    const handleSave = () => {
        addOrUpdateFarmerEntry({
            farmerId: farmer.id,
            date: dateString,
            cowQuantity: isNoMilk ? 0 : cowQuantity,
            cowRate: farmer.cowRate || 0,
            buffaloQuantity: isNoMilk ? 0 : buffaloQuantity,
            buffaloRate: farmer.buffaloRate || 0,
        });
        toast({
            title: t('save'),
            description: `Entry for ${farmer.name} saved.`,
        });
    };

    return (
        <Card className="h-28 bg-slate-50 border-slate-100 flex flex-col justify-between overflow-hidden shadow-sm">
            <div className="px-3 py-1.5 bg-slate-100/50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-[11px] font-black truncate max-w-[150px] text-slate-900">{farmer.name}</h3>
                <div className="flex items-center space-x-1.5">
                    <Checkbox id={`rem-zero-farmer-${farmer.id}`} checked={isNoMilk} onCheckedChange={(checked) => setIsNoMilk(!!checked)} className="h-3 w-3 border-slate-300" />
                    <Label htmlFor={`rem-zero-farmer-${farmer.id}`} className="text-[9px] font-black uppercase text-slate-400">
                        {t('noMilk')}
                    </Label>
                </div>
            </div>
            <div className="px-3 py-1 flex items-center justify-around gap-4 flex-1">
                {(farmer.milkTypes || []).includes('cow') && (
                    <div className="flex flex-col items-center">
                        <Label className="text-[8px] font-black uppercase text-primary/60 mb-0.5">{t('cow')}</Label>
                        <div className="flex items-center">
                            <Input 
                                type="number" 
                                step="0.01"
                                value={isNoMilk || cowQuantity === 0 ? '' : cowQuantity} 
                                placeholder="0"
                                onChange={(e) => setCowQuantity(parseFloat(e.target.value) || 0)} 
                                className="w-14 h-7 text-xs text-center font-black p-0 rounded-lg bg-white border-slate-200 text-slate-900 focus:ring-primary/30"
                                disabled={isNoMilk}
                            />
                            <span className="text-[10px] ml-1 font-bold text-slate-300">L</span>
                        </div>
                    </div>
                )}
                {(farmer.milkTypes || []).includes('buffalo') && (
                    <div className="flex flex-col items-center">
                        <Label className="text-[8px] font-black uppercase text-primary/60 mb-0.5">{t('buffalo')}</Label>
                        <div className="flex items-center">
                            <Input 
                                type="number" 
                                step="0.01"
                                value={isNoMilk || buffaloQuantity === 0 ? '' : buffaloQuantity} 
                                placeholder="0"
                                onChange={(e) => setBuffaloQuantity(parseFloat(e.target.value) || 0)} 
                                className="w-14 h-7 text-xs text-center font-black p-0 rounded-lg bg-white border-slate-200 text-slate-900 focus:ring-primary/30"
                                disabled={isNoMilk}
                            />
                            <span className="text-[10px] ml-1 font-bold text-slate-300">L</span>
                        </div>
                    </div>
                )}
                <Button onClick={handleSave} size="sm" className="h-8 px-4 text-[10px] font-black rounded-xl shadow-md bg-secondary text-white hover:bg-secondary/90 transition-transform active:scale-95">
                    {t('save')}
                </Button>
            </div>
        </Card>
    )
}
