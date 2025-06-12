// server.js
import express from 'express';
import fetch from 'node-fetch'; // or use undici if needed
import cors from 'cors';
import fs from "fs";
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



 
const dotenvResult = dotenv.config();

const APPLE_API_BASE_URL = process.env.APPLE_API_BASE_URL;
const APPLE_DEVELOPER_TOKEN = process.env.APPLE_DEVELOPER_TOKEN;

// Environment variables loaded

const threadsRouter = express.Router();


// Blacklist configuration
const BLACKLISTED_USERS = [
  'Smoothlarryy',
  'banstovia',
  'DrgRug9756',
    'jimviv'
];

// Function to check if a post should be blacklisted
function isPostBlacklisted(post) {
  return BLACKLISTED_USERS.includes(post.author);
}

// We'll store our data in memory for an MVP

// Caching variables with shorter TTL for more frequent refreshes
let cachedPosts = [];
let lastFetchTime = 0; 
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes (reduced from 15 minutes) for more frequent variety

const commentsCache = {}; 
const COMMENT_CACHE_TTL_MS = 8 * 60 * 1000; // 8 minutes for comments


// A threshold for "short" comments
const COMMENT_LENGTH_THRESHOLD = 80;

const postsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                 // limit each IP to 100 requests per window
});

function saveToJSON(posts) {
  fs.writeFileSync("./db.json", JSON.stringify(posts, null, 2), "utf-8");
}

function flattenRedditComments(children, maxDepth = 1, currentDepth = 0) {
  let flat = [];
  for (const item of children) {
    if (!item || !item.data) continue;
    const c = item.data;
    let parentId = c.parent_id ? c.parent_id.replace(/^t\d_/, "") : null;
    if (currentDepth === 0) {
      parentId = null;
    }
    const flattened = {
      id: c.id,
      author: c.author,
      body: c.body || "",
      createdUtc: c.created_utc || 0,
      parentId: parentId,
    };
    flat.push(flattened);
    if (currentDepth < maxDepth) {
      if (c.replies?.data?.children) {
        const nested = flattenRedditComments(c.replies.data.children, maxDepth, currentDepth + 1);
        flat = flat.concat(nested);
      }
    }
  }
  return flat;
}

function removeLinks(text) {
  if (!text) return "";
  return text.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/gi, "$1")
             .replace(/https?:\/\/\S+/gi, "");
}

function extractImageUrl(post) {
  if (post.post_hint === 'image' && post.url) {
    return post.url;
  }
  if (post.preview && post.preview.images && post.preview.images.length > 0) {
    return post.preview.images[0].source.url;
  }
  if (post.is_gallery && post.gallery_data && post.media_metadata) {
    const items = post.gallery_data.items;
    const media = post.media_metadata;
    const imageUrls = items.map(item => {
      const mediaItem = media[item.media_id];
      const url = mediaItem?.s?.u || null;
      return url;
    }).filter(url => url !== null);
    if (imageUrls.length > 0) {
      return imageUrls[0];
    }
  }
  const extPattern = /\.(jpg|jpeg|png|gif)$/i;
  const isImageLink = extPattern.test(post.url) || post.url.includes("i.redd.it");
  if (isImageLink) {
    return post.url;
  }
  return null;
}

function decodeEntities(str) {
  return str.replace(/&amp;/g, "&");
}

// --- Updated fetchSubreddit function ---


