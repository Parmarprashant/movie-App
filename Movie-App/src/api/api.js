export const OMDB_KEY = "d3071438";

export const normaliseOmdb = (m) => ({
  imdbID:     m.imdbID     || "",
  Title:      m.Title      || "Unknown",
  Year:       m.Year       || "",
  Type:       m.Type       || "series",
  Genre:      m.Genre      || "",
  Plot:       m.Plot       || "N/A",
  imdbRating: m.imdbRating || "N/A",
  Director:   m.Director   || "N/A",
  Actors:     m.Actors     || "N/A",
  Awards:     m.Awards     || "N/A",
  Runtime:    m.Runtime    || "N/A",
  Rated:      m.Rated      || "N/A",
  Country:    m.Country    || "N/A",
  Poster:     m.Poster !== "N/A" ? m.Poster : "N/A",
  totalSeasons: m.totalSeasons || "",
  Response:   "True",
});

export const searchMoviesOmdb = async (query) => {
  const res = await fetch(
    `https://www.omdbapi.com/?apikey=${OMDB_KEY}&s=${encodeURIComponent(query)}&type=movie`
  );
  const data = await res.json();
  if (data.Response !== "True") return [];
  return (data.Search || []).map(m => ({
    imdbID: m.imdbID,
    Title:  m.Title,
    Year:   m.Year,
    Type:   m.Type || "movie",
    Poster: m.Poster !== "N/A" ? m.Poster : "N/A",
  }));
};

export const fetchMovieDetailOmdb = async (imdbID) => {
  const res = await fetch(
    `https://www.omdbapi.com/?apikey=${OMDB_KEY}&i=${imdbID}`
  );
  const m = await res.json();
  return {
    imdbID:     m.imdbID,
    Title:      m.Title      || "Unknown",
    Year:       m.Year       || "",
    Type:       m.Type       || "movie",
    Genre:      m.Genre      || "",
    Plot:       m.Plot       || "N/A",
    imdbRating: m.imdbRating || "N/A",
    Director:   m.Director   || "N/A",
    Actors:     m.Actors     || "N/A",
    Awards:     m.Awards     || "N/A",
    Runtime:    m.Runtime    || "N/A",
    Rated:      m.Rated      || "N/A",
    Country:    m.Country    || "N/A",
    Poster:     m.Poster !== "N/A" ? m.Poster : "N/A",
    Response:   "True",
  };
};

export const searchSeriesOmdb = async (query) => {
  const res = await fetch(
    `https://www.omdbapi.com/?apikey=${OMDB_KEY}&s=${encodeURIComponent(query)}&type=series`
  );
  const data = await res.json();
  if (data.Response !== "True") return [];
  return (data.Search || []).map(normaliseOmdb);
};

export const fetchSeriesDetailOmdb = async (imdbID) => {
  const res = await fetch(
    `https://www.omdbapi.com/?apikey=${OMDB_KEY}&i=${imdbID}&type=series`
  );
  const data = await res.json();
  return normaliseOmdb(data);
};

export const TVMAZE = "https://api.tvmaze.com";

export const searchTVMaze = async (title) => {
  const res = await fetch(`${TVMAZE}/search/shows?q=${encodeURIComponent(title)}`);
  const data = await res.json();
  return data;
};

export const fetchTVMazeEpisodes = async (showId) => {
  const res = await fetch(`${TVMAZE}/shows/${showId}/episodes`);
  return await res.json();
};

export const fetchTVMazeSeasons = async (showId) => {
  const res = await fetch(`${TVMAZE}/shows/${showId}/seasons`);
  return await res.json();
};

export const searchAll = async (query) => {
  const [movies, series] = await Promise.allSettled([
    searchMoviesOmdb(query),
    searchSeriesOmdb(query),
  ]);
  return [
    ...(movies.status === "fulfilled" ? movies.value : []),
    ...(series.status === "fulfilled" ? series.value : []),
  ];
};

export const fetchDetail = async (imdbID, type) => {
  if (type === "series") return fetchSeriesDetailOmdb(imdbID);
  return fetchMovieDetailOmdb(imdbID);
};
