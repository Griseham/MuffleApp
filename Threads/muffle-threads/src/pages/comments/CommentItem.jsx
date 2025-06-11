// src/components/CommentItem.jsx
import React from "react";
import { authorToAvatar } from "../utils/utils";
import styles from "../threads/ThreadDetailStyles";

export default function CommentItem({ comment, snippet, onPlaySnippet, activeSnippet, onSetRating }) {
  return (
    <div style={styles.commentCard}>
      <img src={authorToAvatar(comment.author)} alt="Avatar" style={styles.tweetAvatar} />
      <div style={styles.tweetContent}>
        <div style={styles.tweetHeader}>
          <span style={styles.tweetUsername}>{comment.author}</span>
        </div>
        <div style={styles.tweetBody}>{comment.body}</div>
        {snippet && (
          <div style={styles.snippetBlock}>
            <img
              src={snippet.artwork}
              alt={snippet.name}
              style={styles.snippetAlbumArt}
            />
            <div style={styles.snippetTextWrapper}>
              <div style={styles.snippetTitle}>{snippet.name}</div>
              <div style={styles.snippetArtist}>{snippet.artistName}</div>
            </div>
            <button
              style={styles.snippetPlayButton}
              onClick={() => onPlaySnippet(snippet)}
            >
              ▶
            </button>
            {/* If this snippet is active, you can render a rating bar or progress */}
            {activeSnippet.snippetId === snippet.id && (
              <div style={{ marginTop: "0.5rem" }}>
                {/* You can render your HorizontalRatingBar component here */}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
