"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ChevronLeft, Share2, Eye, Milk, Download, Calendar as CalIcon, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, getMonth, getYear, setMonth, setYear, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProductType } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { EditDailyEntriesDialog } from "@/components/EditDailyEntriesDialog";

export default function SummaryPage() {
    const params = useParams();
    const id = params.id as string;
    const { getCustomerById, entries, productEntries, t, isDataLoaded } = useAppContext();
    const { toast } = useToast();

    const customer = getCustomerById(id);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [editEntriesOpen, setEditEntriesOpen] = useState(false);

    const safeT = (key: string) => {
        const val = t(key as any);
        return val || key;
    };

    const { monthlyTimeline, totals, calendarDays } = useMemo(() => {
        if (!customer) return { monthlyTimeline: [], totals: { cowQuantity: 0, buffaloQuantity: 0, milkTotalAmount: 0, cowTotalAmount: 0, buffaloTotalAmount: 0, productsTotalAmount: 0, grandTotal: 0, paneerQuantity: 0, paneerTotalAmount: 0, gheeQuantity: 0, gheeTotalAmount: 0, prevDue: 0, prevAdvance: 0 }, calendarDays: [] };

        const year = getYear(selectedDate);
        const month = getMonth(selectedDate);
        const start = startOfMonth(selectedDate);
        const end = endOfMonth(selectedDate);
        const days = eachDayOfInterval({ start, end });

        const filteredMilkEntries = entries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entry.customerId === id && getYear(entryDate) === year && getMonth(entryDate) === month;
        });

        const filteredProductEntries = productEntries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entry.customerId === id && getYear(entryDate) === year && getMonth(entryDate) === month;
        });

        const milkTotals = filteredMilkEntries.reduce((acc, entry) => {
            const cowQty = (customer.milkTypes.includes('cow') ? entry.cowQuantity : 0) || 0;
            const buffaloQty = (customer.milkTypes.includes('buffalo') ? entry.buffaloQuantity : 0) || 0;
            
            acc.cowQuantity += cowQty;
            acc.buffaloQuantity += buffaloQty;
            acc.cowTotalAmount += cowQty * (entry.cowRate || 0);
            acc.buffaloTotalAmount += buffaloQty * (entry.buffaloRate || 0);
            return acc;
        }, { cowQuantity: 0, buffaloQuantity: 0, cowTotalAmount: 0, buffaloTotalAmount: 0 });
        
        const milkTotalAmount = milkTotals.cowTotalAmount + milkTotals.buffaloTotalAmount;

        const productTotals = filteredProductEntries.reduce((acc, entry) => {
            if (entry.productType === 'paneer') {
                acc.paneerQuantity += entry.quantity;
                acc.paneerTotalAmount += entry.price;
            } else if (entry.productType === 'ghee') {
                acc.gheeQuantity += entry.quantity;
                acc.gheeTotalAmount += entry.price;
            }
            return acc;
        }, { paneerQuantity: 0, paneerTotalAmount: 0, gheeQuantity: 0, gheeTotalAmount: 0 });

        const productsTotalAmount = productTotals.paneerTotalAmount + productTotals.gheeTotalAmount;
        const grandTotal = milkTotalAmount + productsTotalAmount;

        const timeline = [
            ...filteredMilkEntries.map(e => ({ type: 'milk' as const, data: e, date: e.date })),
            ...filteredProductEntries.map(e => ({ type: 'product' as const, data: e, date: e.date })),
        ].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return { monthlyTimeline: timeline, totals: { ...milkTotals, milkTotalAmount, ...productTotals, productsTotalAmount, grandTotal }, calendarDays: days };
    }, [entries, productEntries, id, selectedDate, customer]);
    
    const generatePdf = async (type: 'view' | 'share' | 'download') => {
        if (!customer) return;
        
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const margin = 15;
        const pageWidth = doc.internal.pageSize.getWidth();
        const navy = [2, 24, 43];
        const primaryBlue = [1, 151, 246];
        const slate = [100, 116, 139];

        // Header Section
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.setTextColor(navy[0], navy[1], navy[2]);
        doc.text('INVOICE', margin, 25);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(slate[0], slate[1], slate[2]);
        doc.text('Invoice no:', margin, 34);
        doc.text('Issued to:', margin, 39);
        doc.text('Issued date:', margin, 44);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(navy[0], navy[1], navy[2]);
        doc.text(`ML-${format(selectedDate, 'yyyyMM')}-${customer.id.substring(0,4).toUpperCase()}`, margin + 22, 34);
        doc.text(customer.name, margin + 22, 39);
        doc.text(format(new Date(), 'dd/MM/yyyy'), margin + 22, 44);

        doc.setFontSize(18);
        doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.text('MILKLEDGER', pageWidth - margin - doc.getTextWidth('MILKLEDGER'), 25);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(slate[0], slate[1], slate[2]);
        doc.text('MONTHLY MILK STATEMENT', pageWidth - margin - doc.getTextWidth('MONTHLY MILK STATEMENT'), 32);

        doc.setDrawColor(240, 240, 240);
        doc.line(margin, 52, pageWidth - margin, 52);

        // Grand Total Card
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(margin, 58, pageWidth - (margin * 2), 20, 2, 2, 'F');
        doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(safeT('grandTotal').toUpperCase(), margin + 6, 65);
        doc.setFontSize(22);
        doc.text(`Rs. ${totals.grandTotal.toFixed(2)}`, margin + 6, 74);

        const entriesMap = new Map(monthlyTimeline.filter(i => i.type === 'milk').map(e => [e.date, e.data]));
        const half = Math.ceil(calendarDays.length / 2);
        const leftDays = calendarDays.slice(0, half);
        const rightDays = calendarDays.slice(half);

        const hasCow = customer.milkTypes.includes('cow');
        const hasBuff = customer.milkTypes.includes('buffalo');
        const qtyHeader = (hasCow && hasBuff) ? 'C + B QTY' : 'QTY';

        const tableBody = leftDays.map((date, index) => {
            const leftDateStr = format(date, 'yyyy-MM-dd');
            const rightDate = rightDays[index];
            const rightDateStr = rightDate ? format(rightDate, 'yyyy-MM-dd') : null;
            const leftEntry = entriesMap.get(leftDateStr) as any;
            const rightEntry = rightDateStr ? entriesMap.get(rightDateStr) as any : null;

            const formatMilkVal = (entry: any) => {
                if (!entry) return '';
                const c = entry.cowQuantity || 0;
                const b = entry.buffaloQuantity || 0;
                if (c + b === 0) return '-';
                if (hasCow && hasBuff) return `${c.toFixed(2)} + ${b.toFixed(2)}`;
                return (hasCow ? c.toFixed(2) : b.toFixed(2));
            };

            return [
                format(date, 'dd MMM'), 
                formatMilkVal(leftEntry),
                rightDate ? format(rightDate, 'dd MMM') : '',
                formatMilkVal(rightEntry)
            ];
        });

        autoTable(doc, {
            head: [['DATE', qtyHeader, 'DATE', qtyHeader]],
            body: tableBody,
            startY: 85,
            theme: 'grid',
            styles: { fontSize: 8.5, cellPadding: 1.2, halign: 'center', textColor: navy, font: 'helvetica' },
            headStyles: { fillColor: navy, textColor: [255, 255, 255], fontStyle: 'bold' },
            columnStyles: { 0: { halign: 'left', cellWidth: 25 }, 1: { fontStyle: 'bold', cellWidth: 65 }, 2: { halign: 'left', cellWidth: 25 }, 3: { fontStyle: 'bold', cellWidth: 65 } },
            margin: { left: margin, right: margin }
        });

        let currentY = (doc as any).lastAutoTable.finalY + 6;

        const summaryRows = [];
        if (totals.cowQuantity > 0) {
            summaryRows.push([
                `${safeT('totalCowMilk').toUpperCase()}:`, 
                `${totals.cowQuantity.toFixed(2)} L x Rs. ${(totals.cowTotalAmount / totals.cowQuantity).toFixed(2)}`,
                `Rs. ${totals.cowTotalAmount.toFixed(2)}`
            ]);
        }
        if (totals.buffaloQuantity > 0) {
            summaryRows.push([
                `${safeT('totalBuffaloMilk').toUpperCase()}:`, 
                `${totals.buffaloQuantity.toFixed(2)} L x Rs. ${(totals.buffaloTotalAmount / totals.buffaloQuantity).toFixed(2)}`,
                `Rs. ${totals.buffaloTotalAmount.toFixed(2)}`
            ]);
        }
        
        summaryRows.push([{ content: '', colSpan: 3, styles: { minCellHeight: 2 } }]);
        summaryRows.push([safeT('subTotal').toUpperCase(), '', `Rs. ${totals.milkTotalAmount.toFixed(2)}`]);

        if (totals.paneerTotalAmount > 0) summaryRows.push([safeT('paneer').toUpperCase(), `${totals.paneerQuantity.toFixed(1)} kg`, `+ Rs. ${totals.paneerTotalAmount.toFixed(2)}`]);
        if (totals.gheeTotalAmount > 0) summaryRows.push([safeT('ghee').toUpperCase(), `${totals.gheeQuantity.toFixed(1)} kg`, `+ Rs. ${totals.gheeTotalAmount.toFixed(2)}`]);
        
        autoTable(doc, {
            body: summaryRows,
            startY: currentY,
            theme: 'plain',
            styles: { fontSize: 9.5, cellPadding: 1.2, font: 'helvetica', textColor: navy },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 }, 1: { halign: 'center' }, 2: { halign: 'right', fontStyle: 'bold', cellWidth: 40 } },
            margin: { left: margin, right: margin }
        });

        currentY = (doc as any).lastAutoTable.finalY + 3;
        doc.setDrawColor(240, 240, 240);
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 8;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.text(safeT('grandTotal').toUpperCase(), margin, currentY);
        doc.text(`Rs. ${totals.grandTotal.toFixed(2)}`, pageWidth - margin - doc.getTextWidth(`Rs. ${totals.grandTotal.toFixed(2)}`), currentY);

        const filename = `${customer.name.replace(/\s+/g, '_')}_Bill_${format(selectedDate, 'MMM_yyyy')}.pdf`;
        
        if (type === 'download') {
            doc.save(filename);
        } else if (type === 'view') {
            window.open(doc.output('bloburl'), '_blank');
        } else if (type === 'share') {
            if (!navigator.canShare) {
                toast({ variant: "destructive", title: "Share failed", description: "Sharing is not supported on this device." });
                return;
            }
            try {
                const blob = doc.output('blob');
                const file = new File([blob], filename, { type: 'application/pdf' });
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({ files: [file], title: filename });
                } else {
                    toast({ variant: "destructive", title: "Share failed", description: "PDF sharing restricted by browser." });
                }
            } catch (err: any) {
                if (err.name !== 'AbortError') toast({ variant: "destructive", title: "Share failed", description: "Could not open share menu." });
            }
        }
    };

    const years = useMemo(() => {
        const availableYears = Array.from(new Set([...entries, ...productEntries].map(e => getYear(new Date(e.date)))));
        if (availableYears.length === 0) availableYears.push(getYear(new Date()));
        return availableYears.sort((a, b) => b - a);
    }, [entries, productEntries]);
    
    const months = useMemo(() => Array.from({length: 12}, (_, i) => ({value: i, name: format(new Date(2000, i), 'LLLL')})), []);

    if (!isDataLoaded) return <div className="container py-10 text-center animate-pulse text-slate-300 font-black tracking-widest uppercase">Loading statement...</div>;
    if (!customer) return <div className="p-10 text-center text-slate-900 font-black">{safeT('noCustomersFound')}</div>;

    const cowAvgRate = totals.cowQuantity > 0 ? (totals.cowTotalAmount / totals.cowQuantity) : 0;
    const buffaloAvgRate = totals.buffaloQuantity > 0 ? (totals.buffaloTotalAmount / totals.buffaloQuantity) : 0;

    return (
        <div className="container py-4 max-w-3xl page-transition">
            <Link href="/summary" className="text-[9px] font-black text-secondary hover:text-primary flex items-center gap-1 mb-2 uppercase tracking-widest transition-colors">
                <ChevronLeft className="w-3 h-3"/> {safeT('backToSummary')}
            </Link>
            
            <div className="flex justify-between items-end mb-4 px-1 gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{customer.name}</h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{safeT('monthlySummary')}</p>
                </div>
                
                <div className="flex flex-col gap-1.5 min-w-[140px]">
                    <div className="grid grid-cols-2 gap-1">
                        <Select value={getMonth(selectedDate).toString()} onValueChange={(m) => setSelectedDate(setMonth(selectedDate, parseInt(m)))}>
                            <SelectTrigger className="h-8 bg-slate-50 border-slate-200 text-[10px] font-black"><SelectValue /></SelectTrigger>
                            <SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value.toString()} className="text-[10px] font-black">{m.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={getYear(selectedDate).toString()} onValueChange={(y) => setSelectedDate(setYear(selectedDate, parseInt(y)))}>
                            <SelectTrigger className="h-8 bg-slate-50 border-slate-200 text-[10px] font-black"><SelectValue /></SelectTrigger>
                            <SelectContent>{years.map(y => <SelectItem key={y} value={y.toString()} className="text-[10px] font-black">{y}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                        <Button onClick={() => generatePdf('view')} variant="outline" className="h-8 px-0 border-slate-200"><Eye className="h-3.5 w-3.5 text-slate-400" /></Button>
                        <Button onClick={() => generatePdf('share')} variant="outline" className="h-8 px-0 border-slate-200"><Share2 className="h-3.5 w-3.5 text-slate-400" /></Button>
                        <Button onClick={() => generatePdf('download')} className="h-8 px-0 bg-primary text-white"><Download className="h-3.5 w-3.5" /></Button>
                    </div>
                </div>
            </div>

            <Card className="mb-6 rounded-2xl overflow-hidden border-0 shadow-xl bg-slate-900 text-white p-5 relative">
                <div className="absolute top-0 right-0 p-4 opacity-[0.06]"><Milk className="h-24 w-24" /></div>
                
                <div className="mb-1">
                    <p className="text-white/40 font-black text-[10px] uppercase tracking-widest flex flex-wrap gap-x-2">
                        {totals.cowQuantity > 0 && <span>{totals.cowQuantity.toFixed(2)}L {safeT('cow')} @ ₹{cowAvgRate.toFixed(0)}</span>}
                        {totals.cowQuantity > 0 && totals.buffaloQuantity > 0 && <span>+</span>}
                        {totals.buffaloQuantity > 0 && <span>{totals.buffaloQuantity.toFixed(2)}L {safeT('buffalo')} @ ₹{buffaloAvgRate.toFixed(0)}</span>}
                        {(totals.paneerTotalAmount > 0 || totals.gheeTotalAmount > 0) && <span>+ Extras</span>}
                    </p>
                </div>
                
                <h2 className="text-5xl font-black tracking-tighter">₹{totals.grandTotal.toFixed(2)}</h2>
                <p className="text-white/60 font-black text-[9px] uppercase tracking-[0.2em] mt-1">{safeT('grandTotal')}</p>

                <div className="flex gap-6 mt-4 border-t border-white/10 pt-4">
                    <div>
                        <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">{safeT('totalMilk')}</p>
                        <p className="text-sm font-bold">{(totals.cowQuantity + totals.buffaloQuantity).toFixed(2)} L</p>
                    </div>
                    {totals.productsTotalAmount > 0 && (
                        <div className="border-l border-white/10 pl-6">
                            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">{safeT('products')}</p>
                            <p className="text-sm font-bold text-accent">₹{totals.productsTotalAmount.toFixed(0)}</p>
                        </div>
                    )}
                </div>
            </Card>

            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <CalIcon className="h-3 w-3" /> {safeT('dailyEntries')}
                    </h3>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setEditEntriesOpen(true)}
                        className="h-8 rounded-xl font-black text-[10px] uppercase tracking-tighter border-slate-200"
                    >
                        <Edit className="h-3 w-3 mr-1.5 text-primary" />
                        {t('editDailyEntries')}
                    </Button>
                </div>

                <div className="space-y-2">
                    {calendarDays.map(day => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const milkEntry = entries.find(e => e.customerId === id && e.date === dateStr);
                        const dayProducts = productEntries.filter(e => e.customerId === id && e.date === dateStr);
                        
                        const todayStr = format(new Date(), 'yyyy-MM-dd');
                        if (format(day, 'yyyy-MM-dd') > todayStr) return null;

                        return (
                            <div key={dateStr} className="space-y-1">
                                <div className="glass-card flex items-center justify-between p-3 rounded-xl border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/10 p-2 rounded-lg">
                                            <Milk className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900 text-[11px]">{format(day, 'dd MMM')}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                                {milkEntry ? `₹${((milkEntry.cowQuantity * milkEntry.cowRate) + (milkEntry.buffaloQuantity * milkEntry.buffaloRate)).toFixed(0)}` : " "}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="font-black text-slate-900 text-sm text-right">
                                        {!milkEntry ? (
                                            " "
                                        ) : (milkEntry.cowQuantity + milkEntry.buffaloQuantity === 0) ? (
                                            "-"
                                        ) : (
                                            <>
                                                {customer.milkTypes.includes('cow') && (milkEntry.cowQuantity ?? 0) > 0 && `${milkEntry.cowQuantity}L `}
                                                {customer.milkTypes.includes('buffalo') && (milkEntry.buffaloQuantity ?? 0) > 0 && `${milkEntry.buffaloQuantity}L`}
                                            </>
                                        )}
                                    </p>
                                </div>
                                
                                {dayProducts.map(p => (
                                    <div key={p.id} className="glass-card flex items-center justify-between p-3 rounded-xl border-slate-50 bg-secondary/5 ml-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-secondary/10 p-2 rounded-lg"><Milk className="h-4 w-4 text-secondary" /></div>
                                            <div>
                                                <p className="font-black text-slate-900 text-[11px]">{safeT(p.productType as ProductType)}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">₹{p.price.toFixed(0)}</p>
                                            </div>
                                        </div>
                                        <p className="font-black text-slate-900 text-sm">{p.quantity}kg</p>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>

            <EditDailyEntriesDialog 
                open={editEntriesOpen} 
                onOpenChange={setEditEntriesOpen} 
                type="customer" 
                id={id} 
                selectedMonth={selectedDate} 
            />
        </div>
    );
}
