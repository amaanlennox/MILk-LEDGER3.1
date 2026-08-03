
"use client";

import { useRef, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Home, Upload, Share2, Trash2, ShieldCheck, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { 
    t, 
    customers, 
    entries, 
    farmers, 
    farmerEntries, 
    farmerPayments, 
    productEntries, 
    leftoverSales, 
    language, 
    setLanguage,
    inAppRemindersEnabled, 
    setInAppRemindersEnabled, 
    restoreBackup, 
    resetAllData 
  } = useAppContext();
  
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backupFileContent, setBackupFileContent] = useState<any>(null);
  const [isImportAlertOpen, setIsImportAlertOpen] = useState(false);
  const [isResetAlertOpen, setIsResetAlertOpen] = useState(false);

  const handleShareBackup = async () => {
    const backupData = { 
      customers, entries, farmers, farmerEntries, farmerPayments, productEntries, leftoverSales, language, inAppRemindersEnabled 
    };
    const jsonString = JSON.stringify(backupData, null, 2);
    const filename = `MilkLedger_Backup_${format(new Date(), 'yyyy_MM_dd')}.json`;
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    let shared = false;

    if (typeof navigator !== 'undefined' && !!navigator.share) {
      try {
        const file = new File([blob], filename, { type: 'application/json' });
        const shareData = {
          files: [file],
          title: 'MilkLedger Data Backup',
          text: 'Restore your MilkLedger data with this file.'
        };

        const canShare = typeof navigator.canShare === 'function' && navigator.canShare(shareData);

        if (canShare) {
          await navigator.share(shareData);
          shared = true;
          toast({ title: t('exportSuccess') });
        }
      } catch (err) {
        console.error("Backup share failed", err);
      }
    }

    if (!shared) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ 
        title: t('exportSuccess'),
        description: "Backup file downloaded to device storage."
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result;
          if (typeof content === 'string') {
            const jsonData = JSON.parse(content);
            setBackupFileContent(jsonData);
            setIsImportAlertOpen(true);
          }
        } catch (error) {
          toast({
            variant: "destructive",
            title: t('importError'),
            description: "The file could not be read or is not valid JSON.",
          });
        }
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleImportConfirm = () => {
    if (backupFileContent) {
      const success = restoreBackup(backupFileContent);
      if (success) {
        toast({ title: t('importSuccess') });
      } else {
        toast({ variant: "destructive", title: t('importError') });
      }
    }
    setIsImportAlertOpen(false);
    setBackupFileContent(null);
  };

  return (
    <div className="container mx-auto p-4 sm:p-8 max-w-2xl page-transition">
      <div className="flex justify-between items-center mb-10">
        <div>
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-1">
            <Home className="w-4 h-4"/> {t('backToHome')}
          </Link>
          <h1 className="text-4xl font-black text-secondary">{t('settings')}</h1>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="glass-card border-2">
          <CardHeader>
            <CardTitle className="text-2xl font-black text-secondary">{t('language')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label className="text-base font-bold text-muted-foreground block mb-2">
              {t('changeLanguage')}
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button 
                variant={language === 'en' ? 'default' : 'outline'} 
                onClick={() => setLanguage('en')}
                className={cn("h-14 rounded-xl font-black text-base transition-all", language === 'en' && "ring-4 ring-primary/20")}
              >
                {language === 'en' && <Check className="mr-2 h-5 w-5" />}
                English
              </Button>
              <Button 
                variant={language === 'hi' ? 'default' : 'outline'} 
                onClick={() => setLanguage('hi')}
                className={cn("h-14 rounded-xl font-black text-base transition-all", language === 'hi' && "ring-4 ring-primary/20")}
              >
                {language === 'hi' && <Check className="mr-2 h-5 w-5" />}
                हिन्दी
              </Button>
              <Button 
                variant={language === 'hinglish' ? 'default' : 'outline'} 
                onClick={() => setLanguage('hinglish')}
                className={cn("h-14 rounded-xl font-black text-base transition-all", language === 'hinglish' && "ring-4 ring-primary/20")}
              >
                {language === 'hinglish' && <Check className="mr-2 h-5 w-5" />}
                Hinglish
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-2">
          <CardHeader>
            <CardTitle className="text-2xl font-black text-secondary">{t('dataManagement')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-2xl bg-muted/30">
              <h3 className="font-black text-lg text-secondary mb-1">{t('shareBackup')}</h3>
              <p className="text-muted-foreground mb-4">{t('backupDescription')}</p>
              <Button onClick={handleShareBackup} className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90">
                <Share2 className="mr-2 h-6 w-6" />
                {t('shareBackup')}
              </Button>
            </div>
            
            <div className="p-4 rounded-2xl border-2 border-dashed">
              <h3 className="font-black text-lg text-secondary mb-1">{t('importData')}</h3>
              <p className="text-muted-foreground mb-4">{t('restoreDescription')}</p>
              <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full h-14 rounded-2xl border-2">
                <Upload className="mr-2 h-6 w-6" />
                {t('importData')}
              </Button>
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="application/json" className="hidden" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-2">
          <CardHeader>
            <CardTitle className="text-2xl font-black text-secondary">{t('reminders')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="reminder-toggle" className="text-lg pr-4 flex-1 font-bold">
                {t('enableInAppReminders')}
                <p className="text-sm text-muted-foreground font-normal mt-1">{t('inAppRemindersDescription')}</p>
              </Label>
              <Switch id="reminder-toggle" checked={inAppRemindersEnabled} onCheckedChange={setInAppRemindersEnabled} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-destructive/30 border-2 overflow-hidden">
          <CardHeader className="bg-destructive/10">
            <CardTitle className="text-2xl font-black text-destructive flex items-center gap-2">
              <ShieldCheck className="h-7 w-7" />
              {t('dangerZone')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <h3 className="font-black text-lg text-secondary mb-1">{t('resetAppData')}</h3>
            <p className="text-muted-foreground mb-4">{t('resetDescription')}</p>
            <Button onClick={() => setIsResetAlertOpen(true)} variant="destructive" className="w-full h-14 rounded-2xl font-bold">
              <Trash2 className="mr-2 h-6 w-6" />
              {t('resetAppData')}
            </Button>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isImportAlertOpen} onOpenChange={setIsImportAlertOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black">{t('importWarningTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="text-lg">{t('importWarningDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="h-12 rounded-xl">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleImportConfirm} className="h-12 rounded-xl bg-primary">{t('proceed')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isResetAlertOpen} onOpenChange={setIsResetAlertOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black">{t('resetWarningTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="text-lg">{t('resetWarningDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="h-12 rounded-xl">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { resetAllData(); toast({ title: t('resetSuccess') }); setIsResetAlertOpen(false); }} className="h-12 rounded-xl bg-destructive">{t('proceed')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
