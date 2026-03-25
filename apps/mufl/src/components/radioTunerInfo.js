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
    title: 'Volume & Similarity',
    content: `Volume and Similarity can trade off against each other.

Higher volume tends to move toward rooms with stronger engagement and more positively received picks.

Higher similarity tends to move toward rooms closer to the artists you selected.`
  }
];
