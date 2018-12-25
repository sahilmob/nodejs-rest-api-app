const { validationResult } = require("express-validator/check");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");

exports.signup = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const error = new Error("Validation failed");
		error.statusCode = 422;
		error.data = errors.array();
		throw error;
	}
	const email = req.body.email;
	const name = req.body.name;
	const password = req.body.password;
	bcrypt
		.hash(password, 12)
		.then(hashedPassword => {
			const user = new User({
				email,
				name,
				password: hashedPassword
			});

			return user.save();
		})
		.then(user => {
			res.status(201).json({ message: "New user created", userId: user._id });
		})
		.catch(err => {
			if (err.statusCode) {
				err.statusCode = 500;
			}
			next(err);
		});
};

exports.login = (req, res, next) => {
	const email = req.body.email;
	const password = req.body.password;
	let loadedUser;
	User.findOne({
		email
	})
		.then(user => {
			if (!user) {
				const error = new Error("email or password is incorrect");
				error.statusCode = 401;
				throw error;
			}
			loadedUser = user;
			return bcrypt.compare(password, user.password);
		})
		.then(isEqual => {
			if (!isEqual) {
				const error = new Error("email or password is incorrect");
				error.statusCode = 401;
				throw error;
			}
			const token = jwt.sign(
				{
					email: loadedUser.email,
					userId: loadedUser._id.toString()
				},
				"ERG34wthbty%t54rhaw34556H%R^ewsrFGarfe#F$$#Ferg34r",
				{
					expiresIn: "1h"
				}
			);
			res.status(200).json({ token, userId: loadedUser._id.toString() });
		})
		.catch(err => {
			if (err.statusCode) {
				err.statusCode = 500;
			}
			next(err);
		});
};

exports.getUserStatus = (req, res, next) => {
	User.findById(req.userId)
		.then(user => {
			if (!user) {
				const error = new Error("Unauthenticated");
				error.statusCode = 401;
				throw error;
			}
			res.status(200).json({ status: user.status });
		})
		.catch(err => {
			if (!err.statusCode) {
				err.statusCode = 500;
			}
			throw err;
		});
};

exports.updateUserStatus = (req, res, next) => {
	const newStatus = req.body.status;
	User.findById(req.userId)
		.then(user => {
			if (!user) {
				const error = new Error("Unauthenticated");
				error.statusCode = 401;
				throw error;
			}
			user.status = newStatus;
			return user.save();
		})
		.then(result => {
			res.status(200).json({ message: "Status updated successfully" });
		})
		.catch(err => {
			if (!err.statusCode) {
				err.statusCode = 500;
			}
			throw err;
		});
};
