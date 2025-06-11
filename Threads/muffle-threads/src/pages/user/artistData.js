// artistData.js
// Cache of artist data with profile images for the Discovery tab

const artistData = {
    // Collection of curated artists with images using local assets
    artists: [
      {
        id: "artist1",
        name: "Tame Impala",
        genre: "Psychedelic Rock",
        imageUrl: "/assets/image1.png"
      },
      {
        id: "artist2",
        name: "Kendrick Lamar",
        genre: "Hip-Hop",
        imageUrl: "/assets/image2.png"
      },
      {
        id: "artist3",
        name: "Dua Lipa",
        genre: "Pop",
        imageUrl: "/assets/image3.png"
      },
      {
        id: "artist4",
        name: "Radiohead",
        genre: "Alternative Rock",
        imageUrl: "/assets/image4.png"
      },
      {
        id: "artist5",
        name: "Tyler, The Creator",
        genre: "Hip-Hop",
        imageUrl: "/assets/image5.png"
      },
      {
        id: "artist6",
        name: "Billie Eilish",
        genre: "Pop",
        imageUrl: "/assets/image6.png"
      },
      {
        id: "artist7",
        name: "Bonobo",
        genre: "Electronic",
        imageUrl: "/assets/image7.png"
      },
      {
        id: "artist8",
        name: "Thundercat",
        genre: "Jazz",
        imageUrl: "/assets/image8.png"
      },
      {
        id: "artist9",
        name: "Flume",
        genre: "Electronic",
        imageUrl: "/assets/image9.png"
      },
      {
        id: "artist10",
        name: "Frank Ocean",
        genre: "R&B",
        imageUrl: "/assets/image10.png"
      },
      {
        id: "artist11",
        name: "SZA",
        genre: "R&B",
        imageUrl: "/assets/image11.png"
      },
      {
        id: "artist12",
        name: "Khruangbin",
        genre: "Funk",
        imageUrl: "/assets/image12.png"
      },
      {
        id: "artist13",
        name: "FKA twigs",
        genre: "Electronic",
        imageUrl: "/assets/image13.png"
      },
      {
        id: "artist14",
        name: "Jorja Smith",
        genre: "R&B",
        imageUrl: "/assets/image14.png"
      },
      {
        id: "artist15",
        name: "Jamie xx",
        genre: "Electronic",
        imageUrl: "/assets/image15.png"
      },
      {
        id: "artist16",
        name: "Hiatus Kaiyote",
        genre: "Neo-Soul",
        imageUrl: "/assets/image16.png"
      },
      {
        id: "artist17",
        name: "Anderson .Paak",
        genre: "Hip-Hop",
        imageUrl: "/assets/image17.png"
      },
      {
        id: "artist18",
        name: "Floating Points",
        genre: "Electronic",
        imageUrl: "/assets/image18.png"
      },
      {
        id: "artist19",
        name: "Beach House",
        genre: "Dream Pop",
        imageUrl: "/assets/image19.png"
      },
      {
        id: "artist20",
        name: "Four Tet",
        genre: "Electronic",
        imageUrl: "/assets/image20.png"
      },
      {
        id: "artist21",
        name: "Solange",
        genre: "R&B",
        imageUrl: "/assets/image21.png"
      },
      {
        id: "artist22",
        name: "BadBadNotGood",
        genre: "Jazz",
        imageUrl: "/assets/image22.png"
      },
      {
        id: "artist23",
        name: "Little Dragon",
        genre: "Electronic",
        imageUrl: "/assets/image23.png"
      },
      {
        id: "artist24",
        name: "King Krule",
        genre: "Alternative",
        imageUrl: "/assets/image24.png"
      },
      {
        id: "artist25",
        name: "Kamasi Washington",
        genre: "Jazz",
        imageUrl: "/assets/image25.png"
      }
    ],
    
    // Curated discovery timeline data
    discoveryTimeline: [
      {
        daysAgo: 1,
        label: "Yesterday",
        artistIds: ["artist1", "artist3", "artist8"],
        plusCount: 2,
        genreStats: [
          { name: "music", percentage: "+0.00056%" },
          { name: "pop", percentage: "+0.04%" },
          { name: "jazz", percentage: "+0.03%" }
        ]
      },
      {
        daysAgo: 3,
        label: "3 days ago",
        artistIds: ["artist2", "artist5", "artist17", "artist10"],
        plusCount: 0,
        genreStats: [
          { name: "music", percentage: "+0.00042%" },
          { name: "hip-hop", percentage: "+0.05%" },
          { name: "r&b", percentage: "+0.02%" }
        ]
      },
      {
        daysAgo: 5,
        label: "5 days ago",
        artistIds: ["artist6", "artist19"],
        plusCount: 1,
        genreStats: [
          { name: "music", percentage: "+0.00038%" },
          { name: "pop", percentage: "+0.02%" },
          { name: "dream pop", percentage: "+0.01%" }
        ]
      },
      {
        daysAgo: 7,
        label: "7 days ago",
        artistIds: ["artist4", "artist12", "artist16", "artist24"],
        plusCount: 2,
        genreStats: [
          { name: "music", percentage: "+0.00056%" },
          { name: "alternative", percentage: "+0.04%" },
          { name: "funk", percentage: "+0.02%" }
        ]
      },
      {
        daysAgo: 10,
        label: "10 days ago",
        artistIds: ["artist7", "artist9", "artist15"],
        plusCount: 0,
        genreStats: [
          { name: "music", percentage: "+0.00031%" },
          { name: "electronic", percentage: "+0.05%" },
          { name: "downtempo", percentage: "+0.03%" }
        ]
      },
      {
        daysAgo: 12,
        label: "12 days ago",
        artistIds: ["artist8", "artist22", "artist25", "artist11", "artist13"],
        plusCount: 0,
        genreStats: [
          { name: "music", percentage: "+0.00062%" },
          { name: "jazz", percentage: "+0.07%" },
          { name: "r&b", percentage: "+0.03%" }
        ]
      },
      {
        daysAgo: 15,
        label: "15 days ago",
        artistIds: ["artist14", "artist21"],
        plusCount: 3,
        genreStats: [
          { name: "music", percentage: "+0.00035%" },
          { name: "r&b", percentage: "+0.06%" },
          { name: "soul", percentage: "+0.02%" }
        ]
      },
      {
        daysAgo: 18,
        label: "18 days ago",
        artistIds: ["artist18", "artist20", "artist23"],
        plusCount: 0,
        genreStats: [
          { name: "music", percentage: "+0.00037%" },
          { name: "electronic", percentage: "+0.06%" },
          { name: "ambient", percentage: "+0.04%" }
        ]
      },
      {
        daysAgo: 21,
        label: "3 weeks ago",
        artistIds: ["artist5", "artist17"],
        plusCount: 4,
        genreStats: [
          { name: "music", percentage: "+0.00044%" },
          { name: "hip-hop", percentage: "+0.07%" },
          { name: "rap", percentage: "+0.05%" }
        ]
      },
      {
        daysAgo: 28,
        label: "4 weeks ago",
        artistIds: ["artist3", "artist6"],
        plusCount: 5,
        genreStats: [
          { name: "music", percentage: "+0.00051%" },
          { name: "pop", percentage: "+0.08%" },
          { name: "dance", percentage: "+0.04%" }
        ]
      }
    ],
    
    // Find artist by ID
    getArtist: function(id) {
      return this.artists.find(artist => artist.id === id);
    },
    
    // Get a specific day's discovery data
    getDiscoveryDay: function(daysAgo) {
      return this.discoveryTimeline.find(day => day.daysAgo === daysAgo);
    },
    
    // Get all discovery days
    getAllDiscoveryDays: function() {
      return this.discoveryTimeline;
    },
    
  };
  
  export default artistData;