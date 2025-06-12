import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Temporarily fix URLs to use working assets for testing
async function fixUrlsTemporarily() {
  console.log('🔧 Temporarily fixing URLs to use working assets for testing...\n');
  
  const cachedPostsDir = path.join(__dirname, 'src/backend/cached_posts');
  const thread001Path = path.join(cachedPostsDir, 'parameter_thread_001.json');
  const thread002Path = path.join(cachedPostsDir, 'parameter_thread_002.json');
  
  // Read the files
  const thread001 = JSON.parse(fs.readFileSync(thread001Path, 'utf8'));
  const thread002 = JSON.parse(fs.readFileSync(thread002Path, 'utf8'));
  
  // Update each snippet to use working fallback URLs
  function updateSnippetUrls(snippet, index) {
    // Use working asset URLs for artwork and a working audio file
    const artworkIndex = ((index * 7) + 123) % 999 + 1; // Generate deterministic artwork numbers
    const newArtworkUrl = `/assets/image${artworkIndex}.png`;
    const newPreviewUrl = `/backend/public/HeartShapedBox.mp3`;
    
    console.log(`🎵 ${index + 1}. ${snippet.songName} by ${snippet.artistName}`);
    console.log(`   ✅ Artwork: ${newArtworkUrl}`);
    console.log(`   ✅ Preview: ${newPreviewUrl}\n`);
    
    return {
      ...snippet,
      artworkUrl: newArtworkUrl,
      previewUrl: newPreviewUrl
    };
  }
  
  // Update both threads
  console.log('🎯 Updating parameter_thread_001.json...');
  thread001.snippets = thread001.snippets.map(updateSnippetUrls);
  
  console.log('🎯 Updating parameter_thread_002.json...');
  thread002.snippets = thread002.snippets.map((snippet, index) => updateSnippetUrls(snippet, index));
  
  // Write the updated files
  fs.writeFileSync(thread001Path, JSON.stringify(thread001, null, 2));
  fs.writeFileSync(thread002Path, JSON.stringify(thread002, null, 2));
  
  console.log('✅ Successfully updated parameter thread files with working fallback URLs!');
  console.log('📝 Note: This uses placeholder artwork and audio for testing.');
  console.log('   Real Apple Music integration will be implemented separately.');
}

fixUrlsTemporarily().catch(console.error);