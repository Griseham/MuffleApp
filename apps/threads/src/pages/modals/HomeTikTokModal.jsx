// src/components/HomeTikTokModal.jsx
import React, { useEffect, useRef, useState } from "react";
import TikTokModal from "./TikTokModal";
import { getAvatarSrc } from "../posts/postCardUtils";

// Helper to format Apple Music artwork URLs - replace {w} and {h} with actual dimensions
function formatArtworkUrl(url, size = 300) {
  if (!url) return null;
  return url
    .replace('{w}', String(size))
    .replace('{h}', String(size))
    .replace('{f}', 'jpg');
}

export default function HomeTikTokModal({ onClose, cachedPosts = [], onNavigateToThread }) {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
  const [snippets, setSnippets] = useState([]);
  const [isLoadingSnippets, setIsLoadingSnippets] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const hashToUint = input => {
      const str = String(input ?? "");
      let h = 2166136261;
      for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0;
      }
      return h >>> 0;
    };

    const shuffle = arr => {
      const a = [...(arr || [])];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };

    const flattenComments = comments => {
      const out = [];
      const walk = list => {
        (list || []).forEach(c => {
          if (!c) return;
          out.push(c);
          if (Array.isArray(c.replies) && c.replies.length) walk(c.replies);
        });
      };
      walk(Array.isArray(comments) ? comments : []);
      return out;
    };

    const pickRandomComment = post => {
      const flat = flattenComments(post?.comments);
      if (flat.length === 0) {
        return {
          id: `no_comment_${post?.id || "x"}`,
          author: post?.author || "Unknown",
          body:
            typeof post?.selftext === "string" && post.selftext.trim()
              ? post.selftext.trim()
              : post?.title || "",
        };
      }
      const c = flat[Math.floor(Math.random() * flat.length)];
      return {
        id: c.id || `comment_${Math.random().toString(36).slice(2)}`,
        author: c.author || "Unknown",
        body: c.body || "",
      };
    };

    const extractSearchTermFromTitle = title => {
      const t = String(title || "").replace(/[^\w\s']/g, " ");
      const words = t
        .split(/\s+/)
        .map(w => w.trim())
        .filter(w => w.length >= 4);

      if (words.length === 0) return null;

      const preferred = words.filter(
        w =>
          !["when", "what", "this", "that", "with", "from", "comes", "mind", "song", "music"].includes(
            w.toLowerCase()
          )
      );
      const pool = preferred.length ? preferred : words;

      return pool[Math.floor(Math.random() * pool.length)];
    };

    const normalizeAppleSong = song => {
      if (!song) return null;
      const previewUrl = song.attributes?.previews?.[0]?.url || "";
      const artworkUrl = song.attributes?.artwork?.url || "";
      if (!previewUrl || !artworkUrl) return null;

      return {
        id: song.id,
        attributes: {
          name: song.attributes?.name || "Unknown Track",
          artistName: song.attributes?.artistName || "Unknown Artist",
          artwork: { url: artworkUrl },
          previews: [{ url: previewUrl }],
        },
      };
    };

    const fetchRandomAppleSong = async query => {
      const resp = await fetch(
        `${API_BASE}/api/apple-music-search?query=${encodeURIComponent(query)}`
      );
      const data = await resp.json();

      if (!data?.success || !data?.data) return null;

      const items = Array.isArray(data.data) ? data.data : [data.data];
      const playable = items.map(normalizeAppleSong).filter(Boolean);

      if (playable.length === 0) return null;

      return playable[Math.floor(Math.random() * playable.length)];
    };

    const loadAllSnippets = async () => {
      setIsLoadingSnippets(true);
      try {
        const posts = Array.isArray(cachedPosts) ? cachedPosts : [];
        const eligiblePosts = posts.filter(post => {
          const postType = String(post?.postType || "").toLowerCase();
          const postId = String(post?.id || "").toLowerCase();
          return (
            postType !== "parameter" &&
            postType !== "news" &&
            postType !== "groupchat" &&
            !postId.includes("parameter")
          );
        });
        const chosenPosts = shuffle(eligiblePosts).slice(0, 10);

        const seedQueries = [
          "Drake",
          "Kendrick Lamar",
          "Travis Scott",
          "SZA",
          "The Weeknd",
          "Taylor Swift",
          "Bad Bunny",
          "Future",
          "Playboi Carti",
          "Ariana Grande",
          "Billie Eilish",
          "Morgan Wallen",
          "Doja Cat",
          "Olivia Rodrigo",
          "Eminem",
          "Top Hits",
          "Viral",
          "Rap",
          "R&B",
          "Pop",
        ];

        const cards = [];
        for (let i = 0; i < chosenPosts.length; i++) {
          const post = chosenPosts[i];
          if (!post?.id) continue;

          const pickedComment = pickRandomComment(post);

          const titleTerm = extractSearchTermFromTitle(post?.title);
          const tries = [
            titleTerm,
            seedQueries[Math.floor(Math.random() * seedQueries.length)],
            seedQueries[Math.floor(Math.random() * seedQueries.length)],
          ].filter(Boolean);

          let appleSong = null;
          for (const q of tries) {
            try {
              appleSong = await fetchRandomAppleSong(q);
              if (appleSong) break;
            } catch (e) {
              // ignore and try next query
            }
          }

          if (!appleSong) continue;

          const snippetId = `home_am_${post.id}_${pickedComment.id}_${i}`;
          const seed = hashToUint(snippetId);
          const avgRating = (seed % 85) + 15;
          const totalRatings = (seed % 500) + 50;

          const previewUrl = appleSong.attributes.previews?.[0]?.url || "";
          // Format the artwork URL properly
          const rawArtworkUrl = appleSong.attributes.artwork?.url || "";
          const artworkUrl = formatArtworkUrl(rawArtworkUrl, 300);

          cards.push({
            id: snippetId,
            commentId: snippetId,
            postId: post.id,
            postType: post?.postType || "thread",
            threadTitle: post.title || "Thread",
            genre: post?.subreddit ? `#${post.subreddit}` : "#thread",
            author: pickedComment.author || "Unknown",
            text: pickedComment.body || "",
            snippetAuthorAvatar: getAvatarSrc({ author: pickedComment.author }),
            previewUrl,
            artworkUrl,
            // IMPORTANT: Include 'artwork' field for ThreadCommentCard
            artwork: artworkUrl,
            songName: appleSong.attributes?.name || "",
            artistName: appleSong.attributes?.artistName || "",
            name: appleSong.attributes?.name || "",
            snippetData: appleSong,
            userRating: 0,
            avgRating,
            totalRatings,
            didRate: false,
          });
        }

        if (cancelled) return;

        if (cards.length === 0) {
          setSnippets([
            {
              id: "home_placeholder_0",
              commentId: "home_placeholder_0",
              postId: null,
              threadTitle: "For You",
              genre: "#music",
              author: "System",
              text: "No Apple Music previews were found. Check your Apple token / backend endpoint.",
              snippetAuthorAvatar: getAvatarSrc({ author: "System" }),
              previewUrl: "",
              artworkUrl: "",
              artwork: "",
              songName: "",
              artistName: "",
              snippetData: {
                attributes: {
                  name: "No playable snippet",
                  artistName: "--",
                  artwork: { url: "" },
                  previews: [],
                },
              },
              userRating: 0,
              avgRating: 50,
              totalRatings: 0,
              didRate: false,
            },
          ]);
          setIsLoadingSnippets(false);
          return;
        }

        setSnippets(cards.slice(0, 10));
        setIsLoadingSnippets(false);
      } catch (err) {
        console.error("Error loading Apple snippets:", err);
        if (!cancelled) {
          setSnippets([
            {
              id: "home_error_0",
              commentId: "home_error_0",
              postId: null,
              threadTitle: "For You",
              genre: "#music",
              author: "System",
              text: "Snippets failed to load from Apple Music.",
              snippetAuthorAvatar: getAvatarSrc({ author: "System" }),
              previewUrl: "",
              artworkUrl: "",
              artwork: "",
              songName: "",
              artistName: "",
              snippetData: {
                attributes: {
                  name: "Snippets failed to load",
                  artistName: "--",
                  artwork: { url: "" },
                  previews: [],
                },
              },
              userRating: 0,
              avgRating: 50,
              totalRatings: 0,
              didRate: false,
            },
          ]);
          setIsLoadingSnippets(false);
        }
      }
    };

    loadAllSnippets();

    return () => {
      cancelled = true;
      if (audioRef.current) audioRef.current.pause();
    };
  }, [cachedPosts, API_BASE]);

  const handleUserRate = (snippetObj, newRating) => {
    if (!snippetObj) return;

    setSnippets(prev =>
      prev.map(s =>
        s.id === snippetObj.id || s.commentId === snippetObj.commentId
          ? {
              ...s,
              userRating: newRating,
              didRate: true,
              avgRating: Math.floor(
                ((s.avgRating || 50) * (s.totalRatings || 100) + newRating) /
                  ((s.totalRatings || 100) + 1)
              ),
              totalRatings: (s.totalRatings || 100) + 1,
            }
          : s
      )
    );
  };

  // Helper to generate a fake username from snippet ID
  const makeDigits = input => {
    const s = String(input ?? "");
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0;
    }
    return (h % 9000) + 1000;
  };

  return (
    <>
      <audio ref={audioRef} style={{ display: "none" }} preload="none" />

      <TikTokModal
        snippets={snippets}
        comments={[]}
        onClose={onClose}
        audioRef={audioRef}
        isPlaying={false}
        activeSnippet={null}
        playOrPauseSnippet={() => {}}
        onUserRate={handleUserRate}
        isInitialLoading={isLoadingSnippets}
        threadTitle="For You"
        onNavigateToThread={(postId, snippet) => {
          console.log("HomeTikTokModal: onNavigateToThread called with postId:", postId, "snippet:", snippet);
          
          if (!onNavigateToThread) {
            console.log("HomeTikTokModal: No onNavigateToThread callback provided");
            return;
          }
          
          const post = cachedPosts.find(p => p.id === postId);
          if (!post) {
            console.log("HomeTikTokModal: Post not found for ID:", postId);
            return;
          }

          console.log("HomeTikTokModal: Found post:", post.title);

          // Format the artwork URL properly
          const rawArtworkUrl = snippet?.artworkUrl || snippet?.artwork || snippet?.snippetData?.attributes?.artwork?.url || "";
          const formattedArtworkUrl = formatArtworkUrl(rawArtworkUrl, 300);
          
          // Create a unique ID for this injected comment/snippet
          const uniqueId = `injected_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

          // Create the injected snippet with all required fields
          // IMPORTANT: didRate should be false so user can rate in ThreadDetail
          // But preserve the rating if they already rated in HomeTikTokModal
          const injectedSnippet = snippet
            ? { 
                ...snippet, 
                __injectedFromTikTok: true,
                // Use unique ID to avoid conflicts
                id: uniqueId,
                commentId: uniqueId,
                // Ensure all required fields are present with correct names
                name: snippet.songName || snippet.name || snippet.snippetData?.attributes?.name || "Unknown Song",
                songName: snippet.songName || snippet.name || snippet.snippetData?.attributes?.name || "Unknown Song",
                artistName: snippet.artistName || snippet.snippetData?.attributes?.artistName || "Unknown Artist",
                // CRITICAL: Use 'artwork' field (not just artworkUrl) for ThreadCommentCard
                artwork: formattedArtworkUrl,
                artworkUrl: formattedArtworkUrl,
                previewUrl: snippet.previewUrl || snippet.snippetData?.attributes?.previews?.[0]?.url || "",
                // Preserve rating state from HomeTikTokModal if user rated there
                userRating: snippet.userRating || null,
                avgRating: snippet.avgRating || 50,
                totalRatings: snippet.totalRatings || 100,
                // IMPORTANT: Set didRate based on whether user rated in HomeTikTokModal
                didRate: snippet.didRate || false,
                snippetData: snippet.snippetData,
              }
            : null;

          // Create the injected comment with the snippet attached
          const fakeUsername = `user${makeDigits(uniqueId)}`;
          
          const injectedComment = snippet
            ? {
                id: uniqueId,
                author: fakeUsername,
                body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
                ups: Math.floor(Math.random() * 200) + 5,
                createdUtc: Date.now() / 1000,
                __injectedFromTikTok: true,
                // IMPORTANT: Attach the snippet data directly to the comment
                // This allows ThreadCommentCard to find the snippet
                snippet: {
                  id: uniqueId,
                  commentId: uniqueId,
                  name: injectedSnippet?.songName || injectedSnippet?.name,
                  songName: injectedSnippet?.songName || injectedSnippet?.name,
                  artistName: injectedSnippet?.artistName,
                  // Use 'artwork' field for ThreadCommentCard
                  artwork: formattedArtworkUrl,
                  artworkUrl: formattedArtworkUrl,
                  previewUrl: injectedSnippet?.previewUrl,
                  userRating: injectedSnippet?.userRating,
                  avgRating: injectedSnippet?.avgRating,
                  totalRatings: injectedSnippet?.totalRatings,
                  didRate: injectedSnippet?.didRate,
                  snippetData: injectedSnippet?.snippetData,
                }
              }
            : null;

          console.log("HomeTikTokModal: Created injected comment:", injectedComment);
          console.log("HomeTikTokModal: Created injected snippet:", injectedSnippet);
          console.log("HomeTikTokModal: Artwork URL:", formattedArtworkUrl);

          // Navigate to thread with the prefill data
          onNavigateToThread({
            ...post,
            __prefillFromTikTok: injectedSnippet
              ? {
                  snippet: injectedSnippet,
                  comment: injectedComment,
                  autoPlay: true,
                }
              : null,
          });
        }}
      />
    </>
  );
}