import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Refresh Apple Music URLs for parameter threads using the API
async function refreshAppleMusicUrls() {
  console.log('🎵 Refreshing Apple Music URLs for parameter threads...\n');
  
  const cachedPostsDir = path.join(__dirname, 'src/backend/cached_posts');
  const thread001Path = path.join(cachedPostsDir, 'parameter_thread_001.json');
  const thread002Path = path.join(cachedPostsDir, 'parameter_thread_002.json');
  
  // Read the files
  const thread001 = JSON.parse(fs.readFileSync(thread001Path, 'utf8'));
  const thread002 = JSON.parse(fs.readFileSync(thread002Path, 'utf8'));
  
  console.log(`📁 Found ${thread001.snippets.length} snippets in parameter_thread_001`);
  console.log(`📁 Found ${thread002.snippets.length} snippets in parameter_thread_002\n`);
  
  // Function to get fresh Apple Music data
  async function getFreshAppleMusicData(songName, artistName) {
    const query = `${songName} ${artistName}`;
    const encodedQuery = encodeURIComponent(query);
    const url = `http://localhost:4000/api/apple-music-search?query=${encodedQuery}`;
    
    console.log(`   🔍 Searching: ${query}`);
    
    try {
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success && result.data) {
        const song = result.data;
        const artworkUrl = song.attributes.artwork?.url.replace('{w}', '300').replace('{h}', '300') || null;
        const previewUrl = song.attributes.previews?.[0]?.url || null;
        
        console.log(`   ✅ Found: ${song.attributes.name} by ${song.attributes.artistName}`);
        console.log(`   🖼️  Artwork: ${artworkUrl?.substring(0, 60)}...`);
        console.log(`   🎧 Preview: ${previewUrl?.substring(0, 60)}...\n`);
        
        return {
          artworkUrl,
          previewUrl,
          foundName: song.attributes.name,
          foundArtist: song.attributes.artistName
        };
      } else {
        console.log(`   ❌ No results found for: ${query}\n`);
        return null;
      }
    } catch (error) {
      console.log(`   ❌ Error searching for: ${query} - ${error.message}\n`);
      return null;
    }
  }
  
  // Update snippets in a thread
  async function updateThreadSnippets(thread, threadName) {
    console.log(`🎯 Updating ${threadName}...`);
    
    const updatedSnippets = [];
    
    for (const snippet of thread.snippets) {
      console.log(`🎵 ${snippet.songName} by ${snippet.artistName}`);
      
      const freshData = await getFreshAppleMusicData(snippet.songName, snippet.artistName);
      
      if (freshData && freshData.artworkUrl && freshData.previewUrl) {
        updatedSnippets.push({
          ...snippet,
          artworkUrl: freshData.artworkUrl,
          previewUrl: freshData.previewUrl
        });
      } else {
        // Keep original if we can't find fresh data
        console.log(`   ⚠️  Keeping original URLs for: ${snippet.songName}`);
        updatedSnippets.push(snippet);
      }
      
      // Add small delay to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return {
      ...thread,
      snippets: updatedSnippets
    };
  }
  
  // Update both threads
  const updatedThread001 = await updateThreadSnippets(thread001, 'parameter_thread_001.json');
  const updatedThread002 = await updateThreadSnippets(thread002, 'parameter_thread_002.json');
  
  // Write the updated files
  fs.writeFileSync(thread001Path, JSON.stringify(updatedThread001, null, 2));
  fs.writeFileSync(thread002Path, JSON.stringify(updatedThread002, null, 2));
  
  console.log('✅ Successfully refreshed Apple Music URLs for parameter threads!');
  console.log('📝 Parameter threads now use fresh Apple Music URLs that should work properly.');
}

refreshAppleMusicUrls().catch(console.error);