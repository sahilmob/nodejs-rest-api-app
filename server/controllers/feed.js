const { validationResult } = require("express-validator/check");
const Post = require("../models/post");

exports.getPosts = (req, res, next) => {
	Post.find()
		.then(posts => {
			if (!posts) {
				const error = new Error("Could not find posts.");
				error.statusCode = 404;
				throw error;
			}
			res.status(200).json({
				posts
			});
		})
		.catch(err => {
			if (err.statusCode) {
				err.statusCode = 500;
			}
			next(err);
		});
};

exports.createPost = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const error = new Error("Validation failed, entered data is incorrect");
		error.statusCode = 422;
		throw error;
	}
	const post = new Post({
		title: req.body.title,
		content: req.body.content,
		imageUrl: "images/duck.jpg",
		creator: {
			name: "Sahil"
		}
	});
	post
		.save()
		.then(result => {
			console.log(result);
			res.status(201).json({
				message: "Post created successfully!",
				post: result
			});
		})
		.catch(err => {
			if (err.statusCode) {
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
				const error = new Error("Could not find post.");
				error.statusCode = 404;
				throw error;
			}
			res.status(200).json({
				message: "Post fetched",
				post
			});
		})
		.catch(err => {
			if (err.statusCode) {
				err.statusCode = 500;
			}
			next(err);
		});
};
