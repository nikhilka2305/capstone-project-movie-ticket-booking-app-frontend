import { User } from "../models/User.js";
import bcrypt from "bcrypt";
import { createToken } from "../utils/createToken.js";

export const viewUsers = async (req, res, next) => {
	console.log(req.user);

	try {
		console.log(req.user);
		const users = await User.find().select("-passwordHash");
		res.json(users);
	} catch (err) {
		console.log("Unable to get user Data");
		console.log(err.message);
		return res.json({ message: "Error", error: err.message });
	}
};

export const viewUserProfile = async (req, res, next) => {
	const { userid } = req.params;

	if (req.user.role !== "Admin" && req.user.loggedUserId !== userid)
		return res.status(403).json({
			error: "Authorization Error",
			message: "You are not authorized to see this page",
		});

	try {
		const user = await User.findOne({ userId: userid }).select("-passwordHash");
		if (!user) throw new Error("No such user exists");
		res.status(200).json(user);
	} catch (err) {
		console.log("Unable to get user Data");
		console.log(err.message);
		return res.json({ message: "Error", error: err.message });
	}
};

export const updateUserProfile = async (req, res, next) => {
	const { userid } = req.params;

	if (req.user.role !== "Admin" && req.user.loggedUserId !== userid)
		return res.status(403).json({
			error: "Authorization Error",
			message: "You are not authorized to update this profile",
		});
	try {
		const { mobile, email, moviePreferences } = req.body;

		const user = await User.findByIdAndUpdate(
			req.user.loggedUserObjectId,
			{ mobile, email, moviePreferences },
			{ runValidators: true, new: true }
		);
		console.log(user);
		console.log("Updating User Profile");

		res.status(201).json("Profile updated");
	} catch (err) {
		res
			.status(500)
			.json({ error: "Unable to update profile", message: err.message });
	}
};

export const registerUser = async (req, res, next) => {
	const { username, email, mobile, password, moviePreferences } = req.body;
	// Check for existing User;
	try {
		const passwordHash = await bcrypt.hash(password, 10);
		const user = await User.findOne({ username });
		if (!user) {
			throw new Error("Username already exists. Try again");
		}
		user = new User({
			username,
			email,
			mobile,
			passwordHash,
			moviePreferences,
		});
		await user.save();
		return res.send("Success");
	} catch (err) {
		console.log("Unable to save User");
		console.log(err.message);
		return res.json({ message: "Error", error: err.message });
	}
};

export const loginUser = async (req, res) => {
	const { username, password } = req.body;
	try {
		const user = await User.findOne({ username: username });
		if (!user) {
			throw new Error("Invalid User Credentials");
		} else {
			const passwordMatch = await bcrypt.compare(password, user.passwordHash);
			if (!passwordMatch) {
				throw new Error("Invalid User Credentials");
			} else {
				console.log(user);
				const token = createToken({
					userId: user.userId,
					username: username,
					role: user.role,
					id: user._id,
				});

				console.log(token);
				res.cookie("token", token, {
					expires: new Date(Date.now() + 6 * 60 * 60 * 1000),
					httpOnly: true,
				});
				res
					.status(200)
					.json({ message: "Succesfully Logged In", token: token });
			}
		}
	} catch (err) {
		res.status(403).json({
			error: "Login Failed",
			message: err.message,
		});
	}
};

export const resetUserPassword = async (req, res, next) => {
	const { userid } = req.params;

	if (req.user.role !== "Admin" && req.user.loggedUserId !== userid)
		return res.status(403).json({
			error: "Authorization Error",
			message: "You are not authorized to reset Password",
		});
	try {
		const { newPassword } = req.body;

		const newPasswordHash = await bcrypt.hash(newPassword, 10);
		console.log(newPasswordHash);
		console.log(req.user.loggedUserObjectId);
		const user = await User.findByIdAndUpdate(
			req.user.loggedUserObjectId,
			{ passwordHash: newPasswordHash },
			{ new: true }
		);
		console.log(user);
		console.log("Resetting password");

		res.status(201).json("Password Reset");
	} catch (err) {
		res
			.status(500)
			.json({ error: "Unable to Reset Password", message: err.message });
	}
};
