import { useState, useEffect, useContext, createContext } from "react";

// ─── OMDB API (Movies + Series) ───────────────────────────────────────────────
const OMDB_KEY = "d3071438";

const normaliseOmdb = (m) => ({
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

const searchMoviesOmdb = async (query) => {
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

const fetchMovieDetailOmdb = async (imdbID) => {
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

const searchSeriesOmdb = async (query) => {
  const res = await fetch(
    `https://www.omdbapi.com/?apikey=${OMDB_KEY}&s=${encodeURIComponent(query)}&type=series`
  );
  const data = await res.json();
  if (data.Response !== "True") return [];
  return (data.Search || []).map(normaliseOmdb);
};

const fetchSeriesDetailOmdb = async (imdbID) => {
  const res = await fetch(
    `https://www.omdbapi.com/?apikey=${OMDB_KEY}&i=${imdbID}&type=series`
  );
  const data = await res.json();
  return normaliseOmdb(data);
};

const TVMAZE = "https://api.tvmaze.com";

const searchTVMaze = async (title) => {
  const res = await fetch(`${TVMAZE}/search/shows?q=${encodeURIComponent(title)}`);
  const data = await res.json();
  return data;
};

const fetchTVMazeEpisodes = async (showId) => {
  const res = await fetch(`${TVMAZE}/shows/${showId}/episodes`);
  return await res.json();
};

const fetchTVMazeSeasons = async (showId) => {
  const res = await fetch(`${TVMAZE}/shows/${showId}/seasons`);
  return await res.json();
};

const searchAll = async (query) => {
  const [movies, series] = await Promise.allSettled([
    searchMoviesOmdb(query),
    searchSeriesOmdb(query),
  ]);
  return [
    ...(movies.status === "fulfilled" ? movies.value : []),
    ...(series.status === "fulfilled" ? series.value : []),
  ];
};

const fetchDetail = async (imdbID, type) => {
  if (type === "series") return fetchSeriesDetailOmdb(imdbID);
  return fetchMovieDetailOmdb(imdbID);
};

// ─── FAVORITES CONTEXT ───────────────────────────────────────────────────────
const FavoritesContext = createContext();

function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fav_ids") || "[]"); }
    catch { return []; }
  });

  const addFavorite = (id, type = "movie") => {
    if (favorites.includes(id)) return;
    const updated = [...favorites, id];
    setFavorites(updated);
    localStorage.setItem("fav_ids", JSON.stringify(updated));
    try {
      const meta = JSON.parse(localStorage.getItem("fav_meta") || "{}");
      meta[id] = type;
      localStorage.setItem("fav_meta", JSON.stringify(meta));
    } catch {}
  };

  const removeFavorite = (id) => {
    const updated = favorites.filter(f => f !== id);
    setFavorites(updated);
    localStorage.setItem("fav_ids", JSON.stringify(updated));
    try {
      const meta = JSON.parse(localStorage.getItem("fav_meta") || "{}");
      delete meta[id];
      localStorage.setItem("fav_meta", JSON.stringify(meta));
    } catch {}
  };

  const isFavorite = (id) => favorites.includes(id);

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

// ─── ROUTER (hash-based, no external deps) ───────────────────────────────────
function useRoute() {
  const [path, setPath] = useState(window.location.hash || "#/");

  useEffect(() => {
    const handler = () => setPath(window.location.hash || "#/");
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const navigate = (to) => { window.location.hash = to; };

  const match = (pattern) => {
    if (pattern === "#/movie/:id") {
      const m = path.match(/^#\/movie\/(.+)$/);
      return m ? { id: m[1] } : null;
    }
    return path === pattern ? {} : null;
  };

  return { path, navigate, match };
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Sora:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0f0f1e;
    --surface: #1a1a2e;
    --card: #242d4a;
    --card-hover: #2d3a5f;
    --accent: #ff4757;
    --accent-light: #ff6b7a;
    --accent-glow: rgba(255,71,87,0.25);
    --accent2: #ffa502;
    --text: #f5f7fa;
    --text-secondary: #b8bcc8;
    --muted: #7a84a0;
    --border: #2a3351;
    --border-bright: #3d4a6b;
    --radius: 16px;
    --radius-lg: 24px;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Sora', sans-serif;
    min-height: 100vh;
    overflow-x: hidden;
    line-height: 1.6;
  }

  /* ANIMATED GRAIN OVERLAY */
  body::before {
    content: '';
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    opacity: 0.03;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 180px;
  }

  /* AMBIENT GLOW */
  body::after {
    content: '';
    position: fixed; top: -20%; left: 50%; transform: translateX(-50%);
    width: 1200px; height: 800px;
    background: radial-gradient(ellipse, rgba(255,71,87,0.08) 0%, transparent 70%);
    pointer-events: none; z-index: 0;
    animation: pulse 12s ease-in-out infinite alternate;
  }

  @keyframes pulse { 
    from { opacity: 0.4; transform: translateX(-50%) scale(1); } 
    to { opacity: 0.7; transform: translateX(-50%) scale(1.15); } 
  }

  @keyframes fadeUp   { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn   { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideIn  { from { opacity: 0; transform: translateX(-24px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes scaleIn  { from { opacity: 0; transform: scale(0.90); } to { opacity: 1; transform: scale(1); } }
  @keyframes shimmer  { from { background-position: -400px 0; } to { background-position: 400px 0; } }
  @keyframes spin     { to { transform: rotate(360deg); } }
  @keyframes heartBeat { 0%,100%{transform:scale(1)} 30%{transform:scale(1.35)} 60%{transform:scale(0.9)} }
  @keyframes cardReveal { from { opacity: 0; transform: translateY(36px) scale(0.94); } to { opacity: 1; transform: translateY(0) scale(1); } }

  /* ── NAVBAR ─────────────────────────────────────────────────────────────── */
  .navbar {
    position: sticky; top: 0; z-index: 200;
    background: rgba(15, 15, 30, 0.85);
    backdrop-filter: blur(28px) saturate(190%);
    border-bottom: 1px solid var(--border);
    padding: 0 3rem;
    display: flex; align-items: center; justify-content: space-between;
    height: 72px;
    animation: fadeIn 0.5s ease both;
  }

  .navbar::after {
    content: '';
    position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,71,87,0.3), transparent);
  }

  .nav-brand {
    font-family: 'Playfair Display', serif;
    font-size: 1.85rem; letter-spacing: 2px; font-weight: 700;
    cursor: pointer; user-select: none;
    position: relative;
  }

  .nav-brand .brand-cine { color: var(--accent); }
  .nav-brand .brand-vault {
    color: var(--text);
    opacity: 0.9;
  }

  .nav-brand::after {
    content: '';
    position: absolute; bottom: -4px; left: 0; width: 0; height: 2px;
    background: linear-gradient(90deg, var(--accent), transparent);
    transition: width 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .nav-brand:hover::after { width: 100%; }

  .nav-links { display: flex; gap: 0.6rem; align-items: center; }

  .nav-link {
    padding: 0.6rem 1.3rem;
    border-radius: 12px;
    color: var(--muted);
    font-weight: 500; font-size: 0.90rem;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    border: 1px solid transparent;
    background: none; user-select: none;
    letter-spacing: 0.4px;
    position: relative; overflow: hidden;
  }

  .nav-link::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255, 71, 87, 0.1), rgba(255, 165, 2, 0.04));
    opacity: 0; transition: opacity 0.25s;
    border-radius: 12px;
  }

  .nav-link:hover { 
    color: var(--text); 
    transform: translateY(-2px);
  }

  .nav-link:hover::before { opacity: 1; }

  .nav-link.active {
    color: var(--text);
    border-color: rgba(255, 71, 87, 0.5);
    background: rgba(255, 71, 87, 0.10);
    box-shadow: 0 0 20px rgba(255, 71, 87, 0.15), inset 0 0 8px rgba(255, 71, 87, 0.06);
  }

  .nav-fav-badge { display: inline-flex; align-items: center; gap: 8px; }

  .badge {
    background: var(--accent);
    color: white;
    border-radius: 99px;
    font-size: 0.70rem; font-weight: 700;
    padding: 2px 8px; min-width: 22px;
    text-align: center;
    box-shadow: 0 0 12px var(--accent-glow);
    animation: heartBeat 0.4s ease;
  }

  /* ── LAYOUT ──────────────────────────────────────────────────────────────── */
  .page {
    padding: 4rem 3rem;
    max-width: 1400px; margin: 0 auto;
    position: relative; z-index: 1;
    animation: fadeUp 0.5s ease both;
  }

  .page-title {
    font-family: 'Playfair Display', serif;
    font-size: 3.8rem; letter-spacing: 1px; font-weight: 800;
    margin-bottom: 0.8rem;
    background: linear-gradient(135deg, #fff 40%, rgba(255, 71, 87, 0.8) 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    line-height: 1.2;
  }

  .page-subtitle { 
    color: var(--text-secondary); 
    margin-bottom: 3rem; 
    font-size: 0.95rem; 
    letter-spacing: 0.4px;
    font-weight: 300;
  }

  /* ── HERO SEARCH SECTION ─────────────────────────────────────────────────── */
  .hero-section {
    text-align: center;
    padding: 3rem 0 2rem;
    position: relative;
    margin-bottom: 1rem;
    animation: fadeUp 0.6s 0.1s ease both;
  }

  .hero-icon {
    font-size: 4rem;
    margin-bottom: 1.5rem;
    display: block;
    animation: fadeUp 0.5s ease both;
    filter: drop-shadow(0 0 24px rgba(255, 71, 87, 0.3));
  }

  .hero-title {
    font-family: 'Playfair Display', serif;
    font-size: 2.6rem;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 0.8rem;
    letter-spacing: 0.5px;
  }

  .hero-desc {
    font-size: 0.98rem;
    color: var(--muted);
    max-width: 480px;
    margin: 0 auto 2.5rem;
    line-height: 1.7;
  }

  /* ── SEARCH BAR ─────────────────────────────────────────────────────────── */
  .search-bar {
    display: flex; gap: 1rem;
    margin-bottom: 2rem;
    animation: fadeUp 0.5s 0.15s ease both;
  }

  .search-wrap {
    flex: 1; position: relative;
  }

  .search-icon {
    position: absolute; left: 1.2rem; top: 50%; transform: translateY(-50%);
    color: var(--muted); font-size: 1.1rem; pointer-events: none;
    transition: color 0.2s;
  }

  .search-input {
    width: 100%;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0.95rem 1.3rem 0.95rem 3.2rem;
    color: var(--text);
    font-size: 0.95rem;
    font-family: 'Sora', sans-serif;
    outline: none;
    transition: border-color 0.3s, box-shadow 0.3s, background 0.3s;
    letter-spacing: 0.2px;
  }

  .search-input::placeholder { color: var(--muted); }

  .search-input:focus {
    border-color: rgba(255, 71, 87, 0.6);
    background: var(--card-hover);
    box-shadow: 0 0 0 4px rgba(255, 71, 87, 0.10), 0 6px 32px rgba(0, 0, 0, 0.4);
  }

  .search-input:focus ~ .search-icon { color: var(--accent); }

  /* ── FILTER BAR ─────────────────────────────────────────────────────────── */
  .filter-bar {
    display: flex; gap: 0.8rem; flex-wrap: wrap;
    margin-bottom: 2.5rem; align-items: center;
    animation: fadeUp 0.5s 0.2s ease both;
  }

  .filter-label {
    color: var(--muted); font-size: 0.80rem; font-weight: 600;
    text-transform: uppercase; letter-spacing: 1.2px;
  }

  .filter-select, .filter-input {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 0.60rem 1rem;
    color: var(--text);
    font-family: 'Sora', sans-serif; font-size: 0.87rem;
    outline: none; cursor: pointer;
    transition: border-color 0.25s, box-shadow 0.25s;
    appearance: none;
  }

  .filter-select:focus, .filter-input:focus {
    border-color: rgba(255, 165, 2, 0.6);
    box-shadow: 0 0 0 4px rgba(255, 165, 2, 0.10);
  }

  .filter-input { width: 120px; }
  .filter-input::placeholder { color: var(--muted); }

  /* ── BUTTONS ─────────────────────────────────────────────────────────────── */
  .btn {
    padding: 0.70rem 1.6rem;
    border-radius: var(--radius);
    border: none; cursor: pointer;
    font-family: 'Sora', sans-serif;
    font-weight: 600; font-size: 0.90rem;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    letter-spacing: 0.4px; position: relative; overflow: hidden;
  }

  .btn::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, transparent 50%);
    opacity: 0; transition: opacity 0.25s;
  }

  .btn:hover::after { opacity: 1; }

  .btn-primary {
    background: linear-gradient(135deg, #ff4757, #e63946);
    color: white;
    box-shadow: 0 6px 20px rgba(255, 71, 87, 0.35);
  }

  .btn-primary:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 36px rgba(255, 71, 87, 0.5);
  }

  .btn-primary:active { transform: translateY(-1px); }

  .btn-outline {
    background: transparent;
    border: 1px solid var(--border-bright);
    color: var(--text);
  }

  .btn-outline:hover { 
    border-color: rgba(255, 71, 87, 0.6); 
    color: var(--accent); 
    transform: translateY(-2px); 
  }

  .btn-fav {
    background: linear-gradient(135deg, #ffa502, #e89a00);
    color: #1a1a1a; font-weight: 700;
    box-shadow: 0 6px 20px rgba(255, 165, 2, 0.3);
  }

  .btn-fav:hover { 
    transform: translateY(-3px); 
    box-shadow: 0 10px 36px rgba(255, 165, 2, 0.45); 
  }

  .btn-fav.active {
    background: linear-gradient(135deg, #ff4757, #e63946);
    color: white;
    box-shadow: 0 6px 20px rgba(255, 71, 87, 0.4);
  }

  .btn-remove {
    background: rgba(255, 71, 87, 0.12);
    color: var(--accent); border: 1px solid rgba(255, 71, 87, 0.4);
  }

  .btn-remove:hover { 
    background: rgba(255, 71, 87, 0.25); 
    transform: translateY(-2px); 
  }

  .btn-sm { padding: 0.48rem 1rem; font-size: 0.81rem; }

  /* ── MOVIE GRID ─────────────────────────────────────────────────────────── */
  .movies-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(195px, 1fr));
    gap: 1.8rem;
  }

  .movie-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    display: flex; flex-direction: column;
    position: relative;
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
                border-color 0.35s, box-shadow 0.35s;
    animation: cardReveal 0.5s ease both;
    cursor: default;
  }

  .movie-card:nth-child(1)  { animation-delay: 0.05s; }
  .movie-card:nth-child(2)  { animation-delay: 0.10s; }
  .movie-card:nth-child(3)  { animation-delay: 0.15s; }
  .movie-card:nth-child(4)  { animation-delay: 0.20s; }
  .movie-card:nth-child(5)  { animation-delay: 0.25s; }
  .movie-card:nth-child(6)  { animation-delay: 0.30s; }
  .movie-card:nth-child(7)  { animation-delay: 0.35s; }
  .movie-card:nth-child(8)  { animation-delay: 0.40s; }

  .movie-card::before {
    content: '';
    position: absolute; inset: 0; z-index: 1; pointer-events: none;
    border-radius: var(--radius-lg);
    background: linear-gradient(135deg, rgba(255, 71, 87, 0.08) 0%, transparent 65%);
    opacity: 0; transition: opacity 0.35s;
  }

  .movie-card:hover {
    transform: translateY(-12px) scale(1.025);
    border-color: rgba(255, 71, 87, 0.55);
    box-shadow: 0 24px 72px rgba(0, 0, 0, 0.7), 0 0 40px rgba(255, 71, 87, 0.15);
  }

  .movie-card:hover::before { opacity: 1; }

  .movie-poster-wrap {
    position: relative;
    aspect-ratio: 2/3;
    overflow: hidden;
    background: var(--surface);
  }

  .movie-poster {
    width: 100%; height: 100%;
    object-fit: cover;
    transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .movie-card:hover .movie-poster { transform: scale(1.11); }

  .poster-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(15, 15, 30, 0.95) 0%, rgba(15, 15, 30, 0.3) 50%, transparent 100%);
    opacity: 0; transition: opacity 0.35s;
  }

  .movie-card:hover .poster-overlay { opacity: 1; }

  .poster-placeholder {
    width: 100%; height: 100%;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    color: var(--muted); font-size: 2.8rem; gap: 0.8rem;
    background: linear-gradient(135deg, var(--surface), var(--card));
  }

  .movie-type-badge {
    position: absolute; top: 12px; left: 12px; z-index: 2;
    background: rgba(0, 0, 0, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    color: var(--accent2); font-size: 0.68rem; font-weight: 700;
    padding: 4px 11px; border-radius: 8px;
    text-transform: uppercase; letter-spacing: 0.9px;
  }

  .movie-type-badge.series { color: #4ec7f7; border-color: rgba(78, 199, 247, 0.35); }

  .movie-year-badge {
    position: absolute; top: 12px; right: 12px; z-index: 2;
    background: rgba(0, 0, 0, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    color: var(--text); font-size: 0.70rem; font-weight: 600;
    padding: 4px 11px; border-radius: 8px;
  }

  .movie-info {
    padding: 1.2rem;
    display: flex; flex-direction: column; gap: 0.65rem;
    flex: 1; position: relative; z-index: 2;
  }

  .movie-title {
    font-weight: 600; font-size: 0.90rem; line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .movie-meta {
    color: var(--muted); font-size: 0.76rem;
    text-transform: uppercase; letter-spacing: 0.6px;
  }

  .movie-actions { 
    display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: auto; padding-top: 0.6rem; 
  }

  /* ── RESULTS INFO ──────────────────────────────────────────────────────── */
  .results-info {
    color: var(--muted); font-size: 0.84rem; margin-bottom: 1.5rem;
    display: flex; align-items: center; gap: 0.6rem;
    animation: fadeIn 0.3s ease both;
  }

  .results-info::before {
    content: '';
    width: 24px; height: 1px;
    background: var(--border-bright);
  }

  /* ── DETAIL PAGE ────────────────────────────────────────────────────────── */
  .detail-back {
    display: inline-flex; align-items: center; gap: 8px;
    color: var(--muted); font-size: 0.90rem; cursor: pointer;
    margin-bottom: 3rem;
    transition: all 0.25s;
    padding: 0.5rem 1rem 0.5rem 0.8rem;
    border-radius: 10px; border: 1px solid transparent;
    font-weight: 500;
  }

  .detail-back:hover {
    color: var(--text);
    border-color: var(--border-bright);
    background: var(--card);
    transform: translateX(-4px);
  }

  .detail-layout {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 4rem; align-items: start;
    animation: fadeUp 0.5s ease both;
  }

  .detail-poster-wrap {
    position: sticky; top: 100px;
  }

  .detail-poster {
    width: 100%; border-radius: 20px;
    border: 1px solid var(--border-bright);
    box-shadow: 0 36px 96px rgba(0, 0, 0, 0.75), 0 0 48px rgba(255, 71, 87, 0.12);
    transition: box-shadow 0.35s;
    animation: scaleIn 0.5s ease both;
  }

  .detail-poster:hover {
    box-shadow: 0 36px 96px rgba(0, 0, 0, 0.75), 0 0 72px rgba(255, 71, 87, 0.20);
  }

  .detail-poster-placeholder {
    width: 100%; aspect-ratio: 2/3;
    background: linear-gradient(135deg, var(--surface), var(--card));
    border-radius: 20px; border: 1px solid var(--border);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    color: var(--muted); font-size: 4.5rem; gap: 1.2rem;
  }

  .detail-info { animation: slideIn 0.5s 0.1s ease both; }

  .detail-title {
    font-family: 'Playfair Display', serif;
    font-size: 3.8rem; letter-spacing: 1px; line-height: 1.1;
    margin-bottom: 1.2rem;
    background: linear-gradient(135deg, #fff 60%, rgba(255, 255, 255, 0.65));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    font-weight: 700;
  }

  .detail-badges { display: flex; gap: 0.6rem; flex-wrap: wrap; margin-bottom: 1.8rem; }

  .tag {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid var(--border-bright);
    border-radius: 9px; padding: 5px 14px;
    font-size: 0.78rem; color: var(--muted); font-weight: 500;
    transition: all 0.25s;
  }

  .tag:hover { border-color: var(--border-bright); color: var(--text); }

  .tag.accent {
    background: rgba(255, 71, 87, 0.12);
    border-color: rgba(255, 71, 87, 0.35);
    color: #ff8a95;
  }

  .detail-rating {
    display: inline-flex; align-items: center; gap: 8px;
    background: linear-gradient(135deg, rgba(255, 165, 2, 0.14), rgba(255, 215, 0, 0.08));
    border: 1px solid rgba(255, 165, 2, 0.35);
    color: var(--accent2);
    border-radius: 12px; padding: 0.65rem 1.4rem;
    font-weight: 700; font-size: 1.1rem;
    margin-bottom: 1.8rem;
    box-shadow: 0 0 24px rgba(255, 165, 2, 0.12);
  }

  .detail-section-title {
    font-family: 'Playfair Display', serif;
    font-size: 0.88rem; letter-spacing: 2.5px;
    color: var(--muted); margin: 2rem 0 0.9rem;
    text-transform: uppercase;
    display: flex; align-items: center; gap: 0.85rem;
    font-weight: 600;
  }

  .detail-section-title::after {
    content: ''; flex: 1; height: 1px;
    background: linear-gradient(90deg, var(--border), transparent);
  }

  .detail-plot { line-height: 1.85; color: var(--text-secondary); font-size: 0.96rem; }

  .cast-list { display: flex; flex-wrap: wrap; gap: 0.6rem; list-style: none; }

  .cast-list li {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 10px; padding: 0.4rem 1rem;
    font-size: 0.82rem; color: var(--text);
    transition: all 0.25s;
  }

  .cast-list li:hover { 
    border-color: rgba(255, 165, 2, 0.5); 
    color: var(--accent2); 
    transform: translateY(-1px);
  }

  /* ── ABOUT PAGE ─────────────────────────────────────────────────────────── */
  .about-card {
    background: linear-gradient(135deg, var(--card), var(--surface));
    border: 1px solid var(--border);
    border-radius: 24px; padding: 3rem;
    max-width: 720px;
    animation: scaleIn 0.4s ease both;
    box-shadow: 0 24px 72px rgba(0, 0, 0, 0.5);
  }

  .about-card h2 {
    font-family: 'Playfair Display', serif;
    font-size: 2.8rem; letter-spacing: 1px; font-weight: 700;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    margin-bottom: 1.4rem;
  }

  .about-card p { color: var(--text-secondary); line-height: 1.8; margin-bottom: 1.2rem; font-size: 0.95rem; }
  .about-card a { color: var(--accent2); text-decoration: none; font-weight: 500; }
  .about-card a:hover { text-decoration: underline; }

  .about-api-box {
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid var(--border);
    border-radius: 12px; padding: 1.5rem;
    margin-top: 1.8rem; font-size: 0.84rem;
    color: var(--muted); font-family: 'Courier New', monospace;
    line-height: 2;
  }

  .about-api-box span { color: var(--accent2); }

  /* ── LOADING ─────────────────────────────────────────────────────────────── */
  .loading {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 1.5rem;
    padding: 6rem 0; color: var(--muted);
    animation: fadeIn 0.3s ease;
  }

  .loading span { font-size: 0.92rem; letter-spacing: 0.4px; font-weight: 500; }

  .spinner {
    width: 48px; height: 48px;
    border: 2.5px solid var(--border-bright);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    box-shadow: 0 0 20px rgba(255, 71, 87, 0.25);
  }

  .spinner-sm {
    width: 32px; height: 32px;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  /* SKELETON SHIMMER */
  .skeleton {
    background: linear-gradient(90deg, var(--card) 25%, var(--card-hover) 50%, var(--card) 75%);
    background-size: 800px 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 12px;
  }

  /* ── EMPTY STATE ─────────────────────────────────────────────────────────── */
  .empty-state {
    text-align: center; padding: 7rem 0; color: var(--muted);
    animation: fadeUp 0.4s ease;
  }

  .empty-icon { font-size: 4.5rem; margin-bottom: 1.5rem; display: block; }
  .empty-state h3 { font-size: 1.4rem; color: var(--text); margin-bottom: 0.6rem; font-weight: 600; }
  .empty-state p { font-size: 0.92rem; }

  /* ── ERROR ──────────────────────────────────────────────────────────────── */
  .error-msg {
    background: rgba(255, 71, 87, 0.08);
    border: 1px solid rgba(255, 71, 87, 0.3);
    color: #ff8a95; border-radius: var(--radius);
    padding: 1.2rem 1.8rem; margin-bottom: 1.8rem;
    font-size: 0.92rem; font-weight: 500;
    animation: fadeIn 0.3s ease;
  }

  /* ── TABS ────────────────────────────────────────────────────────────────── */
  .tabs {
    display: flex; gap: 0.35rem;
    margin: 2.2rem 0 1.8rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px; padding: 5px;
    width: fit-content;
  }

  .tab-btn {
    padding: 0.6rem 1.5rem;
    border: none; background: none;
    color: var(--muted);
    font-family: 'Sora', sans-serif;
    font-weight: 600; font-size: 0.88rem;
    cursor: pointer; border-radius: 10px;
    transition: all 0.3s; letter-spacing: 0.3px;
  }

  .tab-btn:hover { color: var(--text); background: rgba(255, 255, 255, 0.05); }

  .tab-btn.active {
    color: var(--text);
    background: var(--card-hover);
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.4);
  }

  /* ── SEASONS ─────────────────────────────────────────────────────────────── */
  .season-selector { display: flex; gap: 0.55rem; flex-wrap: wrap; margin-bottom: 1.8rem; }

  .season-btn {
    padding: 0.45rem 1.2rem;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--card);
    color: var(--muted);
    font-family: 'Sora', sans-serif; font-size: 0.82rem; font-weight: 600;
    cursor: pointer; transition: all 0.25s; letter-spacing: 0.4px;
  }

  .season-btn:hover { 
    border-color: rgba(255, 71, 87, 0.5); 
    color: var(--text); 
    transform: translateY(-2px); 
  }

  .season-btn.active {
    background: rgba(255, 71, 87, 0.14);
    border-color: rgba(255, 71, 87, 0.6);
    color: #ff8a95;
    box-shadow: 0 0 16px rgba(255, 71, 87, 0.12);
  }

  /* ── EPISODES LIST ──────────────────────────────────────────────────────── */
  .episodes-list { display: flex; flex-direction: column; gap: 0.65rem; }

  .episode-row {
    display: grid;
    grid-template-columns: 60px 1fr auto;
    align-items: center; gap: 1.2rem;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 14px; padding: 1rem 1.3rem;
    transition: all 0.3s; cursor: default;
    animation: fadeUp 0.3s ease both;
  }

  .episode-row:nth-child(even) { background: var(--surface); }

  .episode-row:hover {
    border-color: rgba(255, 71, 87, 0.4);
    background: var(--card-hover);
    transform: translateX(6px);
    box-shadow: -4px 0 0 rgba(255, 71, 87, 0.6), 6px 0 24px rgba(0, 0, 0, 0.4);
  }

  .ep-num {
    font-family: 'Playfair Display', serif;
    font-size: 1.3rem; color: rgba(255, 71, 87, 0.75);
    text-align: center; line-height: 1; font-weight: 700;
  }

  .ep-title { font-weight: 600; font-size: 0.90rem; line-height: 1.4; }
  .ep-date { color: var(--muted); font-size: 0.75rem; margin-top: 3px; }

  .ep-badge {
    font-size: 0.70rem; font-weight: 700;
    padding: 4px 12px; border-radius: 7px;
    white-space: nowrap; letter-spacing: 0.6px; text-transform: uppercase;
  }

  .ep-badge.aired {
    background: rgba(72, 199, 142, 0.14);
    color: #72d9a5; border: 1px solid rgba(72, 199, 142, 0.3);
  }

  .ep-badge.upcoming {
    background: rgba(255, 165, 2, 0.14);
    color: var(--accent2); border: 1px solid rgba(255, 165, 2, 0.3);
  }

  /* ── SHOW PICKER ─────────────────────────────────────────────────────────── */
  .show-info-bar {
    display: flex; align-items: center; gap: 1.1rem;
    margin-bottom: 1.8rem;
    background: linear-gradient(135deg, var(--card), var(--surface));
    border: 1px solid var(--border); border-radius: 14px;
    padding: 1rem 1.3rem;
    animation: slideIn 0.3s ease;
  }

  .show-thumb {
    width: 54px; height: 54px; border-radius: 10px;
    object-fit: cover; border: 1px solid var(--border-bright);
    flex-shrink: 0;
  }

  .show-info-name { font-weight: 700; font-size: 0.93rem; }
  .show-info-sub { color: var(--muted); font-size: 0.77rem; margin-top: 3px; }

  /* ── FAVORITES HEADER ────────────────────────────────────────────────────── */
  .fav-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 3rem;
  }

  .fav-count-pill {
    background: rgba(255, 71, 87, 0.12);
    border: 1px solid rgba(255, 71, 87, 0.35);
    color: #ff8a95; border-radius: 99px;
    padding: 0.4rem 1.2rem; font-size: 0.84rem; font-weight: 700;
  }

  /* ── MOBILE ──────────────────────────────────────────────────────────────── */
  @media (max-width: 768px) {
    .detail-layout { grid-template-columns: 1fr; gap: 2.5rem; }
    .detail-poster-wrap { position: static; }
    .detail-title { font-size: 2.6rem; }
    .navbar { padding: 0 1.5rem; height: 64px; }
    .nav-brand { font-size: 1.6rem; }
    .page { padding: 2rem 1.5rem; }
    .page-title { font-size: 2.8rem; }
    .movies-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1.2rem; }
    .episode-row { grid-template-columns: 50px 1fr; }
    .ep-date { display: none; }
    .search-bar { flex-direction: column; }
    .btn { font-size: 0.85rem; }
    .hero-section { margin-bottom: 0.5rem; }
    .hero-title { font-size: 2rem; }
  }
`;

// ─── NAVBAR ──────────────────────────────────────────────────────────────────
function Navbar({ path, navigate }) {
  const { favorites } = useContext(FavoritesContext);
  const links = [
    { label: "Home", hash: "#/", icon: "🏠" },
    { label: "Favorites", hash: "#/favorites", icon: "❤️", badge: favorites.length },
    { label: "About", hash: "#/about", icon: "ℹ️" },
  ];

  return (
    <nav className="navbar">
      <div className="nav-brand" onClick={() => navigate("#/")}>
        <span className="brand-cine">CINE</span>
        <span className="brand-vault">VAULT</span>
      </div>
      <div className="nav-links">
        {links.map(l => (
          <div
            key={l.hash}
            className={`nav-link ${path === l.hash || (l.hash === "#/" && (path === "" || path === "#/")) ? "active" : ""}`}
            onClick={() => navigate(l.hash)}
          >
            <span className="nav-fav-badge">
              {l.label}
              {l.badge > 0 && <span className="badge">{l.badge}</span>}
            </span>
          </div>
        ))}
      </div>
    </nav>
  );
}

// ─── MOVIE CARD ──────────────────────────────────────────────────────────────
function MovieCard({ movie, navigate, showRemove }) {
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
          <button className="btn btn-outline btn-sm" onClick={() => navigate(`#/movie/${movie.imdbID}`)}>
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

// ─── HOME PAGE ───────────────────────────────────────────────────────────────
function HomePage({ navigate }) {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterYear, setFilterYear] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const fetchMovies = async (q) => {
    if (!q.trim()) return;
    setLoading(true); setError(""); setHasSearched(true);
    setFilterType("all"); setFilterYear("");
    try {
      const results = await searchAll(q);
      if (results.length > 0) setMovies(results);
      else setError("No results found for that search.");
    } catch {
      setError("Failed to fetch. Check your connection.");
    }
    setLoading(false);
  };

  const filtered = movies.filter(m => {
    const typeOk = filterType === "all" || m.Type === filterType;
    const yearOk = !filterYear || m.Year.includes(filterYear);
    return typeOk && yearOk;
  });

  return (
    <div className="page">
      {!hasSearched ? (
        <div className="hero-section">
          <span className="hero-icon">🎬</span>
          <h2 className="hero-title">Discover Your Next Favorite</h2>
          <p className="hero-desc">Search across millions of movies and series. Rate, save, and explore what you love.</p>
        </div>
      ) : (
        <>
          <h1 className="page-title">Movie Explorer</h1>
          <p className="page-subtitle">Find and save your favorite films and series.</p>
        </>
      )}

      <div className="search-bar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Search movies, series, actors…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && fetchMovies(query)}
            autoFocus
          />
        </div>
        <button className="btn btn-primary" onClick={() => fetchMovies(query)}>Search</button>
      </div>

      {hasSearched && (
        <div className="filter-bar">
          <span className="filter-label">Filter:</span>
          <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="movie">Movies</option>
            <option value="series">Series</option>
          </select>
          <input
            className="filter-input"
            placeholder="Year…"
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
            maxLength={4}
          />
          {(filterType !== "all" || filterYear) && (
            <button className="btn btn-outline btn-sm" onClick={() => { setFilterType("all"); setFilterYear(""); }}>
              Clear Filters
            </button>
          )}
        </div>
      )}

      {loading && <div className="loading"><div className="spinner" /><span>Searching movies…</span></div>}
      {error && <div className="error-msg">⚠ {error}</div>}
      {!loading && !error && hasSearched && filtered.length > 0 && (
        <>
          <p className="results-info">{filtered.length} result{filtered.length !== 1 ? "s" : ""} found</p>
          <div className="movies-grid">
            {filtered.map(m => <MovieCard key={m.imdbID} movie={m} navigate={navigate} />)}
          </div>
        </>
      )}
      {!loading && !error && hasSearched && movies.length > 0 && filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No matches</h3>
          <p>Try adjusting your filters.</p>
        </div>
      )}
      {!loading && !error && !hasSearched && (
        <div className="empty-state">
          <div className="empty-icon">✨</div>
          <h3>Start Exploring</h3>
          <p>Search for a movie or series to get started.</p>
        </div>
      )}
    </div>
  );
}

// ─── EPISODES PANEL (TVmaze API) ──────────────────────────────────────────────
function EpisodesPanel({ title }) {
  const [shows, setShows]         = useState([]);
  const [selShow, setSelShow]     = useState(null);
  const [allEpisodes, setAllEpisodes] = useState([]);
  const [seasons, setSeasons]     = useState([]);
  const [selSeason, setSelSeason] = useState(1);
  const [loading, setLoading]     = useState(true);
  const [epLoading, setEpLoading] = useState(false);
  const [error, setError]         = useState("");

  useEffect(() => {
    if (!title) return;
    setLoading(true); setError("");
    searchTVMaze(title)
      .then(results => {
        if (!results || results.length === 0) {
          setError("Show not found on TVmaze."); setLoading(false); return;
        }
        setShows(results.slice(0, 5));
        const first = results[0].show;
        setSelShow({ id: first.id, name: first.name, image: first.image?.medium });
        setLoading(false);
      })
      .catch(() => { setError("Failed to connect to TVmaze API."); setLoading(false); });
  }, [title]);

  useEffect(() => {
    if (!selShow?.id) return;
    setEpLoading(true);
    Promise.all([
      fetchTVMazeEpisodes(selShow.id),
      fetchTVMazeSeasons(selShow.id),
    ]).then(([eps, seas]) => {
      setAllEpisodes(Array.isArray(eps) ? eps : []);
      const seasonNums = Array.isArray(seas)
        ? seas.map(s => s.number).filter(Boolean)
        : [...new Set((eps || []).map(e => e.season))].sort((a,b)=>a-b);
      setSeasons(seasonNums);
      if (seasonNums.length > 0) setSelSeason(seasonNums[0]);
      setEpLoading(false);
    }).catch(() => { setError("Failed to load episodes."); setEpLoading(false); });
  }, [selShow?.id]);

  const today = new Date().toISOString().split("T")[0];
  const filtered = allEpisodes.filter(ep => ep.season === selSeason);

  if (loading) return (
    <div className="loading" style={{padding:"2rem 0"}}>
      <div className="spinner"/><span>Searching on TVmaze…</span>
    </div>
  );
  if (error) return <div className="error-msg">⚠ {error}</div>;

  return (
    <div>
      {shows.length > 1 && (
        <div style={{marginBottom:"1.2rem"}}>
          <div className="detail-section-title" style={{marginTop:0}}>Select Show</div>
          <div className="season-selector">
            {shows.map(({ show }) => (
              <button
                key={show.id}
                className={`season-btn ${selShow?.id === show.id ? "active" : ""}`}
                onClick={() => setSelShow({ id: show.id, name: show.name, image: show.image?.medium })}
              >
                {show.name.slice(0, 20)}
              </button>
            ))}
          </div>
        </div>
      )}

      {selShow && (
        <div className="show-info-bar">
          {selShow.image && <img src={selShow.image} alt={selShow.name} className="show-thumb" onError={e=>e.target.style.display="none"}/>}
          <div>
            <div className="show-info-name">{selShow.name}</div>
            <div className="show-info-sub">
              {seasons.length} season{seasons.length !== 1 ? "s" : ""} · {allEpisodes.length} total episodes · via TVmaze
            </div>
          </div>
        </div>
      )}

      {seasons.length > 0 && (
        <div className="season-selector">
          {seasons.map(n => (
            <button
              key={n}
              className={`season-btn ${selSeason === n ? "active" : ""}`}
              onClick={() => setSelSeason(n)}
            >
              S{String(n).padStart(2,"0")}
            </button>
          ))}
        </div>
      )}

      {epLoading
        ? <div className="loading" style={{padding:"1rem 0"}}><div className="spinner"/><span>Loading…</span></div>
        : filtered.length === 0
          ? <div className="empty-state" style={{padding:"2rem 0"}}><div className="empty-icon">📺</div><h3>No episodes for this season</h3></div>
          : (
            <div className="episodes-list" style={{marginTop:"1rem"}}>
              {filtered.map((ep) => {
                const aired  = ep.airdate && ep.airdate <= today;
                const summary = ep.summary ? ep.summary.replace(/<[^>]+>/g,"").slice(0,100) + "…" : "";
                return (
                  <div className="episode-row" key={ep.id}>
                    <div className="ep-num">E{String(ep.number).padStart(2,"0")}</div>
                    <div>
                      <div className="ep-title">{ep.name || "Untitled"}</div>
                      {summary && <div className="ep-date" style={{marginTop:"2px"}}>{summary}</div>}
                      <div style={{display:"flex",gap:"0.75rem",marginTop:"3px"}}>
                        {ep.airdate  && <span className="ep-date">📅 {ep.airdate}</span>}
                        {ep.runtime  && <span className="ep-date">⏱ {ep.runtime}m</span>}
                      </div>
                    </div>
                    <span className={`ep-badge ${aired ? "aired" : "upcoming"}`}>
                      {aired ? "Aired" : "Upcoming"}
                    </span>
                  </div>
                );
              })}
            </div>
          )
      }
    </div>
  );
}

// ─── MOVIE DETAILS ───────────────────────────────────────────────────────────
function MovieDetailsPage({ id, navigate }) {
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
      <div className="detail-back" onClick={() => navigate("#/")}>← Back</div>

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

// ─── FAVORITES PAGE ──────────────────────────────────────────────────────────
function FavoritesPage({ navigate }) {
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
          {movies.map(m => <MovieCard key={m.imdbID} movie={m} navigate={navigate} showRemove />)}
        </div>
      )}
    </div>
  );
}

// ─── ABOUT PAGE ──────────────────────────────────────────────────────────────
function AboutPage() {
  return (
    <div className="page">
      <h1 className="page-title">About</h1>
      <div className="about-card">
        <h2>CineVault</h2>
        <p>
          CineVault is a modern movie discovery application built with React. Search millions of films and series, explore detailed information, and build your personal collection—all persisted locally so your favorites are always safe.
        </p>
        <p>
          Built with <strong style={{color:"var(--accent2)"}}>React, Context API, localStorage, and modern CSS</strong>. Movie data powered by the OMDb API for comprehensive entertainment information.
        </p>
        <p>
          Features include full-text search across titles, filtering by type and year, episode guides via TVmaze, and a clean, responsive design optimized for all devices.
        </p>
        <div className="about-api-box">
          <span>Data Sources:</span> OMDb API + TVmaze<br />
          <span>Tech Stack:</span> React • Context API • localStorage<br />
          <span>Design:</span> Modern, Responsive CSS • Smooth Animations
        </div>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const { path, navigate, match } = useRoute();
  const movieMatch = match("#/movie/:id");

  const renderPage = () => {
    if (movieMatch) return <MovieDetailsPage id={movieMatch.id} navigate={navigate} />;
    if (path === "#/favorites") return <FavoritesPage navigate={navigate} />;
    if (path === "#/about") return <AboutPage />;
    return <HomePage navigate={navigate} />;
  };

  return (
    <FavoritesProvider>
      <style>{styles}</style>
      <Navbar path={path} navigate={navigate} />
      {renderPage()}
    </FavoritesProvider>
  );
}