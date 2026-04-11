import { useState } from "react";
import { searchAll } from "../api/api";
import { MovieCard } from "../components/MovieCard";

export function HomePage() {
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
            {filtered.map(m => <MovieCard key={m.imdbID} movie={m} />)}
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
