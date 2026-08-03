"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ChevronLeft, Share2, Eye, Milk, Download, Calendar as CalIcon, Tractor, Wallet, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, getMonth, getYear, setMonth, setYear, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FarmerPaymentDialog } from "@/components/FarmerPaymentDialog";
import { FarmerPayment } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { EditDailyEntriesDialog } from "@/components/EditDailyEntriesDialog";

export default function FarmerSummaryPage() {
    const params = useParams();
    const id = params.id as string;
    const { getFarmerById, farmerEntries, farmerPayments, t, isDataLoaded, deleteFarmerPayment } = useAppContext();
    const { toast } = useToast();

    const farmer = getFarmerById(id);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<FarmerPayment | null>(null);
    const [editEntriesOpen, setEditEntriesOpen] = useState(false);

    const safeT = (key: string) => {
        const val = t(key as any);
        return val || key;
    };

    const { monthlyTimeline, totals, calendarDays, monthlyPaymentsList } = useMemo(() => {
        if (!farmer) return { monthlyTimeline: [], totals: { cowQuantity: 0, buffaloQuantity: 0, milkTotalAmount: 0, cowTotalAmount: 0, buffaloTotalAmount: 0, paymentTotalAmount: 0, finalPayableAmount: 0 }, calendarDays: [], monthlyPaymentsList: [] };

        const year = getYear(selectedDate);
        const month = getMonth(selectedDate);
        const start = startOfMonth(selectedDate);
        const end = endOfMonth(selectedDate);
        const days = eachDayOfInterval({ start, end });

        const monthlyMilkEntries = farmerEntries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entry.farmerId === id && getYear(entryDate) === year && getMonth(entryDate) === month;
        });

        const monthlyPayments = farmerPayments.filter(payment => {
            const paymentDate = new Date(payment.date);
            return payment.farmerId === id && getYear(paymentDate) === year && getMonth(paymentDate) === month;
        });

        const milkTotals = monthlyMilkEntries.reduce((acc, entry) => {
            const cowQty = (farmer.milkTypes.includes('cow') ? entry.cowQuantity : 0) || 0;
            const buffaloQty = (farmer.milkTypes.includes('buffalo') ? entry.buffaloQuantity : 0) || 0;
            
            acc.cowQuantity += cowQty;
            acc.buffaloQuantity += buffaloQty;
            acc.cowTotalAmount += cowQty * (entry.cowRate || 0);
            acc.buffaloTotalAmount += buffaloQty * (entry.buffaloRate || 0);
            return acc;
        }, { cowQuantity: 0, buffaloQuantity: 0, cowTotalAmount: 0, buffaloTotalAmount: 0 });
        
        const milkTotalAmount = milkTotals.cowTotalAmount + milkTotals.buffaloTotalAmount;
        const paymentTotalAmount = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);
        const finalPayableAmount = milkTotalAmount - paymentTotalAmount;

        const timeline = [
            ...monthlyMilkEntries.map(e => ({ type: 'milk' as const, data: e, date: e.date })),
            ...monthlyPayments.map(p => ({ type: 'payment' as const, data: p, date: p.date })),
        ].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return { 
            monthlyTimeline: timeline, 
            totals: { ...milkTotals, milkTotalAmount, paymentTotalAmount, finalPayableAmount }, 
            calendarDays: days,
            monthlyPaymentsList: monthlyPayments
        };
    }, [farmerEntries, farmerPayments, id, selectedDate, farmer]);

    const generatePdf = async (type: 'view' | 'share' | 'download') => {
        if (!farmer) return;
        
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
        doc.text(`ML-${format(selectedDate, 'yyyyMM')}-${farmer.id.substring(0,4).toUpperCase()}`, margin + 22, 34);
        doc.text(farmer.name, margin + 22, 39);
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

        // Final Payable Card
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(margin, 58, pageWidth - (margin * 2), 20, 2, 2, 'F');
        doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(safeT('finalPayableAmount').toUpperCase(), margin + 6, 65);
        doc.setFontSize(22);
        doc.text(`Rs. ${totals.finalPayableAmount.toFixed(2)}`, margin + 6, 74);

        const entriesMap = new Map(monthlyTimeline.filter(i => i.type === 'milk').map(e => [e.date, e.data]));
        const half = Math.ceil(calendarDays.length / 2);
        const leftDays = calendarDays.slice(0, half);
        const rightDays = calendarDays.slice(half);

        const hasCow = farmer.milkTypes.includes('cow');
        const hasBuff = farmer.milkTypes.includes('buffalo');
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

        const calcRows = [];
        if (totals.cowQuantity > 0) {
            calcRows.push([
                safeT('totalCowMilk').toUpperCase(),
                `${totals.cowQuantity.toFixed(2)} L x Rs. ${(totals.cowTotalAmount / totals.cowQuantity).toFixed(2)}`,
                `Rs. ${totals.cowTotalAmount.toFixed(2)}`
            ]);
        }
        if (totals.buffaloQuantity > 0) {
            calcRows.push([
                safeT('totalBuffaloMilk').toUpperCase(),
                `${totals.buffaloQuantity.toFixed(2)} L x Rs. ${(totals.buffaloTotalAmount / totals.buffaloQuantity).toFixed(2)}`,
                `Rs. ${totals.buffaloTotalAmount.toFixed(2)}`
            ]);
        }
        
        calcRows.push([{ content: '', colSpan: 3, styles: { minCellHeight: 1.5 } }]);
        calcRows.push([safeT('milkPurchaseTotal').toUpperCase(), '', `Rs. ${totals.milkTotalAmount.toFixed(2)}`]);

        autoTable(doc, {
            body: calcRows,
            startY: currentY,
            theme: 'plain',
            styles: { fontSize: 9.5, cellPadding: 1.2, font: 'helvetica', textColor: navy },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 }, 1: { halign: 'center' }, 2: { halign: 'right', fontStyle: 'bold', cellWidth: 40 } },
            margin: { left: margin, right: margin }
        });

        const monthlyPaymentsListPdf = monthlyTimeline.filter(i => i.type === 'payment');
        if (monthlyPaymentsListPdf.length > 0) {
            currentY = (doc as any).lastAutoTable.finalY + 6;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text('ADVANCE PAYMENT HISTORY', margin, currentY);
            currentY += 5;

            const paymentRows = monthlyPaymentsListPdf.map(p => [
                format(new Date(p.date), 'dd MMM'),
                `- Rs. ${(p.data as any).amount.toFixed(2)}`,
                (p.data as any).note || safeT('advancePaid')
            ]);

            autoTable(doc, {
                body: paymentRows,
                startY: currentY,
                theme: 'plain',
                styles: { fontSize: 9, cellPadding: 1.2, font: 'helvetica', textColor: slate },
                columnStyles: { 0: { cellWidth: 20 }, 1: { fontStyle: 'bold', cellWidth: 35 }, 2: { halign: 'left' } },
                margin: { left: margin, right: margin }
            });
        }

        currentY = (doc as any).lastAutoTable.finalY + 3;
        doc.setDrawColor(240, 240, 240);
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 8;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.text(safeT('finalPayableAmount').toUpperCase(), margin, currentY);
        doc.text(`Rs. ${totals.finalPayableAmount.toFixed(2)}`, pageWidth - margin - doc.getTextWidth(`Rs. ${totals.finalPayableAmount.toFixed(2)}`), currentY);

        const filename = `${farmer.name.replace(/\s+/g, '_')}_Bill_${format(selectedDate, 'MMM_yyyy')}.pdf`;
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
        const availableYears = Array.from(new Set([...farmerEntries, ...farmerPayments].map(e => getYear(new Date(e.date)))));
        if (availableYears.length === 0) availableYears.push(getYear(new Date()));
        return availableYears.sort((a, b) => b - a);
    }, [farmerEntries, farmerPayments]);
    
    const months = useMemo(() => Array.from({length: 12}, (_, i) => ({value: i, name: format(new Date(2000, i), 'LLLL')})), []);

    if (!isDataLoaded) return <div className="container py-10 text-center animate-pulse text-slate-300 font-black tracking-widest uppercase">Loading statement...</div>;
    if (!farmer) return <div className="p-10 text-center text-slate-900 font-black">{safeT('noFarmers')}</div>;

    const cowAvgRate = totals.cowQuantity > 0 ? (totals.cowTotalAmount / totals.cowQuantity) : 0;
    const buffaloAvgRate = totals.buffaloQuantity > 0 ? (totals.buffaloTotalAmount / totals.buffaloQuantity) : 0;

    return (
        <div className="container py-4 max-w-3xl page-transition">
            <Link href="/summary" className="text-[9px] font-black text-secondary hover:text-primary flex items-center gap-1 mb-2 uppercase tracking-widest transition-colors">
                <ChevronLeft className="w-3 h-3"/> {safeT('backToFarmerSummaryList')}
            </Link>

            <div className="flex justify-between items-end mb-4 px-1 gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{farmer.name}</h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{safeT('purchaseSummary')}</p>
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
                        <Button onClick={() => generatePdf('download')} className="h-8 px-0 bg-secondary text-white"><Download className="h-3.5 w-3.5" /></Button>
                    </div>
                </div>
            </div>

            <Card className="mb-6 rounded-2xl overflow-hidden border-0 shadow-xl bg-[#02182B] text-white p-4 sm:p-6 relative">
                <div className="absolute top-0 right-0 p-4 opacity-[0.06]"><Tractor className="h-16 w-14 sm:h-28 sm:w-24" /></div>
                
                <div className="mb-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">TOTAL QUANTITY</p>
                    <div className="space-y-1">
                        {totals.cowQuantity > 0 && (
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white uppercase">
                                {totals.cowQuantity.toFixed(2)}L COW @ {cowAvgRate.toFixed(0)}
                            </h2>
                        )}
                        {totals.buffaloQuantity > 0 && (
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white uppercase">
                                {totals.buffaloQuantity.toFixed(2)}L BUFFALO @ {buffaloAvgRate.toFixed(0)}
                            </h2>
                        )}
                    </div>
                </div>

                {monthlyPaymentsList.length > 0 && (
                    <div className="mb-8">
                        <p className="text-[11px] font-black text-accent uppercase tracking-widest mb-2">PAYMENTS -</p>
                        <div className="space-y-1">
                            {monthlyPaymentsList.map(p => (
                                <p key={p.id} className="text-xs font-black text-destructive uppercase">
                                    {format(new Date(p.date), 'd MMM').toUpperCase()} - RS {p.amount.toFixed(0)} {p.note ? `(${p.note.toUpperCase()})` : ''}
                                </p>
                            ))}
                        </div>
                    </div>
                )}

                <div className="h-px bg-white/10 w-full mb-6" />

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 sm:gap-0">
                    <div className="flex gap-4 sm:gap-8">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{safeT('totalAmount')}</p>
                            <p className="text-xl sm:text-2xl font-black">₹{totals.milkTotalAmount.toFixed(0)}</p>
                        </div>
                        <div className="border-l border-white/10 pl-4 sm:pl-8">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{safeT('totalPayments')}</p>
                            <p className="text-xl sm:text-2xl font-black text-accent">₹{totals.paymentTotalAmount.toFixed(0)}</p>
                        </div>
                    </div>
                    
                    <div className="text-left sm:text-right w-full sm:w-auto">
                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter leading-none">₹{totals.finalPayableAmount.toFixed(2)}</h2>
                        <p className="text-white/60 font-black text-[10px] uppercase tracking-widest mt-1">{safeT('finalPayableAmount')}</p>
                    </div>
                </div>
            </Card>

            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2 flex items-center gap-1.5">
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
                        const milkEntry = farmerEntries.find(e => e.farmerId === id && e.date === dateStr);
                        const dayPayments = farmerPayments.filter(p => p.farmerId === id && p.date === dateStr);
                        
                        const todayStr = format(new Date(), 'yyyy-MM-dd');
                        if (format(day, 'yyyy-MM-dd') > todayStr) return null;

                        return (
                            <div key={dateStr} className="space-y-1">
                                <div className="glass-card flex items-center justify-between p-3 rounded-xl border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-secondary/10 p-2 rounded-lg"><Milk className="h-4 w-4 text-secondary" /></div>
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
                                                {farmer.milkTypes.includes('cow') && (milkEntry.cowQuantity > 0) && `${milkEntry.cowQuantity}L `}
                                                {farmer.milkTypes.includes('buffalo') && (milkEntry.buffaloQuantity > 0) && `${milkEntry.buffaloQuantity}L`}
                                            </>
                                        )}
                                    </p>
                                </div>
                                
                                {dayPayments.map(p => (
                                    <div key={p.id} className="glass-card flex items-center justify-between p-3 rounded-xl border-dashed border-destructive/20 bg-destructive/[0.02] ml-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-destructive/10 p-2 rounded-lg"><Wallet className="h-4 w-4 text-destructive" /></div>
                                            <div>
                                                <p className="font-black text-slate-900 text-[11px]">{format(new Date(p.date), 'dd MMM')}</p>
                                                <p className="text-[9px] font-bold text-destructive/60 uppercase tracking-wider">{p.note || safeT('advancePaid')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <p className="font-black text-destructive text-sm">- ₹{p.amount.toFixed(0)}</p>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-200 hover:text-destructive hover:bg-destructive/10" onClick={() => deleteFarmerPayment(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>

            <FarmerPaymentDialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen} payment={selectedPayment} farmerId={id} date={new Date()} />
            <EditDailyEntriesDialog 
                open={editEntriesOpen} 
                onOpenChange={setEditEntriesOpen} 
                type="farmer" 
                id={id} 
                selectedMonth={selectedDate} 
            />
        </div>
    );
}
