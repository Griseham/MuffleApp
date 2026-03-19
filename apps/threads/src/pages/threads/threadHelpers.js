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
    author: 'MusicExpert42',
    body: 'Example Comment',
    likeCount: 15,
    commentCount: 3,
    createdUtc: Date.now() / 1000 - 3600,
    replies: []
  };

  const exampleSnippet = {
    id: 'example_comment_001',
    commentId: 'example_comment_001',
    name: 'Midnight Vibes',
    artistName: 'Lunar Sounds',
    artwork: null,
    previewUrl: '/backend/public/HeartShapedBox.mp3',
    userRating: 78,
    avgRating: 65,
    totalRatings: 23,
    didRate: true,
  };

  return { exampleComment, exampleSnippet };
};

export const formatSnippetData = (snippet, relatedComment, comments) => {
  const snippetId = snippet?.id || snippet?.commentId;
  const commentAuthor = relatedComment?.author || comments.find(c => c.id === snippetId)?.author || "Unknown";
  
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
  
  return ratedSnippets.map((snippet) => {
    const snippetId = getSnippetId(snippet);
    const relatedComment = comments.find(c => c.id === snippetId);
    const commentAuthor = relatedComment?.author || snippet.author || "Unknown";
    
    const randomRatingCount = getRandomRatingCount(snippetId);
    
    return {
      snippetId,
      username: commentAuthor,
      userAvatar: `/assets/image${(Math.abs(generateHash(commentAuthor)) % 1000) + 1}.png`,
      ratingCount: snippet.totalRatings || randomRatingCount,
      // FIXED: Use avgRating to match the vertical graph's average marker
      average: snippet.avgRating ?? 50,
      // Also include userRating for reference if needed
      userRating: snippet.userRating ?? null,
    };
  });
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
    
    const randomRatingCount = getRandomRatingCount(snippetId);
    
    return {
      snippetId,
      username: commentAuthor,
      userAvatar: `/assets/image${(Math.abs(generateHash(commentAuthor)) % 1000) + 1}.png`,
      ratingCount: snippet.totalRatings || randomRatingCount,
      average: snippet.avgRating ?? 50,
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