import db from '../config/db.js';

class PantryItem {
    // Create a new pantry item

    static async create(userId, itemData){
        const { name, quantity, unit, category, expiry_date, is_running_low = false } = itemData;

        const result = await db.query(
            `INSERT INTO pantry_items
            (user_id, name, quantity, unit, category, expiry_date, is_running_low)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [user_id, name, quantity, unit, category, expiry_date, is_running_low]
        );

        return result.rows[0];
    }
}