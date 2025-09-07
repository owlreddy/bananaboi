// Intelligent Image Blending Flow
'use server';
/**
 * @fileOverview A flow that intelligently blends multiple images based on AI analysis of their content and associated prompts.
 *
 * - intelligentImageBlending - A function that handles the image blending process.
 * - IntelligentImageBlendingInput - The input type for the intelligentImageBlending function.
 * - IntelligentImageBlendingOutput - The return type for the intelligentImageBlending function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntelligentImageBlendingInputSchema = z.object({
  imageNodes: z
    .array(
      z.object({
        imageDataUri: z
          .string()
          .describe(
            "A photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
          ),
        prompt: z.string().describe('The prompt associated with the image.'),
      })
    )
    .describe('An array of image nodes with image data URIs and associated prompts.'),
  blendingInstructions: z
    .string()
    .describe(
      'Instructions on how to blend the images, considering content and prompts.'
    ),
});
export type IntelligentImageBlendingInput = z.infer<
  typeof IntelligentImageBlendingInputSchema
>;

const IntelligentImageBlendingOutputSchema = z.object({
  compositeImage: z
    .string()
    .describe(
      'The blended composite image as a data URI in base64 format.'
    ),
});
export type IntelligentImageBlendingOutput = z.infer<
  typeof IntelligentImageBlendingOutputSchema
>;

export async function intelligentImageBlending(
  input: IntelligentImageBlendingInput
): Promise<IntelligentImageBlendingOutput> {
  return intelligentImageBlendingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentImageBlendingPrompt',
  input: {schema: IntelligentImageBlendingInputSchema},
  output: {schema: IntelligentImageBlendingOutputSchema},
  prompt: `You are an AI expert in blending images to create a cohesive composite.

You are provided with multiple images, their associated prompts, and blending instructions.

Images:
{{#each imageNodes}}
  Image {{@index}} Prompt: {{{this.prompt}}}
  {{media url=this.imageDataUri}}
{{/each}}

Blending Instructions: {{{blendingInstructions}}}

Based on the content of the images, their prompts, and the blending instructions, create a single composite image that seamlessly blends the provided images.

Ensure that the composite image is coherent and visually appealing.

Return the blended composite image as a data URI.

IMPORTANT: You must respond with a base64 encoded data URI representing the composite image.
`,
});

const intelligentImageBlendingFlow = ai.defineFlow(
  {
    name: 'intelligentImageBlendingFlow',
    inputSchema: IntelligentImageBlendingInputSchema,
    outputSchema: IntelligentImageBlendingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
