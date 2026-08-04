import PantryItem from "../models/PantryItem.js";


/**
 * Get all pantry items
 */
export const getPantryItems = async (req, res, next) => {

    try {

        const {
            category,
            is_running_low,
            search
        } = req.query;


        const items = await PantryItem.findByUser(
            req.user.id,
            {
                category,
                is_running_low:
                    is_running_low === "true"
                        ? true
                        : undefined,
                search
            }
        );


        res.json({
            success: true,
            data: {
                items
            }
        });


    } catch(error) {

        next(error);

    }

};





/**
 * Create pantry item
 */
export const createPantryItem = async (req,res,next)=>{

    try {

        const item = await PantryItem.create(
            req.user.id,
            req.body
        );


        res.status(201).json({
            success:true,
            data:{
                item
            }
        });


    } catch(error){

        next(error);

    }

};





/**
 * Get single pantry item
 */
export const getPantryItem = async(req,res,next)=>{

    try {

        const item = await PantryItem.findBy(
            req.params.id,
            req.user.id
        );


        if(!item){

            return res.status(404).json({
                success:false,
                message:"Pantry item not found"
            });

        }


        res.json({
            success:true,
            data:{
                item
            }
        });


    } catch(error){

        next(error);

    }

};





/**
 * Get expiring soon items
 */
export const getExpiringItems = async(req,res,next)=>{

    try {

        const days = req.query.days || 7;


        const items = await PantryItem.getExpiringSoon(
            req.user.id,
            days
        );


        res.json({
            success:true,
            data:{
                items
            }
        });


    } catch(error){

        next(error);

    }

};





/**
 * Update pantry item
 */
export const updatePantryItem = async(req,res,next)=>{

    try {


        const item = await PantryItem.update(
            req.params.id,
            req.user.id,
            req.body
        );


        if(!item){

            return res.status(404).json({
                success:false,
                message:"Pantry item not found"
            });

        }


        res.json({
            success:true,
            data:{
                item
            }
        });



    } catch(error){

        next(error);

    }

};





/**
 * Delete pantry item
 */
export const deletePantryItem = async(req,res,next)=>{

    try {


        await PantryItem.delete(
            req.params.id,
            req.user.id
        );


        res.json({
            success:true,
            message:"Pantry item deleted successfully"
        });


    } catch(error){

        next(error);

    }

};