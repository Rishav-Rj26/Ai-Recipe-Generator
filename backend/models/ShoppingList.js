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





    /**
     * Delete shopping item
     */
    static async delete(id) {


        const result = await db.query(
            `
            DELETE FROM shopping_list_items

            WHERE id=$1

            RETURNING *
            `,
            [
                id
            ]
        );


        return result.rows[0];

    }


}


export default ShoppingList;