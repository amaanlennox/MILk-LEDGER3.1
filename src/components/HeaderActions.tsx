"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  PlusCircle, 
  ShoppingBag, 
  Zap, 
  Copy, 
  Mic,
  ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppContext } from "@/context/AppContext";
import { QuickSaleDialog } from "./QuickSaleDialog";
import { LeftoverSaleDialog } from "./LeftoverSaleDialog";
import { VoiceAssistantDialog } from "./VoiceAssistantDialog";
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

export function HeaderActions() {
  const { t, copyYesterdayEntries } = useAppContext();
  const { toast } = useToast();
  
  const [quickSaleOpen, setQuickSaleOpen] = useState(false);
  const [leftoverOpen, setLeftoverOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [copyConfirmOpen, setCopyConfirmOpen] = useState(false);

  // Global safety cleanup for body pointer-events
  useEffect(() => {
    if (!quickSaleOpen && !leftoverOpen && !assistantOpen && !copyConfirmOpen) {
      const timeout = setTimeout(() => {
        if (!document.querySelector('[role="dialog"]') && !document.querySelector('[data-radix-menu-content]')) {
          document.body.style.pointerEvents = "auto";
          document.body.style.overflow = "auto";
        }
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [quickSaleOpen, leftoverOpen, assistantOpen, copyConfirmOpen]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-9 px-3 gap-2 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all font-black text-xs uppercase tracking-widest">
            <PlusCircle className="h-4 w-4 text-primary" />
            <span className="hidden sm:inline">{t('actions')}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[220px] rounded-2xl border-slate-100 p-2 shadow-2xl bg-white">
          <DropdownMenuItem 
            onSelect={(e) => {
              e.preventDefault();
              setTimeout(() => setQuickSaleOpen(true), 150);
            }}
            className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer focus:bg-slate-50 font-bold text-sm text-[#02182B]"
          >
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <ShoppingBag className="h-4 w-4 text-primary" />
            </div>
            {t('quickSale')}
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onSelect={(e) => {
              e.preventDefault();
              setTimeout(() => setLeftoverOpen(true), 150);
            }}
            className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer focus:bg-slate-50 font-bold text-sm text-[#02182B]"
          >
            <div className="bg-amber-500/10 p-1.5 rounded-lg">
              <Zap className="h-4 w-4 text-amber-500" />
            </div>
            {t('leftoverSale')}
          </DropdownMenuItem>

          <DropdownMenuItem 
            onSelect={(e) => {
              e.preventDefault();
              setTimeout(() => setAssistantOpen(true), 150);
            }}
            className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer focus:bg-slate-50 font-bold text-sm text-[#02182B]"
          >
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <Mic className="h-4 w-4 text-primary" />
            </div>
            {t('voiceAssistant')}
          </DropdownMenuItem>

          <div className="h-px bg-slate-100 my-1 mx-1" />

          <DropdownMenuItem 
            onSelect={(e) => {
              e.preventDefault();
              setTimeout(() => setCopyConfirmOpen(true), 150);
            }}
            className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer focus:bg-slate-50 font-bold text-sm text-emerald-600"
          >
            <div className="bg-emerald-500/10 p-1.5 rounded-lg">
              <Copy className="h-4 w-4 text-emerald-600" />
            </div>
            {t('copyYesterday')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <QuickSaleDialog open={quickSaleOpen} onOpenChange={setQuickSaleOpen} />
      <LeftoverSaleDialog open={leftoverOpen} onOpenChange={setLeftoverOpen} date={new Date()} />
      <VoiceAssistantDialog open={assistantOpen} onOpenChange={setAssistantOpen} />

      <AlertDialog open={copyConfirmOpen} onOpenChange={setCopyConfirmOpen}>
        <AlertDialogContent className="rounded-[24px] max-w-[90vw] p-5">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-slate-900">{t('copyYesterday')}</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-slate-500">
                {t('copyYesterdayConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3 mt-4">
            <AlertDialogCancel className="flex-1 rounded-xl h-10 mt-0 font-black text-slate-700 border-slate-200 bg-slate-50">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction 
                onClick={() => { 
                    copyYesterdayEntries(new Date()); 
                    setCopyConfirmOpen(false); 
                    toast({ title: t('save'), description: t('copySuccess') });
                }} 
                className="flex-1 rounded-xl h-10 bg-primary hover:bg-primary/90 font-black text-white"
            >
              {t('proceed')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
