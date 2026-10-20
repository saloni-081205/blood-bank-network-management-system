// Check if user has required role
exports.checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: 'Access denied. Insufficient permissions.' 
            });
        }

        next();
    };
};

// Check if user is ADMIN
exports.isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

// Check if user is DONOR
exports.isDonor = (req, res, next) => {
    if (!req.user || req.user.role !== 'DONOR') {
        return res.status(403).json({ message: 'Donor access required' });
    }
    next();
};

// Check if user is HOSPITAL
exports.isHospital = (req, res, next) => {
    if (!req.user || req.user.role !== 'HOSPITAL') {
        return res.status(403).json({ message: 'Hospital access required' });
    }
    next();
};