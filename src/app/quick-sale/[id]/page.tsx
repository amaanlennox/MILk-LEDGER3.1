"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ChevronLeft, Wallet, Milk, TrendingUp, ShoppingBag, ArrowUpRight, ArrowDownLeft, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, getMonth, getYear } from "date-fns";
import { QuickSalePaymentDialog } from "@/components/QuickSalePaymentDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function QuickSaleLedgerPage() {
    const params = useParams();
    const id = params.id as string;
    const { getQuickSaleCustomerById, quickSaleEntries, quickSalePayments, t, isDataLoaded } = useAppContext();

    const customer = getQuickSaleCustomerById(id);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

    const stats = useMemo(() => {
        if (!customer) return { balance: 0, monthMilk: 0, monthSales: 0, monthPaid: 0, todayMilk: 0, todaySale: 0 };
        
        const now = new Date();
        const todayStr = format(now, 'yyyy-MM-dd');
        const currMonth = getMonth(now);
        const currYear = getYear(now);

        const allSales = quickSaleEntries.filter(e => e.customerId === id);
        const allPayments = quickSalePayments.filter(p => p.customerId === id);

        const totalSales = allSales.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const totalPaid = allPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        const monthEntries = allSales.filter(e => {
            const d = new Date(e.date);
            return getMonth(d) === currMonth && getYear(d) === currYear;
        });

        const monthPayments = allPayments.filter(p => {
            const d = new Date(p.date);
            return getMonth(d) === currMonth && getYear(d) === currYear;
        });

        const todayEntries = allSales.filter(e => e.date === todayStr);

        return {
            balance: totalSales - totalPaid,
            monthMilk: Number(monthEntries.reduce((sum, e) => sum + (Number(e.quantity) || 0), 0)),
            monthSales: Number(monthEntries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)),
            monthPaid: Number(monthPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)),
            todayMilk: Number(todayEntries.reduce((sum, e) => sum + (Number(e.quantity) || 0), 0)),
            todaySale: Number(todayEntries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0))
        };
    }, [customer, quickSaleEntries, quickSalePayments, id]);

    if (!isDataLoaded) return <div className="container py-10 text-center animate-pulse text-slate-300 font-black uppercase tracking-widest">Loading...</div>;
    if (!customer) return <div className="p-10 text-center">{t('noCustomersFound')}</div>;

    const hasBalance = stats.balance > 0;

    return (
        <div className="container py-4 max-w-3xl page-transition">
            <Link href="/summary" className="text-[9px] font-black text-secondary hover:text-primary flex items-center gap-1 mb-2 uppercase tracking-widest transition-colors">
                <ChevronLeft className="w-3 h-3"/> {t('backToSummaryList')}
            </Link>

            <div className="flex justify-between items-end mb-4 px-1">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{customer.name}</h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{t('quickSale')}</p>
                </div>
                {hasBalance && (
                    <Button 
                        size="sm"
                        onClick={() => setPaymentDialogOpen(true)} 
                        className="h-9 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl shadow-lg transition-all active:scale-95"
                    >
                        <Wallet className="mr-2 h-4 w-4" />
                        {t('recordPayment')}
                    </Button>
                )}
            </div>

            {hasBalance ? (
                <Card className="mb-6 rounded-2xl overflow-hidden border-0 shadow-xl bg-slate-900 text-white p-4 relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><TrendingUp className="h-20 w-20" /></div>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                           <p className="text-white/50 font-black text-[9px] uppercase tracking-widest mb-0.5">{t('outstanding')}</p>
                           <h2 className="text-4xl font-black tracking-tighter">₹{stats.balance.toFixed(0)}</h2>
                        </div>
                        <div className="bg-white/10 p-2 rounded-xl">
                            <Wallet className="h-5 w-5 text-white" />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-4 mt-2">
                        <div>
                            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-0.5">{t('totalMilk')}</p>
                            <p className="text-xs font-bold">{stats.monthMilk.toFixed(2)}L</p>
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-0.5">{t('totalAmount')}</p>
                            <p className="text-xs font-bold">₹{stats.monthSales.toFixed(0)}</p>
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-0.5">{t('totalPayments')}</p>
                            <p className="text-xs font-bold text-emerald-400">₹{stats.monthPaid.toFixed(0)}</p>
                        </div>
                    </div>
                </Card>
            ) : (
                <Card className="mb-6 rounded-2xl border-dashed border-2 p-4 bg-slate-50 flex flex-col items-center justify-center text-center">
                    <div className="bg-white p-2.5 rounded-full shadow-sm mb-3">
                        <ShoppingBag className="h-5 w-5 text-emerald-500" />
                    </div>
                    <h2 className="text-lg font-black text-slate-900 mb-0.5">{t('currentBalance')}: ₹0</h2>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('accountSettled')}</p>
                    
                    <div className="grid grid-cols-2 gap-4 w-full mt-4 pt-4 border-t">
                        <div>
                           <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">{t('todayMilk')}</p>
                           <p className="text-sm font-bold text-slate-900">{stats.todayMilk.toFixed(2)}L</p>
                        </div>
                        <div>
                           <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">{t('todaySale')}</p>
                           <p className="text-sm font-bold text-slate-900">₹{stats.todaySale.toFixed(0)}</p>
                        </div>
                    </div>
                </Card>
            )}

            <div className="space-y-2">
                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2 flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    {t('dailyEntries')}
                </h3>
                {/* Minimal ledger view */}
                {[...quickSaleEntries, ...quickSalePayments]
                    .filter(i => i.customerId === id)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 10)
                    .map((item, idx) => (
                        <div key={idx} className="glass-card flex items-center justify-between p-3 rounded-xl border-slate-100 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={cn("p-2 rounded-lg", 'quantity' in item ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500")}>
                                    {'quantity' in item ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                                </div>
                                <div>
                                    <p className="font-black text-slate-900 text-[11px]">{format(new Date(item.date), 'dd MMM yyyy')}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                        {'quantity' in item ? `${Number(item.quantity).toFixed(2)}L ${t(item.milkType as 'cow' | 'buffalo')}` : (item as any).note || t('paymentReceived')}
                                    </p>
                                </div>
                            </div>
                            <p className={cn("font-black text-sm", 'quantity' in item ? "text-rose-600" : "text-emerald-600")}>
                                {'quantity' in item ? '+' : '-'} ₹{Number(item.amount).toFixed(0)}
                            </p>
                        </div>
                    ))}
            </div>

            <QuickSalePaymentDialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen} customerId={id} />
        </div>
    );
}
