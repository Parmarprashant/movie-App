import { createContext, useState } from "react";

export const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
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
