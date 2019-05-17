const fs = require('fs');
const path = require('path');
const {
    validationResult
} = require('express-validator/check');
const User = require('../models/user');
const Post = require('../models/post');
const io = require('../socket');
exports.getPosts = async (req, res, next) => {
    const currentPage = req.params.page || 1;
    const perPage = 2;
    let totalItems;
    Post.find()
        .countDocuments()
        .then(count => {
            totalItems = count;
            return Post.find()
                .skip((currentPage - 1) * perPage)
                .limit(perPage);
        })
        .then(posts => {
            res.status(200).json({
                message: 'Fetched posts successfully',
                posts: posts,
                totalItems: totalItems
            });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
}

exports.createPost = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect.');
        error.statusCode = 422;
        throw error;
    }
    if (!req.file) {
        const error = new Error('No image provided.');
        error.statusCode = 422;
        throw error;
    }
    const imageUrl = req.file.filename;
    const title = req.body.title;
    const content = req.body.content;
    let creator;
    const post = new Post({
        title: title,
        content: content,
        imageUrl: imageUrl,
        creator: req.userId
    });
    post
        .save()
        .then(result => {
            return User.findById(req.userId);
        })
        .then(user => {
            creator = user;
            user.posts.push(post);
            return user.save();
        })
        .then(result => {
            io.getIO().emit('posts', {action: 'create', post: post});
            res.status(201).json({
                message: 'Post created successfully!',
                post: post,
                creator: {
                    _id: creator._id,
                    name: creator.name
                }
            });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.getPost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
        .then(post => {
            if (!post) {
                const error = new Error('Could not find post.');
                error.statusCode = 404;
                throw error;
            }
            res.status(200).json({
                message: 'Fetched post',
                post: post
            });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
}

exports.updatePost = (req, res, next) => {
    const postId = req.params.postId;
    const errors = validationResult(req);
    let imageUrl;
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect');
        error.statusCode = 422;
        throw error;
    }
    const title = req.body.title;
    const content = req.body.content;

    Post.findById(postId)
        .then(post => {
            imageUrl = post.imageUrl;
            if (!post) {
                const error = new Error('No post found');
                error.statusCode = 422;
                throw error;
            }
            if (post.creator.toString() !== req.userId) {
                const error = new Error('Not authorised to edit this post');
                error.statusCode = 403;
                throw error;
            }
            if (req.file) {
                imageUrl = req.file.filename;
            }
            if (imageUrl !== post.imageUrl) {
                clearFile(post.imageUrl);
            }
            return Post.findByIdAndUpdate(postId, {
                $set: {
                    title: title,
                    content: content,
                    imageUrl: imageUrl
                }
            }, {
                new: true
            });

        })
        .then(result => {
            res.status(200).json({
                message: 'Post Updated',
                post: result
            });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
}

const clearFile = filename => {
    filePath = path.join(__dirname, '..', 'images', filename);
    fs.unlink(filePath, err => console.log(err));
}

exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
        .then(post => {
            if (!post) {
                const error = new Error('No file picked');
                error.statusCode = 422;
                throw error;
            }
            if (post.creator.toString() !== req.userId) {
                const error = new Error('Not authorised to edit this post');
                error.statusCode = 403;
                throw error;
            }

            clearFile(post.imageUrl);
            return Post.findByIdAndRemove(postId);
        })
        .then(result => {
            return res.status(200).json({
                message: 'Post has been deleted'
            });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
}