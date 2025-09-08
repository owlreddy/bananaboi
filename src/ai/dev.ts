import { config } from 'dotenv';
config();

import '@/ai/flows/generate-initial-image-node.ts';
import '@/ai/flows/assisted-prompt-composition.ts';
import '@/ai/flows/intelligent-image-blending.ts';
import '@/ai/flows/edit-image.ts';
