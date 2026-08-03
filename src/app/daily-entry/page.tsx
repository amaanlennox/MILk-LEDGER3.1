"use client";

import { useState, useEffect, Suspense } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, CheckCircle, Home, Zap, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Customer, Farmer } from '@/lib/types';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LeftoverSaleDialog } from '@/components/LeftoverSaleDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { FarmerPaymentDialog } from '@/components/FarmerPaymentDialog';

function CustomerEntryCard({ customer, date }: { customer: Customer, date: Date }) {
    const { getEntry, addOrUpdateEntry, t } = useAppContext();
    const { toast } = useToast();
    const dateString = format(date, 'yyyy-MM-dd');

    const [cowQuantity, setCowQuantity] = useState(0);
    const [buffaloQuantity, setBuffaloQuantity] = useState(0);
    const [isNoMilk, setIsNoMilk] = useState(false);
    
    const existingEntry = getEntry(customer.id, dateString);

    useEffect(() => {
        const entry = getEntry(customer.id, dateString);
        if (entry) {
            setCowQuantity(entry.cowQuantity ?? 0);
            setBuffaloQuantity(entry.buffaloQuantity ?? 0);
        } else {
            const milkTypes = customer.milkTypes || [];
            setCowQuantity(milkTypes.includes('cow') ? (customer.defaultCowQuantity ?? 0) : 0);
            setBuffaloQuantity(milkTypes.includes('buffalo') ? (customer.defaultBuffaloQuantity ?? 0) : 0);
            setIsNoMilk(false);
        }
    }, [dateString, customer, getEntry]);

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

    const total = (isNoMilk ? 0 : (cowQuantity * customer.cowRate + buffaloQuantity * customer.buffaloRate));

    return (
        <Card className="overflow-hidden glass-card h-full flex flex-col rounded-xl transition-all border-slate-100 hover:border-primary/20">
            <CardHeader className="flex-row items-center justify-between p-3 border-b border-slate-50 bg-slate-50/50">
                <CardTitle className="text-xs font-black truncate text-slate-900">{customer.name}</CardTitle>
                {existingEntry && <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />}
            </CardHeader>
            <CardContent className="p-3 flex-1 space-y-3">
                {(customer.milkTypes || []).includes('cow') && (
                    <div className="flex items-center justify-between gap-2">
                        <Label className="text-[9px] font-black text-secondary uppercase tracking-wider">{t('cow')}</Label>
                        <Input 
                            type="number" 
                            step="0.01"
                            value={isNoMilk || cowQuantity === 0 ? '' : cowQuantity} 
                            placeholder="0"
                            onChange={(e) => setCowQuantity(parseFloat(e.target.value) || 0)} 
                            className="h-8 w-16 text-center text-xs font-black bg-slate-50 border-slate-200 rounded-lg"
                            disabled={isNoMilk}
                        />
                    </div>
                )}
                {(customer.milkTypes || []).includes('buffalo') && (
                    <div className="flex items-center justify-between gap-2">
                        <Label className="text-[9px] font-black text-secondary uppercase tracking-wider">{t('buffalo')}</Label>
                        <Input 
                            type="number" 
                            step="0.01"
                            value={isNoMilk || buffaloQuantity === 0 ? '' : buffaloQuantity} 
                            placeholder="0"
                            onChange={(e) => setBuffaloQuantity(parseFloat(e.target.value) || 0)} 
                            className="h-8 w-16 text-center text-xs font-black bg-slate-50 border-slate-200 rounded-lg"
                            disabled={isNoMilk}
                        />
                    </div>
                )}
                <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 border-dashed">
                    <Checkbox 
                        id={`no-milk-${customer.id}`} 
                        checked={isNoMilk} 
                        onCheckedChange={(checked) => setIsNoMilk(!!checked)} 
                        className="h-3.5 w-3.5"
                    />
                    <Label htmlFor={`no-milk-${customer.id}`} className="text-[9px] font-bold text-slate-400">{t('noMilk')}</Label>
                </div>
            </CardContent>
            <CardFooter className="bg-slate-50/30 p-2 border-t border-slate-50 flex items-center justify-between">
                <div className="text-[10px] font-black text-primary">₹{total.toFixed(2)}</div>
                <Button onClick={handleSave} size="sm" className="h-7 px-3 text-[9px] font-black rounded-lg">
                    {t('save')}
                </Button>
            </CardFooter>
        </Card>
    );
}