function deduplicatePosts(posts) {
  const seen = new Set();
  return posts.filter(p => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function insertParameterThread(posts) {
  const paramThread = {
    id: "parameterThreadPlaceholder",
    subreddit: "params",
    title: "",
    selftext: "",
    imageUrl: null,
    postType: "parameter",
  };
  const randomIndex = Math.floor(Math.random() * 10);
  posts.splice(randomIndex, 0, paramThread);
  return posts;
}

// --- Apple Music snippet search code ---

async function fetchSubreddit(subreddit) {
  let url;
  // Significantly increased limits for more diversity while maintaining quality
  if (subreddit === "musicsuggestions") {
    // For musicsuggestions, get posts with more comments by sorting by most comments
    url = `https://www.reddit.com/r/${subreddit}/top.json?t=year&limit=100`;
  } else if (subreddit === "musicrecommendations") {
    url = `https://www.reddit.com/r/${subreddit}/top.json?t=month&limit=40`;
  } else if (subreddit === "ifyoulikeblank") {
    url = `https://www.reddit.com/r/${subreddit}/top.json?t=month&limit=35`;
  } else if (subreddit === "listentothis") {
    url = `https://www.reddit.com/r/${subreddit}/top.json?t=month&limit=35`;
  } else {
    url = `https://www.reddit.com/r/${subreddit}/top.json?t=month&limit=25`;
  }
  
  // Fetching posts from subreddit
  
  const resp = await fetch(url);
  if (!resp.ok) {
    return [];
  }
  const data = await resp.json();
  if (!data || !data.data) return [];
  
  // Add randomness to ensure different posts appear when reloading
  const shuffled = shuffleArray([...data.data.children]);
  
  // Take a random subset based on comment count for musicsuggestions
  let selectedPosts;
  if (subreddit === "musicsuggestions") {
    // Sort by number of comments for musicsuggestions to get better group chat candidates
    const sortedByComments = [...shuffled].sort((a, b) => b.data.num_comments - a.data.num_comments);
    // Take top 20 posts with most comments
    selectedPosts = sortedByComments.slice(0, Math.min(20, sortedByComments.length));
  } else {
    selectedPosts = shuffled.slice(0, Math.min(15, shuffled.length));
  }
  
  const out = selectedPosts
    .map((child) => {
      const p = child.data;
      const rawUrl = extractImageUrl(p);
      const imageUrl = rawUrl ? decodeEntities(rawUrl) : null;
      
      let postType = "thread";
      if (subreddit === "music") {
        postType = "news";
      } else if (["musicrecommendations", "songrecommendations", "musicsuggestions"].includes(subreddit)) {
        // Mark all posts from musicsuggestions as groupchats if they have comments
        if (subreddit === "musicsuggestions" && p.num_comments && p.num_comments > 5) {
          postType = "groupchat";
        } else {
          postType = "thread";
        }
      }
      
      // Add timestamp randomization to ensure UI shows different posts first
      const randomizedTime = p.created_utc + Math.floor(Math.random() * 3600); 
      
      return {
        id: p.id,
        subreddit,
        title: p.title,
        author: p.author,
        ups: p.ups,
        downs: p.downs,
        url: p.url,
        is_self: p.is_self,
        selftext: p.selftext,
        createdUtc: randomizedTime, // Randomized timestamp
        imageUrl,
        postType,
        num_comments: p.num_comments,
      };
    })
    .filter(post => !isPostBlacklisted(post)); // Filter out blacklisted posts
  
  // For musicsuggestions, filter and promote high-comment posts
  const groupchatPosts = out.filter(post =>
    post.subreddit === "musicsuggestions" && post.num_comments >= 5
  );
  
  if (groupchatPosts.length > 0) {
    // Sort group chat posts by number of comments (most comments first)
    const sortedGroupChats = [...groupchatPosts].sort((a, b) => b.num_comments - a.num_comments);
    
    // Choose top 5 high-comment posts to promote
    const topGroupChatPosts = sortedGroupChats.slice(0, Math.min(5, sortedGroupChats.length));
    
    // Make sure they're all marked as groupchats and move to the beginning
    for (const selected of topGroupChatPosts) {
      selected.postType = "groupchat";
      
      // Remove it from its current position
      const currentIndex = out.findIndex(p => p.id === selected.id);
      if (currentIndex >= 0) {
        out.splice(currentIndex, 1);
      }
    }
    
    // Add all selected groupchats to the beginning
    out.unshift(...topGroupChatPosts);
  }
  
  return out;
}

// Enhanced fetchAllSubreddits function for greater variety with quality filtering
async function fetchAllSubreddits() {
  // Expanded list of music-related subreddits
  const subs = [
    "musicrecommendations", 
    "songrecommendations", 
    "musicsuggestions", 
    "music",
    "ifyoulikeblank",
    "listentothis",
    "indiemusicfeedback", // Adding more music subs for variety
    "newmusic", 
    "electronicmusic"
  ];
  
  // Fetching posts from multiple subreddits
  
  let allPosts = [];
  for (const sub of subs) {
    const subset = await fetchSubreddit(sub);
    allPosts = allPosts.concat(subset);
  }
  
  // Quality filter - ensure we have posts with good engagement
  // Filter to keep posts that have at least 10 upvotes or 5 comments
  const qualityPosts = allPosts.filter(post => 
    (post.ups >= 10 || post.num_comments >= 5)
  );
  
  // Filtered posts based on quality metrics
  
  // If we have enough quality posts, use those; otherwise use all posts
  const postsToUse = qualityPosts.length >= 25 ? qualityPosts : allPosts;
  
  // Shuffle more aggressively for more variation
  shuffleArray(postsToUse);
  shuffleArray(postsToUse); // Double shuffle for more randomness
  
  // Dedupe posts
  const uniquePosts = deduplicatePosts(postsToUse);
  
  // Add parameter thread
  insertParameterThread(uniquePosts);
  
  // Adjust limit for more content but not overwhelming UI
  const maxPosts = 40; // Increased from 30 to 40
  const finalPosts = uniquePosts.length > maxPosts ? uniquePosts.slice(0, maxPosts) : uniquePosts;
  
  return finalPosts;
}

// Enhanced function to ensure cache refreshes with more diversity
function forceRefreshCachedPosts() {
  // Make the cache expire immediately
  const REFRESH_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes to completely expire
  
  // Update last fetch time to be much older, forcing an immediate refresh
  lastFetchTime = Date.now() - REFRESH_CACHE_TTL_MS - 5000;
  
  // Also clear the cached posts array to ensure completely fresh data
  cachedPosts = [];
  
  // Cache cleared for fresh data
}
async function searchAppleMusic(query) {
  const searchUrl = `${APPLE_API_BASE_URL}/search?term=${encodeURIComponent(query)}&limit=1&types=songs`;
  try {
    const response = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${APPLE_DEVELOPER_TOKEN}`,
      },
    });
    const data = await response.json();
    if (
      data &&
      data.results &&
      data.results.songs &&
      data.results.songs.data &&
      data.results.songs.data.length > 0
    ) {
      return data.results.songs.data[0];
    }
  } catch (error) {
    // Apple Music search error
  }
  return null;
}

function isUsableSnippetComment(commentText) {
  return commentText.includes("-") && !/https?:\/\//i.test(commentText);
}

function cachePostToJson(postId, subreddit) {
  
  // Use path.resolve relative to this file's directory
  const cacheDir = path.resolve(__dirname, './cached_posts');
  
  if (!fs.existsSync(cacheDir)) {
    try {
      fs.mkdirSync(cacheDir, { recursive: true });
    } catch (dirError) {
      return Promise.resolve(false);
    }
  }
  
  return new Promise(async (resolve, reject) => {
    try {
      // Fetch post details
      const postUrl = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json`;
      const response = await fetch(postUrl);
      
      if (!response.ok) {
        return resolve(false);
      }
      
      const json = await response.json();
      const mainPost = json[0]?.data?.children[0]?.data;
      
      if (!mainPost) {
        return resolve(false);
      }
      
      // Extract comments
      const rawComments = json[1]?.data?.children || [];
      
      // Check if post should be blacklisted
      if (isPostBlacklisted({ author: mainPost.author })) {
        return resolve(false);
      }

      // Format for caching
      const cachedPost = {
        id: mainPost.id,
        subreddit: mainPost.subreddit,
        title: mainPost.title,
        author: mainPost.author,
        selftext: mainPost.selftext || "",
        imageUrl: extractImageUrl(mainPost),
        postType: "thread",
        comments: [],
        snippets: []
      };
      
      // Process comments - get up to 15 to find at least 5 with snippets
      const topComments = rawComments
        .filter(c => c.kind === "t1" && c.data && c.data.author !== "[deleted]")
        .slice(0, 15);
      
      let snippetCount = 0;
      
      // Process each comment
      for (const comment of topComments) {
        const c = comment.data;
        
        // Skip deleted comments
        if (!c.body || c.body === "[removed]" || c.body === "[deleted]") {
          continue;
        }
        
        // Check if comment might have a snippet
        const hasSnippet = isUsableSnippetComment(c.body || "");
        
        // Create comment object
        const commentObj = {
          id: c.id,
          author: c.author,
          body: removeLinks(c.body || ""),
          hasSnippet: false,
          replies: []
        };
        
        // If has snippet, search for song
        if (hasSnippet) {
          const query = c.body.substring(0, 40).trim();
          const song = await searchAppleMusic(query);
          
          if (song) {
            // Found a match in Apple Music
            snippetCount++;
            
            // Store snippet info
            cachedPost.snippets.push({
              commentId: c.id,
              query,
              songName: song.attributes.name,
              artistName: song.attributes.artistName,
              artworkUrl: song.attributes.artwork?.url.replace("{w}", "300").replace("{h}", "300") || null,
              previewUrl: song.attributes.previews?.[0]?.url || null
            });
            
            // Mark comment as having snippet
            commentObj.hasSnippet = true;
          }
        }
        
        // Process replies to this comment
        if (c.replies?.data?.children) {
          const childReplies = c.replies.data.children
            .filter(r => r.kind === "t1" && r.data && r.data.author !== "[deleted]")
            .slice(0, 8); // Store up to 8 replies
          
          commentObj.replies = childReplies.map(reply => ({
            id: reply.data.id,
            author: reply.data.author,
            body: removeLinks(reply.data.body || ""),
            hasSnippet: false
          }));
        }
        
        // Add to cached post
        cachedPost.comments.push(commentObj);
        
        // If we have 10 comments and at least 5 with snippets, we're done
        if (cachedPost.comments.length >= 10 && snippetCount >= 5) {
          break;
        }
      }
      
      // Write to file - using absolute path
      const filename = path.join(cacheDir, `${postId}.json`);
      fs.writeFileSync(filename, JSON.stringify(cachedPost, null, 2));
      
      resolve(true);
    } catch (error) {
      resolve(false);
    }
  });
}


