import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import UserPreference from '../models/UserPreference.js';

// Generate JWT token

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

// Register a new user
export const register = async (req,res,next) => {
    try {
        const { email, password } = req.body;

        //Validation 
        if(!email || !password || !name){
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if(existingUser){
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Create new user
        const user = await User.create({ email, password, name });

        // Create default user preferences
        await UserPreference.upsert(user.id, {
            dietary_restrictions: [],
            allergies: [],
            preferred_cuisines: [],
            default_serving: 4,
            measurement_unit: 'metric'
        });

        // Generate token
        const token = generateToken(user);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name
                },
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

// Login user
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if(!email || !password){
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        //Find user
        const user = await User.findByEmail(email);
        if(!user){
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Verify password
        const isMatch = await User.comparePassword(password, user.password);
        if(!isMatch){
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate token
        const token = generateToken(user);

        res.status(200).json({
            success: true,
            message: 'User logged in successfully',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name
                },
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get Current user
export const getCurrentUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if(!user){
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

// Request password reset
export const requestPasswordReset = async (req, res, next) => {
    try {
        const { email } = req.body;

        if(!email){
            return res.status(400).json({
                success: false,
                message: 'Please provide an email'
            });
        }

        const user = await User.findByEmail(email);

        //Dont reveal if user exists or not for security reasons

        res.json({
            success: true,
            message: 'If a user with that email exists, a password reset link has been sent'
        });
    } catch (error) {
        next(error);
    }
};


