"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Save, Info } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface OrderableItemProps {
  id: string;
  name: string;
  order: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

function OrderableItem({ id, name, order, onMoveUp, onMoveDown, isFirst, isLast }: OrderableItemProps) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 mb-2 bg-white border rounded-xl border-slate-100 shadow-sm group hover:border-primary/20 transition-colors">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-md text-primary hover:bg-white hover:shadow-sm disabled:opacity-20 transition-all"
            onClick={onMoveUp}
            disabled={isFirst}
            title="Move Up"
          >
            <ChevronUp className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-md text-primary hover:bg-white hover:shadow-sm disabled:opacity-20 transition-all"
            onClick={onMoveDown}
            disabled={isLast}
            title="Move Down"
          >
            <ChevronDown className="h-5 w-5" />
          </Button>
        </div>
        <div className="min-w-0">
          <span className="font-black text-slate-700 text-sm truncate block">{name}</span>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Pos: {order + 1}</p>
        </div>
      </div>
      
      <Badge variant="outline" className="text-[9px] font-black text-slate-300 border-slate-100 uppercase tracking-tighter shrink-0">
        Index: {order}
      </Badge>
    </div>
  );
}

interface ReorderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'customer' | 'farmer';
}

export function ReorderDialog({ open, onOpenChange, type }: ReorderDialogProps) {
  const { customers, farmers, updateCustomerOrder, updateFarmerOrder, t } = useAppContext();
  const [items, setItems] = useState<{ id: string; name: string; order: number }[]>([]);

  useEffect(() => {
    if (open) {
      const source = type === 'customer' ? customers : farmers;
      // Pull directly from source, which AppContext ensures is sorted by 'order'
      setItems(source.map((i, idx) => ({ id: i.id, name: i.name, order: i.order ?? idx })));
    }
  }, [open, type, customers, farmers]);

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setItems((prev) => {
      const newItems = [...prev];
      [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
      // Re-assign order based on new positions
      return newItems.map((item, idx) => ({ ...item, order: idx }));
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    setItems((prev) => {
      const newItems = [...prev];
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
      // Re-assign order based on new positions
      return newItems.map((item, idx) => ({ ...item, order: idx }));
    });
  };

  const handleSave = () => {
    const orderedIds = items.map(i => i.id);
    if (type === 'customer') {
      updateCustomerOrder(orderedIds);
    } else {
      updateFarmerOrder(orderedIds);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-[95vw] rounded-[32px] p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-6 pb-4 bg-slate-50 border-b">
          <DialogTitle className="text-xl font-black text-slate-900">{t('manageEntryOrder')}</DialogTitle>
          <DialogDescription className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
            {type === 'customer' ? t('customers') : t('farmers')} • {t('dragToReorder')}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-white p-4">
          <div className="mb-4 flex items-start gap-2 bg-blue-50/50 p-3 rounded-2xl border border-blue-100">
             <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
             <p className="text-[10px] font-bold text-blue-600 leading-normal uppercase">
               The order you set here is the exact route order used for daily entries and reports. Use arrows to move items.
             </p>
          </div>

          <ScrollArea className="h-[50vh] pr-1">
            <div className="space-y-1">
              {items.map((item, index) => (
                <OrderableItem 
                  key={item.id} 
                  id={item.id} 
                  name={item.name} 
                  order={index} 
                  onMoveUp={() => handleMoveUp(index)}
                  onMoveDown={() => handleMoveDown(index)}
                  isFirst={index === 0}
                  isLast={index === items.length - 1}
                />
              ))}
              {items.length === 0 && (
                <div className="py-10 text-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">
                  List is empty
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t flex flex-row gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="flex-1 h-12 rounded-2xl font-black text-slate-500 border-slate-200"
          >
            {t('cancel')}
          </Button>
          <Button 
            onClick={handleSave} 
            className="flex-1 h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black shadow-lg shadow-primary/20"
          >
            <Save className="mr-2 h-4 w-4" />
            {t('saveOrder')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
