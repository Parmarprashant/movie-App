import { useState, useEffect } from "react";
import { searchTVMaze, fetchTVMazeEpisodes, fetchTVMazeSeasons } from "../api/api";

export function EpisodesPanel({ title }) {
  const [shows, setShows]         = useState([]);
  const [selShow, setSelShow]     = useState(null);
  const [allEpisodes, setAllEpisodes] = useState([]);
  const [seasons, setSeasons]     = useState([]);
  const [selSeason, setSelSeason] = useState(1);
  const [loading, setLoading]     = useState(true);
  const [epLoading, setEpLoading] = useState(false);
  const [error, setError]         = useState("");
 
  console.log("component re-render")
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