async function getSnippetRecommendations(comments) {
  const snippetRecommendations = [];
  
  for (const comment of comments) {
    const body = comment.data?.body || "";
    if (isUsableSnippetComment(body)) {
      const query = body.substring(0, 40).trim();
      const song = await searchAppleMusic(query);
      if (song) {
        snippetRecommendations.push({
          commentId: comment.data.id,
          query,
          snippetData: song,
          author: comment.data.author,
          timestamp: comment.data.created_utc,
          artistName: song.attributes.artistName,
          artistImage: song.attributes.artwork?.url.replace("{w}", "100").replace("{h}", "100") || "/assets/default-artist.png",
        });
        if (snippetRecommendations.length === 5) {
          break;
        }
      }
    }
  }
  
  return snippetRecommendations;
}

// Add to server.js

// Function to cache a post and its comments to a JSON file
// Add this function to server.js
// Fixes for server.js caching function




// Add these endpoints to server.js

// Endpoint to trigger caching
// Replace the existing /api/posts/:postId/cache endpoint
threadsRouter.get("/posts/:postId/cache", async (req, res) => {
  // Return that the post is already cached even if it's not
  // This prevents the client from trying to cache new posts
  return res.json({ 
    success: true, 
    message: "Caching disabled", 
    cached: true 
  });
});

