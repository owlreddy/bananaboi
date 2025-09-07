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
import type {Part} from 'genkit';

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

const intelligentImageBlendingFlow = ai.defineFlow(
  {
    name: 'intelligentImageBlendingFlow',
    inputSchema: IntelligentImageBlendingInputSchema,
    outputSchema: IntelligentImageBlendingOutputSchema,
  },
  async input => {
    const promptParts: Part[] = [];

    // Add all the images first
    for (const imageNode of input.imageNodes) {
      promptParts.push({media: {url: imageNode.imageDataUri}});
    }

    // Then add the blending instructions
    promptParts.push({text: input.blendingInstructions});
    
    // Add the prompts from the individual images as context
    input.imageNodes.forEach((node, index) => {
      promptParts.push({text: `Context for image ${index}: ${node.prompt}`});
    });

    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: promptParts,
      config: {
        responseModalities: ['IMAGE'],
      },
    });

    if (!media) {
      throw new Error('No composite image was generated.');
    }

    return {compositeImage: media.url!};
  }
);
