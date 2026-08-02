import jwt from 'jsonwebtoken';

const authMiddleware = async (req, res, next) => {
    try {
        // Get the token from the Authorization header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if(!token){
            return res.status(401).json({
                success: false,
                message: 'No authentication token, access denied'
            });
        }

        //verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = {
            id: decoded.id,
            email: decoded.email
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({
            success: false,
            message: 'Invalid authentication token, access denied'
        });
    }
}

export default authMiddleware;