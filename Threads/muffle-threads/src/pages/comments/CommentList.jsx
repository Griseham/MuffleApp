// src/components/CommentList.jsx
import React from "react";
import { FixedSizeList } from "react-window";
import CommentItem from "./CommentItem";
import CommentStyles from "./CommentStyles";
import SnippetStyles from "./SnippetStyles";

export default function CommentList({ comments, snippetRecs, onPlaySnippet, onSetRating, activeSnippet }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={comments.length}
      itemSize={150}
      width="100%"
    >
      {({ index, style }) => {
        const comment = comments[index];
        if (!comment) return null;
        // Determine if there's an attached snippet (user added) or one provided by the server:
        let snippet = comment.snippet || snippetRecs.find(s => s.commentId === comment.id);
        if (snippet && snippet.snippetData) {
          // Normalize the snippet from the server:
          snippet = {
            id: snippet.commentId,
            name: snippet.snippetData.attributes.name,
            artistName: snippet.snippetData.attributes.artistName,
            artwork: snippet.artistImage || "/threads/assets/default-artist.png",
            previewUrl: snippet.snippetData.attributes.previews?.[0]?.url || null,
          };
        }
        return (
          <div key={comment.id} style={{ ...style, ...CommentStyles.commentCard }}>
            <CommentItem 
              comment={comment}
              snippet={snippet}
              onPlaySnippet={onPlaySnippet}
              activeSnippet={activeSnippet}
              onSetRating={onSetRating}
            />
          </div>
        );
      }}
    </FixedSizeList>
  );
}
