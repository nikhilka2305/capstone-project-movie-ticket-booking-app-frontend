import { Movie } from "../models/Movie.js";
import { Show } from "../models/Show.js";
import { Theater } from "../models/Theater.js";
import { ObjectId } from "mongodb";
import { handleShowDeletion } from "../utils/deleteCascadeManager.js";
import HandleError from "../middleware/errorHandling.js";
import { validateDateTime } from "../utils/validateDate.js";
import mongoose from "mongoose";

const checkOverlappingShows = async (
	theaterId,
	newShowTime,
	movieLength,
	excludeShowId = null
) => {
	// Calculate start and end time for the new show

	const showStart = new Date(newShowTime);
	const showEnd = new Date(
		showStart.getTime() + movieLength * 60 * 1000 + 10 * 60 * 1000
	); // Add movie length and buffer

	const query = {
		theater: new mongoose.Types.ObjectId(theaterId),
		showTime: {
			$gte: new Date(
				showStart.getTime() - movieLength * 60 * 1000 - 10 * 60 * 1000
			), // Buffer before the start time
			$lte: showEnd,
		},
		deleted: false,
	};

	if (excludeShowId) {
		query._id = { $ne: new mongoose.Types.ObjectId(excludeShowId) }; // Exclude the current show (for edits)
	}

	// Check for overlapping shows
	const overlappingShow = await Show.findOne(query).lean();
	return !!overlappingShow; // Return true if an overlapping show exists
};

export const viewShows = async (req, res, next) => {
	const { filter, page = 1, limit = 10 } = req.query;

	const { movieid, theaterid } = req.params;

	const now = new Date().toISOString();

	const filterConditions = { showTime: { $gt: now } };
	if (!req.user) filterConditions.deleted = false;

	try {
		if (movieid) {
			const movie = await Movie.findOne({ movieId: movieid });
			if (!movie || movie.adminApprovalStatus !== "Approved")
				throw new HandleError("Such a movie doesn't exist or might be deleted");

			filterConditions.movie = movie._id;
		} else if (theaterid) {
			const theater = await Theater.findOne({ theaterId: theaterid });
			if (!theater || theater.adminApprovalStatus !== "Approved")
				throw new HandleError(
					"Such a theater doesn't exist or might be deleted"
				);

			filterConditions.theater = theater._id;
		}
		if (req.query.page && req.query.limit) {
			const skip = (page - 1) * limit;
			const shows = await Show.find(filterConditions)
				.populate("movie", "movieName movieId posterImage")
				.populate("theater", "theaterName seats seatClasses owner")
				.sort({ showTime: 1 }) // Add sorting here;
				.skip(skip)
				.limit(limit);
			const totalShows = await Show.countDocuments(filterConditions);

			res.status(200).json({
				shows,
				totalShows,
				totalPages: Math.ceil(totalShows / limit),
				currentPage: page,
			});
		} else {
			const shows = await Show.find(filterConditions)
				.populate("movie", "movieName posterImage")
				.populate("theater", "theaterName seats seatClasses owner")
				.sort({ showTime: 1 }); // Add sorting here;

			res.status(200).json(shows);
		}
	} catch (err) {
		return res
			.status(err?.statusCode || 500)
			.json({ message: "Error", error: err?.message });
	}
};

