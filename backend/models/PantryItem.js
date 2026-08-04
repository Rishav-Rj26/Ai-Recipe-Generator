import db from '../config/db.js';

class PantryItem {
    // Create a new pantry item

    static async create(userId, itemData){
        const {
            name,
            quantity,
            unit,
            category,
            expiration_date = null,
            is_running_low = false
        } = itemData;

        const result = await db.query(
            `INSERT INTO pantry_items
            (user_id, name, quantity, unit, category, expiration_date, is_running_low)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [userId, name, quantity, unit, category, expiration_date, is_running_low]
        );

        return result.rows[0];
    }

    //Get all pantry items for a user

    static async findByUser(userId, filters = {}){
        let query = 'SELECT * FROM pantry_items WHERE user_id = $1';
        const params = [userId];
        let paramCount = 1;

        if(filters.category){
            paramCount++;
            query += ` AND category = $${paramCount}`;
            params.push(filters.category);
        }

        if(filters.is_running_low !== undefined){
            paramCount++;
            query += ` AND is_running_low = $${paramCount}`;
            params.push(filters.is_running_low);
        }

        if(filters.search){
            paramCount++;
            query += ` AND name ILIKE $${paramCount}`;
            params.push(`%${filters.search}%`);
        }

        query += ' ORDER BY created_at DESC';

        const result = await db.query(query, params);
        return result.rows;
    }

    //Get items expiring soon (within next 7 days)

    static async getExpiringSoon(userId, days = 7){
        const result = await db.query(
            `SELECT * FROM pantry_items
            WHERE user_id = $1
            AND expiration_date IS NOT NULL
            AND expiration_date <= CURRENT_DATE + INTERVAL '${days} days'
            AND expiration_date >= CURRENT_DATE
            ORDER BY expiration_date ASC`,
            [userId]
        );

        return result.rows;
    }

    //Get pantry item by ID

    static async findBy(id, userId){
        const result = await db.query(
            `SELECT * FROM pantry_items WHERE id = $1 AND user_id = $2`,
            [id,userId]
        );

        return result.rows[0];
    }

    //Update pantry items

    static async update(id, userId, updates){
        const fields = [];
        const params = [];

        if (updates.name !== undefined) {
            params.push(updates.name);
            fields.push(`name = $${params.length}`);
        }
        if (updates.quantity !== undefined) {
            params.push(updates.quantity);
            fields.push(`quantity = $${params.length}`);
        }
        if (updates.unit !== undefined) {
            params.push(updates.unit);
            fields.push(`unit = $${params.length}`);
        }
        if (updates.category !== undefined) {
            params.push(updates.category);
            fields.push(`category = $${params.length}`);
        }
        if (updates.expiration_date !== undefined) {
            params.push(updates.expiration_date);
            fields.push(`expiration_date = $${params.length}`);
        }
        if (updates.is_running_low !== undefined) {
            params.push(updates.is_running_low);
            fields.push(`is_running_low = $${params.length}`);
        }

        if (fields.length === 0) {
            return this.findBy(id, userId);
        }

        params.push(id, userId);
        const result = await db.query(
            `UPDATE pantry_items
            SET ${fields.join(', ')}
            WHERE id = $${params.length - 1} AND user_id = $${params.length}
            RETURNING *`,
            params
        );

        return result.rows[0];
    }

    static async delete(id, userId) {
        await db.query(
            'DELETE FROM pantry_items WHERE id = $1 AND user_id = $2',
            [id, userId]
        );
    }
}

export default PantryItem;