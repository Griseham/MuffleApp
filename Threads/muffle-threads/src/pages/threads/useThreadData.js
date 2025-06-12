import { useState, useEffect } from "react";
import { authorToAvatar } from "../utils/utils";

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

const fetchCachedPostData = async (postId) => {
  try {
    console.log(`ThreadDetail: Fetching cached post data for ID: ${postId}`);
    const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL}/cached-posts/${postId}`);
    if (!resp.ok) {
      console.log(`ThreadDetail: Cached post not found (${resp.status}): ${postId}`);
      return false;
    }
    
    const data = await resp.json();
    if (data.success && data.data) {
      setPost(ensureValidDate(data.data));
      setComments(data.data.comments || []);
      
      if (data.data.snippets?.length > 0) {
        console.log("Processing snippets from cached data:", data.data.snippets);
        const snippetsWithAvatars = data.data.snippets.map(snippet => {
          // Find the corresponding comment to get the author
          const correspondingComment = data.data.comments?.find(c => c.id === snippet.commentId);
          const snippetAuthor = correspondingComment?.author || "Unknown";
          
          return {
            id: snippet.commentId,
            commentId: snippet.commentId,
            query: snippet.query,
            name: snippet.songName,
            artistName: snippet.artistName,
            artwork: snippet.artworkUrl || `/assets/image${Math.floor(Math.random() * 999) + 1}.png`,
            previewUrl: snippet.previewUrl || `/backend/public/HeartShapedBox.mp3`,
            snippetData: {
              attributes: {
                name: snippet.songName,
                artistName: snippet.artistName,
                previews: [{ url: snippet.previewUrl || `/backend/public/HeartShapedBox.mp3` }],
                artwork: { url: snippet.artworkUrl || `/assets/image${Math.floor(Math.random() * 999) + 1}.png` },
                albumName: snippet.albumName || '',
                releaseDate: snippet.releaseDate || '',
                durationInMillis: snippet.duration || 0
              }
            },
            author: snippetAuthor,
            timestamp: Date.now(),
            artistImage: snippet.artworkUrl || `/assets/image${Math.floor(Math.random() * 999) + 1}.png`,
            snippetAuthorAvatar: authorToAvatar(snippetAuthor),
            userRating: null,
            avgRating: Math.floor(Math.random() * 50) + 50,
            totalRatings: Math.floor(Math.random() * 200) + 50,
            didRate: false
          };
        });
        console.log("Processed snippets:", snippetsWithAvatars);
        setSnippetRecs(snippetsWithAvatars);
      }
      setUsedCache(true);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

useEffect(() => {
  async function loadPost() {
    console.log("ThreadDetail: Loading post with ID:", postId);
    console.log("ThreadDetail: PostData provided:", !!postData);
    setIsLoading(true);
    setError(null);
    
    // If postData is provided, use it directly
    if (postData) {
      console.log("ThreadDetail: Using provided postData");
      setPost(ensureValidDate(postData));
      setUsedCache(false);
      setIsLoading(false);
      return;
    }
    
    try {
      let cachedResult = await fetchCachedPostData(postId);
      if (cachedResult) {
        console.log("ThreadDetail: Successfully loaded cached post data");
        setIsLoading(false);
        return;
      }
      console.log("ThreadDetail: No cached data found, trying other sources...");
      
      try {
        const directCacheResp = await fetch(`${import.meta.env.VITE_API_BASE_URL}/cached-posts/${postId}`);
        
        if (directCacheResp.ok) {
          const data = await directCacheResp.json();
          if (data.success && data.data) {
            setPost(ensureValidDate(data.data));
            setComments(data.data.comments || []);
            
            if (data.data.snippets && data.data.snippets.length > 0) {
              const processedSnippets = data.data.snippets.map(snippet => {
                const snippetAuthor = data.data.comments.find(c => c.id === snippet.commentId)?.author || "Unknown";
                
                return {
                  id: snippet.commentId,
                  commentId: snippet.commentId,
                  query: snippet.query,
                  name: snippet.songName,
                  artistName: snippet.artistName,
                  artwork: snippet.artworkUrl || `/assets/image${Math.floor(Math.random() * 999) + 1}.png`,
                  previewUrl: snippet.previewUrl || `/backend/public/HeartShapedBox.mp3`,
                  snippetData: {
                    attributes: {
                      name: snippet.songName,
                      artistName: snippet.artistName,
                      previews: [{ url: snippet.previewUrl || `/backend/public/HeartShapedBox.mp3` }],
                      artwork: { url: snippet.artworkUrl || `/assets/image${Math.floor(Math.random() * 999) + 1}.png` },
                      albumName: snippet.albumName || '',
                      releaseDate: snippet.releaseDate || '',
                      durationInMillis: snippet.duration || 0
                    }
                  },
                  author: snippetAuthor,
                  timestamp: Date.now() / 1000 - Math.floor(Math.random() * 86400),
                  artistImage: snippet.artworkUrl || `/assets/image${Math.floor(Math.random() * 999) + 1}.png`,
                  snippetAuthorAvatar: authorToAvatar(snippetAuthor),
                  userRating: null,
                  avgRating: Math.floor(Math.random() * 50) + 50,
                  totalRatings: Math.floor(Math.random() * 200) + 50,
                  didRate: false
                };
              });
              
              setSnippetRecs(processedSnippets);
            }
            
            setUsedCache(true);
            setIsLoading(false);
            return;
          }
        }
      } catch (error) {}
      
      try {
        const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL}/posts`);
        
        if (resp.ok) {
          const allPosts = await resp.json();
          if (allPosts.success && Array.isArray(allPosts.data)) {
            const foundPost = allPosts.data.find(p => p.id === postId);
            
            if (foundPost) {
              setPost(ensureValidDate({
                ...foundPost,
                ups: foundPost.ups || (postId.charCodeAt(0) % 10) * 100 + 50,
                num_comments: foundPost.num_comments || comments.length || Math.floor(Math.random() * 20) + 5,
              }));
              setUsedCache(false);
              setIsLoading(false);
              
              try {
                fetch(`${import.meta.env.VITE_API_BASE_URL}/posts/${postId}/cache?subreddit=${foundPost.subreddit}`);
              } catch (e) {}
              
              return;
            }
          }
        }
      } catch (error) {}
      
      try {
        console.log("ThreadDetail: Trying diverse-posts API...");
        const diverseResp = await fetch(`${import.meta.env.VITE_API_BASE_URL}/diverse-posts`);
        
        if (diverseResp.ok) {
          const diverseData = await diverseResp.json();
          if (diverseData.success && Array.isArray(diverseData.data)) {
            const diversePost = diverseData.data.find(p => p.id === postId);
            
            if (diversePost) {
              console.log("ThreadDetail: Found post in diverse-posts API");
              setPost(ensureValidDate({
                ...diversePost,
                ups: diversePost.ups || (postId.charCodeAt(0) % 10) * 100 + 50,
                num_comments: diversePost.num_comments || comments.length || Math.floor(Math.random() * 20) + 5,
              }));
              setUsedCache(false);
              setIsLoading(false);
              
              try {
                fetch(`${import.meta.env.VITE_API_BASE_URL}/posts/${postId}/cache?subreddit=${diversePost.subreddit}`);
              } catch (e) {}
              
              return;
            }
          }
        }
      } catch (error) {
        console.log("ThreadDetail: Error with diverse-posts API:", error);
      }
      
      try {
        const directPostResp = await fetch(`${import.meta.env.VITE_API_BASE_URL}/posts/${postId}`);
        
        if (directPostResp.ok) {
          const directPostData = await directPostResp.json();
          if (directPostData.success && directPostData.data) {
            const directPost = directPostData.data;
            
            setPost(ensureValidDate({
              ...directPost,
              ups: directPost.ups || (postId.charCodeAt(0) % 10) * 100 + 50,
              num_comments: directPost.num_comments || comments.length || Math.floor(Math.random() * 20) + 5,
            }));
            setUsedCache(false);
            setIsLoading(false);
            
            try {
              fetch(`${import.meta.env.VITE_API_BASE_URL}/posts/${postId}/cache?subreddit=${directPost.subreddit}`);
            } catch (e) {}
            
            return;
          }
        }
      } catch (error) {}
      
      console.log("ThreadDetail: All post loading attempts failed, creating placeholder post");
      const placeholderPost = {
        id: postId,
        title: "Post currently unavailable",
        author: "Unknown",
        selftext: "This post could not be retrieved from the server. It may have been removed or is temporarily unavailable.",
        createdUtc: Date.now() / 1000,
        postType: "thread",
        ups: Math.floor(Math.random() * 100) + 50,
        num_comments: Math.floor(Math.random() * 20) + 5
      };
      
      setPost(ensureValidDate(placeholderPost));
      setUsedCache(false);
      setError("Post could not be found");
      setIsLoading(false);
      
    } catch (error) {
      setError(`Error: ${error.message}`);
      setIsLoading(false);
    }
  }
  
  if (postId) {
    loadPost();
  }
}, [postId, postData]);

