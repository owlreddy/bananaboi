// src/ai/flows/generate-initial-image-node.ts
'use server';
/**
 * @fileOverview Flow to generate an initial image node based on a text prompt.
 *
 * - generateInitialImageNode - A function that generates an image based on a text prompt.
 * - GenerateInitialImageNodeInput - The input type for the generateInitialImageNode function.
 * - GenerateInitialImageNodeOutput - The return type for the generateInitialImageNode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInitialImageNodeInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate the image from.'),
});
export type GenerateInitialImageNodeInput = z.infer<typeof GenerateInitialImageNodeInputSchema>;

const GenerateInitialImageNodeOutputSchema = z.object({
  imageDataUri: z.string().describe('The generated image as a data URI.'),
});
export type GenerateInitialImageNodeOutput = z.infer<typeof GenerateInitialImageNodeOutputSchema>;

export async function generateInitialImageNode(
  input: GenerateInitialImageNodeInput
): Promise<GenerateInitialImageNodeOutput> {
  return generateInitialImageNodeFlow(input);
}

const generateInitialImageNodeFlow = ai.defineFlow(
  {
    name: 'generateInitialImageNodeFlow',
    inputSchema: GenerateInitialImageNodeInputSchema,
    outputSchema: GenerateInitialImageNodeOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: [{text: `Generate an image of: ${input.prompt}`}],
      config: {
        responseModalities: ['IMAGE'],
      },
    });

    if (!media) {
      throw new Error('No image was generated.');
    }

    return {imageDataUri: media.url!};
  }
);