function FarmerPurchaseCard({ farmer, date }: { farmer: Farmer, date: Date }) {
    const { getFarmerEntry, addOrUpdateFarmerEntry, t } = useAppContext();
    const { toast } = useToast();
    const dateString = format(date, 'yyyy-MM-dd');

    const [cowQuantity, setCowQuantity] = useState(0);
    const [buffaloQuantity, setBuffaloQuantity] = useState(0);
    const [isNoMilk, setIsNoMilk] = useState(false);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    
    const existingEntry = getFarmerEntry(farmer.id, dateString);

    useEffect(() => {
        const entry = getFarmerEntry(farmer.id, dateString);
        if (entry) {
            setCowQuantity(entry.cowQuantity ?? 0);
            setBuffaloQuantity(entry.buffaloQuantity ?? 0);
        } else {
            const milkTypes = farmer.milkTypes || [];
            setCowQuantity(milkTypes.includes('cow') ? (farmer.defaultCowQuantity ?? 0) : 0);
            setBuffaloQuantity(milkTypes.includes('buffalo') ? (farmer.defaultBuffaloQuantity ?? 0) : 0);
            setIsNoMilk(false);
        }
    }, [dateString, farmer, getFarmerEntry]);

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
            description: `Purchase entry for ${farmer.name} saved.`,
        });
    };

    const total = (isNoMilk ? 0 : (cowQuantity * farmer.cowRate + buffaloQuantity * farmer.buffaloRate));

    return (
        <>
            <Card className="overflow-hidden glass-card h-full flex flex-col rounded-xl transition-all border-slate-100 hover:border-secondary/20">
                <CardHeader className="flex-row items-center justify-between p-3 border-b border-slate-50 bg-slate-50/50">
                    <CardTitle className="text-xs font-black truncate text-slate-900">{farmer.name}</CardTitle>
                    {existingEntry && <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />}
                </CardHeader>
                <CardContent className="p-3 flex-1 space-y-3">
                    {(farmer.milkTypes || []).includes('cow') && (
                        <div className="flex items-center justify-between gap-2">
                            <Label className="text-[9px] font-black text-secondary uppercase tracking-wider">{t('cow')}</Label>
                            <Input 
                                type="number" 
                                step="0.01"
                                value={isNoMilk || cowQuantity === 0 ? '' : cowQuantity} 
                                placeholder="0"
                                onChange={(e) => setCowQuantity(parseFloat(e.target.value) || 0)} 
                                className="h-8 w-16 text-center text-xs font-black bg-slate-50 border-slate-200 rounded-lg"
                                disabled={isNoMilk}
                            />
                        </div>
                    )}
                    {(farmer.milkTypes || []).includes('buffalo') && (
                        <div className="flex items-center justify-between gap-2">
                            <Label className="text-[9px] font-black text-secondary uppercase tracking-wider">{t('buffalo')}</Label>
                            <Input 
                                type="number" 
                                step="0.01"
                                value={isNoMilk || buffaloQuantity === 0 ? '' : buffaloQuantity} 
                                placeholder="0"
                                onChange={(e) => setBuffaloQuantity(parseFloat(e.target.value) || 0)} 
                                className="h-8 w-16 text-center text-xs font-black bg-slate-50 border-slate-200 rounded-lg"
                                disabled={isNoMilk}
                            />
                        </div>
                    )}
                    <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 border-dashed">
                        <Checkbox 
                            id={`no-milk-farmer-${farmer.id}`} 
                            checked={isNoMilk} 
                            onCheckedChange={(checked) => setIsNoMilk(!!checked)} 
                            className="h-3.5 w-3.5"
                        />
                        <Label htmlFor={`no-milk-farmer-${farmer.id}`} className="text-[9px] font-bold text-slate-400">{t('noMilk')}</Label>
                    </div>
                    
                    <div className="flex justify-end pt-1">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setPaymentDialogOpen(true)}
                            className="h-6 gap-1 px-2 text-[8px] font-black text-primary hover:bg-primary/5 border border-primary/10 rounded-md"
                        >
                            <Wallet className="h-2.5 w-2.5" />
                            {t('addPayment')}
                        </Button>
                    </div>
                </CardContent>
                <CardFooter className="bg-slate-50/30 p-2 border-t border-slate-50 flex items-center justify-between">
                    <div className="text-[10px] font-black text-primary">₹{total.toFixed(2)}</div>
                    <Button onClick={handleSave} size="sm" className="h-7 px-3 text-[9px] font-black rounded-lg">
                        {t('save')}
                    </Button>
                </CardFooter>
            </Card>
            <FarmerPaymentDialog
                open={paymentDialogOpen}
                onOpenChange={setPaymentDialogOpen}
                payment={null}
                farmerId={farmer.id}
                date={date}
            />
        </>
    );
}

