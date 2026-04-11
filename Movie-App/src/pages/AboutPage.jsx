export function AboutPage() {
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
