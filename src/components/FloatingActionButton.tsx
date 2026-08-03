"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Copy, Zap, X, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/context/AppContext";
import { QuickSaleDialog } from "./QuickSaleDialog";
import { LeftoverSaleDialog } from "./LeftoverSaleDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export function FloatingActionButton() {
  const { t, copyYesterdayEntries } = useAppContext();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  
  // Dialog states
  const [quickSaleDialogOpen, setQuickSaleDialogOpen] = useState(false);
  const [leftoverSaleDialogOpen, setLeftoverSaleDialogOpen] = useState(false);
  const [copyConfirmOpen, setCopyConfirmOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  // Safety cleanup for body lock issues (common in Radix/Shadcn when switching between modals)
  useEffect(() => {
    if (!quickSaleDialogOpen && !leftoverSaleDialogOpen && !copyConfirmOpen && !isOpen) {
      const timeout = setTimeout(() => {
        // If no modal is detected in the DOM but pointer-events is still none
        if (!document.querySelector('[role="dialog"]') && !document.querySelector('[data-radix-menu-content]')) {
          document.body.style.pointerEvents = "auto";
          document.body.style.overflow = "auto";
        }
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [quickSaleDialogOpen, leftoverSaleDialogOpen, copyConfirmOpen, isOpen]);

  const actions = [
    { 
        icon: ShoppingBag, 
        label: t('quickSale'), 
        onClick: () => { setQuickSaleDialogOpen(true); setIsOpen(false); },
        color: "bg-primary text-white" 
    },
    { 
        icon: Zap, 
        label: t('leftoverSale'), 
        onClick: () => { setLeftoverSaleDialogOpen(true); setIsOpen(false); },
        color: "bg-amber-500 text-white" 
    },
    { 
        icon: Copy, 
        label: t('copyYesterday'), 
        onClick: () => { setCopyConfirmOpen(true); setIsOpen(false); },
        color: "bg-emerald-600 text-white" 
    },
  ];

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 pointer-events-none">
        <div className={cn(
          "flex flex-col items-end gap-3 transition-all duration-300 origin-bottom transform-gpu mb-2",
          isOpen ? "scale-100 opacity-100 pointer-events-auto" : "scale-90 opacity-0 invisible pointer-events-none"
        )}>
          {actions.map((action, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="bg-white px-3 py-1.5 rounded-lg shadow-md text-xs font-black text-slate-800 border border-muted whitespace-nowrap premium-shadow">
                {action.label}
              </span>
              <Button
                size="icon"
                className={cn("w-12 h-12 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95", action.color)}
                onClick={action.onClick}
              >
                <action.icon className="w-5 h-5" />
              </Button>
            </div>
          ))}
        </div>

        <Button
          size="icon"
          onClick={toggleMenu}
          className={cn(
            "w-14 h-14 rounded-full shadow-2xl transition-all duration-300 active:scale-90 pointer-events-auto transform-gpu",
            isOpen ? "bg-white text-slate-800 hover:bg-muted rotate-90" : "bg-primary text-white hover:bg-primary/90"
          )}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-7 h-7" />}
        </Button>
      </div>

      <QuickSaleDialog open={quickSaleDialogOpen} onOpenChange={setQuickSaleDialogOpen} />
      <LeftoverSaleDialog open={leftoverSaleDialogOpen} onOpenChange={setLeftoverSaleDialogOpen} date={new Date()} />

      <AlertDialog open={copyConfirmOpen} onOpenChange={setCopyConfirmOpen}>
        <AlertDialogContent className="rounded-2xl max-w-[90vw]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black">{t('copyYesterday')}</AlertDialogTitle>
            <AlertDialogDescription className="text-base font-medium">
                {t('copyYesterdayConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 mt-4">
            <AlertDialogCancel className="flex-1 rounded-xl h-12 mt-0 font-bold border-2">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction 
                onClick={() => { 
                    copyYesterdayEntries(new Date()); 
                    setCopyConfirmOpen(false); 
                    toast({ title: t('save'), description: t('copySuccess') });
                }} 
                className="flex-1 rounded-xl h-12 bg-primary hover:bg-primary/90 font-bold"
            >
              {t('proceed')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
