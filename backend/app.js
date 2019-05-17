const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const graphqlHttp = require('express-graphql');
const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');
const auth = require('./middleware/auth');
const fs = require('fs');
app.use(bodyParser.json());
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}
app.use(multer({
    storage: storage,
    fileFilter: fileFilter
}).single('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-type, Authorization');
    if (req.method === 'OPTIONS'){
        return res.sendStatus(200);
    }
    next();
});

app.use(auth);

app.use((err, req, res, next) => {
    console.log(err);
    const statusCode = err.statusCode || 500;
    const message = err.message;
    const data = err.data;
    res.status(statusCode).json({
        message: message,
        data: data
    });
});

app.put('/post-image', (req, res, next) => {
    if (!req.isAuth) {
        throw new Error('Not authenticated');
    }
    if (!req.file){
        return res.status(200).json({message: 'No file provided'})
    }
    if (req.file){
        clearFile(req.body.oldPath);
    }
    return res.status(201).json({message: 'File stored', filePath: req.filePath})
});

app.use('/graphql', graphqlHttp({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    formatError(err) {
        if (!err.originalError) {
            return err;
        }
        const data = err.originalError.data;
        const message = err.message || 'An error occured';
        const code = err.originalError.code || 500;

        return {
            message: message,
            status: code,
            data: data
        }
    }
}));

mongoose.connect('mongodb://localhost:27017/messages', {
        useNewUrlParser: true
    })
    .then(result => {
        console.log('connected');
        app.listen(8080);
    })
    .catch(err => {
        console.log(err);
    });

    const clearFile = filename => {
        filePath = path.join(__dirname, '..', 'images', filename);
        fs.unlink(filePath, err => console.log(err));
    }