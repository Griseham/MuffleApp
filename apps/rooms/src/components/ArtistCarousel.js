// ArtistCarousel.js - Reusable carousel (default: 10 artists per page)
import React, { useEffect, useMemo, useState } from 'react';

const LeftArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polyline points="15,18 9,12 15,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const RightArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polyline points="9,18 15,12 9,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function ArtistCarousel({
  artists = [],
  artistsPerPage = 10,
  renderArtist,
  gridClassName = 'artists-grid',
}) {
  const totalPages = Math.max(1, Math.ceil(artists.length / artistsPerPage));
  const [page, setPage] = useState(0);
  const [anim, setAnim] = useState(null);

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages - 1));
  }, [totalPages]);

  useEffect(() => {
    const t = setTimeout(() => setAnim(null), 220);
    return () => clearTimeout(t);
  }, [page]);

  const currentArtists = useMemo(() => {
    const start = page * artistsPerPage;
    return artists.slice(start, start + artistsPerPage);
  }, [artists, page, artistsPerPage]);

  const prev = (e) => {
    e.stopPropagation();
    if (page <= 0) return;
    setAnim('slide-right');
    setPage(page - 1);
  };

  const next = (e) => {
    e.stopPropagation();
    if (page >= totalPages - 1) return;
    setAnim('slide-left');
    setPage(page + 1);
  };

  const go = (e, idx) => {
    e.stopPropagation();
    if (idx === page) return;
    setAnim(idx < page ? 'slide-right' : 'slide-left');
    setPage(idx);
  };

  return (
    <div className="artists-carousel">
      <div className={`${gridClassName} ${anim || ''}`}>
        {currentArtists.map((artist, idx) => (
          <React.Fragment
            key={artist?.roomArtistKey || `${artist?.id || artist?.name || 'artist'}-${idx}`}
          >
            {renderArtist ? renderArtist(artist, idx) : null}
          </React.Fragment>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="carousel-controls" onClick={(e) => e.stopPropagation()}>
          <button
            className={`carousel-arrow prev ${page <= 0 ? 'disabled' : ''}`}
            onClick={prev}
            disabled={page <= 0}
            aria-label="Previous artists"
          >
            <LeftArrow />
          </button>

          {Array.from({ length: totalPages }).slice(0, 6).map((_, idx) => (
            <div
              key={idx}
              className={`carousel-dot ${idx === page ? 'active' : ''}`}
              onClick={(e) => go(e, idx)}
            />
          ))}

          <button
            className={`carousel-arrow next ${page >= totalPages - 1 ? 'disabled' : ''}`}
            onClick={next}
            disabled={page >= totalPages - 1}
            aria-label="Next artists"
          >
            <RightArrow />
          </button>
        </div>
      )}
    </div>
  );
}
