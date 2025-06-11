import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test snippet functionality for parameter threads
async function testSnippetFunctionality() {
  console.log('🧪 Running fast-failing snippet functionality test...\n');
  
  const errors = [];
  
  try {
    // Test 1: Check cached parameter thread files exist and have proper structure
    console.log('Test 1: Checking cached parameter thread files...');
    const cachedPostsDir = path.join(__dirname, 'src/backend/cached_posts');
    const thread001Path = path.join(cachedPostsDir, 'parameter_thread_001.json');
    const thread002Path = path.join(cachedPostsDir, 'parameter_thread_002.json');
    
    if (!fs.existsSync(thread001Path)) {
      errors.push('❌ parameter_thread_001.json not found');
    }
    if (!fs.existsSync(thread002Path)) {
      errors.push('❌ parameter_thread_002.json not found');
    }
    
    if (errors.length === 0) {
      console.log('✅ Parameter thread files exist');
    }
    
    // Test 2: Verify snippet structure in cached files
    console.log('Test 2: Verifying snippet structure...');
    const thread001 = JSON.parse(fs.readFileSync(thread001Path, 'utf8'));
    const thread002 = JSON.parse(fs.readFileSync(thread002Path, 'utf8'));
    
    const allSnippets = [...thread001.snippets, ...thread002.snippets];
    
    if (allSnippets.length < 10) {
      errors.push(`❌ Expected at least 10 snippets, found ${allSnippets.length}`);
    }
    
    allSnippets.forEach((snippet, index) => {
      if (!snippet.artworkUrl || !snippet.artworkUrl.startsWith('http')) {
        errors.push(`❌ Snippet ${index} missing valid artworkUrl: ${snippet.artworkUrl}`);
      }
      if (!snippet.previewUrl || !snippet.previewUrl.startsWith('http')) {
        errors.push(`❌ Snippet ${index} missing valid previewUrl: ${snippet.previewUrl}`);
      }
      if (!snippet.songName || snippet.songName.length < 2) {
        errors.push(`❌ Snippet ${index} missing valid songName: ${snippet.songName}`);
      }
      if (!snippet.artistName || snippet.artistName.length < 2) {
        errors.push(`❌ Snippet ${index} missing valid artistName: ${snippet.artistName}`);
      }
    });
    
    if (errors.length === 0) {
      console.log(`✅ All ${allSnippets.length} snippets have proper structure`);
    }
    
    // Test 3: Check URL patterns (local assets for testing)
    console.log('Test 3: Verifying URL patterns...');
    allSnippets.forEach((snippet, index) => {
      if (!snippet.artworkUrl.startsWith('/assets/image') && !snippet.artworkUrl.includes('mzstatic.com')) {
        errors.push(`❌ Snippet ${index} artwork URL invalid: ${snippet.artworkUrl}`);
      }
      if (!snippet.previewUrl.startsWith('/backend/public/') && !snippet.previewUrl.includes('itunes.apple.com')) {
        errors.push(`❌ Snippet ${index} preview URL invalid: ${snippet.previewUrl}`);
      }
    });
    
    if (errors.length === 0) {
      console.log('✅ All snippets use valid URL patterns');
    }
    
    // Test 4: Test a sample URL for accessibility
    console.log('Test 4: Testing URL accessibility...');
    const sampleSnippet = allSnippets[0];
    
    try {
      // Test artwork URL (should be a local asset)
      if (sampleSnippet.artworkUrl.startsWith('/assets/')) {
        console.log(`✅ Sample artwork URL is local asset: ${sampleSnippet.artworkUrl}`);
      } else {
        const artworkResponse = await fetch(sampleSnippet.artworkUrl, { method: 'HEAD' });
        if (!artworkResponse.ok) {
          errors.push(`❌ Sample artwork URL not accessible: ${artworkResponse.status}`);
        } else {
          console.log(`✅ Sample artwork URL accessible (${artworkResponse.status})`);
        }
      }
      
      // Test preview URL (should be a local audio file)
      if (sampleSnippet.previewUrl.startsWith('/backend/public/')) {
        console.log(`✅ Sample preview URL is local audio: ${sampleSnippet.previewUrl}`);
      } else {
        const previewResponse = await fetch(sampleSnippet.previewUrl, { method: 'HEAD' });
        if (!previewResponse.ok) {
          errors.push(`❌ Sample preview URL not accessible: ${previewResponse.status}`);
        } else {
          console.log(`✅ Sample preview URL accessible (${previewResponse.status})`);
        }
      }
    } catch (error) {
      errors.push(`❌ Network error testing URLs: ${error.message}`);
    }
    
    // Test 5: Check for enhanced metadata
    console.log('Test 5: Checking enhanced metadata...');
    allSnippets.forEach((snippet, index) => {
      if (!snippet.albumName || snippet.albumName.length < 2) {
        errors.push(`❌ Snippet ${index} missing albumName: ${snippet.albumName}`);
      }
      if (!snippet.releaseDate || !snippet.releaseDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        errors.push(`❌ Snippet ${index} invalid releaseDate: ${snippet.releaseDate}`);
      }
      if (!snippet.duration || snippet.duration < 60000) {
        errors.push(`❌ Snippet ${index} invalid duration: ${snippet.duration}`);
      }
    });
    
    if (errors.length === 0) {
      console.log('✅ All snippets have enhanced metadata');
    }
    
  } catch (error) {
    errors.push(`❌ Test execution error: ${error.message}`);
  }
  
  // Results
  console.log('\n📊 Test Results:');
  if (errors.length === 0) {
    console.log('🎉 ALL TESTS PASSED - Snippets are properly configured!');
    return true;
  } else {
    console.log(`💥 ${errors.length} ERRORS FOUND:`);
    errors.forEach(error => console.log(`  ${error}`));
    console.log('\n❌ FAST FAIL: Snippet functionality test failed');
    return false;
  }
}

// Run the test
testSnippetFunctionality()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test runner error:', error.message);
    process.exit(1);
  });