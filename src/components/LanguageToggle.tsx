
"use client"

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppContext } from "@/context/AppContext";
import { Languages, Check } from "lucide-react";

export function LanguageToggle() {
  const { language, setLanguage, t } = useAppContext();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10">
          <Languages className="h-[1.4rem] w-[1.4rem] text-secondary" />
          <span className="sr-only">{t('language')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px] rounded-xl border-2">
        <DropdownMenuItem onSelect={() => setLanguage("en")} className="flex items-center justify-between p-3 font-bold">
          <span>{t('english')}</span>
          {language === 'en' && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setLanguage("hi")} className="flex items-center justify-between p-3 font-bold">
          <span>{t('hindi')}</span>
          {language === 'hi' && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setLanguage("hinglish")} className="flex items-center justify-between p-3 font-bold">
          <span>{t('hinglish')}</span>
          {language === 'hinglish' && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