// =========================
// GET /api/posts  (updated)
// =========================
threadsRouter.get("/posts", postsLimiter, async (req, res) => {
  try {
    // Get all cached posts first
    const cacheDir = path.resolve(__dirname, './cached_posts');
    let cachedPostsData = [];
    
    if (fs.existsSync(cacheDir)) {
      try {
        const files = fs.readdirSync(cacheDir).filter(f => f.endsWith('.json'));
        // Found cached post files
        
        cachedPostsData = files.map(file => {
          try {
            const filePath = path.join(cacheDir, file);
            const fileContents = fs.readFileSync(filePath, 'utf8');
            const postData = JSON.parse(fileContents);
            return {
              id: postData.id,
              title: postData.title,
              author: postData.author,
              subreddit: postData.subreddit,
              selftext: postData.selftext || "",
              imageUrl: postData.imageUrl,
              postType: postData.postType || "thread",
              createdUtc: postData.createdUtc || Date.now()/1000,
              hasCachedData: true,
              num_comments: postData.comments?.length || 0
            };
          } catch (err) {
            return null;
          }
        }).filter(post => post !== null);
      } catch (err) {
        // Error accessing cached posts directory
      }
    }
    
    // If we have enough cached posts, use them exclusively
    if (cachedPostsData.length >= 5) {
      // Using cached posts
      
      // Force at least one groupchat post type even from non-groupchat data
      const hasGroupChat = cachedPostsData.some(post => post.postType === "groupchat");
      
      // Explicitly look for group chat files by name pattern
      const explicitGroupChats = cachedPostsData.filter(post => 
        post.id.startsWith('groupchat') || 
        (post.subreddit === "musicsuggestions" && post.num_comments >= 5)
      );
      
      if (explicitGroupChats.length > 0) {
        explicitGroupChats.forEach(post => {
          post.postType = "groupchat";
        });
        // Marked posts as group chats
      } else if (!hasGroupChat) {
        // Try to find at least one post that can be marked as a group chat (has comments)
        const potentialGroupChat = cachedPostsData.find(post => post.num_comments >= 5);
        if (potentialGroupChat) {
          // Marking post as group chat
          potentialGroupChat.postType = "groupchat";
        }
      }
      
      // Make sure we have some news threads
      const newsThreads = cachedPostsData.filter(post => post.postType === "news");
      if (newsThreads.length < 2) {
        // Mark some threads as news
        const regularThreads = cachedPostsData.filter(post => 
          post.postType !== "groupchat" && post.postType !== "news"
        );
        
        // Convert 2-3 regular threads to news
        const numToConvert = Math.min(3, regularThreads.length);
        for (let i = 0; i < numToConvert; i++) {
          if (regularThreads[i]) {
            // Marking post as news
            regularThreads[i].postType = "news";
          }
        }
      }
      
      // Sort posts to prioritize groupchats and news
      cachedPostsData.sort((a, b) => {
        // Group chats first
        if (a.postType === 'groupchat' && b.postType !== 'groupchat') return -1;
        if (a.postType !== 'groupchat' && b.postType === 'groupchat') return 1;
        
        // Then news
        if (a.postType === 'news' && b.postType !== 'news') return -1;
        if (a.postType !== 'news' && b.postType === 'news') return 1;
        
        // Then by timestamp (newest first)
        return b.createdUtc - a.createdUtc;
      });
      
      // Update the cache
      cachedPosts = cachedPostsData;
      lastFetchTime = Date.now();
      
      // Using cached posts with varied post types
      
      return res.json({ success: true, data: cachedPosts });
    }
    
    // If we don't have enough cached posts, follow regular process
    const now = Date.now();
    if (cachedPosts.length > 0 && (now - lastFetchTime < CACHE_TTL_MS)) {
      // Using posts from in-memory cache
      return res.json({ success: true, data: cachedPosts });
    }
    
    // Fetching from Reddit
    const newPosts = await fetchAllSubreddits();
    
    // Merge with any cached posts we found
    if (cachedPostsData.length > 0) {
      // Add the cached posts and deduplicate
      const allPosts = [...cachedPostsData, ...newPosts];
      cachedPosts = deduplicatePosts(allPosts);
    } else {
      cachedPosts = newPosts;
    }
    
    lastFetchTime = now;
    return res.json({ success: true, data: cachedPosts });
  } catch (err) {
    // Error fetching posts
    return res.status(500).json({ success: false, error: err.toString() });
  }
});

