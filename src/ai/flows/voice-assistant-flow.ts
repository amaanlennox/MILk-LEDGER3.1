'use server';
/**
 * @fileOverview Intelligent intent detection for the Jarvis Voice Assistant.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VoiceAssistantInputSchema = z.object({
  text: z.string().describe('The user\'s voice command text.'),
});
export type VoiceAssistantInput = z.infer<typeof VoiceAssistantInputSchema>;

const VoiceAssistantOutputSchema = z.object({
  intent: z.enum([
    'navigation',
    'customer_search',
    'farmer_search',
    'summary_open',
    'settings_open',
    'help',
    'unknown'
  ]).describe('The primary intent of the user.'),
  target: z.string().optional().describe('The specific target or page for navigation intents.'),
  explanation: z.string().describe('A short Hinglish explanation of what the assistant will do.'),
  confidence: z.number().min(0).max(1).describe('A confidence score from 0 to 1.')
});
export type VoiceAssistantOutput = z.infer<typeof VoiceAssistantOutputSchema>;

export async function processVoiceCommand(input: VoiceAssistantInput): Promise<VoiceAssistantOutput> {
  return voiceAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'voiceAssistantPrompt',
  input: { schema: VoiceAssistantInputSchema },
  output: { schema: VoiceAssistantOutputSchema },
  prompt: `You are Jarvis, a professional voice assistant for MilkLedger, a dairy management app.
Your job is to parse user commands (in English or Hinglish) and return structured JSON.

Supported Intents & Examples:
- navigation: home, products, dashboard. ("home kholo", "products dikhao")
- customer_search: navigate to customer list. ("customers open karo", "grahak ki list dikhao")
- farmer_search: navigate to farmer list. ("farmers kholo", "suppliers dikhao")
- summary_open: navigate to monthly reports. ("monthly hisaab kholo", "reports dikhao")
- settings_open: navigate to app settings. ("setting page pe jao")
- help: explain capabilities. ("aap kya kar sakte ho?")

Rules:
1. Always return valid JSON.
2. If the user mentions a specific target for navigation like "home" or "products", set the target field.
3. The explanation should be a natural Hinglish response that the assistant will speak.

User Text: "{{{text}}}"`,
});

const voiceAssistantFlow = ai.defineFlow(
  {
    name: 'voiceAssistantFlow',
    inputSchema: VoiceAssistantInputSchema,
    outputSchema: VoiceAssistantOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
