import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchDetail } from "../api/api";
import { FavoritesContext } from "../context/FavoritesContext";
import { EpisodesPanel } from "../components/EpisodesPanel";

export function MovieDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const [activeTab, setActiveTab] = useState("info");
  const { addFavorite, removeFavorite, isFavorite } = useContext(FavoritesContext);

  useEffect(() => {
    setLoading(true); setActiveTab("info");
    const savedType = (() => {
      try {
        const meta = JSON.parse(localStorage.getItem("fav_meta") || "{}");
        return meta[id] || "movie";
      } catch { return "movie"; }
    })();
    fetchDetail(id, savedType)
      .then(data => { setMovie(data); setLoading(false); })
      .catch(() => { setError("Failed to load details."); setLoading(false); });
  }, [id]);

  if (loading) return <div className="loading"><div className="spinner" /><span>Loading details…</span></div>;
  if (error)   return <div className="page"><div className="error-msg">{error}</div></div>;
  if (!movie)  return null;

  const fav = isFavorite(movie.imdbID);
  const isSeries = movie.Type === "series";

  return (
    <div className="page">
      <div className="detail-back" onClick={() => navigate(-1)}>← Back</div>

      <div className="detail-layout">
        <div className="detail-poster-wrap">
          {movie.Poster && movie.Poster !== "N/A"
            ? <img src={movie.Poster} alt={movie.Title} className="detail-poster" onError={e => { e.target.onerror=null; e.target.style.display="none"; }} />
            : <div className="detail-poster-placeholder">🎬<span style={{fontSize:"1rem",marginTop:"0.5rem"}}>No Poster</span></div>
          }
        </div>

        <div className="detail-info">
          <h1 className="detail-title">{movie.Title}</h1>
          <div className="detail-badges">
            {movie.Year   && <span className="tag">{movie.Year}</span>}
            {isSeries     && <span className="tag accent">📺 Series</span>}
            {movie.totalSeasons && <span className="tag">🗂 {movie.totalSeasons} Seasons</span>}
            {movie.Genre  && movie.Genre.split(",").map(g => <span key={g} className="tag accent">{g.trim()}</span>)}
            {movie.Rated  && <span className="tag">{movie.Rated}</span>}
            {movie.Runtime && movie.Runtime !== "N/A" && <span className="tag">⏱ {movie.Runtime}</span>}
            {movie.Country && movie.Country !== "N/A" && <span className="tag">🌍 {movie.Country}</span>}
          </div>

          {movie.imdbRating && movie.imdbRating !== "N/A" && (
            <div className="detail-rating">⭐ {movie.imdbRating} <span style={{opacity:0.6,fontWeight:400,fontSize:"0.85rem"}}>/10 IMDb</span></div>
          )}

          <button
            className={`btn ${fav ? "btn-fav active" : "btn-fav"}`}
            style={{marginBottom:"0.5rem"}}
            onClick={() => fav ? removeFavorite(movie.imdbID) : addFavorite(movie.imdbID, movie.Type || "movie")}
          >
            {fav ? "❤️ Remove from Favorites" : "🤍 Add to Favorites"}
          </button>

          <div className="tabs">
            <button className={`tab-btn ${activeTab === "info" ? "active" : ""}`} onClick={() => setActiveTab("info")}>
              ℹ️ Info
            </button>
            {isSeries && (
              <button className={`tab-btn ${activeTab === "episodes" ? "active" : ""}`} onClick={() => setActiveTab("episodes")}>
                📺 Episodes
              </button>
            )}
          </div>

          {activeTab === "info" && (
            <>
              {movie.Plot && movie.Plot !== "N/A" && (
                <><div className="detail-section-title">Plot</div><p className="detail-plot">{movie.Plot}</p></>
              )}
              {movie.Director && movie.Director !== "N/A" && (
                <><div className="detail-section-title">Director</div><p className="detail-plot">{movie.Director}</p></>
              )}
              {movie.Actors && movie.Actors !== "N/A" && (
                <>
                  <div className="detail-section-title">Cast</div>
                  <ul className="cast-list">
                    {movie.Actors.split(",").map(a => <li key={a}>{a.trim()}</li>)}
                  </ul>
                </>
              )}
              {movie.Awards && movie.Awards !== "N/A" && (
                <><div className="detail-section-title">Awards</div><p className="detail-plot">{movie.Awards}</p></>
              )}
            </>
          )}

          {activeTab === "episodes" && isSeries && <EpisodesPanel title={movie.Title} />}
        </div>
      </div>
    </div>
  );
}
