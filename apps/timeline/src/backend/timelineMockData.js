// ==================== MOCK DATA ====================

// Months for timeline grid
export const MONTHS_DATA = [
  { month: "December", year: 2025 },
  { month: "November", year: 2025 },
  { month: "October", year: 2025 },
  { month: "September", year: 2025 },
  { month: "August", year: 2025 },
  { month: "July", year: 2025 },
  { month: "June", year: 2025 },
  { month: "May", year: 2025 },
  { month: "April", year: 2025 },
  { month: "March", year: 2025 },
  { month: "February", year: 2025 },
  { month: "January", year: 2025 },
  { month: "December", year: 2024 },
  { month: "November", year: 2024 },
  { month: "October", year: 2024 },
  { month: "September", year: 2024 },
  { month: "August", year: 2024 },
  { month: "July", year: 2024 },
  { month: "June", year: 2024 },
  { month: "May", year: 2024 },
  { month: "April", year: 2024 },
  { month: "March", year: 2024 },
  { month: "February", year: 2024 },
  { month: "January", year: 2024 },
];

// Users for the bottom grid
export const USERS = [
  { id: "top", name: "Top Albums", isTopAlbums: true },
  { id: 1, name: "You", isYou: true },
  { id: 2, name: "Alex" },
  { id: 3, name: "Jordan" },
  { id: 4, name: "Sam" },
  { id: 5, name: "Riley" },
];

// Genre options (limited to six for zones 1 & 2)
export const GENRES = ["Hip-Hop", "Pop", "Rock", "Indie", "R&B", "Electronic"];

const TIMELINE_START_YEAR = 2015;
const TIMELINE_END_YEAR = 2025;
const FUTURE_TIMELINE_YEAR = TIMELINE_END_YEAR + 1;
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FULL_MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Generate timeline months in chronological order (left → right)
// 2015 → 2025 (then EXTENDED_TIMELINE_MONTHS appends 2026)
export const TIMELINE_MONTHS = (() => {
  const months = [];
  let index = 0;

  for (let year = TIMELINE_START_YEAR; year <= TIMELINE_END_YEAR; year += 1) {
    for (let month = 0; month < 12; month++) {
      months.push({
        index,
        name: MONTH_NAMES[month],
        fullName: FULL_MONTH_NAMES[month],
        year,
        monthNum: month, // 0 = January, 11 = December
        isYearStart: month === 0,
      });
      index++;
    }
  }

  return months;
})();

// Current month index - December 2025
export const CURRENT_MONTH_INDEX = TIMELINE_MONTHS.findIndex(
  (month) => month.year === TIMELINE_END_YEAR && month.monthNum === 11
);

// Extended months with 12 months into the future (full year 2026)
export const EXTENDED_TIMELINE_MONTHS = [
  ...TIMELINE_MONTHS,
  ...MONTH_NAMES.map((name, monthNum) => ({
    name,
    fullName: FULL_MONTH_NAMES[monthNum],
    year: FUTURE_TIMELINE_YEAR,
    monthNum,
    isFuture: true,
    isYearStart: monthNum === 0,
  })),
];

const FUTURE_YEAR_START_INDEX = TIMELINE_MONTHS.length;

// Anticipated artists (future releases) mapped to existing artists
// releaseMonth is based on the extended timeline index, where 2026 starts after December 2025.
export const ANTICIPATED_ARTISTS = [
  {
    id: "anticipated-1",
    sourceArtistId: 7,
    name: "Taylor Swift",
    initials: "TS",
    color: "#8E6B7A",
    releaseMonth: FUTURE_YEAR_START_INDEX + 2, // March 2026
    releaseDay: 15,
    releaseDate: "March 15, 2026",
    waitersCount: 3247,
    isAnticipated: true,
  },
  {
    id: "anticipated-2",
    sourceArtistId: 4,
    name: "Frank Ocean",
    initials: "FO",
    color: "#7B6B8E",
    releaseMonth: FUTURE_YEAR_START_INDEX + 6, // July 2026
    releaseDay: 12,
    releaseDate: "July 2026",
    waitersCount: 8947,
    isAnticipated: true,
  },
  {
    id: "anticipated-3",
    sourceArtistId: 2,
    name: "Kendrick Lamar",
    initials: "KL",
    color: "#8B7355",
    releaseMonth: FUTURE_YEAR_START_INDEX + 9, // October 2026
    releaseDay: 8,
    releaseDate: "October 2026",
    waitersCount: 12104,
    isAnticipated: true,
  },
];

