export const ROOMS_SCREEN_INFO_STEPS = [
  {
    title: 'MUFL Radio',
    content:
      "MUFL Radio lets you tune Volume + Similarity to quickly discover rooms that match your taste - from super close picks to left-field finds. As you scan, the station list refreshes like an FM dial, and you can jump into any room to trade 30-second Apple Music snippets and swipe/rate with other listeners."
  }
];

export const RADIO_TUNER_INFO_STEPS = [
  {
    title: 'Radio',
    content: `This radio helps users navigate and find rooms using Volume and Similarity.

Without it, you would have to constantly go back to the previous screen to make more picks in order to find different rooms.`
  },
  {
    title: 'Volume',
    content: `Volume is the number before the decimal point and is based on both the volume of the users in the room and how well the recommendations in the room are being received.

A user's volume is reflected by the song recommendations they share and their engagement throughout the app.

Volume has a range between 0 and 3200.`
  },
  {
    title: 'Similarity',
    content: `Similarity, the number to the right of the decimal point, is based on how similar these rooms are to your picks from the selection screen.

Similarity is relative to each user's picks, so the same room can score differently for different listeners.

Similarity has a range between -1000 and 1000.`
  },
  {
    title: 'Similarity Cont.',
    content: `If the similarity is around 800, more users in that room picked the same artists and those artists have a higher volume.

If the similarity is around 200, you may or may not see your selected artists at all, but you will see related artists.

If the similarity is around -500, you are getting less similar rooms so you can explore opposite picks and find something new.`
  }
];
