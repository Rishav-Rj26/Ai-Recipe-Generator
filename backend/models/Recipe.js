import db from "../config/db.js";

class Recipe {
    /**
     * Create a new recipe with ingredients and nutrition
     */
    static async create(userId, recipeData) {
        const client = await db.pool.connect();

        try {
            await client.query("BEGIN");

            const {
                name,
                description,
                cuisine_type,
                difficulty,
                prep_time,
                cook_time,
                servings,
                instructions,
                dietary_tags = [],
                user_notes,
                image_url,
                ingredients = [],
                nutrition = {}
            } = recipeData;

            // Insert recipe
            const recipeResult = await client.query(
                `INSERT INTO recipes
                (
                    user_id,
                    name,
                    description,
                    cuisine_type,
                    difficulty,
                    prep_time,
                    cook_time,
                    servings,
                    instructions,
                    dietary_tags,
                    user_notes,
                    image_url
                )
                VALUES
                ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
                RETURNING *`,
                [
                    userId,
                    name,
                    description,
                    cuisine_type,
                    difficulty,
                    prep_time,
                    cook_time,
                    servings,
                    instructions,
                    dietary_tags,
                    user_notes,
                    image_url
                ]
            );

            const recipe = recipeResult.rows[0];

            // Insert ingredients
            for (const ingredient of ingredients) {
                await client.query(
                    `INSERT INTO recipe_ingredients
                    (
                        recipe_id,
                        ingredient_name,
                        quantity,
                        unit
                    )
                    VALUES
                    ($1,$2,$3,$4)`,
                    [
                        recipe.id,
                        ingredient.ingredient_name || ingredient.name,
                        ingredient.quantity,
                        ingredient.unit
                    ]
                );
            }

            // Insert nutrition
            await client.query(
                `INSERT INTO recipe_nutrition
                (
                    recipe_id,
                    calories,
                    protein,
                    carbohydrates,
                    fat,
                    fiber
                )
                VALUES
                ($1,$2,$3,$4,$5,$6)`,
                [
                    recipe.id,
                    nutrition.calories || 0,
                    nutrition.protein || 0,
                    nutrition.carbohydrates || 0,
                    nutrition.fat || 0,
                    nutrition.fiber || 0
                ]
            );


            await client.query("COMMIT");

            return recipe;

        } catch (error) {
            await client.query("ROLLBACK");
            throw error;

        } finally {
            client.release();
        }
    }


    /**
     * Get all recipes of a user
     */
    static async getAll(userId) {

        const result = await db.pool.query(
            `SELECT 
                r.*,
                json_agg(
                    DISTINCT jsonb_build_object(
                        'name', i.ingredient_name,
                        'quantity', i.quantity,
                        'unit', i.unit
                    )
                ) AS ingredients,
                json_build_object(
                    'calories', n.calories,
                    'protein', n.protein,
                    'carbohydrates', n.carbohydrates,
                    'fat', n.fat,
                    'fiber', n.fiber
                ) AS nutrition

            FROM recipes r

            LEFT JOIN recipe_ingredients i
            ON r.id = i.recipe_id

            LEFT JOIN recipe_nutrition n
            ON r.id = n.recipe_id

            WHERE r.user_id = $1

            GROUP BY r.id,n.id

            ORDER BY r.created_at DESC`,
            [userId]
        );


        return result.rows;
    }

    /**
     * Get summary counts for a user's recipes.
     */
    static async getStats(userId) {
        const result = await db.query(
            `SELECT
                COUNT(*)::int AS total_recipes,
                COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days')::int
                    AS recipes_created_this_week
            FROM recipes
            WHERE user_id = $1`,
            [userId]
        );

        return result.rows[0];
    }

    /**
     * Get recent recipes for a user
     */
    static async getRecent(userId, limit = 5) {
        const result = await db.query(
            `SELECT * FROM recipes
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2`,
            [userId, limit]
        );

        return result.rows;
    }

    /**
     * Get single recipe
     */
    static async getById(recipeId, userId) {

        const result = await db.pool.query(
            `SELECT 
                r.*,
                json_agg(
                    jsonb_build_object(
                        'name', i.ingredient_name,
                        'quantity', i.quantity,
                        'unit', i.unit
                    )
                ) AS ingredients,
                json_build_object(
                    'calories', n.calories,
                    'protein', n.protein,
                    'carbohydrates', n.carbohydrates,
                    'fat', n.fat,
                    'fiber', n.fiber
                ) AS nutrition

            FROM recipes r

            LEFT JOIN recipe_ingredients i
            ON r.id=i.recipe_id

            LEFT JOIN recipe_nutrition n
            ON r.id=n.recipe_id

            WHERE r.id=$1 AND r.user_id=$2

            GROUP BY r.id,n.id`,
            [recipeId, userId]
        );


        return result.rows[0];
    }



    /**
     * Update recipe
     */
    static async update(recipeId, userId, recipeData) {

        const {
            name,
            description,
            cuisine_type,
            difficulty,
            prep_time,
            cook_time,
            servings,
            instructions,
            dietary_tags,
            user_notes,
            image_url
        } = recipeData;


        const result = await db.pool.query(
            `UPDATE recipes
            SET
            name=$1,
            description=$2,
            cuisine_type=$3,
            difficulty=$4,
            prep_time=$5,
            cook_time=$6,
            servings=$7,
            instructions=$8,
            dietary_tags=$9,
            user_notes=$10,
            image_url=$11

            WHERE id=$12 AND user_id=$13

            RETURNING *`,
            [
                name,
                description,
                cuisine_type,
                difficulty,
                prep_time,
                cook_time,
                servings,
                instructions,
                dietary_tags,
                user_notes,
                image_url,
                recipeId,
                userId
            ]
        );


        return result.rows[0];
    }



    /**
     * Delete recipe
     */
    static async delete(recipeId, userId) {

        const result = await db.pool.query(
            `DELETE FROM recipes
            WHERE id=$1 AND user_id=$2
            RETURNING *`,
            [recipeId, userId]
        );


        return result.rows[0];
    }

}


export default Recipe;
