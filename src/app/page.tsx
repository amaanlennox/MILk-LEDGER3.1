"use client";

import { useMemo, useEffect, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { CalendarDays, Users, Settings, Tractor, Package, TrendingUp, ChevronRight, ChevronLeft } from "lucide-react";
import { format, subDays, addDays, isSameDay } from "date-fns";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { ReminderCard } from "@/components/ReminderCard";
import { FarmerReminderCard } from "@/components/FarmerReminderCard";
import { DailySummary } from "@/components/DailySummary";
import { MonthlyReport } from "@/components/MonthlyReport";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

function DailyStatus({ date }: { date: Date }) {
  const { customers, entries, farmers, farmerEntries, inAppRemindersEnabled, t } = useAppContext();

  const statusData = useMemo(() => {
    const dateString = format(date, 'yyyy-MM-dd');

    const pendingCustomers = customers.filter(customer => {
        const hasEntry = entries.some(e => e.customerId === customer.id && e.date === dateString);
        return !hasEntry;
    });

    const pendingFarmers = farmers.filter(farmer => {
        const hasEntry = farmerEntries.some(e => e.farmerId === farmer.id && e.date === dateString);
        return !hasEntry;
    });

    const hasAnyCustomerEntry = entries.some(e => e.date === dateString);
    const hasAnyFarmerEntry = farmerEntries.some(e => e.date === dateString);
    const anyEntryToday = hasAnyCustomerEntry || hasAnyFarmerEntry;
    
    const allPending = [
        ...pendingCustomers.map(c => ({...c, type: 'customer' as const})),
        ...pendingFarmers.map(f => ({...f, type: 'farmer' as const}))
    ];

    return { anyEntryToday, pendingEntities: allPending };
  }, [customers, entries, farmers, farmerEntries, date]);

  return (
    <div className="space-y-3 mb-1">
      {statusData.anyEntryToday ? (
        <>
            <DailySummary date={date} />
            
            {inAppRemindersEnabled && statusData.pendingEntities.length > 0 && (
                <div className="mt-2">
                  <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                       <TrendingUp className="h-3 w-3 text-secondary" />
                       {t('pendingEntries')}
                    </div>
                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[8px] font-black">
                        {statusData.pendingEntities.length}
                    </span>
                  </h2>
                  <Carousel opts={{ align: "start" }} className="w-full">
                    <CarouselContent className="-ml-2">
                      {statusData.pendingEntities.map((entity) => (
                        <CarouselItem key={`${entity.type}-${entity.id}`} className="pl-2 basis-full sm:basis-1/2">
                          {entity.type === 'customer' ? (
                              <ReminderCard customer={entity} date={date} />
                          ) : (
                              <FarmerReminderCard farmer={entity} date={date} />
                          )}
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                </div>
            )}
        </>
      ) : (
        <div className="mb-1">
            <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1 flex items-center gap-1.5">
                <CalendarDays className="h-3 w-3 text-primary" />
                {format(date, 'dd MMMM')}
            </h2>
            <Card className="bg-slate-50 flex items-center justify-center h-20 border-dashed border-2 border-slate-200 rounded-xl">
                <CardContent className="p-3 text-center">
                    <p className="text-slate-300 font-black text-[9px] uppercase tracking-widest">
                        {t('noEntriesForDate')}
                    </p>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}

const MilkCanLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white">
    <path d="M7 8V7C7 5.34315 8.34315 4 10 4H14C15.6569 4 17 5.34315 17 7V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <rect x="5" y="8" width="14" height="4" rx="1" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="2"/>
    <path d="M5 12V18C5 19.6569 6.34315 21 8 21H16C17.6569 21 19 19.6569 19 18V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export default function Home() {
  const { t, isDataLoaded } = useAppContext();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    setSelectedDate(new Date());
  }, []);

  if (!isDataLoaded || !selectedDate) {
    return (
      <div className="container py-4 animate-pulse space-y-3 bg-white min-h-screen">
        <Skeleton className="h-10 w-full rounded-xl bg-slate-50" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 rounded-xl bg-slate-50" />
          <Skeleton className="h-20 rounded-xl bg-slate-50" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pt-4 pb-20">
      <div className="container max-w-2xl page-transition space-y-3">
        <div className="flex justify-between items-center px-1">
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-none">MilkLedger</h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">{format(selectedDate, 'EEEE, dd MMMM')}</p>
          </div>
          <Link href="/settings">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-xl bg-slate-50 border-slate-200 shadow-sm">
              <Settings className="h-4 w-4 text-slate-400" />
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-between bg-slate-50 p-1 rounded-xl border border-slate-200 shadow-sm mx-1">
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-slate-400" onClick={() => setSelectedDate(subDays(selectedDate, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="h-7 px-2 font-black text-[10px] rounded-lg text-slate-900 hover:bg-slate-100">
                  <CalendarDays className="h-3 w-3 mr-1.5 text-primary" />
                  {format(selectedDate, 'dd MMM yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white border-slate-200" align="center">
                <Calendar mode="single" selected={selectedDate} onSelect={(d) => d && setSelectedDate(d)} initialFocus className="text-slate-900" />
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-slate-400" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {!isSameDay(selectedDate, new Date()) && (
            <Button variant="secondary" size="sm" className="h-7 rounded-lg font-black text-[8px] px-2 bg-primary text-white" onClick={() => setSelectedDate(new Date())}>
              {t('today')}
            </Button>
          )}
        </div>

        <DailyStatus date={selectedDate} />

        <div className="grid grid-cols-2 gap-3 px-1">
          <Link href="/daily-entry" className="block h-20 group">
            <Card className="p-3 border-0 bg-primary text-white active:scale-95 transition-all shadow-lg shadow-primary/20 h-full flex flex-col justify-between relative overflow-hidden rounded-xl">
              <div className="absolute top-0 right-0 p-2 opacity-10"><MilkCanLogo /></div>
              <div className="bg-white/20 p-1.5 rounded-lg w-fit"><MilkCanLogo /></div>
              <div>
                  <h2 className="text-sm font-black leading-tight">{t('dailyEntry')}</h2>
                  <p className="text-[8px] text-white/70 font-bold uppercase tracking-wide">{t('addTodaysMilk')}</p>
              </div>
            </Card>
          </Link>
          <Link href="/summary" className="block h-20 group">
            <Card className="p-3 border-0 bg-secondary text-white active:scale-95 transition-all shadow-lg shadow-secondary/20 h-full flex flex-col justify-between relative overflow-hidden rounded-xl">
              <div className="absolute top-0 right-0 p-2 opacity-10"><Package className="w-6 h-6" /></div>
              <div className="bg-white/20 p-1.5 rounded-lg w-fit"><Package className="w-6 h-6" /></div>
               <div>
                  <h2 className="text-sm font-black leading-tight">{t('monthlySummary')}</h2>
                  <p className="text-[8px] text-white/70 font-bold uppercase tracking-wide">{t('viewMonthlyReports')}</p>
              </div>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-2 px-1">
          {[
            { href: "/products", icon: Package, label: t('products'), color: "text-primary bg-primary/10" },
            { href: "/customers", icon: Users, label: t('customers'), color: "text-secondary bg-secondary/10" },
            { href: "/farmers", icon: Tractor, label: t('farmers'), color: "text-primary bg-primary/10" }
          ].map((item, i) => (
            <Link key={i} href={item.href}>
              <Card className="bg-slate-50 p-2 text-center rounded-xl border-slate-100 shadow-sm active:bg-slate-100 transition-colors">
                <div className={`p-1.5 rounded-lg w-fit mx-auto mb-1 ${item.color}`}>
                  <item.icon className="h-4 w-4" />
                </div>
                <h3 className="font-black text-[9px] text-slate-500 uppercase tracking-tight">{item.label}</h3>
              </Card>
            </Link>
          ))}
        </div>

        <Card className="bg-slate-50 overflow-hidden rounded-xl border-slate-100 shadow-sm mx-1">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="report" className="border-none">
              <AccordionTrigger className="px-3 h-10 hover:no-underline [&[data-state=open]>div>svg]:rotate-180">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-secondary" />
                  <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{t('monthlyReport')}</h2>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <MonthlyReport />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      </div>
    </div>
  );
}
