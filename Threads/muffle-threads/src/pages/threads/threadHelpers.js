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

export const processScatterData = (snippets, comments, getSnippetId) => {
  const ratedSnippets = snippets.filter(
    snippet => snippet.userRating != null || snippet.avgRating != null
  );
  
  return ratedSnippets.map((snippet) => {
    const snippetId = getSnippetId(snippet);
    const relatedComment = comments.find(c => c.id === snippetId);
    const commentAuthor = relatedComment?.author || "Unknown";
    
    const randomRatingCount = getRandomRatingCount(snippetId);
    
    return {
      snippetId,
      userAvatar: `/assets/image${(Math.abs(generateHash(commentAuthor)) % 1000) + 1}.png`,
      ratingCount: snippet.totalRatings || randomRatingCount,
      average: snippet.userRating ?? 50
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