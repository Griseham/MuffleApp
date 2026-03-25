import React, { useMemo } from "react";
import {
  buildSpatialHash,
  querySpatialHash,
  TOTAL_WIDTH,
  TOTAL_HEIGHT
} from "../utils";

/**
 * Dots - Efficient starfield dots component with viewport culling
 * Uses DOM nodes for rendering stars with viewport culling to reduce DOM node count.
 */
export default function Dots({
  scrollPos,
  containerDimensions,
  isFullscreen,
  onDotClick,
  posts = []
}) {
  const VIEWPORT_MARGIN = 1000;

  const { dots, hash } = useMemo(() => {
    const DOT_COUNT = 7500;
    const COLORS = [
      "#FFFFFF",
      "#FFD700",
      "#ADFF2F",
      "#FF69B4",
      "#87CEFA",
      "#FFB6C1",
      "#9370DB",
      "#00CED1",
      "#3CB371",
      "#FF6347",
      "#4169E1",
    ];

    const GRID_SIZE = Math.ceil(Math.sqrt(DOT_COUNT));
    const CELL_WIDTH = TOTAL_WIDTH / GRID_SIZE;
    const CELL_HEIGHT = TOTAL_HEIGHT / GRID_SIZE;
    const redditPosts = posts.filter(p => p.id !== "example_post_001" && !p.hasCachedData);
    const cachedPosts = posts.filter(p => p.hasCachedData || p.id === "example_post_001");

    const defaultPost = {
      id: "default-post",
      title: "Default Thread",
      author: "StarField User",
      createdUtc: Date.now() / 1000,
      postType: "thread",
      ups: Math.floor(Math.random() * 100),
      selftext: "This is a default thread in the starfield. Click to view more details."
    };

    const generatedDots = [];

    for (let i = 0; i < GRID_SIZE; i += 1) {
      for (let j = 0; j < GRID_SIZE; j += 1) {
        const x = (j * CELL_WIDTH) + (Math.random() * CELL_WIDTH);
        const y = (i * CELL_HEIGHT) + (Math.random() * CELL_HEIGHT);

        const inCircle = (() => {
          const centerPoint = { x: TOTAL_WIDTH / 2, y: TOTAL_HEIGHT / 2 };
          const friendRadius = TOTAL_WIDTH * 0.3;
          const friendCenters = [
            { x: centerPoint.x + friendRadius * Math.cos(Math.PI / 4), y: centerPoint.y + friendRadius * Math.sin(Math.PI / 4) },
            { x: centerPoint.x + friendRadius * Math.cos(3 * Math.PI / 4), y: centerPoint.y + friendRadius * Math.sin(3 * Math.PI / 4) },
            { x: centerPoint.x + friendRadius * Math.cos(5 * Math.PI / 4), y: centerPoint.y + friendRadius * Math.sin(5 * Math.PI / 4) }
          ];

          const mainRadius = 600;
          const dx1 = x - centerPoint.x;
          const dy1 = y - centerPoint.y;
          if (dx1 * dx1 + dy1 * dy1 < mainRadius * mainRadius) return true;

          return friendCenters.some(center => {
            const dx = x - center.x;
            const dy = y - center.y;
            return (dx * dx + dy * dy < mainRadius * mainRadius);
          });
        })();

        if (inCircle) continue;

        const size = 10 + Math.random() * 30;
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const glow = Math.floor(Math.random() * 20) + 5;

        let post = defaultPost;
        if (redditPosts.length > 0) {
          if (Math.random() < 0.8 || cachedPosts.length === 0) {
            post = redditPosts[Math.floor(Math.random() * redditPosts.length)];
          } else {
            post = cachedPosts[Math.floor(Math.random() * cachedPosts.length)];
          }
        } else if (cachedPosts.length > 0) {
          post = cachedPosts[Math.floor(Math.random() * cachedPosts.length)];
        }

        if (post && post !== defaultPost) {
          post = {
            ...post,
            postType: post.postType || "thread",
            createdUtc: post.createdUtc || Date.now() / 1000,
            ups: post.ups || 0,
            num_comments: post.num_comments || 0,
            author: post.author || "Unknown",
            title: post.title || "Untitled Post",
            selftext: post.selftext || ""
          };
        }

        const genreOptions = ["Rock", "Pop", "Hip-Hop", "Electronic", "R&B", "Jazz", "Metal", "Classical", "K-Pop"];
        const genre = post.postType === "groupchat"
          ? "Social"
          : post.postType === "news"
            ? "News"
            : post.postType === "parameter"
              ? "Parameter"
              : genreOptions[Math.floor(Math.random() * genreOptions.length)];

        generatedDots.push({
          id: `dot-${generatedDots.length}`,
          x,
          y,
          name: post.title || `Thread-${generatedDots.length}`,
          genre,
          post,
          isInteractive: true,
          size,
          backgroundColor: color,
          borderRadius: "50%",
          border: `2px solid ${color}`,
          boxShadow: `0 0 ${glow}px ${color}`
        });

        if (generatedDots.length >= DOT_COUNT) break;
      }

      if (generatedDots.length >= DOT_COUNT) break;
    }

    return {
      dots: generatedDots,
      hash: buildSpatialHash(generatedDots)
    };
  }, [posts]);

  const visibleDots = useMemo(() => {
    if (!dots.length || !containerDimensions) {
      return [];
    }

    const viewportLeft = scrollPos.left - VIEWPORT_MARGIN;
    const viewportTop = scrollPos.top - VIEWPORT_MARGIN;
    const viewportWidth = (isFullscreen ? window.innerWidth : containerDimensions.width) + (VIEWPORT_MARGIN * 2);
    const viewportHeight = (isFullscreen ? window.innerHeight : containerDimensions.height) + (VIEWPORT_MARGIN * 2);
    const viewportRight = viewportLeft + viewportWidth;
    const viewportBottom = viewportTop + viewportHeight;

    return querySpatialHash(hash, dots, viewportLeft, viewportTop, viewportRight, viewportBottom);
  }, [containerDimensions, dots, hash, isFullscreen, scrollPos.left, scrollPos.top]);

  const handleDotClick = (event, dot) => {
    event.stopPropagation();

    const rect = event.target.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    onDotClick(dot, { x, y });
  };

  return visibleDots.map(dot => (
    <div
      key={dot.id}
      onClick={event => handleDotClick(event, dot)}
      style={{
        position: "absolute",
        left: dot.x,
        top: dot.y,
        width: dot.size,
        height: dot.size,
        transform: "translate(-50%, -50%)",
        borderRadius: dot.borderRadius,
        backgroundColor: dot.backgroundColor,
        border: dot.border,
        boxShadow: dot.boxShadow,
        cursor: "pointer",
        pointerEvents: "auto",
        zIndex: 1000,
      }}
    />
  ));
}
