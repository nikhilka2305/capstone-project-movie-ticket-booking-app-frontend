import { createContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
axios.defaults.withCredentials = true;
export const AuthContext = createContext({
	auth: {
		isAuthenticated: false,
		user: {
			loggedUserId: "",
			loggedUserName: "",
			loggedUserObjectId: "",
			role: "",
		},
		loading: true,
	},
	logOn: () => {},
	logOut: () => {},
	checkAuth: () => {},
});

export const AuthProvider = ({ children }) => {
	const [auth, setAuth] = useState({
		isAuthenticated: false,
		user: {
			loggedUserId: "",
			loggedUserName: "",
			loggedUserObjectId: "",
			role: "",
		},
		loading: true,
	});

	const serverBaseUrl = `${import.meta.env.VITE_SERVER_BASE_URL}`;
	const checkAuth = async () => {
		try {
			const response = await axios.get(`${serverBaseUrl}/check-user`);

			if (response.status === 200 && response.data.user) {
				const userData = response.data.user;

				setAuth({ isAuthenticated: true, user: userData, loading: false });
			} else {
				setAuth({
					isAuthenticated: false,
					user: {
						loggedUserId: "",
						loggedUserName: "",
						loggedUserObjectId: "",
						role: "",
					},
					loading: false,
				});
			}
		} catch (err) {
			toast.error("Unable to authenticate");
			setAuth({
				isAuthenticated: false,
				user: {
					loggedUserId: "",
					loggedUserName: "",
					loggedUserObjectId: "",
					role: "",
				},
				loading: false,
			});
		}
	};

	const login = (userData) => {
		setAuth({
			isAuthenticated: true,
			user: userData,
			loading: false,
		});
	};

	const logOut = async () => {
		try {
			await axios.post(
				`${serverBaseUrl}/logout`,
				{},
				{ withCredentials: true }
			);
			setAuth({
				isAuthenticated: false,
				user: {
					loggedUserId: "",
					loggedUserName: "",
					loggedUserObjectId: "",
					role: "",
				},
				loading: false,
			});
		} catch (err) {
			toast.error("Unable to logout");
		}
	};

	useEffect(() => {
		checkAuth();
	}, []);
	useEffect(() => {}, [auth]);

	return (
		<AuthContext.Provider
			value={{ ...auth, setAuth, login, logOut, checkAuth }}
		>
			{auth.loading && <div>Loading...</div>}
			{!auth.loading && children}
		</AuthContext.Provider>
	);
};
