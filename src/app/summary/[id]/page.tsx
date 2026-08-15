
"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ChevronLeft, Share2, Eye, Milk, Download, Calendar as CalIcon, Edit, CreditCard, TrendingUp, FileText, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, getMonth, getYear, setMonth, setYear, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProductType } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { EditDailyEntriesDialog } from "@/components/EditDailyEntriesDialog";
import { RateChangeDialog } from "@/components/RateChangeDialog";
import { cn } from "@/lib/utils";

export default function SummaryPage() {
    const params = useParams();
    const id = params.id as string;
    const { getCustomerById, entries, productEntries, getEffectiveRate, t, isDataLoaded } = useAppContext();
    const { toast } = useToast();

    const customer = getCustomerById(id);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [editEntriesOpen, setEditEntriesOpen] = useState(false);
    const [rateDialogOpen, setRateDialogOpen] = useState(false);
    const [billMode, setBillMode] = useState<'a4' | 'thermal'>('a4');

    const safeT = (key: string) => {
        const val = t(key as any);
        return val || key;
    };

    const { monthlyTimeline, totals, calendarDays, effectiveRate } = useMemo(() => {
        if (!customer) return { monthlyTimeline: [], totals: { cowQuantity: 0, buffaloQuantity: 0, milkTotalAmount: 0, cowTotalAmount: 0, buffaloTotalAmount: 0, productsTotalAmount: 0, grandTotal: 0, paneerQuantity: 0, paneerTotalAmount: 0, gheeQuantity: 0, gheeTotalAmount: 0, productsDueAmount: 0 }, calendarDays: [], effectiveRate: null };

        const year = getYear(selectedDate);
        const month = getMonth(selectedDate);
        const monthStr = format(selectedDate, 'yyyy-MM');
        const start = startOfMonth(selectedDate);
        const end = endOfMonth(selectedDate);
        const days = eachDayOfInterval({ start, end });

        const currentRate = getEffectiveRate(customer.rateHistory, monthStr);

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
            
            const cowRate = Number(currentRate?.cowRate ?? entry.cowRate || 0);
            const buffaloRate = Number(currentRate?.buffaloRate ?? entry.buffaloRate || 0);

            acc.cowQuantity += Number(cowQty);
            acc.buffaloQuantity += Number(buffaloQty);
            acc.cowTotalAmount += Number(cowQty) * cowRate;
            acc.buffaloTotalAmount += Number(buffaloQty) * buffaloRate;
            return acc;
        }, { cowQuantity: 0, buffaloQuantity: 0, cowTotalAmount: 0, buffaloTotalAmount: 0 });
        
        const milkTotalAmount = milkTotals.cowTotalAmount + milkTotals.buffaloTotalAmount;

        const productTotals = filteredProductEntries.reduce((acc, entry) => {
            const due = Number(entry.price) - (Number(entry.paidAmount) || 0);
            if (entry.productType === 'paneer') {
                acc.paneerQuantity += Number(entry.quantity);
                acc.paneerTotalAmount += due;
            } else if (entry.productType === 'ghee') {
                acc.gheeQuantity += Number(entry.quantity);
                acc.gheeTotalAmount += due;
            }
            acc.productsDueAmount += due;
            return acc;
        }, { paneerQuantity: 0, paneerTotalAmount: 0, gheeQuantity: 0, gheeTotalAmount: 0, productsDueAmount: 0 });

        const grandTotal = milkTotalAmount + productTotals.productsDueAmount;

        const timeline = [
            ...filteredMilkEntries.map(e => ({ type: 'milk' as const, data: e, date: e.date })),
            ...filteredProductEntries.map(e => ({ type: 'product' as const, data: e, date: e.date })),
        ].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return { monthlyTimeline: timeline, totals: { ...milkTotals, milkTotalAmount, ...productTotals, grandTotal }, calendarDays: days, effectiveRate: currentRate };
    }, [entries, productEntries, id, selectedDate, customer, getEffectiveRate]);
    
    const generatePdf = async (type: 'view' | 'share' | 'download') => {
        if (!customer) return;
        
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
        doc.text(`Rs. ${Number(totals.grandTotal).toFixed(2)}`, margin + 6, 74);

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

        const summaryRows = [];
        if (totals.cowQuantity > 0) {
            const cowRate = Number(effectiveRate?.cowRate ?? (totals.cowTotalAmount / totals.cowQuantity) || 0);
            summaryRows.push([
                `${safeT('totalCowMilk').toUpperCase()}:`, 
                `${Number(totals.cowQuantity).toFixed(2)} L x Rs. ${cowRate.toFixed(2)}`,
                `Rs. ${Number(totals.cowTotalAmount).toFixed(2)}`
            ]);
        }
        if (totals.buffaloQuantity > 0) {
            const buffRate = Number(effectiveRate?.buffaloRate ?? (totals.buffaloTotalAmount / totals.buffaloQuantity) || 0);
            summaryRows.push([
                `${safeT('totalBuffaloMilk').toUpperCase()}:`, 
                `${Number(totals.buffaloQuantity).toFixed(2)} L x Rs. ${buffRate.toFixed(2)}`,
                `Rs. ${Number(totals.buffaloTotalAmount).toFixed(2)}`
            ]);
        }
        
        summaryRows.push([{ content: '', colSpan: 3, styles: { minCellHeight: 2 } }]);
        summaryRows.push([safeT('subTotal').toUpperCase(), '', `Rs. ${Number(totals.milkTotalAmount).toFixed(2)}`]);

        if (totals.paneerTotalAmount !== 0) summaryRows.push([safeT('paneer').toUpperCase(), `${Number(totals.paneerQuantity).toFixed(1)} kg`, `${totals.paneerTotalAmount > 0 ? '+' : ''} Rs. ${Number(totals.paneerTotalAmount).toFixed(2)}`]);
        if (totals.gheeTotalAmount !== 0) summaryRows.push([safeT('ghee').toUpperCase(), `${Number(totals.gheeQuantity).toFixed(1)} kg`, `${totals.gheeTotalAmount > 0 ? '+' : ''} Rs. ${Number(totals.gheeTotalAmount).toFixed(2)}`]);
        
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
        doc.text(`Rs. ${Number(totals.grandTotal).toFixed(2)}`, pageWidth - margin - doc.getTextWidth(`Rs. ${Number(totals.grandTotal).toFixed(2)}`), currentY);

        const filename = `${customer.name.replace(/\s+/g, '_')}_Bill_${format(selectedDate, 'MMM_yyyy')}.pdf`;
        finalizePdf(doc, filename, type);
    };

    const generateThermalPdf = async (type: 'view' | 'share' | 'download') => {
        if (!customer) return;
        
        const receiptWidth = 80;
        const margin = 5;
        
        // Estimate height
        const entriesWithData = calendarDays.filter(d => entries.find(e => e.customerId === id && e.date === format(d, 'yyyy-MM-dd')));
        const estimatedHeight = 50 + (entriesWithData.length * 5) + 80;
        
        const doc = new jsPDF({ unit: 'mm', format: [receiptWidth, estimatedHeight] });
        let currentY = 10;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('MILKLEDGER', receiptWidth / 2, currentY, { align: 'center' });
        currentY += 5;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(safeT('monthlyMilkStatement').toUpperCase(), receiptWidth / 2, currentY, { align: 'center' });
        currentY += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(customer.name.toUpperCase(), margin, currentY);
        currentY += 5;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`${format(selectedDate, 'MMMM yyyy').toUpperCase()}`, margin, currentY);
        doc.text(`DATE: ${format(new Date(), 'dd/MM/yyyy')}`, receiptWidth - margin, currentY, { align: 'right' });
        currentY += 4;

        doc.setDrawColor(200);
        doc.line(margin, currentY, receiptWidth - margin, currentY);
        currentY += 5;

        // Entries Table - Include zero entries
        const tableData = calendarDays
            .map(date => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const entry = entries.find(e => e.customerId === id && e.date === dateStr);
                if (!entry) return null;
                
                const c = Number(entry.cowQuantity) || 0;
                const b = Number(entry.buffaloQuantity) || 0;
                
                if (c + b === 0) return [format(date, 'dd MMM'), '-'];
                
                const qty = [];
                if (customer.milkTypes.includes('cow') && c > 0) qty.push(`${c}L(C)`);
                if (customer.milkTypes.includes('buffalo') && b > 0) qty.push(`${b}L(B)`);
                
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

        const addRow = (label: string, val: string, isBold = false) => {
            doc.setFont('helvetica', isBold ? 'bold' : 'normal');
            doc.text(label, margin, currentY);
            doc.text(val, receiptWidth - margin, currentY, { align: 'right' });
            currentY += 5;
        };

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
        
        if (totals.paneerTotalAmount !== 0) {
            addRow(`${safeT('paneer')}: ${Number(totals.paneerQuantity).toFixed(1)}kg`, `₹${Number(totals.paneerTotalAmount).toFixed(0)}`, true);
        }
        if (totals.gheeTotalAmount !== 0) {
            addRow(`${safeT('ghee')}: ${Number(totals.gheeQuantity).toFixed(1)}kg`, `₹${Number(totals.gheeTotalAmount).toFixed(0)}`, true);
        }

        currentY += 3;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(safeT('grandTotal').toUpperCase(), receiptWidth / 2, currentY, { align: 'center' });
        currentY += 7;
        doc.setFontSize(16);
        doc.text(`₹${Number(totals.grandTotal).toFixed(0)}`, receiptWidth / 2, currentY, { align: 'center' });
        
        currentY += 10;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text(safeT('thankYou'), receiptWidth / 2, currentY, { align: 'center' });

        const filename = `${customer.name.replace(/\s+/g, '_')}_Receipt_${format(selectedDate, 'MMM_yyyy')}.pdf`;
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
        const availableYears = Array.from(new Set([...entries, ...productEntries].map(e => getYear(new Date(e.date)))));
        if (availableYears.length === 0) availableYears.push(getYear(new Date()));
        return availableYears.sort((a, b) => b - a);
    }, [entries, productEntries]);
    
    const months = useMemo(() => Array.from({length: 12}, (_, i) => ({value: i, name: format(new Date(2000, i), 'LLLL')})), []);

    if (!isDataLoaded) return <div className="container py-10 text-center animate-pulse text-slate-300 font-black tracking-widest uppercase">Loading statement...</div>;
    if (!customer) return <div className="p-10 text-center text-slate-900 font-black">{safeT('noCustomersFound')}</div>;

    const cowAvgRate = Number(effectiveRate?.cowRate ?? (totals.cowQuantity > 0 ? (totals.cowTotalAmount / totals.cowQuantity) : 0) || 0);
    const buffaloAvgRate = Number(effectiveRate?.buffaloRate ?? (totals.buffaloQuantity > 0 ? (totals.buffaloTotalAmount / totals.buffaloQuantity) : 0) || 0);

    return (
        <div className="container py-4 max-w-3xl page-transition">
            <Link href="/summary" className="text-[9px] font-black text-secondary hover:text-primary flex items-center gap-1 mb-2 uppercase tracking-widest transition-colors">
                <ChevronLeft className="w-3 h-3"/> {safeT('backToSummary')}
            </Link>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 px-1 gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{customer.name}</h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{safeT('monthlySummary')}</p>
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

            <Card className="mb-6 rounded-2xl overflow-hidden border-0 shadow-xl bg-slate-900 text-white p-5 relative">
                <div className="absolute top-0 right-0 p-4 opacity-[0.06] pointer-events-none"><Milk className="h-24 w-24" /></div>
                
                <div className="relative z-10 flex justify-between items-start mb-2">
                    <div className="flex-1">
                        <p className="text-white/40 font-black text-[10px] uppercase tracking-widest flex flex-wrap gap-x-2">
                            {totals.cowQuantity > 0 && <span>{Number(totals.cowQuantity).toFixed(2)}L {safeT('cow')} @ ₹{cowAvgRate.toFixed(0)}</span>}
                            {totals.cowQuantity > 0 && totals.buffaloQuantity > 0 && <span>+</span>}
                            {totals.buffaloQuantity > 0 && <span>{Number(totals.buffaloQuantity).toFixed(2)}L {safeT('buffalo')} @ ₹{buffaloAvgRate.toFixed(0)}</span>}
                            {(totals.productsDueAmount !== 0) && <span>+ Extras</span>}
                        </p>
                    </div>
                    <Button 
                        onClick={() => setRateDialogOpen(true)}
                        variant="outline" 
                        size="sm" 
                        className="h-8 px-2.5 rounded-lg border-white/20 bg-white/5 text-[10px] font-black uppercase text-primary hover:bg-white/10 transition-all active:scale-95 shadow-lg relative z-20"
                    >
                        <TrendingUp className="mr-1.5 h-3 w-3" />
                        {t('changeRate')}
                    </Button>
                </div>
                
                <h2 className="relative z-10 text-5xl font-black tracking-tighter">₹{Number(totals.grandTotal).toFixed(2)}</h2>
                <p className="relative z-10 text-white/60 font-black text-[9px] uppercase tracking-[0.2em] mt-1">{safeT('grandTotal')}</p>

                <div className="relative z-10 flex gap-6 mt-4 border-t border-white/10 pt-4">
                    <div>
                        <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">{safeT('totalMilk')}</p>
                        <p className="text-sm font-bold">{(Number(totals.cowQuantity) + Number(totals.buffaloQuantity)).toFixed(2)} L</p>
                    </div>
                    {totals.productsDueAmount !== 0 && (
                        <div className="border-l border-white/10 pl-6">
                            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">{safeT('products')}</p>
                            <p className={cn("text-sm font-bold", totals.productsDueAmount > 0 ? "text-accent" : "text-emerald-400")}>
                                ₹{Number(totals.productsDueAmount).toFixed(0)}
                                {totals.productsDueAmount < 0 && <span className="text-[8px] ml-1 uppercase">({t('advanceAmount')})</span>}
                            </p>
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
                                                {customer.milkTypes.includes('cow') && Number(milkEntry.cowQuantity) > 0 && `${milkEntry.cowQuantity}L `}
                                                {customer.milkTypes.includes('buffalo') && Number(milkEntry.buffaloQuantity) > 0 && `${milkEntry.buffaloQuantity}L`}
                                            </>
                                        )}
                                    </p>
                                </div>
                                
                                {dayProducts.map(p => {
                                    const due = Number(p.price) - (Number(p.paidAmount) || 0);
                                    return (
                                        <div key={p.id} className="glass-card flex items-center justify-between p-3 rounded-xl border-slate-50 bg-secondary/5 ml-4">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-secondary/10 p-2 rounded-lg"><Milk className="h-4 w-4 text-secondary" /></div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-[11px]">{safeT(p.productType as ProductType)}</p>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total: ₹{Number(p.price).toFixed(0)}</p>
                                                        {Number(p.paidAmount) > 0 && (
                                                            <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                                                                <CreditCard className="h-2 w-2" /> Paid: ₹{Number(p.paidAmount).toFixed(0)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-slate-900 text-sm">{Number(p.quantity).toFixed(1)}kg</p>
                                                <p className={cn("text-[9px] font-black uppercase tracking-tighter", due <= 0 ? "text-emerald-500" : "text-rose-500")}>
                                                    {due <= 0 ? (due < 0 ? `Adv: ₹${Math.abs(due)}` : "Paid") : `Due: ₹${due}`}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
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

            <RateChangeDialog
                open={rateDialogOpen}
                onOpenChange={setRateDialogOpen}
                entityId={id}
                type="customer"
            />
        </div>
    );
}