function DailyEntryContent() {
    const { customers, farmers, t, isDataLoaded } = useAppContext();
    const searchParams = useSearchParams();
    const dateParam = searchParams.get('date');
    const [date, setDate] = useState<Date | null>(null);
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [leftoverDialogOpen, setLeftoverDialogOpen] = useState(false);

    useEffect(() => {
      setDate(dateParam ? new Date(dateParam) : new Date());
    }, [dateParam]);

    if (!isDataLoaded || !date) {
      return (
        <div className="container py-4 animate-pulse space-y-4">
            <Skeleton className="h-8 w-40 bg-slate-100" />
            <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl bg-slate-50" />)}
            </div>
        </div>
      )
    }

    return (
        <div className="container py-4 max-3xl page-transition">
            <div className="flex justify-between items-center mb-6 px-1">
                <div>
                    <Link href="/" className="text-[9px] font-black text-secondary hover:text-primary flex items-center gap-1 mb-0.5 uppercase tracking-widest transition-colors">
                        <Home className="w-3 h-3"/> {t('backToHome')}
                    </Link>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('dailyEntry')}</h1>
                </div>
                <div className='flex gap-2 items-center'>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="h-9 px-3 text-[10px] font-black rounded-xl border-slate-200 bg-white text-slate-900 shadow-sm">
                                <CalendarIcon className="mr-2 h-3.5 w-3.5 text-primary" />
                                {format(date, "dd MMM yyyy")}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(d) => d && (setDate(d), setCalendarOpen(false))}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 bg-amber-50 text-amber-600 shadow-sm" onClick={() => setLeftoverDialogOpen(true)}>
                        <Zap className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            
            <Tabs defaultValue="customers" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-10 bg-slate-50 p-1 rounded-xl mb-6 border border-slate-100 shadow-sm">
                    <TabsTrigger value="customers" className="rounded-lg font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">{t('customers')}</TabsTrigger>
                    <TabsTrigger value="farmers" className="rounded-lg font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-secondary data-[state=active]:text-white transition-all">{t('farmers')}</TabsTrigger>
                </TabsList>
                <TabsContent value="customers" className="mt-0 focus-visible:ring-0">
                    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                        {customers.map(c => <CustomerEntryCard key={c.id} customer={c} date={date} />)}
                        {customers.length === 0 && <div className="col-span-full py-16 text-center text-slate-300 font-bold uppercase tracking-widest text-[9px] border-2 border-dashed rounded-2xl">{t('noCustomers')}</div>}
                    </div>
                </TabsContent>
                <TabsContent value="farmers" className="mt-0 focus-visible:ring-0">
                    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                        {farmers.map(f => <FarmerPurchaseCard key={f.id} farmer={f} date={date} />)}
                        {farmers.length === 0 && <div className="col-span-full py-16 text-center text-slate-300 font-bold uppercase tracking-widest text-[9px] border-2 border-dashed rounded-2xl">{t('noFarmers')}</div>}
                    </div>
                </TabsContent>
            </Tabs>
            <LeftoverSaleDialog open={leftoverDialogOpen} onOpenChange={setLeftoverDialogOpen} date={date} />
        </div>
    )
}

export default function DailyEntryPage() {
    return (
        <Suspense fallback={<div className="p-10 text-center text-slate-300 animate-pulse font-black uppercase tracking-widest text-xs">Loading...</div>}>
            <DailyEntryContent />
        </Suspense>
    )
}