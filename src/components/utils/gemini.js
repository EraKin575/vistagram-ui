import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.GEMINI_API_KEY);

export const generateCaption = async (imageUrl) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Generate a creative and engaging social media caption for this image. 
    Keep it concise, fun, and suitable for a social media platform like Instagram. 
    Include relevant hashtags at the end.`;

    // Convert image URL to base64 for Gemini
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const base64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(blob);
    });

    const imagePart = {
      inlineData: {
        data: base64,
        mimeType: blob.type,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const caption = result.response.text();
    return caption;
  } catch (error) {
    console.error('Error generating caption:', error);
    return 'Check out this amazing moment! ✨ #vistagram #memories';
  }
};
