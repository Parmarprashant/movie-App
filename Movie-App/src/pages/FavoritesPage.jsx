import { useState, useEffect, useContext } from "react";
import { FavoritesContext } from "../context/FavoritesContext";
import { fetchDetail } from "../api/api";
import { MovieCard } from "../components/MovieCard";

export function FavoritesPage() {
  const { favorites, removeFavorite } = useContext(FavoritesContext);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (favorites.length === 0) { setMovies([]); return; }
    setLoading(true);
    const meta = (() => {
      try { return JSON.parse(localStorage.getItem("fav_meta") || "{}"); }
      catch { return {}; }
    })();
    Promise.all(
      favorites.map(id =>
        fetchDetail(id, meta[id] || "movie").catch(() => null)
      )
    ).then(results => {
      setMovies(results.filter(Boolean));
      setLoading(false);
    });
  }, [favorites.join(",")]);

  return (
    <div className="page">
      <div className="fav-header">
        <div>
          <h1 className="page-title">Favorites</h1>
          <p className="page-subtitle">Your personal collection</p>
        </div>
        {favorites.length > 0 && (
          <span className="fav-count-pill">{favorites.length} saved</span>
        )}
      </div>

      {loading && <div className="loading"><div className="spinner" /><span>Loading favorites…</span></div>}

      {!loading && favorites.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🤍</div>
          <h3>No favorite movies added.</h3>
          <p>Go explore and save movies you love!</p>
        </div>
      )}

      {!loading && movies.length > 0 && (
        <div className="movies-grid">
          {movies.map(m => <MovieCard key={m.imdbID} movie={m} showRemove />)}
        </div>
      )}
    </div>
  );
}
