'use server';
/**
 * @fileOverview A voice command parser for milk entries.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ParseCommandInputSchema = z.object({
  text: z.string().describe('The voice command text transcribed from speech.'),
  entities: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['customer', 'farmer'])
  })).describe('List of available customers and farmers to match against.')
});

export type ParseCommandInput = z.infer<typeof ParseCommandInputSchema>;

const ParseCommandOutputSchema = z.object({
  matches: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['customer', 'farmer']),
    milkType: z.enum(['cow', 'buffalo']),
    quantity: z.number().describe('The identified quantity in litres.')
  })).describe('Structured milk entry details found in the command.')
});

export type ParseCommandOutput = z.infer<typeof ParseCommandOutputSchema>;

export async function parseVoiceCommand(input: ParseCommandInput): Promise<ParseCommandOutput> {
  return parseCommandFlow(input);
}

const prompt = ai.definePrompt({
  name: 'parseCommandPrompt',
  input: { schema: ParseCommandInputSchema },
  output: { schema: ParseCommandOutputSchema },
  prompt: `You are a voice command assistant for a dairy management app.
Your job is to parse milk entry commands in English or Hindi and map them to specific customers or farmers.

Available Entities:
{{#each entities}}
- {{name}} (Type: {{type}}, ID: {{id}})
{{/each}}

User Command: "{{{text}}}"

Instructions:
1. Identify the name of the person in the command. Look for fuzzy matches in the list provided.
2. Identify the milk type (cow/गाय/gaay or buffalo/भैंस/bhains).
3. Identify the quantity (number). It can be decimal like 2.5.
4. If a command has multiple entries (e.g., "Amaan cow 2 and buffalo 1"), return multiple matches.
5. If you cannot find a match for a name, skip that part of the command.

Examples:
- "Amaan cow 2.5 litre" -> Match Amaan, milkType: cow, quantity: 2.5
- "रशीद भैंस 4 लीटर" -> Match Rashid, milkType: buffalo, quantity: 4
`,
});

const parseCommandFlow = ai.defineFlow(
  {
    name: 'parseCommandFlow',
    inputSchema: ParseCommandInputSchema,
    outputSchema: ParseCommandOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
