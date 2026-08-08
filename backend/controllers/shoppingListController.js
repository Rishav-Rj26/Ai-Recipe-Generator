import ShoppingList from '../models/ShoppingList.js';

//Generate shopping list from meal plan

export const generateFromMealPlan = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.body;

        if(!startDate || !endDate){
            return res.status(400).json({
                success: false,
                message: 'Please provide startDate and endDate'
            });
        }

        const items = await ShoppingList.generateFromMealPlan(req.user.id, startDate, endDate);

        res.json({
            success: true,
            message: 'Shopping list generated from meal plan',
            data: { items }
        });
    } catch(error){
        next(error);
    }
};

//Get shopping list

export const getShoppingList = async (req, res, next) => {
    try{
        const grouped = req.query.grouped === 'true';

        const items = grouped
            ? await ShoppingList.getGroupedByCategory(req.user.id)
            : await ShoppingList.findByUserId(req.user.id);

        res.json({
            success: true,
            data: { items }
        });
    } catch(error){
        next(error);
    }
};