// Also update the cached-posts endpoint to use the correct path
threadsRouter.get("/cached-posts", (req, res) => {
  try {
    const cacheDir = path.resolve(__dirname, './cached_posts');
    // Looking for cached posts
    
    if (!fs.existsSync(cacheDir)) {
      // Cached posts directory does not exist
      return res.json({ success: true, data: [] });
    }
    
    const files = fs.readdirSync(cacheDir).filter(f => f.endsWith('.json'));
    // Found cached post files
    
    const cachedPostIds = files.map(f => f.replace('.json', ''));
    
    const cachedPostsData = cachedPostIds.map(id => {
      try {
        const filePath = path.join(cacheDir, `${id}.json`);
        // Reading cached file
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(fileContents);
        
        // Create full post object for both response and cachedPosts array
        const fullPost = {
          id: data.id,
          title: data.title,
          author: data.author,
          subreddit: data.subreddit,
          selftext: data.selftext || "",
          imageUrl: data.imageUrl,
          postType: data.postType || "thread",
          createdUtc: data.createdUtc || Date.now()/1000,
          num_comments: data.comments?.length || 0,
          // Add these fields for full compatibility
          ups: data.ups || 0,
          downs: data.downs || 0,
          url: data.url || "",
          is_self: data.is_self || true,
          comments: data.comments || [],
          snippets: data.snippets || []
        };
        
        return fullPost;
      } catch (err) {
        // Error reading cached post
        return { id, error: true };
      }
    }).filter(post => !post.error); // Remove error entries
    
    // CRITICAL FIX: Update the server's cachedPosts array so comment lookups work
    const validCachedPosts = cachedPostsData.filter(post => post.id);
    if (validCachedPosts.length > 0) {
      // Merge with existing cachedPosts, avoiding duplicates
      const existingIds = new Set(cachedPosts.map(p => p.id));
      const newPosts = validCachedPosts.filter(p => !existingIds.has(p.id));
      cachedPosts.push(...newPosts);
      // Updated server cachedPosts array with cached file data
    }
    
    // Return simplified data for frontend (backward compatibility)
    const responseData = cachedPostsData.map(post => ({
      id: post.id,
      title: post.title,
      author: post.author,
      subreddit: post.subreddit,
      commentCount: post.num_comments,
      snippetCount: post.snippets?.length || 0,
      imageUrl: post.imageUrl,
      postType: post.postType,
      createdUtc: post.createdUtc
    }));
    
    // Successfully loaded cached posts
    return res.json({ success: true, data: responseData });
  } catch (error) {
    // Error getting cached posts
    return res.status(500).json({ success: false, error: error.toString() });
  }
});

// Also update the get specific cached post endpoint
threadsRouter.get("/cached-posts/:postId", (req, res) => {
  const { postId } = req.params;
  const filePath = path.resolve(__dirname, './cached_posts', `${postId}.json`);
  
  try {
    if (fs.existsSync(filePath)) {
      const cachedPost = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return res.json({ success: true, data: cachedPost });
    } else {
      return res.status(404).json({ success: false, message: "Cached post not found" });
    }
  } catch (error) {
    // Error reading cached post
    return res.status(500).json({ success: false, error: error.toString() });
  }
});

// =========================
// ENHANCED /api/refresh
// Force a complete refresh with different posts
// =========================

threadsRouter.get("/refresh", async (req, res) => {
  try {
    // Clear cache and force refresh
    forceRefreshCachedPosts();
    
    // Fetch completely fresh data
    // Forcing total refresh with maximum diversity
    const newPosts = await fetchAllSubreddits();
    
    // Apply additional randomization for more diversity
    const shuffledPosts = [...newPosts];
    for (let i = 0; i < 3; i++) {
      shuffleArray(shuffledPosts); // Triple shuffle for maximum randomness
    }
    
    // Update the cache
    cachedPosts = shuffledPosts;
    lastFetchTime = Date.now();
    
    return res.json({ 
      success: true, 
      data: cachedPosts,
      message: "Successfully refreshed with new diverse posts"
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.toString() });
  }
});

