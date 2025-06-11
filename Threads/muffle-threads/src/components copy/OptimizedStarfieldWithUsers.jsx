// OptimizedStarfieldWithUsers.jsx - Optimized main entry point for the starfield component
import React from "react";
import OptimizedStarfieldContainer from "./starfield/OptimizedStarfieldContainer";

/**
 * Enhanced Starfield component with navigation, genre visualization and interactive elements
 * This is an optimized version that uses the OptimizedStarfieldDots component
 * which implements viewport culling to reduce DOM node count.
 */
export default function OptimizedStarfieldWithUsers({ onLoadFeed, onViewThread, activeFilters = [], posts = [], initialArtists = [],  }) {
  return (
    <OptimizedStarfieldContainer
      onLoadFeed={onLoadFeed}
      onViewThread={onViewThread}
      activeFilters={activeFilters}
      posts={posts}
      initialArtists={initialArtists}
    />
  );
}