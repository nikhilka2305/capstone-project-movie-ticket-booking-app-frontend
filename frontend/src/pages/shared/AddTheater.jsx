import { useContext, useEffect, useState } from "react";
import Input from "../../components/shared/formcomponents/Input";
import Button from "../../components/shared/formcomponents/Button";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Select from "../../components/shared/formcomponents/Select";
import { buildFormData } from "../../utils/manageFormData";
import { AuthContext } from "../../context/AuthContext";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import toast from "react-hot-toast";
import ForwardedInput from "../../components/shared/ForwardedInput";

function AddTheater() {
	const {
		control,
		register,
		handleSubmit,
		setValue,
		getValues,
		reset,
		formState: { errors },
	} = useForm();
	const navigate = useNavigate();
	const { user } = useContext(AuthContext);

	const [owners, setOwners] = useState([]);
	const [loading, setLoading] = useState();
	const [theater, setTheater] = useState({
		theaterName: "",
		location: "",
		owner: "",
		seats: {
			rows: "",
			seatsPerRow: "",
		},
		seatClasses: [
			{
				className: "",
				price: "",
			},
		],
		amenities: {
			parking: "",
			restroom: "",
			foodCounters: "",
		},
		theaterimages: "",
	});
	const [feedback, setFeedback] = useState("");
	const handleChange = (field, value) => {
		// setTheater((prev) => ({ ...prev, [field]: value }));
	};

	const { fields, append, remove } = useFieldArray({
		control,
		name: "seatClasses",
	});

	useEffect(() => {
		if (user.role === "TheaterOwner") {
			setTheater((prevTheater) => {
				return { ...prevTheater, owner: user.loggedUserObjectId };
			});
		}
		async function getOwners() {
			setLoading(true);
			const serverUrl = `${import.meta.env.VITE_SERVER_BASE_URL}/theaterowner`;

			try {
				const theaterOwners = await axios.get(serverUrl, {
					params: { active: true },
				});

				console.log(theaterOwners.data);
				setOwners(theaterOwners.data);
			} catch (err) {
				console.log(err);
			}
		}
		setLoading(false);
		getOwners();
	}, []);

	const handleNestedChange = (fieldPath, value) => {
		setTheater((prev) => {
			const updatedTheater = { ...prev };
			const keys = fieldPath.split("."); // e.g., "seats.row"
			let current = updatedTheater;
			keys.slice(0, -1).forEach((key) => {
				current[key] = { ...current[key] }; // Clone nested objects
				current = current[key];
			});
			current[keys[keys.length - 1]] = value; // Set the value
			return updatedTheater;
		});
	};

	const addSeatClass = () => {
		setTheater((prev) => ({
			...prev,
			seatClasses: [...prev.seatClasses, { className: "", price: "" }],
		}));
		setFeedback("");
	};
	const removeSeatClass = (index) => {
		setTheater((prevState) => {
			if (prevState.seatClasses.length === 1) {
				setFeedback("Atleast one seat Class is needed");
				return { ...prevState };
			}

			const updatedSeatClasses = prevState.seatClasses.filter(
				(_, i) => i !== index
			); // Remove the selected seat class
			setFeedback("");
			return { ...prevState, seatClasses: updatedSeatClasses };
		});
	};
	const handleSeatClassChange = (index, field, value) => {
		setTheater((prev) => {
			const updatedSeatClasses = [...prev.seatClasses];
			updatedSeatClasses[index] = {
				...updatedSeatClasses[index],
				[field]: value,
			};
			return { ...prev, seatClasses: updatedSeatClasses };
		});
	};
	const handleAddTheater = async (data, evt) => {
		evt.preventDefault();
		console.log("Hello");
		let loadingToast = toast.loading("Adding Movie....");
		const addtheater = { ...data };
		console.log(addtheater);
		console.log(addtheater.theaterimages);
		if (!addtheater.theaterimages)
			throw new Error("You must include movie poster");

		const theaterFD = buildFormData(addtheater);
		console.log(theaterFD);
		let files = addtheater.theaterimages;
		for (let i = 0; i < files.length; i++) {
			theaterFD.append("theaterimages", files[i]);
		}
		for (var pair of theaterFD.entries()) {
			console.log(pair[0] + ", " + pair[1]);
		}

		const serverUrl = `${
			import.meta.env.VITE_SERVER_BASE_URL
		}/theater/addtheater`;

		try {
			console.log("Data");
			console.log(data);

			const theaterAdded = await axios.post(serverUrl, theaterFD, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});
			toast.dismiss(loadingToast);
			toast.success("Successfully Added Movie");
			console.log(theaterAdded);
			navigate("/theaters");
		} catch (err) {
			console.log(err);
			toast.error("Unable to Add Movie");
			toast.dismiss(loadingToast);
		}
	};
	return (
		<section className="mx-auto my-8 w-full lg:w-2/3 flex flex-col gap-8 ">
			<h2 className="text-center">Add New Theater</h2>
			{loading && <p>Loading</p>}
			<form
				action=""
				className="border rounded-md border-slate-900 py-8 bg-slate-200 dark:bg-slate-700 flex flex-col gap-4"
				onSubmit={handleSubmit(handleAddTheater)}
				noValidate
			>
				<Input
					label="Enter Theater Name"
					name="theaterName"
					id="theaterName"
					type="text"
					register={register}
					validationSchema={{
						required: "Theater Name required",
						minLength: {
							value: 5,
							message: "Please enter a minimum of 5 characters",
						},
					}}
					errors={errors}
				/>
				<Input
					label="Enter Location"
					name="location"
					id="location"
					type="text"
					register={register}
					validationSchema={{
						required: "Location required",
						minLength: {
							value: 5,
							message: "Please enter a minimum of 5 characters",
						},
					}}
					errors={errors}
				/>
				{user.role === "Admin" && (
					<Controller
						name="owner"
						control={control}
						defaultValue={""}
						rules={{
							required: "Please select a rating",
						}}
						render={({ field }) => (
							<Select
								label="Select an Owner"
								field="owner"
								options={owners}
								displayKey="username"
								valueKey="_id"
								defaultValue={""}
								onChange={field.onChange}
								errors={errors}
							/>
						)}
					/>
				)}

				<Input
					label="Enter No: of Rows"
					name="seats.rows"
					id="rows"
					type="number"
					register={register}
					validationSchema={{
						required: "No of Rows required",
						min: {
							value: 5,
							message: "Rows cannot be less than 5",
						},
					}}
					errors={errors}
				/>
				<Input
					label="Enter Seats Per Row"
					name="seats.seatsPerRow"
					id="seatsPerRow"
					type="number"
					register={register}
					validationSchema={{
						required: "No of Rows required",
						min: {
							value: 5,
							message: "Seats per Row cannot be less than 5",
						},
					}}
					errors={errors}
				/>
				{/* {theater.seatClasses.map((seatClass, index) => ( */}
				{fields.map((seatClass, index) => (
					<div
						key={`seatClass-${index}`}
						className="flex gap-4 items-center flex-wrap mx-auto max-w-full"
					>
						<Controller
							name={`seatClasses.${index}.className`}
							control={control}
							rules={{
								required: "Class Name required",
								minLength: {
									value: 5,
									message: "Minimum 5 characters required",
								},
							}}
							render={({ field }) => (
								<ForwardedInput
									{...field}
									label="Class Name"
									type="text"
									errors={errors}
								/>
							)}
						/>

						<Controller
							name={`seatClasses.${index}.price`}
							control={control}
							rules={{
								required: "Price required",
								min: { value: 0, message: "Price must be greater than 0" },
							}}
							render={({ field }) => (
								<ForwardedInput
									{...field}
									label="Price"
									type="number"
									errors={errors}
								/>
							)}
						/>

						<button className="flex flex-col justify-center px-8" type="button">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth="1.5"
								stroke="currentColor"
								className="size-8 hover:text-red-700 "
								onClick={() => removeSeatClass(index)}
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
								/>
							</svg>
						</button>
					</div>
				))}
				{feedback && <p className="text-red-500 mt-2 mx-auto">{feedback}</p>}

				<Button
					label="Add Seat Class"
					onClick={() => append({ className: "", price: "" })}
					type="button"
					colorClass="bg-blue-500 text-white hover:bg-white hover:text-blue-500 my-4"
				/>

				<h2 className="px-12 text-2xl font-bold text-center my-4">
					Add Amenities Details
				</h2>

				<Input
					label="Enter Parking Details"
					name="amenities.parking"
					id="parking"
					type="textarea"
					register={register}
					validationSchema={{
						minLength: {
							value: 20,
							message: "Enter atleast 20 characters",
						},
					}}
					errors={errors}
				/>
				<Input
					label="Enter Restroom Details"
					name="amenities.restroom"
					id="restroom"
					type="textarea"
					register={register}
					validationSchema={{
						minLength: {
							value: 20,
							message: "Enter atleast 20 characters",
						},
					}}
					errors={errors}
				/>
				<Input
					label="Enter Food Counter Details"
					name="amenities.foodCounters"
					id="foodCounter"
					type="textarea"
					register={register}
					validationSchema={{
						minLength: {
							value: 20,
							message: "Enter atleast 20 characters",
						},
					}}
					errors={errors}
				/>

				<Input
					label="Add poster Image"
					name="theaterimages"
					id="theaterimages"
					type="file"
					multiple
					classes="file-input file-input-lg file-input-ghost w-full"
					fileTypes={["image/jpeg", " image/jpg", " image/png"]}
					register={register}
					validationSchema={{
						required: "Theater Images required",
					}}
					errors={errors}
				/>

				<div className="button-group flex gap-4 justify-center">
					<Button
						label="Submit"
						onClick={() => {
							console.log(errors);
						}}
						type="submit"
					/>
					<Button
						label="Reset"
						onClick={() => {
							reset();
						}}
					/>
				</div>
			</form>
		</section>
	);
}

export default AddTheater;