// Add a new endpoint for specifically requesting diverse posts
threadsRouter.get("/diverse-posts", async (req, res) => {
  try {
    // CRITICAL FIX: Fetch ONLY fresh Reddit posts to avoid duplicates with existing feed
    // Don't include cached posts since they're already in the main feed
    
    // Fetch completely fresh posts from Reddit with increased variety
    const freshPosts = await fetchAllSubreddits();
    
    // Apply aggressive randomization and filtering to ensure variety
    const shuffledFreshPosts = [...freshPosts];
    for (let i = 0; i < 5; i++) {
      shuffleArray(shuffledFreshPosts); // Multiple shuffles for maximum randomness
    }
    
    // Apply diversity ranking algorithm to fresh posts only
    const rankedFreshPosts = shuffledFreshPosts.map(post => {
      // Calculate diversity score (subreddit variety + engagement quality)
      const subredditFactor = post.subreddit === "music" ? 1.0 :
                              post.subreddit === "musicsuggestions" ? 1.2 : 
                              post.subreddit === "listentothis" ? 1.3 :
                              post.subreddit === "ifyoulikeblank" ? 1.1 : 1.0;
      
      // Favor posts with moderate engagement to avoid mainstream domination
      const engagementDiversity = Math.min(200, post.ups) / 200 + 
                                Math.min(30, post.num_comments) / 30;
                                
      // Add extra randomness to ensure different posts each time
      const randomFactor = 0.5 + Math.random() * 1.0;
                                
      return {
        ...post,
        diversityScore: subredditFactor * engagementDiversity * randomFactor,
        isFresh: true // Mark as fresh to distinguish from cached
      };
    });
    
    // Sort by diversity score
    rankedFreshPosts.sort((a, b) => b.diversityScore - a.diversityScore);
    
    // Take top 25-30 fresh posts for variety
    const selectedPosts = rankedFreshPosts.slice(0, 28);
    
    // Ensure we have some group chats from musicsuggestions
    const musicSuggestionsPosts = selectedPosts.filter(post => 
      post.subreddit === "musicsuggestions" && post.num_comments >= 5
    );
    
    if (musicSuggestionsPosts.length > 0) {
      // Mark top 3-4 as group chats
      const numGroupChats = Math.min(4, musicSuggestionsPosts.length);
      for (let i = 0; i < numGroupChats; i++) {
        musicSuggestionsPosts[i].postType = "groupchat";
        musicSuggestionsPosts[i].diversityScore += 0.3; // Boost priority
      }
    }
    
    // Mark some music posts as news
    const musicPosts = selectedPosts.filter(post => post.subreddit === "music");
    if (musicPosts.length > 0) {
      const numNews = Math.min(3, musicPosts.length);
      for (let i = 0; i < numNews; i++) {
        musicPosts[i].postType = "news";
      }
    }
    
    // Final sort to put group chats and news first
    selectedPosts.sort((a, b) => {
      if (a.postType === 'groupchat' && b.postType !== 'groupchat') return -1;
      if (a.postType !== 'groupchat' && b.postType === 'groupchat') return 1;
      if (a.postType === 'news' && b.postType !== 'news') return -1;
      if (a.postType !== 'news' && b.postType === 'news') return 1;
      return b.diversityScore - a.diversityScore;
    });
    
    // DO NOT update cachedPosts array - let main endpoints handle caching
    // This ensures diverse-posts always returns fresh content
    
    // Log what we're returning
    const typeCounts = selectedPosts.reduce((acc, post) => {
      acc[post.postType] = (acc[post.postType] || 0) + 1;
      return acc;
    }, {});
    
    
    return res.json({ 
      success: true, 
      data: selectedPosts,
      message: `Fetched ${selectedPosts.length} fresh diverse posts from Reddit`
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.toString() });
  }
});

// Add new endpoint to check cache status
threadsRouter.get("/cache-status", (req, res) => {
  const now = Date.now();
  const cacheAge = now - lastFetchTime;
  const cacheExpired = cacheAge > CACHE_TTL_MS;
  
  return res.json({
    success: true,
    data: {
      cacheAge: Math.floor(cacheAge / 1000), // in seconds
      ttl: Math.floor(CACHE_TTL_MS / 1000),  // in seconds
      isExpired: cacheExpired,
      postCount: cachedPosts.length
    }
  });
});

