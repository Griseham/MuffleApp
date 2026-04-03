import { useState, useEffect, useCallback, useRef } from "react";
import { authorToAvatar } from "../utils/utils";
import { buildApiUrl, toApiOriginUrl } from "../../utils/api";
import { getCommunitySnippetStats } from "./threadHelpers";

export default function useThreadData(postId, postData = null) {
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [snippetRecs, setSnippetRecs] = useState([]);
  const [uniqueUsers, setUniqueUsers] = useState([]);
  const [artistList, _setArtistList] = useState([]);
  const [_users, setUsers] = useState([]);
  const [usedCache, setUsedCache] = useState(false);
  const [_isLoading, setIsLoading] = useState(true);
  const [_error, setError] = useState(null);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [snippetsLoading, setSnippetsLoading] = useState(false);
  const didFetchLiveRef = useRef(false);

  const ensureValidDate = (postData) => {
    const now = Date.now() / 1000;
    const oneYearAgo = now - (365 * 24 * 60 * 60);
    let createdUtc = postData.createdUtc;
    
    if (!createdUtc || createdUtc <= 0 || createdUtc > now) {
      createdUtc = oneYearAgo + Math.random() * (now - oneYearAgo);
    }
    
    return { ...postData, createdUtc };
  };

  const isLocalOnlyPost = useCallback((value) => {
    const id = String(value?.id || postId || "").trim();
    return Boolean(value?.isLocalOnly) || id.startsWith("user_post_");
  }, [postId]);

  const fetchMoreComments = async (_count = 10) => {
    return [];
  };

  // Helper to format Apple Music artwork URLs
  const formatArtworkUrl = (url, size = 300) => {
    if (!url) return null;
    return url
      .replace('{w}', String(size))
      .replace('{h}', String(size))
      .replace('{f}', 'jpg');
  };

  const normalizeMediaUrl = (url) => {
    if (!url || typeof url !== "string") return "";
    if (url.startsWith("/cached_media/")) return toApiOriginUrl(url);
    return url;
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  // Helper function to process cached snippets
  const processCachedSnippets = useCallback((snippets, commentsData) => {
    if (!snippets || snippets.length === 0) return [];
    
    return snippets.map((snippet) => {
      const commentsArray = Array.isArray(commentsData)
        ? commentsData
        : (commentsData?.topLevel && Array.isArray(commentsData.topLevel) ? commentsData.topLevel : []);

      const correspondingComment = commentsArray.find(
        (c) => c?.id === snippet.commentId || c?.data?.id === snippet.commentId
      );

      const snippetAuthor =
        correspondingComment?.author ||
        correspondingComment?.data?.author ||
        "Unknown";

      const songName =
        snippet.songName ||
        snippet.name ||
        snippet.snippetData?.attributes?.name ||
        "Unknown Song";

      const artistName =
        snippet.artistName ||
        snippet.snippetData?.attributes?.artistName ||
        "Unknown Artist";

      const rawArtwork =
        snippet.artworkUrl ||
        snippet.snippetData?.attributes?.artwork?.url ||
        snippet.artistImage ||
        snippet.artwork;

      const artworkUrl = normalizeMediaUrl(
        formatArtworkUrl(rawArtwork, 300) ||
        rawArtwork ||
        "/assets/default-artist.png"
      );

      const previewUrl = normalizeMediaUrl(
        snippet.previewUrl ||
        snippet.snippetData?.attributes?.previews?.[0]?.url ||
        ""
      );

      const snippetId = snippet.commentId || snippet.id;
      const seededCommunityStats = getCommunitySnippetStats(snippetId, snippet.avgRating);
      const seededTotalRatings =
        Number.isFinite(snippet.totalRatings) && snippet.totalRatings > 0
          ? Math.round(snippet.totalRatings)
          : seededCommunityStats.totalRatings;
      const seededAvgRating = Number.isFinite(snippet.avgRating)
        ? clamp(Math.round(snippet.avgRating), 20, 98)
        : seededCommunityStats.avgRating;
      const seededUserRating = Number.isFinite(snippet.userRating)
        ? clamp(Math.round(snippet.userRating), 0, 100)
        : null;
      const seededDidRate = Boolean(snippet.didRate) || seededUserRating != null;

      return {
        id: snippetId,
        commentId: snippetId,
        query: snippet.query,
        name: songName,
        songName,
        artistName,
        // CRITICAL: Include 'artwork' field for ThreadCommentCard
        artwork: artworkUrl,
        artworkUrl: artworkUrl,
        previewUrl,
        snippetData: snippet.snippetData || {
          attributes: {
            name: songName,
            artistName,
            previews: [{ url: previewUrl }],
            artwork: { url: artworkUrl },
            albumName: snippet.albumName || '',
            releaseDate: snippet.releaseDate || '',
            durationInMillis: snippet.duration || 0
          }
        },
        author: snippet.author || snippetAuthor,
        timestamp: Date.now(),
        artistImage: artworkUrl,
        snippetAuthorAvatar: authorToAvatar(snippet.author || snippetAuthor),
        userRating: seededUserRating,
        avgRating: seededAvgRating,
        totalRatings: seededTotalRatings,
        didRate: seededDidRate
      };
    });
  }, []);

  // Fetch cached post data including comments
  const fetchCachedPostData = useCallback(async (id) => {
    try {
      const resp = await fetch(buildApiUrl(`/cached-posts/${id}`));
      if (!resp.ok) {
        return null;
      }
      
      const data = await resp.json();
      if (data.success && data.data) {
        return data.data;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Load post and comments
  useEffect(() => {
    let cancelled = false;
    
    async function loadPost() {
      setIsLoading(true);
      setError(null);
      setCommentsLoaded(false);

      // IMPORTANT: reset per-thread snippet loading state.
      // Otherwise, if you open a "live" Reddit thread (snippetsLoading=true) and then open a cached thread,
      // the cached thread can incorrectly keep showing the loading skeleton.
      setSnippetsLoading(false);
      setSnippetRecs([]);
      setComments([]);
      setUsedCache(false);
      
      // If postData is provided, use it for the post but still try to load comments from cache
      if (postData) {
        setPost(ensureValidDate(postData));

        if (isLocalOnlyPost(postData)) {
          const localComments = Array.isArray(postData.comments) ? postData.comments : [];
          const localSnippets = Array.isArray(postData.snippets)
            ? postData.snippets
            : (postData.snippet ? [{ ...postData.snippet, commentId: postData.snippet.commentId || localComments[0]?.id }] : []);

          if (!cancelled) {
            setComments(localComments);

            if (localSnippets.length > 0) {
              const processedSnippets = processCachedSnippets(localSnippets, localComments);
              setSnippetRecs(processedSnippets);
            }

            setUsedCache(true);
            setCommentsLoaded(true);
            setIsLoading(false);
          }
          return;
        }
        
        // Try to load cached comments and snippets for this post
        let cachedData = null;
        if (postData?.hasCachedData !== false) {
          cachedData = await fetchCachedPostData(postId);
        }

        if (!cancelled && cachedData) {
          if (cachedData.comments && cachedData.comments.length > 0) {
            setComments(cachedData.comments);
          }
          
          if (cachedData.snippets && cachedData.snippets.length > 0) {
            const processedSnippets = processCachedSnippets(cachedData.snippets, cachedData.comments);
            setSnippetRecs(processedSnippets);
          }
          
          setUsedCache(true);
        } else {
          setUsedCache(false);
        }
        
        if (!cancelled) {
          if (cachedData) {
            setCommentsLoaded(true);
            setIsLoading(false);
          } else if (postData?.postType === "news" || postData?.postType === "parameter") {
            setCommentsLoaded(true);
            setIsLoading(false);
          } else {
            setCommentsLoaded(false);
            setIsLoading(false);
          }
        }
        return;
      }
      
      // No postData provided - try to load everything from cache or API
      try {
        const cachedData = await fetchCachedPostData(postId);
        if (!cancelled && cachedData) {
          setPost(ensureValidDate(cachedData));
          setComments(cachedData.comments || []);
          
          if (cachedData.snippets?.length > 0) {
            const processedSnippets = processCachedSnippets(cachedData.snippets, cachedData.comments);
            setSnippetRecs(processedSnippets);
          }
          
          setUsedCache(true);
          setCommentsLoaded(true);
          setIsLoading(false);
          return;
        }
        
        // Try other API sources...
        
        // Try /api/posts endpoint
        try {
          const resp = await fetch(buildApiUrl("/posts"));
          if (resp.ok) {
            const allPosts = await resp.json();
            if (allPosts.success && Array.isArray(allPosts.data)) {
              const foundPost = allPosts.data.find(p => p.id === postId);
              
              if (foundPost && !cancelled) {
                setPost(ensureValidDate({
                  ...foundPost,
                  ups: foundPost.ups ?? 0,
                  num_comments: foundPost.num_comments ?? 0,
                }));
                setUsedCache(false);
                setCommentsLoaded(true);
                setIsLoading(false);
                return;
              }
            }
          }
        } catch { /* intentionally empty */ }
        
        // Try diverse-posts endpoint
        try {
          const diverseResp = await fetch(buildApiUrl("/diverse-posts"));
          
          if (diverseResp.ok) {
            const diverseData = await diverseResp.json();
            if (diverseData.success && Array.isArray(diverseData.data)) {
              const diversePost = diverseData.data.find(p => p.id === postId);
              
              if (diversePost && !cancelled) {
                setPost(ensureValidDate({
                  ...diversePost,
                  ups: diversePost.ups ?? 0,
                  num_comments: diversePost.num_comments ?? 0,
                }));
                setUsedCache(false);
                setCommentsLoaded(true);
                setIsLoading(false);
                return;
              }
            }
          }
        } catch { /* intentionally empty */ }
        
        // Fallback - create minimal post
        if (!cancelled) {
          setPost({
            id: postId,
            title: "Thread",
            author: "Unknown",
            createdUtc: Date.now() / 1000,
            postType: "thread"
          });
          setCommentsLoaded(true);
          setIsLoading(false);
        }
        
      } catch (error) {
        if (!cancelled) {
          setError(error);
          setCommentsLoaded(true);
          setIsLoading(false);
        }
      }
    }
    
    loadPost();
    
    return () => {
      cancelled = true;
    };
  }, [postId, postData, fetchCachedPostData, processCachedSnippets, isLocalOnlyPost]);

  // Reset per-post live fetch guard
  useEffect(() => {
    didFetchLiveRef.current = false;
  }, [postId]);

  // For non-cached posts (e.g., posts added via the Reddit button), fetch live comments + snippets
  useEffect(() => {
    const shouldSkipLiveFetch =
      post?.postType === "news" ||
      post?.postType === "parameter" ||
      isLocalOnlyPost(post);

    if (!postId || !post || usedCache) {
      return;
    }
    if (shouldSkipLiveFetch) {
      setCommentsLoaded(true);
      setSnippetsLoading(false);
      return;
    }
    if (didFetchLiveRef.current) {
      return;
    }

    didFetchLiveRef.current = true;
    let cancelled = false;

    // Start loading snippets
    setSnippetsLoading(true);

    (async () => {
      try {
        const subredditParam =
          post?.subreddit
            ? `?subreddit=${encodeURIComponent(post.subreddit)}&postType=${encodeURIComponent(post.postType || "")}`
            : "";

        // Fetch comments first
        let liveComments = [];
        try {
          const cResp = await fetch(buildApiUrl(`/posts/${postId}/comments${subredditParam}`));
          const cJson = await cResp.json();
          liveComments = cJson?.success && cJson?.data ? cJson.data : [];
          if (!cancelled) setComments(liveComments);
        } catch { /* intentionally empty */ }

        // Then fetch snippets (don't let the comments state update cancel this)
        try {
          const sResp = await fetch(buildApiUrl(`/posts/${postId}/snippets${subredditParam}`));
          const sJson = await sResp.json();
          
          const raw = sJson?.success && Array.isArray(sJson.data) ? sJson.data : [];
          
          if (raw.length > 0) {
            const liveSnippets = processCachedSnippets(raw, liveComments);
            if (!cancelled) {
              setSnippetRecs(liveSnippets);
            }
          }
        } catch { /* intentionally empty */ }
      } finally {
        if (!cancelled) {
          setCommentsLoaded(true);
          setSnippetsLoading(false);
        }
      }
    })();

    return () => { 
      cancelled = true; 
    };
  }, [postId, post, usedCache, processCachedSnippets, isLocalOnlyPost]); // FIXED: Removed comments, snippetRecs, commentsLoaded from deps

  // Update unique users when comments change
  useEffect(() => {
    if (comments.length > 0) {
      const usersMap = new Map();
      comments.forEach(comment => {
        if (comment.author && comment.author !== "[deleted]") {
          if (!usersMap.has(comment.author)) {
            usersMap.set(comment.author, {
              name: comment.author,
              avatar: authorToAvatar(comment.author),
            });
          }
        }
      });
      setUniqueUsers(Array.from(usersMap.values()));
    }
  }, [comments]);

  // Generate dummy users
  useEffect(() => {
    const generateUsers = () => {
      const userCount = Math.floor(Math.random() * (19 - 7 + 1)) + 7;
      const dummyUsers = Array.from({ length: userCount }, (_, index) => ({
        id: index,
        name: `User ${index + 1}`,
        avatar: `https://i.pravatar.cc/50?img=${index + 1}`,
      }));
      setUsers(dummyUsers);
    };
  
    generateUsers();
  }, []);

  return {
    post,
    comments,
    snippetRecs,
    uniqueUsers,
    artistList,
    setComments,
    setSnippetRecs,
    usedCache,
    fetchMoreComments,
    commentsLoaded,
    snippetsLoading,
  };
}