export const addShow = async (req, res, next) => {
	const { theaterid } = req.params;
	const { showTime, movie } = req.body;
	// Verify Theater Owner

	const parsedShowTime = new Date(showTime); // Convert to Date object
	const utcShowTime = parsedShowTime.toISOString(); // Ensure UTC format

	try {
		const theater = await Theater.findOne({ theaterId: theaterid })
			.populate("owner", "ownerId username _id")
			.lean();

		if (!theater || theater.adminApprovalStatus !== "Approved")
			throw new HandleError(
				"This theater is not found or is not available to host shows",
				404
			);
		const checkmovie = await Movie.findById(movie)
			.select("movieId movieName movieduration adminApprovalStatus")
			.lean();
		if (!checkmovie || checkmovie.adminApprovalStatus !== "Approved")
			throw new HandleError(
				"This movie is not found or is not available to show",
				404
			);

		if (
			req.user.role !== "Admin" &&
			!new ObjectId(req.user.loggedUserObjectId).equals(theater.owner._id)
		) {
			throw new HandleError("You are not authorized to do this", 403);
		}
		const validShowTime = validateDateTime(utcShowTime);
		if (validShowTime) {
			const overlapExists = await checkOverlappingShows(
				theater._id,
				utcShowTime,
				checkmovie.movieduration
			);
			if (overlapExists) {
				throw new HandleError(
					"Show overlaps with an existing show in the theater.",
					400
				);
			}
			const show = new Show({
				showTime: utcShowTime,
				movie,
				theater: theater._id,
			});
			await show.save();
			return res.status(201).json({ message: "Successfully created show" });
		}
	} catch (err) {
		return res
			.status(err?.statusCode || 500)
			.json({ message: "Error", error: err?.message });
	}
};

export const individualShow = async (req, res, next) => {
	const { showId, theaterId } = req.params;

	try {
		const show = await Show.findOne({ showId: showId })
			.populate("movie")
			.populate("theater", "theaterName theaterId seats seatClasses owner");
		if (!show) throw new Error("No such show exists");
		return res.status(200).json(show);
	} catch (err) {
		res
			.status(err?.statusCode || 404)
			.json({ error: "Couldn't find show details", message: err });
	}
};

export const editShow = async (req, res, next) => {
	const { showid } = req.params;
	try {
		const show = await Show.findOne({ showId: showid })
			.populate("movie", "movieName movieduration")
			.populate("theater", "theaterName seats seatClasses owner");

		if (!show || show.deleted)
			return res.status(404).json({
				error: "Show Cannot Be Accessed",
				message: "Show not found or deleted",
			});

		if (
			req.user.role !== "Admin" &&
			!new ObjectId(req.user.loggedUserObjectId).equals(show.theater.owner)
		) {
			throw new Error("You are not authorized to do this");
		}
		const { showTime, movie } = req.body;

		const parsedShowTime = new Date(showTime); // Convert to Date object

		const utcShowTime = parsedShowTime.toISOString();

		const validShowTime = validateDateTime(utcShowTime);
		if (validShowTime) {
			// Check for overlapping shows, excluding the current show

			const overlapExists = await checkOverlappingShows(
				show.theater._id,
				utcShowTime,
				show.movie.movieduration,
				show._id
			);

			if (overlapExists) {
				throw new HandleError(
					"Show overlaps with an existing show in the theater.",
					400
				);
			}
			const updatedShow = await Show.findOneAndUpdate(
				{ showId: showid },
				{ showTime: utcShowTime, movie },
				{ runValidators: true, new: true }
			);

			return res
				.status(201)
				.json({ message: `Succesfully Updated ${showid}`, updatedShow });
		}
	} catch (err) {
		return res
			.status(err?.statusCode || 500)
			.json({ message: "Error", error: err?.message });
	}
};

export const deleteShow = async (req, res, next) => {
	const { showid } = req.params;
	try {
		const show = await Show.findOne({ showId: showid })
			.populate("movie", "movieName")
			.populate("theater", "theaterName seats seatClasses owner");

		if (
			req.user.role !== "Admin" &&
			!new ObjectId(req.user.loggedUserObjectId).equals(show.theater.owner)
		) {
			throw new Error("You are not authorized to do this");
		}
		handleShowDeletion(showid);

		return res.status(204).json({ message: `Succesfully Deleted ${showid}` });
	} catch (err) {
		return res
			.status(err?.statusCode || 500)
			.json({ message: "Error", error: err?.message });
	}
};
