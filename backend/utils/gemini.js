import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});


if (!process.env.GEMINI_API_KEY) {
  console.error('WARNING: GEMINI_API_KEY is not set. AI features will not work.');
}


// 1. Generate Recipe
export const generateRecipe = async ({
  ingredients,
  dietaryRestrictions = [],
  cuisineType = "any",
  servings = 4,
  cookingTime = "medium"
}) => {

  const prompt = `
Generate recipe in JSON format.

Ingredients:
${ingredients.join(', ')}

Dietary restrictions:
${dietaryRestrictions.join(', ')}

Cuisine:
${cuisineType}

Servings:
${servings}

Cooking time:
${cookingTime}

Return only JSON.
`;


  try {

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });


    let generatedText = response.text.trim();


    if (generatedText.startsWith("```json")) {
      generatedText = generatedText
        .replace(/```json\n?/g, "")
        .replace(/```/g, "");
    }


    const recipe = JSON.parse(generatedText);

    return recipe;


  } catch(error) {

    console.error("Gemini API error:", error);

    return {
      recipeName: "Default Recipe",
      ingredients,
      steps: []
    };

  }
};



// 2. Generate Pantry Suggestions
export const generatePantrySuggestions = async (ingredients) => {

  const prompt = `
Suggest recipes that can be made using:

${ingredients.join(", ")}

Return JSON only.
`;


  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt
  });


  return response.text;
};




// 3. Generate Cooking Tips
export const generateCookingTips = async (recipe) => {

  const prompt = `
Give cooking tips for this recipe:

${recipe}

Return useful tips.
`;


  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt
  });


  return response.text;
};



// Default Export
export default {
  generateRecipe,
  generatePantrySuggestions,
  generateCookingTips
};