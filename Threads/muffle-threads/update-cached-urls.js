import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Update parameter thread files to use local cached media URLs
async function updateCachedUrls() {
  console.log('🔄 Updating parameter thread files to use locally cached media...\n');
  
  const cachedPostsDir = path.join(__dirname, 'src/backend/cached_posts');
  const thread001Path = path.join(cachedPostsDir, 'parameter_thread_001.json');
  const thread002Path = path.join(cachedPostsDir, 'parameter_thread_002.json');
  
  // Read the files
  const thread001 = JSON.parse(fs.readFileSync(thread001Path, 'utf8'));
  const thread002 = JSON.parse(fs.readFileSync(thread002Path, 'utf8'));
  
  console.log(`📁 Found ${thread001.snippets.length} snippets in parameter_thread_001`);
  console.log(`📁 Found ${thread002.snippets.length} snippets in parameter_thread_002\n`);
  
  // Update each snippet to use local cached URLs
  function updateSnippetUrls(snippet, index) {
    const songId = `${snippet.artistName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${snippet.songName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    
    // Use locally cached media URLs that our server will serve
    const newArtworkUrl = `http://localhost:4000/cached_media/${songId}_artwork.jpg`;
    const newPreviewUrl = `http://localhost:4000/cached_media/${songId}_preview.m4a`;
    
    console.log(`🎵 ${index + 1}. ${snippet.songName} by ${snippet.artistName}`);
    console.log(`   🖼️  Old artwork: ${snippet.artworkUrl.substring(0, 60)}...`);
    console.log(`   🎧 Old preview: ${snippet.previewUrl.substring(0, 60)}...`);
    console.log(`   ✅ New artwork: ${newArtworkUrl}`);
    console.log(`   ✅ New preview: ${newPreviewUrl}\n`);
    
    return {
      ...snippet,
      artworkUrl: newArtworkUrl,
      previewUrl: newPreviewUrl
    };
  }
  
  // Update thread 001
  console.log('🎯 Updating parameter_thread_001.json...');
  thread001.snippets = thread001.snippets.map(updateSnippetUrls);
  
  console.log('🎯 Updating parameter_thread_002.json...');
  thread002.snippets = thread002.snippets.map((snippet, index) => updateSnippetUrls(snippet, index));
  
  // Write the updated files
  fs.writeFileSync(thread001Path, JSON.stringify(thread001, null, 2));
  fs.writeFileSync(thread002Path, JSON.stringify(thread002, null, 2));
  
  console.log('✅ Successfully updated parameter thread files with local cached URLs!');
  console.log('\n📝 Note: Make sure to run the media caching process to download');
  console.log('   the actual artwork and preview files to the server.');
}

updateCachedUrls().catch(console.error);