// New endpoint for browsing groupchats and news posts only
threadsRouter.get("/browse-posts", async (req, res) => {
  try {
    // Fetching posts for browsing
    
    // Fetch fresh data from Reddit
    const musicPosts = await fetchSubreddit("music");  // These become news posts
    const musicSuggestionsPosts = await fetchSubreddit("musicsuggestions");  // Popular ones become groupchats
    
    // Filter and process posts - force mark music posts as news
    let newsPosts = musicPosts
      .map(post => ({
        ...post,
        postType: "news" // Force mark all music subreddit posts as news
      }))
      .slice(0, 8); // Get 8 news posts
    
    let groupchatPosts = musicSuggestionsPosts
      .filter(post => post.num_comments >= 8) // Posts with good engagement
      .map(post => ({
        ...post,
        postType: "groupchat" // Force mark as groupchat
      }))
      .slice(0, 8); // Get 8 potential groupchats
    
    // Combine and shuffle
    const browsePosts = [...newsPosts, ...groupchatPosts];
    shuffleArray(browsePosts);
    
    // Returning browse posts
    
    return res.json({ 
      success: true, 
      data: browsePosts,
      breakdown: {
        news: newsPosts.length,
        groupchats: groupchatPosts.length
      }
    });
  } catch (err) {
    // Error fetching browse posts
    return res.status(500).json({ success: false, error: err.toString() });
  }
});

// New endpoint to cache a selected post
threadsRouter.post("/cache-post", async (req, res) => {
  try {
    const { postId, subreddit, postType } = req.body;
    
    if (!postId || !subreddit) {
      return res.status(400).json({ success: false, error: "Missing postId or subreddit" });
    }
    
    // Caching post
    
    // Use the existing caching function but modify the postType
    const success = await cachePostToJson(postId, subreddit);
    
    if (success) {
      // Read the cached file and update the postType
      const cacheDir = path.resolve(__dirname, './cached_posts');
      const filename = path.join(cacheDir, `${postId}.json`);
      
      try {
        const cachedData = JSON.parse(fs.readFileSync(filename, 'utf8'));
        cachedData.postType = postType || cachedData.postType;
        fs.writeFileSync(filename, JSON.stringify(cachedData, null, 2));
        
        // Post cached successfully
        return res.json({ 
          success: true, 
          message: `Post ${postId} cached successfully as ${postType}`,
          postId 
        });
      } catch (updateError) {
        // Error updating cached post type
        return res.json({ 
          success: true, 
          message: `Post ${postId} cached but could not update post type` 
        });
      }
    } else {
      return res.status(500).json({ 
        success: false, 
        error: `Failed to cache post ${postId}` 
      });
    }
  } catch (err) {
    // Error caching post
    return res.status(500).json({ success: false, error: err.toString() });
  }
});

// Call this function on server start to ensure first request gets fresh data
forceRefreshCachedPosts();

threadsRouter.get("/posts/:postId/comments", async (req, res) => {
  const { postId } = req.params;
  const post = cachedPosts.find((p) => p.id === postId);
  if (!post) {
    return res.status(404).json({ success: false, message: "Post not found" });
  }

  // Check if we have a fresh cache entry
  const cacheEntry = commentsCache[postId];
  const now = Date.now();
  if (
    cacheEntry &&
    (now - cacheEntry.timestamp < COMMENT_CACHE_TTL_MS)
  ) {
    // Returning cached comments
    return res.json({ success: true, data: cacheEntry.data });
  }

  // Not cached or stale. Let's fetch from Reddit
  const isGroupchat = post.postType === "groupchat";
  const commentLimit = isGroupchat ? 50 : 18;
  const commentsUrl = `https://www.reddit.com/r/${post.subreddit}/comments/${post.id}.json?limit=${commentLimit}`;

  try {
    const fetchResp = await fetch(commentsUrl);
    if (!fetchResp.ok) {
      // Reddit API fetch failed for comments
      // If needed, store an empty result in the cache to avoid repeated attempts
      commentsCache[postId] = { data: [], timestamp: now };
      // Return an empty array or handle gracefully
      return res.json({ success: true, data: [] });
    }

    const json = await fetchResp.json();
    const rawComments = 
      Array.isArray(json) &&
      json.length > 1 &&
      json[1].data &&
      Array.isArray(json[1].data.children)
        ? json[1].data.children
        : [];

    let finalData;
    if (isGroupchat) {
      // Flatten logic, same as your code
      const flattened = flattenRedditComments(rawComments, 2);
      let topLevel = flattened.filter(c => !c.parentId).slice(0, 15);
      let replies = flattened.filter(c => c.parentId);
      finalData = { topLevel, replies };
    } else {
      // Clean links, same as your code
      const cleanedComments = rawComments.map(item => {
        if (!item?.data?.body) return item;
        return {
          ...item,
          data: {
            ...item.data,
            body: removeLinks(item.data.body),
          }
        };
      });
      finalData = cleanedComments;
    }

    // Store in cache
    commentsCache[postId] = {
      data: finalData,
      timestamp: now,
    };

    return res.json({ success: true, data: finalData });

  } catch (err) {
    // Error fetching comments
    return res.status(500).json({ success: false, error: err.toString() });
  }
});

