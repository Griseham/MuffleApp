import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { before, describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CACHED_POSTS_DIR = path.resolve(__dirname, '../src/backend/cached_posts')
const NETWORK_CHECKS_ENABLED = process.env.THREADS_TEST_NETWORK === '1'

let parameterThread001
let parameterThread002

function readCachedThread(fileName) {
  const filePath = path.join(CACHED_POSTS_DIR, fileName)
  assert.ok(fs.existsSync(filePath), `Missing cached thread file: ${filePath}`)
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function assertHasOwnProperty(value, propertyName) {
  assert.ok(
    Object.prototype.hasOwnProperty.call(value, propertyName),
    `Expected property "${propertyName}" to exist`
  )
}

function assertValidSnippet(snippet) {
  for (const field of ['songName', 'artistName', 'artworkUrl', 'previewUrl', 'albumName', 'releaseDate', 'duration']) {
    assertHasOwnProperty(snippet, field)
  }

  assert.ok(snippet.songName)
  assert.ok(snippet.artistName)
  assert.ok(snippet.artworkUrl)
  assert.ok(snippet.previewUrl)
  assert.ok(snippet.albumName)
  assert.match(snippet.artworkUrl, /^https?:\/\//)
  assert.match(snippet.previewUrl, /^https?:\/\//)
  assert.match(snippet.artworkUrl, /mzstatic\.com/)
  assert.match(snippet.previewUrl, /(itunes\.apple\.com|mzstatic\.com)/)
  assert.match(snippet.releaseDate, /^\d{4}-\d{2}-\d{2}$/)
  assert.equal(typeof snippet.duration, 'number')
  assert.ok(snippet.duration > 0)
}

before(() => {
  parameterThread001 = readCachedThread('parameter_thread_001.json')
  parameterThread002 = readCachedThread('parameter_thread_002.json')
})

describe('Parameter Threads Apple Music Integration', () => {
  describe('Parameter Thread 001', () => {
    it('has the expected post structure', () => {
      assert.equal(parameterThread001.id, 'parameter_thread_001')
      assert.equal(parameterThread001.postType, 'parameter')
      assert.deepEqual(
        parameterThread001.parameters,
        ['Imagine Dragons', 'Green Day', 'OneRepublic', 'Maroon 5']
      )
    })

    it('marks snippet comments correctly', () => {
      const commentsWithSnippets = parameterThread001.comments.filter((comment) => comment.hasSnippet)
      assert.ok(commentsWithSnippets.length >= 10)

      for (const comment of commentsWithSnippets) {
        assert.equal(comment.hasSnippet, true)
        assertHasOwnProperty(comment, 'parameter')
        assert.ok(['Imagine Dragons', 'Green Day', 'OneRepublic', 'Maroon 5'].includes(comment.parameter))
      }
    })

    it('has a snippet for every snippet-enabled comment', () => {
      const commentsWithSnippets = parameterThread001.comments.filter((comment) => comment.hasSnippet)
      assert.equal(parameterThread001.snippets.length, commentsWithSnippets.length)

      for (const comment of commentsWithSnippets) {
        const snippet = parameterThread001.snippets.find((entry) => entry.commentId === comment.id)
        assert.ok(snippet, `Missing snippet for comment ${comment.id}`)
        assert.equal(snippet.commentId, comment.id)
      }
    })

    it('stores valid Apple Music data for every snippet', () => {
      for (const snippet of parameterThread001.snippets) {
        assertValidSnippet(snippet)
      }
    })

    it('maps the expected artists for known songs', () => {
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
      }

      for (const snippet of parameterThread001.snippets) {
        assert.equal(snippet.artistName, artistMapping[snippet.songName])
      }
    })
  })

  describe('Parameter Thread 002', () => {
    it('has the expected post structure', () => {
      assert.equal(parameterThread002.id, 'parameter_thread_002')
      assert.equal(parameterThread002.postType, 'parameter')
      assert.deepEqual(
        parameterThread002.parameters,
        ['Olivia Rodrigo', 'Tyla', 'Tate McRae', 'Sabrina Carpenter']
      )
    })

    it('marks snippet comments correctly', () => {
      const commentsWithSnippets = parameterThread002.comments.filter((comment) => comment.hasSnippet)
      assert.ok(commentsWithSnippets.length >= 10)

      for (const comment of commentsWithSnippets) {
        assert.equal(comment.hasSnippet, true)
        assertHasOwnProperty(comment, 'parameter')
        assert.ok(['Olivia Rodrigo', 'Tyla', 'Tate McRae', 'Sabrina Carpenter'].includes(comment.parameter))
      }
    })

    it('stores valid Apple Music data for every snippet', () => {
      for (const snippet of parameterThread002.snippets) {
        assertValidSnippet(snippet)
      }
    })

    it('maps the expected artists for known songs', () => {
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
      }

      for (const snippet of parameterThread002.snippets) {
        assert.equal(snippet.artistName, artistMapping[snippet.songName])
      }
    })
  })

  describe('Cross-thread requirements', () => {
    it('uses a consistent snippet data shape', () => {
      const allSnippets = [...parameterThread001.snippets, ...parameterThread002.snippets]
      const requiredFields = [
        'commentId',
        'query',
        'songName',
        'artistName',
        'artworkUrl',
        'previewUrl',
        'albumName',
        'releaseDate',
        'duration'
      ]

      for (const snippet of allSnippets) {
        for (const field of requiredFields) {
          assertHasOwnProperty(snippet, field)
          assert.ok(snippet[field], `Expected snippet field "${field}" to be truthy`)
        }
      }
    })

    it('keeps unique comment IDs and unique song-artist pairs', () => {
      const allSnippets = [...parameterThread001.snippets, ...parameterThread002.snippets]
      const commentIds = allSnippets.map((snippet) => snippet.commentId)
      const songArtistCombos = allSnippets.map((snippet) => `${snippet.songName}-${snippet.artistName}`)

      assert.equal(commentIds.length, new Set(commentIds).size)
      assert.equal(songArtistCombos.length, new Set(songArtistCombos).size)
    })

    it('keeps cached thread files at a reasonable size', () => {
      const thread001Path = path.join(CACHED_POSTS_DIR, 'parameter_thread_001.json')
      const thread002Path = path.join(CACHED_POSTS_DIR, 'parameter_thread_002.json')

      assert.ok(fs.statSync(thread001Path).size < 100 * 1024)
      assert.ok(fs.statSync(thread002Path).size < 100 * 1024)
    })

    it('stores 300x300 artwork URLs', () => {
      const allSnippets = [...parameterThread001.snippets, ...parameterThread002.snippets]
      for (const snippet of allSnippets) {
        assert.match(snippet.artworkUrl, /300x300/)
      }
    })

    it('stores durations in a reasonable range', () => {
      const allSnippets = [...parameterThread001.snippets, ...parameterThread002.snippets]
      for (const snippet of allSnippets) {
        assert.ok(snippet.duration > 60 * 1000)
        assert.ok(snippet.duration < 10 * 60 * 1000)
      }
    })
  })

  const networkIt = NETWORK_CHECKS_ENABLED ? it : it.skip

  networkIt('can reach a small sample of remote snippet URLs', { timeout: 10_000 }, async () => {
    const allSnippets = [...parameterThread001.snippets, ...parameterThread002.snippets]
    const sampleSnippets = allSnippets.slice(0, 3)

    for (const snippet of sampleSnippets) {
      const artworkResponse = await fetch(snippet.artworkUrl, { method: 'HEAD' })
      assert.ok(artworkResponse.ok, `Artwork URL was not reachable for ${snippet.songName}`)

      const previewResponse = await fetch(snippet.previewUrl, { method: 'HEAD' })
      assert.ok(previewResponse.ok, `Preview URL was not reachable for ${snippet.songName}`)
    }
  })
})

export function runParameterThreadSmokeTest() {
  const thread001 = readCachedThread('parameter_thread_001.json')
  const thread002 = readCachedThread('parameter_thread_002.json')
  const allSnippets = [...thread001.snippets, ...thread002.snippets]

  assert.ok(thread001.snippets.length >= 5, 'Parameter thread 001 missing sufficient snippets')
  assert.ok(thread002.snippets.length >= 5, 'Parameter thread 002 missing sufficient snippets')

  for (const [index, snippet] of allSnippets.entries()) {
    assert.ok(snippet.artworkUrl, `Snippet ${index} missing artworkUrl`)
    assert.ok(snippet.previewUrl, `Snippet ${index} missing previewUrl`)
  }

  return true
}
