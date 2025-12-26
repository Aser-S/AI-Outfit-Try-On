# API Setup Guide

## Google Generative AI Setup

1. **Get your API key:**
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create a new API key
   - Copy the key

2. **Configure environment:**
   - Copy `.env.example` to `.env.local`
   - Replace `your_api_key_here` with your actual API key
   - Save the file

3. **Test the setup:**
   - Run `npm run dev`
   - Navigate to photo mode or measurement mode
   - Check browser console for initialization logs
   - Upload images and test generation

## Debugging

The app includes comprehensive logging:
- `[OUTFIT-API]` - API route logs
- `[PHOTO-MODE]` - Photo mode component logs  
- `[MEASUREMENT-MODE]` - Measurement mode component logs

## Features

### Photo Mode
- Upload your full-body photo + clothing items
- AI generates you wearing the clothes
- Download the result image
- Cost-optimized with single API call using collages

### Measurement Mode
- Enter body measurements (height, chest, waist, hip, leg height, shoulder width)
- Upload clothing items
- AI generates a mannequin with your measurements wearing the clothes
- Download the result image
- Kid-friendly (any height accepted)
- Privacy-focused (no weight required)

## Cost Optimization

The app uses a collage approach to minimize API costs:
- All images are combined into a single collage
- One API call per generation instead of multiple
- Higher quality images with better spacing
- Detailed prompts for better results

## Model Information

- **Model:** `gemini-2.5-flash-image`
- **Input:** Single collage image + detailed prompt
- **Output:** Generated outfit image
- **Safety:** Configured with high thresholds for content filtering

## Troubleshooting

### Photo Mode Issues
- Ensure body photo is full-body and clear
- Upload at least one clothing item
- Check console for detailed error logs

### Measurement Mode Issues
- All measurement fields are required
- Height can be any value (kids welcome!)
- Upload at least one clothing item

### API Issues
- Check that your API key is correctly set in `.env.local`
- Verify the API key has proper permissions
- Check console logs for detailed error information