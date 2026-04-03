const fs = require("fs");
const path = require("path");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "..", "..", "..", ".env") });

const ROOT_DIR = path.resolve(__dirname, "..", "..", "..");
const CACHE_DIR = path.resolve(ROOT_DIR, "apps", "threads", "src", "cached_posts");
const SHARED_MEDIA_DIR = path.resolve(ROOT_DIR, "backend", "cached_media");

const USER_AGENT = "MuflThreadsCacheBuilder/1.0 (+https://mufl.app)";
const REDDIT_BASE_URL = "https://www.reddit.com";
const APPLE_API_BASE_URL =
  process.env.APPLE_API_BASE_URL || "https://api.music.apple.com/v1/catalog/us";
const APPLE_DEVELOPER_TOKEN = process.env.APPLE_DEVELOPER_TOKEN || "";
const REDDIT_ONLY_MODE = process.argv.includes("--reddit-only");
const ENRICH_REDDIT_ONLY_MODE = process.argv.includes("--enrich-reddit-only");

const TARGET_COUNTS = {
  thread: 14,
  groupchat: 7,
  news: 9,
};

const LISTING_CONFIGS = [
  { sort: "top", t: "year", limit: 100 },
  { sort: "top", t: "month", limit: 100 },
  { sort: "hot", limit: 50 },
];

const SUBREDDIT_RULES = {
  news: {
    subreddits: ["music"],
    minComments: 30,
    requireImage: false,
  },
  thread: {
    subreddits: ["musicsuggestions", "musicrecommendations"],
    minComments: 30,
    requireImage: false,
  },
  groupchat: {
    subreddits: ["musicsuggestions", "musicrecommendations"],
    minComments: 30,
    requireImage: true,
  },
};

const REDDIT_REQUEST_DELAY_MS = 1400;
const APPLE_REQUEST_DELAY_MS = 900;
const MEDIA_REQUEST_DELAY_MS = 250;
const MIN_COMMENT_BODY_LENGTH = 8;
const TARGET_SNIPPETS_PER_THREAD = 5;
const TARGET_REGULAR_COMMENTS = 10;
const MAX_TOP_LEVEL_COMMENTS_TO_SCAN = 80;
const MAX_REPLIES_PER_COMMENT = 5;

