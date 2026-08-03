
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, CheckCircle, Home, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Farmer } from '@/lib/types';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FarmerPaymentDialog } from '@/components/FarmerPaymentDialog';

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
        const milkTypes = farmer.milkTypes || [];
        if (entry) {
            setCowQuantity(milkTypes.includes('cow') ? (entry.cowQuantity ?? 0) : 0);
            setBuffaloQuantity(milkTypes.includes('buffalo') ? (entry.buffaloQuantity ?? 0) : 0);
            // isNoMilk should remain manual
        } else {
            setCowQuantity(milkTypes.includes('cow') ? (farmer.defaultCowQuantity ?? 0) : 0);
            setBuffaloQuantity(milkTypes.includes('buffalo') ? (farmer.defaultBuffaloQuantity ?? 0) : 0);
            setIsNoMilk(false);
        }
    }, [dateString, farmer.id, getFarmerEntry, farmer.milkTypes, farmer.defaultCowQuantity, farmer.defaultBuffaloQuantity]);

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
            title: existingEntry ? t('update') : t('save'),
            description: `Purchase entry for ${farmer.name} saved.`,
        });
    };

    const total = (isNoMilk ? 0 : (cowQuantity * (farmer.cowRate || 0)) + (buffaloQuantity * (farmer.buffaloRate || 0)));
    
    return (
        <>
            <Card>
                <CardHeader className="flex-row items-center justify-between p-4">
                    <CardTitle className="text-xl">{farmer.name}</CardTitle>
                    {existingEntry && <CheckCircle className="h-6 w-6 text-green-500" />}
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                    {(farmer.milkTypes || []).includes('cow') && (
                        <div className="flex items-center justify-between gap-2">
                            <Label htmlFor={`cow-qty-${farmer.id}`} className="text-base font-medium">{t('cowMilk')}</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground text-sm">₹{farmer.cowRate}/L</span>
                                <Input 
                                    id={`cow-qty-${farmer.id}`}
                                    type="number" 
                                    value={isNoMilk ? 0 : cowQuantity} 
                                    onChange={(e) => setCowQuantity(parseFloat(e.target.value) || 0)} 
                                    className="h-12 w-24 text-lg text-center"
                                    placeholder='L'
                                    disabled={isNoMilk}
                                />
                            </div>
                        </div>
                    )}
                    {(farmer.milkTypes || []).includes('buffalo') && (
                        <div className="flex items-center justify-between gap-2">
                            <Label htmlFor={`buffalo-qty-${farmer.id}`} className="text-base font-medium">{t('buffaloMilk')}</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground text-sm">₹{farmer.buffaloRate}/L</span>
                                <Input 
                                    id={`buffalo-qty-${farmer.id}`}
                                    type="number" 
                                    value={isNoMilk ? 0 : buffaloQuantity} 
                                    onChange={(e) => setBuffaloQuantity(parseFloat(e.target.value) || 0)} 
                                    className="h-12 w-24 text-lg text-center"
                                    placeholder='L'
                                    disabled={isNoMilk}
                                />
                            </div>
                        </div>
                    )}
                    <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox id={`zero-check-${farmer.id}`} checked={isNoMilk} onCheckedChange={(checked) => setIsNoMilk(!!checked)} />
                            <Label htmlFor={`zero-check-${farmer.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {t('noMilk')}
                            </Label>
                        </div>
                    </div>
                    
                    <div className="flex justify-end pt-1">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setPaymentDialogOpen(true)}
                            className="h-8 gap-1.5 text-xs font-bold text-green-600 hover:bg-green-50 px-2"
                        >
                            <Wallet className="h-4 w-4" />
                            {t('addPayment')}
                        </Button>
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/50 p-4 flex items-center justify-between">
                    <div>
                        <span className="text-sm text-muted-foreground">{t('amount')}: </span>
                        <span className="font-bold text-xl">₹{total.toFixed(2)}</span>
                    </div>
                    <Button onClick={handleSave} size="default" variant={existingEntry ? 'secondary' : 'default'}>
                        {existingEntry ? t('update') : t('save')}
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
    )
}

function FarmerEntryContent() {
    const { farmers, t } = useAppContext();
    const searchParams = useSearchParams();
    const dateParam = searchParams.get('date');
    const [date, setDate] = useState(dateParam ? new Date(dateParam) : new Date());
    const [calendarOpen, setCalendarOpen] = useState(false);

    const handleDateSelect = (d: Date | undefined) => {
        if (d) {
            setDate(d);
            setCalendarOpen(false);
        }
    }

    return (
        <div className="container mx-auto p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <div>
                    <Link href="/" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-1">
                        <Home className="w-4 h-4"/> {t('backToHome')}
                    </Link>
                    <h1 className="text-3xl font-bold">{t('purchaseEntry')}</h1>
                </div>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className="w-full sm:w-[280px] justify-start text-left font-normal h-12 text-base"
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(date, "PPP")}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleDateSelect}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>

            {farmers.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {farmers.map(farmer => (
                        <FarmerPurchaseCard key={`${farmer.id}-${format(date, 'yyyy-MM-dd')}`} farmer={farmer} date={date} />
                    ))}
                </div>
            ) : (
                 <Card className="text-center py-16">
                    <CardHeader>
                        <CardTitle className="text-3xl">{t('noFarmers')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Link href="/farmers">
                        <Button size="lg">{t('addFarmer')}</Button>
                        </Link>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export default function FarmerEntryPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <FarmerEntryContent />
        </Suspense>
    )
}
