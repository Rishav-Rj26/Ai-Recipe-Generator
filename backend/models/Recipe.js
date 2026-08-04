const db = require("../config/db");

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
                    `INSERT INTO ingredients
                    (
                        recipe_id,
                        name,
                        quantity,
                        unit
                    )
                    VALUES
                    ($1,$2,$3,$4)`,
                    [
                        recipe.id,
                        ingredient.name,
                        ingredient.quantity,
                        ingredient.unit
                    ]
                );
            }

            // Insert nutrition
            await client.query(
                `INSERT INTO nutrition
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
                        'name', i.name,
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

            LEFT JOIN ingredients i
            ON r.id = i.recipe_id

            LEFT JOIN nutrition n
            ON r.id = n.recipe_id

            WHERE r.user_id = $1

            GROUP BY r.id,n.id

            ORDER BY r.created_at DESC`,
            [userId]
        );


        return result.rows;
    }



    /**
     * Get single recipe
     */
    static async getById(recipeId) {

        const result = await db.pool.query(
            `SELECT 
                r.*,
                json_agg(
                    jsonb_build_object(
                        'name', i.name,
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

            LEFT JOIN ingredients i
            ON r.id=i.recipe_id

            LEFT JOIN nutrition n
            ON r.id=n.recipe_id

            WHERE r.id=$1

            GROUP BY r.id,n.id`,
            [recipeId]
        );


        return result.rows[0];
    }



    /**
     * Update recipe
     */
    static async update(recipeId, recipeData) {

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

            WHERE id=$12

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
                recipeId
            ]
        );


        return result.rows[0];
    }



    /**
     * Delete recipe
     */
    static async delete(recipeId) {

        const result = await db.pool.query(
            `DELETE FROM recipes
            WHERE id=$1
            RETURNING *`,
            [recipeId]
        );


        return result.rows[0];
    }

}


export default Recipe;