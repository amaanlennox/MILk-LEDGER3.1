"use client";

import { useMemo, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, getMonth, getYear, subMonths, addMonths } from "date-fns";
import { ArrowLeft, ArrowRight, Package } from "lucide-react";
import { cn } from "@/lib/utils";

export function MonthlyReport() {
    const { entries, farmerEntries, farmerPayments, productEntries, leftoverSales, quickSaleEntries, quickSalePayments, t } = useAppContext();
    const [selectedDate, setSelectedDate] = useState(new Date());

    const report = useMemo(() => {
        const year = getYear(selectedDate);
        const month = getMonth(selectedDate);

        const filterMonth = (item: { date: string }) => {
            const d = new Date(item.date);
            return getYear(d) === year && getMonth(d) === month;
        };

        const monthlyMilkEntries = entries.filter(filterMonth);
        const monthlyFarmerEntries = farmerEntries.filter(filterMonth);
        const monthlyProductEntries = productEntries.filter(filterMonth);
        const monthlyLeftoverSales = leftoverSales.filter(filterMonth);
        const monthlyFarmerPayments = farmerPayments.filter(filterMonth);
        const monthlyQuickSaleEntries = quickSaleEntries.filter(filterMonth);
        const monthlyQuickSalePayments = quickSalePayments.filter(filterMonth);

        const totalMilkPurchased = Number(monthlyFarmerEntries.reduce((sum, e) => sum + (Number(e.cowQuantity) || 0) + (Number(e.buffaloQuantity) || 0), 0)) || 0;
        const totalMilkSoldReg = Number(monthlyMilkEntries.reduce((sum, e) => sum + (Number(e.cowQuantity) || 0) + (Number(e.buffaloQuantity) || 0), 0)) || 0;
        const totalMilkSoldQuick = Number(monthlyQuickSaleEntries.reduce((sum, e) => sum + (Number(e.quantity) || 0), 0)) || 0;
        const totalMilkSold = totalMilkSoldReg + totalMilkSoldQuick;
        
        const totalLeftoverSold = Number(monthlyLeftoverSales.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0)) || 0;
        const remainingMilk = totalMilkPurchased - totalMilkSold - totalLeftoverSold;

        const milkRevenueReg = Number(monthlyMilkEntries.reduce((sum, e) => sum + (Number(e.cowQuantity) * Number(e.cowRate)) + (Number(e.buffaloQuantity) * Number(e.buffaloRate)), 0)) || 0;
        const milkRevenueQuick = Number(monthlyQuickSaleEntries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)) || 0;
        const productsRevenue = Number(monthlyProductEntries.reduce((sum, e) => sum + (Number(e.price) || 0), 0)) || 0;
        const leftoverRevenue = Number(monthlyLeftoverSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0)) || 0;
        const totalRevenue = milkRevenueReg + milkRevenueQuick + productsRevenue + leftoverRevenue;

        const milkPurchaseCost = Number(monthlyFarmerEntries.reduce((sum, e) => sum + (Number(e.cowQuantity) * Number(e.cowRate)) + (Number(e.buffaloQuantity) * Number(e.buffaloRate)), 0)) || 0;
        const totalExpense = milkPurchaseCost + Number(monthlyFarmerPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)) || 0;

        const netProfit = totalRevenue - totalExpense;

        const paneerQty = Number(monthlyProductEntries.filter(e => e.productType === 'paneer').reduce((sum, e) => sum + (Number(e.quantity) || 0), 0)) || 0;
        const paneerAmount = Number(monthlyProductEntries.filter(e => e.productType === 'paneer').reduce((sum, e) => sum + (Number(e.price) || 0), 0)) || 0;
        const gheeQty = Number(monthlyProductEntries.filter(e => e.productType === 'ghee').reduce((sum, e) => sum + (Number(e.quantity) || 0), 0)) || 0;
        const gheeAmount = Number(monthlyProductEntries.filter(e => e.productType === 'ghee').reduce((sum, e) => sum + (Number(e.price) || 0), 0)) || 0;

        return {
            totalMilkPurchased, totalMilkSold, remainingMilk,
            totalRevenue, totalExpense, netProfit,
            paneerQty, paneerAmount, gheeQty, gheeAmount
        };
    }, [selectedDate, entries, farmerEntries, farmerPayments, productEntries, leftoverSales, quickSaleEntries, quickSalePayments]);

    return (
        <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between bg-slate-100 p-2 rounded-2xl border border-slate-200">
                <Button variant="ghost" size="icon" onClick={() => setSelectedDate(subMonths(selectedDate, 1))} className="text-slate-400 hover:text-slate-900"><ArrowLeft /></Button>
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">{format(selectedDate, 'MMMM yyyy')}</h3>
                <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addMonths(selectedDate, 1))} disabled={getMonth(selectedDate) === getMonth(new Date()) && getYear(selectedDate) === getYear(new Date())} className="text-slate-400 hover:text-slate-900"><ArrowRight /></Button>
            </div>
            
            <Card className={cn("border-0 shadow-xl rounded-3xl overflow-hidden text-white", report.netProfit >= 0 ? "bg-gradient-to-br from-emerald-500 to-emerald-700" : "bg-gradient-to-br from-rose-500 to-rose-700")}>
                <CardHeader className="p-6">
                    <CardDescription className="text-white/60 font-black uppercase tracking-widest text-[10px]">{t('netProfit')}</CardDescription>
                    <CardTitle className="text-4xl font-black tracking-tighter">₹{report.netProfit.toFixed(0)}</CardTitle>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-2 gap-3">
                <Card className="bg-white p-4 rounded-2xl border-slate-100 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('totalRevenue')}</p>
                    <p className="text-xl font-black text-primary">₹{report.totalRevenue.toFixed(0)}</p>
                </Card>
                <Card className="bg-white p-4 rounded-2xl border-slate-100 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('totalExpense')}</p>
                    <p className="text-xl font-black text-destructive">₹{report.totalExpense.toFixed(0)}</p>
                </Card>
            </div>
            
            <div className="space-y-3">
                <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">{t('milkSummary')}</h4>
                <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100 shadow-sm overflow-hidden">
                    <div className="flex justify-between p-4"><span className="text-sm font-bold text-slate-400">{t('milkPurchased')}</span> <span className="font-black text-slate-900">{report.totalMilkPurchased.toFixed(2)} L</span></div>
                    <div className="flex justify-between p-4"><span className="text-sm font-bold text-slate-400">{t('milkSold')}</span> <span className="font-black text-slate-900">{report.totalMilkSold.toFixed(2)} L</span></div>
                    <div className="flex justify-between p-4 bg-slate-50"><span className="text-sm font-black text-secondary">{t('remainingMilk')}</span> <span className="font-black text-secondary">{report.remainingMilk.toFixed(2)} L</span></div>
                </div>
            </div>

            <div className="space-y-3">
                <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">{t('productsSummary')}</h4>
                <div className="grid grid-cols-2 gap-3">
                    <Card className="bg-white p-4 rounded-2xl border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-2"><Package className="h-3.5 w-3.5 text-secondary" /><span className="text-[10px] font-black text-slate-400 uppercase">{t('paneer')}</span></div>
                        <p className="text-lg font-black text-slate-900">{report.paneerQty.toFixed(2)} kg</p>
                        <p className="text-[10px] font-bold text-secondary">₹{report.paneerAmount.toFixed(0)}</p>
                    </Card>
                    <Card className="bg-white p-4 rounded-2xl border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-2"><Package className="h-3.5 w-3.5 text-secondary" /><span className="text-[10px] font-black text-slate-400 uppercase">{t('ghee')}</span></div>
                        <p className="text-lg font-black text-slate-900">{report.gheeQty.toFixed(2)} kg</p>
                        <p className="text-[10px] font-bold text-secondary">₹{report.gheeAmount.toFixed(0)}</p>
                    </Card>
                </div>
            </div>
        </div>
    );
}