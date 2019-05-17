const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {

    const authHeader = req.get('Authorization');

    if (!authHeader) {
        req.isAuth = false;
        return next();
    }

    const token = authHeader.split(' ')[1];
    let decodedTocken;

    try {
        decodedTocken = jwt.verify(token, 'someSuperSecretSectet');
    } catch (err) {
        req.isAuth = false;
        return next();
    }

    if (!decodedTocken) {
        req.isAuth = false;
        return next();
    }
    req.userId = decodedTocken.userId;
    req.isAuth = true;
    next();
}