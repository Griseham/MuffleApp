/**
 * Fast-failing unit tests for parameter threads Apple Music snippet functionality
 * These tests ensure that comments with snippets in parameter threads have proper album art and preview URLs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to cached parameter thread files
const CACHED_POSTS_DIR = path.resolve(__dirname, '../src/backend/cached_posts');

describe('Parameter Threads Apple Music Integration', () => {
  let parameterThread001, parameterThread002;

  beforeAll(() => {
    // Load parameter thread data
    const thread001Path = path.join(CACHED_POSTS_DIR, 'parameter_thread_001.json');
    const thread002Path = path.join(CACHED_POSTS_DIR, 'parameter_thread_002.json');
    
    if (!fs.existsSync(thread001Path)) {
      throw new Error(`Parameter thread 001 not found at ${thread001Path}`);
    }
    
    if (!fs.existsSync(thread002Path)) {
      throw new Error(`Parameter thread 002 not found at ${thread002Path}`);
    }
    
    parameterThread001 = JSON.parse(fs.readFileSync(thread001Path, 'utf8'));
    parameterThread002 = JSON.parse(fs.readFileSync(thread002Path, 'utf8'));
  });

  describe('Parameter Thread 001 (Imagine Dragons, Green Day, OneRepublic, Maroon 5)', () => {
    it('should have valid post structure', () => {
      expect(parameterThread001).toBeDefined();
      expect(parameterThread001.id).toBe('parameter_thread_001');
      expect(parameterThread001.postType).toBe('parameter');
      expect(parameterThread001.parameters).toEqual(['Imagine Dragons', 'Green Day', 'OneRepublic', 'Maroon 5']);
    });

    it('should have comments with hasSnippet flag correctly set', () => {
      const commentsWithSnippets = parameterThread001.comments.filter(c => c.hasSnippet);
      expect(commentsWithSnippets.length).toBeGreaterThanOrEqual(10);
      
      commentsWithSnippets.forEach(comment => {
        expect(comment).toHaveProperty('hasSnippet', true);
        expect(comment).toHaveProperty('parameter');
        expect(['Imagine Dragons', 'Green Day', 'OneRepublic', 'Maroon 5']).toContain(comment.parameter);
      });
    });

    it('should have corresponding snippets for all hasSnippet comments', () => {
      const commentsWithSnippets = parameterThread001.comments.filter(c => c.hasSnippet);
      expect(parameterThread001.snippets.length).toBe(commentsWithSnippets.length);
      
      commentsWithSnippets.forEach(comment => {
        const snippet = parameterThread001.snippets.find(s => s.commentId === comment.id);
        expect(snippet).toBeDefined();
        expect(snippet.commentId).toBe(comment.id);
      });
    });

    it('should have valid Apple Music data for all snippets', () => {
      parameterThread001.snippets.forEach(snippet => {
        // Fast-fail: Check required fields
        expect(snippet).toHaveProperty('songName');
        expect(snippet).toHaveProperty('artistName');
        expect(snippet).toHaveProperty('artworkUrl');
        expect(snippet).toHaveProperty('previewUrl');
        
        // Fast-fail: Check that values are not empty
        expect(snippet.songName).toBeTruthy();
        expect(snippet.artistName).toBeTruthy();
        expect(snippet.artworkUrl).toBeTruthy();
        expect(snippet.previewUrl).toBeTruthy();
        
        // Fast-fail: Check URL formats
        expect(snippet.artworkUrl).toMatch(/^https?:\/\//);
        expect(snippet.previewUrl).toMatch(/^https?:\/\//);
        
        // Check Apple Music URL patterns
        expect(snippet.artworkUrl).toMatch(/mzstatic\.com/);
        expect(snippet.previewUrl).toMatch(/(itunes\.apple\.com|mzstatic\.com)/);
        
        // Check enhanced metadata
        expect(snippet).toHaveProperty('albumName');
        expect(snippet).toHaveProperty('releaseDate');
        expect(snippet).toHaveProperty('duration');
        
        expect(snippet.albumName).toBeTruthy();
        expect(snippet.releaseDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(typeof snippet.duration).toBe('number');
        expect(snippet.duration).toBeGreaterThan(0);
      });
    });

    it('should have correct artist mapping for each snippet', () => {
      const artistMapping = {
        'Demons': 'Imagine Dragons',
        'Thunder': 'Imagine Dragons', 
        'Radioactive': 'Imagine Dragons',
        'Basket Case': 'Green Day',
        'When I Come Around': 'Green Day',
        'Good Riddance (Time of Your Life)': 'Green Day',
        'Counting Stars': 'OneRepublic',
        'Apologize': 'OneRepublic',
        'This Love': 'Maroon 5',
        'Sunday Morning': 'Maroon 5'
      };

      parameterThread001.snippets.forEach(snippet => {
        const expectedArtist = artistMapping[snippet.songName];
        expect(snippet.artistName).toBe(expectedArtist);
      });
    });
  });

  describe('Parameter Thread 002 (Olivia Rodrigo, Tyla, Tate McRae, Sabrina Carpenter)', () => {
    it('should have valid post structure', () => {
      expect(parameterThread002).toBeDefined();
      expect(parameterThread002.id).toBe('parameter_thread_002');
      expect(parameterThread002.postType).toBe('parameter');
      expect(parameterThread002.parameters).toEqual(['Olivia Rodrigo', 'Tyla', 'Tate McRae', 'Sabrina Carpenter']);
    });

    it('should have comments with hasSnippet flag correctly set', () => {
      const commentsWithSnippets = parameterThread002.comments.filter(c => c.hasSnippet);
      expect(commentsWithSnippets.length).toBeGreaterThanOrEqual(10);
      
      commentsWithSnippets.forEach(comment => {
        expect(comment).toHaveProperty('hasSnippet', true);
        expect(comment).toHaveProperty('parameter');
        expect(['Olivia Rodrigo', 'Tyla', 'Tate McRae', 'Sabrina Carpenter']).toContain(comment.parameter);
      });
    });

    it('should have valid Apple Music data for all snippets', () => {
      parameterThread002.snippets.forEach(snippet => {
        // Fast-fail: Check required fields
        expect(snippet).toHaveProperty('songName');
        expect(snippet).toHaveProperty('artistName');
        expect(snippet).toHaveProperty('artworkUrl');
        expect(snippet).toHaveProperty('previewUrl');
        
        // Fast-fail: Check that values are not empty
        expect(snippet.songName).toBeTruthy();
        expect(snippet.artistName).toBeTruthy();
        expect(snippet.artworkUrl).toBeTruthy();
        expect(snippet.previewUrl).toBeTruthy();
        
        // Fast-fail: Check URL formats
        expect(snippet.artworkUrl).toMatch(/^https?:\/\//);
        expect(snippet.previewUrl).toMatch(/^https?:\/\//);
        
        // Check Apple Music URL patterns
        expect(snippet.artworkUrl).toMatch(/mzstatic\.com/);
        expect(snippet.previewUrl).toMatch(/(itunes\.apple\.com|mzstatic\.com)/);
        
        // Check enhanced metadata
        expect(snippet).toHaveProperty('albumName');
        expect(snippet).toHaveProperty('releaseDate');
        expect(snippet).toHaveProperty('duration');
      });
    });

    it('should have correct artist mapping for each snippet', () => {
      const artistMapping = {
        'vampire': 'Olivia Rodrigo',
        'good 4 u': 'Olivia Rodrigo',
        'drivers license': 'Olivia Rodrigo',
        'Water': 'Tyla',
        'Art': 'Tyla',
        'Greedy': 'Tate McRae',
        'run for the hills': 'Tate McRae',
        'you broke me first': 'Tate McRae',
        'Espresso': 'Sabrina Carpenter',
        'Nonsense': 'Sabrina Carpenter'
      };

      parameterThread002.snippets.forEach(snippet => {
        const expectedArtist = artistMapping[snippet.songName];
        expect(snippet.artistName).toBe(expectedArtist);
      });
    });
  });

  describe('Apple Music API Integration Requirements', () => {
    it('should ensure all snippet URLs are accessible', async () => {
      // Test a sample of URLs for accessibility
      const allSnippets = [...parameterThread001.snippets, ...parameterThread002.snippets];
      const sampleSnippets = allSnippets.slice(0, 3); // Test first 3 for speed
      
      for (const snippet of sampleSnippets) {
        try {
          // Test artwork URL
          const artworkResponse = await fetch(snippet.artworkUrl, { method: 'HEAD' });
          expect(artworkResponse.ok).toBeTruthy();
          
          // Test preview URL  
          const previewResponse = await fetch(snippet.previewUrl, { method: 'HEAD' });
          expect(previewResponse.ok).toBeTruthy();
        } catch (error) {
          // Fast-fail if URLs are not accessible
          throw new Error(`URL accessibility test failed for ${snippet.songName}: ${error.message}`);
        }
      }
    }, 10000); // 10 second timeout for network requests

    it('should have consistent data structure across all snippets', () => {
      const allSnippets = [...parameterThread001.snippets, ...parameterThread002.snippets];
      const requiredFields = ['commentId', 'query', 'songName', 'artistName', 'artworkUrl', 'previewUrl', 'albumName', 'releaseDate', 'duration'];
      
      allSnippets.forEach(snippet => {
        requiredFields.forEach(field => {
          expect(snippet).toHaveProperty(field);
          expect(snippet[field]).toBeTruthy();
        });
      });
    });

    it('should have unique comment IDs and song combinations', () => {
      const allSnippets = [...parameterThread001.snippets, ...parameterThread002.snippets];
      const commentIds = allSnippets.map(s => s.commentId);
      const uniqueCommentIds = [...new Set(commentIds)];
      
      expect(commentIds.length).toBe(uniqueCommentIds.length);
      
      const songArtistCombos = allSnippets.map(s => `${s.songName}-${s.artistName}`);
      const uniqueCombos = [...new Set(songArtistCombos)];
      
      expect(songArtistCombos.length).toBe(uniqueCombos.length);
    });
  });

  describe('Performance and Caching Requirements', () => {
    it('should have reasonable file sizes for cached data', () => {
      const thread001Path = path.join(CACHED_POSTS_DIR, 'parameter_thread_001.json');
      const thread002Path = path.join(CACHED_POSTS_DIR, 'parameter_thread_002.json');
      
      const thread001Size = fs.statSync(thread001Path).size;
      const thread002Size = fs.statSync(thread002Path).size;
      
      // Files should be under 100KB each
      expect(thread001Size).toBeLessThan(100 * 1024);
      expect(thread002Size).toBeLessThan(100 * 1024);
    });

    it('should have snippets with appropriate artwork resolution', () => {
      const allSnippets = [...parameterThread001.snippets, ...parameterThread002.snippets];
      
      allSnippets.forEach(snippet => {
        // Check that artwork URLs specify 300x300 resolution
        expect(snippet.artworkUrl).toMatch(/300x300/);
      });
    });

    it('should have reasonable duration values', () => {
      const allSnippets = [...parameterThread001.snippets, ...parameterThread002.snippets];
      
      allSnippets.forEach(snippet => {
        // Duration should be between 60 seconds and 10 minutes (in milliseconds)
        expect(snippet.duration).toBeGreaterThan(60 * 1000);
        expect(snippet.duration).toBeLessThan(10 * 60 * 1000);
      });
    });
  });
});

// Helper function to run a quick smoke test
export function runParameterThreadSmokeTest() {
  const thread001Path = path.join(CACHED_POSTS_DIR, 'parameter_thread_001.json');
  const thread002Path = path.join(CACHED_POSTS_DIR, 'parameter_thread_002.json');
  
  if (!fs.existsSync(thread001Path) || !fs.existsSync(thread002Path)) {
    throw new Error('Parameter thread files not found');
  }
  
  const thread001 = JSON.parse(fs.readFileSync(thread001Path, 'utf8'));
  const thread002 = JSON.parse(fs.readFileSync(thread002Path, 'utf8'));
  
  const errors = [];
  
  // Quick validation
  if (!thread001.snippets || thread001.snippets.length < 5) {
    errors.push('Parameter thread 001 missing sufficient snippets');
  }
  
  if (!thread002.snippets || thread002.snippets.length < 5) {
    errors.push('Parameter thread 002 missing sufficient snippets');
  }
  
  // Check snippet structure
  [...thread001.snippets, ...thread002.snippets].forEach((snippet, index) => {
    if (!snippet.artworkUrl || !snippet.previewUrl) {
      errors.push(`Snippet ${index} missing required URLs`);
    }
  });
  
  if (errors.length > 0) {
    throw new Error(`Parameter thread smoke test failed: ${errors.join(', ')}`);
  }
  
  return true;
}