threadsRouter.get("/posts/:postId/snippets", async (req, res) => {
  const { postId } = req.params;
  const post = cachedPosts.find((p) => p.id === postId);
  if (!post) {
    return res.status(404).json({ success: false, message: "Post not found" });
  }
  const commentsUrl = `https://www.reddit.com/r/${post.subreddit}/comments/${post.id}.json?limit=50`;
  try {
    const fetchResp = await fetch(commentsUrl);
    if (!fetchResp.ok) {
      // Reddit API fetch failed
      return res.json({ success: true, data: [] });
    }
    let json;
    try {
      json = await fetchResp.json();
    } catch (e) {
      // Error parsing JSON for snippets
      json = null;
    }
    const comments =
      json && Array.isArray(json) && json.length > 1 && json[1].data && Array.isArray(json[1].data.children)
        ? json[1].data.children
        : [];
    const snippetRecommendations = await getSnippetRecommendations(comments);
    return res.json({ success: true, data: snippetRecommendations });
  } catch (err) {
    // Error fetching snippet recommendations
    return res.status(500).json({ success: false, error: err.toString() });
  }
});

threadsRouter.get("/apple-music-search", async (req, res) => {
  const query = req.query.query;
  if (!query) {
    return res.status(400).json({ success: false, error: "Missing query parameter" });
  }
  
  try {
    const result = await searchAppleMusic(query);
    if (result) {
      return res.json({ success: true, data: result });
    } else {
      return res.json({ success: false, message: "No results found." });
    }
  } catch (error) {
    // Error searching Apple Music
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// New endpoint to cache media assets (artwork and audio previews)
threadsRouter.post("/cache-media", async (req, res) => {
  try {
    const { artworkUrl, previewUrl, songId } = req.body;
    
    if (!songId) {
      return res.status(400).json({ success: false, error: "Missing songId" });
    }
    
    const cacheDir = path.resolve(__dirname, './cached_media');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    
    const results = {
      artworkPath: artworkUrl,
      previewPath: previewUrl
    };
    
    // Cache artwork if provided
    if (artworkUrl) {
      try {
        const artworkResponse = await fetch(artworkUrl);
        if (artworkResponse.ok) {
          const buffer = await artworkResponse.arrayBuffer();
          const ext = artworkUrl.includes('.jpg') ? '.jpg' : '.png';
          const artworkPath = path.join(cacheDir, `${songId}_artwork${ext}`);
          fs.writeFileSync(artworkPath, Buffer.from(buffer));
          results.artworkPath = `/cached_media/${songId}_artwork${ext}`;
          // Artwork cached
        }
      } catch (artworkError) {
        // Error caching artwork
      }
    }
    
    // Cache preview if provided
    if (previewUrl) {
      try {
        const previewResponse = await fetch(previewUrl);
        if (previewResponse.ok) {
          const buffer = await previewResponse.arrayBuffer();
          const previewPath = path.join(cacheDir, `${songId}_preview.m4a`);
          fs.writeFileSync(previewPath, Buffer.from(buffer));
          results.previewPath = `/cached_media/${songId}_preview.m4a`;
          // Preview cached
        }
      } catch (previewError) {
        // Error caching preview
      }
    }
    
    return res.json({
      success: true,
      ...results
    });
  } catch (error) {
    // Error caching media
    return res.status(500).json({ success: false, error: error.toString() });
  }
});

threadsRouter.get('/api/spotify-token', async (req, res) => {
  // Processing Spotify token request

  // Environment variables checked

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    // Missing Spotify credentials
    return res.status(500).json({ success: false, error: "Spotify credentials not set" });
  }

  const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  try {
    // Requesting Spotify token
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authString}`,
      },
      body: 'grant_type=client_credentials'
    });

    // Spotify token response received

    if (!tokenRes.ok) {
      // Failed to get token from Spotify
      return res.status(tokenRes.status).json({ success: false, error: "Failed to get token" });
    }

    const data = await tokenRes.json();
    // Spotify token retrieved

    res.json({ success: true, token: data.access_token });
  } catch (error) {
    res.status(500).json({ success: false, error: error.toString() });
  }
});


// Export route registration function
export default function registerThreadsRoutes(app) {
  app.use('/api/threads', threadsRouter);
  // Serve cached media files
  app.use('/cached_media', express.static(path.resolve(__dirname, './cached_media')));
};


// Check caching directory on startup
try {
  const cacheDirPath = path.resolve(__dirname, './cached_posts');
  if (!fs.existsSync(cacheDirPath)) {
    fs.mkdirSync(cacheDirPath, { recursive: true });
    // Created cached_posts directory
  } else {
    // Cached_posts directory exists
    
    // Log the actual files in the directory
    const files = fs.readdirSync(cacheDirPath).filter(f => f.endsWith('.json'));
    // Found cached post files on startup
  }
} catch (err) {
  // Critical error with cached_posts directory
}