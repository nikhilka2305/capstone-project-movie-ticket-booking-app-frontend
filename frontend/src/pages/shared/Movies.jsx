import axios from "axios";
import { useEffect, useState } from "react";
import PosterSlider from "../../components/shared/PosterSlider";
import { Pagination } from "../../components/shared/Pagination";
import Poster from "../../components/shared/Poster";
import { Link } from "react-router-dom";

export default function Movies() {
	const serverUrl = `${import.meta.env.VITE_SERVER_BASE_URL}/movie`;
	const [movies, setMovies] = useState([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1); // Current page
	const [totalPages, setTotalPages] = useState(1);
	useEffect(() => {
		setLoading(true);
		async function getMovies() {
			try {
				const response = await axios.get(`${serverUrl}`, {
					params: { page, limit: 8 },
				});
				const responseData = response.data;
				console.log(responseData);

				setMovies(responseData.movies);
				setTotalPages(responseData.totalPages);
				setLoading(false);
			} catch (err) {
				console.log(err);
			}
		}

		getMovies();
	}, [page]);

	return (
		<main className="py-8 px-8 flex flex-col items-center  min-h-svh w-full">
			<h1 className="text-2xl mb-lg-2 my-4">Movies Available</h1>
			{loading && <div>Loading...</div>}
			<PosterSlider posters={movies} classes="">
				{movies.map((item, i) => (
					<Link to={`/movies/${item.movieId}`} key={i}>
						<Poster url={item.posterImage} />
					</Link>
				))}
			</PosterSlider>
			<Pagination page={page} setPage={setPage} totalPages={totalPages} />
		</main>
	);
}