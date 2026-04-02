// src/components/HomeTikTokModal.jsx
import React, { useEffect, useRef, useState } from "react";
import TikTokModal from "./TikTokModal";
import { getAvatarSrc } from "../posts/postCardUtils";
import { getAppleMusicAlbumArtworks } from "../../services/appleMusic";
import { buildApiUrl } from "../../utils/api";

// Helper to format Apple Music artwork URLs - replace {w} and {h} with actual dimensions
function formatArtworkUrl(url, size = 300) {
  if (!url) return null;
  return url
    .replace('{w}', String(size))
    .replace('{h}', String(size))
    .replace('{f}', 'jpg');
}

function needsSnippetMediaRecovery(url = "") {
  return !url || String(url).includes("/cached_media/");
}

export default function HomeTikTokModal({ onClose, cachedPosts = [], onNavigateToThread }) {
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

    const findCommentById = (comments, targetId) => {
      if (!targetId) return null;

      let found = null;
      const walk = list => {
        (list || []).forEach(comment => {
          if (found || !comment) return;
          if (comment.id === targetId) {
            found = comment;
            return;
          }
          if (Array.isArray(comment.replies) && comment.replies.length) {
            walk(comment.replies);
          }
        });
      };

      walk(Array.isArray(comments) ? comments : []);
      return found;
    };

    const loadAllSnippets = async () => {
      setIsLoadingSnippets(true);
      try {
        const posts = Array.isArray(cachedPosts) ? cachedPosts : [];
        const eligiblePosts = posts.filter(post => {
          const postType = String(post?.postType || "").toLowerCase();
          const postId = String(post?.id || "").toLowerCase();
          const snippets = Array.isArray(post?.snippets) ? post.snippets : [];
          const snippetCount = Number(post?.snippetCount) || snippets.length;
          return (
            postType !== "parameter" &&
            postType !== "news" &&
            postType !== "groupchat" &&
            !postId.includes("parameter") &&
            snippetCount > 0
          );
        });
        const chosenPosts = shuffle(eligiblePosts).slice(0, 5);
        const repairedPosts = await Promise.all(
          chosenPosts.map(async post => {
            if (!post?.id) return post;

            try {
              const response = await fetch(buildApiUrl(`/cached-posts/${post.id}`));
              if (!response.ok) {
                return post;
              }

              const result = await response.json();
              if (result?.success && result?.data) {
                return result.data;
              }
            } catch (error) {
              console.warn(`HomeTikTokModal: failed to load repaired cached post ${post.id}:`, error);
            }

            return post;
          })
        );

        const cards = [];
        for (let i = 0; i < repairedPosts.length; i++) {
          const post = repairedPosts[i];
          if (!post?.id) continue;
          const snippets = shuffle(Array.isArray(post?.snippets) ? post.snippets : []);
          const chosenSnippet = snippets.find(
            snippet =>
              (
                snippet?.songName ||
                snippet?.name ||
                snippet?.snippetData?.attributes?.name
              ) &&
              (
                snippet?.artistName ||
                snippet?.snippetData?.attributes?.artistName
              ) &&
              (
                snippet?.previewUrl ||
                snippet?.snippetData?.attributes?.previews?.[0]?.url ||
                snippet?.artworkUrl ||
                snippet?.artwork ||
                snippet?.snippetData?.attributes?.artwork?.url
              )
          );
          if (!chosenSnippet) continue;

          const matchedComment = findCommentById(post?.comments, chosenSnippet.commentId);
          const pickedComment = matchedComment || pickRandomComment(post);

          const snippetId = `home_am_${post.id}_${pickedComment.id}_${i}`;
          const seed = hashToUint(snippetId);
          const avgRating = (seed % 85) + 15;
          const totalRatings = (seed % 500) + 50;

          const previewUrl =
            chosenSnippet.previewUrl ||
            chosenSnippet.snippetData?.attributes?.previews?.[0]?.url ||
            "";
          const songName =
            chosenSnippet.songName ||
            chosenSnippet.name ||
            chosenSnippet.snippetData?.attributes?.name ||
            "";
          const artistName =
            chosenSnippet.artistName ||
            chosenSnippet.snippetData?.attributes?.artistName ||
            "";
          const rawArtworkUrl =
            chosenSnippet.artworkUrl ||
            chosenSnippet.artwork ||
            chosenSnippet.snippetData?.attributes?.artwork?.url ||
            "";
          const artworkUrl = formatArtworkUrl(rawArtworkUrl, 300);

          cards.push({
            id: snippetId,
            commentId: snippetId,
            postId: post.id,
            postType: post?.postType || "thread",
            threadTitle: post.title || "Thread",
            sourcePost: post,
            genre: post?.subreddit ? `#${post.subreddit}` : "#thread",
            author: pickedComment.author || "Unknown",
            text: pickedComment.body ||
              ((typeof post?.selftext === "string" && post.selftext.trim())
                ? post.selftext.trim()
                : (post?.title || "")),
            snippetAuthorAvatar: getAvatarSrc({ author: pickedComment.author }),
            previewUrl,
            artworkUrl,
            // IMPORTANT: Include 'artwork' field for ThreadCommentCard
            artwork: artworkUrl,
            songName,
            artistName,
            name: songName,
            snippetData: chosenSnippet.snippetData || {
              attributes: {
                name: songName || "Unknown Track",
                artistName: artistName || "Unknown Artist",
                artwork: { url: artworkUrl || "" },
                previews: previewUrl ? [{ url: previewUrl }] : [],
              },
            },
            userRating: 0,
            avgRating,
            totalRatings,
            didRate: false,
          });
        }

        if (cards.length > 0) {
          const recoveredArtworkMap = await getAppleMusicAlbumArtworks(
            cards.map((card) => ({
              songName: card.songName,
              artistName: card.artistName,
            }))
          );

          const recoveredCards = cards.map((card) => {
            const trackKey = `${card.songName || ""}|||${card.artistName || ""}`;
            const recovered = recoveredArtworkMap?.[trackKey];
            const shouldRecoverArtwork = needsSnippetMediaRecovery(card.artworkUrl);
            const shouldRecoverPreview = needsSnippetMediaRecovery(card.previewUrl);
            const nextArtworkUrl = shouldRecoverArtwork
              ? formatArtworkUrl(recovered?.artworkUrl || "", 300) || card.artworkUrl || ""
              : card.artworkUrl;
            const nextPreviewUrl = shouldRecoverPreview
              ? recovered?.previewUrl || card.previewUrl || ""
              : card.previewUrl;

            return {
              ...card,
              artworkUrl: nextArtworkUrl,
              artwork: nextArtworkUrl,
              previewUrl: nextPreviewUrl,
              snippetData: {
                ...card.snippetData,
                attributes: {
                  ...card.snippetData?.attributes,
                  artwork: { url: nextArtworkUrl || "" },
                  previews: nextPreviewUrl ? [{ url: nextPreviewUrl }] : [],
                },
              },
            };
          });

          cards.splice(0, cards.length, ...recoveredCards);
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
              text: "No cached post snippets were found for the Home TikTok modal.",
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

        setSnippets(cards.slice(0, 5));
        setIsLoadingSnippets(false);
      } catch (err) {
        console.error("Error loading cached post snippets:", err);
        if (!cancelled) {
          setSnippets([
            {
              id: "home_error_0",
              commentId: "home_error_0",
              postId: null,
              threadTitle: "For You",
              genre: "#music",
              author: "System",
              text: "Snippets failed to load from cached posts.",
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

    const audioElement = audioRef.current;
    return () => {
      cancelled = true;
      if (audioElement) audioElement.pause();
    };
  }, [cachedPosts]);

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
        titleInfoModalTitle="Threads Title"
        titleInfoSteps={[
          {
            title: "Threads Title",
            content: "The title of the snippet is the thread that it was recommended in. Click on it to go to that thread.",
          },
        ]}
        onNavigateToThread={(postId, snippet) => {
          console.log("HomeTikTokModal: onNavigateToThread called with postId:", postId, "snippet:", snippet);
          
          if (!onNavigateToThread) {
            console.log("HomeTikTokModal: No onNavigateToThread callback provided");
            return;
          }
          
          const post = snippet?.sourcePost || cachedPosts.find(p => p.id === postId);
          if (!post) {
            console.log("HomeTikTokModal: Post not found for ID:", postId);
            return;
          }

          console.log("HomeTikTokModal: Found post:", post.title);
          onNavigateToThread(post);
        }}
      />
    </>
  );
}
