import { useState } from "react";
import Input from "../../components/shared/formcomponents/Input";
import Button from "../../components/shared/formcomponents/Button";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function AdminSignUp() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [email, setEmail] = useState("");
	const [mobile, setMobile] = useState("");
	const navigate = useNavigate();
	const serverUrl = `${import.meta.env.VITE_SERVER_BASE_URL}/admin/register`;
	const handleSignUpFormSubmit = async (evt) => {
		evt.preventDefault();

		const user = {
			username: username,
			email: email,
			password: password,
			mobile: mobile,
		};
		console.log(user);
		try {
			const userSignup = await axios.post(serverUrl, user, {
				headers: {
					"Content-Type": "application/json",
				},
			});
			console.log(userSignup);
			navigate("/adminauth/adminlogin");
		} catch (err) {
			console.log(err);
		}
	};

	return (
		<section className="mx-auto my-8 w-full sm:w-1/2 lg:w-1/3 flex flex-col gap-8 ">
			<h2 className="text-center">Register New Theater Owner</h2>
			<form
				action=""
				className="border rounded-md border-slate-900 py-8 bg-slate-200 dark:bg-slate-700 flex flex-col gap-4"
				onSubmit={handleSignUpFormSubmit}
			>
				<Input
					label="Enter Username"
					name="username"
					id="username"
					type="text"
					required
					value={username}
					onChange={setUsername}
					minlength="5"
					maxlength="15"
				/>
				<Input
					label="Enter Password"
					name="password"
					id="password"
					type="password"
					required
					value={password}
					onChange={setPassword}
					minlength="5"
					maxlength="15"
				/>
				<Input
					label="Enter Email"
					name="email"
					id="email"
					type="email"
					inputmode="email"
					required
					value={email}
					onChange={setEmail}
					minlength={10}
					maxlength="30"
				/>
				<Input
					label="Enter Mobile"
					name="mobile"
					id="mobile"
					type="tel"
					pattern="[0-9]{10}"
					required
					value={mobile}
					minlength="10"
					maxlength="10"
					onChange={setMobile}
				/>
				<Button label="Submit" />
			</form>
		</section>
	);
}

export default AdminSignUp;