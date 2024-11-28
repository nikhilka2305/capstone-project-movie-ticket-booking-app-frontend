import { useContext, useEffect, useState } from "react";
import Input from "../../components/shared/formcomponents/Input";
import Button from "../../components/shared/formcomponents/Button";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import Select from "../../components/shared/formcomponents/Select";
function AddShow() {
	const {
		control,
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm();

	const navigate = useNavigate();
	const { user } = useContext(AuthContext);
	const [theater, setTheater] = useState({});
	const [movies, setMovies] = useState({});
	const [show, setShow] = useState({});
	const [loading, setLoading] = useState(true);
	const { theaterid } = useParams();
	console.log(theaterid);

	useEffect(() => {
		setLoading(true);
		console.log("use effect");
		async function fetchData() {
			const serverUrl = `${import.meta.env.VITE_SERVER_BASE_URL}`;
			try {
				const theaterData = await axios.get(
					`${serverUrl}/theater/${theaterid}`
				);
				const theater = theaterData.data;
				console.log(theater);
				if (
					user.role !== "Admin" &&
					user.loggedUserObjectId !== theater.owner.toString()
				) {
					console.log("logged User Id", user.loggedUserObjectId, theater.owner);
					console.log("NOt owner");
					navigate("/theaters");
				} else console.log("Yes Ad...");
				setTheater(theater);
				const movieData = await axios.get(`${serverUrl}/movie`);
				const movies = movieData.data;
				console.log(movies);
				setMovies(movies);
				setLoading(false);
			} catch (err) {
				console.log(err);
				setLoading(false);
			}
		}
		fetchData();
	}, [theaterid, navigate, user.loggedUserObjectId, user.role]);

	const handleAddShow = async function (data, evt) {
		evt.preventDefault();
		let loadingToast = toast.loading("Adding Show....");
		console.log("Handle Show.");
		const serverUrl = `${
			import.meta.env.VITE_SERVER_BASE_URL
		}/theater/${theaterid}/newShow`;
		const show = { ...data };
		console.log(show);
		try {
			const addShow = await axios.post(serverUrl, show, {
				headers: {
					"Content-Type": "application/json",
				},
			});
			console.log(addShow);
			toast.dismiss(loadingToast);
			toast.success("Successfully Added Show");
			navigate("/login");
		} catch (err) {
			toast.dismiss(loadingToast);
			toast.error("Unable to Add Show");
			console.log(err);
		}
	};

	return (
		<section className="mx-auto my-8 w-full lg:w-2/3 flex flex-col gap-8 ">
			<h2 className="text-center">Add New Show</h2>
			{loading && <p>Loading</p>}
			{!loading && (
				<form
					action=""
					className="border rounded-md border-slate-900 py-8 bg-slate-200 dark:bg-slate-700 flex flex-col gap-4"
					onSubmit={handleSubmit(handleAddShow)}
					noValidate
				>
					<Controller
						name="movie"
						control={control}
						defaultValue={""}
						rules={{
							required: "Please select a movie",
						}}
						render={({ field }) => (
							<Select
								label="Choose a Movie"
								field="movie"
								options={movies}
								displayKey="movieName"
								valueKey="_id"
								defaultValue={""}
								onChange={field.onChange}
								errors={errors}
							/>
						)}
					/>
					<Input
						label="Enter Show Date & Tome"
						name="showTime"
						id="showTime"
						type="datetime-local"
						register={register}
						validationSchema={{
							required: "Date & Time required",
						}}
						errors={errors}
					/>
					<div className="button-group flex gap-4 justify-center">
						<Button
							type="submit"
							label="Submit"
							onClick={() => {
								console.log(errors);
							}}
						/>
						<Button
							label="Reset"
							onClick={() => {
								reset();
							}}
						/>
					</div>
				</form>
			)}
		</section>
	);
}

export default AddShow;
