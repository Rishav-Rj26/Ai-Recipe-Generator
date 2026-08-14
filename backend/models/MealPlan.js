import db from "../config/db.js";

class MealPlan {

    /**
     * Add recipe to meal plan
     */
    static async create(userId, mealData) {

        const {
            recipe_id,
            planned_date,
            meal_date,
            meal_type
        } = mealData;

        const date = planned_date || meal_date;


        const result = await db.query(
            `
            INSERT INTO meal_plans
            (
                user_id,
                recipe_id,
                meal_date,
                meal_type
            )
            VALUES ($1,$2,$3,$4)

            ON CONFLICT (user_id, meal_date, meal_type)

            DO UPDATE SET
            recipe_id = $2

            RETURNING *
            `,
            [
                userId,
                recipe_id,
                date,
                meal_type
            ]
        );


        return result.rows[0];
    }



    /**
     * Get user's meal plan
     */
    static async getAll(userId) {

        const result = await db.query(
            `
            SELECT
                mp.id,
                mp.meal_date,
                mp.meal_type,

                r.id AS recipe_id,
                r.name,
                r.description,
                r.image_url

            FROM meal_plans mp

            JOIN recipes r
            ON mp.recipe_id = r.id

            WHERE mp.user_id = $1

            ORDER BY mp.meal_date ASC
            `,
            [
                userId
            ]
        );


        return result.rows;
    }




    /**
     * Get meal plan by date
     */
    static async getByDate(userId, date) {

        const result = await db.query(
            `
            SELECT
                mp.*,
                r.name,
                r.description,
                r.image_url

            FROM meal_plans mp

            JOIN recipes r
            ON mp.recipe_id = r.id

            WHERE mp.user_id=$1
            AND mp.meal_date=$2
            `,
            [
                userId,
                date
            ]
        );


        return result.rows;
    }




    /**
     * Update meal plan
     */
    static async update(id, mealData) {

        const {
            recipe_id,
            meal_date,
            meal_type
        } = mealData;


        const result = await db.query(
            `
            UPDATE meal_plans

            SET
            recipe_id=$1,
            meal_date=$2,
            meal_type=$3

            WHERE id=$4

            RETURNING *
            `,
            [
                recipe_id,
                meal_date,
                meal_type,
                id
            ]
        );


        return result.rows[0];
    }




    /**
     * Delete meal plan
     */
    static async delete(id, userId) {
        const result = await db.query(
            `DELETE FROM meal_plans
            WHERE id = $1 AND user_id = $2
            RETURNING *`,
            [id, userId]
        );

        return result.rows[0];
    }

    /**
     * Get weekly meal plan
     */
    static async getWeeklyMealPlan(userId, startDate) {
        const result = await db.query(
            `SELECT
                mp.*,
                r.name AS recipe_name,
                r.description,
                r.image_url,
                r.prep_time,
                r.cook_time
            FROM meal_plans mp
            JOIN recipes r ON mp.recipe_id = r.id
            WHERE mp.user_id = $1
            AND mp.meal_date >= $2::date
            AND mp.meal_date < $2::date + INTERVAL '7 days'
            ORDER BY mp.meal_date ASC, mp.meal_type ASC`,
            [userId, startDate]
        );

        return result.rows;
    }

    /**
     * Get upcoming meals
     */
    static async getUpcoming(userId, limit = 5) {
        const result = await db.query(
            `SELECT
                mp.*,
                r.name AS recipe_name,
                r.description,
                r.image_url,
                r.prep_time,
                r.cook_time
            FROM meal_plans mp
            JOIN recipes r ON mp.recipe_id = r.id
            WHERE mp.user_id = $1
            AND mp.meal_date >= CURRENT_DATE
            ORDER BY mp.meal_date ASC
            LIMIT $2`,
            [userId, limit]
        );

        return result.rows;
    }

    /**
     * Get meal plan stats
     */
    static async getStats(userId) {
        const result = await db.query(
            `SELECT
                COUNT(*)::int AS total_planned_meals,
                COUNT(*) FILTER (
                    WHERE meal_date >= CURRENT_DATE
                    AND meal_date < CURRENT_DATE + INTERVAL '7 days'
                )::int AS this_week_count
            FROM meal_plans
            WHERE user_id = $1`,
            [userId]
        );

        return result.rows[0];
    }

}


export default MealPlan;