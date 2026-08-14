import db from "../config/db.js";

class ShoppingList {


    /**
     * Generate shopping list from meal plan
     */
    static async generateFromMealPlan(userId, startDate, endDate) {

        const client = await db.pool.connect();

        try {

            await client.query("BEGIN");


            // Remove old generated shopping items
            await client.query(
                `
                DELETE FROM shopping_list_items
                WHERE user_id = $1
                AND from_meal_plan = true
                `,
                [
                    userId
                ]
            );



            // Fetch ingredients from meal plan recipes
            const result = await client.query(
                `
                SELECT
                    ri.ingredient_name,
                    ri.unit,
                    SUM(ri.quantity) AS total_quantity

                FROM meal_plans mp

                JOIN recipe_ingredients ri
                ON mp.recipe_id = ri.recipe_id


                WHERE mp.user_id = $1

                AND mp.meal_date >= $2

                AND mp.meal_date <= $3


                GROUP BY
                    ri.ingredient_name,
                    ri.unit
                `,
                [
                    userId,
                    startDate,
                    endDate
                ]
            );


            const ingredients = result.rows;



            // Insert generated shopping items
            for (const item of ingredients) {

                await client.query(
                    `
                    INSERT INTO shopping_list_items
                    (
                        user_id,
                        ingredient_name,
                        quantity,
                        unit,
                        from_meal_plan,
                        completed
                    )

                    VALUES
                    ($1,$2,$3,$4,true,false)
                    `,
                    [
                        userId,
                        item.ingredient_name,
                        item.total_quantity,
                        item.unit
                    ]
                );

            }



            await client.query("COMMIT");


            return ingredients;


        } catch(error) {

            await client.query("ROLLBACK");
            throw error;

        } finally {

            client.release();

        }

    }





    /**
     * Get shopping list
     */
    static async getAll(userId) {

        const result = await db.query(
            `
            SELECT *

            FROM shopping_list_items

            WHERE user_id=$1

            ORDER BY created_at DESC
            `,
            [
                userId
            ]
        );


        return result.rows;

    }





    /**
     * Add manual shopping item
     */
    static async add(userId, itemData) {


        const {
            ingredient_name,
            quantity,
            unit
        } = itemData;



        const result = await db.query(
            `
            INSERT INTO shopping_list_items
            (
                user_id,
                ingredient_name,
                quantity,
                unit,
                from_meal_plan,
                completed
            )

            VALUES
            ($1,$2,$3,$4,false,false)

            RETURNING *
            `,
            [
                userId,
                ingredient_name,
                quantity,
                unit
            ]
        );


        return result.rows[0];

    }





    /**
     * Mark item completed
     */
    static async toggleComplete(id) {


        const result = await db.query(
            `
            UPDATE shopping_list_items

            SET completed = NOT completed

            WHERE id=$1

            RETURNING *
            `,
            [
                id
            ]
        );


        return result.rows[0];

    }





    static async delete(id, userId) {
        const result = await db.query(
            `DELETE FROM shopping_list_items
            WHERE id = $1 AND user_id = $2
            RETURNING *`,
            [id, userId]
        );

        return result.rows[0];
    }

    /**
     * Create a shopping list item
     */
    static async create(userId, itemData) {
        const { ingredient_name, quantity, unit, category } = itemData;

        const result = await db.query(
            `INSERT INTO shopping_list_items
            (user_id, ingredient_name, quantity, unit, category, from_meal_plan, is_checked)
            VALUES ($1, $2, $3, $4, $5, false, false)
            RETURNING *`,
            [userId, ingredient_name, quantity, unit, category || null]
        );

        return result.rows[0];
    }

    /**
     * Find all shopping list items by user ID
     */
    static async findByUserId(userId) {
        const result = await db.query(
            `SELECT * FROM shopping_list_items
            WHERE user_id = $1
            ORDER BY created_at DESC`,
            [userId]
        );

        return result.rows;
    }

    /**
     * Get shopping list items grouped by category
     */
    static async getGroupedByCategory(userId) {
        const result = await db.query(
            `SELECT * FROM shopping_list_items
            WHERE user_id = $1
            ORDER BY category ASC, created_at DESC`,
            [userId]
        );

        return result.rows;
    }

    /**
     * Update a shopping list item
     */
    static async update(id, userId, updates) {
        const { ingredient_name, quantity, unit, category } = updates;

        const result = await db.query(
            `UPDATE shopping_list_items
            SET ingredient_name = COALESCE($1, ingredient_name),
                quantity = COALESCE($2, quantity),
                unit = COALESCE($3, unit),
                category = COALESCE($4, category)
            WHERE id = $5 AND user_id = $6
            RETURNING *`,
            [ingredient_name, quantity, unit, category, id, userId]
        );

        return result.rows[0];
    }

    /**
     * Toggle checked status of a shopping list item
     */
    static async toggleChecked(id, userId) {
        const result = await db.query(
            `UPDATE shopping_list_items
            SET is_checked = NOT is_checked
            WHERE id = $1 AND user_id = $2
            RETURNING *`,
            [id, userId]
        );

        return result.rows[0];
    }

    /**
     * Clear all checked items
     */
    static async clearChecked(userId) {
        const result = await db.query(
            `DELETE FROM shopping_list_items
            WHERE user_id = $1 AND is_checked = true
            RETURNING *`,
            [userId]
        );

        return result.rows;
    }

    /**
     * Clear all items
     */
    static async clearAll(userId) {
        const result = await db.query(
            `DELETE FROM shopping_list_items
            WHERE user_id = $1
            RETURNING *`,
            [userId]
        );

        return result.rows;
    }

    /**
     * Add checked items to pantry
     */
    static async addCheckedToPantry(userId) {
        const client = await db.pool.connect();

        try {
            await client.query('BEGIN');

            const checkedItems = await client.query(
                `SELECT * FROM shopping_list_items
                WHERE user_id = $1 AND is_checked = true`,
                [userId]
            );

            for (const item of checkedItems.rows) {
                await client.query(
                    `INSERT INTO pantry_items
                    (user_id, name, quantity, unit, category)
                    VALUES ($1, $2, $3, $4, $5)`,
                    [userId, item.ingredient_name, item.quantity || 1, item.unit || 'pieces', item.category || 'Other']
                );
            }

            await client.query(
                `DELETE FROM shopping_list_items
                WHERE user_id = $1 AND is_checked = true`,
                [userId]
            );

            await client.query('COMMIT');

            return checkedItems.rows;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

}


export default ShoppingList;