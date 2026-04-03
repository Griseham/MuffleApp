export const generateRandomStats = () => ({
  ups: Math.floor(Math.random() * 1000) + 100,
  num_comments: Math.floor(Math.random() * 50) + 10,
  bookmarks: Math.floor(Math.random() * 200) + 20
});

export const generateHash = (str) => {
  let hash = 0;
  if (!str) return hash;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
};

export const getRandomRatingCount = (snippetId) => {
  const hash = generateHash(snippetId);
  return 10 + Math.floor((Math.abs(hash) % 31));
};

export const getAverageRating = (snippetId) => {
  if (!snippetId) return Math.floor(Math.random() * 101);
  
  const hash = generateHash(snippetId);
  const randomSeed = Math.abs(hash) % 997;
  return Math.floor((randomSeed / 997) * 101);
};

export const createExampleData = () => {
  const exampleComment = {
    id: 'example_comment_001',
    author: 'Demo Example',
    body: 'Example content',
    likeCount: 542,
    commentCount: 68,
    interactionCount: 914,
    createdUtc: Date.now() / 1000 - 3600,
    replies: []
  };

  const exampleSnippet = {
    id: 'example_comment_001',
    commentId: 'example_comment_001',
    name: 'Example snippet',
    artistName: 'Demo Example',
    artwork: null,
    previewUrl: null,
    userRating: 78,
    avgRating: 65,
    totalRatings: 23,
    didRate: true,
  };

  return { exampleComment, exampleSnippet };
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const deterministicRange = (seedInput, min, max) => {
  const seed = Math.abs(generateHash(seedInput));
  const span = max - min + 1;
  return min + (seed % span);
};

export const getCommunitySnippetStats = (snippetId = "", hintAverage = null) => {
  const normalizedId = String(snippetId || "snippet");
  const totalRatings = deterministicRange(`${normalizedId}:ratings`, 180, 1250);
  const fallbackAverage = deterministicRange(`${normalizedId}:average`, 54, 84);
  const avgRating = Number.isFinite(hintAverage)
    ? clamp(Math.round(hintAverage), 25, 98)
    : fallbackAverage;

  return { totalRatings, avgRating };
};

export const getCommentMetrics = (comment = {}, hasSnippet = false) => {
  const seedBase =
    `${comment?.id || "comment"}:${comment?.author || "unknown"}:${(comment?.body || "").slice(0, 48)}`;

  const fallbackLikes = hasSnippet
    ? deterministicRange(`${seedBase}:likes:snippet`, 320, 860)
    : deterministicRange(`${seedBase}:likes:plain`, 70, 230);
  const fallbackReplies = hasSnippet
    ? deterministicRange(`${seedBase}:replies:snippet`, 22, 140)
    : deterministicRange(`${seedBase}:replies:plain`, 6, 45);

  const likeCount = Number.isFinite(comment?.likeCount) && comment.likeCount > 0
    ? Math.round(comment.likeCount)
    : fallbackLikes;

  const commentCount = Number.isFinite(comment?.commentCount) && comment.commentCount > 0
    ? Math.round(comment.commentCount)
    : fallbackReplies;

  const interactionFallback = Math.round((likeCount * 0.65) + (commentCount * 2.6) + (hasSnippet ? 180 : 45));
  const interactionCount = Number.isFinite(comment?.interactionCount) && comment.interactionCount > 0
    ? Math.round(comment.interactionCount)
    : interactionFallback;

  return {
    ...comment,
    likeCount,
    commentCount,
    interactionCount,
  };
};

export const spreadScatterPoints = (points = []) => {
  const MIN_RATING_COUNT_GAP = 42;
  const MIN_AVERAGE_GAP = 4;
  const placed = [];

  return points.map((point, index) => {
    let ratingCount = Number.isFinite(point?.ratingCount) ? Math.max(1, Math.round(point.ratingCount)) : 1;
    let average = Number.isFinite(point?.average) ? clamp(Math.round(point.average), 20, 98) : 50;
    let attempts = 0;

    while (
      placed.some(
        (candidate) =>
          Math.abs(candidate.ratingCount - ratingCount) < MIN_RATING_COUNT_GAP &&
          Math.abs(candidate.average - average) < MIN_AVERAGE_GAP
      ) &&
      attempts < 16
    ) {
      const direction = attempts % 2 === 0 ? 1 : -1;
      const step = Math.floor(attempts / 2) + 1;
      ratingCount += direction * (16 + (step * 9));
      average += direction * ((step % 3) + 1);
      average = clamp(average, 20, 98);
      ratingCount = Math.max(1, ratingCount);
      attempts += 1;
    }

    const nextPoint = {
      ...point,
      ratingCount: Math.round(ratingCount),
      average: Math.round(average),
      _scatterOrder: index,
    };

    placed.push(nextPoint);
    return nextPoint;
  });
};

export const formatSnippetData = (snippet, _relatedComment, _comments) => {
  const snippetId = snippet?.commentId || snippet?.id;
  
  if (snippet.snippetData) {
    const artworkUrl = snippet.snippetData.attributes?.artwork?.url || snippet.artistImage || "/assets/default-artist.png";
    
    return {
      id: snippetId,
      commentId: snippetId,
      name: snippet.snippetData.attributes?.name,
      artistName: snippet.snippetData.attributes?.artistName,
      artwork: artworkUrl,
      previewUrl: snippet.snippetData.attributes?.previews?.[0]?.url,
      userRating: snippet.userRating ?? null,
      avgRating: snippet.avgRating ?? null,
      totalRatings: snippet.totalRatings ?? null,
      didRate: snippet.didRate ?? false,
    };
  }
  
  return snippet;
};

/**
 * Process scatter data for the scatter plot graph
 * FIXED: Now uses avgRating for the 'average' field to match vertical graph
 */
export const processScatterData = (snippets, comments, getSnippetId) => {
  const ratedSnippets = snippets.filter(
    snippet => snippet.userRating != null || snippet.avgRating != null
  );

  const scatter = ratedSnippets.map((snippet) => {
    const snippetId = getSnippetId(snippet);
    const relatedComment = comments.find(c => c.id === snippetId);
    const commentAuthor = relatedComment?.author || snippet.author || "Unknown";
    const communityStats = getCommunitySnippetStats(snippetId, snippet.avgRating);
    
    return {
      snippetId,
      username: commentAuthor,
      userAvatar: `/assets/image${(Math.abs(generateHash(commentAuthor)) % 1000) + 1}.png`,
      ratingCount: Number.isFinite(snippet.totalRatings) && snippet.totalRatings > 0
        ? Math.round(snippet.totalRatings)
        : communityStats.totalRatings,
      average: Number.isFinite(snippet.avgRating)
        ? Math.round(snippet.avgRating)
        : (Number.isFinite(snippet.userRating) ? Math.round(snippet.userRating) : communityStats.avgRating),
      userRating: snippet.userRating ?? null,
    };
  });

  return spreadScatterPoints(scatter);
};

/**
 * Process scatter data for parameter threads with color coding
 */
export const processParameterScatterData = (snippets, comments, parameters, getSnippetId) => {
  // Define colors for each parameter (up to 8 parameters supported)
  const parameterColors = [
    '#FF6B35', // Orange
    '#4ECDC4', // Teal
    '#45B7D1', // Sky Blue
    '#96CEB4', // Sage Green
    '#DDA0DD', // Plum
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#85C1E9', // Light Blue
  ];
  
  // Create a color map for parameters
  const colorMap = {};
  parameters.forEach((param, index) => {
    colorMap[param] = parameterColors[index % parameterColors.length];
  });
  
  const ratedSnippets = snippets.filter(
    snippet => snippet.userRating != null || snippet.avgRating != null
  );
  
  return ratedSnippets.map((snippet) => {
    const snippetId = getSnippetId(snippet);
    const relatedComment = comments.find(c => c.id === snippetId);
    const commentAuthor = relatedComment?.author || snippet.author || "Unknown";
    const parameter = relatedComment?.parameter || snippet.parameter || null;
    
    return {
      snippetId,
      username: commentAuthor,
      userAvatar: `/assets/image${(Math.abs(generateHash(commentAuthor)) % 1000) + 1}.png`,
      ratingCount: Number.isFinite(snippet.totalRatings) ? snippet.totalRatings : 0,
      average: snippet.avgRating ?? snippet.userRating ?? 0,
      userRating: snippet.userRating ?? null,
      parameter: parameter,
      color: parameter ? colorMap[parameter] : '#8b5cf6',
    };
  });
};

export const addPreRatingsToSnippets = (snippets) => {
  return snippets.map((snippet, index) => {
    if (index < 2) {
      return {
        ...snippet,
        userRating: index === 0 ? 85 : 62,
        avgRating: index === 0 ? 72 : 58,
        totalRatings: index === 0 ? 31 : 18,
        didRate: true
      };
    }
    return snippet;
  });
};
