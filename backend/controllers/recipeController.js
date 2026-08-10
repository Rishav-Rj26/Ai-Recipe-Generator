import Recipe from "../models/Recipe.js";
import PantryItem from "../models/PantryItem.js";
import { 
    generateRecipe as generateRecipeAI,
    generatePantrySuggestions
} from "../utils/gemini.js";



/**
 * Generate recipe using AI
 */
export const generateRecipe = async (req, res, next) => {

    try {

        const {
            ingredients = [],
            usePantryIngredients = false,
            dietaryRestrictions = [],
            cuisineType = "any",
            servings = 4,
            cookingTime = "medium"

        } = req.body;



        let finalIngredients = [...ingredients];



        // Add pantry ingredients if requested
        if(usePantryIngredients){

            const pantryItems = await PantryItem.findByUser(
                req.user.id
            );


            const pantryIngredientNames = pantryItems.map(
                item => item.name
            );


            finalIngredients = [
                ...new Set([
                    ...finalIngredients,
                    ...pantryIngredientNames
                ])
            ];

        }



        if(finalIngredients.length === 0){

            return res.status(400).json({
                success:false,
                message:"Please provide at least one ingredient"
            });

        }



        // Generate recipe from AI
        const recipeData = await generateRecipeAI({

            ingredients: finalIngredients,

            dietaryRestrictions,

            cuisineType,

            servings,

            cookingTime

        });



        res.status(200).json({

            success:true,

            data:{
                recipe: recipeData
            }

        });



    } catch(error){

        next(error);

    }

};







/**
 * Save generated recipe
 */
export const saveRecipe = async(req,res,next)=>{

    try {


        const recipe = await Recipe.create(
            req.user.id,
            req.body
        );


        res.status(201).json({

            success:true,

            message:"Recipe saved successfully",

            data:{
                recipe
            }

        });



    } catch(error){

        next(error);

    }

};








/**
 * Get all user recipes
 */
export const getRecipes = async(req,res,next)=>{

    try {


        const recipes = await Recipe.getAll(
            req.user.id
        );


        res.json({

            success:true,

            data:{
                recipes
            }

        });


    } catch(error){

        next(error);

    }

};








/**
 * Get single recipe
 */
export const getRecipe = async(req,res,next)=>{

    try {


        const recipe = await Recipe.getById(
            req.params.id
        );


        if(!recipe){

            return res.status(404).json({

                success:false,

                message:"Recipe not found"

            });

        }



        res.json({

            success:true,

            data:{
                recipe
            }

        });



    }catch(error){

        next(error);

    }

};








/**
 * Update recipe
 */
export const updateRecipe = async(req,res,next)=>{

    try {


        const recipe = await Recipe.update(

            req.params.id,

            req.body

        );


        res.json({

            success:true,

            data:{
                recipe
            }

        });



    }catch(error){

        next(error);

    }

};








/**
 * Delete recipe
 */
export const deleteRecipe = async(req,res,next)=>{

    try {


        await Recipe.delete(
            req.params.id
        );


        res.json({

            success:true,

            message:"Recipe deleted successfully"

        });



    }catch(error){

        next(error);

    }

};








/**
 * Generate suggestions from pantry
 */
export const getPantrySuggestions = async(req,res,next)=>{

    try {


        const pantryItems = await PantryItem.findByUser(
            req.user.id
        );


        const ingredients = pantryItems.map(
            item => item.name
        );



        const suggestions = await generatePantrySuggestions(
            ingredients
        );



        res.json({

            success:true,

            data:{
                suggestions
            }

        });



    }catch(error){

        next(error);

    }

};

// Alias used by the /:id route.
export const getRecipeById = getRecipe;

/**
 * Get summary statistics for the authenticated user's recipes.
 */
export const getRecipeStats = async (req, res, next) => {
    try {
        const stats = await Recipe.getStats(req.user.id);

        res.json({
            success: true,
            data: { stats }
        });
    } catch (error) {
        next(error);
    }
};
