export const ZONE1_TIMELINE_INFO_STEPS = [
  {
    title: "Zone 1 Overview",
    content:
      "This header controls the personal timeline at the top of the app. Timeline shows your release history, Top Albums switches into the shared ranking view, and Most Anticipated surfaces upcoming releases you can follow.",
  },
  {
    title: "Filters",
    content:
      "Volume and Genre are additive filters for the active view. Volume reshapes positions using listening intensity, while Genre limits the comparison to the selected genre so the same artists can move to different spots.",
  },
  {
    title: "Anticipated Releases",
    content:
      "In Most Anticipated mode, future artists can be followed with the bell button. Album-art mode keeps those releases pinned to the top row and shows how many listeners are already waiting on each one.",
  },
];

export const ZONE1_TAB_INFO_MODALS = {
  topAlbums: {
    title: "Top Albums",
    modalId: "zone1-top-albums-button-info",
    ariaLabel: "Top Albums button information",
    steps: [
      {
        title: "Top Albums",
        content:
          "Your top albums of the year are the albums you've rated highest, then compared with friends and the top five albums of each year rated by users across the app.",
      },
    ],
  },
  mostAnticipated: {
    title: "Most Anticipated",
    modalId: "zone1-most-anticipated-button-info",
    ariaLabel: "Most Anticipated button information",
    steps: [
      {
        title: "Most Anticipated",
        content:
          "Highlights upcoming albums and shows how many users are waiting for each release.",
      },
    ],
  },
  timeline: {
    title: "Timeline",
    modalId: "zone1-timeline-button-info",
    ariaLabel: "Timeline button information",
    steps: [
      {
        title: "Timeline",
        content:
          "Artists are plotted by release date and positioned by how highly you've rated their albums.",
      },
    ],
  },
  volume: {
    title: "Volume",
    modalId: "zone1-volume-button-info",
    ariaLabel: "Volume button information",
    steps: [
      {
        title: "Volume",
        content:
          "Filters by user listening volume. Lower volume usually reflects newer users and higher volume reflects more activity.",
      },
    ],
  },
  genre: {
    title: "Genre",
    modalId: "zone1-genre-button-info",
    ariaLabel: "Genre button information",
    steps: [
      {
        title: "Genre",
        content:
          "Compares timeline positions against users in specific genre communities.",
      },
    ],
  },
  addUsers: {
    title: "Add Users",
    modalId: "zone1-add-users-button-info",
    ariaLabel: "Add users button information",
    steps: [
      {
        title: "Add Users",
        content:
          "Add friends to compare timelines and ratings side by side.",
      },
    ],
  },
};