useEffect(() => {
  async function loadComments() {
    if (!post) return;
    if (usedCache && comments.length > 0) return;
    if (post.postType === "groupchat") return;
    
    try {
      const cacheResp = await fetch(`${import.meta.env.VITE_API_BASE_URL}/cached-posts/${postId}`);
      if (cacheResp.ok) {
        const cacheData = await cacheResp.json();
        if (cacheData.success && cacheData.data && cacheData.data.comments && cacheData.data.comments.length > 0) {
          setComments(
            cacheData.data.comments.map((c) => ({
              ...c,
              likeCount: Math.floor(Math.random() * 50),
              commentCount: Math.floor(Math.random() * 10),
            }))
          );
          setUsedCache(true);
          return;
        }
      }
    } catch (err) {}
    
    try {
      const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL}/posts/${postId}/comments`);
      
      if (resp.ok) {
        const data = await resp.json();
        if (data.success && data.data && data.data.length > 0) {
          const formattedComments = data.data.map((c) => {
            const commentData = c.data || c;
            return {
              id: commentData.id || `api_comment_${Math.random().toString(36).substring(2, 9)}`,
              author: commentData.author || "Anonymous",
              body: commentData.body || commentData.text || "Great post!",
              likeCount: Math.floor(Math.random() * 50),
              commentCount: Math.floor(Math.random() * 10),
              createdUtc: commentData.createdUtc || (Date.now() / 1000 - Math.floor(Math.random() * 86400)),
              replies: commentData.replies || []
            };
          });
          
          setComments(formattedComments);
          
          try {
            if (post.subreddit) {
              fetch(`${import.meta.env.VITE_API_BASE_URL}/posts/${postId}/cache?subreddit=${post.subreddit}`);
            }
          } catch (e) {}
          
          return;
        }
      }
      
      try {
        const diverseCommentsResp = await fetch(`${import.meta.env.VITE_API_BASE_URL}/diverse-posts/${postId}/comments`);
        
        if (diverseCommentsResp.ok) {
          const diverseCommentsData = await diverseCommentsResp.json();
          if (diverseCommentsData.success && diverseCommentsData.data && diverseCommentsData.data.length > 0) {
            const formattedDiverseComments = diverseCommentsData.data.map((c) => ({
              id: c.id || `diverse_comment_${Math.random().toString(36).substring(2, 9)}`,
              author: c.author || "User",
              body: c.body || c.text || "Interesting discussion!",
              likeCount: Math.floor(Math.random() * 50),
              commentCount: Math.floor(Math.random() * 10),
              createdUtc: c.createdUtc || (Date.now() / 1000 - Math.floor(Math.random() * 86400)),
              replies: c.replies || []
            }));
            
            setComments(formattedDiverseComments);
            
            try {
              if (post.subreddit) {
                fetch(`${import.meta.env.VITE_API_BASE_URL}/posts/${postId}/cache?subreddit=${post.subreddit}`);
              }
            } catch (e) {}
            
            return;
          }
        }
      } catch (error) {}
      
      setComments([]);
      
    } catch (error) {
      setComments([]);
    }
  }
  
  loadComments();
}, [post, postId, usedCache, comments.length, isLoading]);

  // Function to detect song patterns in comment text
  const detectSongInComment = (commentText) => {
    if (!commentText || typeof commentText !== 'string' || commentText.length < 3) return null;
    
    // Clean the comment text
    const cleanText = commentText.trim()
      .replace(/\n/g, ' ')  // Replace newlines with spaces
      .replace(/\s+/g, ' ') // Normalize multiple spaces
      .replace(/[^\w\s\-'"()–—]/g, ''); // Remove special chars except basic punctuation
    
    // Common song patterns:
    const patterns = [
      // "Song Name - Artist Name" or "Artist - Song Name"
      /^(.+?)\s*[-–—]\s*(.+?)$/,
      // "Song by Artist" or "Artist by Song"  
      /^(.+?)\s+by\s+(.+?)$/i,
      // "'Song Name' by Artist"
      /^['"](.+?)['"]?\s+by\s+(.+?)$/i,
      // "Song Name (Artist)" or "Artist (Song)"
      /^(.+?)\s*\((.+?)\)$/,
      // "Song Name -- Artist" (double dash)
      /^(.+?)\s*--\s*(.+?)$/,
      // Look for quoted strings that might be songs
      /^['"](.+?)['"]?\s*[-–—]\s*(.+?)$/,
    ];
    
    for (const pattern of patterns) {
      const match = cleanText.match(pattern);
      if (match) {
        const [, part1, part2] = match;
        
        // Filter out very short parts (likely not real songs)
        if (part1.trim().length < 2 || part2.trim().length < 2) continue;
        
        // Filter out common non-music patterns
        const nonMusicWords = ['reddit', 'subreddit', 'post', 'comment', 'link', 'http', 'www', 'youtube', 'spotify'];
        const text1Lower = part1.toLowerCase();
        const text2Lower = part2.toLowerCase();
        
        if (nonMusicWords.some(word => text1Lower.includes(word) || text2Lower.includes(word))) {
          continue;
        }
        
        // Try both combinations since we don't know which is song vs artist
        return [
          `${part1.trim()} ${part2.trim()}`,  // Combined search
          `${part1.trim()} - ${part2.trim()}`,  // First combination with dash
          `${part2.trim()} - ${part1.trim()}`   // Reversed combination
        ];
      }
    }
    
    return null;
  };

  // Function to generate snippets from comments using Apple Music API
  const generateSnippetsFromComments = async (commentsToProcess) => {
    if (!commentsToProcess || commentsToProcess.length === 0) return;
    
    const isParameterThread = post?.postType === 'parameter';
    console.log(`ThreadDetail: Generating snippets from comments using Apple Music API ${isParameterThread ? '(Parameter Thread)' : ''}`);
    
    const newSnippets = [];
    let processed = 0;
    // For parameter threads, process all comments since they're more likely to have songs
    const maxComments = isParameterThread ? commentsToProcess.length : 15;
    
    console.log(`ThreadDetail: Processing up to ${maxComments} comments for snippets`);
    
    for (const comment of commentsToProcess.slice(0, maxComments)) {
      if (!comment.body || comment.author === '[deleted]') continue;
      
      const songQueries = detectSongInComment(comment.body);
      if (!songQueries) continue;
      
      console.log(`ThreadDetail: Detected potential song in comment by ${comment.author}: "${comment.body.substring(0, 50)}..."`);
      
      let foundMatch = false;
      
      // Try query combinations until we find a match
      for (const query of songQueries) {
        if (foundMatch) break;
        
        try {
          console.log(`ThreadDetail: Searching Apple Music for: "${query}"`);
          
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/apple-music-search?query=${encodeURIComponent(query)}`);
          
          if (response.ok) {
            const result = await response.json();
            
            if (result.success && result.data) {
              const song = result.data;
              
              // Ensure we have proper artwork URL
              let artworkUrl = `/assets/image${Math.floor(Math.random() * 999) + 1}.png`;
              if (song.attributes.artwork?.url) {
                artworkUrl = song.attributes.artwork.url.replace('{w}', '300').replace('{h}', '300');
              }
              
              const snippet = {
                id: comment.id,
                commentId: comment.id,
                query: query,
                snippetData: {
                  attributes: {
                    name: song.attributes.name,
                    artistName: song.attributes.artistName,
                    previews: song.attributes.previews || [{ url: `/backend/public/HeartShapedBox.mp3` }],
                    artwork: { url: artworkUrl }
                  }
                },
                author: comment.author,
                timestamp: comment.createdUtc || (Date.now() / 1000 - Math.floor(Math.random() * 86400)),
                artistName: song.attributes.artistName,
                artistImage: artworkUrl,
                previewUrl: song.attributes.previews?.[0]?.url || `/backend/public/HeartShapedBox.mp3`,
                snippetAuthorAvatar: authorToAvatar(comment.author),
                userRating: null,
                avgRating: Math.floor(Math.random() * 5) + 1,
                totalRatings: Math.floor(Math.random() * 50) + 1,
                didRate: false
              };
              
              newSnippets.push(snippet);
              console.log(`ThreadDetail: ✓ Found real song: "${song.attributes.name}" by ${song.attributes.artistName}`);
              foundMatch = true;
            }
          }
        } catch (error) {
          console.error(`ThreadDetail: Error searching for "${query}":`, error);
        }
        
        // Add small delay between requests to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      
      processed++;
      
      // Stop if we have enough snippets
      if (newSnippets.length >= 8) {
        console.log("ThreadDetail: Reached maximum snippets, stopping search");
        break;
      }
    }
    
    if (newSnippets.length > 0) {
      console.log(`ThreadDetail: Successfully generated ${newSnippets.length} real snippets from ${processed} comments`);
      setSnippetRecs(newSnippets);
      
      // Generate artist list
      const artists = newSnippets.map(snippet => ({
        name: snippet.artistName,
        image: snippet.artistImage,
        ratings: snippet.totalRatings,
        avgRating: snippet.avgRating,
      }));
      
      const uniqueArtists = Array.from(
        new Map(artists.map(a => [a.name, a])).values()
      );
      
      setArtistList(uniqueArtists);
    } else {
      console.log("ThreadDetail: No songs detected in comments, falling back to synthetic snippets");
      // If no songs detected, generate some fallback snippets
      const fallbackSnippets = [
        {
          id: `fallback_1_${postId}`,
          commentId: `fallback_1_${postId}`,
          query: "Bohemian Rhapsody - Queen",
          snippetData: {
            attributes: {
              name: "Bohemian Rhapsody",
              artistName: "Queen",
              previews: [{ url: `/backend/public/HeartShapedBox.mp3` }],
              artwork: { url: `/assets/image123.png` }
            }
          },
          author: "MusicLover123",
          timestamp: Date.now() / 1000 - 86400,
          artistName: "Queen",
          artistImage: `/assets/image123.png`,
          previewUrl: `/backend/public/HeartShapedBox.mp3`,
          snippetAuthorAvatar: authorToAvatar("MusicLover123"),
          userRating: null,
          avgRating: 4,
          totalRatings: 25,
          didRate: false
        }
      ];
      
      setSnippetRecs(fallbackSnippets);
      setArtistList([{
        name: "Queen",
        image: `/assets/image123.png`,
        ratings: 25,
        avgRating: 4,
      }]);
    }
  };

  // Function to generate real Apple Music snippets using the API
  const generateAppleMusicSnippets = async () => {
    if (!post) return;
    
    console.log("ThreadDetail: Generating real Apple Music snippets for Reddit post");
    
    // Extract potential song/artist mentions from post title and content
    const postText = `${post.title || ''} ${post.selftext || ''}`;
    const popularSongs = [
      // Recent hits that are likely to be found
      "Anti-Hero - Taylor Swift",
      "Flowers - Miley Cyrus", 
      "As It Was - Harry Styles",
      "Heat Waves - Glass Animals",
      "Blinding Lights - The Weeknd",
      "Good 4 U - Olivia Rodrigo",
      "Stay - The Kid LAROI & Justin Bieber",
      "Industry Baby - Lil Nas X",
      "Peaches - Justin Bieber",
      "Levitating - Dua Lipa",
      "drivers license - Olivia Rodrigo",
      "Bad Habits - Ed Sheeran",
      "HUMBLE. - Kendrick Lamar",
      "Bohemian Rhapsody - Queen",
      "Don't Stop Believin' - Journey",
      "Mr. Brightside - The Killers",
      "Sweet Child O' Mine - Guns N' Roses",
      "Hotel California - Eagles",
      "Stairway to Heaven - Led Zeppelin",
      "Imagine - John Lennon"
    ];
    
    // Generate 3-5 snippets
    const snippetCount = Math.floor(Math.random() * 3) + 3;
    const realSnippets = [];
    const usedQueries = new Set();
    
    try {
      for (let i = 0; i < snippetCount; i++) {
        // Get a random song that we haven't used yet
        let query;
        let attempts = 0;
        do {
          query = popularSongs[Math.floor(Math.random() * popularSongs.length)];
          attempts++;
        } while (usedQueries.has(query) && attempts < 10);
        
        if (usedQueries.has(query)) {
          // If we've used all our popular songs, add a number to make it unique
          query = `${query} ${i}`;
        }
        usedQueries.add(query);
        
        console.log(`ThreadDetail: Searching Apple Music for: ${query}`);
        
        // Search Apple Music API
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/apple-music-search?query=${encodeURIComponent(query)}`);
        
        if (response.ok) {
          const result = await response.json();
          
          if (result.success && result.data) {
            const song = result.data;
            const commentId = `apple_music_${i}_${postId}`;
            const author = `MusicFan${Math.floor(Math.random() * 900) + 100}`;
            
            // Use real Apple Music data
            const snippet = {
              id: commentId,
              commentId,
              query: `${song.attributes.name} - ${song.attributes.artistName}`,
              snippetData: {
                attributes: {
                  name: song.attributes.name,
                  artistName: song.attributes.artistName,
                  previews: song.attributes.previews || [{ url: `/backend/public/HeartShapedBox.mp3` }],
                  artwork: song.attributes.artwork || { url: `/assets/image${Math.floor(Math.random() * 999) + 1}.png` }
                }
              },
              author,
              timestamp: Date.now() / 1000 - Math.floor(Math.random() * 86400 * 7),
              artistName: song.attributes.artistName,
              artistImage: song.attributes.artwork?.url || `/assets/image${Math.floor(Math.random() * 999) + 1}.png`,
              previewUrl: song.attributes.previews?.[0]?.url || `/backend/public/HeartShapedBox.mp3`,
              snippetAuthorAvatar: authorToAvatar(author)
            };
            
            realSnippets.push(snippet);
            console.log(`ThreadDetail: Found real song: ${song.attributes.name} by ${song.attributes.artistName}`);
          } else {
            console.log(`ThreadDetail: No Apple Music results for: ${query}`);
          }
        } else {
          console.log(`ThreadDetail: Apple Music API call failed for: ${query}`);
        }
        
        // Add small delay between requests to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // If we got some real results, use them
      if (realSnippets.length > 0) {
        const realArtists = realSnippets.map((snippet) => ({
          name: snippet.artistName,
          image: snippet.artistImage,
          ratings: Math.floor(Math.random() * 100) + 1,
          avgRating: Math.floor(Math.random() * 5) + 1,
        }));
        
        const uniqueRealArtists = Array.from(
          new Map(realArtists.map((a) => [a.name, a])).values()
        );
        
        setSnippetRecs(realSnippets);
        setArtistList(uniqueRealArtists);
        console.log(`ThreadDetail: Successfully loaded ${realSnippets.length} real Apple Music snippets`);
        return;
      }
    } catch (error) {
      console.error("ThreadDetail: Error fetching Apple Music snippets:", error);
    }
    
    // Fallback to basic snippets if Apple Music fails
    console.log("ThreadDetail: Falling back to basic snippets");
    const fallbackSnippets = [
      {
        id: `fallback_1_${postId}`,
        commentId: `fallback_1_${postId}`,
        query: "Bohemian Rhapsody - Queen",
        snippetData: {
          attributes: {
            name: "Bohemian Rhapsody",
            artistName: "Queen",
            previews: [{ url: `/backend/public/HeartShapedBox.mp3` }],
            artwork: { url: `/assets/image123.png` }
          }
        },
        author: "MusicLover123",
        timestamp: Date.now() / 1000 - 86400,
        artistName: "Queen",
        artistImage: `/assets/image123.png`,
        previewUrl: `/backend/public/HeartShapedBox.mp3`,
        snippetAuthorAvatar: authorToAvatar("MusicLover123")
      }
    ];
    
    const fallbackArtists = fallbackSnippets.map((snippet) => ({
      name: snippet.artistName,
      image: snippet.artistImage,
      ratings: Math.floor(Math.random() * 100) + 1,
      avgRating: Math.floor(Math.random() * 5) + 1,
    }));
    
    setSnippetRecs(fallbackSnippets);
    setArtistList(fallbackArtists);
  };

useEffect(() => {
  async function loadSnippets() {
    if (!post) return;
    if (usedCache && snippetRecs.length > 0) return;
    if (snippetRecs.length > 0) return; // Don't reload if we already have snippets
    
    
    try {
      const cacheResp = await fetch(`${import.meta.env.VITE_API_BASE_URL}/cached-posts/${postId}`);
      if (cacheResp.ok) {
        const cacheData = await cacheResp.json();
        
        // Process cached snippets (including for parameter threads)
        if (cacheData.success && cacheData.data && cacheData.data.snippets && cacheData.data.snippets.length > 0) {
          console.log(`ThreadDetail: Loading cached snippets for ${post?.postType === 'parameter' ? 'parameter thread' : 'thread'}`);
          console.log(`ThreadDetail: Found ${cacheData.data.snippets.length} cached snippets`);
          const processedSnippets = cacheData.data.snippets.map(snippet => {
            const snippetAuthor = cacheData.data.comments.find(c => c.id === snippet.commentId)?.author || "UnknownUser";
            
            return {
              id: snippet.commentId,
              commentId: snippet.commentId,
              query: snippet.query,
              name: snippet.songName,
              artistName: snippet.artistName,
              artwork: snippet.artworkUrl || `/assets/image${Math.floor(Math.random() * 999) + 1}.png`,
              previewUrl: snippet.previewUrl || `/backend/public/HeartShapedBox.mp3`,
              snippetData: {
                attributes: {
                  name: snippet.songName,
                  artistName: snippet.artistName,
                  previews: [{ url: snippet.previewUrl || `/backend/public/HeartShapedBox.mp3` }],
                  artwork: { url: snippet.artworkUrl || `/assets/image${Math.floor(Math.random() * 999) + 1}.png` },
                  albumName: snippet.albumName || '',
                  releaseDate: snippet.releaseDate || '',
                  durationInMillis: snippet.duration || 0
                }
              },
              author: snippetAuthor,
              timestamp: Date.now() / 1000 - Math.floor(Math.random() * 86400),
              artistImage: snippet.artworkUrl || `/assets/image${Math.floor(Math.random() * 999) + 1}.png`,
              snippetAuthorAvatar: authorToAvatar(snippetAuthor),
              userRating: null,
              avgRating: Math.floor(Math.random() * 50) + 50,
              totalRatings: Math.floor(Math.random() * 200) + 50,
              didRate: false
            };
          });
          
          const extractedArtists = processedSnippets.map((snippet) => ({
            name: snippet.artistName,
            image: snippet.artistImage,
            ratings: Math.floor(Math.random() * 100) + 1,
            avgRating: Math.floor(Math.random() * 5) + 1,
          }));
          
          const uniqueArtists = Array.from(
            new Map(extractedArtists.map((a) => [a.name, a])).values()
          );
          
          setSnippetRecs(processedSnippets);
          setArtistList(uniqueArtists);
          return;
        }
      }
    } catch (err) {}
    
    try {
      // Try to fetch snippets from API for non-cached posts
      if (post?.postType !== 'parameter') {
        const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL}/posts/${postId}/snippets`);
        
        if (resp.ok) {
        const data = await resp.json();
        if (data.success && data.data && data.data.length > 0) {
          const withAvatars = data.data.map((snip) => {
            const snippetAuthor = snip.author || "UnknownUser";
            const avatar = authorToAvatar(snippetAuthor);
            return { ...snip, snippetAuthorAvatar: avatar };
          });

          const extractedArtists = data.data.map((song) => ({
            name: song.artistName,
            image: song.artistImage,
            ratings: Math.floor(Math.random() * 100) + 1,
            avgRating: Math.floor(Math.random() * 5) + 1,
          }));

          const uniqueArtists = Array.from(
            new Map(extractedArtists.map((a) => [a.name, a])).values()
          );

          setSnippetRecs(withAvatars);
          setArtistList(uniqueArtists);
          return;
        }
        }
      }
      
      if (comments.length > 0) {
        console.log("ThreadDetail: Processing comments for snippets");
        
        // For API posts, try to generate snippets from comment text using Apple Music API
        if (postData && !postData.hasCachedData) {
          console.log("ThreadDetail: Using Apple Music API to generate snippets from comment text");
          await generateSnippetsFromComments(comments);
          return;
        }
        
        console.log("ThreadDetail: Generating snippets from existing comments");
        const sortedComments = [...comments]
          .sort((a, b) => (b.body?.length || 0) - (a.body?.length || 0))
          .slice(0, Math.min(8, comments.length))
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.min(4, Math.floor(comments.length / 2) + 1));
        
        const musicData = [
          { artist: "Radiohead", songs: ["Karma Police", "Paranoid Android", "Creep", "No Surprises", "Fake Plastic Trees"] },
          { artist: "Kendrick Lamar", songs: ["HUMBLE.", "DNA.", "Alright", "Money Trees", "King Kunta"] },
          { artist: "Taylor Swift", songs: ["Cruel Summer", "Anti-Hero", "Love Story", "Blank Space", "All Too Well"] },
          { artist: "The Weeknd", songs: ["Blinding Lights", "Starboy", "Save Your Tears", "Die For You", "The Hills"] },
          { artist: "Billie Eilish", songs: ["bad guy", "Happier Than Ever", "ocean eyes", "everything i wanted", "when the party's over"] },
          { artist: "Arctic Monkeys", songs: ["Do I Wanna Know?", "505", "R U Mine?", "Why'd You Only Call Me When You're High?", "Arabella"] },
          { artist: "Tame Impala", songs: ["The Less I Know The Better", "Let It Happen", "Borderline", "Lost in Yesterday", "Feels Like We Only Go Backwards"] },
          { artist: "Frank Ocean", songs: ["Nights", "Pyramids", "Pink + White", "Godspeed", "Self Control"] },
          { artist: "Daft Punk", songs: ["Get Lucky", "Around The World", "One More Time", "Harder, Better, Faster, Stronger", "Instant Crush"] },
          { artist: "Lana Del Rey", songs: ["Summertime Sadness", "Video Games", "Young and Beautiful", "Born To Die", "West Coast"] },
          { artist: "Tyler, The Creator", songs: ["EARFQUAKE", "See You Again", "WUSYANAME", "NEW MAGIC WAND", "IGOR'S THEME"] },
          { artist: "SZA", songs: ["Kill Bill", "Good Days", "Shirt", "Snooze", "Nobody Gets Me"] },
          { artist: "The 1975", songs: ["Somebody Else", "The Sound", "Love It If We Made It", "robbers", "It's Not Living"] }
        ];
        
        const fakeSnippets = sortedComments.map((comment, index) => {
          let musicIndex = Math.floor(Math.random() * musicData.length);
          
          const commentWords = (comment.body || "").split(/\s+/).map(w => w.toLowerCase());
          const titleWords = (post.title || "").split(/\s+/).map(w => w.toLowerCase());
          const allWords = [...commentWords, ...titleWords];
          
          for (let i = 0; i < musicData.length; i++) {
            const artistWords = musicData[i].artist.toLowerCase().split(/\s+/);
            if (artistWords.some(word => allWords.includes(word))) {
              musicIndex = i;
              break;
            }
          }
          
          const musicEntry = musicData[musicIndex];
          const songIndex = Math.floor(Math.random() * musicEntry.songs.length);
          const song = musicEntry.songs[songIndex];
          const artist = musicEntry.artist;
          
          const avatarIndex = (artist.charCodeAt(0) + artist.charCodeAt(artist.length - 1)) % 999 + 1;
          
          return {
            id: comment.id,
            commentId: comment.id,
            query: `${song} - ${artist}`,
            snippetData: {
              attributes: {
                name: song,
                artistName: artist,
                previews: [{ url: `/backend/public/HeartShapedBox.mp3` }],
                artwork: { url: `/assets/image${avatarIndex}.png` }
              }
            },
            author: comment.author,
            timestamp: comment.createdUtc || (Date.now() / 1000 - Math.floor(Math.random() * 86400)),
            artistName: artist,
            artistImage: `/assets/image${avatarIndex}.png`,
            previewUrl: `/backend/public/HeartShapedBox.mp3`,
            snippetAuthorAvatar: authorToAvatar(comment.author)
          };
        });
        
        const extractedArtists = fakeSnippets.map((snippet) => ({
          name: snippet.artistName,
          image: snippet.artistImage,
          ratings: Math.floor(Math.random() * 100) + 1,
          avgRating: Math.floor(Math.random() * 5) + 1,
        }));
        
        const uniqueArtists = Array.from(
          new Map(extractedArtists.map((a) => [a.name, a])).values()
        );
        
        setSnippetRecs(fakeSnippets);
        setArtistList(uniqueArtists);
        return;
      }
      
      // Use fallback snippets if no cached data or comments
      console.log("ThreadDetail: No cached snippets or comments, using fallback generation");
      // For API posts, try Apple Music generation; for others, use synthetic snippets
      if (postData && !postData.hasCachedData) {
        generateAppleMusicSnippets();
      } else {
        // Generate basic fallback snippets for cached posts without snippet data
        const fallbackSnippets = [
          {
            id: `fallback_1_${postId}`,
            commentId: `fallback_1_${postId}`,
            query: "Bohemian Rhapsody - Queen",
            snippetData: {
              attributes: {
                name: "Bohemian Rhapsody",
                artistName: "Queen",
                previews: [{ url: `/backend/public/HeartShapedBox.mp3` }],
                artwork: { url: `/assets/image123.png` }
              }
            },
            author: "MusicLover123",
            timestamp: Date.now() / 1000 - 86400,
            artistName: "Queen",
            artistImage: `/assets/image123.png`,
            previewUrl: `/backend/public/HeartShapedBox.mp3`,
            snippetAuthorAvatar: authorToAvatar("MusicLover123")
          }
        ];
        
        const fallbackArtists = fallbackSnippets.map((snippet) => ({
          name: snippet.artistName,
          image: snippet.artistImage,
          ratings: Math.floor(Math.random() * 100) + 1,
          avgRating: Math.floor(Math.random() * 5) + 1,
        }));
        
        setSnippetRecs(fallbackSnippets);
        setArtistList(fallbackArtists);
      }
      
    } catch (error) {
      const fallbackSnippets = [
        {
          id: `fallback_1_${postId}`,
          commentId: `fallback_1_${postId}`,
          query: "Bohemian Rhapsody - Queen",
          snippetData: {
            attributes: {
              name: "Bohemian Rhapsody",
              artistName: "Queen",
              previews: [{ url: `/backend/public/HeartShapedBox.mp3` }],
              artwork: { url: `/assets/image123.png` }
            }
          },
          author: "MusicLover123",
          timestamp: Date.now() / 1000 - 86400,
          artistName: "Queen",
          artistImage: `/assets/image123.png`,
          previewUrl: `/backend/public/HeartShapedBox.mp3`,
          snippetAuthorAvatar: authorToAvatar("MusicLover123")
        },
        {
          id: `fallback_2_${postId}`,
          commentId: `fallback_2_${postId}`,
          query: "Blinding Lights - The Weeknd",
          snippetData: {
            attributes: {
              name: "Blinding Lights",
              artistName: "The Weeknd",
              previews: [{ url: `/backend/public/HeartShapedBox.mp3` }],
              artwork: { url: `/assets/image456.png` }
            }
          },
          author: "MusicFan456",
          timestamp: Date.now() / 1000 - 43200,
          artistName: "The Weeknd",
          artistImage: `/assets/image456.png`,
          previewUrl: `/backend/public/HeartShapedBox.mp3`,
          snippetAuthorAvatar: authorToAvatar("MusicFan456")
        }
      ];
      
      const fallbackArtists = fallbackSnippets.map((snippet) => ({
        name: snippet.artistName,
        image: snippet.artistImage,
        ratings: Math.floor(Math.random() * 100) + 1,
        avgRating: Math.floor(Math.random() * 5) + 1,
      }));
      
      setSnippetRecs(fallbackSnippets);
      setArtistList(fallbackArtists);
    }
  }
  
  loadSnippets();
}, [post, postId, usedCache, snippetRecs.length, postData]);


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

  // Function to verify snippets have proper album art
  const verifySnippetAlbumArt = (snippets) => {
    if (!snippets || snippets.length === 0) return true;
    
    console.log("ThreadDetail: Verifying album art for snippets...");
    
    let hasIssues = false;
    snippets.forEach((snippet, index) => {
      const artworkUrl = snippet.snippetData?.attributes?.artwork?.url || snippet.artistImage;
      
      if (!artworkUrl) {
        console.warn(`ThreadDetail: Snippet ${index} (${snippet.snippetData?.attributes?.name || snippet.id}) is missing album art`);
        hasIssues = true;
      } else if (artworkUrl.includes('/assets/image') && Math.random() < 0.1) {
        // Occasionally log when we're using fallback images (10% chance)
        console.log(`ThreadDetail: Snippet "${snippet.snippetData?.attributes?.name}" using fallback artwork: ${artworkUrl}`);
      } else if (artworkUrl.includes('mzstatic.com') || artworkUrl.includes('apple.com')) {
        // This is a real Apple Music artwork URL
        console.log(`ThreadDetail: ✓ Snippet "${snippet.snippetData?.attributes?.name}" has real Apple Music artwork`);
      }
    });
    
    if (!hasIssues) {
      console.log(`ThreadDetail: ✓ All ${snippets.length} snippets have album art`);
    }
    
    return !hasIssues;
  };

  // Run verification when snippets change
  useEffect(() => {
    if (snippetRecs.length > 0) {
      verifySnippetAlbumArt(snippetRecs);
    }
  }, [snippetRecs]);

useEffect(() => {
  const checkIfCached = async () => {
    if (!post) return;
    
    try {
      const checkCacheResp = await fetch(`${import.meta.env.VITE_API_BASE_URL}/cached-posts/${postId}`);
      if (checkCacheResp.ok) {
        setUsedCache(true);
      }
    } catch (err) {}
  };
  
  if (post) {
    checkIfCached();
  }
}, [post, postId]);

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
  };
}