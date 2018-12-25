const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const multer = require("multer");
const uuid = require("uuid/v4");
require("dotenv").config();

const app = express();

const fileStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "images");
	},
	filename: (req, file, cb) => {
		cb(null, uuid());
	}
});

const fileFilter = (req, file, cb) => {
	if (
		file.mimetype === "image/png" ||
		file.mimetype === "image/jpg" ||
		file.mimetype === "image/jpeg"
	) {
		cb(null, true);
	} else {
		cb(null, false);
	}
};

app.use(
	multer({
		fileFilter,
		storage: fileStorage
	}).single("image")
);

app.use(express.json());
app.use("/images", express.static(path.join(__dirname, "images")));
app.use((req, res, next) => {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader(
		"Access-Control-Allow-Methods",
		"GET, POST, PUT, PATCH, DELETE"
	);
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
	next();
});

app.use((error, req, res, next) => {
	console.log(error);
	const status = error.statusCode || 500;
	const message = error.message;
	const data = error.data;
	res.status(status).json({ message, data });
});

mongoose
	.connect(
		process.env.MONGODB_URI,
		{ useNewUrlParser: true }
	)
	.then(() => {
		console.log("DB connected");
		app.listen(8080);
	})
	.catch(err => {
		console.log(err);
	});
