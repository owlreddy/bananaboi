# Banana Boi: An Intuitive Node-Based AI Image Editor

## Problem Statement

Banana Boi is a node-based visual editor designed to make complex AI image generation and composition intuitive and accessible. The core challenge in creative AI is iterative refinement and the combination of multiple ideas. Traditional linear interfaces can be restrictive, making it difficult to experiment with different image combinations and edits in a non-destructive way.

This application leverages the multi-modal capabilities of the **Gemini 2.5 Flash Image** model to solve this problem. The model's key features are central to the app's workflow:
1.  **Text-to-Image Generation**: The "Generate" node uses Gemini to create initial visual concepts from simple text prompts.
2.  **Multi-Image Reasoning**: The "Output" node sends multiple source images along with a textual blending instruction to Gemini, which intelligently analyzes and combines them into a single, cohesive composite.
3.  **Prompt-Based Image Editing**: Every image in the graph can be iteratively refined. Gemini's ability to take an image and a text instruction as input allows for powerful, intuitive edits—like changing the style, adding elements, or altering the mood—without needing complex manual tools.

By structuring these powerful features into a visual, node-based graph, Banana Boi provides a fluid and experimental canvas for creative exploration.

## Attached Video Demo

[**Insert Link to Your Public Video Demo Here**]

*A brief walkthrough of Banana Boi, showcasing the creation of an image from scratch, blending it with an uploaded image, and applying several iterative edits to achieve a final composite piece.*

## Attached Public Project Link

[**Insert Link to Your Live Project or Public Code Repository Here**]

*Experience Banana Boi live or browse the source code to see how it works.*