// Followed artists with their albums and songs
// releaseMonth now based on: 0 = Jan 2022 ... 47 = Dec 2025, 48 = Jan 2026, etc.
export const FOLLOWED_ARTISTS = [
  { 
    id: 1, 
    name: "Tyler, The Creator", 
    initials: "TC", 
    color: "#5C6B5E", 
    releaseMonth: 47, // December 2025
    releaseDay: 4, 
    // Different rating levels for different views
    ratings: {
      forYou: 0.85,      // User's personal rating position
      mostRated: 0.78,   // Community average position
      volume: {          // Position by volume level
        low: 0.65,
        medium: 0.75,
        high: 0.88
      },
      genre: {           // Position by genre community
        "Hip-Hop": 0.92,
        "R&B": 0.70,
        "Pop": 0.55,
        "Indie": 0.80
      }
    },
    albums: [
      { id: 101, title: "CHROMAKOPIA", year: 2024, color: "#5C6B5E", userRating: 8.7 },
      { id: 102, title: "CALL ME IF YOU GET LOST", year: 2021, color: "#4A5A4C", userRating: 9.0 },
      { id: 103, title: "IGOR", year: 2019, color: "#E8B4BC", userRating: 9.1 },
      { id: 104, title: "Flower Boy", year: 2017, color: "#F5D76E", userRating: 9.3 },
      { id: 105, title: "Cherry Bomb", year: 2015, color: "#C75B5B", userRating: 7.4 },
    ],
    topSongs: [
      { id: 1001, title: "See You Again", likes: 2847, albumId: 104 },
      { id: 1002, title: "EARFQUAKE", likes: 2654, albumId: 103 },
      { id: 1003, title: "NEW MAGIC WAND", likes: 1893, albumId: 103 },
      { id: 1004, title: "WUSYANAME", likes: 1756, albumId: 102 },
      { id: 1005, title: "Noid", likes: 1502, albumId: 101 },
      { id: 1006, title: "St. Chroma", likes: 1344, albumId: 101 },
      { id: 1007, title: "LEMONHEAD", likes: 1201, albumId: 102 },
      { id: 1008, title: "A BOY IS A GUN", likes: 1156, albumId: 103 },
    ],
    albumTracks: {
      101: [
        { id: 10101, title: "St. Chroma", likes: 1344 },
        { id: 10102, title: "Rah Tah Tah", likes: 892 },
        { id: 10103, title: "Noid", likes: 1502 },
        { id: 10104, title: "Darling, I", likes: 756 },
        { id: 10105, title: "Hey Jane", likes: 621 },
        { id: 10106, title: "I Killed You", likes: 543 },
        { id: 10107, title: "Judge Judy", likes: 487 },
        { id: 10108, title: "Sticky", likes: 412 },
      ],
      102: [
        { id: 10201, title: "SIR BAUDELAIRE", likes: 987 },
        { id: 10202, title: "CORSO", likes: 1123 },
        { id: 10203, title: "LEMONHEAD", likes: 1201 },
        { id: 10204, title: "WUSYANAME", likes: 1756 },
        { id: 10205, title: "LUMBERJACK", likes: 1089 },
        { id: 10206, title: "HOT WIND BLOWS", likes: 876 },
        { id: 10207, title: "MASSA", likes: 654 },
        { id: 10208, title: "RUNITUP", likes: 543 },
      ],
      103: [
        { id: 10301, title: "IGOR'S THEME", likes: 1432 },
        { id: 10302, title: "EARFQUAKE", likes: 2654 },
        { id: 10303, title: "I THINK", likes: 1234 },
        { id: 10304, title: "BOYFRIEND", likes: 987 },
        { id: 10305, title: "RUNNING OUT OF TIME", likes: 765 },
        { id: 10306, title: "NEW MAGIC WAND", likes: 1893 },
        { id: 10307, title: "A BOY IS A GUN", likes: 1156 },
        { id: 10308, title: "PUPPET", likes: 654 },
      ],
      104: [
        { id: 10401, title: "Foreword", likes: 543 },
        { id: 10402, title: "Where This Flower Blooms", likes: 876 },
        { id: 10403, title: "Sometimes...", likes: 654 },
        { id: 10404, title: "See You Again", likes: 2847 },
        { id: 10405, title: "Who Dat Boy", likes: 1654 },
        { id: 10406, title: "Pothole", likes: 543 },
        { id: 10407, title: "Garden Shed", likes: 876 },
        { id: 10408, title: "Boredom", likes: 1234 },
      ],
      105: [
        { id: 10501, title: "DEATHCAMP", likes: 654 },
        { id: 10502, title: "BUFFALO", likes: 432 },
        { id: 10503, title: "PILOT", likes: 321 },
        { id: 10504, title: "RUN", likes: 543 },
        { id: 10505, title: "FIND YOUR WINGS", likes: 456 },
        { id: 10506, title: "BLOW MY LOAD", likes: 234 },
        { id: 10507, title: "2SEATER", likes: 567 },
        { id: 10508, title: "THE BROWN STAINS", likes: 345 },
      ],
    }
  },
  { 
    id: 2, 
    name: "Kendrick Lamar", 
    initials: "KL", 
    color: "#8B7355", 
    releaseMonth: 46, // November 2025
    releaseDay: 12, 
    ratings: {
      forYou: 0.92,
      mostRated: 0.95,
      volume: { low: 0.72, medium: 0.88, high: 0.96 },
      genre: { "Hip-Hop": 0.98, "R&B": 0.82, "Pop": 0.68, "Indie": 0.60 }
    },
    albums: [
      { id: 201, title: "GNX", year: 2024, color: "#8B7355", userRating: 8.9 },
      { id: 202, title: "Mr. Morale & The Big Steppers", year: 2022, color: "#6B5344", userRating: 8.2 },
      { id: 203, title: "DAMN.", year: 2017, color: "#C41E3A", userRating: 9.4 },
      { id: 204, title: "To Pimp a Butterfly", year: 2015, color: "#2F4F4F", userRating: 9.7 },
      { id: 205, title: "good kid, m.A.A.d city", year: 2012, color: "#1C1C1C", userRating: 9.6 },
    ],
    topSongs: [
      { id: 2001, title: "HUMBLE.", likes: 4521, albumId: 203 },
      { id: 2002, title: "DNA.", likes: 3876, albumId: 203 },
      { id: 2003, title: "Money Trees", likes: 3654, albumId: 205 },
      { id: 2004, title: "Alright", likes: 3421, albumId: 204 },
      { id: 2005, title: "Swimming Pools", likes: 3201, albumId: 205 },
      { id: 2006, title: "squabble up", likes: 2156, albumId: 201 },
      { id: 2007, title: "N95", likes: 1987, albumId: 202 },
      { id: 2008, title: "luther", likes: 1876, albumId: 201 },
    ],
    albumTracks: {
      201: [
        { id: 20101, title: "wacced out murals", likes: 1654 },
        { id: 20102, title: "squabble up", likes: 2156 },
        { id: 20103, title: "luther", likes: 1876 },
        { id: 20104, title: "man at the garden", likes: 1234 },
        { id: 20105, title: "hey now", likes: 987 },
        { id: 20106, title: "reincarnated", likes: 876 },
        { id: 20107, title: "tv off", likes: 1123 },
        { id: 20108, title: "heart pt. 6", likes: 1456 },
      ],
      202: [
        { id: 20201, title: "United in Grief", likes: 1234 },
        { id: 20202, title: "N95", likes: 1987 },
        { id: 20203, title: "Worldwide Steppers", likes: 876 },
        { id: 20204, title: "Die Hard", likes: 1543 },
        { id: 20205, title: "Father Time", likes: 1654 },
        { id: 20206, title: "Rich Spirit", likes: 1321 },
        { id: 20207, title: "We Cry Together", likes: 987 },
        { id: 20208, title: "Silent Hill", likes: 765 },
      ],
      203: [
        { id: 20301, title: "BLOOD.", likes: 654 },
        { id: 20302, title: "DNA.", likes: 3876 },
        { id: 20303, title: "YAH.", likes: 876 },
        { id: 20304, title: "ELEMENT.", likes: 1654 },
        { id: 20305, title: "FEEL.", likes: 1234 },
        { id: 20306, title: "LOYALTY.", likes: 1876 },
        { id: 20307, title: "PRIDE.", likes: 1432 },
        { id: 20308, title: "HUMBLE.", likes: 4521 },
      ],
      204: [
        { id: 20401, title: "Wesley's Theory", likes: 1654 },
        { id: 20402, title: "For Free?", likes: 987 },
        { id: 20403, title: "King Kunta", likes: 2876 },
        { id: 20404, title: "Institutionalized", likes: 1234 },
        { id: 20405, title: "These Walls", likes: 1654 },
        { id: 20406, title: "u", likes: 1432 },
        { id: 20407, title: "Alright", likes: 3421 },
        { id: 20408, title: "The Blacker the Berry", likes: 2156 },
      ],
      205: [
        { id: 20501, title: "Sherane", likes: 1234 },
        { id: 20502, title: "Bitch, Don't Kill My Vibe", likes: 2654 },
        { id: 20503, title: "Backseat Freestyle", likes: 1987 },
        { id: 20504, title: "The Art of Peer Pressure", likes: 1654 },
        { id: 20505, title: "Money Trees", likes: 3654 },
        { id: 20506, title: "Poetic Justice", likes: 2321 },
        { id: 20507, title: "Swimming Pools", likes: 3201 },
        { id: 20508, title: "Sing About Me", likes: 2876 },
      ],
    }
  },
  { 
    id: 3, 
    name: "Billie Eilish", 
    initials: "BE", 
    color: "#5E6B5C", 
    releaseMonth: 44, // September 2025
    releaseDay: 17, 
    ratings: {
      forYou: 0.78,
      mostRated: 0.82,
      volume: { low: 0.88, medium: 0.80, high: 0.72 },
      genre: { "Hip-Hop": 0.45, "R&B": 0.72, "Pop": 0.92, "Indie": 0.85 }
    },
    albums: [
      { id: 301, title: "HIT ME HARD AND SOFT", year: 2024, color: "#5E6B5C", userRating: 8.5 },
      { id: 302, title: "Happier Than Ever", year: 2021, color: "#8B7D6B", userRating: 8.8 },
      { id: 303, title: "When We All Fall Asleep", year: 2019, color: "#1C1C1C", userRating: 8.7 },
      { id: 304, title: "dont smile at me", year: 2017, color: "#FFE4B5", userRating: 8.0 },
      { id: 305, title: "Guitar Songs", year: 2022, color: "#4A5A4C", userRating: 7.2 },
    ],
    topSongs: [
      { id: 3001, title: "bad guy", likes: 5234, albumId: 303 },
      { id: 3002, title: "Happier Than Ever", likes: 3876, albumId: 302 },
      { id: 3003, title: "BIRDS OF A FEATHER", likes: 2987, albumId: 301 },
      { id: 3004, title: "ocean eyes", likes: 2876, albumId: 304 },
      { id: 3005, title: "when the party's over", likes: 2654, albumId: 303 },
      { id: 3006, title: "lovely", likes: 2543, albumId: 303 },
      { id: 3007, title: "LUNCH", likes: 2123, albumId: 301 },
      { id: 3008, title: "everything i wanted", likes: 1987, albumId: 302 },
    ],
    albumTracks: {
      301: [
        { id: 30101, title: "SKINNY", likes: 1654 },
        { id: 30102, title: "LUNCH", likes: 2123 },
        { id: 30103, title: "CHIHIRO", likes: 1876 },
        { id: 30104, title: "BIRDS OF A FEATHER", likes: 2987 },
        { id: 30105, title: "WILDFLOWER", likes: 1654 },
        { id: 30106, title: "THE GREATEST", likes: 1432 },
        { id: 30107, title: "L'AMOUR DE MA VIE", likes: 1234 },
        { id: 30108, title: "BLUE", likes: 1543 },
      ],
      302: [
        { id: 30201, title: "Getting Older", likes: 1234 },
        { id: 30202, title: "I Didn't Change My Number", likes: 987 },
        { id: 30203, title: "Billie Bossa Nova", likes: 1123 },
        { id: 30204, title: "my future", likes: 1654 },
        { id: 30205, title: "Oxytocin", likes: 1432 },
        { id: 30206, title: "NDA", likes: 1321 },
        { id: 30207, title: "Therefore I Am", likes: 1876 },
        { id: 30208, title: "Happier Than Ever", likes: 3876 },
      ],
      303: [
        { id: 30301, title: "!!!!!!!!", likes: 654 },
        { id: 30302, title: "bad guy", likes: 5234 },
        { id: 30303, title: "xanny", likes: 1234 },
        { id: 30304, title: "you should see me in a crown", likes: 1654 },
        { id: 30305, title: "all the good girls go to hell", likes: 1432 },
        { id: 30306, title: "wish you were gay", likes: 1543 },
        { id: 30307, title: "when the party's over", likes: 2654 },
        { id: 30308, title: "bury a friend", likes: 1987 },
      ],
      304: [
        { id: 30401, title: "COPYCAT", likes: 1234 },
        { id: 30402, title: "idontwannabeyouanymore", likes: 1654 },
        { id: 30403, title: "my boy", likes: 987 },
        { id: 30404, title: "watch", likes: 876 },
        { id: 30405, title: "party favor", likes: 1123 },
        { id: 30406, title: "bellyache", likes: 1432 },
        { id: 30407, title: "ocean eyes", likes: 2876 },
        { id: 30408, title: "&burn", likes: 765 },
      ],
      305: [
        { id: 30501, title: "TV", likes: 1654 },
        { id: 30502, title: "The 30th", likes: 1234 },
      ],
    }
  },
  { 
    id: 4, 
    name: "Frank Ocean", 
    initials: "FO", 
    color: "#5C6B7B", 
    releaseMonth: 41, // June 2025
    releaseDay: 8, 
    ratings: {
      forYou: 0.95,
      mostRated: 0.90,
      volume: { low: 0.55, medium: 0.82, high: 0.95 },
      genre: { "Hip-Hop": 0.78, "R&B": 0.98, "Pop": 0.72, "Indie": 0.88 }
    },
    albums: [
      { id: 401, title: "Blonde", year: 2016, color: "#5C6B7B", userRating: 9.8 },
      { id: 402, title: "Endless", year: 2016, color: "#2F2F2F", userRating: 8.3 },
      { id: 403, title: "channel ORANGE", year: 2012, color: "#FF8C00", userRating: 9.6 },
      { id: 404, title: "nostalgia, ULTRA", year: 2011, color: "#E67300", userRating: 8.1 },
      { id: 405, title: "Homer", year: 2021, color: "#4A6B7B", userRating: 7.8 },
    ],
    topSongs: [
      { id: 4001, title: "Nights", likes: 4876, albumId: 401 },
      { id: 4002, title: "Pink + White", likes: 4234, albumId: 401 },
      { id: 4003, title: "Thinkin Bout You", likes: 3987, albumId: 403 },
      { id: 4004, title: "Self Control", likes: 3654, albumId: 401 },
      { id: 4005, title: "Pyramids", likes: 3432, albumId: 403 },
      { id: 4006, title: "Ivy", likes: 3123, albumId: 401 },
      { id: 4007, title: "Solo", likes: 2876, albumId: 401 },
      { id: 4008, title: "White Ferrari", likes: 2654, albumId: 401 },
    ],
    albumTracks: {
      401: [
        { id: 40101, title: "Nikes", likes: 2432 },
        { id: 40102, title: "Ivy", likes: 3123 },
        { id: 40103, title: "Pink + White", likes: 4234 },
        { id: 40104, title: "Solo", likes: 2876 },
        { id: 40105, title: "Skyline To", likes: 1654 },
        { id: 40106, title: "Self Control", likes: 3654 },
        { id: 40107, title: "Nights", likes: 4876 },
        { id: 40108, title: "White Ferrari", likes: 2654 },
      ],
      402: [
        { id: 40201, title: "Device Control", likes: 876 },
        { id: 40202, title: "At Your Best", likes: 1654 },
        { id: 40203, title: "Wither", likes: 1234 },
        { id: 40204, title: "Rushes", likes: 1876 },
        { id: 40205, title: "Rushes To", likes: 1123 },
        { id: 40206, title: "Higgs", likes: 1987 },
        { id: 40207, title: "Unity", likes: 765 },
        { id: 40208, title: "Impietas / Deathwish", likes: 654 },
      ],
      403: [
        { id: 40301, title: "Start", likes: 543 },
        { id: 40302, title: "Thinkin Bout You", likes: 3987 },
        { id: 40303, title: "Sierra Leone", likes: 1234 },
        { id: 40304, title: "Sweet Life", likes: 1654 },
        { id: 40305, title: "Super Rich Kids", likes: 2432 },
        { id: 40306, title: "Pilot Jones", likes: 1123 },
        { id: 40307, title: "Pyramids", likes: 3432 },
        { id: 40308, title: "Lost", likes: 1876 },
      ],
      404: [
        { id: 40401, title: "Street Fighter", likes: 876 },
        { id: 40402, title: "Novacane", likes: 2654 },
        { id: 40403, title: "We All Try", likes: 987 },
        { id: 40404, title: "Songs for Women", likes: 1234 },
        { id: 40405, title: "Swim Good", likes: 2123 },
        { id: 40406, title: "There Will Be Tears", likes: 1432 },
        { id: 40407, title: "Strawberry Swing", likes: 1654 },
        { id: 40408, title: "Nature Feels", likes: 876 },
      ],
      405: [
        { id: 40501, title: "Cayendo", likes: 1654 },
        { id: 40502, title: "Dear April", likes: 1876 },
      ],
    }
  },
  { 
    id: 5, 
    name: "Travis Scott", 
    initials: "TS", 
    color: "#6B5C5C", 
    releaseMonth: 41, // June 2025
    releaseDay: 22, 
    ratings: {
      forYou: 0.65,
      mostRated: 0.75,
      volume: { low: 0.45, medium: 0.70, high: 0.85 },
      genre: { "Hip-Hop": 0.88, "R&B": 0.55, "Pop": 0.62, "Indie": 0.35 }
    },
    albums: [
      { id: 501, title: "UTOPIA", year: 2023, color: "#6B5C5C", userRating: 8.1 },
      { id: 502, title: "ASTROWORLD", year: 2018, color: "#FFD700", userRating: 9.0 },
      { id: 503, title: "Birds in the Trap", year: 2016, color: "#8B4513", userRating: 7.5 },
      { id: 504, title: "Rodeo", year: 2015, color: "#1C1C1C", userRating: 8.4 },
      { id: 505, title: "Days Before Rodeo", year: 2014, color: "#4A3728", userRating: 7.1 },
    ],
    topSongs: [
      { id: 5001, title: "SICKO MODE", likes: 5432, albumId: 502 },
      { id: 5002, title: "goosebumps", likes: 4321, albumId: 503 },
      { id: 5003, title: "Antidote", likes: 3876, albumId: 504 },
      { id: 5004, title: "HIGHEST IN THE ROOM", likes: 3654, albumId: 501 },
      { id: 5005, title: "FE!N", likes: 3234, albumId: 501 },
      { id: 5006, title: "STARGAZING", likes: 2987, albumId: 502 },
      { id: 5007, title: "90210", likes: 2765, albumId: 504 },
      { id: 5008, title: "MY EYES", likes: 2432, albumId: 501 },
    ],
    albumTracks: {
      501: [
        { id: 50101, title: "HYAENA", likes: 1654 },
        { id: 50102, title: "THANK GOD", likes: 1876 },
        { id: 50103, title: "MODERN JAM", likes: 1432 },
        { id: 50104, title: "MY EYES", likes: 2432 },
        { id: 50105, title: "GODS COUNTRY", likes: 1234 },
        { id: 50106, title: "SIRENS", likes: 1543 },
        { id: 50107, title: "MELTDOWN", likes: 1876 },
        { id: 50108, title: "FE!N", likes: 3234 },
      ],
      502: [
        { id: 50201, title: "STARGAZING", likes: 2987 },
        { id: 50202, title: "CAROUSEL", likes: 1654 },
        { id: 50203, title: "SICKO MODE", likes: 5432 },
        { id: 50204, title: "R.I.P. SCREW", likes: 1432 },
        { id: 50205, title: "STOP TRYING TO BE GOD", likes: 1876 },
        { id: 50206, title: "NO BYSTANDERS", likes: 1654 },
        { id: 50207, title: "SKELETONS", likes: 1987 },
        { id: 50208, title: "ASTROTHUNDER", likes: 2123 },
      ],
      503: [
        { id: 50301, title: "the ends", likes: 1234 },
        { id: 50302, title: "way back", likes: 1654 },
        { id: 50303, title: "coordinate", likes: 1123 },
        { id: 50304, title: "through the late night", likes: 1432 },
        { id: 50305, title: "beibs in the trap", likes: 1234 },
        { id: 50306, title: "sdp interlude", likes: 1654 },
        { id: 50307, title: "goosebumps", likes: 4321 },
        { id: 50308, title: "pick up the phone", likes: 2432 },
      ],
      504: [
        { id: 50401, title: "Pornography", likes: 1432 },
        { id: 50402, title: "Oh My Dis Side", likes: 1876 },
        { id: 50403, title: "3500", likes: 1654 },
        { id: 50404, title: "Wasted", likes: 1234 },
        { id: 50405, title: "90210", likes: 2765 },
        { id: 50406, title: "Piss On Your Grave", likes: 987 },
        { id: 50407, title: "Antidote", likes: 3876 },
        { id: 50408, title: "Impossible", likes: 1543 },
      ],
      505: [
        { id: 50501, title: "Days Before Rodeo", likes: 1234 },
        { id: 50502, title: "Mamacita", likes: 1654 },
        { id: 50503, title: "Quintana Pt 2", likes: 1432 },
        { id: 50504, title: "Don't Play", likes: 1123 },
        { id: 50505, title: "Drugs You Should Try", likes: 2123 },
        { id: 50506, title: "Skyfall", likes: 1876 },
        { id: 50507, title: "Grey", likes: 987 },
        { id: 50508, title: "Backyard", likes: 1234 },
      ],
    }
  },
  { 
    id: 6, 
    name: "SZA", 
    initials: "SZ", 
    color: "#6B8E8E", 
    releaseMonth: 39, // April 2025
    releaseDay: 15, 
    ratings: {
      forYou: 0.72,
      mostRated: 0.85,
      volume: { low: 0.78, medium: 0.82, high: 0.88 },
      genre: { "Hip-Hop": 0.72, "R&B": 0.95, "Pop": 0.82, "Indie": 0.68 }
    },
    albums: [
      { id: 601, title: "SOS", year: 2022, color: "#6B8E8E", userRating: 8.6 },
      { id: 602, title: "Ctrl", year: 2017, color: "#8E6B6B", userRating: 9.1 },
      { id: 603, title: "Z", year: 2014, color: "#5E8E6B", userRating: 7.8 },
      { id: 604, title: "See.SZA.Run", year: 2012, color: "#6B6B8E", userRating: 6.9 },
      { id: 605, title: "LANA", year: 2024, color: "#8E8E6B", userRating: null },
    ],
    topSongs: [
      { id: 6001, title: "Kill Bill", likes: 5876, albumId: 601 },
      { id: 6002, title: "Love Galore", likes: 4321, albumId: 602 },
      { id: 6003, title: "Good Days", likes: 3987, albumId: 601 },
      { id: 6004, title: "The Weekend", likes: 3654, albumId: 602 },
      { id: 6005, title: "Kiss Me More", likes: 3432, albumId: 601 },
      { id: 6006, title: "Snooze", likes: 3123, albumId: 601 },
      { id: 6007, title: "Drew Barrymore", likes: 2876, albumId: 602 },
      { id: 6008, title: "Shirt", likes: 2543, albumId: 601 },
    ],
    albumTracks: {
      601: [
        { id: 60101, title: "SOS", likes: 1876 },
        { id: 60102, title: "Kill Bill", likes: 5876 },
        { id: 60103, title: "Seek & Destroy", likes: 1654 },
        { id: 60104, title: "Low", likes: 1432 },
        { id: 60105, title: "Love Language", likes: 1876 },
        { id: 60106, title: "Blind", likes: 1543 },
        { id: 60107, title: "Used", likes: 1234 },
        { id: 60108, title: "Snooze", likes: 3123 },
      ],
      602: [
        { id: 60201, title: "Supermodel", likes: 1654 },
        { id: 60202, title: "Love Galore", likes: 4321 },
        { id: 60203, title: "Doves in the Wind", likes: 1432 },
        { id: 60204, title: "Drew Barrymore", likes: 2876 },
        { id: 60205, title: "Prom", likes: 1234 },
        { id: 60206, title: "The Weekend", likes: 3654 },
        { id: 60207, title: "Go Gina", likes: 1123 },
        { id: 60208, title: "Garden", likes: 1543 },
      ],
      603: [
        { id: 60301, title: "Ur", likes: 987 },
        { id: 60302, title: "Julia", likes: 1123 },
        { id: 60303, title: "Sweet November", likes: 876 },
        { id: 60304, title: "Babylon", likes: 1432 },
        { id: 60305, title: "Warm Winds", likes: 765 },
        { id: 60306, title: "Shattered Ring", likes: 654 },
        { id: 60307, title: "Omega", likes: 876 },
        { id: 60308, title: "Childs Play", likes: 987 },
      ],
      604: [
        { id: 60401, title: "Ice Moon", likes: 543 },
        { id: 60402, title: "Pray", likes: 654 },
        { id: 60403, title: "Country", likes: 432 },
        { id: 60404, title: "Aftermath", likes: 543 },
        { id: 60405, title: "Time Travel Undone", likes: 321 },
        { id: 60406, title: "Bed", likes: 432 },
      ],
      605: [
        { id: 60501, title: "LANA", likes: 1654 },
        { id: 60502, title: "Saturn", likes: 2432 },
        { id: 60503, title: "Drive", likes: 1234 },
        { id: 60504, title: "BMF", likes: 1543 },
      ],
    }
  },
  { 
    id: 7, 
    name: "Taylor Swift", 
    initials: "TS", 
    color: "#7B6B6B", 
    releaseMonth: 37, // February 2025
    releaseDay: 26, 
    ratings: {
      forYou: 0.88,
      mostRated: 0.92,
      volume: { low: 0.95, medium: 0.90, high: 0.78 },
      genre: { "Hip-Hop": 0.25, "R&B": 0.42, "Pop": 0.98, "Indie": 0.75, "Country": 0.88 }
    },
    albums: [
      { id: 701, title: "The Tortured Poets Department", year: 2024, color: "#7B6B6B", userRating: 8.4 },
      { id: 702, title: "Midnights", year: 2022, color: "#1C3D5A", userRating: 8.1 },
      { id: 703, title: "evermore", year: 2020, color: "#8B7355", userRating: 8.7 },
      { id: 704, title: "folklore", year: 2020, color: "#9B9B9B", userRating: 9.0 },
      { id: 705, title: "1989", year: 2014, color: "#87CEEB", userRating: 9.2 },
    ],
    topSongs: [
      { id: 7001, title: "Anti-Hero", likes: 6234, albumId: 702 },
      { id: 7002, title: "Shake It Off", likes: 5876, albumId: 705 },
      { id: 7003, title: "Blank Space", likes: 5432, albumId: 705 },
      { id: 7004, title: "cardigan", likes: 4321, albumId: 704 },
      { id: 7005, title: "Fortnight", likes: 3987, albumId: 701 },
      { id: 7006, title: "willow", likes: 3654, albumId: 703 },
      { id: 7007, title: "Lavender Haze", likes: 3432, albumId: 702 },
      { id: 7008, title: "august", likes: 3123, albumId: 704 },
    ],
    albumTracks: {
      701: [
        { id: 70101, title: "Fortnight", likes: 3987 },
        { id: 70102, title: "The Tortured Poets Department", likes: 2654 },
        { id: 70103, title: "My Boy Only Breaks His Favorite Toys", likes: 1876 },
        { id: 70104, title: "Down Bad", likes: 2123 },
        { id: 70105, title: "So Long, London", likes: 1987 },
        { id: 70106, title: "But Daddy I Love Him", likes: 1654 },
        { id: 70107, title: "Fresh Out The Slammer", likes: 1432 },
        { id: 70108, title: "Florida!!!", likes: 1876 },
      ],
      702: [
        { id: 70201, title: "Lavender Haze", likes: 3432 },
        { id: 70202, title: "Maroon", likes: 2123 },
        { id: 70203, title: "Anti-Hero", likes: 6234 },
        { id: 70204, title: "Snow On The Beach", likes: 1987 },
        { id: 70205, title: "You're On Your Own, Kid", likes: 2432 },
        { id: 70206, title: "Midnight Rain", likes: 1876 },
        { id: 70207, title: "Bejeweled", likes: 1654 },
        { id: 70208, title: "Karma", likes: 2543 },
      ],
      703: [
        { id: 70301, title: "willow", likes: 3654 },
        { id: 70302, title: "champagne problems", likes: 3123 },
        { id: 70303, title: "gold rush", likes: 1876 },
        { id: 70304, title: "'tis the damn season", likes: 2123 },
        { id: 70305, title: "tolerate it", likes: 1987 },
        { id: 70306, title: "no body, no crime", likes: 2432 },
        { id: 70307, title: "happiness", likes: 1432 },
        { id: 70308, title: "ivy", likes: 1876 },
      ],
      704: [
        { id: 70401, title: "the 1", likes: 2123 },
        { id: 70402, title: "cardigan", likes: 4321 },
        { id: 70403, title: "the last great american dynasty", likes: 1987 },
        { id: 70404, title: "exile", likes: 2876 },
        { id: 70405, title: "my tears ricochet", likes: 1876 },
        { id: 70406, title: "mirrorball", likes: 1654 },
        { id: 70407, title: "seven", likes: 1987 },
        { id: 70408, title: "august", likes: 3123 },
      ],
      705: [
        { id: 70501, title: "Welcome to New York", likes: 1876 },
        { id: 70502, title: "Blank Space", likes: 5432 },
        { id: 70503, title: "Style", likes: 3432 },
        { id: 70504, title: "Out Of The Woods", likes: 2654 },
        { id: 70505, title: "All You Had To Do Was Stay", likes: 1234 },
        { id: 70506, title: "Shake It Off", likes: 5876 },
        { id: 70507, title: "Wildest Dreams", likes: 3987 },
        { id: 70508, title: "Bad Blood", likes: 2876 },
      ],
    }
  },
  { 
    id: 8, 
    name: "Beyoncé", 
    initials: "BY", 
    color: "#6B6B5C", 
    releaseMonth: 36, // January 2025
    releaseDay: 6, 
    ratings: {
      forYou: 0.82,
      mostRated: 0.88,
      volume: { low: 0.75, medium: 0.85, high: 0.92 },
      genre: { "Hip-Hop": 0.72, "R&B": 0.98, "Pop": 0.92, "Country": 0.85 }
    },
    albums: [
      { id: 801, title: "COWBOY CARTER", year: 2024, color: "#6B6B5C", userRating: 8.9 },
      { id: 802, title: "RENAISSANCE", year: 2022, color: "#C0C0C0", userRating: 9.2 },
      { id: 803, title: "Lemonade", year: 2016, color: "#FFD700", userRating: 9.5 },
      { id: 804, title: "Beyoncé", year: 2013, color: "#1C1C1C", userRating: 8.6 },
      { id: 805, title: "4", year: 2011, color: "#8B0000", userRating: 8.3 },
    ],
    topSongs: [
      { id: 8001, title: "TEXAS HOLD 'EM", likes: 4876, albumId: 801 },
      { id: 8002, title: "BREAK MY SOUL", likes: 4321, albumId: 802 },
      { id: 8003, title: "Formation", likes: 4123, albumId: 803 },
      { id: 8004, title: "Drunk in Love", likes: 3876, albumId: 804 },
      { id: 8005, title: "Halo", likes: 3654, albumId: 805 },
      { id: 8006, title: "CUFF IT", likes: 3432, albumId: 802 },
      { id: 8007, title: "Freedom", likes: 2987, albumId: 803 },
      { id: 8008, title: "16 CARRIAGES", likes: 2654, albumId: 801 },
    ],
    albumTracks: {
      801: [
        { id: 80101, title: "AMERIICAN REQUIEM", likes: 1654 },
        { id: 80102, title: "BLACKBIIRD", likes: 1876 },
        { id: 80103, title: "16 CARRIAGES", likes: 2654 },
        { id: 80104, title: "PROTECTOR", likes: 1432 },
        { id: 80105, title: "MY ROSE", likes: 1234 },
        { id: 80106, title: "SMOKE HOUR", likes: 1543 },
        { id: 80107, title: "TEXAS HOLD 'EM", likes: 4876 },
        { id: 80108, title: "BODYGUARD", likes: 1876 },
      ],
      802: [
        { id: 80201, title: "I'M THAT GIRL", likes: 1654 },
        { id: 80202, title: "COZY", likes: 1876 },
        { id: 80203, title: "ALIEN SUPERSTAR", likes: 2432 },
        { id: 80204, title: "CUFF IT", likes: 3432 },
        { id: 80205, title: "ENERGY", likes: 1234 },
        { id: 80206, title: "BREAK MY SOUL", likes: 4321 },
        { id: 80207, title: "CHURCH GIRL", likes: 1876 },
        { id: 80208, title: "VIRGO'S GROOVE", likes: 2123 },
      ],
      803: [
        { id: 80301, title: "Pray You Catch Me", likes: 1234 },
        { id: 80302, title: "Hold Up", likes: 2654 },
        { id: 80303, title: "Don't Hurt Yourself", likes: 1876 },
        { id: 80304, title: "Sorry", likes: 2987 },
        { id: 80305, title: "6 Inch", likes: 1654 },
        { id: 80306, title: "Daddy Lessons", likes: 1876 },
        { id: 80307, title: "Freedom", likes: 2987 },
        { id: 80308, title: "Formation", likes: 4123 },
      ],
      804: [
        { id: 80401, title: "Pretty Hurts", likes: 1654 },
        { id: 80402, title: "Haunted", likes: 1234 },
        { id: 80403, title: "Drunk in Love", likes: 3876 },
        { id: 80404, title: "Blow", likes: 1432 },
        { id: 80405, title: "No Angel", likes: 1123 },
        { id: 80406, title: "Partition", likes: 2654 },
        { id: 80407, title: "Jealous", likes: 1234 },
        { id: 80408, title: "Rocket", likes: 987 },
      ],
      805: [
        { id: 80501, title: "1+1", likes: 1876 },
        { id: 80502, title: "I Care", likes: 1234 },
        { id: 80503, title: "I Miss You", likes: 1123 },
        { id: 80504, title: "Best Thing I Never Had", likes: 2432 },
        { id: 80505, title: "Party", likes: 1654 },
        { id: 80506, title: "Love On Top", likes: 3123 },
        { id: 80507, title: "Countdown", likes: 1876 },
        { id: 80508, title: "Run the World", likes: 2654 },
      ],
    }
  },
];

