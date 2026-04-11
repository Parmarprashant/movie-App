import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FavoritesContext } from "../context/FavoritesContext";

export function MovieCard({ movie, showRemove }) {
  const navigate = useNavigate();
  const { addFavorite, removeFavorite, isFavorite } = useContext(FavoritesContext);
  const fav = isFavorite(movie.imdbID);
  const isSeries = movie.Type === "series";

  return (
    <div className="movie-card">
      <div className="movie-poster-wrap">
        {movie.Poster && movie.Poster !== "N/A"
          ? <img src={movie.Poster} alt={movie.Title} className="movie-poster"
              onError={e => { e.target.onerror=null; e.target.style.display="none"; }} />
          : <div className="poster-placeholder">🎬<span style={{fontSize:"0.7rem",color:"var(--muted)"}}>No Image</span></div>
        }
        <div className="poster-overlay" />
        <span className={`movie-type-badge ${isSeries ? "series" : ""}`}>
          {isSeries ? "Series" : "Film"}
        </span>
        <span className="movie-year-badge">{movie.Year}</span>
      </div>
      <div className="movie-info">
        <div className="movie-title">{movie.Title}</div>
        <div className="movie-actions">
          <button className="btn btn-outline btn-sm" onClick={() => navigate(`/movie/${movie.imdbID}`)}>
            Details
          </button>
          {showRemove ? (
            <button className="btn btn-remove btn-sm" onClick={() => removeFavorite(movie.imdbID)}>
              Remove
            </button>
          ) : (
            <button
              className={`btn btn-fav btn-sm ${fav ? "active" : ""}`}
              onClick={() => fav ? removeFavorite(movie.imdbID) : addFavorite(movie.imdbID, movie.Type || "movie")}
            >
              {fav ? "❤️ Saved" : "🤍 Save"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
