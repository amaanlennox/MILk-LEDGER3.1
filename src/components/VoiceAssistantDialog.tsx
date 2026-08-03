"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAppContext } from "@/context/AppContext";
import { Mic, MicOff, X, Loader2, Cpu, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { processVoiceCommand, type VoiceAssistantOutput } from "@/ai/flows/voice-assistant-flow";

interface VoiceAssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VoiceAssistantDialog({ open, onOpenChange }: VoiceAssistantDialogProps) {
  const { t, language } = useAppContext();
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [lastIntent, setLastIntent] = useState<VoiceAssistantOutput | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = (language === "hi" || language === "hinglish") ? "hi-IN" : "en-IN";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const last = event.results.length - 1;
        const text = event.results[last][0].transcript.trim();
        
        setTranscript(text);

        // Wake word check: "Jarvis" (case-insensitive)
        if (text.toLowerCase().startsWith("jarvis")) {
          const command = text.slice(6).trim(); 
          handleAssistantCommand(command);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech' || event.error === 'aborted') return;
        console.warn("Jarvis Speech Recognition Notice:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        if (open && isListening && !isProcessing) {
           try { recognition.start(); } catch(e) {}
        } else {
           setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    }
  }, [open, language, isListening, isProcessing]);

  const toggleAssistant = () => {
    if (isListening) {
      setIsListening(false);
      recognitionRef.current?.stop();
      speak("Jarvis turning off.");
    } else {
      setTranscript("");
      setReply("");
      setLastIntent(null);
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        speak("Jarvis is listening.");
      } catch (e) {}
    }
  };

  const handleAssistantCommand = async (command: string) => {
    if (!command) {
        const response = "Ji, boliye?";
        setReply(`Jarvis: ${response}`);
        speak(response);
        return;
    }

    try {
      setIsProcessing(true);
      // recognitionRef.current?.stop(); // Pause listening while AI processes

      const result = await processVoiceCommand({ text: command });
      setLastIntent(result);
      setReply(`Jarvis: ${result.explanation}`);
      speak(result.explanation);

      // ACTION ENGINE
      setTimeout(() => {
        executeIntent(result);
      }, 500);

    } catch (error) {
      console.error("AI Error:", error);
      const errorMsg = "Kuch technical problem aa gayi hai.";
      setReply(`Jarvis: ${errorMsg}`);
      speak(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const executeIntent = (aiResult: VoiceAssistantOutput) => {
    const { intent, target } = aiResult;

    if (intent === 'unknown') return;

    if (intent === 'navigation') {
      if (target === 'products') router.push("/products");
      else router.push("/");
      onOpenChange(false);
    } else if (intent === 'customer_search') {
      router.push("/customers");
      onOpenChange(false);
    } else if (intent === 'farmer_search') {
      router.push("/farmers");
      onOpenChange(false);
    } else if (intent === 'summary_open') {
      router.push("/summary");
      onOpenChange(false);
    } else if (intent === 'settings_open') {
      router.push("/settings");
      onOpenChange(false);
    } else if (intent === 'help') {
      // Stay on page and just speak explanation
    }
  };

  const speak = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const voices = window.speechSynthesis.getVoices();
      let selectedVoice = voices.find(v => v.lang.toLowerCase().startsWith('hi'));
      if (!selectedVoice) selectedVoice = voices.find(v => v.lang.toLowerCase().startsWith('en-in'));

      if (selectedVoice) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  useEffect(() => {
    if (!open && isListening) {
      setIsListening(false);
      recognitionRef.current?.stop();
      if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    }
  }, [open, isListening]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[32px] border-slate-200 overflow-hidden p-0">
        <DialogHeader className="p-6 bg-[#02182B] text-white">
          <DialogTitle className="text-2xl font-black flex items-center gap-3">
            <Mic className="h-6 w-6 text-primary" />
            {t('voiceAssistant')}
          </DialogTitle>
          <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
            {t('voiceAssistantInstruction')}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 flex flex-col items-center gap-6 bg-white">
            <div className="relative">
                <div className={cn(
                    "absolute -inset-4 rounded-full blur-xl transition-all duration-500",
                    isListening ? "bg-primary/20 scale-125 animate-pulse" : "bg-transparent scale-100"
                )} />
                <Button 
                    onClick={toggleAssistant}
                    disabled={isProcessing}
                    className={cn(
                        "w-20 h-20 rounded-full shadow-2xl transition-all duration-300 relative z-10",
                        isListening ? "bg-primary text-white scale-110" : "bg-slate-100 text-slate-400"
                    )}
                >
                    {isProcessing ? (
                        <Loader2 className="h-10 w-10 animate-spin" />
                    ) : isListening ? (
                        <div className="relative">
                            <Mic className="h-8 w-8" />
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                        </div>
                    ) : <MicOff className="h-8 w-8" />}
                </Button>
            </div>

            <div className="w-full space-y-4">
                <div className="flex flex-col items-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100">
                      <div className={cn("h-1.5 w-1.5 rounded-full", isListening ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                          {isProcessing ? t('processing') : isListening ? t('jarvisListening') : t('jarvisOff')}
                      </span>
                  </div>
                </div>

                <div className="space-y-3">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 min-h-[70px] relative">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('currentCommand')}</p>
                        <p className="text-slate-900 font-bold italic text-sm">
                            {transcript ? `"${transcript}"` : "Say 'Jarvis' to start..."}
                        </p>
                    </div>

                    <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 min-h-[70px] relative overflow-hidden">
                        <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-1">{t('assistantReply')}</p>
                        <p className="text-[#02182B] font-black text-base leading-tight">
                            {reply || "..."}
                        </p>
                    </div>

                    {lastIntent && (
                        <div className="bg-slate-900 rounded-2xl p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Cpu className="h-3 w-3 text-emerald-400" />
                                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Intent Detected:</span>
                                <span className="text-[9px] font-black text-emerald-400 uppercase">{lastIntent.intent}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Activity className="h-3 w-3 text-primary" />
                                <span className="text-[9px] font-black text-primary">{(lastIntent.confidence * 100).toFixed(0)}%</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t flex flex-row gap-3">
            <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1 h-11 rounded-xl font-black text-slate-500 border-slate-200 bg-white text-xs"
            >
                {t('cancel')}
            </Button>
            {isListening && (
                <Button 
                    variant="destructive" 
                    onClick={toggleAssistant}
                    className="flex-1 h-11 rounded-xl font-black shadow-lg shadow-rose-200 text-xs"
                >
                    <X className="mr-2 h-4 w-4" />
                    {t('stopAssistant')}
                </Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
