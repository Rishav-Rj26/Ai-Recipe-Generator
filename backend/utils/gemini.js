import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});
// The Interactions API is required for new Gemini API projects.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';


if (!process.env.GEMINI_API_KEY) {
  console.error('WARNING: GEMINI_API_KEY is not set. AI features will not work.');
}

const generateText = async (prompt) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const response = await ai.interactions.create({
    model: GEMINI_MODEL,
    input: prompt
  });

  // This SDK exposes Interaction fields in API casing: `output_text`, not
  // `outputText`. Fall back to text blocks for compatibility with SDK updates.
  const text = (
    response.output_text ||
    response.outputs
      ?.filter((output) => output.type === 'text')
      .map((output) => output.text)
      .join('')
  )?.trim();

  if (!text) {
    const reason = response.status;
    throw new Error(
      reason
        ? `Gemini returned no text (reason: ${reason})`
        : 'Gemini returned an empty response'
    );
  }

  return text;
};

const normalizeRecipe = (recipe) => ({
  ...recipe,
  name: recipe.name || recipe.recipeName || recipe.recipe_name,
  cuisineType: recipe.cuisineType || recipe.cuisine_type || recipe.cuisine,
  prepTime: recipe.prepTime ?? recipe.prep_time ?? recipe.prep_time_minutes ?? 0,
  cookTime: recipe.cookTime ?? recipe.cook_time ?? recipe.cook_time_minutes ?? 0,
  instructions: recipe.instructions || recipe.steps || [],
  ingredients: (recipe.ingredients || []).map((ingredient) => {
    if (typeof ingredient === 'string') {
      return { name: ingredient, quantity: '', unit: '' };
    }

    return {
      ...ingredient,
      quantity: ingredient.quantity ?? ingredient.amount ?? '',
      unit: ingredient.unit ?? '',
      name: ingredient.name ?? ''
    };
  })
});

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

Return only JSON using these exact field names:
{
  "name": "recipe name",
  "description": "short description",
  "cuisineType": "cuisine",
  "difficulty": "easy, medium, or hard",
  "prepTime": 10,
  "cookTime": 20,
  "servings": 4,
  "ingredients": [{ "quantity": "2", "unit": "cups", "name": "ingredient" }],
  "instructions": ["step 1"],
  "dietaryTags": []
}
`;


  try {

    let generatedText = await generateText(prompt);


    if (generatedText.startsWith("```json")) {
      generatedText = generatedText
        .replace(/```json\n?/g, "")
        .replace(/```/g, "");
    }


    const recipe = JSON.parse(generatedText);

    return normalizeRecipe(recipe);


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


  return generateText(prompt);
};




// 3. Generate Cooking Tips
export const generateCookingTips = async (recipe) => {

  const prompt = `
Give cooking tips for this recipe:

${recipe}

Return useful tips.
`;


  return generateText(prompt);
};



// Default Export
export default {
  generateRecipe,
  generatePantrySuggestions,
  generateCookingTips
};