const CONTENT_TYPE_EXTENSIONS = {
  "audio/mp4": ".m4a",
  "audio/mpeg": ".mp3",
  "audio/x-m4a": ".m4a",
  "image/gif": ".gif",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const appleQueryCache = new Map();
const redditListingCache = new Map();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function decodeEntities(text = "") {
  return String(text || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function removeLinks(text = "") {
  return decodeEntities(String(text || ""))
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/gi, "$1")
    .replace(/https?:\/\/\S+/gi, "")
    .trim();
}

function inferCachedFileExtension(sourceUrl, contentType, fallbackExtension) {
  try {
    const parsedUrl = new URL(sourceUrl);
    const urlExtension = path.extname(parsedUrl.pathname).toLowerCase();
    if (urlExtension) return urlExtension;
  } catch (error) {
    // Fall back to content-type.
  }

  const normalizedContentType = String(contentType || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  return CONTENT_TYPE_EXTENSIONS[normalizedContentType] || fallbackExtension;
}

function sanitizeFileSegment(value, fallback = "media") {
  const cleaned = String(value || "")
    .trim()
    .replace(/[^a-z0-9_-]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
  return cleaned || fallback;
}

function buildAppleArtworkUrl(template, size = 300) {
  if (!template || typeof template !== "string") return null;
  return template
    .replace(/\{w\}x\{h\}/g, `${size}x${size}`)
    .replace(/\{w\}/g, String(size))
    .replace(/\{h\}/g, String(size))
    .replace(/\{f\}/g, "jpg");
}

function extractImageUrl(post) {
  if (!post) return null;

  const directUrl = post.url_overridden_by_dest || post.url || "";
  if (post.post_hint === "image" && directUrl) {
    return decodeEntities(directUrl);
  }

  if (post.preview?.images?.[0]?.source?.url) {
    return decodeEntities(post.preview.images[0].source.url);
  }

  if (post.is_gallery && Array.isArray(post.gallery_data?.items) && post.media_metadata) {
    for (const item of post.gallery_data.items) {
      const media = post.media_metadata[item.media_id];
      const url = media?.s?.u;
      if (url) return decodeEntities(url);
    }
  }

  if (post.thumbnail && /^https?:\/\//i.test(post.thumbnail)) {
    return decodeEntities(post.thumbnail);
  }

  if (/\.(jpe?g|png|gif|webp)$/i.test(directUrl)) {
    return decodeEntities(directUrl);
  }

  return null;
}

function normalizeSongQuery(text = "") {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function extractSongQuery(commentBody = "") {
  const body = removeLinks(commentBody);
  if (!body) return null;

  const dashMatch = body.match(/([^\n]{2,50}?)\s*[-–—]\s*([^\n]{2,60})/);
  if (dashMatch) {
    return normalizeSongQuery(`${dashMatch[1]} - ${dashMatch[2]}`);
  }

  const byMatch = body.match(/([^\n]{2,60}?)\s+by\s+([^\n]{2,50})/i);
  if (byMatch) {
    return normalizeSongQuery(`${byMatch[1]} - ${byMatch[2]}`);
  }

  return null;
}

function isPotentialSnippetComment(commentBody = "") {
  const body = removeLinks(commentBody);
  if (body.length < MIN_COMMENT_BODY_LENGTH) return false;
  if (/^\s*(same|this|agreed|yes|no|lol|lmao|thanks)\b/i.test(body)) return false;
  if (/https?:\/\//i.test(body)) return false;
  return Boolean(extractSongQuery(body));
}

function flattenTopLevelComment(rawComment) {
  const data = rawComment?.data || {};
  const replies = Array.isArray(data?.replies?.data?.children)
    ? data.replies.data.children
        .filter((reply) => reply?.kind === "t1" && reply?.data?.body && reply.data.author !== "[deleted]")
        .slice(0, MAX_REPLIES_PER_COMMENT)
        .map((reply) => ({
          id: reply.data.id,
          author: reply.data.author,
          body: removeLinks(reply.data.body || ""),
          hasSnippet: false,
        }))
    : [];

  return {
    id: data.id,
    author: data.author,
    body: removeLinks(data.body || ""),
    hasSnippet: false,
    replies,
    createdUtc: data.created_utc || 0,
    ups: data.ups || 0,
  };
}

function loadExistingCacheIds() {
  if (!fs.existsSync(CACHE_DIR)) return new Set();
  return new Set(
    fs.readdirSync(CACHE_DIR)
      .filter((fileName) => fileName.endsWith(".json"))
      .map((fileName) => fileName.replace(/\.json$/i, ""))
  );
}

function loadCacheEntries() {
  if (!fs.existsSync(CACHE_DIR)) return [];
  return fs.readdirSync(CACHE_DIR)
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) => {
      const filePath = path.join(CACHE_DIR, fileName);
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
      return {
        filePath,
        fileName,
        data,
      };
    });
}

async function fetchRedditListing(subreddit, listing) {
  const cacheKey = JSON.stringify({ subreddit, ...listing });
  if (redditListingCache.has(cacheKey)) {
    return redditListingCache.get(cacheKey);
  }

  const params = new URLSearchParams();
  params.set("limit", String(listing.limit || 50));
  if (listing.t) params.set("t", listing.t);

  const url = `${REDDIT_BASE_URL}/r/${subreddit}/${listing.sort}.json?${params.toString()}`;
  

  const { data } = await axios.get(url, {
    timeout: 15000,
    headers: { "User-Agent": USER_AGENT },
  });

  await sleep(REDDIT_REQUEST_DELAY_MS);

  const posts = (data?.data?.children || []).map(({ data: post }) => ({
    id: post.id,
    subreddit: String(post.subreddit || subreddit).toLowerCase(),
    title: post.title || "",
    author: post.author || "unknown",
    selftext: post.selftext || "",
    createdUtc: post.created_utc || 0,
    ups: post.ups || 0,
    downs: post.downs || 0,
    num_comments: post.num_comments || 0,
    url: post.url_overridden_by_dest || post.url || "",
    permalink: post.permalink || "",
    is_self: Boolean(post.is_self),
    over_18: Boolean(post.over_18),
    imageUrl: extractImageUrl(post),
    raw: post,
  }));

  redditListingCache.set(cacheKey, posts);
  return posts;
}

async function fetchCommentsForPost(subreddit, postId) {
  const url = `${REDDIT_BASE_URL}/r/${subreddit}/comments/${postId}.json?limit=100`;
  

  const { data } = await axios.get(url, {
    timeout: 15000,
    headers: { "User-Agent": USER_AGENT },
  });

  await sleep(REDDIT_REQUEST_DELAY_MS);
  return data;
}

async function searchAppleMusic(query) {
  const normalizedQuery = normalizeSongQuery(query);
  if (!normalizedQuery) return [];
  if (appleQueryCache.has(normalizedQuery)) {
    return appleQueryCache.get(normalizedQuery);
  }

  if (!APPLE_DEVELOPER_TOKEN) {
    throw new Error("APPLE_DEVELOPER_TOKEN is missing in .env");
  }

  const url = `${APPLE_API_BASE_URL}/search`;
  

  const response = await axios.get(url, {
    timeout: 15000,
    headers: {
      Authorization: `Bearer ${APPLE_DEVELOPER_TOKEN}`,
      Accept: "application/json",
    },
    params: {
      term: normalizedQuery,
      limit: 8,
      types: "songs",
    },
  });

  await sleep(APPLE_REQUEST_DELAY_MS);

  const songs = Array.isArray(response.data?.results?.songs?.data)
    ? response.data.results.songs.data
    : [];

  appleQueryCache.set(normalizedQuery, songs);
  return songs;
}

async function cacheRemoteAsset(sourceUrl, fileBase, fallbackExtension) {
  if (!sourceUrl) return null;

  ensureDir(SHARED_MEDIA_DIR);

  const response = await axios.get(sourceUrl, {
    responseType: "arraybuffer",
    timeout: 20000,
  });

  await sleep(MEDIA_REQUEST_DELAY_MS);

  const extension = inferCachedFileExtension(
    sourceUrl,
    response.headers["content-type"],
    fallbackExtension
  );
  const fileName = `${fileBase}${extension}`;
  const filePath = path.join(SHARED_MEDIA_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, Buffer.from(response.data));
  }

  return `/cached_media/${fileName}`;
}

async function cacheMediaForSong(song) {
  const songId = sanitizeFileSegment(song?.id || "song", "song");
  const artworkUrl = buildAppleArtworkUrl(song?.attributes?.artwork?.url, 300);
  const previewUrl = song?.attributes?.previews?.[0]?.url || null;

  let cachedArtworkUrl = artworkUrl;
  let cachedPreviewUrl = previewUrl;

  try {
    if (artworkUrl) {
      cachedArtworkUrl = await cacheRemoteAsset(artworkUrl, `${songId}_artwork`, ".jpg");
    }
  } catch (error) {
    
  }

  try {
    if (previewUrl) {
      cachedPreviewUrl = await cacheRemoteAsset(previewUrl, `${songId}_preview`, ".m4a");
    }
  } catch (error) {
    
  }

  return {
    artworkUrl: cachedArtworkUrl || artworkUrl || null,
    previewUrl: cachedPreviewUrl || previewUrl || null,
  };
}

function chooseBestSongMatch(songs, query) {
  if (!Array.isArray(songs) || songs.length === 0) return null;
  const normalizedQuery = normalizeSongQuery(query).toLowerCase();

  const scored = songs.map((song) => {
    const name = String(song?.attributes?.name || "").toLowerCase();
    const artist = String(song?.attributes?.artistName || "").toLowerCase();
    let score = 0;

    if (normalizedQuery.includes(name)) score += 4;
    if (normalizedQuery.includes(artist)) score += 4;

    normalizedQuery.split(/\s+/).forEach((token) => {
      if (token && name.includes(token)) score += 1;
      if (token && artist.includes(token)) score += 1;
    });

    if (song?.attributes?.previews?.[0]?.url) score += 2;
    return { song, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.song || songs[0] || null;
}

async function buildThreadOrGroupchatCache(candidate, postType) {
  const commentsJson = await fetchCommentsForPost(candidate.subreddit, candidate.id);
  const rawComments = Array.isArray(commentsJson?.[1]?.data?.children)
    ? commentsJson[1].data.children
    : [];

  const topLevelComments = rawComments
    .filter((comment) => comment?.kind === "t1" && comment?.data?.body && comment.data.author !== "[deleted]")
    .slice(0, MAX_TOP_LEVEL_COMMENTS_TO_SCAN);

  const structuredComments = topLevelComments
    .map(flattenTopLevelComment)
    .filter((comment) => comment.body && comment.body.length >= MIN_COMMENT_BODY_LENGTH);

  const snippetMatches = [];
  const snippetCandidates = [];
  const usedCommentIds = new Set();

  for (const comment of structuredComments) {
    const currentSnippetCount = REDDIT_ONLY_MODE
      ? snippetCandidates.length
      : snippetMatches.length;
    if (currentSnippetCount >= TARGET_SNIPPETS_PER_THREAD) break;
    if (!isPotentialSnippetComment(comment.body)) continue;

    const query = extractSongQuery(comment.body);
    if (!query) continue;

    if (REDDIT_ONLY_MODE) {
      snippetCandidates.push({
        commentId: comment.id,
        query,
      });
      usedCommentIds.add(comment.id);
      if (snippetCandidates.length >= TARGET_SNIPPETS_PER_THREAD) {
        break;
      }
      continue;
    }

    try {
      const songs = await searchAppleMusic(query);
      const bestSong = chooseBestSongMatch(songs, query);
      if (!bestSong) continue;

      const cachedMedia = await cacheMediaForSong(bestSong);

      snippetMatches.push({
        commentId: comment.id,
        query,
        songName: bestSong.attributes?.name || "Unknown Song",
        artistName: bestSong.attributes?.artistName || "Unknown Artist",
        albumName: bestSong.attributes?.albumName || "",
        artworkUrl: cachedMedia.artworkUrl,
        previewUrl: cachedMedia.previewUrl,
      });

      usedCommentIds.add(comment.id);
    } catch (error) {
      
    }
  }

  const resolvedSnippetCount = REDDIT_ONLY_MODE
    ? snippetCandidates.length
    : snippetMatches.length;

  if (resolvedSnippetCount < TARGET_SNIPPETS_PER_THREAD) {
    return null;
  }

  const regularComments = structuredComments.filter((comment) => !usedCommentIds.has(comment.id));
  if (regularComments.length < TARGET_REGULAR_COMMENTS) {
    return null;
  }

  const selectedSnippetComments = structuredComments.filter((comment) => usedCommentIds.has(comment.id));
  const selectedRegularComments = regularComments.slice(0, TARGET_REGULAR_COMMENTS);
  const commentOrder = new Map(
    structuredComments.map((comment, index) => [comment.id, index])
  );

  const selectedComments = [...selectedSnippetComments, ...selectedRegularComments]
    .sort((a, b) => (commentOrder.get(a.id) || 0) - (commentOrder.get(b.id) || 0))
    .map((comment) => ({
      ...comment,
      hasSnippet: usedCommentIds.has(comment.id),
    }));

  return {
    id: candidate.id,
    subreddit: candidate.subreddit,
    title: candidate.title,
    author: candidate.author,
    selftext: candidate.selftext || "",
    imageUrl: candidate.imageUrl || null,
    postType,
    cacheStatus: REDDIT_ONLY_MODE ? "reddit_only" : "ready",
    createdUtc: candidate.createdUtc,
    ups: candidate.ups,
    num_comments: candidate.num_comments,
    comments: selectedComments,
    snippets: REDDIT_ONLY_MODE ? [] : snippetMatches,
    snippetCandidates,
  };
}

async function enrichCacheEntry(cacheEntry) {
  const nextEntry = { ...cacheEntry };
  const snippetCandidates = Array.isArray(nextEntry.snippetCandidates)
    ? nextEntry.snippetCandidates
    : [];

  if (snippetCandidates.length === 0) {
    return { updated: false, cacheEntry };
  }

  const resolvedSnippets = [];
  for (const candidate of snippetCandidates) {
    if (resolvedSnippets.length >= TARGET_SNIPPETS_PER_THREAD) break;
    if (!candidate?.query || !candidate?.commentId) continue;

    try {
      const songs = await searchAppleMusic(candidate.query);
      const bestSong = chooseBestSongMatch(songs, candidate.query);
      if (!bestSong) continue;

      const cachedMedia = await cacheMediaForSong(bestSong);
      resolvedSnippets.push({
        commentId: candidate.commentId,
        query: candidate.query,
        songName: bestSong.attributes?.name || "Unknown Song",
        artistName: bestSong.attributes?.artistName || "Unknown Artist",
        albumName: bestSong.attributes?.albumName || "",
        artworkUrl: cachedMedia.artworkUrl,
        previewUrl: cachedMedia.previewUrl,
      });
    } catch (error) {
      
    }
  }

  if (resolvedSnippets.length < TARGET_SNIPPETS_PER_THREAD) {
    return { updated: false, cacheEntry };
  }

  nextEntry.snippets = resolvedSnippets;
  nextEntry.cacheStatus = "ready";
  nextEntry.enrichedAt = new Date().toISOString();
  return { updated: true, cacheEntry: nextEntry };
}

async function buildNewsCache(candidate) {
  const commentsJson = await fetchCommentsForPost(candidate.subreddit, candidate.id);
  const rawComments = Array.isArray(commentsJson?.[1]?.data?.children)
    ? commentsJson[1].data.children
    : [];

  const comments = rawComments
    .filter((comment) => comment?.kind === "t1" && comment?.data?.body && comment.data.author !== "[deleted]")
    .slice(0, 15)
    .map(flattenTopLevelComment)
    .filter((comment) => comment.body && comment.body.length >= MIN_COMMENT_BODY_LENGTH)
    .map((comment) => ({ ...comment, hasSnippet: false }));

  if (comments.length < 10) {
    return null;
  }

  return {
    id: candidate.id,
    subreddit: candidate.subreddit,
    title: candidate.title,
    author: candidate.author,
    selftext: candidate.selftext || "",
    imageUrl: candidate.imageUrl || null,
    postType: "news",
    cacheStatus: REDDIT_ONLY_MODE ? "reddit_only" : "ready",
    createdUtc: candidate.createdUtc,
    ups: candidate.ups,
    num_comments: candidate.num_comments,
    comments,
    snippets: [],
  };
}

async function gatherCandidates(postType, existingIds) {
  const rule = SUBREDDIT_RULES[postType];
  const deduped = new Map();

  for (const subreddit of rule.subreddits) {
    for (const listing of LISTING_CONFIGS) {
      try {
        const posts = await fetchRedditListing(subreddit, listing);
        for (const post of posts) {
          if (existingIds.has(post.id)) continue;
          if ((post.num_comments || 0) < rule.minComments) continue;
          if (rule.requireImage && !post.imageUrl) continue;
          if (post.over_18) continue;

          if (!deduped.has(post.id)) {
            deduped.set(post.id, post);
          }
        }
      } catch (error) {
        
      }
    }
  }

  return [...deduped.values()].sort((a, b) => {
    if ((b.num_comments || 0) !== (a.num_comments || 0)) {
      return (b.num_comments || 0) - (a.num_comments || 0);
    }
    return (b.createdUtc || 0) - (a.createdUtc || 0);
  });
}

function writeCacheFile(cacheEntry) {
  ensureDir(CACHE_DIR);
  const filePath = path.join(CACHE_DIR, `${cacheEntry.id}.json`);
  fs.writeFileSync(filePath, `${JSON.stringify(cacheEntry, null, 2)}\n`, "utf8");
}

async function fillPostType(postType, existingIds) {
  const targetCount = TARGET_COUNTS[postType];
  const candidates = await gatherCandidates(postType, existingIds);
  

  const accepted = [];

  for (const candidate of candidates) {
    if (accepted.length >= targetCount) break;

    

    try {
      const cacheEntry =
        postType === "news"
          ? await buildNewsCache(candidate)
          : await buildThreadOrGroupchatCache(candidate, postType);

      if (!cacheEntry) {
        
        continue;
      }

      writeCacheFile(cacheEntry);
      existingIds.add(cacheEntry.id);
      accepted.push({
        id: cacheEntry.id,
        subreddit: cacheEntry.subreddit,
        title: cacheEntry.title,
        postType: cacheEntry.postType,
        comments: cacheEntry.comments.length,
        snippets: cacheEntry.snippets.length,
        snippetCandidates: Array.isArray(cacheEntry.snippetCandidates)
          ? cacheEntry.snippetCandidates.length
          : 0,
        image: Boolean(cacheEntry.imageUrl),
      });

      
    } catch (error) {
      
    }
  }

  return accepted;
}

async function main() {
  ensureDir(CACHE_DIR);
  ensureDir(SHARED_MEDIA_DIR);

  if (ENRICH_REDDIT_ONLY_MODE) {
    
    const cacheEntries = loadCacheEntries()
      .filter(({ data }) =>
        data &&
        data.cacheStatus === "reddit_only" &&
        Array.isArray(data.snippetCandidates) &&
        data.snippetCandidates.length > 0
      );

    let updatedCount = 0;
    for (const entry of cacheEntries) {
      
      const result = await enrichCacheEntry(entry.data);
      if (!result.updated) {
        
        continue;
      }
      writeCacheFile(result.cacheEntry);
      updatedCount += 1;
      
    }

    
    return;
  }

  

  const existingIds = loadExistingCacheIds();
  const summary = {
    generatedAt: new Date().toISOString(),
    targets: TARGET_COUNTS,
    created: {
      thread: [],
      groupchat: [],
      news: [],
    },
  };

  for (const postType of ["groupchat", "thread", "news"]) {
    summary.created[postType] = await fillPostType(postType, existingIds);
  }

  
  for (const postType of ["groupchat", "thread", "news"]) {
    
    summary.created[postType].forEach((entry) => {
      
    });
  }

  const missing = Object.fromEntries(
    Object.keys(TARGET_COUNTS).map((postType) => [
      postType,
      TARGET_COUNTS[postType] - summary.created[postType].length,
    ])
  );

  if (Object.values(missing).some((count) => count > 0)) {
    
    process.exitCode = 1;
  }
}

main().catch((error) => {
  
  process.exit(1);
});
