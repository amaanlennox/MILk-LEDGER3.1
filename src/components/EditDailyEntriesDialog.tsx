"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppContext } from "@/context/AppContext";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addDays, subDays, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight, Save, Calendar as CalendarIcon, Edit2, Plus, ArrowRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface EditDailyEntriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'customer' | 'farmer';
  id: string;
  selectedMonth: Date;
}

export function EditDailyEntriesDialog({ open, onOpenChange, type, id, selectedMonth }: EditDailyEntriesDialogProps) {
  const { 
    getCustomerById, 
    getFarmerById, 
    entries, 
    farmerEntries, 
    addOrUpdateEntry, 
    addOrUpdateFarmerEntry, 
    getLatestPreviousQuantities,
    getLatestPreviousFarmerQuantities,
    t 
  } = useAppContext();
  
  const { toast } = useToast();
  
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [editDate, setEditDate] = useState<Date | null>(null);
  
  const [cowQuantity, setCowQuantity] = useState(0);
  const [buffaloQuantity, setBuffaloQuantity] = useState(0);
  const [isNoMilk, setIsNoMilk] = useState(false);

  const sessionDefaultsRef = useRef<{ cow: number, buffalo: number } | null>(null);

  const entity = useMemo(() => {
    return type === 'customer' ? getCustomerById(id) : getFarmerById(id);
  }, [type, id, getCustomerById, getFarmerById]);

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    return eachDayOfInterval({ start, end });
  }, [selectedMonth]);

  const getDayEntry = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (type === 'customer') {
      return entries.find(e => e.customerId === id && e.date === dateStr);
    } else {
      return farmerEntries.find(e => e.farmerId === id && e.date === dateStr);
    }
  };

  const loadEntryForDate = (date: Date) => {
    const entry = getDayEntry(date);
    const dateStr = format(date, 'yyyy-MM-dd');
    if (entry) {
      setCowQuantity(Number(entry.cowQuantity) || 0);
      setBuffaloQuantity(Number(entry.buffaloQuantity) || 0);
      setIsNoMilk((Number(entry.cowQuantity) || 0) + (Number(entry.buffaloQuantity) || 0) === 0);
    } else if (entity) {
      if (sessionDefaultsRef.current) {
        setCowQuantity(sessionDefaultsRef.current.cow);
        setBuffaloQuantity(sessionDefaultsRef.current.buffalo);
      } else {
        // AUTO-FILL FROM PREVIOUS
        const prev = type === 'customer' 
            ? getLatestPreviousQuantities(entity.id, dateStr)
            : getLatestPreviousFarmerQuantities(entity.id, dateStr);

        if (prev) {
            setCowQuantity(prev.cow);
            setBuffaloQuantity(prev.buffalo);
        } else {
            const milkTypes = entity.milkTypes || [];
            setCowQuantity(milkTypes.includes('cow') ? (entity.defaultCowQuantity ?? 0) : 0);
            setBuffaloQuantity(milkTypes.includes('buffalo') ? (entity.defaultBuffaloQuantity ?? 0) : 0);
        }
      }
      setIsNoMilk(false);
    }
    setEditDate(date);
    setView('edit');
  };

  const handleSave = (silent = false) => {
    if (!editDate || !entity) return;
    
    const dateStr = format(editDate, 'yyyy-MM-dd');
    const finalCow = isNoMilk ? 0 : cowQuantity;
    const finalBuffalo = isNoMilk ? 0 : buffaloQuantity;

    const entryData = {
        date: dateStr,
        cowQuantity: finalCow,
        cowRate: entity.cowRate || 0,
        buffaloQuantity: finalBuffalo,
        buffaloRate: entity.buffaloRate || 0,
    };

    if (type === 'customer') {
        addOrUpdateEntry({ ...entryData, customerId: entity.id });
    } else {
        addOrUpdateFarmerEntry({ ...entryData, farmerId: entity.id });
    }

    sessionDefaultsRef.current = {
        cow: finalCow,
        buffalo: finalBuffalo
    };

    if (!silent) {
        toast({ title: t('save'), description: `Entry for ${format(editDate, 'dd MMM')} saved.` });
    }
  };

  const handleSaveAndNext = () => {
    handleSave(true);
    if (!editDate) return;
    
    const nextDay = addDays(editDate, 1);
    const end = endOfMonth(selectedMonth);

    if (nextDay <= end) {
        loadEntryForDate(nextDay);
    } else {
        toast({ title: t('save'), description: "Reached the end of this month." });
        setView('list');
    }
  };

  useEffect(() => {
    if (open) {
        setView('list');
        sessionDefaultsRef.current = null;
    }
  }, [open]);

  if (!entity) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-[95vw] rounded-3xl p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-6 pb-4 bg-slate-50 border-b">
          <div className="flex justify-between items-start">
             <div>
                <DialogTitle className="text-xl font-black text-slate-900">{t('editDailyEntries')}</DialogTitle>
                <DialogDescription className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
                    {entity.name} • {format(selectedMonth, 'MMMM yyyy')}
                </DialogDescription>
             </div>
             {view === 'edit' && (
                <Button variant="ghost" size="sm" onClick={() => setView('list')} className="h-8 text-[10px] font-black uppercase tracking-tighter">
                   Back to List
                </Button>
             )}
          </div>
        </DialogHeader>

        <div className="bg-white">
          {view === 'list' ? (
            <ScrollArea className="h-[60vh] px-4 py-2">
              <div className="space-y-2 pb-6">
                {daysInMonth.map(day => {
                  const entry = getDayEntry(day);
                  const isZero = entry && (Number(entry.cowQuantity) + Number(entry.buffaloQuantity) === 0);

                  return (
                    <div 
                        key={day.toISOString()} 
                        onClick={() => loadEntryForDate(day)}
                        className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all cursor-pointer group active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-3">
                         <div className="text-center w-10">
                            <p className="text-[10px] font-black text-slate-400 uppercase leading-none">{format(day, 'EEE')}</p>
                            <p className="text-lg font-black text-slate-900">{format(day, 'dd')}</p>
                         </div>
                         <div className="h-8 w-px bg-slate-100 mx-1" />
                         <div>
                            {entry ? (
                                <div className="flex gap-3">
                                    {(entity.milkTypes || []).includes('cow') && (
                                        <div className="text-[10px]">
                                            <span className="font-bold text-slate-400 uppercase mr-1">C</span>
                                            <span className="font-black text-slate-900">{Number(entry.cowQuantity).toFixed(2)}L</span>
                                        </div>
                                    )}
                                    {(entity.milkTypes || []).includes('buffalo') && (
                                        <div className="text-[10px]">
                                            <span className="font-bold text-slate-400 uppercase mr-1">B</span>
                                            <span className="font-black text-slate-900">{Number(entry.buffaloQuantity).toFixed(2)}L</span>
                                        </div>
                                    )}
                                    {isZero && <span className="text-[10px] font-black text-rose-500 uppercase">{t('noMilk')}</span>}
                                </div>
                            ) : (
                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{t('noEntryRecorded')}</p>
                            )}
                         </div>
                      </div>
                      
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-slate-300 group-hover:text-primary group-hover:bg-primary/5">
                        {entry ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between bg-slate-50 p-1 rounded-2xl border shadow-inner">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => editDate && loadEntryForDate(subDays(editDate, 1))}
                    disabled={editDate && isSameDay(editDate, startOfMonth(selectedMonth))}
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" className="h-9 px-4 font-black text-sm gap-2">
                            <CalendarIcon className="h-4 w-4 text-primary" />
                            {editDate && format(editDate, 'dd MMM yyyy')}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center">
                        <Calendar 
                            mode="single" 
                            selected={editDate || undefined} 
                            onSelect={(d) => d && loadEntryForDate(d)} 
                            initialFocus 
                        />
                    </PopoverContent>
                </Popover>

                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => editDate && loadEntryForDate(addDays(editDate, 1))}
                    disabled={editDate && isSameDay(editDate, endOfMonth(selectedMonth))}
                >
                    <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-4">
                  {!getDayEntry(editDate!) && (
                      <div className="p-2 bg-amber-50 border border-amber-100 rounded-xl text-center">
                          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{t('noEntryRecorded')} - Auto-filled</p>
                      </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {(entity.milkTypes || []).includes('cow') && (
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('cowMilk')} (L)</Label>
                            <Input 
                                type="number" 
                                step="0.01" 
                                value={isNoMilk || cowQuantity === 0 ? '' : cowQuantity} 
                                placeholder="0"
                                onChange={(e) => setCowQuantity(parseFloat(e.target.value) || 0)}
                                className="h-12 rounded-xl text-center text-xl font-black bg-slate-50 border-slate-200"
                                disabled={isNoMilk}
                            />
                        </div>
                    )}
                    {(entity.milkTypes || []).includes('buffalo') && (
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('buffaloMilk')} (L)</Label>
                            <Input 
                                type="number" 
                                step="0.01" 
                                value={isNoMilk || buffaloQuantity === 0 ? '' : buffaloQuantity} 
                                placeholder="0"
                                onChange={(e) => setBuffaloQuantity(parseFloat(e.target.value) || 0)}
                                className="h-12 rounded-xl text-center text-xl font-black bg-slate-50 border-slate-200"
                                disabled={isNoMilk}
                            />
                        </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 p-4 rounded-2xl bg-rose-50/50 border border-rose-100">
                    <Checkbox id="no-milk-edit" checked={isNoMilk} onCheckedChange={(val) => setIsNoMilk(!!val)} />
                    <Label htmlFor="no-milk-edit" className="text-sm font-black text-rose-600 uppercase tracking-widest">{t('noMilk')}</Label>
                  </div>
              </div>

              <div className="grid gap-3 pt-2">
                 <Button onClick={handleSaveAndNext} className="h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-base shadow-xl shadow-primary/20">
                    <Save className="mr-2 h-5 w-5" />
                    {t('saveAndNext')}
                    <ArrowRight className="ml-2 h-4 w-4 opacity-50" />
                 </Button>
                 <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" onClick={() => { handleSave(); setView('list'); }} className="h-12 rounded-xl font-black border-2">
                        {t('save')}
                    </Button>
                    <Button variant="ghost" onClick={() => setView('list')} className="h-12 rounded-xl font-black text-slate-400">
                        {t('cancel')}
                    </Button>
                 </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full h-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
             Close Workspace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
