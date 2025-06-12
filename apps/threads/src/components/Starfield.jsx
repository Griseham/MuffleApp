// Starfield.jsx - Main entry point for the starfield component
import React from "react";
import Container from "./starfield/Container";

/**
 * Enhanced Starfield component with navigation, genre visualization and interactive elements
 * Uses DOM nodes for rendering stars with viewport culling to reduce DOM node count.
 */
export default function Starfield({ onLoadFeed, onViewThread, activeFilters = [], posts = [], initialArtists = [],  }) {
  return (
    <Container
      onLoadFeed={onLoadFeed}
      onViewThread={onViewThread}
      activeFilters={activeFilters}
      posts={posts}
      initialArtists={initialArtists}
    />
  );
}