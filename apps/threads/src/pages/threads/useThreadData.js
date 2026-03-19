import { useState, useEffect, useCallback, useRef } from "react";
import { authorToAvatar } from "../utils/utils";
import { buildApiUrl, toApiOriginUrl } from "../../utils/api";

export default function useThreadData(postId, postData = null) {
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [snippetRecs, setSnippetRecs] = useState([]);
  const [uniqueUsers, setUniqueUsers] = useState([]);
  const [artistList, setArtistList] = useState([]);
  const [users, setUsers] = useState([]);
  const [usedCache, setUsedCache] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
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

  const fetchMoreComments = async (count = 10) => {
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

  // Helper function to process cached snippets
  const processCachedSnippets = useCallback((snippets, commentsData) => {
    if (!snippets || snippets.length === 0) return [];
    
    console.log("useThreadData: Processing snippets from cached data:", snippets.length);
    return snippets.map((snippet, index) => {
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

      // DEBUG: Log raw artwork before processing
      console.log(`processCachedSnippets: Snippet ${index} raw artwork debug:`, {
        commentId: snippet.commentId,
        'snippet.artworkUrl': snippet.artworkUrl,
        'snippet.snippetData?.attributes?.artwork?.url': snippet.snippetData?.attributes?.artwork?.url,
        'snippet.artistImage': snippet.artistImage,
        'snippet.artwork': snippet.artwork,
        'rawArtwork selected': rawArtwork
      });

      const artworkUrl = normalizeMediaUrl(
        formatArtworkUrl(rawArtwork, 300) ||
        rawArtwork ||
        "/assets/default-artist.png"
      );

      // DEBUG: Log final artwork URL
      console.log(`processCachedSnippets: Snippet ${index} final artworkUrl:`, artworkUrl);

      const previewUrl = normalizeMediaUrl(
        snippet.previewUrl ||
        snippet.snippetData?.attributes?.previews?.[0]?.url ||
        ""
      );

      return {
        id: snippet.commentId || snippet.id,
        commentId: snippet.commentId || snippet.id,
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
        userRating: null,
        avgRating: Math.floor(Math.random() * 50) + 50,
        totalRatings: Math.floor(Math.random() * 200) + 50,
        didRate: false
      };
    });
  }, []);

  // Fetch cached post data including comments
  const fetchCachedPostData = useCallback(async (id) => {
    try {
      console.log(`useThreadData: Fetching cached post data for ID: ${id}`);
      const resp = await fetch(buildApiUrl(`/cached-posts/${id}`));
      if (!resp.ok) {
        console.log(`useThreadData: Cached post not found (${resp.status}): ${id}`);
        return null;
      }
      
      const data = await resp.json();
      if (data.success && data.data) {
        return data.data;
      }
      return null;
    } catch (error) {
      console.error("useThreadData: Error fetching cached post:", error);
      return null;
    }
  }, []);

  // Load post and comments
  useEffect(() => {
    let cancelled = false;
    
    async function loadPost() {
      console.log("useThreadData: Loading post with ID:", postId);
      console.log("useThreadData: PostData provided:", !!postData);
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
        console.log("useThreadData: Using provided postData, will also fetch cached comments");
        setPost(ensureValidDate(postData));
        
        // Try to load cached comments and snippets for this post
        let cachedData = null;
        if (postData?.hasCachedData !== false) {
          cachedData = await fetchCachedPostData(postId);
        } else {
          console.log("useThreadData: postData.hasCachedData is false; skipping cached-posts fetch");
        }
        if (!cachedData) {
          console.log("useThreadData: No cached data found for postId:", postId);
        }
        if (!cancelled && cachedData) {
          console.log("useThreadData: Found cached data, loading comments and snippets");
          
          if (cachedData.comments && cachedData.comments.length > 0) {
            setComments(cachedData.comments);
            console.log(`useThreadData: Loaded ${cachedData.comments.length} cached comments`);
          }
          
          if (cachedData.snippets && cachedData.snippets.length > 0) {
            const processedSnippets = processCachedSnippets(cachedData.snippets, cachedData.comments);
            setSnippetRecs(processedSnippets);
            console.log(`useThreadData: Loaded ${processedSnippets.length} cached snippets`);
          }
          
          setUsedCache(true);
        } else {
          console.log("useThreadData: No cached data found for postId:", postId);
          setUsedCache(false);
        }
        
        if (!cancelled) {
          if (cachedData) {
            setCommentsLoaded(true);
            setIsLoading(false);
            console.log("useThreadData: commentsLoaded set to true (cached)");
          } else if (postData?.postType === "news" || postData?.postType === "parameter") {
            setCommentsLoaded(true);
            setIsLoading(false);
            console.log(`useThreadData: Skipping live fetch for ${postData.postType} thread without cache`);
          } else {
            setCommentsLoaded(false);
            setIsLoading(false);
            console.log("useThreadData: No cache for provided postData; will fetch live comments/snippets");
          }
        }
        return;
      }
      
      // No postData provided - try to load everything from cache or API
      try {
        const cachedData = await fetchCachedPostData(postId);
        if (!cancelled && cachedData) {
          console.log("useThreadData: Successfully loaded cached post data");
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
        console.log("useThreadData: No cached data found, trying other sources...");
        
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
                  ups: foundPost.ups || (postId.charCodeAt(0) % 10) * 100 + 50,
                  num_comments: foundPost.num_comments || Math.floor(Math.random() * 20) + 5,
                }));
                setUsedCache(false);
                setCommentsLoaded(true);
                setIsLoading(false);
                return;
              }
            }
          }
        } catch (error) {
          console.log("useThreadData: Error fetching from /api/posts:", error);
        }
        
        // Try diverse-posts endpoint
        try {
          console.log("useThreadData: Trying diverse-posts API...");
          const diverseResp = await fetch(buildApiUrl("/diverse-posts"));
          
          if (diverseResp.ok) {
            const diverseData = await diverseResp.json();
            if (diverseData.success && Array.isArray(diverseData.data)) {
              const diversePost = diverseData.data.find(p => p.id === postId);
              
              if (diversePost && !cancelled) {
                console.log("useThreadData: Found post in diverse-posts API");
                setPost(ensureValidDate({
                  ...diversePost,
                  ups: diversePost.ups || (postId.charCodeAt(0) % 10) * 100 + 50,
                  num_comments: diversePost.num_comments || Math.floor(Math.random() * 20) + 5,
                }));
                setUsedCache(false);
                setCommentsLoaded(true);
                setIsLoading(false);
                return;
              }
            }
          }
        } catch (error) {
          console.log("useThreadData: Error fetching from diverse-posts:", error);
        }
        
        // Fallback - create minimal post
        if (!cancelled) {
          console.log("useThreadData: Using fallback post data");
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
        console.error("useThreadData: Error loading post:", error);
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
  }, [postId, postData, fetchCachedPostData, processCachedSnippets]);

  // Reset per-post live fetch guard
  useEffect(() => {
    didFetchLiveRef.current = false;
  }, [postId]);

  // For non-cached posts (e.g., posts added via the Reddit button), fetch live comments + snippets
  useEffect(() => {
    const shouldSkipLiveFetch = post?.postType === "news" || post?.postType === "parameter";

    if (!postId || !post || usedCache) {
      console.log("useThreadData: Live fetch skipped - conditions not met", { postId: !!postId, post: !!post, usedCache });
      return;
    }
    if (shouldSkipLiveFetch) {
      console.log(`useThreadData: Live fetch skipped for ${post.postType} thread`, { postId });
      setCommentsLoaded(true);
      setSnippetsLoading(false);
      return;
    }
    if (didFetchLiveRef.current) {
      console.log("useThreadData: Live fetch skipped - already fetched");
      return;
    }

    console.log("useThreadData: Starting live fetch for comments and snippets for post:", postId);
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
          console.log("useThreadData: Fetching live comments...");
          const cResp = await fetch(buildApiUrl(`/posts/${postId}/comments${subredditParam}`));
          const cJson = await cResp.json();
          liveComments = cJson?.success && cJson?.data ? cJson.data : [];
          console.log(`useThreadData: Received ${Array.isArray(liveComments) ? liveComments.length : 0} live comments`);
          if (!cancelled) setComments(liveComments);
        } catch (e) {
          console.error("useThreadData: Error fetching live comments:", e);
        }

        // Then fetch snippets (don't let the comments state update cancel this)
        try {
          console.log("useThreadData: Fetching live snippets...");
          const sResp = await fetch(buildApiUrl(`/posts/${postId}/snippets${subredditParam}`));
          const sJson = await sResp.json();
          console.log("useThreadData: Snippets API response:", sJson);
          
          const raw = sJson?.success && Array.isArray(sJson.data) ? sJson.data : [];
          console.log(`useThreadData: Received ${raw.length} raw snippets from API`);
          
          if (raw.length > 0) {
            const liveSnippets = processCachedSnippets(raw, liveComments);
            console.log(`useThreadData: Processed ${liveSnippets.length} snippets`);
            if (!cancelled) {
              setSnippetRecs(liveSnippets);
              console.log("useThreadData: Set snippetRecs with", liveSnippets.length, "snippets");
            } else {
              console.log("useThreadData: Cancelled before setting snippets");
            }
          } else {
            console.log("useThreadData: No snippets returned from API");
          }
        } catch (e) {
          console.error("useThreadData: Error fetching live snippets:", e);
        }
      } finally {
        if (!cancelled) {
          setCommentsLoaded(true);
          setSnippetsLoading(false);
          console.log("useThreadData: Live fetch complete, commentsLoaded set to true, snippetsLoading set to false");
        }
      }
    })();

    return () => { 
      console.log("useThreadData: Live fetch effect cleanup called");
      cancelled = true; 
    };
  }, [postId, post, usedCache, processCachedSnippets]); // FIXED: Removed comments, snippetRecs, commentsLoaded from deps

  // Load snippets when needed (for non-cached posts)
  useEffect(() => {
    if (!post || !postId || usedCache) return;
    if (post.postType === "news" || post.postType === "parameter") return;
    if (!commentsLoaded) return;
    if (!didFetchLiveRef.current) return;
    if (snippetRecs.length > 0) return;
    
    const generateFallbackSnippets = async () => {
      // Generate fallback snippets for API posts
      const fallbackSnippets = [
        {
          id: `fallback_1_${postId}`,
          commentId: `fallback_1_${postId}`,
          query: "Bohemian Rhapsody - Queen",
          name: "Bohemian Rhapsody",
          songName: "Bohemian Rhapsody",
          artistName: "Queen",
          artwork: `/assets/default-artist.png`,
          artworkUrl: `/assets/default-artist.png`,
          previewUrl: `/backend/public/HeartShapedBox.mp3`,
          snippetData: {
            attributes: {
              name: "Bohemian Rhapsody",
              artistName: "Queen",
              previews: [{ url: `/backend/public/HeartShapedBox.mp3` }],
              artwork: { url: `/assets/default-artist.png` }
            }
          },
          author: "MusicLover123",
          timestamp: Date.now() / 1000 - 86400,
          artistImage: `/assets/default-artist.png`,
          snippetAuthorAvatar: authorToAvatar("MusicLover123"),
          userRating: null,
          avgRating: Math.floor(Math.random() * 50) + 50,
          totalRatings: Math.floor(Math.random() * 200) + 50,
          didRate: false
        }
      ];
      
      setSnippetRecs(fallbackSnippets);
    };
    
    generateFallbackSnippets();
  }, [post, postId, usedCache, commentsLoaded, snippetRecs.length]);

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
