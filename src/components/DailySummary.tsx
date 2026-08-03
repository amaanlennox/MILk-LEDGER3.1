
"use client";

import { useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Card } from '@/components/ui/card';
import { format, subDays } from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

interface CardData {
    title: string;
    subtitle?: string;
    value: string;
    change: number;
    color: string;
    accent: string;
    graphPath: string;
}

const formatK = (val: number) => {
    const num = Number(val) || 0;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}k`;
    return `₹${num.toFixed(0)}`;
};

const getChange = (today: number, yesterday: number) => {
    const t = Number(today) || 0;
    const y = Number(yesterday) || 0;
    if (y === 0) return t > 0 ? 100 : 0;
    return Math.round(((t - y) / y) * 100);
};

const AnalyticsCard = ({ data }: { data: CardData }) => {
    const isPositive = data.change > 0;
    const isNegative = data.change < 0;

    const graphColor = isPositive ? "#10b981" : isNegative ? "#ef4444" : data.accent;

    return (
        <Card className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm flex flex-col justify-between h-[180px] relative overflow-hidden group hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-start relative z-10">
                <div className="space-y-1">
                    <h3 className={cn("text-[10px] font-black uppercase tracking-[0.2em]", data.color)}>
                        {data.title} {data.subtitle && <span className="text-slate-300 ml-1">/ {data.subtitle}</span>}
                    </h3>
                    <p className="text-4xl font-black text-[#02182B] tracking-tighter pt-2">
                        {data.value}
                    </p>
                </div>
                
                <div className="w-24 h-16 opacity-80">
                    <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
                        <defs>
                            <linearGradient id={`gradient-${data.accent}-${data.title.replace(/\s+/g, '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={graphColor} stopOpacity="0.2" />
                                <stop offset="100%" stopColor={graphColor} stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <path
                            d={data.graphPath}
                            fill="none"
                            stroke={graphColor}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d={`${data.graphPath} L 100 40 L 0 40 Z`}
                            fill={`url(#gradient-${data.accent}-${data.title.replace(/\s+/g, '')})`}
                        />
                        <circle cx="80" cy="15" r="3" fill={graphColor} />
                        <text x="80" y="8" fontSize="6" fontWeight="bold" fill={graphColor} textAnchor="middle">
                            {Math.abs(data.change)}%
                        </text>
                    </svg>
                </div>
            </div>

            <div className="flex items-center gap-2 relative z-10">
                <div className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black tracking-tight",
                    isPositive ? "bg-emerald-50 text-emerald-600" : isNegative ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-400"
                )}>
                    {isPositive ? <TrendingUp className="h-3 w-3" /> : isNegative ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                    {isPositive ? '+' : ''}{data.change}%
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Yesterday</span>
            </div>
        </Card>
    );
};

export function DailySummary({ date }: { date: Date }) {
    const { entries, farmerEntries, productEntries, leftoverSales, quickSaleEntries, t } = useAppContext();
    
    const getStatsForDate = (targetDate: Date) => {
        const dateStr = format(targetDate, 'yyyy-MM-dd');
        
        const customerCow = entries.filter(e => e.date === dateStr).reduce((sum, e) => sum + (Number(e.cowQuantity) || 0), 0);
        const customerBuff = entries.filter(e => e.date === dateStr).reduce((sum, e) => sum + (Number(e.buffaloQuantity) || 0), 0);
        
        const quickSaleCow = quickSaleEntries.filter(e => e.date === dateStr && e.milkType === 'cow').reduce((sum, e) => sum + (Number(e.quantity) || 0), 0);
        const quickSaleBuff = quickSaleEntries.filter(e => e.date === dateStr && e.milkType === 'buffalo').reduce((sum, e) => sum + (Number(e.quantity) || 0), 0);
        
        const cowSold = Number(customerCow + quickSaleCow) || 0;
        const buffSold = Number(customerBuff + quickSaleBuff) || 0;

        const cowPurchased = farmerEntries.filter(e => e.date === dateStr).reduce((sum, e) => sum + (Number(e.cowQuantity) || 0), 0);
        const buffPurchased = farmerEntries.filter(e => e.date === dateStr).reduce((sum, e) => sum + (Number(e.buffaloQuantity) || 0), 0);
        
        const milkRevenueReg = entries.filter(e => e.date === dateStr).reduce((sum, e) => sum + (Number(e.cowQuantity) * Number(e.cowRate)) + (Number(e.buffaloQuantity) * Number(e.buffaloRate)), 0) + 
                            quickSaleEntries.filter(e => e.date === dateStr).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        
        const productRevenue = productEntries.filter(e => e.date === dateStr).reduce((sum, e) => sum + (Number(e.price) || 0), 0);
        
        const totalRevenue = milkRevenueReg + productRevenue + leftoverSales.filter(e => e.date === dateStr).reduce((sum, e) => sum + (Number(e.total) || 0), 0);
        
        const purchaseCost = farmerEntries.filter(e => e.date === dateStr).reduce((sum, e) => sum + (Number(e.cowQuantity) * Number(e.cowRate)) + (Number(e.buffaloQuantity) * Number(e.buffaloRate)), 0);
        
        const profit = totalRevenue - purchaseCost;

        return { 
            cowSold, buffSold, 
            cowPurchased, buffPurchased, 
            totalRevenue, purchaseCost, profit, productRevenue 
        };
    };

    const today = getStatsForDate(date);
    const yesterday = getStatsForDate(subDays(date, 1));

    const cards: CardData[] = [
        {
            title: t('todaysProfit'),
            value: formatK(today.profit),
            change: getChange(today.profit, yesterday.profit),
            color: "text-emerald-500",
            accent: "#10b981",
            graphPath: "M 0 25 C 20 25, 30 10, 50 15 S 80 5, 100 15"
        },
        {
            title: t('todaysRevenue'),
            subtitle: `C: ${Number(today.cowSold).toFixed(2)}L B: ${Number(today.buffSold).toFixed(2)}L`,
            value: formatK(today.totalRevenue),
            change: getChange(today.totalRevenue, yesterday.totalRevenue),
            color: "text-amber-500",
            accent: "#f59e0b",
            graphPath: "M 0 15 C 20 15, 30 30, 50 25 S 80 15, 100 20"
        },
        {
            title: t('purchaseEntry'),
            subtitle: `C: ${Number(today.cowPurchased).toFixed(2)}L B: ${Number(today.buffPurchased).toFixed(2)}L`,
            value: formatK(today.purchaseCost),
            change: getChange(today.purchaseCost, yesterday.purchaseCost),
            color: "text-sky-500",
            accent: "#0ea5e9",
            graphPath: "M 0 30 C 20 30, 30 15, 50 20 S 80 10, 100 5"
        },
        {
            title: t('productSale'),
            subtitle: "PANEER / GHEE",
            value: formatK(today.productRevenue),
            change: getChange(today.productRevenue, yesterday.productRevenue),
            color: "text-orange-500",
            accent: "#f97316",
            graphPath: "M 0 20 C 20 20, 30 5, 50 10 S 80 25, 100 15"
        }
    ];

    return (
        <Carousel opts={{ align: "start" }} className="w-full pt-2">
            <CarouselContent className="-ml-4">
                {cards.map((card, i) => (
                    <CarouselItem key={i} className="pl-4 basis-full sm:basis-1/2">
                        <AnalyticsCard data={card} />
                    </CarouselItem>
                ))}
            </CarouselContent>
        </Carousel>
    );
}
