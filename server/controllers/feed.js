const { validationResult } = require("express-validator/check");
const fs = require("fs");
const path = require("path");

const io = require("../socket");
const Post = require("../models/post");
const User = require("../models/user");

exports.getPosts = (req, res, next) => {
	const currentPage = req.query.page || 1;
	let perPage = 2;
	let totalItems;
	Post.find({})
		.populate("creator")
		.sort({ createdAt: -1 })
		.countDocuments()
		.then(count => {
			totalItems = count;
			return Post.find()
				.limit(perPage)
				.skip(perPage * (currentPage - 1));
		})
		.then(posts => {
			if (!posts) {
				const error = new Error("Could not find posts.");
				error.statusCode = 404;
				throw error;
			}
			res.status(200).json({
				posts,
				totalItems
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
	if (!req.file) {
		const error = new Error("No image provided");
		error.statusCode = 422;
		throw error;
	}
	let creator;
	debugger;
	const post = new Post({
		title: req.body.title,
		content: req.body.content,
		imageUrl: req.file.path.replace("\\", "/"),
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
			io.getIO().emit("post", {
				action: "create",
				post: { ...post_doc, creator: { _id: req.userId, name: creator.name } }
			});
			res.status(201).json({
				message: "Post created successfully!",
				post,
				creator: {
					_id: creator._id,
					name: creator.name
				}
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

exports.updatePost = (req, res, next) => {
	const postId = req.params.postId;
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const error = new Error("Validation failed, entered data is incorrect");
		error.statusCode = 422;
		throw error;
	}
	const title = req.body.title;
	const content = req.body.content;
	let imageUrl = req.body.image;
	console.log("req.body.imageUrl", req.body.image);
	if (req.file) {
		console.log(req.file);
		imageUrl = req.file.path.replace("\\", "/");
	}
	if (!imageUrl) {
		const error = new Error("No file picked");
		error.statusCode = 422;
		throw error;
	}
	Post.findById(postId)
		.then(post => {
			if (!post) {
				const error = new Error("Could not find post.");
				error.statusCode = 404;
				throw error;
			}
			if (post.creator.toString() !== req.userId) {
				const error = new Error("Unauthorized");
				error.statusCode = 403;
				throw error;
			}
			if (imageUrl != post.imageUrl) {
				console.log("imageUrl", imageUrl);
				console.log("post.image", post.imageUrl);
				clearImage(post.imageUrl);
			}
			post.title = title;
			post.imageUrl = imageUrl;
			post.content = content;
			return post.save();
		})
		.then(result => {
			io.getIO().emit("post", { action: "update", post: result });
			res.status(200).json({
				message: "Post updated",
				post: result
			});
		})
		.catch(err => {
			if (!err.statusCode) {
				err.statusCode = 500;
			}
			next(err);
		});
};

exports.deletePost = (req, res, next) => {
	const postId = req.params.postId;
	Post.findById(postId)
		.then(post => {
			if (!post) {
				const error = new Error("Could not find post.");
				error.statusCode = 404;
				throw error;
			}
			if (post.creator.toString() !== req.userId) {
				const error = new Error("Unauthorized");
				error.statusCode = 403;
				throw error;
			}
			clearImage(post.imageUrl);
			return Post.findByIdAndRemove(postId);
		})
		.then(result => {
			return User.findById(req.userId);
		})
		.then(user => {
			user.posts.pull(postId);
			return user.save();
		})
		.then(result => {
			res.status(200).json({ message: "Post deleted" });
		})
		.catch(err => {
			console.log(err);
			if (!err.statusCode) {
				err.statusCode = 500;
			}
			next(err);
		});
};

const clearImage = filePath => {
	fullFilePath = path.join(__dirname, "..", filePath);
	fs.unlink(fullFilePath, err => console.log(err));
};