// Top albums for the default view
export const TOP_ALBUMS = [
  { id: 1, title: "The Tortured Poets Department", artist: "Taylor Swift", initials: "TS", color: "#7B6B6B", featured: true },
  { id: 2, title: "UTOPIA", artist: "Travis Scott", initials: "TS", color: "#6B5C5C" },
  { id: 3, title: "Austin", artist: "Post Malone", initials: "PM", color: "#8B8B7B" },
  { id: 4, title: "One Thing at a Time", artist: "Morgan Wallen", initials: "MW", color: "#7B6B5C" },
  { id: 5, title: "Jackman.", artist: "Jack Harlow", initials: "JH", color: "#5C7B6B" },
  { id: 6, title: "Woodland", artist: "The Smile", initials: "TS", color: "#6B7B5C" },
  { id: 7, title: "Songs of...", artist: "U2", initials: "U2", color: "#5C6B7B" },
  { id: 8, title: "The Ballad...", artist: "Blur", initials: "BL", color: "#7B5C6B" },
  { id: 9, title: "Clarity", artist: "Zedd", initials: "ZD", color: "#6B5C7B" },
];

// Artists for the bottom grid
export const GRID_ARTISTS = [
  "Post Malone", "Khalid", "Taylor Swift", "Travis Scott",
  "Morgan Wallen", "Jack Harlow", "Blur", "U2", "The Weeknd", "Dua Lipa",
];

// Helper functions
export const getRandomArtist = (seed) => GRID_ARTISTS[seed % GRID_ARTISTS.length];
export const hasAlbum = (userId, monthIndex) => ((userId * 13 + monthIndex * 29) % 10) < 5;
export const getRanking = (seed) => Math.floor((seed % 100) + 1);
export const getGradient = (userId, monthIndex) => {
  const angle = (userId + monthIndex) * 40;
  return `linear-gradient(${angle}deg, #282B29 0%, #1a1a1a 50%, #282B29 100%)`;
};
