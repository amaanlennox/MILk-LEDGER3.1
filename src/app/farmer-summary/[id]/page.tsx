"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ChevronLeft, Share2, Eye, Milk, Calendar as CalIcon, Tractor, Wallet, Trash2, TrendingUp, FileText, Smartphone, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, getMonth, getYear, setMonth, setYear, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FarmerPaymentDialog } from "@/components/FarmerPaymentDialog";
import { FarmerPayment } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { EditDailyEntriesDialog } from "@/components/EditDailyEntriesDialog";
import { RateChangeDialog } from "@/components/RateChangeDialog";

export default function FarmerSummaryPage() {
    const params = useParams();
    const id = params.id as string;
    const { getFarmerById, farmerEntries, farmerPayments, getEffectiveRate, t, isDataLoaded, deleteFarmerPayment } = useAppContext();
    const { toast } = useToast();

    const farmer = getFarmerById(id);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<FarmerPayment | null>(null);
    const [editEntriesOpen, setEditEntriesOpen] = useState(false);
    const [rateDialogOpen, setRateDialogOpen] = useState(false);
    const [billMode, setBillMode] = useState<'a4' | 'thermal'>('a4');

    const safeT = (key: string) => {
        const val = t(key as any);
        return val || key;
    };

    const { monthlyTimeline, totals, calendarDays, effectiveRate } = useMemo(() => {
        if (!farmer) return { monthlyTimeline: [], totals: { cowQuantity: 0, buffaloQuantity: 0, milkTotalAmount: 0, cowTotalAmount: 0, buffaloTotalAmount: 0, paymentTotalAmount: 0, finalPayableAmount: 0 }, calendarDays: [], effectiveRate: null };

        const year = getYear(selectedDate);
        const month = getMonth(selectedDate);
        const monthStr = format(selectedDate, 'yyyy-MM');
        const start = startOfMonth(selectedDate);
        const end = endOfMonth(selectedDate);
        const days = eachDayOfInterval({ start, end });

        const currentRate = getEffectiveRate(farmer.rateHistory, monthStr);

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
            
            const cowRate = Number(currentRate?.cowRate ?? entry.cowRate || 0);
            const buffaloRate = Number(currentRate?.buffaloRate ?? entry.buffaloRate || 0);

            acc.cowQuantity += Number(cowQty);
            acc.buffaloQuantity += Number(buffaloQty);
            acc.cowTotalAmount += Number(cowQty) * cowRate;
            acc.buffaloTotalAmount += Number(buffaloQty) * buffaloRate;
            return acc;
        }, { cowQuantity: 0, buffaloQuantity: 0, cowTotalAmount: 0, buffaloTotalAmount: 0 });
        
        const milkTotalAmount = milkTotals.cowTotalAmount + milkTotals.buffaloTotalAmount;
        const paymentTotalAmount = monthlyPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        const finalPayableAmount = milkTotalAmount - paymentTotalAmount;

        const timeline = [
            ...monthlyMilkEntries.map(e => ({ type: 'milk' as const, data: e, date: e.date })),
            ...monthlyPayments.map(p => ({ type: 'payment' as const, data: p, date: p.date })),
        ].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return { 
            monthlyTimeline: timeline, 
            totals: { ...milkTotals, milkTotalAmount, paymentTotalAmount, finalPayableAmount }, 
            calendarDays: days,
            effectiveRate: currentRate
        };
    }, [farmerEntries, farmerPayments, id, selectedDate, farmer, getEffectiveRate]);

    const generatePdf = async (type: 'view' | 'share' | 'download') => {
        if (!farmer) return;
        
        if (billMode === 'thermal') {
            return generateThermalPdf(type);
        }

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
        doc.text(`Rs. ${Number(totals.finalPayableAmount).toFixed(2)}`, margin + 6, 74);

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
                const c = Number(entry.cowQuantity) || 0;
                const b = Number(entry.buffaloQuantity) || 0;
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
            const cowRate = Number(effectiveRate?.cowRate ?? (totals.cowTotalAmount / totals.cowQuantity) || 0);
            calcRows.push([
                safeT('totalCowMilk').toUpperCase(),
                `${Number(totals.cowQuantity).toFixed(2)} L x Rs. ${cowRate.toFixed(2)}`,
                `Rs. ${Number(totals.cowTotalAmount).toFixed(2)}`
            ]);
        }
        if (totals.buffaloQuantity > 0) {
            const buffRate = Number(effectiveRate?.buffaloRate ?? (totals.buffaloTotalAmount / totals.buffaloQuantity) || 0);
            calcRows.push([
                safeT('totalBuffaloMilk').toUpperCase(),
                `${Number(totals.buffaloQuantity).toFixed(2)} L x Rs. ${buffRate.toFixed(2)}`,
                `Rs. ${Number(totals.buffaloTotalAmount).toFixed(2)}`
            ]);
        }
        
        calcRows.push([{ content: '', colSpan: 3, styles: { minCellHeight: 1.5 } }]);
        calcRows.push([safeT('milkPurchaseTotal').toUpperCase(), '', `Rs. ${Number(totals.milkTotalAmount).toFixed(2)}`]);

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
                `- Rs. ${Number((p.data as any).amount).toFixed(2)}`,
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
        doc.text(`Rs. ${Number(totals.finalPayableAmount).toFixed(2)}`, pageWidth - margin - doc.getTextWidth(`Rs. ${Number(totals.finalPayableAmount).toFixed(2)}`), currentY);

        const filename = `${farmer.name.replace(/\s+/g, '_')}_Purchase_Bill_${format(selectedDate, 'MMM_yyyy')}.pdf`;
        finalizePdf(doc, filename, type);
    };

    const generateThermalPdf = async (type: 'view' | 'share' | 'download') => {
        if (!farmer) return;
        
        const receiptWidth = 80;
        const margin = 5;
        
        const monthlyMilkEntries = monthlyTimeline.filter(i => i.type === 'milk');
        const monthlyPayments = monthlyTimeline.filter(i => i.type === 'payment');
        const estimatedHeight = 60 + (monthlyMilkEntries.length * 5) + (monthlyPayments.length * 5) + 100;
        
        const doc = new jsPDF({ unit: 'mm', format: [receiptWidth, estimatedHeight] });
        let currentY = 10;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('MILKLEDGER', receiptWidth / 2, currentY, { align: 'center' });
        currentY += 5;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(safeT('milkPurchaseBill').toUpperCase(), receiptWidth / 2, currentY, { align: 'center' });
        currentY += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(farmer.name.toUpperCase(), margin, currentY);
        currentY += 5;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`${format(selectedDate, 'MMMM yyyy').toUpperCase()}`, margin, currentY);
        doc.text(`DATE: ${format(new Date(), 'dd/MM/yyyy')}`, receiptWidth - margin, currentY, { align: 'right' });
        currentY += 4;

        doc.setDrawColor(200);
        doc.line(margin, currentY, receiptWidth - margin, currentY);
        currentY += 5;

        // Entries - Include zero entries
        const tableData = calendarDays
            .map(date => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const entryItem = monthlyMilkEntries.find(i => i.date === dateStr);
                if (!entryItem) return null;
                
                const entry = entryItem.data as any;
                const c = Number(entry.cowQuantity) || 0;
                const b = Number(entry.buffaloQuantity) || 0;
                
                if (c + b === 0) return [format(date, 'dd MMM'), '-'];
                
                const qty = [];
                if (farmer.milkTypes.includes('cow') && c > 0) qty.push(`${c}L(C)`);
                if (farmer.milkTypes.includes('buffalo') && b > 0) qty.push(`${b}L(B)`);
                return [format(date, 'dd MMM'), qty.join(' + ')];
            })
            .filter(Boolean);

        autoTable(doc, {
            head: [['DATE', 'QUANTITY']],
            body: tableData as any,
            startY: currentY,
            theme: 'plain',
            styles: { fontSize: 8, cellPadding: 1, halign: 'center', font: 'helvetica' },
            headStyles: { fontStyle: 'bold', halign: 'center' },
            columnStyles: { 0: { halign: 'left' }, 1: { halign: 'right', fontStyle: 'bold' } },
            margin: { left: margin, right: margin }
        });

        currentY = (doc as any).lastAutoTable.finalY + 5;
        doc.line(margin, currentY, receiptWidth - margin, currentY);
        currentY += 6;

        // Bold formatting for Qty and Rate
        if (totals.cowQuantity > 0) {
            const cowRate = Number(effectiveRate?.cowRate ?? (totals.cowTotalAmount / totals.cowQuantity) || 0);
            doc.setFont('helvetica', 'bold');
            doc.text(`${safeT('cow')}: ${Number(totals.cowQuantity).toFixed(2)}L x ₹${cowRate.toFixed(0)}`, margin, currentY);
            doc.text(`₹${Number(totals.cowTotalAmount).toFixed(0)}`, receiptWidth - margin, currentY, { align: 'right' });
            currentY += 5;
        }
        if (totals.buffaloQuantity > 0) {
            const buffRate = Number(effectiveRate?.buffaloRate ?? (totals.buffaloTotalAmount / totals.buffaloQuantity) || 0);
            doc.setFont('helvetica', 'bold');
            doc.text(`${safeT('buffalo')}: ${Number(totals.buffaloQuantity).toFixed(2)}L x ₹${buffRate.toFixed(0)}`, margin, currentY);
            doc.text(`₹${Number(totals.buffaloTotalAmount).toFixed(0)}`, receiptWidth - margin, currentY, { align: 'right' });
            currentY += 5;
        }

        // Payment History Breakdown
        if (monthlyPayments.length > 0) {
            currentY += 3;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.text('ADVANCE PAYMENTS:', margin, currentY);
            currentY += 5;
            doc.setFont('helvetica', 'normal');
            monthlyPayments.forEach(p => {
                const pData = p.data as any;
                const label = `${format(new Date(p.date), 'dd MMM')} ${pData.note ? `(${pData.note})` : ''}`;
                const val = `- ₹${Number(pData.amount).toFixed(0)}`;
                doc.text(label, margin, currentY);
                doc.text(val, receiptWidth - margin, currentY, { align: 'right' });
                currentY += 4;
            });
            currentY += 2;
        }

        currentY += 5;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(safeT('finalPayableAmount').toUpperCase(), receiptWidth / 2, currentY, { align: 'center' });
        currentY += 7;
        doc.setFontSize(16);
        doc.text(`₹${Number(totals.finalPayableAmount).toFixed(0)}`, receiptWidth / 2, currentY, { align: 'center' });
        
        currentY += 10;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text(safeT('thankYou'), receiptWidth / 2, currentY, { align: 'center' });

        const filename = `${farmer.name.replace(/\s+/g, '_')}_Purchase_Receipt_${format(selectedDate, 'MMM_yyyy')}.pdf`;
        finalizePdf(doc, filename, type);
    };

    const finalizePdf = async (doc: jsPDF, filename: string, type: 'view' | 'share' | 'download') => {
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
                    toast({ variant: "destructive", title: "Share failed", description: "PDF sharing restricted." });
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

    const cowAvgRate = Number(effectiveRate?.cowRate ?? (totals.cowQuantity > 0 ? (totals.cowTotalAmount / totals.cowQuantity) : 0) || 0);
    const buffaloAvgRate = Number(effectiveRate?.buffaloRate ?? (totals.buffaloQuantity > 0 ? (totals.buffaloTotalAmount / totals.buffaloQuantity) : 0) || 0);

    return (
        <div className="container py-4 max-w-3xl page-transition">
            <Link href="/summary" className="text-[9px] font-black text-secondary hover:text-primary flex items-center gap-1 mb-2 uppercase tracking-widest transition-colors">
                <ChevronLeft className="w-3 h-3"/> {safeT('backToFarmerSummaryList')}
            </Link>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 px-1 gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{farmer.name}</h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{safeT('purchaseSummary')}</p>
                </div>
                
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                        <Button 
                            variant={billMode === 'a4' ? 'secondary' : 'ghost'} 
                            size="sm" 
                            onClick={() => setBillMode('a4')}
                            className="h-8 rounded-lg text-[10px] font-black uppercase flex-1 sm:flex-none"
                        >
                            <FileText className="mr-1.5 h-3 w-3" />
                            {safeT('professionalMode')}
                        </Button>
                        <Button 
                            variant={billMode === 'thermal' ? 'secondary' : 'ghost'} 
                            size="sm" 
                            onClick={() => setBillMode('thermal')}
                            className="h-8 rounded-lg text-[10px] font-black uppercase flex-1 sm:flex-none"
                        >
                            <Smartphone className="mr-1.5 h-3 w-3" />
                            {safeT('thermalMode')}
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 min-w-[200px]">
                        <div className="grid grid-cols-2 gap-1 flex-1">
                            <Select value={getMonth(selectedDate).toString()} onValueChange={(m) => setSelectedDate(setMonth(selectedDate, parseInt(m)))}>
                                <SelectTrigger className="h-8 bg-slate-50 border-slate-200 text-[10px] font-black"><SelectValue /></SelectTrigger>
                                <SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value.toString()} className="text-[10px] font-black">{m.name}</SelectItem>)}</SelectContent>
                            </Select>
                            <Select value={getYear(selectedDate).toString()} onValueChange={(y) => setSelectedDate(setYear(selectedDate, parseInt(y)))}>
                                <SelectTrigger className="h-8 bg-slate-50 border-slate-200 text-[10px] font-black"><SelectValue /></SelectTrigger>
                                <SelectContent>{years.map(y => <SelectItem key={y} value={y.toString()} className="text-[10px] font-black">{y}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-1 flex-1">
                            <Button onClick={() => generatePdf('view')} variant="outline" className="h-8 gap-1.5 border-slate-200 text-[10px] font-black uppercase flex-1">
                                <Eye className="h-3.5 w-3.5 text-slate-400" />
                                {safeT('viewPDF')}
                            </Button>
                            <Button onClick={() => generatePdf('share')} variant="outline" className="h-8 gap-1.5 border-slate-200 text-[10px] font-black uppercase flex-1">
                                <Share2 className="h-3.5 w-3.5 text-slate-400" />
                                {safeT('sharePDF')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <Card className="mb-6 rounded-2xl overflow-hidden border-0 shadow-xl bg-[#02182B] text-white p-4 sm:p-6 relative">
                <div className="absolute top-0 right-0 p-4 opacity-[0.06] pointer-events-none"><Tractor className="h-16 w-14 sm:h-28 sm:w-24" /></div>
                
                <div className="relative z-10 mb-6">
                    <div className="flex justify-between items-start mb-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOTAL QUANTITY</p>
                        <Button 
                            onClick={() => setRateDialogOpen(true)}
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-2.5 rounded-lg border-white/20 bg-white/5 text-[10px] font-black uppercase text-secondary hover:bg-white/10 transition-all active:scale-95 shadow-lg relative z-20"
                        >
                            <TrendingUp className="mr-1.5 h-3 w-3" />
                            {t('changeRate')}
                        </Button>
                    </div>
                    <div className="space-y-1">
                        {totals.cowQuantity > 0 && (
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white uppercase">
                                {Number(totals.cowQuantity).toFixed(2)}L COW @ {cowAvgRate.toFixed(0)}
                            </h2>
                        )}
                        {totals.buffaloQuantity > 0 && (
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white uppercase">
                                {Number(totals.buffaloQuantity).toFixed(2)}L BUFFALO @ {buffaloAvgRate.toFixed(0)}
                            </h2>
                        )}
                    </div>
                </div>

                {monthlyTimeline.filter(i => i.type === 'payment').length > 0 && (
                    <div className="relative z-10 mb-8">
                        <p className="text-[11px] font-black text-accent uppercase tracking-widest mb-2">PAYMENTS -</p>
                        <div className="space-y-1">
                            {monthlyTimeline.filter(i => i.type === 'payment').map((p: any) => (
                                <p key={p.data.id} className="text-xs font-black text-destructive uppercase">
                                    {format(new Date(p.date), 'd MMM').toUpperCase()} - RS {Number(p.data.amount).toFixed(0)} {p.data.note ? `(${p.data.note.toUpperCase()})` : ''}
                                </p>
                            ))}
                        </div>
                    </div>
                )}

                <div className="relative z-10 h-px bg-white/10 w-full mb-6" />

                <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 sm:gap-0">
                    <div className="flex gap-4 sm:gap-8">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{safeT('totalAmount')}</p>
                            <p className="text-xl sm:text-2xl font-black">₹{Number(totals.milkTotalAmount).toFixed(0)}</p>
                        </div>
                        <div className="border-l border-white/10 pl-4 sm:pl-8">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{safeT('totalPayments')}</p>
                            <p className="text-xl sm:text-2xl font-black text-accent">₹{Number(totals.paymentTotalAmount).toFixed(0)}</p>
                        </div>
                    </div>
                    
                    <div className="text-left sm:text-right w-full sm:w-auto">
                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter leading-none">₹{Number(totals.finalPayableAmount).toFixed(2)}</h2>
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
                                                {milkEntry ? `₹${((Number(milkEntry.cowQuantity) * Number(effectiveRate?.cowRate ?? milkEntry.cowRate)) + (Number(milkEntry.buffaloQuantity) * Number(effectiveRate?.buffaloRate ?? milkEntry.buffaloRate))).toFixed(0)}` : " "}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="font-black text-slate-900 text-sm text-right">
                                        {!milkEntry ? (
                                            " "
                                        ) : (Number(milkEntry.cowQuantity) + Number(milkEntry.buffaloQuantity) === 0) ? (
                                            "-"
                                        ) : (
                                            <>
                                                {farmer.milkTypes.includes('cow') && (Number(milkEntry.cowQuantity) > 0) && `${milkEntry.cowQuantity}L `}
                                                {farmer.milkTypes.includes('buffalo') && (Number(milkEntry.buffaloQuantity) > 0) && `${milkEntry.buffaloQuantity}L`}
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
                                            <p className="font-black text-destructive text-sm">- ₹{Number(p.amount).toFixed(0)}</p>
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
            <RateChangeDialog
                open={rateDialogOpen}
                onOpenChange={setRateDialogOpen}
                entityId={id}
                type="farmer"
            />
        </div>
    );
}
