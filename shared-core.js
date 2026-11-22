/* ==========================================================================
   TrueCrimeFinder Web Suite — shared-core.js
   Unified storage (truecrimefinder_state_v1), IndexedDB cache
   (TrueCrimeFinderCacheDB v2), Private GitHub Gist auto-sync with tombstones
   (truecrimefinder-sync.json), 12-Network Registry, Canonical True Crime
   Dossier Catalog + Live TVMaze / iTunes Podcasts / Wikipedia / TMDB Engine,
   3-Layer Forensic Taxonomy Find Vibe, and Accessible Case Detail Modal.
   ========================================================================== */

(function (global) {
  'use strict';

  const STATE_KEY = 'truecrimefinder_state_v1';
  const DB_NAME = 'TrueCrimeFinderCacheDB';
  const DB_VERSION = 2;
  const GIST_FILENAME = 'truecrimefinder-sync.json';
  const LEGACY_GIST_FILENAME = 'truecrimefinder-state.json';

  const TTL_DYNAMIC = 20 * 60 * 1000;      // 20 min for live feeds
  const TTL_STABLE = 24 * 60 * 60 * 1000;  // 24 hours for taxonomy & metadata

  const WATCHLIST_STATUSES = [
    'Investigating',
    'Case Backlog',
    'Closed / Watched',
    'Cold / On Hold',
    'Abandoned'
  ];

  // Case Status & Release Track classification options
  // Note: When Episode Release Delay (dubLag) is set to 0, automatically switches to Simul-Release!
  const DUB_OPTIONS = [
    '',
    'Solved',
    'Cold Case',
    'Exonerated',
    'Ongoing Trial',
    'Staggered Release',
    'Simul-Release'
  ];

  // Centralized 12-Network & True Crime Platform Registry
  const PLATFORM_CONFIG = [
    {
      id: 'netflix',
      name: 'Netflix',
      licensedBy: 'Netflix',
      licensedByValues: ['Netflix'],
      aliases: ['netflix'],
      domains: ['netflix.com'],
      color: '#ef4444',
      freeWithAds: false,
      searchUrl: t => `https://www.netflix.com/search?q=${encodeURIComponent(t)}`
    },
    {
      id: 'max',
      name: 'Max / HBO',
      licensedBy: 'HBO',
      licensedByValues: ['HBO', 'Max', 'HBO Documentary Films', 'HBO Max'],
      aliases: ['hbo', 'max', 'hbo max', 'hbo documentary'],
      domains: ['max.com', 'hbomax.com', 'hbo.com'],
      color: '#818cf8',
      freeWithAds: false,
      searchUrl: t => `https://play.max.com/search/result?q=${encodeURIComponent(t)}`
    },
    {
      id: 'hulu',
      name: 'Hulu',
      licensedBy: 'Hulu',
      licensedByValues: ['Hulu', 'ABC News Studios', 'FX'],
      aliases: ['hulu', 'abc news', '20/20', 'fx'],
      domains: ['hulu.com'],
      color: '#34d399',
      freeWithAds: false,
      searchUrl: t => `https://www.hulu.com/search?q=${encodeURIComponent(t)}`
    },
    {
      id: 'peacock',
      name: 'Peacock',
      licensedBy: 'Peacock',
      licensedByValues: ['Peacock', 'NBC', 'Dateline NBC'],
      aliases: ['peacock', 'nbc', 'dateline'],
      domains: ['peacocktv.com', 'nbc.com'],
      color: '#38bdf8',
      freeWithAds: false,
      searchUrl: t => `https://www.peacocktv.com/watch/search?q=${encodeURIComponent(t)}`
    },
    {
      id: 'id',
      name: 'Investigation Discovery',
      licensedBy: 'Investigation Discovery',
      licensedByValues: ['Investigation Discovery', 'ID', 'Discovery+'],
      aliases: ['investigation discovery', 'discovery+', 'discovery plus', 'id channel'],
      domains: ['investigationdiscovery.com', 'discoveryplus.com'],
      color: '#f97316',
      freeWithAds: false,
      searchUrl: t => `https://www.discoveryplus.com/search?q=${encodeURIComponent(t)}`
    },
    {
      id: 'oxygen',
      name: 'Oxygen True Crime',
      licensedBy: 'Oxygen',
      licensedByValues: ['Oxygen', 'Oxygen True Crime'],
      aliases: ['oxygen', 'oxygen true crime'],
      domains: ['oxygen.com'],
      color: '#ec4899',
      freeWithAds: false,
      searchUrl: t => `https://www.oxygen.com/search?search=${encodeURIComponent(t)}`
    },
    {
      id: 'paramount',
      name: 'Paramount+ / CBS',
      licensedBy: 'Paramount+',
      licensedByValues: ['Paramount+', 'CBS', 'CBS News', 'Showtime', '48 Hours'],
      aliases: ['paramount+', 'paramount plus', 'cbs', '48 hours', 'showtime'],
      domains: ['paramountplus.com', 'cbsnews.com'],
      color: '#60a5fa',
      freeWithAds: false,
      searchUrl: t => `https://www.paramountplus.com/search/?q=${encodeURIComponent(t)}`
    },
    {
      id: 'prime',
      name: 'Prime Video',
      licensedBy: 'Prime Video',
      licensedByValues: ['Prime Video', 'Amazon Studios', 'Amazon Prime Video'],
      aliases: ['amazon', 'prime video', 'amazon prime', 'freevee'],
      domains: ['amazon.com', 'primevideo.com', 'watch.amazon.com'],
      color: '#0ea5e9',
      freeWithAds: false,
      searchUrl: t => `https://www.amazon.com/s?k=${encodeURIComponent(t)}&i=instant-video`
    },
    {
      id: 'appletv',
      name: 'Apple TV+',
      licensedBy: 'Apple TV+',
      licensedByValues: ['Apple TV+'],
      aliases: ['apple tv+', 'apple tv'],
      domains: ['tv.apple.com'],
      color: '#a855f7',
      freeWithAds: false,
      searchUrl: t => `https://tv.apple.com/us/search?term=${encodeURIComponent(t)}`
    },
    {
      id: 'tubi',
      name: 'Tubi',
      licensedBy: 'Tubi',
      licensedByValues: ['Tubi', 'Tubi TV', 'FilmRise'],
      aliases: ['tubi', 'tubi tv', 'filmrise'],
      domains: ['tubitv.com'],
      color: '#c084fc',
      freeWithAds: true,
      searchUrl: t => `https://tubitv.com/search/${encodeURIComponent(t)}`
    },
    {
      id: 'pluto',
      name: 'Pluto TV',
      licensedBy: 'Pluto TV',
      licensedByValues: ['Pluto TV', 'A&E', 'Court TV'],
      aliases: ['pluto', 'pluto tv', 'a&e', 'court tv'],
      domains: ['pluto.tv', 'aetv.com'],
      color: '#fbbf24',
      freeWithAds: true,
      searchUrl: t => `https://pluto.tv/us/search?q=${encodeURIComponent(t)}`
    },
    {
      id: 'youtube',
      name: 'YouTube',
      licensedBy: 'YouTube',
      licensedByValues: ['YouTube'],
      aliases: ['youtube', 'youtu.be'],
      domains: ['youtube.com', 'youtu.be'],
      color: '#f87171',
      freeWithAds: true,
      searchUrl: t => `https://www.youtube.com/results?search_query=${encodeURIComponent(t + ' documentary')}`
    },
    {
      id: 'podcasts',
      name: 'Podcasts / Audio',
      licensedBy: 'Apple Podcasts',
      licensedByValues: ['Apple Podcasts', 'Spotify', 'Serial Productions', 'Wondery', 'PRX', 'NHPR', 'APM Reports'],
      aliases: ['podcast', 'apple podcasts', 'spotify', 'wondery', 'serial', 'prx', 'nhpr', 'apm'],
      domains: ['podcasts.apple.com', 'open.spotify.com'],
      color: '#10b981',
      freeWithAds: true,
      searchUrl: t => `https://podcasts.apple.com/us/search?term=${encodeURIComponent(t)}`
    }
  ];

  const PLATFORM_BY_ID = Object.fromEntries(PLATFORM_CONFIG.map(p => [p.id, p]));

  // --------------------------------------------------------------------------
  // SVG Poster Generator for Offline / Fallback Dossier Covers
  // --------------------------------------------------------------------------
  function makeDossierPosterDataUri(title, subtitle, accentColor = '#f59e0b', badgeText = 'CASE FILE') {
    const cleanTitle = String(title || 'Case File').slice(0, 42);
    const words = cleanTitle.split(/\s+/);
    let line1 = '', line2 = '', line3 = '';
    for (const w of words) {
      if ((line1 + ' ' + w).trim().length <= 16) line1 = (line1 + ' ' + w).trim();
      else if ((line2 + ' ' + w).trim().length <= 16) line2 = (line2 + ' ' + w).trim();
      else line3 = (line3 + ' ' + w).trim().slice(0, 18);
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 480">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#141a2b"/>
          <stop offset="60%" stop-color="#0b0f1b"/>
          <stop offset="100%" stop-color="#19111d"/>
        </linearGradient>
      </defs>
      <rect width="360" height="480" fill="url(#g)"/>
      <rect x="18" y="18" width="324" height="444" rx="14" fill="none" stroke="${accentColor}" stroke-opacity="0.35" stroke-width="2" stroke-dasharray="8 6"/>
      <circle cx="180" cy="145" r="56" fill="${accentColor}" fill-opacity="0.12" stroke="${accentColor}" stroke-opacity="0.6" stroke-width="2.5"/>
      <circle cx="164" cy="136" r="7" fill="#f43f5e"/>
      <circle cx="198" cy="132" r="6" fill="#38bdf8"/>
      <circle cx="180" cy="166" r="8" fill="${accentColor}"/>
      <path d="M164 136 L198 132 L180 166 Z" fill="none" stroke="#e2e8f0" stroke-width="2" stroke-dasharray="4 3"/>
      <rect x="36" y="36" width="128" height="26" rx="5" fill="${accentColor}" fill-opacity="0.2" stroke="${accentColor}" stroke-opacity="0.6"/>
      <text x="100" y="54" text-anchor="middle" fill="#fde68a" font-family="monospace" font-weight="700" font-size="12">${escapeHtml(badgeText)}</text>
      <text x="180" y="265" text-anchor="middle" fill="#f8fafc" font-family="sans-serif" font-weight="800" font-size="25">${escapeHtml(line1)}</text>
      ${line2 ? `<text x="180" y="298" text-anchor="middle" fill="#f8fafc" font-family="sans-serif" font-weight="800" font-size="24">${escapeHtml(line2)}</text>` : ''}
      ${line3 ? `<text x="180" y="331" text-anchor="middle" fill="#cbd5e1" font-family="sans-serif" font-weight="700" font-size="21">${escapeHtml(line3)}</text>` : ''}
      <text x="180" y="420" text-anchor="middle" fill="#94a3b8" font-family="monospace" font-weight="600" font-size="13">${escapeHtml(String(subtitle || 'TRUE CRIME DOSSIER').slice(0, 32))}</text>
    </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  // Verified official poster artwork (TVMaze, Apple Podcasts, Wikimedia) for all 38 canonical case dossiers
  const CANONICAL_POSTERS_BY_ID = {
    101: 'https://static.tvmaze.com/uploads/images/original_untouched/8/21643.jpg',
    102: 'https://static.tvmaze.com/uploads/images/original_untouched/46/116051.jpg',
    103: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts112/v4/33/e8/34/33e834a4-4331-db4e-bd8f-f7da0181429a/mza_11048451533177079714.jpg/600x600bb.jpg',
    104: 'https://static.tvmaze.com/uploads/images/original_untouched/302/755405.jpg',
    105: 'https://static.tvmaze.com/uploads/images/original_untouched/501/1253490.jpg',
    106: 'https://static.tvmaze.com/uploads/images/original_untouched/261/652761.jpg',
    107: 'https://upload.wikimedia.org/wikipedia/en/6/69/The_Thin_Blue_Line_poster.jpg',
    108: 'https://static.tvmaze.com/uploads/images/original_untouched/406/1015974.jpg',
    109: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts211/v4/67/d5/37/67d537b9-b27e-240b-b9a2-43c13bdfd7fb/mza_4163719876671560348.jpeg/600x600bb.jpg',
    110: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/4a/bf/05/4abf053e-c55c-cca9-af59-5672ef215a06/mza_11437099833053467445.jpg/600x600bb.jpg',
    111: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts211/v4/90/24/36/90243638-a0ce-1268-2c4e-c34761253812/mza_17261943949558976257.jpg/600x600bb.jpg',
    112: 'https://static.tvmaze.com/uploads/images/original_untouched/147/367698.jpg',
    113: 'https://static.tvmaze.com/uploads/images/original_untouched/108/270245.jpg',
    114: 'https://upload.wikimedia.org/wikipedia/en/9/91/Paradise_Lost_Dvd.jpg',
    115: 'https://static.tvmaze.com/uploads/images/original_untouched/229/574456.jpg',
    116: 'https://static.tvmaze.com/uploads/images/original_untouched/498/1246769.jpg',
    117: 'https://static.tvmaze.com/uploads/images/original_untouched/491/1228376.jpg',
    118: 'https://static.tvmaze.com/uploads/images/original_untouched/589/1474126.jpg',
    119: 'https://static.tvmaze.com/uploads/images/original_untouched/479/1198803.jpg',
    120: 'https://static.tvmaze.com/uploads/images/original_untouched/21/53051.jpg',
    121: 'https://static.tvmaze.com/uploads/images/original_untouched/493/1233408.jpg',
    122: 'https://upload.wikimedia.org/wikipedia/en/1/1b/Out_for_Blood_in_Silicon_Valley.jpeg',
    123: 'https://static.tvmaze.com/uploads/images/original_untouched/219/549891.jpg',
    124: 'https://upload.wikimedia.org/wikipedia/en/f/f5/DearZacharyTheatricalPoster.jpg',
    125: 'https://static.tvmaze.com/uploads/images/original_untouched/542/1356223.jpg',
    126: 'https://static.tvmaze.com/uploads/images/original_untouched/241/603427.jpg',
    127: 'https://upload.wikimedia.org/wikipedia/en/0/0e/Poster_for_Girl_in_the_Picture.jpg',
    128: 'https://static.tvmaze.com/uploads/images/original_untouched/477/1194108.jpg',
    129: 'https://static.tvmaze.com/uploads/images/original_untouched/410/1027303.jpg',
    130: 'https://upload.wikimedia.org/wikipedia/en/3/3b/Into_the_abyss_poster.jpg',
    131: 'https://static.tvmaze.com/uploads/images/original_untouched/485/1213303.jpg',
    132: 'https://upload.wikimedia.org/wikipedia/en/7/73/Cropsey.jpg',
    133: 'https://upload.wikimedia.org/wikipedia/en/0/0b/Petit_family_photo.jpg',
    134: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/15/96/f6/1596f64d-347f-87b6-b5f2-04dcc079a598/mza_10725073278164213531.jpeg/600x600bb.jpg',
    135: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts112/v4/58/de/45/58de45d3-85ee-b7e3-ef4d-5bd791da00e9/mza_10200743568593208637.jpg/600x600bb.jpg',
    136: 'https://static.tvmaze.com/uploads/images/original_untouched/289/723250.jpg',
    137: 'https://static.tvmaze.com/uploads/images/original_untouched/263/658269.jpg',
    138: 'https://static.tvmaze.com/uploads/images/original_untouched/426/1066184.jpg'
  };

  // --------------------------------------------------------------------------
  // Canonical True Crime Taxonomy & Curated Multi-Decade Corpus
  // --------------------------------------------------------------------------
  const CANONICAL_GENRES = [
    'Docuseries',
    'Feature Documentary',
    'True Crime Podcast',
    'Investigative Newsmagazine',
    'Legal & Exoneration',
    'Cult & Extremism',
    'Fraud & White-Collar',
    'Biographical Crime Drama'
  ];

  const CANONICAL_TAGS = [
    { name: 'Forensic DNA', category: 'Forensics', description: 'DNA profiling, blood spatter, ballistics, and laboratory forensics used to solve cases.' },
    { name: 'Wrongful Conviction', category: 'Justice System', description: 'Coerced confessions, prosecutorial misconduct, and Innocence Project exonerations.' },
    { name: 'Cold Case', category: 'Case Status', description: 'Decades-old unsolved mysteries revisited with modern investigative methods.' },
    { name: 'Serial Offender', category: 'Profile', description: 'Behavioral profiling, cross-jurisdictional patterns, and multi-year manhunts.' },
    { name: 'Cult & High-Control Group', category: 'Extremism', description: 'Charismatic leaders, compounds, psychological manipulation, and survivor testimonies.' },
    { name: 'Corporate & White-Collar Fraud', category: 'Financial Crime', description: 'Ponzi schemes, medical tech scams, embezzlement, and whistleblower exposés.' },
    { name: 'Missing Persons', category: 'Investigation', description: 'Vanishings, search timelines, last-seen reconstructions, and family-led investigations.' },
    { name: 'Courtroom & Legal', category: 'Justice System', description: 'High-stakes trial strategy, jury deliberations, defense motions, and appellate battles.' },
    { name: 'Investigative Journalism', category: 'Methodology', description: 'Long-form reporting, FOIA records, reporter field interviews, and audio investigative series.' },
    { name: 'Police Interrogation', category: 'Methodology', description: 'Confession tapes, Reid technique analysis, detective interviews, and wiretaps.' },
    { name: 'Con Artist & Impostor', category: 'Financial Crime', description: 'Identity deception, romance scams, fake heiresses, and social engineering.' },
    { name: 'Small-Town Mystery', category: 'Setting', description: 'Insular communities, local secrets, sheriff politics, and generational cover-ups.' },
    { name: 'Forensic Genealogy', category: 'Forensics', description: 'Familial DNA databases and genetic genealogy trees identifying unknown suspects.' },
    { name: 'Cyber & OSINT Sleuths', category: 'Methodology', description: 'Digital footprints, metadata, crowd-sourced online investigations, and dark-web trails.' },
    { name: 'Judicial & Police Corruption', category: 'Justice System', description: 'Planted evidence, institutional cover-ups, systemic bias, and internal affairs.' },
    { name: 'Archival Footage', category: 'Format', description: 'Contemporaneous news broadcasts, home video, 911 audio, and primary-source tape.' },
    { name: 'Psychological Profile', category: 'Profile', description: 'FBI Behavioral Science interviews, motive analysis, and criminal psychology.' },
    { name: 'Whistleblower', category: 'Financial Crime', description: 'Insiders risking retaliation to expose corporate or institutional crime.' },
    { name: 'Hot-Mic Confession', category: 'Evidence', description: 'Incriminating audio or documentary interview admissions captured on tape.' },
    { name: 'Pacific Northwest Noir', category: 'Setting', description: 'Misty coastal, forested, and Northwestern US cold cases and disappearances.' },
    { name: 'Southern Gothic', category: 'Setting', description: 'Deep South dynasties, rural jurisdictions, and old-money legal intrigue.' },
    { name: '1970s Era', category: 'Historical Era', description: 'Cases originating in the 1970s pre-DNA investigative era.' },
    { name: '1980s Era', category: 'Historical Era', description: 'Cases from the 1980s forensic transition and satanic-panic era.' },
    { name: '1990s Era', category: 'Historical Era', description: 'Landmark 1990s trials, early DNA admissibility, and cable news spectacles.' },
    { name: 'Unsolved Mystery', category: 'Case Status', description: 'Open case files with competing theories and no definitive conviction.' },
    { name: 'Domestic & Family Secrets', category: 'Profile', description: 'Double lives, insurance motives, and crimes behind closed suburban doors.' }
  ];

  // Raw seed records (normalized into full card objects below)
  const RAW_DOSSIER_CATALOG = [
    {
      id: 101,
      title: 'The Jinx: The Life and Deaths of Robert Durst',
      format: 'DOCUSERIES',
      status: 'FINISHED',
      caseStatus: 'Solved',
      source: 'ARCHIVAL_INVESTIGATION',
      seasonYear: 2015,
      episodes: 12,
      duration: 48,
      averageScore: 94,
      popularity: 165000,
      countryOfOrigin: 'US',
      studio: 'HBO Documentary Films',
      platforms: ['max'],
      genres: ['Docuseries', 'Legal & Exoneration'],
      tags: [['Hot-Mic Confession', 98], ['Archival Footage', 92], ['Courtroom & Legal', 88], ['Cold Case', 86], ['Missing Persons', 82], ['1980s Era', 76]],
      staff: [{ role: 'Director', name: 'Andrew Jarecki' }, { role: 'Investigator', name: 'Marc Smerling' }, { role: 'Cinematography', name: 'Zachary Stuart-Pontier' }],
      trailerId: 'CFZV1p1b3bc',
      description: 'Filmmaker Andrew Jarecki examines the complicated life of reclusive real estate heir Robert Durst, long suspected in the 1982 disappearance of his wife Kathie, the 2000 execution-style killing of writer Susan Berman, and the 2001 dismemberment of neighbor Morris Black in Galveston, Texas—culminating in a stunning hot-mic bathroom recording.'
    },
    {
      id: 102,
      title: 'Making a Murderer',
      format: 'DOCUSERIES',
      status: 'FINISHED',
      caseStatus: 'Exonerated',
      source: 'COURT_RECORDS',
      seasonYear: 2015,
      episodes: 20,
      duration: 60,
      averageScore: 91,
      popularity: 240000,
      countryOfOrigin: 'US',
      studio: 'Netflix',
      platforms: ['netflix'],
      genres: ['Docuseries', 'Legal & Exoneration'],
      tags: [['Wrongful Conviction', 96], ['Courtroom & Legal', 94], ['Judicial & Police Corruption', 92], ['Police Interrogation', 89], ['Small-Town Mystery', 86], ['Forensic DNA', 84]],
      staff: [{ role: 'Director', name: 'Laura Ricciardi' }, { role: 'Director', name: 'Moira Demos' }, { role: 'Legal Analyst', name: 'Kathleen Zellner' }],
      trailerId: '34M2zdLc-2U',
      description: 'Filmed over a 10-year period in Manitowoc County, Wisconsin, this landmark docuseries follows Steven Avery—exonerated by DNA after 18 years in prison for a crime he did not commit—only to be arrested two years later alongside his nephew Brendan Dassey for the murder of photographer Teresa Halbach amidst allegations of planted evidence and coerced confession.'
    },
    {
      id: 103,
      title: 'Serial (Season 1: The Hae Min Lee Case)',
      format: 'PODCAST',
      status: 'FINISHED',
      caseStatus: 'Exonerated',
      source: 'JOURNALISM',
      seasonYear: 2014,
      episodes: 12,
      duration: 50,
      averageScore: 95,
      popularity: 280000,
      countryOfOrigin: 'US',
      studio: 'Serial Productions',
      platforms: ['podcasts', 'youtube'],
      genres: ['True Crime Podcast', 'Legal & Exoneration'],
      tags: [['Investigative Journalism', 98], ['Wrongful Conviction', 94], ['Courtroom & Legal', 90], ['1990s Era', 88], ['Police Interrogation', 82]],
      staff: [{ role: 'Host / Journalist', name: 'Sarah Koenig' }, { role: 'Producer', name: 'Julie Snyder' }, { role: 'Producer', name: 'Dana Chivvis' }],
      trailerId: 'nMSxiHuNPx4',
      description: 'Sarah Koenig investigates the 1999 murder of Baltimore high school student Hae Min Lee and the conviction of her ex-boyfriend Adnan Syed, dissecting cell-tower evidence, alibi witness Asia McClain, and timeline inconsistencies week by week.'
    },
    {
      id: 104,
      title: 'Forensic Files',
      format: 'TV_SERIES',
      status: 'FINISHED',
      caseStatus: 'Solved',
      source: 'FORENSIC_LAB',
      seasonYear: 1996,
      episodes: 406,
      duration: 22,
      averageScore: 92,
      popularity: 210000,
      countryOfOrigin: 'US',
      studio: 'Medstar Television',
      platforms: ['peacock', 'tubi', 'pluto', 'prime', 'youtube'],
      genres: ['Investigative Newsmagazine', 'Docuseries'],
      tags: [['Forensic DNA', 99], ['Cold Case', 88], ['Domestic & Family Secrets', 84], ['1990s Era', 82], ['Police Interrogation', 75]],
      staff: [{ role: 'Narrator', name: 'Peter Thomas' }, { role: 'Creator', name: 'Paul Dowling' }],
      trailerId: 'NRtF7cm7I1k',
      description: 'Narrated by the iconic Peter Thomas, this gold-standard clinical forensic series chronicles how trace evidence, gas chromatography, mitochondrial DNA, diatom analysis, and bloodstain pattern reconstruction solved seemingly impossible homicides and cold cases.'
    },
    {
      id: 105,
      title: 'Mindhunter',
      format: 'DRAMA_SERIES',
      status: 'FINISHED',
      caseStatus: 'Solved',
      source: 'BOOK_DOSSIER',
      seasonYear: 2017,
      episodes: 19,
      duration: 54,
      averageScore: 93,
      popularity: 260000,
      countryOfOrigin: 'US',
      studio: 'Netflix',
      platforms: ['netflix'],
      genres: ['Biographical Crime Drama'],
      tags: [['Psychological Profile', 98], ['Serial Offender', 96], ['Police Interrogation', 92], ['1970s Era', 91], ['1980s Era', 84]],
      staff: [{ role: 'Director', name: 'David Fincher' }, { role: 'Original Author', name: 'John E. Douglas' }, { role: 'Composer', name: 'Jason Hill' }],
      trailerId: 'oFlKiTwhd38',
      description: 'In the late 1970s, FBI agents Holden Ford and Bill Tench team up with psychologist Wendy Carr to launch the Behavioral Science Unit at Quantico, interviewing imprisoned serial killers including Ed Kemper, David Berkowitz, and Wayne Williams to pioneer modern criminal profiling.'
    },
    {
      id: 106,
      title: "I'll Be Gone in the Dark",
      format: 'DOCUSERIES',
      status: 'FINISHED',
      caseStatus: 'Solved',
      source: 'BOOK_DOSSIER',
      seasonYear: 2020,
      episodes: 7,
      duration: 58,
      averageScore: 88,
      popularity: 92000,
      countryOfOrigin: 'US',
      studio: 'HBO Documentary Films',
      platforms: ['max'],
      genres: ['Docuseries'],
      tags: [['Forensic Genealogy', 98], ['Cold Case', 95], ['Serial Offender', 92], ['Investigative Journalism', 90], ['Cyber & OSINT Sleuths', 85], ['1970s Era', 84], ['1980s Era', 82]],
      staff: [{ role: 'Director', name: 'Liz Garbus' }, { role: 'Original Author', name: 'Michelle McNamara' }, { role: 'Investigator', name: 'Paul Holes' }],
      trailerId: 'bZ21293N54Q',
      description: 'Chronicles true crime writer Michelle McNamara’s tireless investigation into the Golden State Killer—who terrorized California across the 1970s and 80s—and how investigator Paul Holes and genetic genealogist Barbara Rae-Venter ultimately unmasked Joseph James DeAngelo using familial DNA.'
    },
    {
      id: 107,
      title: 'The Thin Blue Line',
      format: 'FEATURE_DOC',
      status: 'FINISHED',
      caseStatus: 'Exonerated',
      source: 'ARCHIVAL_INVESTIGATION',
      seasonYear: 1988,
      episodes: 1,
      duration: 103,
      averageScore: 95,
      popularity: 68000,
      countryOfOrigin: 'US',
      studio: 'Third Floor Productions',
      platforms: ['max', 'tubi', 'prime'],
      genres: ['Feature Documentary', 'Legal & Exoneration'],
      tags: [['Wrongful Conviction', 99], ['Judicial & Police Corruption', 94], ['Police Interrogation', 90], ['1970s Era', 88], ['1980s Era', 85], ['Hot-Mic Confession', 84]],
      staff: [{ role: 'Director', name: 'Errol Morris' }, { role: 'Composer', name: 'Philip Glass' }],
      trailerId: 'dNL5A4D0G4g',
      description: 'Errol Morris’s revolutionary documentary reconstructs the 1976 shooting of Dallas police officer Robert W. Wood and exposes the perjured testimony and prosecutorial tunnel vision that sent drifter Randall Dale Adams to death row—directly leading to Adams’s exoneration.'
    },
    {
      id: 108,
      title: 'The Staircase',
      format: 'DOCUSERIES',
      status: 'FINISHED',
      caseStatus: 'Ongoing Trial',
      source: 'COURT_RECORDS',
      seasonYear: 2004,
      episodes: 13,
      duration: 52,
      averageScore: 89,
      popularity: 135000,
      countryOfOrigin: 'US',
      studio: ' Maha Productions',
      platforms: ['netflix', 'max'],
      genres: ['Docuseries', 'Legal & Exoneration'],
      tags: [['Courtroom & Legal', 97], ['Forensic DNA', 90], ['Domestic & Family Secrets', 89], ['Southern Gothic', 82], ['Wrongful Conviction', 78]],
      staff: [{ role: 'Director', name: 'Jean-Xavier de Lestrade' }, { role: 'Defense Attorney', name: 'David Rudolf' }],
      trailerId: 'Bvv97sCcruY',
      description: 'Granted unprecedented access inside the defense team of Durham, North Carolina novelist Michael Peterson after his wife Kathleen is found dead at the bottom of their mansion staircase in 2001—following blood-spatter analyst Duane Deaver’s disputed experiments, the "Owl Theory," and a 15-year legal odyssey.'
    },
    {
      id: 109,
      title: 'In the Dark (Season 2: Curtis Flowers)',
      format: 'PODCAST',
      status: 'FINISHED',
      caseStatus: 'Exonerated',
      source: 'JOURNALISM',
      seasonYear: 2018,
      episodes: 20,
      duration: 46,
      averageScore: 97,
      popularity: 64000,
      countryOfOrigin: 'US',
      studio: 'APM Reports',
      platforms: ['podcasts'],
      genres: ['True Crime Podcast', 'Legal & Exoneration'],
      tags: [['Investigative Journalism', 99], ['Wrongful Conviction', 98], ['Judicial & Police Corruption', 95], ['Courtroom & Legal', 94], ['Southern Gothic', 90], ['Small-Town Mystery', 86]],
      staff: [{ role: 'Host / Journalist', name: 'Madeleine Baran' }, { role: 'Senior Producer', name: 'Samara Freemark' }],
      trailerId: '',
      description: 'Peabody-winning investigative reporter Madeleine Baran spends a year in Winona, Mississippi examining why Curtis Flowers was tried six times by the same prosecutor for the 1996 Tardy Furniture murders—uncovering hidden ballistics, recanted jailhouse testimony, and unconstitutional jury strikes that took the case to the U.S. Supreme Court.'
    },
    {
      id: 110,
      title: 'Bear Brook',
      format: 'PODCAST',
      status: 'FINISHED',
      caseStatus: 'Solved',
      source: 'JOURNALISM',
      seasonYear: 2018,
      episodes: 14,
      duration: 42,
      averageScore: 96,
      popularity: 58000,
      countryOfOrigin: 'US',
      studio: 'New Hampshire Public Radio',
      platforms: ['podcasts'],
      genres: ['True Crime Podcast'],
      tags: [['Forensic Genealogy', 99], ['Cold Case', 97], ['Serial Offender', 91], ['Forensic DNA', 90], ['Investigative Journalism', 89], ['1980s Era', 85]],
      staff: [{ role: 'Host / Journalist', name: 'Jason Moon' }, { role: 'Genealogist', name: 'Rebekah Heath' }],
      trailerId: '',
      description: 'Two blue 55-gallon drums discovered fifteen years apart in New Hampshire’s Bear Brook State Park hold four unidentified bodies. NHPR reporter Jason Moon tracks how citizen researcher Rebekah Heath and pioneer forensic genealogists solved the identity of chameleon killer Terry Peder Rasmussen—forever changing cold-case science.'
    },
    {
      id: 111,
      title: 'Your Own Backyard',
      format: 'PODCAST',
      status: 'FINISHED',
      caseStatus: 'Solved',
      source: 'JOURNALISM',
      seasonYear: 2019,
      episodes: 18,
      duration: 52,
      averageScore: 96,
      popularity: 72000,
      countryOfOrigin: 'US',
      studio: 'Chris Lambert Audio',
      platforms: ['podcasts'],
      genres: ['True Crime Podcast'],
      tags: [['Cold Case', 98], ['Missing Persons', 96], ['Investigative Journalism', 94], ['Courtroom & Legal', 88], ['1990s Era', 87], ['Small-Town Mystery', 82]],
      staff: [{ role: 'Host / Creator', name: 'Chris Lambert' }],
      trailerId: '',
      description: 'Independent documentarian Chris Lambert re-investigates the 1996 disappearance of Cal Poly freshman Kristin Smart on California’s Central Coast—unearthed witness interviews from his podcast directly catalyzed new sheriff searches, the 2021 arrest, and the 2022 murder conviction of Paul Flores.'
    },
    {
      id: 112,
      title: 'Wild Wild Country',
      format: 'DOCUSERIES',
      status: 'FINISHED',
      caseStatus: 'Solved',
      source: 'ARCHIVAL_INVESTIGATION',
      seasonYear: 2018,
      episodes: 6,
      duration: 65,
      averageScore: 91,
      popularity: 175000,
      countryOfOrigin: 'US',
      studio: 'Duplass Brothers Productions',
      platforms: ['netflix'],
      genres: ['Docuseries', 'Cult & Extremism'],
      tags: [['Cult & High-Control Group', 99], ['Archival Footage', 95], ['Pacific Northwest Noir', 90], ['1980s Era', 92], ['Small-Town Mystery', 86], ['Judicial & Police Corruption', 80]],
      staff: [{ role: 'Director', name: 'Chapman Way' }, { role: 'Director', name: 'Maclain Way' }],
      trailerId: 'hBLS_OM6Puk',
      description: 'When controversial guru Bhagwan Shree Rajneesh and his ruthless lieutenant Ma Anand Sheela build a utopian city on a 64,000-acre ranch outside tiny Antelope, Oregon in 1981, conflict with local ranchers escalates into wiretapping, immigration fraud, and the largest bioterror attack in U.S. history.'
    },
    {
      id: 113,
      title: 'The Keepers',
      format: 'DOCUSERIES',
      status: 'FINISHED',
      caseStatus: 'Cold Case',
      source: 'ARCHIVAL_INVESTIGATION',
      seasonYear: 2017,
      episodes: 7,
      duration: 60,
      averageScore: 89,
      popularity: 128000,
      countryOfOrigin: 'US',
      studio: ' Tripod Media',
      platforms: ['netflix'],
      genres: ['Docuseries'],
      tags: [['Cold Case', 97], ['Judicial & Police Corruption', 94], ['Investigative Journalism', 91], ['Cyber & OSINT Sleuths', 88], ['1970s Era', 87], ['Unsolved Mystery', 85]],
      staff: [{ role: 'Director', name: 'Ryan White' }, { role: 'Investigator', name: 'Gemma Hoskins' }, { role: 'Investigator', name: 'Abby Schaub' }],
      trailerId: 'K_1fd3tVqSc',
      description: 'Two former students of Baltimore’s Archbishop Keough High School spend their retirement investigating the unsolved 1969 murder of beloved 26-year-old nun Sister Cathy Cesnik—uncovering a web of institutional clerical abuse and police complicity.'
    },
    {
      id: 114,
      title: 'Paradise Lost: The Child Murders at Robin Hood Hills',
      format: 'FEATURE_DOC',
      status: 'FINISHED',
      caseStatus: 'Exonerated',
      source: 'COURT_RECORDS',
      seasonYear: 1996,
      episodes: 3,
      duration: 150,
      averageScore: 93,
      popularity: 84000,
      countryOfOrigin: 'US',
      studio: 'HBO Documentary Films',
      platforms: ['max'],
      genres: ['Feature Documentary', 'Legal & Exoneration'],
      tags: [['Wrongful Conviction', 98], ['Courtroom & Legal', 95], ['Police Interrogation', 94], ['Small-Town Mystery', 92], ['Southern Gothic', 90], ['1990s Era', 88]],
      staff: [{ role: 'Director', name: 'Joe Berlinger' }, { role: 'Director', name: 'Bruce Sinofsky' }],
      trailerId: 'o5H4bN4i8cE',
      description: 'Joe Berlinger and Bruce Sinofsky document the 1993 arrests and trials of the "West Memphis Three"—teenagers Damien Echols, Jessie Misskelley, and Jason Baldwin—accused of ritualistic murders in Arkansas amidst moral panic and coerced confession.'
    },
    {
      id: 115,
      title: "Don't F**k with Cats: Hunting an Internet Killer",
      format: 'DOCUSERIES',
      status: 'FINISHED',
      caseStatus: 'Solved',
      source: 'OSINT',
      seasonYear: 2019,
      episodes: 3,
      duration: 62,
      averageScore: 86,
      popularity: 195000,
      countryOfOrigin: 'GB',
      studio: 'Raw TV',
      platforms: ['netflix'],
      genres: ['Docuseries'],
      tags: [['Cyber & OSINT Sleuths', 99], ['Serial Offender', 88], ['Psychological Profile', 86]],
      staff: [{ role: 'Director', name: 'Mark Lewis' }, { role: 'Investigator', name: 'Deanna Thompson' }, { role: 'Investigator', name: 'John Green' }],
      trailerId: 'dbพา9kG3d8A',
      description: 'When an anonymous perpetrator posts disturbing videos online, amateur internet sleuths Deanna Thompson ("Baudi Moovan") and John Green use vacuum cleaner serial numbers, reflections, and Google Street View to track down Luka Magnotta before and during an international homicide manhunt.'
    },
    {
      id: 116,
      title: 'American Nightmare',
      format: 'DOCUSERIES',
      status: 'FINISHED',
      caseStatus: 'Solved',
      source: 'POLICE_RECORDS',
      seasonYear: 2024,
      episodes: 3,
      duration: 46,
      averageScore: 87,
      popularity: 148000,
      countryOfOrigin: 'US',
      studio: 'Raw TV',
      platforms: ['netflix'],
      genres: ['Docuseries', 'Legal & Exoneration'],
      tags: [['Police Interrogation', 96], ['Judicial & Police Corruption', 93], ['Missing Persons', 90], ['Forensic DNA', 84]],
      staff: [{ role: 'Director', name: 'Bernadette Higgins' }, { role: 'Director', name: 'Felicity Morris' }, { role: 'Detective', name: 'Misty Carausu' }],
      trailerId: 'ae6b5X3Q6aU',
      description: 'After a harrowing 2015 home invasion and kidnapping in Vallejo, California, Denise Huskins and Aaron Quinn are publicly accused by police and media of staging a "Gone Girl" hoax—until a relentless Dublin, California detective connects a single strand of hair to a disguised serial predator.'
    },
    {
      id: 117,
      title: 'Dateline NBC',
      format: 'TV_SERIES',
      status: 'RELEASING',
      caseStatus: 'Solved',
      source: 'JOURNALISM',
      seasonYear: 1992,
      episodes: 1450,
      duration: 84,
      averageScore: 86,
      popularity: 198000,
      countryOfOrigin: 'US',
      studio: 'NBC News',
      platforms: ['peacock', 'podcasts', 'pluto', 'youtube'],
      genres: ['Investigative Newsmagazine', 'True Crime Podcast'],
      tags: [['Investigative Journalism', 94], ['Domestic & Family Secrets', 93], ['Police Interrogation', 90], ['Courtroom & Legal', 88], ['Cold Case', 86]],
      staff: [{ role: 'Correspondent', name: 'Keith Morrison' }, { role: 'Correspondent', name: 'Josh Mankiewicz' }, { role: 'Correspondent', name: 'Andrea Canning' }, { role: 'Anchor', name: 'Lester Holt' }],
      trailerId: '',
      nextAiringEpisode: { episode: 1451, airingAt: Math.floor(Date.now() / 1000) + 2 * 86400 },
      description: 'America’s longest-running prime-time true crime investigative newsmagazine features correspondents Keith Morrison, Josh Mankiewicz, Andrea Canning, and Dennis Murphy reporting in-depth murder mysteries, cold-case breakthroughs, and courtroom verdicts.'
    },
    {
      id: 118,
      title: '48 Hours',
      format: 'TV_SERIES',
      status: 'RELEASING',
      caseStatus: 'Solved',
      source: 'JOURNALISM',
      seasonYear: 1988,
      episodes: 1320,
      duration: 43,
      averageScore: 85,
      popularity: 162000,
      countryOfOrigin: 'US',
      studio: 'CBS News',
      platforms: ['paramount', 'pluto', 'podcasts', 'youtube'],
      genres: ['Investigative Newsmagazine', 'True Crime Podcast'],
      tags: [['Investigative Journalism', 93], ['Forensic DNA', 88], ['Cold Case', 89], ['Courtroom & Legal', 87], ['Wrongful Conviction', 82]],
      staff: [{ role: 'Correspondent', name: 'Erin Moriarty' }, { role: 'Correspondent', name: 'Peter Van Sant' }, { role: 'Executive Producer', name: 'Judy Tygard' }],
      trailerId: '',
      nextAiringEpisode: { episode: 1321, airingAt: Math.floor(Date.now() / 1000) + 3 * 86400 },
      description: 'CBS News’ signature Saturday-night investigative broadcast explores complex homicide investigations, forensic breakthroughs, and wrongful conviction appeals that have helped free multiple innocent people.'
    },
    {
      id: 119,
      title: '20/20',
      format: 'TV_SERIES',
      status: 'RELEASING',
      caseStatus: 'Solved',
      source: 'JOURNALISM',
      seasonYear: 1978,
      episodes: 1580,
      duration: 85,
      averageScore: 84,
      popularity: 154000,
      countryOfOrigin: 'US',
      studio: 'ABC News Studios',
      platforms: ['hulu', 'podcasts', 'youtube'],
      genres: ['Investigative Newsmagazine', 'True Crime Podcast'],
      tags: [['Investigative Journalism', 91], ['Domestic & Family Secrets', 90], ['Archival Footage', 86], ['Police Interrogation', 85]],
      staff: [{ role: 'Anchor', name: 'David Muir' }, { role: 'Anchor', name: 'Deborah Roberts' }],
      trailerId: '',
      nextAiringEpisode: { episode: 1581, airingAt: Math.floor(Date.now() / 1000) + 1 * 86400 },
      description: 'ABC News’ two-hour Friday night true crime documentary broadcast combines exclusive prison interviews, interrogation tapes, and archival ABC News footage.'
    },
    {
      id: 120,
      title: 'Unsolved Mysteries',
      format: 'DOCUSERIES',
      status: 'RELEASING',
      caseStatus: 'Cold Case',
      source: 'ARCHIVAL_INVESTIGATION',
      seasonYear: 1987,
      episodes: 260,
      duration: 45,
      averageScore: 88,
      popularity: 205000,
      countryOfOrigin: 'US',
      studio: 'Cosgrove/Meurer Productions',
      platforms: ['netflix', 'tubi', 'pluto', 'prime', 'youtube'],
      genres: ['Docuseries'],
      tags: [['Unsolved Mystery', 99], ['Cold Case', 98], ['Missing Persons', 95], ['1980s Era', 89], ['1990s Era', 88], ['Small-Town Mystery', 84]],
      staff: [{ role: 'Creator', name: 'Terry Dunn Meurer' }, { role: 'Creator', name: 'John Cosgrove' }, { role: 'Director', name: 'Marcus A. Clarke' }],
      trailerId: 'Z2w2gNM25wA',
      nextAiringEpisode: { episode: 261, airingAt: Math.floor(Date.now() / 1000) + 5 * 86400 },
      description: 'From Robert Stack’s chilling trench-coat broadcasts to the modern Netflix revival by original creators Terry Dunn Meurer and Cosgrove/Meurer, viewer tips from this iconic series have directly solved over 260 cold cases and missing-person mysteries.'
    },
    {
      id: 121,
      title: 'O.J.: Made in America',
      format: 'DOCUSERIES',
      status: 'FINISHED',
      caseStatus: 'Ongoing Trial',
      source: 'ARCHIVAL_INVESTIGATION',
      seasonYear: 2016,
      episodes: 5,
      duration: 93,
      averageScore: 96,
      popularity: 112000,
      countryOfOrigin: 'US',
      studio: 'ESPN Films',
      platforms: ['hulu', 'netflix'],
      genres: ['Docuseries', 'Feature Documentary', 'Legal & Exoneration'],
      tags: [['Courtroom & Legal', 99], ['Archival Footage', 97], ['1990s Era', 96], ['Forensic DNA', 90], ['Judicial & Police Corruption', 89]],
      staff: [{ role: 'Director', name: 'Ezra Edelman' }],
      trailerId: 'Hr1fFMp0MqU',
      description: 'Ezra Edelman’s Academy Award-winning eight-hour epic contextualizes the 1994 Brentwood murders of Nicole Brown Simpson and Ronald Goldman within decades of LAPD history, race in America, celebrity culture, and the televised Trial of the Century.'
    },
    {
      id: 122,
      title: 'The Inventor: Out for Blood in Silicon Valley',
      format: 'FEATURE_DOC',
      status: 'FINISHED',
      caseStatus: 'Solved',
      source: 'JOURNALISM',
      seasonYear: 2019,
      episodes: 1,
      duration: 119,
      averageScore: 86,
      popularity: 88000,
      countryOfOrigin: 'US',
      studio: 'HBO Documentary Films',
      platforms: ['max'],
      genres: ['Feature Documentary', 'Fraud & White-Collar'],
      tags: [['Corporate & White-Collar Fraud', 99], ['Whistleblower', 96], ['Con Artist & Impostor', 94], ['Investigative Journalism', 91], ['Archival Footage', 86]],
      staff: [{ role: 'Director', name: 'Alex Gibney' }, { role: 'Journalist', name: 'John Carreyrou' }],
      trailerId: 'wtbdPGXc-Vg',
      description: 'Academy Award winner Alex Gibney investigates the rise and collapse of Elizabeth Holmes’s $9 billion blood-testing startup Theranos, featuring never-before-seen internal company footage and the whistleblowers who exposed the fraud to Wall Street Journal reporter John Carreyrou.'
    },
    {
      id: 123,
      title: 'Evil Genius: The True Story of America\'s Most Diabolical Bank Heist',
      format: 'DOCUSERIES',
      status: 'FINISHED',
      caseStatus: 'Solved',
      source: 'ARCHIVAL_INVESTIGATION',
      seasonYear: 2018,
      episodes: 4,
      duration: 50,
      averageScore: 87,
      popularity: 142000,
      countryOfOrigin: 'US',
      studio: 'Duplass Brothers Productions',
      platforms: ['netflix'],
      genres: ['Docuseries'],
      tags: [['Psychological Profile', 95], ['Police Interrogation', 92], ['Small-Town Mystery', 89], ['Archival Footage', 88]],
      staff: [{ role: 'Director', name: 'Trey Borzillieri' }, { role: 'Director', name: 'Barbara Schroeder' }],
      trailerId: 'QdabIfmcqSQ',
      description: 'Begins with the bizarre 2003 "pizza bomber" heist in Erie, Pennsylvania—where delivery driver Brian Wells robbed a PNC Bank with a locked collar bomb around his neck—and unravels a twisted conspiracy centered around manipulative mastermind Marjorie Diehl-Armstrong.'
    },
    {
      id: 124,
      title: 'Dear Zachary: A Letter to a Son About His Father',
      format: 'FEATURE_DOC',
      status: 'FINISHED',
      caseStatus: 'Solved',
      source: 'ARCHIVAL_INVESTIGATION',
      seasonYear: 2008,
      episodes: 1,
      duration: 95,
      averageScore: 95,
      popularity: 79000,
      countryOfOrigin: 'US',
      studio: 'MSNBC Films',
      platforms: ['tubi', 'prime', 'pluto', 'youtube'],
      genres: ['Feature Documentary', 'Legal & Exoneration'],
      tags: [['Archival Footage', 98], ['Courtroom & Legal', 94], ['Domestic & Family Secrets', 93], ['Judicial & Police Corruption', 89]],
      staff: [{ role: 'Director', name: 'Kurt Kuenne' }],
      trailerId: 'bHaIYcWbnFM',
      description: 'After Dr. Andrew Bagby is murdered in a Pennsylvania park in 2001 by his ex-girlfriend Shirley Turner—who flees to Newfoundland and announces she is pregnant with Andrew’s child—filmmaker Kurt Kuenne embarks on a cross-country video memoir that transforms into a devastating indictment of Canada’s bail laws.'
    },
    {
      id: 125,
      title: 'Cold Case Files',
      format: 'TV_SERIES',
      status: 'RELEASING',
      caseStatus: 'Solved',
      source: 'FORENSIC_LAB',
      seasonYear: 1999,
      episodes: 185,
      duration: 44,
      averageScore: 87,
      popularity: 132000,
      countryOfOrigin: 'US',
      studio: 'A&E Originals',
      platforms: ['netflix', 'hulu', 'pluto', 'tubi'],
      genres: ['Docuseries', 'Investigative Newsmagazine'],
      tags: [['Cold Case', 99], ['Forensic DNA', 96], ['Forensic Genealogy', 91], ['Police Interrogation', 86], ['1980s Era', 83], ['1990s Era', 82]],
      staff: [{ role: 'Narrator', name: 'Bill Kurtis' }, { role: 'Narrator', name: 'Danny Glover' }],
      trailerId: '',
      nextAiringEpisode: { episode: 186, airingAt: Math.floor(Date.now() / 1000) + 4 * 86400 },
      description: 'Originally hosted by legendary journalist Bill Kurtis, this foundational A&E series follows homicide detectives who refuse to let decades-old murder boxes gather dust—using CODIS DNA hits, latent fingerprint databases, and genetic genealogy to bring killers to justice.'
    },
    {
      id: 126,
      title: 'McMillions',
      format: 'DOCUSERIES',
      status: 'FINISHED',
      caseStatus: 'Solved',
      source: 'POLICE_RECORDS',
      seasonYear: 2020,
      episodes: 6,
      duration: 56,
      averageScore: 85,
      popularity: 69000,
      countryOfOrigin: 'US',
      studio: 'HBO Documentary Films',
      platforms: ['max'],
      genres: ['Docuseries', 'Fraud & White-Collar'],
      tags: [['Corporate & White-Collar Fraud', 98], ['Con Artist & Impostor', 94], ['Police Interrogation', 89], ['Whistleblower', 86], ['1990s Era', 85]],
      staff: [{ role: 'Director', name: 'James Lee Hernandez' }, { role: 'Director', name: 'Brian Lazarte' }, { role: 'FBI Agent', name: 'Doug Mathews' }],
      trailerId: 'Byte5f02n2I',
      description: 'Recounts the FBI investigation led by colorful Special Agent Doug Mathews into how "Uncle Jerry" Jacobson rigged the McDonald’s Monopoly sweepstakes game for over a decade, stealing $24 million through a network of mobsters, psychics, and recruiting middlemen.'
    },
    {
      id: 127,
      title: 'Girl in the Picture',
      format: 'FEATURE_DOC',
      status: 'FINISHED',
      caseStatus: 'Solved',
      source: 'JOURNALISM',
      seasonYear: 2022,
      episodes: 1,
      duration: 102,
      averageScore: 88,
      popularity: 118000,
      countryOfOrigin: 'US',
      studio: 'Netflix',
      platforms: ['netflix'],
      genres: ['Feature Documentary'],
      tags: [['Missing Persons', 98], ['Con Artist & Impostor', 95], ['Forensic DNA', 92], ['Cold Case', 91], ['Investigative Journalism', 88], ['1990s Era', 85]],
      staff: [{ role: 'Director', name: 'Skye Borgman' }, { role: 'Original Author', name: 'Matt Birkbeck' }],
      trailerId: 'dcGl12F2v0M',
      description: 'Directed by Skye Borgman, this haunting documentary unravels the true identity of Tonya Hughes—a young mother killed in a 1990 Oklahoma hit-and-run—exposing how fugitive Franklin Delano Floyd kidnapped her as a child and forced her through decades of stolen identities.'
    },
    {
      id: 128,
      title: 'Murdaugh Murders: A Southern Scandal',
      format: 'DOCUSERIES',
      status: 'FINISHED',
      caseStatus: 'Solved',
      source: 'COURT_RECORDS',
      seasonYear: 2023,
      episodes: 6,
      duration: 48,
      averageScore: 86,
      popularity: 158000,
      countryOfOrigin: 'US',
      studio: 'Camp4 Collective',
      platforms: ['netflix'],
      genres: ['Docuseries', 'Fraud & White-Collar', 'Legal & Exoneration'],
      tags: [['Southern Gothic', 99], ['Courtroom & Legal', 94], ['Corporate & White-Collar Fraud', 92], ['Small-Town Mystery', 91], ['Domestic & Family Secrets', 90], ['Judicial & Police Corruption', 88]],
      staff: [{ role: 'Director', name: 'Jenner Furst' }, { role: 'Director', name: 'Julia Willoughby Nason' }],
      trailerId: 'c3cdT3vybFM',
      description: 'Traces the century-long legal dynasty of the Murdaugh family in South Carolina’s Lowcountry, from the fatal 2019 boat crash involving Paul Murdaugh to the financial embezzlement exposure and double-murder conviction of disbarred attorney Alex Murdaugh.'
    },
    {
      id: 129,
      title: 'Keep Sweet: Pray and Obey',
      format: 'DOCUSERIES',
      status: 'FINISHED',
      caseStatus: 'Solved',
      source: 'ARCHIVAL_INVESTIGATION',
      seasonYear: 2022,
      episodes: 4,
      duration: 51,
      averageScore: 87,
      popularity: 124000,
      countryOfOrigin: 'US',
      studio: 'Participant',
      platforms: ['netflix'],
      genres: ['Docuseries', 'Cult & Extremism'],
      tags: [['Cult & High-Control Group', 99], ['Archival Footage', 94], ['Whistleblower', 90], ['Courtroom & Legal', 86]],
      staff: [{ role: 'Director', name: 'Rachel Dretzin' }],
      trailerId: '5G6fn0C6X8E',
      description: 'Examines the rise of self-proclaimed prophet Warren Jeffs inside the secretive Fundamentalist Church of Jesus Christ of Latter-Day Saints (FLDS), combining confiscated compound archive recordings with testimonies of the courageous women who escaped and testified.'
    },
    {
      id: 130,
      title: 'Into the Abyss',
      format: 'FEATURE_DOC',
      status: 'FINISHED',
      caseStatus: 'Solved',
      source: 'PRISON_INTERVIEW',
      seasonYear: 2011,
      episodes: 1,
      duration: 107,
      averageScore: 89,
      popularity: 46000,
      countryOfOrigin: 'US',
      studio: 'Creative Differences',
      platforms: ['tubi', 'pluto', 'prime'],
      genres: ['Feature Documentary'],
      tags: [['Psychological Profile', 96], ['Police Interrogation', 90], ['Small-Town Mystery', 88], ['Southern Gothic', 85], ['Courtroom & Legal', 84]],
      staff: [{ role: 'Director', name: 'Werner Herzog' }],
      trailerId: 'A25372Xef2A',
      description: 'Filmmaker Werner Herzog conducts deeply philosophical death-row conversations in Conroe, Texas with 28-year-old Michael Perry—eight days before his scheduled execution for a triple homicide over a red Camaro—as well as victims’ families and a former death-house captain.'
    },
    {
      id: 131,
      title: 'Murder on Middle Beach',
      format: 'DOCUSERIES',
      status: 'FINISHED',
      caseStatus: 'Cold Case',
      source: 'ARCHIVAL_INVESTIGATION',
      seasonYear: 2020,
      episodes: 4,
      duration: 62,
      averageScore: 86,
      popularity: 34000,
      countryOfOrigin: 'US',
      studio: 'HBO Documentary Films',
      platforms: ['max'],
      genres: ['Docuseries'],
      tags: [['Cold Case', 96], ['Domestic & Family Secrets', 95], ['Unsolved Mystery', 92], ['Small-Town Mystery', 88], ['Corporate & White-Collar Fraud', 82]],
      staff: [{ role: 'Director', name: 'Madison Hamburg' }],
      trailerId: 'fQ1hX2D6X1E',
      description: 'First-time director Madison Hamburg spends eight years investigating the unsolved 2010 murder of his mother Barbara Hamburg in affluent Madison, Connecticut—interviewing his own father, sisters, and aunts about a controversial matriarchal gifting-table pyramid scheme.'
    },
    {
      id: 132,
      title: 'Cropsey',
      format: 'FEATURE_DOC',
      status: 'FINISHED',
      caseStatus: 'Solved',
      source: 'ARCHIVAL_INVESTIGATION',
      seasonYear: 2009,
      episodes: 1,
      duration: 84,
      averageScore: 83,
      popularity: 31000,
      countryOfOrigin: 'US',
      studio: ' Cinema Purgatorio',
      platforms: ['tubi', 'pluto', 'prime', 'youtube'],
      genres: ['Feature Documentary'],
      tags: [['Missing Persons', 94], ['Cold Case', 91], ['1970s Era', 89], ['1980s Era', 88], ['Archival Footage', 86], ['Serial Offender', 84]],
      staff: [{ role: 'Director', name: 'Joshua Zeman' }, { role: 'Director', name: 'Barbara Brancaccio' }],
      trailerId: 'Op0e3fS9k6U',
      description: 'Growing up on Staten Island, filmmakers Joshua Zeman and Barbara Brancaccio heard urban legends of "Cropsey," an escaped mental patient who lived in the abandoned tunnels of Willowbrook State School—until the real-life 1987 disappearance of Jennifer Schweiger led to former Willowbrook orderly Andre Rand.'
    },
    {
      id: 133,
      title: 'The Cheshire Murders',
      format: 'FEATURE_DOC',
      status: 'FINISHED',
      caseStatus: 'Solved',
      source: 'COURT_RECORDS',
      seasonYear: 2013,
      episodes: 1,
      duration: 117,
      averageScore: 88,
      popularity: 28000,
      countryOfOrigin: 'US',
      studio: 'HBO Documentary Films',
      platforms: ['max'],
      genres: ['Feature Documentary', 'Legal & Exoneration'],
      tags: [['Courtroom & Legal', 94], ['Police Interrogation', 90], ['Small-Town Mystery', 86]],
      staff: [{ role: 'Director', name: 'Kate Davis' }, { role: 'Director', name: 'David Heilbroner' }],
      trailerId: '',
      description: 'Examines the 2007 home invasion of the Petit family in Cheshire, Connecticut, the police response timeline outside the bank and residence, and the subsequent capital murder trials that reshaped Connecticut’s death penalty debate.'
    },
    {
      id: 134,
      title: 'Dirty John',
      format: 'PODCAST',
      status: 'FINISHED',
      caseStatus: 'Solved',
      source: 'JOURNALISM',
      seasonYear: 2017,
      episodes: 8,
      duration: 44,
      averageScore: 89,
      popularity: 115000,
      countryOfOrigin: 'US',
      studio: 'Wondery',
      platforms: ['podcasts', 'netflix', 'peacock'],
      genres: ['True Crime Podcast', 'Fraud & White-Collar'],
      tags: [['Con Artist & Impostor', 99], ['Domestic & Family Secrets', 95], ['Investigative Journalism', 91], ['Psychological Profile', 88]],
      staff: [{ role: 'Host / Journalist', name: 'Christopher Goffard' }],
      trailerId: '',
      description: 'Pulitzer-winning Los Angeles Times reporter Christopher Goffard tells the story of Newport Beach interior designer Debra Newell, who falls for charismatic "anesthesiologist" John Meehan—while her daughters uncover a trail of restraining orders, forged prescriptions, and lifelong grifting.'
    },
    {
      id: 135,
      title: 'Scamanda',
      format: 'PODCAST',
      status: 'FINISHED',
      caseStatus: 'Solved',
      source: 'JOURNALISM',
      seasonYear: 2023,
      episodes: 12,
      duration: 43,
      averageScore: 88,
      popularity: 76000,
      countryOfOrigin: 'US',
      studio: 'Lionsgate Sound',
      platforms: ['podcasts', 'hulu'],
      genres: ['True Crime Podcast', 'Fraud & White-Collar'],
      tags: [['Con Artist & Impostor', 99], ['Corporate & White-Collar Fraud', 94], ['Investigative Journalism', 92], ['Cyber & OSINT Sleuths', 87]],
      staff: [{ role: 'Host / Producer', name: 'Charlie Webster' }, { role: 'Investigative Producer', name: 'Nancy Moscatiello' }],
      trailerId: '',
      description: 'Beloved San Jose Christian school principal and blogger Amanda C. Riley documents her seven-year battle with terminal Hodgkin’s lymphoma, collecting over $100,000 in donations—until an anonymous tip to investigative producer Nancy Moscatiello and the IRS reveals Amanda never had cancer at all.'
    },
    {
      id: 136,
      title: 'Night Stalker: The Hunt for a Serial Killer',
      format: 'DOCUSERIES',
      status: 'FINISHED',
      caseStatus: 'Solved',
      source: 'POLICE_RECORDS',
      seasonYear: 2021,
      episodes: 4,
      duration: 47,
      averageScore: 87,
      popularity: 164000,
      countryOfOrigin: 'US',
      studio: 'IPC',
      platforms: ['netflix'],
      genres: ['Docuseries'],
      tags: [['Serial Offender', 99], ['1980s Era', 96], ['Forensic DNA', 88], ['Police Interrogation', 87], ['Archival Footage', 86]],
      staff: [{ role: 'Director', name: 'Tiller Russell' }, { role: 'Detective', name: 'Gil Carrillo' }, { role: 'Detective', name: 'Frank Salerno' }],
      trailerId: 'Mva2nGveYss',
      description: 'Told through the eyes of young LASD homicide detective Gil Carrillo and legendary Hillside Strangler investigator Frank Salerno, who linked a terrifying spree of 1985 Los Angeles summer attacks via a rare Avia sneaker print and a single fingerprint in a stolen Toyota.'
    },
    {
      id: 137,
      title: 'Conversations with a Killer: The Ted Bundy Tapes',
      format: 'DOCUSERIES',
      status: 'FINISHED',
      caseStatus: 'Solved',
      source: 'PRISON_INTERVIEW',
      seasonYear: 2019,
      episodes: 4,
      duration: 58,
      averageScore: 86,
      popularity: 185000,
      countryOfOrigin: 'US',
      studio: 'RadicalMedia',
      platforms: ['netflix'],
      genres: ['Docuseries'],
      tags: [['Serial Offender', 99], ['1970s Era', 97], ['Archival Footage', 94], ['Psychological Profile', 93], ['Pacific Northwest Noir', 90], ['Courtroom & Legal', 86]],
      staff: [{ role: 'Director', name: 'Joe Berlinger' }, { role: 'Journalist', name: 'Stephen G. Michaud' }],
      trailerId: 'n1UJgrNR1So',
      description: 'Director Joe Berlinger draws from over 100 hours of death-row audio interviews recorded in 1980 by journalists Stephen Michaud and Hugh Aynesworth, where Ted Bundy describes his Pacific Northwest, Utah, Colorado, and Florida crimes in the third person.'
    },
    {
      id: 138,
      title: 'The Vow',
      format: 'DOCUSERIES',
      status: 'FINISHED',
      caseStatus: 'Solved',
      source: 'ARCHIVAL_INVESTIGATION',
      seasonYear: 2020,
      episodes: 15,
      duration: 57,
      averageScore: 84,
      popularity: 108000,
      countryOfOrigin: 'US',
      studio: 'HBO Documentary Films',
      platforms: ['max'],
      genres: ['Docuseries', 'Cult & Extremism'],
      tags: [['Cult & High-Control Group', 99], ['Whistleblower', 95], ['Archival Footage', 93], ['Courtroom & Legal', 89], ['Con Artist & Impostor', 88]],
      staff: [{ role: 'Director', name: 'Jehane Noujaim' }, { role: 'Director', name: 'Karim Amer' }, { role: 'Whistleblower', name: 'Sarah Edmondson' }],
      trailerId: 'eXKJyh_V56U',
      description: 'Follows high-ranking defectors Sarah Edmondson, Mark Vicente, and Bonnie Piesse as they blow the whistle on NXIVM—an Albany, New York "executive success" self-improvement organization led by Keith Raniere that concealed a secret blackmail and branding sorority called DOS.'
    }
  ];

  // Merge optional expanded catalog (catalog-data.js) into canonical list (115+ built-in titles)
  const MERGED_RAW_CATALOG = [
    ...RAW_DOSSIER_CATALOG,
    ...(Array.isArray(global.TRUECRIME_EXTRA_CATALOG) ? global.TRUECRIME_EXTRA_CATALOG : [])
  ];

  // Normalize raw dossier catalog into unified media objects compatible across all 3 pages
  const CANONICAL_DOSSIER_LIST = MERGED_RAW_CATALOG.map(item => {
    const primaryPlat = PLATFORM_BY_ID[item.platforms?.[0]] || PLATFORM_CONFIG[0];
    const posterUri = CANONICAL_POSTERS_BY_ID[item.id] || item.cover || makeDossierPosterDataUri(item.title, `${item.studio} · ${item.seasonYear}`, primaryPlat.color, item.caseStatus.toUpperCase());
    return {
      id: item.id,
      idMal: item.id,
      imdbId: item.imdbId || '',
      imdbRating: item.imdbRating || null,
      imdbVotes: item.imdbVotes || null,
      countryOfOrigin: item.countryOfOrigin || 'US',
      source: item.source || 'ARCHIVAL_INVESTIGATION',
      caseStatus: item.caseStatus || 'Solved',
      title: {
        english: item.title,
        romaji: item.title,
        native: item.studio || ''
      },
      coverImage: {
        large: posterUri,
        medium: posterUri,
        color: primaryPlat.color
      },
      format: item.format || 'DOCUSERIES',
      status: item.status || 'FINISHED',
      episodes: item.episodes || 1,
      duration: item.duration || 50,
      season: 'DOSSIER',
      seasonYear: item.seasonYear || 2020,
      averageScore: item.averageScore || 86,
      meanScore: item.averageScore || 86,
      popularity: item.popularity || 75000,
      favourites: Math.round((item.popularity || 50000) / 12),
      genres: item.genres || ['Docuseries'],
      isAdult: false,
      description: item.description || '',
      trailer: item.trailerId ? { id: item.trailerId, site: 'youtube', thumbnail: `https://i.ytimg.com/vi/${item.trailerId}/hqdefault.jpg` } : null,
      studios: {
        nodes: [{ id: item.id * 10, name: item.studio || 'Independent Investigation' }]
      },
      tags: (item.tags || []).map(([name, rank]) => ({
        name,
        rank: rank || 80,
        isMediaSpoiler: false,
        isGeneralSpoiler: false
      })),
      externalLinks: (() => {
        const key = String(item.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const hasVerified = Boolean(global.TRUECRIME_STREAMING_LINKS && Object.prototype.hasOwnProperty.call(global.TRUECRIME_STREAMING_LINKS, key));
        const directMap = hasVerified ? (global.TRUECRIME_STREAMING_LINKS[key] || {}) : {};
        if (hasVerified) {
          return Object.entries(directMap).map(([pid, directUrl]) => {
            const p = PLATFORM_BY_ID[pid];
            if (!p || !directUrl) return null;
            return { site: p.name, platformId: pid, url: directUrl, isDirect: true, type: 'STREAMING' };
          }).filter(Boolean);
        }
        if (item.format === 'PODCAST') {
          const p = PLATFORM_BY_ID.podcasts;
          return p ? [{ site: p.name, platformId: 'podcasts', url: p.searchUrl(item.title), isDirect: false, type: 'STREAMING' }] : [];
        }
        return [];
      })(),
      _verifiedStreaming: (() => {
        const key = String(item.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return Boolean(global.TRUECRIME_STREAMING_LINKS && Object.prototype.hasOwnProperty.call(global.TRUECRIME_STREAMING_LINKS, key));
      })(),
      _matchedPlatforms: (() => {
        const key = String(item.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const hasVerified = Boolean(global.TRUECRIME_STREAMING_LINKS && Object.prototype.hasOwnProperty.call(global.TRUECRIME_STREAMING_LINKS, key));
        if (hasVerified) {
          const verifiedPids = Object.keys(global.TRUECRIME_STREAMING_LINKS[key] || {}).filter(pid => Boolean(PLATFORM_BY_ID[pid]));
          return item.format === 'PODCAST' ? Array.from(new Set(['podcasts', ...verifiedPids])) : verifiedPids;
        }
        return (item.platforms || []).filter(pid => Boolean(PLATFORM_BY_ID[pid]));
      })(),
      nextAiringEpisode: item.nextAiringEpisode || null,
      relations: { edges: [] },
      characters: { edges: [] },
      staff: {
        edges: (item.staff || []).map((st, idx) => ({
          role: st.role,
          node: { id: item.id * 100 + idx, name: { full: st.name } }
        }))
      }
    };
  });

  // Merge IMDb Official Dataset Index (imdb-catalog.js: 400 Crime + Documentary titles >=1,200 votes)
  if (Array.isArray(global.TRUECRIME_IMDB_CATALOG)) {
    const byNormTitle = new Map(
      CANONICAL_DOSSIER_LIST.map(m => [String(m.title?.english || '').toLowerCase().replace(/[^a-z0-9]/g, ''), m])
    );
    for (const row of global.TRUECRIME_IMDB_CATALOG) {
      if (!row || !row.imdbId || !row.title) continue;
      const normKey = String(row.title).toLowerCase().replace(/[^a-z0-9]/g, '');
      const existing = byNormTitle.get(normKey);
      if (existing) {
        existing.imdbId = row.imdbId;
        existing.imdbRating = row.imdbRating;
        existing.imdbVotes = row.imdbVotes;
        if (row.rt) existing.rottenTomatoes = row.rt;
        if (row.rated) existing.mpaaRated = row.rated;
        if (row.poster && String(existing.coverImage?.large || '').startsWith('data:image/svg+xml')) {
          existing.coverImage = { large: row.poster, medium: row.poster, color: '#f59e0b' };
        }
        if (row.streamUrls && typeof row.streamUrls === 'object') {
          existing._verifiedStreaming = true;
          const verifiedPids = Object.keys(row.streamUrls).filter(pid => Boolean(PLATFORM_BY_ID[pid]));
          existing._matchedPlatforms = existing.format === 'PODCAST' ? Array.from(new Set(['podcasts', ...verifiedPids])) : verifiedPids;
          existing.externalLinks = verifiedPids.map(pid => {
            const p = PLATFORM_BY_ID[pid];
            return { site: p.name, platformId: pid, url: row.streamUrls[pid], isDirect: true, type: 'STREAMING' };
          });
        }
        continue;
      }
      const isTv = row.type === 'tvSeries' || row.type === 'tvMiniSeries';
      const id = 3000000 + (parseInt(row.imdbId.replace(/\D/g, ''), 10) % 900000);
      const low = (row.title + ' ' + (row.plot || '')).toLowerCase();
      const caseStatus = /unsolved|cold|missing|disappear|vanish/.test(low)
        ? 'Cold Case'
        : /innocent|exonerat|wrongful|paradise/.test(low)
          ? 'Exonerated'
          : 'Solved';
      const inferredTags = [{ name: 'Investigative Journalism', rank: 84 }];
      if (/forensic|dna|autopsy/.test(low)) inferredTags.push({ name: 'Forensic DNA', rank: 90 });
      if (/cold|unsolved|missing|disappear/.test(low)) inferredTags.push({ name: 'Cold Case', rank: 88 });
      if (/killer|murder|homicide|serial|stalker|ripper/.test(low)) inferredTags.push({ name: 'Serial Offender', rank: 86 });
      if (/cult|heaven|prophet|sect|jonestown/.test(low)) inferredTags.push({ name: 'Cult & High-Control Group', rank: 90 });
      if (/fraud|scam|enron|fyre|heist|cartel|mob|mafia|cocaine|drug/.test(low)) inferredTags.push({ name: 'Corporate & White-Collar Fraud', rank: 88 });
      if (/trial|court|attorney|prosecut|innocent|exonerat|wrongful/.test(low)) inferredTags.push({ name: 'Courtroom & Legal', rank: 86 });
      if (row.year >= 1970 && row.year < 1980) inferredTags.push({ name: '1970s Era', rank: 85 });
      else if (row.year >= 1980 && row.year < 1990) inferredTags.push({ name: '1980s Era', rank: 85 });
      else if (row.year >= 1990 && row.year < 2000) inferredTags.push({ name: '1990s Era', rank: 85 });

      const posterUri = row.poster || makeDossierPosterDataUri(row.title, `IMDb ★ ${row.imdbRating} · ${row.year}`, '#f59e0b', isTv ? 'IMDB SERIES' : 'IMDB FILM');
      const directors = row.director ? row.director.split(',').map(s => s.trim()).filter(Boolean) : [];
      const rowStreamUrls = (row.streamUrls && typeof row.streamUrls === 'object')
        ? row.streamUrls
        : ((global.TRUECRIME_STREAMING_LINKS && global.TRUECRIME_STREAMING_LINKS[normKey]) || {});
      const rowPlatforms = Array.from(new Set([...(row.platforms || []), ...Object.keys(rowStreamUrls)])).filter(pid => Boolean(PLATFORM_BY_ID[pid]));
      const primaryPlat = rowPlatforms.length ? PLATFORM_BY_ID[rowPlatforms[0]] : null;
      const streamExtLinks = rowPlatforms.map(pid => {
        const p = PLATFORM_BY_ID[pid];
        if (!p) return null;
        const directUrl = rowStreamUrls[pid];
        return {
          site: p.name,
          platformId: pid,
          url: directUrl || (p.searchUrl ? p.searchUrl(row.title) : `https://www.justwatch.com/us/search?q=${encodeURIComponent(row.title)}`),
          isDirect: Boolean(directUrl),
          type: 'STREAMING'
        };
      }).filter(Boolean);
      const node = {
        id,
        idMal: id,
        imdbId: row.imdbId,
        imdbRating: row.imdbRating,
        imdbVotes: row.imdbVotes,
        rottenTomatoes: row.rt || '',
        mpaaRated: row.rated || '',
        _needsPosterHydration: !row.poster,
        countryOfOrigin: 'US',
        source: 'ARCHIVAL_INVESTIGATION',
        caseStatus,
        title: { english: row.title, romaji: row.title, native: `IMDb ${row.imdbId}` },
        coverImage: { large: posterUri, medium: posterUri, color: '#f59e0b' },
        format: isTv ? 'DOCUSERIES' : 'FEATURE_DOC',
        status: 'FINISHED',
        episodes: isTv ? null : 1,
        duration: row.runtime || (isTv ? 48 : 92),
        season: 'IMDB',
        seasonYear: row.year,
        averageScore: Math.round((row.imdbRating || 7.5) * 10),
        meanScore: Math.round((row.imdbRating || 7.5) * 10),
        popularity: row.imdbVotes || 5000,
        favourites: Math.round((row.imdbVotes || 5000) / 10),
        genres: [isTv ? 'Docuseries' : 'Feature Documentary', ...(row.genres || []).filter(g => g !== 'Documentary' && g !== 'Crime')],
        isAdult: false,
        description: row.plot || `IMDb-verified True Crime ${isTv ? 'Docuseries' : 'Documentary Film'} (${row.year}) rated ★ ${row.imdbRating}/10 across ${Number(row.imdbVotes || 0).toLocaleString()} IMDb user votes.`,
        trailer: null,
        studios: { nodes: [{ id: id + 1, name: primaryPlat ? primaryPlat.name : 'IMDb True Crime Index' }] },
        tags: inferredTags,
        externalLinks: [
          { site: 'IMDb', url: `https://www.imdb.com/title/${row.imdbId}/`, type: 'INFO' },
          ...streamExtLinks
        ],
        _verifiedStreaming: true,
        _matchedPlatforms: rowPlatforms,
        nextAiringEpisode: null,
        relations: { edges: [] },
        characters: { edges: [] },
        staff: {
          edges: directors.map((dName, dIdx) => ({
            role: 'Director',
            node: { id: id * 10 + dIdx, name: { full: dName } }
          }))
        }
      };
      CANONICAL_DOSSIER_LIST.push(node);
      byNormTitle.set(normKey, node);
    }
  }

  const CANONICAL_BY_ID = new Map(CANONICAL_DOSSIER_LIST.map(m => [m.id, m]));

  // --------------------------------------------------------------------------
  // Utilities
  // --------------------------------------------------------------------------
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function stripHtml(html) {
    if (!html) return '';
    return String(html)
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/~!([\s\S]*?)!~/g, '$1')
      .replace(/&quot;/g, '"')
      .replace(/&#039;|&apos;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function getDisplayTitle(media) {
    if (!media) return 'Untitled Case';
    if (typeof media.title === 'string') return media.title;
    return media.title?.english || media.title?.romaji || media.title?.native || 'Untitled Case';
  }

  function safeUrl(rawUrl, fallback = '#') {
    if (!rawUrl || typeof rawUrl !== 'string') return fallback;
    const trimmed = rawUrl.trim();
    if (!trimmed) return fallback;
    if (trimmed.startsWith('./') || trimmed.startsWith('/') || trimmed.startsWith('data:image/svg+xml')) {
      return trimmed.replace(/^data:image\/svg\+xml;utf8,/i, 'data:image/svg+xml;charset=utf-8,');
    }
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        return parsed.href;
      }
    } catch {}
    return fallback;
  }

  function getCover(media) {
    if (!media) return '';
    const id = Number(media.id);
    if (id && CANONICAL_POSTERS_BY_ID[id]) {
      return CANONICAL_POSTERS_BY_ID[id];
    }
    const raw = typeof media.cover === 'string' && media.cover
      ? media.cover
      : (media.coverImage?.large || media.coverImage?.extraLarge || media.coverImage?.medium || '');
    if (raw && /^https?:\/\//i.test(raw)) {
      return raw.replace(/^http:\/\//i, 'https://');
    }
    if (raw && raw.startsWith('data:image/svg+xml')) {
      return raw.replace(/^data:image\/svg\+xml;utf8,/i, 'data:image/svg+xml;charset=utf-8,');
    }
    return makeDossierPosterDataUri(getDisplayTitle(media), media.seasonYear || 'CASE FILE', '#f59e0b', media.caseStatus || 'DOSSIER');
  }

  // Automatic broken-image fallback to crisp SVG dossier poster
  if (typeof global.addEventListener === 'function') {
    global.addEventListener('error', (ev) => {
      const el = ev.target;
      if (el && el.tagName === 'IMG' && !el.dataset.fallbackApplied) {
        el.dataset.fallbackApplied = '1';
        el.src = makeDossierPosterDataUri(el.alt || 'Case Dossier', 'TRUE CRIME FILE', '#f59e0b', 'DOSSIER');
      }
    }, true);
  }

  function normalizeStatus(status) {
    if (!status) return 'Case Backlog';
    const s = String(status).trim().toLowerCase();
    if (s === 'paused' || s === 'on hold' || s === 'cold / on hold' || s === 'cold') return 'Cold / On Hold';
    if (s === 'current' || s === 'watching' || s === 'repeating' || s === 'investigating') return 'Investigating';
    if (s === 'planning' || s === 'plan to watch' || s === 'case backlog') return 'Case Backlog';
    if (s === 'completed' || s === 'closed / watched' || s === 'closed') return 'Closed / Watched';
    if (s === 'dropped' || s === 'abandoned') return 'Abandoned';
    return WATCHLIST_STATUSES.find(w => w.toLowerCase() === s) || 'Case Backlog';
  }

  function formatCompactNumber(n) {
    if (!n && n !== 0) return '—';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
  }

  function formatRelativeCountdown(unixSec) {
    const diffSec = unixSec - Math.floor(Date.now() / 1000);
    const abs = Math.abs(diffSec);
    const hrs = Math.floor(abs / 3600);
    const mins = Math.floor((abs % 3600) / 60);
    if (diffSec <= 0) {
      if (hrs < 1) return `${Math.max(1, mins)}m ago`;
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      return `${days}d ${hrs % 24}h ago`;
    }
    if (hrs < 1) return `in ${Math.max(1, mins)}m`;
    if (hrs < 24) return `in ${hrs}h ${mins}m`;
    const days = Math.floor(hrs / 24);
    return `in ${days}d ${hrs % 24}h`;
  }

  function toast(message, type = 'info', duration = 3400) {
    let stack = document.getElementById('af-toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.id = 'af-toast-stack';
      stack.className = 'toast-stack';
      stack.setAttribute('aria-live', 'polite');
      document.body.appendChild(stack);
    }
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    stack.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.25s';
      setTimeout(() => el.remove(), 260);
    }, duration);
  }

  function encodeBase64Utf8(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  function decodeBase64Utf8(b64) {
    const binary = atob(b64.trim());
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }

  // --------------------------------------------------------------------------
  // Shared IndexedDB Cache (TrueCrimeFinderCacheDB v2: apiCache + vectors)
  // --------------------------------------------------------------------------
  let dbPromise = null;

  function openCacheDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve) => {
      if (!('indexedDB' in global)) {
        resolve(null);
        return;
      }
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (ev) => {
          const db = ev.target.result;
          if (!db.objectStoreNames.contains('apiCache')) {
            db.createObjectStore('apiCache', { keyPath: 'key' });
          }
          if (!db.objectStoreNames.contains('vectors')) {
            db.createObjectStore('vectors', { keyPath: 'id' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
    return dbPromise;
  }

  function isEmptyCachePayload(data) {
    if (data == null) return true;
    if (Array.isArray(data) && data.length === 0) return true;
    if (typeof data === 'object' && Object.keys(data).length === 0) return true;
    return false;
  }

  async function cacheGet(key) {
    const db = await openCacheDB();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction('apiCache', 'readonly');
        const req = tx.objectStore('apiCache').get(key);
        req.onsuccess = () => {
          const rec = req.result;
          if (!rec) return resolve(null);
          if (rec.ttl && Date.now() - rec.ts > rec.ttl) {
            return resolve(null);
          }
          resolve(rec.data);
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  async function cacheSet(key, data, ttl = TTL_DYNAMIC) {
    if (isEmptyCachePayload(data)) return false;
    const db = await openCacheDB();
    if (!db) return false;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction('apiCache', 'readwrite');
        tx.objectStore('apiCache').put({ key, data, ts: Date.now(), ttl });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  }

  async function vectorGet(id) {
    const db = await openCacheDB();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction('vectors', 'readonly');
        const req = tx.objectStore('vectors').get(Number(id));
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  async function vectorSet(id, vector, textHash) {
    if (!vector || !vector.length) return false;
    const db = await openCacheDB();
    if (!db) return false;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction('vectors', 'readwrite');
        tx.objectStore('vectors').put({
          id: Number(id),
          vector: Array.from(vector),
          textHash: textHash || '',
          ts: Date.now()
        });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  }

  async function cacheStats() {
    const db = await openCacheDB();
    if (!db) return { apiCount: 0, vectorCount: 0 };
    const countStore = (name) => new Promise((resolve) => {
      try {
        const tx = db.transaction(name, 'readonly');
        const req = tx.objectStore(name).count();
        req.onsuccess = () => resolve(req.result || 0);
        req.onerror = () => resolve(0);
      } catch {
        resolve(0);
      }
    });
    const [apiCount, vectorCount] = await Promise.all([countStore('apiCache'), countStore('vectors')]);
    return { apiCount, vectorCount };
  }

  async function cacheClear(clearVectors = false) {
    const db = await openCacheDB();
    if (!db) return;
    const stores = clearVectors ? ['apiCache', 'vectors'] : ['apiCache'];
    await Promise.all(stores.map((name) => new Promise((resolve) => {
      try {
        const tx = db.transaction(name, 'readwrite');
        tx.objectStore(name).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    })));
  }

  // --------------------------------------------------------------------------
  // Shared localStorage State + Non-Destructive Save + Tombstone Conflict Merge
  // --------------------------------------------------------------------------
  const stateListeners = new Set();
  const syncStatusListeners = new Set();
  let currentSyncStatus = { state: 'local', label: 'Local Storage' };
  let gistPushTimer = null;

  function defaultState() {
    return {
      version: 2,
      updatedAt: 0,
      dirtyForGist: false,
      watchlist: {},
      tombstones: {},
      overrides: {},
      settings: {
        tmdbKey: '',
        omdbKey: '',
        gistToken: '',
        gistId: '',
        gistFilename: GIST_FILENAME,
        gistAutoSync: true,
        lastGistSync: 0,
        anilistUsername: ''
      }
    };
  }

  function readRawState() {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  function sanitizeState(raw) {
    const base = defaultState();
    const out = { ...raw };
    out.version = 2;
    out.updatedAt = Number(raw.updatedAt) || 0;
    out.dirtyForGist = Boolean(raw.dirtyForGist);
    out.watchlist = {};
    if (raw.watchlist && typeof raw.watchlist === 'object') {
      for (const [k, item] of Object.entries(raw.watchlist)) {
        if (!item || typeof item !== 'object') continue;
        const id = Number(item.id || k);
        if (!id) continue;
        out.watchlist[id] = {
          id,
          title: item.title || 'Untitled Case',
          cover: safeUrl(item.cover || '', ''),
          format: item.format || '',
          caseStatus: item.caseStatus || '',
          episodes: item.episodes ?? null,
          averageScore: item.averageScore ?? null,
          popularity: item.popularity ?? null,
          seasonYear: item.seasonYear ?? null,
          genres: Array.isArray(item.genres) ? item.genres : [],
          status: normalizeStatus(item.status),
          rating: Number(item.rating) || 0,
          progress: Math.max(0, Number(item.progress) || 0),
          notes: typeof item.notes === 'string' ? item.notes : '',
          dubOverride: item.dubOverride || '',
          dubLag: (item.dubLag === '' || item.dubLag == null) ? null : Math.max(0, Number(item.dubLag)),
          dubDay: item.dubDay !== undefined && item.dubDay !== null ? String(item.dubDay) : '',
          customPlatforms: Array.isArray(item.customPlatforms) ? item.customPlatforms : [],
          customFreeWithAds: Boolean(item.customFreeWithAds),
          updatedAt: Number(item.updatedAt) || out.updatedAt || 0
        };
      }
    }
    out.tombstones = (raw.tombstones && typeof raw.tombstones === 'object') ? { ...raw.tombstones } : {};
    out.overrides = {};
    if (raw.overrides && typeof raw.overrides === 'object') {
      for (const [k, ovr] of Object.entries(raw.overrides)) {
        if (!ovr || typeof ovr !== 'object') continue;
        const id = Number(ovr.id || k);
        if (!id) continue;
        out.overrides[id] = {
          ...ovr,
          status: ovr.status ? normalizeStatus(ovr.status) : undefined,
          rating: ovr.rating !== undefined ? (Number(ovr.rating) || 0) : undefined,
          progress: ovr.progress !== undefined ? Math.max(0, Number(ovr.progress) || 0) : undefined,
          notes: typeof ovr.notes === 'string' ? ovr.notes : undefined,
          dubOverride: ovr.dubOverride || '',
          dubLag: (ovr.dubLag === '' || ovr.dubLag == null) ? null : Math.max(0, Number(ovr.dubLag)),
          dubDay: ovr.dubDay !== undefined && ovr.dubDay !== null ? String(ovr.dubDay) : '',
          customPlatforms: Array.isArray(ovr.customPlatforms) ? ovr.customPlatforms : [],
          customFreeWithAds: Boolean(ovr.customFreeWithAds),
          updatedAt: Number(ovr.updatedAt) || out.updatedAt || 0
        };
      }
    }

    const legacyGist = raw.gistConfig || raw.gist || {};
    out.settings = {
      ...base.settings,
      ...(raw.settings || {}),
      gistToken: (raw.settings?.gistToken ?? legacyGist.token ?? ''),
      gistId: (raw.settings?.gistId ?? legacyGist.gistId ?? legacyGist.id ?? ''),
      gistUser: raw.settings?.gistUser || '',
      gistUrl: safeUrl(raw.settings?.gistUrl || '', ''),
      gistFilename: GIST_FILENAME,
      gistAutoSync: raw.settings?.gistAutoSync !== undefined ? Boolean(raw.settings.gistAutoSync) : true,
      tmdbKey: raw.settings?.tmdbKey ?? raw.tmdbKey ?? '',
      omdbKey: raw.settings?.omdbKey ?? '',
      lastGistSync: Number(raw.settings?.lastGistSync || 0),
      anilistUsername: raw.settings?.anilistUsername || ''
    };
    return out;
  }

  function getState() {
    return sanitizeState(readRawState());
  }

  function saveState(nextState, { triggerGist = false, clearDirty = false, notify = true } = {}) {
    const existingRaw = readRawState();
    const dirtyFlag = clearDirty ? false : (triggerGist ? true : Boolean(nextState.dirtyForGist ?? existingRaw.dirtyForGist));
    const merged = {
      ...existingRaw,
      ...nextState,
      version: 2,
      updatedAt: Date.now(),
      dirtyForGist: dirtyFlag
    };
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(merged));
    } catch (e) {
      console.error('Failed saving state:', e);
      toast('Storage quota exceeded — consider exporting a JSON backup.', 'error');
    }
    const clean = sanitizeState(merged);
    if (notify) {
      stateListeners.forEach(fn => {
        try { fn(clean); } catch (err) { console.error(err); }
      });
    }
    updateNavBadges(clean);
    if (triggerGist) {
      scheduleGistAutoPush();
    }
    return clean;
  }

  function onStateChange(fn) {
    stateListeners.add(fn);
    return () => stateListeners.delete(fn);
  }

  function setSyncStatus(state, label) {
    currentSyncStatus = { state, label };
    syncStatusListeners.forEach(fn => {
      try { fn(currentSyncStatus); } catch {}
    });
    const pill = document.getElementById('af-sync-pill');
    if (pill) {
      pill.dataset.state = state;
      const textEl = pill.querySelector('.sync-label');
      if (textEl) textEl.textContent = label;
    }
  }

  function onSyncStatus(fn) {
    syncStatusListeners.add(fn);
    fn(currentSyncStatus);
    return () => syncStatusListeners.delete(fn);
  }

  global.addEventListener('storage', (ev) => {
    if (ev.key === STATE_KEY) {
      const clean = getState();
      updateNavBadges(clean);
      stateListeners.forEach(fn => {
        try { fn(clean); } catch (err) { console.error(err); }
      });
    }
  });

  function upsertWatchlistItem(media, patch = {}) {
    const state = getState();
    const id = Number(media?.id || patch.id);
    if (!id) return null;
    const prev = state.watchlist[id] || {};
    const prevOvr = state.overrides[id] || {};
    const now = Date.now();
    const nextItem = {
      id,
      title: getDisplayTitle(media) || prev.title || 'Untitled Case',
      cover: getCover(media) || prev.cover || '',
      format: media?.format || prev.format || '',
      caseStatus: media?.caseStatus || prev.caseStatus || '',
      episodes: media?.episodes ?? prev.episodes ?? null,
      averageScore: media?.averageScore ?? prev.averageScore ?? null,
      popularity: media?.popularity ?? prev.popularity ?? null,
      seasonYear: media?.seasonYear ?? prev.seasonYear ?? null,
      genres: Array.isArray(media?.genres) && media.genres.length ? media.genres : (prev.genres || []),
      status: normalizeStatus(patch.status ?? prev.status ?? 'Case Backlog'),
      rating: patch.rating !== undefined ? Number(patch.rating) : (prev.rating || 0),
      progress: patch.progress !== undefined ? Math.max(0, Number(patch.progress)) : (prev.progress || 0),
      notes: patch.notes !== undefined ? String(patch.notes) : (prev.notes || ''),
      dubOverride: patch.dubOverride !== undefined ? patch.dubOverride : (prev.dubOverride ?? prevOvr.dubOverride ?? ''),
      dubLag: patch.dubLag !== undefined
        ? ((patch.dubLag === '' || patch.dubLag == null) ? null : Math.max(0, Number(patch.dubLag)))
        : (prev.dubLag ?? prevOvr.dubLag ?? null),
      dubDay: patch.dubDay !== undefined
        ? String(patch.dubDay ?? '')
        : String(prev.dubDay ?? prevOvr.dubDay ?? ''),
      customPlatforms: patch.customPlatforms !== undefined ? patch.customPlatforms : (prev.customPlatforms ?? prevOvr.customPlatforms ?? []),
      customFreeWithAds: patch.customFreeWithAds !== undefined ? Boolean(patch.customFreeWithAds) : Boolean(prev.customFreeWithAds ?? prevOvr.customFreeWithAds),
      updatedAt: now
    };

    state.watchlist[id] = nextItem;
    delete state.tombstones[id];

    state.overrides[id] = {
      status: nextItem.status,
      rating: nextItem.rating,
      progress: nextItem.progress,
      notes: nextItem.notes,
      dubOverride: nextItem.dubOverride,
      dubLag: nextItem.dubLag,
      dubDay: nextItem.dubDay,
      customPlatforms: nextItem.customPlatforms,
      customFreeWithAds: nextItem.customFreeWithAds,
      updatedAt: now
    };

    saveState(state, { triggerGist: true });
    return nextItem;
  }

  function removeWatchlistItem(mediaId) {
    const state = getState();
    const id = Number(mediaId);
    if (!id) return;
    delete state.watchlist[id];
    state.tombstones[id] = Date.now();
    saveState(state, { triggerGist: true });
  }

  function updateOverrides(mediaId, patch = {}) {
    const state = getState();
    const id = Number(mediaId);
    if (!id) return;
    const now = Date.now();
    const prev = state.overrides[id] || {};
    const prevWl = state.watchlist[id] || {};
    const next = {
      status: patch.status !== undefined ? normalizeStatus(patch.status) : (prev.status ?? prevWl.status),
      rating: patch.rating !== undefined ? (Number(patch.rating) || 0) : (prev.rating ?? prevWl.rating),
      progress: patch.progress !== undefined ? Math.max(0, Number(patch.progress) || 0) : (prev.progress ?? prevWl.progress),
      notes: patch.notes !== undefined ? String(patch.notes) : (prev.notes ?? prevWl.notes),
      dubOverride: patch.dubOverride !== undefined ? patch.dubOverride : (prev.dubOverride || ''),
      dubLag: patch.dubLag !== undefined
        ? ((patch.dubLag === '' || patch.dubLag == null) ? null : Math.max(0, Number(patch.dubLag)))
        : (prev.dubLag ?? null),
      dubDay: patch.dubDay !== undefined ? String(patch.dubDay ?? '') : String(prev.dubDay ?? ''),
      customPlatforms: patch.customPlatforms !== undefined ? patch.customPlatforms : (prev.customPlatforms || []),
      customFreeWithAds: patch.customFreeWithAds !== undefined ? Boolean(patch.customFreeWithAds) : Boolean(prev.customFreeWithAds),
      updatedAt: now
    };
    state.overrides[id] = next;
    if (state.watchlist[id]) {
      state.watchlist[id] = {
        ...state.watchlist[id],
        status: next.status ?? state.watchlist[id].status,
        rating: next.rating ?? state.watchlist[id].rating,
        progress: next.progress ?? state.watchlist[id].progress,
        notes: next.notes ?? state.watchlist[id].notes,
        dubOverride: next.dubOverride,
        dubLag: next.dubLag,
        dubDay: next.dubDay,
        customPlatforms: next.customPlatforms,
        customFreeWithAds: next.customFreeWithAds,
        updatedAt: now
      };
    }
    saveState(state, { triggerGist: true });
  }

  function updateSettings(patch) {
    const state = getState();
    state.settings = {
      ...state.settings,
      ...patch,
      gistFilename: GIST_FILENAME
    };
    saveState(state, { triggerGist: false });
    if (state.settings.gistToken && state.settings.gistId) {
      setSyncStatus('synced', 'Gist Ready');
    } else {
      setSyncStatus('local', 'Local Storage');
    }
    return state.settings;
  }

  function mergeRemotePayload(remoteRaw) {
    const local = getState();
    const remote = sanitizeState(remoteRaw || {});
    const mergedWatchlist = {};
    const mergedTombstones = { ...local.tombstones };

    for (const [id, ts] of Object.entries(remote.tombstones || {})) {
      const nTs = Number(ts) || 0;
      if (!mergedTombstones[id] || nTs > mergedTombstones[id]) {
        mergedTombstones[id] = nTs;
      }
    }

    const allIds = new Set([
      ...Object.keys(local.watchlist),
      ...Object.keys(remote.watchlist)
    ]);

    for (const id of allIds) {
      const l = local.watchlist[id];
      const r = remote.watchlist[id];
      const tombTs = Number(mergedTombstones[id] || 0);

      let winner = null;
      if (l && r) {
        winner = (Number(r.updatedAt) || 0) > (Number(l.updatedAt) || 0) ? r : l;
      } else {
        winner = l || r;
      }
      const winTs = Number(winner?.updatedAt || 0);
      if (winner && winTs >= tombTs) {
        mergedWatchlist[id] = { ...winner, status: normalizeStatus(winner.status) };
        if (winTs > tombTs) delete mergedTombstones[id];
      }
    }

    const mergedOverrides = { ...local.overrides };
    for (const [id, rOvr] of Object.entries(remote.overrides || {})) {
      const lOvr = mergedOverrides[id];
      if (!lOvr || (Number(rOvr.updatedAt) || 0) > (Number(lOvr.updatedAt) || 0)) {
        mergedOverrides[id] = rOvr;
      }
    }

    local.watchlist = mergedWatchlist;
    local.tombstones = mergedTombstones;
    local.overrides = mergedOverrides;
    return local;
  }

  // --------------------------------------------------------------------------
  // Unified GitHub Gist Auto-Sync (truecrimefinder-sync.json)
  // --------------------------------------------------------------------------
  function buildPortableSyncPayload(state, includeSecrets = false) {
    const payload = {
      version: 2,
      updatedAt: state.updatedAt || Date.now(),
      watchlist: state.watchlist,
      tombstones: state.tombstones,
      overrides: state.overrides
    };
    if (includeSecrets) {
      payload.settings = state.settings;
    }
    return payload;
  }

  async function gistPull({ silent = false } = {}) {
    const state = getState();
    const { gistToken, gistId } = state.settings;
    if (!gistToken || !gistId) {
      if (!silent) toast('Configure GitHub PAT & Gist ID first.', 'warn');
      return null;
    }
    const hadUnpushedLocalEdits = Boolean(state.dirtyForGist);
    setSyncStatus('syncing', 'Syncing...');
    try {
      const res = await fetch(`https://api.github.com/gists/${encodeURIComponent(gistId)}`, {
        headers: {
          Authorization: `Bearer ${gistToken}`,
          Accept: 'application/vnd.github+json'
        }
      });
      if (!res.ok) throw new Error(`GitHub API ${res.status}`);
      const gist = await res.json();
      const fileObj = gist.files?.[GIST_FILENAME] || gist.files?.[LEGACY_GIST_FILENAME];
      if (!fileObj || !fileObj.content) {
        setSyncStatus('synced', 'Gist Synced');
        if (hadUnpushedLocalEdits) {
          await gistPush({ silent: true });
        }
        return state;
      }
      const remoteData = JSON.parse(fileObj.content);
      const remoteTs = Number(remoteData?.updatedAt) || 0;
      const localTs = Number(state.updatedAt) || 0;
      const merged = mergeRemotePayload(remoteData);
      merged.settings.lastGistSync = Date.now();
      saveState(merged, { triggerGist: false, clearDirty: !hadUnpushedLocalEdits });
      setSyncStatus('synced', 'Gist Synced');
      if (hadUnpushedLocalEdits || localTs > remoteTs) {
        await gistPush({ silent: true });
      }
      if (!silent) toast(`Pulled ${Object.keys(merged.watchlist).length} case files from Gist.`, 'success');
      return merged;
    } catch (err) {
      console.error('Gist pull error:', err);
      setSyncStatus('error', 'Sync Error');
      if (!silent) toast(`Gist pull failed: ${err.message}`, 'error');
      return null;
    }
  }

  async function gistPush({ silent = false } = {}) {
    const state = getState();
    const { gistToken, gistId } = state.settings;
    if (!gistToken || !gistId) {
      if (!silent) toast('Configure GitHub PAT & Gist ID first.', 'warn');
      return false;
    }
    setSyncStatus('syncing', 'Pushing...');
    try {
      const body = {
        description: 'TrueCrimeFinder Web Suite — Synced Case File Watchlist & Overrides',
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(buildPortableSyncPayload(state, false), null, 2)
          }
        }
      };
      const res = await fetch(`https://api.github.com/gists/${encodeURIComponent(gistId)}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${gistToken}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(`GitHub API ${res.status}`);
      state.settings.lastGistSync = Date.now();
      saveState(state, { triggerGist: false, clearDirty: true, notify: false });
      setSyncStatus('synced', 'Gist Synced');
      if (!silent) toast('Pushed Case File Watchlist & overrides to Private Gist.', 'success');
      return true;
    } catch (err) {
      console.error('Gist push error:', err);
      setSyncStatus('error', 'Sync Error');
      if (!silent) toast(`Gist push failed: ${err.message}`, 'error');
      return false;
    }
  }

  async function gistCreateNew(token) {
    if (!token) {
      toast('Enter a GitHub Personal Access Token (gist scope) first.', 'warn');
      return null;
    }
    setSyncStatus('syncing', 'Creating Gist...');
    try {
      const state = getState();
      const res = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: 'TrueCrimeFinder Web Suite — Synced Case File Watchlist & Overrides',
          public: false,
          files: {
            [GIST_FILENAME]: {
              content: JSON.stringify(buildPortableSyncPayload(state, false), null, 2)
            }
          }
        })
      });
      if (!res.ok) throw new Error(`GitHub API ${res.status}`);
      const created = await res.json();
      updateSettings({
        gistToken: token,
        gistId: created.id,
        gistUrl: created.html_url || `https://gist.github.com/${created.id}`,
        gistUser: created.owner?.login || state.settings.gistUser || '',
        gistAutoSync: true,
        lastGistSync: Date.now()
      });
      setSyncStatus('synced', 'Gist Synced');
      toast(`Created private Gist (${created.id.slice(0, 8)}...)!`, 'success');
      return created.id;
    } catch (err) {
      setSyncStatus('error', 'Sync Error');
      toast(`Could not create Gist: ${err.message}`, 'error');
      return null;
    }
  }

  async function gistConnectAndSetup(token, { autoCreate = true } = {}) {
    const cleanToken = String(token || '').trim();
    if (!cleanToken) throw new Error('Paste a GitHub Personal Access Token (gist scope) first.');
    setSyncStatus('syncing', 'Verifying GitHub...');

    const headers = {
      Authorization: `Bearer ${cleanToken}`,
      Accept: 'application/vnd.github+json'
    };

    const userRes = await fetch('https://api.github.com/user', { headers });
    if (!userRes.ok) {
      setSyncStatus('error', 'Auth Failed');
      throw new Error(userRes.status === 401 ? 'Invalid or expired GitHub token.' : `GitHub auth error (${userRes.status})`);
    }
    const user = await userRes.json();
    const login = user.login || '';

    const gistsRes = await fetch('https://api.github.com/gists?per_page=100', { headers });
    let existing = null;
    if (gistsRes.ok) {
      const list = await gistsRes.json();
      if (Array.isArray(list)) {
        existing = list.find(g => g.files?.[GIST_FILENAME] || g.files?.[LEGACY_GIST_FILENAME]);
      }
    }

    if (existing) {
      updateSettings({
        gistToken: cleanToken,
        gistId: existing.id,
        gistUser: login,
        gistUrl: existing.html_url || `https://gist.github.com/${login}/${existing.id}`,
        gistAutoSync: true
      });
      const merged = await gistPull({ silent: true });
      await gistPush({ silent: true });
      return { mode: 'connected_existing', login, gistId: existing.id, htmlUrl: existing.html_url, count: Object.keys(merged?.watchlist || getState().watchlist).length };
    }

    if (!autoCreate) {
      updateSettings({ gistToken: cleanToken, gistUser: login });
      return { mode: 'verified_only', login, gistId: '', htmlUrl: '' };
    }

    const createdId = await gistCreateNew(cleanToken);
    if (!createdId) throw new Error('Token verified, but creating the private Gist failed. Confirm the "gist" scope is checked.');
    updateSettings({ gistUser: login });
    const st = getState();
    return {
      mode: 'created_new',
      login,
      gistId: createdId,
      htmlUrl: st.settings.gistUrl || `https://gist.github.com/${login}/${createdId}`,
      count: Object.keys(st.watchlist || {}).length
    };
  }

  function gistDisconnect() {
    updateSettings({ gistToken: '', gistId: '', gistUser: '', gistUrl: '', lastGistSync: 0 });
    setSyncStatus('local', 'Local Storage');
  }

  function scheduleGistAutoPush() {
    const { gistToken, gistId, gistAutoSync } = getState().settings;
    if (!gistToken || !gistId || !gistAutoSync) return;
    if (gistPushTimer) clearTimeout(gistPushTimer);
    setSyncStatus('syncing', 'Queued...');
    gistPushTimer = setTimeout(() => {
      gistPushTimer = null;
      gistPush({ silent: true });
    }, 600);
  }

  function generateSyncCode() {
    const payload = buildPortableSyncPayload(getState(), false);
    return encodeBase64Utf8(JSON.stringify(payload));
  }

  function applySyncCode(code) {
    const decoded = decodeBase64Utf8(code);
    const parsed = JSON.parse(decoded);
    const merged = mergeRemotePayload(parsed);
    saveState(merged, { triggerGist: true });
    return merged;
  }

  function checkHashSyncOnBoot() {
    const hash = global.location.hash || '';
    if (!hash.startsWith('#sync=')) return;
    try {
      const encoded = decodeURIComponent(hash.slice(6));
      if (!encoded) return;
      const merged = applySyncCode(encoded);
      history.replaceState(null, '', global.location.pathname + global.location.search);
      toast(`Merged ${Object.keys(merged.watchlist).length} case files from #sync link!`, 'success');
    } catch (err) {
      console.error('Invalid #sync hash:', err);
      toast('Could not decode #sync link.', 'error');
    }
  }

  // --------------------------------------------------------------------------
  // 12-Network Streaming Detection & Case Status / Release Track Classifier
  // --------------------------------------------------------------------------
  function detectPlatforms(media, extraStreaming = []) {
    const found = new Set();
    const state = getState();
    const id = Number(media?.id);
    const ovr = (id && (state.overrides[id] || state.watchlist[id])) || null;

    if (ovr?.customPlatforms?.length) {
      ovr.customPlatforms.forEach(pid => {
        if (PLATFORM_BY_ID[pid]) found.add(pid);
      });
    }

    const links = Array.isArray(media?.externalLinks) ? media.externalLinks : [];
    for (const link of links) {
      const site = String(link.site || '').toLowerCase();
      const url = String(link.url || '').toLowerCase();
      for (const p of PLATFORM_CONFIG) {
        if (
          p.aliases.some(a => site.includes(a)) ||
          p.domains.some(d => url.includes(d))
        ) {
          found.add(p.id);
        }
      }
    }

    if (Array.isArray(media?._matchedPlatforms)) {
      media._matchedPlatforms.forEach(pid => {
        if (PLATFORM_BY_ID[pid]) found.add(pid);
      });
    }

    // Only infer from studioName if this item does NOT already have verified US streaming data
    if (!media?._verifiedStreaming) {
      const studioName = String(media?.studios?.nodes?.[0]?.name || '').toLowerCase();
      if (studioName) {
        for (const p of PLATFORM_CONFIG) {
          if (p.aliases.some(a => a.length >= 4 && studioName.includes(a))) {
            found.add(p.id);
          }
        }
      }
    }

    for (const name of extraStreaming) {
      const lower = String(name || '').toLowerCase();
      for (const p of PLATFORM_CONFIG) {
        if (p.aliases.some(a => lower.includes(a))) {
          found.add(p.id);
        }
      }
    }

    return Array.from(found).map(pid => PLATFORM_BY_ID[pid]).filter(Boolean);
  }

  function getStreamingLinks(media, extraLinks = [], extraStreaming = []) {
    const out = [];
    const byKey = new Map();
    const title = getDisplayTitle(media);
    const normKey = String(title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const bakedMap = (global.TRUECRIME_STREAMING_LINKS && global.TRUECRIME_STREAMING_LINKS[normKey]) || {};

    const upsertLink = (key, name, url, color, isDirect = false, freeWithAds = false) => {
      if (!url || !/^https?:\/\//i.test(url)) return;
      if (/justwatch\.com/i.test(url) && !isDirect) return;
      const k = String(key || name).toLowerCase();
      const existing = byKey.get(k);
      if (existing) {
        if (!existing.isDirect && isDirect) {
          existing.url = url;
          existing.isDirect = true;
        }
        return;
      }
      const entry = { name, url, color: color || '#38bdf8', isDirect, freeWithAds };
      byKey.set(k, entry);
      out.push(entry);
    };

    // 1. Verified direct URLs baked in streaming-links.js
    for (const [pid, directUrl] of Object.entries(bakedMap)) {
      const p = PLATFORM_BY_ID[pid];
      if (p && directUrl) {
        upsertLink(p.id, p.name, directUrl, p.color, true, Boolean(p.freeWithAds));
      }
    }

    // 2. Explicit streaming externalLinks on the media object
    for (const l of (media?.externalLinks || [])) {
      const site = String(l.site || '').trim();
      if (!site || !l.url || site.toLowerCase().includes('justwatch')) continue;
      const plat = (l.platformId && PLATFORM_BY_ID[l.platformId]) || PLATFORM_CONFIG.find(p =>
        p.aliases.some(a => site.toLowerCase().includes(a)) ||
        p.domains.some(d => String(l.url).toLowerCase().includes(d))
      );
      if (plat || l.type === 'STREAMING') {
        const direct = Boolean(l.isDirect) || (!/search/i.test(l.url) && !/justwatch/i.test(l.url));
        upsertLink(plat ? plat.id : site, plat ? plat.name : site, l.url, plat?.color, direct, Boolean(plat?.freeWithAds));
      }
    }

    // 3. Live extra links (e.g. TVMaze officialSite, Apple Podcasts collectionViewUrl)
    for (const s of (extraLinks || [])) {
      if (!s?.name || !s?.url) continue;
      const plat = PLATFORM_CONFIG.find(p =>
        p.aliases.some(a => s.name.toLowerCase().includes(a)) ||
        p.domains.some(d => String(s.url).toLowerCase().includes(d))
      );
      upsertLink(plat ? plat.id : s.name, plat ? plat.name : s.name, s.url, plat?.color, true, Boolean(plat?.freeWithAds));
    }

    // 4. Add service links for user's explicit Custom Streaming Overrides & live TMDB extraStreaming
    const state = getState();
    const id = Number(media?.id);
    const ovr = (id && (state.overrides[id] || state.watchlist[id])) || null;
    const extraPids = new Set(ovr?.customPlatforms || []);
    for (const name of (extraStreaming || [])) {
      const lower = String(name || '').toLowerCase();
      if (lower.includes('channel') || lower.includes('youtube tv')) continue;
      for (const p of PLATFORM_CONFIG) {
        if (p.aliases.some(a => a.length >= 4 && lower.includes(a))) extraPids.add(p.id);
      }
    }
    for (const pid of extraPids) {
      const p = PLATFORM_BY_ID[pid];
      if (!p) continue;
      const url = bakedMap[p.id] || (p.searchUrl ? p.searchUrl(title) : '');
      if (url) {
        upsertLink(p.id, p.name, url, p.color, Boolean(bakedMap[p.id]), Boolean(p.freeWithAds));
      }
    }

    return out;
  }

  function isFreeWithAds(media, platforms) {
    const state = getState();
    const id = Number(media?.id);
    const ovr = id && (state.overrides[id] || state.watchlist[id]);
    if (ovr?.customFreeWithAds) return true;
    const list = platforms || detectPlatforms(media);
    return list.some(p => p.freeWithAds);
  }

  function getDubLanguages(media) {
    const fmt = String(media?.format || '').toUpperCase();
    if (fmt === 'PODCAST') return ['AUDIO', 'TRANSCRIPT'];
    return ['EN', 'CC'];
  }

  function classifyDub(media) {
    const state = getState();
    const id = Number(media?.id);
    const ovr = id && (state.overrides[id] || state.watchlist[id]);
    const hasLag = ovr && typeof ovr.dubLag === 'number' && !Number.isNaN(ovr.dubLag);

    // Numeric episode release lag=0 automatically promotes to Simul-Release
    if (hasLag) {
      if (ovr.dubLag === 0) return 'Simul-Release';
      if (ovr.dubLag > 0 && (!ovr.dubOverride || ovr.dubOverride === 'Simul-Release')) {
        return 'Staggered Release';
      }
    }
    if (ovr?.dubOverride) {
      return ovr.dubOverride;
    }
    if (media?.caseStatus) return media.caseStatus;
    const tags = (media?.tags || []).map(t => (t.name || '').toLowerCase());
    if (tags.some(t => t.includes('wrongful') || t.includes('exonerat'))) return 'Exonerated';
    if (tags.some(t => t.includes('cold case') || t.includes('unsolved'))) return 'Cold Case';
    return 'Solved';
  }

  function getDubTrackInfo(media, currentSubEp = null) {
    const state = getState();
    const id = Number(media?.id);
    const ovr = (id && (state.overrides[id] || state.watchlist[id])) || {};
    const dub = classifyDub(media);
    const langs = getDubLanguages(media);
    const otherLangs = [];
    const isSubOnly = false;
    const isSimuldub = dub === 'Simul-Release' || dub === 'Simuldub' || ovr.dubLag === 0;
    const dubLag = isSimuldub ? 0 : ((typeof ovr.dubLag === 'number' && !Number.isNaN(ovr.dubLag)) ? ovr.dubLag : null);
    const dubDay = ovr.dubDay !== undefined && ovr.dubDay !== '' ? Number(ovr.dubDay) : null;

    let dubEp = null;
    if (typeof currentSubEp === 'number' && currentSubEp > 0) {
      if (isSimuldub) dubEp = currentSubEp;
      else if (dubLag !== null && currentSubEp - dubLag >= 1) dubEp = currentSubEp - dubLag;
    }

    return {
      dub,
      hasEnDub: true,
      isSimuldub,
      dubLag,
      dubDay,
      dubEp,
      langs,
      otherLangs
    };
  }

  async function verifyDubStatusBatch(mediaList) {
    return mediaList;
  }

  // --------------------------------------------------------------------------
  // True Crime Metadata & Live Multi-API Query Engine (TVMaze + iTunes + Catalog)
  // --------------------------------------------------------------------------
  const MEDIA_CARD_FIELDS = 'id title coverImage format status episodes duration seasonYear averageScore popularity genres description trailer studios tags externalLinks nextAiringEpisode staff';

  function formatSourceLabel(source) {
    const map = {
      ARCHIVAL_INVESTIGATION: 'Archival Investigation',
      COURT_RECORDS: 'Court & Trial Records',
      JOURNALISM: 'Investigative Journalism',
      FORENSIC_LAB: 'Forensic Lab Casefile',
      BOOK_DOSSIER: 'Non-Fiction Book Dossier',
      OSINT: 'OSINT / Digital Sleuths',
      POLICE_RECORDS: 'Homicide Case File',
      PRISON_INTERVIEW: 'Direct Prison Tapes',
      TVMAZE_LIVE: 'TVMaze Broadcast Feed',
      ITUNES_PODCAST: 'Apple Podcasts True Crime'
    };
    return map[source] || 'Case Dossier';
  }

  function getTopSubgenreTags(media, max = 3) {
    return (media?.tags || [])
      .filter(t => t && !t.isMediaSpoiler && !t.isGeneralSpoiler && (t.rank || 0) >= 55)
      .sort((a, b) => (b.rank || 0) - (a.rank || 0))
      .slice(0, max)
      .map(t => t.name);
  }

  function getKeyStaff(media) {
    const edges = media?.staff?.edges || [];
    const out = [];
    const seen = new Set();
    for (const e of edges) {
      const name = e?.node?.name?.full;
      const role = e?.role || 'Investigator';
      if (!name || seen.has(name)) continue;
      seen.add(name);
      out.push({ role, name });
      if (out.length >= 4) break;
    }
    return out;
  }

  function isSequelOrRecap(media) {
    const title = getDisplayTitle(media);
    return /\b(season [2-9]|part [2-9]|volume [2-9]|recap|aftermath)\b/i.test(title);
  }

  async function fetchJsonSafe(url, timeoutMs = 5500) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  // Convert a live TVMaze show object into our normalized TrueCrimeFinder Media schema
  function normalizeTvMazeShow(show) {
    if (!show || !show.id || !show.name) return null;
    const id = 500000 + Number(show.id);
    const netName = show.network?.name || show.webChannel?.name || 'Broadcast Network';
    const year = show.premiered ? Number(show.premiered.slice(0, 4)) : 2024;
    const score = show.rating?.average ? Math.round(show.rating.average * 10) : 82;
    const rawGenres = Array.isArray(show.genres) ? show.genres : [];
    const isDoc = show.type === 'Documentary' || rawGenres.includes('Crime') || rawGenres.includes('Mystery');
    const fmt = show.type === 'Documentary' ? 'DOCUSERIES' : 'TV_SERIES';
    const desc = stripHtml(show.summary || 'True crime and investigative television series.');

    // Infer forensic tags from description & genres
    const inferredTags = [];
    const low = (show.name + ' ' + desc).toLowerCase();
    if (/forensic|dna|autopsy|pathology|blood/.test(low)) inferredTags.push({ name: 'Forensic DNA', rank: 90 });
    if (/cold case|unsolved|vanish|disappear|missing/.test(low)) inferredTags.push({ name: 'Cold Case', rank: 88 });
    if (/serial|stalker|killer|homicide|murder/.test(low)) inferredTags.push({ name: 'Serial Offender', rank: 84 });
    if (/trial|court|attorney|prosecut|innocen|exonerat|prison/.test(low)) inferredTags.push({ name: 'Courtroom & Legal', rank: 85 });
    if (/interrogat|confess|detective|police|fbi/.test(low)) inferredTags.push({ name: 'Police Interrogation', rank: 83 });
    if (/cult|sect|prophet/.test(low)) inferredTags.push({ name: 'Cult & High-Control Group', rank: 88 });
    if (/scam|fraud|con|heist|money/.test(low)) inferredTags.push({ name: 'Corporate & White-Collar Fraud', rank: 86 });
    if (!inferredTags.length) inferredTags.push({ name: 'Investigative Journalism', rank: 80 });

    const caseStatus = /unsolved|cold case|missing|vanish/.test(low)
      ? 'Cold Case'
      : /innocen|exonerat|wrongful/.test(low)
        ? 'Exonerated'
        : 'Solved';

    const cover = show.image?.original || show.image?.medium || makeDossierPosterDataUri(show.name, `${netName} · ${year}`, '#38bdf8', caseStatus.toUpperCase());

    return {
      id,
      _tvmazeId: show.id,
      countryOfOrigin: show.network?.country?.code || show.webChannel?.country?.code || 'US',
      source: 'TVMAZE_LIVE',
      caseStatus,
      title: { english: show.name, romaji: show.name, native: netName },
      coverImage: { large: cover.replace(/^http:\/\//i, 'https://'), medium: cover.replace(/^http:\/\//i, 'https://'), color: '#38bdf8' },
      format: fmt,
      status: show.status === 'Running' ? 'RELEASING' : 'FINISHED',
      episodes: show.weight ? Math.max(6, Math.round(show.weight / 4)) : null,
      duration: show.averageRuntime || show.runtime || 45,
      seasonYear: year,
      averageScore: score,
      popularity: (show.weight || 50) * 1400,
      genres: isDoc ? ['Docuseries', ...rawGenres.filter(g => g !== 'Crime')] : ['Biographical Crime Drama', ...rawGenres],
      isAdult: false,
      description: desc,
      trailer: null,
      studios: { nodes: [{ id: show.network?.id || show.webChannel?.id || id, name: netName }] },
      tags: inferredTags,
      externalLinks: show.officialSite ? [{ site: netName, url: show.officialSite, type: 'STREAMING' }] : (show.url ? [{ site: 'TVMaze', url: show.url, type: 'INFO' }] : []),
      nextAiringEpisode: null,
      relations: { edges: [] },
      characters: { edges: [] },
      staff: { edges: [] }
    };
  }

  // Convert a live Apple Podcasts / iTunes True Crime Podcast item into our normalized Media schema
  function normalizeItunesPodcast(pod) {
    if (!pod || !pod.collectionId || !pod.collectionName) return null;
    const id = 800000 + (Number(pod.collectionId) % 190000);
    const year = pod.releaseDate ? Number(pod.releaseDate.slice(0, 4)) : 2023;
    const studio = pod.artistName || 'True Crime Audio Network';
    const cover = (pod.artworkUrl600 || pod.artworkUrl100 || '').replace(/^http:\/\//i, 'https://') ||
      makeDossierPosterDataUri(pod.collectionName, studio, '#10b981', 'PODCAST');
    const low = (pod.collectionName + ' ' + studio + ' ' + (pod.genres || []).join(' ')).toLowerCase();
    const caseStatus = /unsolved|cold|missing|vanish/.test(low) ? 'Cold Case' : 'Solved';

    const tags = [
      { name: 'Investigative Journalism', rank: 92 },
      caseStatus === 'Cold Case' ? { name: 'Cold Case', rank: 88 } : { name: 'Police Interrogation', rank: 84 }
    ];

    return {
      id,
      countryOfOrigin: pod.country || 'US',
      source: 'ITUNES_PODCAST',
      caseStatus,
      title: { english: pod.collectionName, romaji: pod.collectionName, native: studio },
      coverImage: { large: cover, medium: cover, color: '#10b981' },
      format: 'PODCAST',
      status: 'RELEASING',
      episodes: pod.trackCount || 24,
      duration: 45,
      seasonYear: year,
      averageScore: 88,
      popularity: Math.min(180000, (pod.trackCount || 20) * 1850),
      genres: ['True Crime Podcast', 'Investigative Newsmagazine'],
      isAdult: false,
      description: `Investigative true crime podcast produced by ${studio} (${pod.trackCount || 'multiple'} episodes indexed on Apple Podcasts).`,
      trailer: null,
      studios: { nodes: [{ id: id + 1, name: studio }] },
      tags,
      externalLinks: pod.collectionViewUrl ? [{ site: 'Apple Podcasts', url: pod.collectionViewUrl, type: 'STREAMING' }] : [],
      _matchedPlatforms: ['podcasts'],
      nextAiringEpisode: null,
      relations: { edges: [] },
      characters: { edges: [] },
      staff: { edges: [{ role: 'Host / Producer', name: { full: studio }, node: { id: id + 2, name: { full: studio } } }] }
    };
  }

  async function fetchLiveTrueCrimePodcasts(term = 'true crime investigative', limit = 14) {
    const cacheKey = `itunes_tc_pods_${term.toLowerCase()}_${limit}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const url = `https://itunes.apple.com/search?media=podcast&genreId=1488&term=${encodeURIComponent(term)}&limit=${limit}`;
    const data = await fetchJsonSafe(url, 4800);
    const items = (data?.results || [])
      .map(normalizeItunesPodcast)
      .filter(Boolean);
    if (items.length) {
      items.forEach(m => { if (!CANONICAL_BY_ID.has(m.id)) CANONICAL_BY_ID.set(m.id, m); });
      await cacheSet(cacheKey, items, TTL_DYNAMIC);
    }
    return items;
  }

  // Strict True Crime filter for live TVMaze feeds (excludes talk shows, soaps, sitcoms, game shows, sports, nature docs, and scripted comedy/fantasy)
  const EXCLUDED_SHOW_TYPES = new Set(['Animation', 'Talk Show', 'Game Show', 'Sports', 'Variety', 'Award Show', 'Panel Show']);
  const EXCLUDED_GENRES = new Set(['Comedy', 'Children', 'Food', 'Travel', 'Nature', 'Music', 'Sports', 'Science-Fiction', 'Fantasy', 'Supernatural', 'Anime', 'DIY', 'Gardening']);
  const DEDICATED_CRIME_NET_RE = /\b(investigation discovery|^id$|oxygen|oxygen true crime|court tv|crime \+ investigation)\b/i;
  const TRUE_CRIME_SIGNAL_RE = /\b(true crime|murder|homicide|forensic|cold case|dateline|48 hours|20\/20|serial killer|unsolved|autopsy|interrogation|snapped|first 48|evil lives here|american monster|wrongful conviction|abducted|kidnap|body cam|detective|stalker|cult|heist|scam|fraud|manhunt|suspect|trial|verdict|inmate|prison|death row|crime scene|missing person|disappeared)\b/i;

  function isAuthenticTrueCrimeShow(s, epName = '') {
    if (!s || !s.name) return false;
    if (EXCLUDED_SHOW_TYPES.has(s.type)) return false;
    const genres = Array.isArray(s.genres) ? s.genres : [];
    if (genres.some(g => EXCLUDED_GENRES.has(g))) return false;

    const net = s.network?.name || s.webChannel?.name || '';
    const text = `${s.name} ${epName} ${stripHtml(s.summary || '')}`;
    const hasCrimeGenre = genres.includes('Crime') || genres.includes('Mystery') || genres.includes('Legal');
    const isNonFiction = s.type === 'Documentary' || s.type === 'News' || s.type === 'Reality';

    // 1. Dedicated True Crime networks (ID, Oxygen, Court TV)
    if (DEDICATED_CRIME_NET_RE.test(net) && (isNonFiction || hasCrimeGenre)) return true;

    // 2. Non-fiction Documentary / News / Reality that explicitly covers Crime/Mystery/Legal or matches True Crime keywords
    if (isNonFiction && (hasCrimeGenre || TRUE_CRIME_SIGNAL_RE.test(text))) return true;

    // 3. Biographical / True Crime dramas that match explicit true crime keywords and have Crime genre
    if (hasCrimeGenre && TRUE_CRIME_SIGNAL_RE.test(s.name + ' ' + stripHtml(s.summary || ''))) return true;

    return false;
  }

  // Official US JustWatch / TMDB Watch Provider IDs for live TMDB Discover queries
  const TMDB_PROVIDER_IDS = {
    netflix: '8',
    max: '1899',
    hulu: '15',
    peacock: '386',
    id: '520',
    oxygen: '79',
    paramount: '531',
    prime: '9',
    appletv: '350',
    tubi: '73',
    pluto: '300'
  };

  function normalizeTmdbItem(item, mediaType, platformHint = null) {
    if (!item || !item.id) return null;
    const isMovie = mediaType === 'movie';
    const title = isMovie ? (item.title || item.original_title) : (item.name || item.original_name);
    if (!title) return null;
    const id = (isMovie ? 9000000 : 8000000) + Number(item.id);
    const dateStr = isMovie ? item.release_date : item.first_air_date;
    const year = dateStr ? Number(dateStr.slice(0, 4)) : 2023;
    const score = item.vote_average ? Math.round(item.vote_average * 10) : 78;
    const cover = item.poster_path
      ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
      : makeDossierPosterDataUri(title, `TMDB · ${year}`, '#38bdf8', isMovie ? 'FEATURE DOC' : 'DOCUSERIES');
    const desc = stripHtml(item.overview || 'True crime documentary indexed via TMDB.');
    const low = (title + ' ' + desc).toLowerCase();
    const caseStatus = /unsolved|cold case|missing|vanish/.test(low)
      ? 'Cold Case'
      : /innocen|exonerat|wrongful/.test(low)
        ? 'Exonerated'
        : 'Solved';
    const tags = [{ name: 'Investigative Journalism', rank: 85 }];
    if (/forensic|dna|autopsy/.test(low)) tags.push({ name: 'Forensic DNA', rank: 90 });
    if (/cold case|unsolved|missing/.test(low)) tags.push({ name: 'Cold Case', rank: 88 });
    if (/serial|killer|murder|homicide/.test(low)) tags.push({ name: 'Serial Offender', rank: 84 });
    if (/cult|sect/.test(low)) tags.push({ name: 'Cult & High-Control Group', rank: 88 });
    if (/fraud|scam|con artist|heist/.test(low)) tags.push({ name: 'Corporate & White-Collar Fraud', rank: 86 });

    return {
      id,
      _tmdbId: item.id,
      countryOfOrigin: Array.isArray(item.origin_country) && item.origin_country[0] ? item.origin_country[0] : 'US',
      source: 'ARCHIVAL_INVESTIGATION',
      caseStatus,
      title: { english: title, romaji: title, native: isMovie ? 'TMDB Documentary Film' : 'TMDB Docuseries' },
      coverImage: { large: cover, medium: cover, color: '#38bdf8' },
      format: isMovie ? 'FEATURE_DOC' : 'DOCUSERIES',
      status: 'FINISHED',
      episodes: isMovie ? 1 : null,
      duration: isMovie ? 95 : 48,
      seasonYear: year,
      averageScore: score,
      popularity: Math.round((item.popularity || 15) * 2200),
      genres: [isMovie ? 'Feature Documentary' : 'Docuseries'],
      isAdult: false,
      description: desc,
      trailer: null,
      studios: { nodes: [{ id: id + 1, name: platformHint && PLATFORM_BY_ID[platformHint] ? PLATFORM_BY_ID[platformHint].name : 'TMDB True Crime' }] },
      tags,
      externalLinks: [{ site: 'JustWatch US', url: `https://www.justwatch.com/us/search?q=${encodeURIComponent(title)}`, type: 'STREAMING' }],
      _matchedPlatforms: platformHint && PLATFORM_BY_ID[platformHint] ? [platformHint] : [],
      nextAiringEpisode: null,
      relations: { edges: [] },
      characters: { edges: [] },
      staff: { edges: [] }
    };
  }

  // Live TMDB Discover for True Crime Movies & Docuseries (runs automatically when user saves a free TMDB v3 API key)
  async function fetchTmdbTrueCrimeDiscover({ platformId = 'all', startYear = null, endYear = null, pages = 2 } = {}) {
    const tmdbKey = getState().settings.tmdbKey;
    if (!tmdbKey) return [];
    const cacheKey = `tmdb_tc_disc_v1_${platformId}_${startYear || 'all'}_${endYear || 'all'}_${pages}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const provId = TMDB_PROVIDER_IDS[platformId] || '';
    const provParam = provId ? `&watch_region=US&with_watch_providers=${provId}` : '';
    const collected = [];
    const seen = new Set();

    const tasks = [];
    for (let p = 1; p <= pages; p++) {
      const tvDates = `${startYear ? `&first_air_date.gte=${startYear}-01-01` : ''}${endYear ? `&first_air_date.lte=${endYear}-12-31` : ''}`;
      const mvDates = `${startYear ? `&primary_release_date.gte=${startYear}-01-01` : ''}${endYear ? `&primary_release_date.lte=${endYear}-12-31` : ''}`;
      tasks.push(
        fetchJsonSafe(`https://api.themoviedb.org/3/discover/tv?api_key=${encodeURIComponent(tmdbKey)}&with_genres=99,80&sort_by=popularity.desc&page=${p}${provParam}${tvDates}`, 5200)
          .then(d => (d?.results || []).map(r => normalizeTmdbItem(r, 'tv', provId ? platformId : null)))
      );
      tasks.push(
        fetchJsonSafe(`https://api.themoviedb.org/3/discover/movie?api_key=${encodeURIComponent(tmdbKey)}&with_genres=99,80&sort_by=popularity.desc&page=${p}${provParam}${mvDates}`, 5200)
          .then(d => (d?.results || []).map(r => normalizeTmdbItem(r, 'movie', provId ? platformId : null)))
      );
    }

    const batches = await Promise.all(tasks);
    for (const list of batches) {
      for (const m of (list || [])) {
        if (!m) continue;
        const k = getDisplayTitle(m).toLowerCase();
        if (seen.has(k)) continue;
        seen.add(k);
        CANONICAL_BY_ID.set(m.id, m);
        collected.push(m);
      }
    }

    if (collected.length) await cacheSet(cacheKey, collected, TTL_STABLE);
    return collected;
  }

  // Live Multi-Topic TVMaze True Crime Pool (zero API key, cached 24h in IndexedDB — adds 100+ real shows & networks)
  let expandedTvMazePromise = null;
  async function fetchExpandedTvMazeCatalog(forceRefresh = false) {
    const cacheKey = 'tvmaze_expanded_tc_pool_v1';
    if (!forceRefresh) {
      const cached = await cacheGet(cacheKey);
      if (cached && cached.length) {
        cached.forEach(m => { if (!CANONICAL_BY_ID.has(m.id)) CANONICAL_BY_ID.set(m.id, m); });
        return cached;
      }
      if (expandedTvMazePromise) return expandedTvMazePromise;
    }

    const topics = [
      'murder', 'homicide', 'forensic', 'cold case', 'killer', 'unsolved',
      'snapped', 'disappeared', 'cult', 'detective', 'crime scene', 'scam'
    ];

    expandedTvMazePromise = (async () => {
      const seenTitles = new Set(CANONICAL_DOSSIER_LIST.map(m => getDisplayTitle(m).toLowerCase()));
      const out = [];
      const results = await Promise.all(topics.map(t => fetchLiveTvMazeCrimeShows(t, 12)));
      for (const list of results) {
        for (const m of (list || [])) {
          const k = getDisplayTitle(m).toLowerCase();
          if (seenTitles.has(k)) continue;
          seenTitles.add(k);
          CANONICAL_BY_ID.set(m.id, m);
          out.push(m);
        }
      }
      if (out.length) await cacheSet(cacheKey, out, TTL_STABLE);
      return out;
    })();

    const data = await expandedTvMazePromise;
    expandedTvMazePromise = null;
    return data;
  }

  async function fetchLiveTvMazeCrimeShows(term = 'true crime documentary', limit = 12) {
    const cacheKey = `tvmaze_tc_shows_v2_${term.toLowerCase()}_${limit}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const data = await fetchJsonSafe(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(term)}`, 4800);
    const items = (Array.isArray(data) ? data : [])
      .map(r => r.show)
      .filter(s => isAuthenticTrueCrimeShow(s))
      .slice(0, limit)
      .map(normalizeTvMazeShow)
      .filter(Boolean);

    if (items.length) {
      items.forEach(m => { if (!CANONICAL_BY_ID.has(m.id)) CANONICAL_BY_ID.set(m.id, m); });
      await cacheSet(cacheKey, items, TTL_DYNAMIC);
    }
    return items;
  }

  // Live 7-Day US True Crime Broadcast & Podcast Schedule (TVMaze /schedule + Canonical Weekly Drops)
  async function fetchLiveCrimeSchedule(startSec, endSec, { forceRefresh = false } = {}) {
    const cacheKey = `tc_schedule_v3_${Math.floor(startSec / 86400)}`;
    if (!forceRefresh) {
      const cached = await cacheGet(cacheKey);
      if (cached) return cached;
    }

    const schedules = [];
    const seenKeys = new Set();

    // 1. Fetch live US broadcast schedule for today & upcoming days from TVMaze, strictly filtered to True Crime
    const dayPromises = [];
    for (let d = 0; d < 7; d++) {
      const dt = new Date((startSec + d * 86400) * 1000);
      const isoDate = dt.toISOString().slice(0, 10);
      dayPromises.push(fetchJsonSafe(`https://api.tvmaze.com/schedule?country=US&date=${isoDate}`, 4200));
    }
    const dayPayloads = await Promise.all(dayPromises);

    for (const dayList of dayPayloads) {
      if (!Array.isArray(dayList)) continue;
      for (const ep of dayList) {
        const s = ep?.show;
        if (!isAuthenticTrueCrimeShow(s, ep?.name || '')) continue;

        const media = normalizeTvMazeShow(s);
        if (!media) continue;
        CANONICAL_BY_ID.set(media.id, media);
        const airSec = ep.airstamp ? Math.floor(new Date(ep.airstamp).getTime() / 1000) : (startSec + 20 * 3600);
        if (airSec < startSec || airSec > endSec) continue;
        const key = `${media.id}_${ep.number || 1}_${Math.floor(airSec / 3600)}`;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);
        schedules.push({
          id: Number(ep.id) || (media.id * 10 + (ep.number || 1)),
          episode: ep.number || 1,
          airingAt: airSec,
          media
        });
      }
    }

    // 2. Always include our canonical weekly investigative broadcasts & podcasts across Mon–Sun so every day column is rich
    const weeklyCanonical = [
      { id: 103, dayOffset: 0, hour: 9, ep: 12 },   // Mon: Serial
      { id: 110, dayOffset: 0, hour: 14, ep: 14 },  // Mon: Bear Brook
      { id: 109, dayOffset: 1, hour: 10, ep: 20 },  // Tue: In the Dark
      { id: 111, dayOffset: 1, hour: 19, ep: 18 },  // Tue: Your Own Backyard
      { id: 120, dayOffset: 2, hour: 20, ep: 261 }, // Wed: Unsolved Mysteries
      { id: 135, dayOffset: 2, hour: 12, ep: 12 },  // Wed: Scamanda
      { id: 125, dayOffset: 3, hour: 21, ep: 186 }, // Thu: Cold Case Files
      { id: 134, dayOffset: 3, hour: 15, ep: 8 },   // Thu: Dirty John
      { id: 117, dayOffset: 4, hour: 21, ep: 1451 },// Fri: Dateline NBC
      { id: 119, dayOffset: 4, hour: 21, ep: 1581 },// Fri: 20/20
      { id: 118, dayOffset: 5, hour: 22, ep: 1321 },// Sat: 48 Hours
      { id: 104, dayOffset: 5, hour: 20, ep: 406 }, // Sat: Forensic Files
      { id: 101, dayOffset: 6, hour: 21, ep: 12 },  // Sun: The Jinx (HBO Sunday)
      { id: 106, dayOffset: 6, hour: 20, ep: 7 }    // Sun: I'll Be Gone in the Dark
    ];

    for (const item of weeklyCanonical) {
      const m = CANONICAL_BY_ID.get(item.id);
      if (!m) continue;
      const d = new Date((startSec + item.dayOffset * 86400) * 1000);
      d.setHours(item.hour, 0, 0, 0);
      const airSec = Math.floor(d.getTime() / 1000);
      schedules.push({
        id: m.id * 100 + item.dayOffset,
        episode: item.ep,
        airingAt: airSec,
        media: m
      });
    }

    schedules.sort((a, b) => a.airingAt - b.airingAt);
    await cacheSet(cacheKey, schedules, TTL_DYNAMIC);
    return schedules;
  }

  async function fetchAnimeById(id) {
    const numId = Number(id);
    if (CANONICAL_BY_ID.has(numId)) return CANONICAL_BY_ID.get(numId);

    // Check watchlist / cache
    const wlItem = getState().watchlist[numId];
    if (wlItem) {
      return {
        id: numId,
        title: { english: wlItem.title, romaji: wlItem.title },
        coverImage: { large: wlItem.cover, medium: wlItem.cover },
        format: wlItem.format || 'DOCUSERIES',
        caseStatus: wlItem.caseStatus || 'Solved',
        episodes: wlItem.episodes || 1,
        seasonYear: wlItem.seasonYear || 2024,
        averageScore: wlItem.averageScore || 85,
        popularity: wlItem.popularity || 50000,
        genres: wlItem.genres || ['Docuseries'],
        tags: [{ name: 'Investigative Journalism', rank: 85 }],
        studios: { nodes: [{ id: 1, name: 'Case File Archive' }] },
        description: wlItem.notes || 'Saved True Crime case file.'
      };
    }

    // If TVMaze ID range (500000+)
    if (numId >= 500000 && numId < 800000) {
      const tvmId = numId - 500000;
      const show = await fetchJsonSafe(`https://api.tvmaze.com/shows/${tvmId}`);
      if (show) {
        const norm = normalizeTvMazeShow(show);
        CANONICAL_BY_ID.set(norm.id, norm);
        return norm;
      }
    }
    return CANONICAL_DOSSIER_LIST[0];
  }

  async function searchAnimeQuick(term, perPage = 10) {
    const q = String(term || '').trim().toLowerCase();
    if (!q) return [];

    // 1. Match canonical true crime catalog first
    const localHits = CANONICAL_DOSSIER_LIST.filter(m => {
      const hay = `${getDisplayTitle(m)} ${m.description} ${(m.genres || []).join(' ')} ${(m.tags || []).map(t => t.name).join(' ')} ${(m.studios?.nodes || []).map(s => s.name).join(' ')} ${(m.staff?.edges || []).map(e => e.node?.name?.full).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });

    // 2. Also query TVMaze & iTunes True Crime Podcasts live in parallel
    const [tvHits, podHits] = await Promise.all([
      fetchLiveTvMazeCrimeShows(term, 5),
      fetchLiveTrueCrimePodcasts(term, 4)
    ]);

    const seenTitles = new Set();
    const combined = [];
    for (const item of [...localHits, ...tvHits, ...podHits]) {
      const key = getDisplayTitle(item).toLowerCase();
      if (seenTitles.has(key)) continue;
      seenTitles.add(key);
      combined.push(item);
      if (combined.length >= perPage) break;
    }
    return combined;
  }

  // Compatibility wrapper so legacy GraphQL callers in index.html / vibe-graph.html / eclectic-lab.html
  // transparently receive rich True Crime catalog + live TVMaze / iTunes data!
  async function anilistQuery(query, variables = {}, { cacheKey = null, ttl = TTL_DYNAMIC } = {}) {
    if (cacheKey) {
      const cached = await cacheGet(cacheKey);
      if (cached) return cached;
    }

    const qStr = String(query || '');
    let result = {};

    // 1. Schedule query
    if (qStr.includes('airingSchedules') && !qStr.includes('activeOnas')) {
      const start = variables.start || (Math.floor(Date.now() / 1000) - 86400);
      const end = variables.end || (start + 7 * 86400);
      const sched = await fetchLiveCrimeSchedule(start, end);
      result = { p1: { airingSchedules: sched }, p2: { airingSchedules: [] }, p3: { airingSchedules: [] } };
    }
    // 2. Releases tab query (blends all 115+ canonical titles + 100+ live TVMaze true crime shows + live Apple Podcasts + optional TMDB Discover)
    else if (qStr.includes('past72h') && qStr.includes('activeOnas')) {
      const nowSec = Math.floor(Date.now() / 1000);
      const platHint = variables.platform || 'all';
      const [livePods, liveTvPool, tmdbDisc] = await Promise.all([
        fetchLiveTrueCrimePodcasts('true crime murder mystery', 14),
        fetchExpandedTvMazeCatalog(),
        fetchTmdbTrueCrimeDiscover({ platformId: platHint, pages: 2 })
      ]);
      const recentSched = CANONICAL_DOSSIER_LIST.slice(0, 12).map((m, idx) => ({
        id: m.id * 10 + idx,
        episode: m.episodes || 1,
        airingAt: nowSec - (idx * 5 + 3) * 3600,
        media: m
      }));
      const seenTitles = new Set();
      const pool = [];
      for (const m of [...CANONICAL_DOSSIER_LIST, ...tmdbDisc, ...liveTvPool, ...livePods]) {
        const k = getDisplayTitle(m).toLowerCase();
        if (seenTitles.has(k)) continue;
        seenTitles.add(k);
        pool.push(m);
      }
      result = {
        past72h: { airingSchedules: recentSched },
        activeOnas: { media: pool.slice(0, 40) },
        catalog: { media: pool }
      };
    }
    // 3. Single Media by ID (with recommendations)
    else if (qStr.includes('Media(id:') || qStr.includes('Media(id :')) {
      const m = await fetchAnimeById(variables.id);
      const seedTags = new Set((m?.tags || []).map(t => t.name));
      const recs = CANONICAL_DOSSIER_LIST
        .filter(cand => cand.id !== m?.id)
        .map(cand => {
          let overlap = 0;
          for (const t of (cand.tags || [])) if (seedTags.has(t.name)) overlap += t.rank || 70;
          return { cand, overlap };
        })
        .sort((a, b) => b.overlap - a.overlap)
        .slice(0, 16)
        .map(r => ({ mediaRecommendation: r.cand }));
      result = { Media: m ? { ...m, recommendations: { nodes: recs } } : null };
    }
    // 4. Studio / Network Archive query
    else if (qStr.includes('Studio(search:')) {
      const sTerm = String(variables.search || '').trim().toLowerCase();
      if (!sTerm) {
        result = { Studio: null };
      } else {
        // 1. First match canonical shows whose actual producer/studio matches sTerm
        let matched = CANONICAL_DOSSIER_LIST.filter(m => {
          const studios = (m.studios?.nodes || []).map(s => String(s?.name || '').trim().toLowerCase()).filter(Boolean);
          return studios.some(st => st === sTerm || st.includes(sTerm) || sTerm.includes(st));
        });

        // 2. Only fall back to platform matching if sTerm is a distribution network name (e.g. "Peacock", "Hulu", "Tubi") with no direct studio match
        if (!matched.length) {
          matched = CANONICAL_DOSSIER_LIST.filter(m => {
            const plats = (m._matchedPlatforms || [])
              .map(pid => String(PLATFORM_BY_ID[pid]?.name || '').trim().toLowerCase())
              .filter(Boolean);
            return plats.some(p => p === sTerm || p.includes(sTerm) || sTerm.includes(p));
          });
        }

        // 3. Only include live TVMaze shows whose actual TVMaze network/webChannel matches sTerm
        const liveTvRaw = await fetchLiveTvMazeCrimeShows(variables.search, 12);
        const liveTv = liveTvRaw.filter(m => {
          const net = String(m.studios?.nodes?.[0]?.name || '').trim().toLowerCase();
          return net && (net === sTerm || net.includes(sTerm) || sTerm.includes(net));
        });

        const seenTitles = new Set();
        const all = [];
        for (const node of [...matched, ...liveTv]) {
          const tKey = getDisplayTitle(node).toLowerCase();
          if (seenTitles.has(tKey)) continue;
          seenTitles.add(tKey);
          all.push(node);
        }

        result = {
          Studio: all.length ? {
            id: 900,
            name: variables.search,
            favourites: 14200,
            p1: { edges: all.map(node => ({ isMainStudio: true, node })) },
            p2: { edges: [] }
          } : null
        };
      }
    }
    // 5. Staff / Investigator / Director Auteur query
    else if (qStr.includes('staff(search:')) {
      const sTerm = String(variables.search || '').toLowerCase();
      const staffDirectory = new Map();
      for (const m of CANONICAL_DOSSIER_LIST) {
        for (const e of (m.staff?.edges || [])) {
          const full = e.node?.name?.full;
          if (!full) continue;
          if (!staffDirectory.has(full)) {
            staffDirectory.set(full, {
              id: e.node.id,
              name: { full, native: e.role },
              image: {
                large: makeDossierPosterDataUri(full, e.role, '#38bdf8', 'INVESTIGATOR'),
                medium: makeDossierPosterDataUri(full, e.role, '#38bdf8', 'INVESTIGATOR')
              },
              primaryOccupations: [e.role, 'True Crime Documentarian & Investigator'],
              description: `${full} is an investigative filmmaker, journalist, or forensic specialist featured across landmark true crime case files.`,
              credits: []
            });
          }
          staffDirectory.get(full).credits.push({ staffRole: e.role, node: m });
        }
      }
      const hits = Array.from(staffDirectory.values()).filter(st => st.name.full.toLowerCase().includes(sTerm));
      result = {
        Page: {
          staff: hits.map(st => ({
            ...st,
            p1: { edges: st.credits },
            p2: { edges: [] }
          }))
        }
      };
    }
    // 6. Watchlist ID batch query
    else if (Array.isArray(variables.ids)) {
      const list = await Promise.all(variables.ids.map(id => fetchAnimeById(id)));
      result = { Page: { media: list.filter(Boolean) } };
    }
    // 7. Archive By Year / Decade or General Page query
    else {
      let pool = [...CANONICAL_DOSSIER_LIST];
      if (variables.start && variables.end) {
        const startYr = Math.floor(Number(variables.start) / 10000);
        const endYr = Math.floor(Number(variables.end) / 10000);
        pool = pool.filter(m => (m.seasonYear || 2020) >= startYr && (m.seasonYear || 2020) <= endYr);
      }
      if (variables.format) {
        pool = pool.filter(m => m.format === variables.format);
      }
      if (variables.genre) {
        const gl = variables.genre.toLowerCase();
        pool = pool.filter(m => (m.genres || []).some(g => g.toLowerCase() === gl));
      }
      if (variables.negGenres?.length) {
        const negG = new Set(variables.negGenres.map(g => g.toLowerCase()));
        pool = pool.filter(m => !(m.genres || []).some(g => negG.has(g.toLowerCase())));
      }
      if (variables.negTags?.length) {
        const negT = new Set(variables.negTags.map(t => t.toLowerCase()));
        pool = pool.filter(m => !(m.tags || []).some(t => negT.has(t.name.toLowerCase())));
      }
      result = {
        Page: { media: pool },
        base: { media: pool },
        pt0: { media: pool }, pt1: { media: pool }, pt2: { media: pool }, pt3: { media: pool },
        pg0: { media: pool }, pg1: { media: pool }, pg2: { media: pool },
        t0: { media: pool }, t1: { media: pool }, t2: { media: pool }, t3: { media: pool },
        g0: { media: pool }, g1: { media: pool }, g2: { media: pool }
      };
    }

    if (cacheKey && result) {
      await cacheSet(cacheKey, result, ttl);
    }
    return result;
  }

  // --------------------------------------------------------------------------
  // Live-Taxonomy Find Vibe (3-Layer Forensic Pipeline)
  // --------------------------------------------------------------------------
  const MOOD_LEXICON = {
    forensic: ['Forensic DNA', 'Forensic Genealogy', 'Cold Case', 'Docuseries'],
    dna: ['Forensic DNA', 'Forensic Genealogy', 'Wrongful Conviction', 'Cold Case'],
    genealogy: ['Forensic Genealogy', 'Forensic DNA', 'Cold Case'],
    cold: ['Cold Case', 'Unsolved Mystery', 'Missing Persons', 'Forensic Genealogy'],
    unsolved: ['Unsolved Mystery', 'Cold Case', 'Missing Persons', 'Small-Town Mystery'],
    exoneration: ['Wrongful Conviction', 'Courtroom & Legal', 'Judicial & Police Corruption', 'Legal & Exoneration'],
    wrongful: ['Wrongful Conviction', 'Courtroom & Legal', 'Judicial & Police Corruption', 'Police Interrogation'],
    innocent: ['Wrongful Conviction', 'Courtroom & Legal', 'Legal & Exoneration'],
    cult: ['Cult & High-Control Group', 'Whistleblower', 'Archival Footage', 'Cult & Extremism'],
    fraud: ['Corporate & White-Collar Fraud', 'Con Artist & Impostor', 'Whistleblower', 'Fraud & White-Collar'],
    scam: ['Con Artist & Impostor', 'Corporate & White-Collar Fraud', 'Cyber & OSINT Sleuths', 'Fraud & White-Collar'],
    heist: ['Corporate & White-Collar Fraud', 'Psychological Profile', 'Archival Footage'],
    serial: ['Serial Offender', 'Psychological Profile', 'Police Interrogation', '1970s Era', '1980s Era'],
    profiler: ['Psychological Profile', 'Serial Offender', 'Police Interrogation'],
    podcast: ['True Crime Podcast', 'Investigative Journalism', 'Cold Case'],
    trial: ['Courtroom & Legal', 'Wrongful Conviction', 'Legal & Exoneration'],
    courtroom: ['Courtroom & Legal', 'Legal & Exoneration', 'Hot-Mic Confession'],
    southern: ['Southern Gothic', 'Small-Town Mystery', 'Domestic & Family Secrets'],
    northwest: ['Pacific Northwest Noir', 'Cold Case', 'Serial Offender'],
    cyber: ['Cyber & OSINT Sleuths', 'Con Artist & Impostor', 'Investigative Journalism'],
    sleuth: ['Cyber & OSINT Sleuths', 'Investigative Journalism', 'Cold Case'],
    missing: ['Missing Persons', 'Cold Case', 'Unsolved Mystery'],
    corruption: ['Judicial & Police Corruption', 'Wrongful Conviction', 'Whistleblower'],
    interrogation: ['Police Interrogation', 'Hot-Mic Confession', 'Psychological Profile']
  };

  async function getTaxonomy() {
    return {
      genres: CANONICAL_GENRES,
      tags: CANONICAL_TAGS
    };
  }

  function singularize(word) {
    if (word.endsWith('ies') && word.length > 4) return word.slice(0, -3) + 'y';
    if (word.endsWith('es') && word.length > 4) return word.slice(0, -2);
    if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) return word.slice(0, -1);
    return word;
  }

  function parseVibePrompt(prompt, taxonomy) {
    const raw = String(prompt || '').trim();
    const lower = raw.toLowerCase();
    const genreMap = new Map(taxonomy.genres.map(g => [g.toLowerCase(), g]));
    const tagMap = new Map(taxonomy.tags.map(t => [t.name.toLowerCase(), t.name]));
    const tagSingularMap = new Map(taxonomy.tags.map(t => [singularize(t.name.toLowerCase()), t.name]));

    const matchedGenres = new Set();
    const matchedTags = new Set();
    const explicitGenres = new Set();
    const explicitTags = new Set();
    const layersUsed = [];
    let decadeRange = null;

    const decMatch = lower.match(/\b(19[6-9]0|20[0-2]0|[6-9]0|00|10|20)s\b/);
    if (decMatch) {
      let yr = parseInt(decMatch[1], 10);
      if (yr < 30) yr += 2000;
      else if (yr < 100) yr += 1900;
      decadeRange = { start: yr * 10000, end: (yr + 9) * 10000 + 1231, label: `${yr}s` };
      if (yr === 1970) matchedTags.add('1970s Era');
      if (yr === 1980) matchedTags.add('1980s Era');
      if (yr === 1990) matchedTags.add('1990s Era');
    }

    const cleanWords = lower.replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(Boolean);
    const ngrams = new Set();
    ngrams.add(lower);
    for (let i = 0; i < cleanWords.length; i++) {
      ngrams.add(cleanWords[i]);
      ngrams.add(singularize(cleanWords[i]));
      if (i + 1 < cleanWords.length) {
        const bi = `${cleanWords[i]} ${cleanWords[i + 1]}`;
        ngrams.add(bi);
        ngrams.add(singularize(bi));
      }
      if (i + 2 < cleanWords.length) {
        ngrams.add(`${cleanWords[i]} ${cleanWords[i + 1]} ${cleanWords[i + 2]}`);
      }
    }

    // Layer 1: Canonical & Substring Tag/Genre Matching
    let layer1Hit = false;
    for (const candidate of ngrams) {
      if (genreMap.has(candidate)) {
        const g = genreMap.get(candidate);
        matchedGenres.add(g);
        explicitGenres.add(g);
        layer1Hit = true;
      }
      if (tagMap.has(candidate)) {
        const t = tagMap.get(candidate);
        matchedTags.add(t);
        explicitTags.add(t);
        layer1Hit = true;
      } else if (tagSingularMap.has(candidate) && candidate.length > 3) {
        const t = tagSingularMap.get(candidate);
        matchedTags.add(t);
        explicitTags.add(t);
        layer1Hit = true;
      }
    }
    if (layer1Hit) layersUsed.push('L1:ForensicTaxonomy');

    // Layer 2: True Crime Lexicon Expansion
    let layer2Hit = false;
    for (const [mood, expansions] of Object.entries(MOOD_LEXICON)) {
      if (lower.includes(mood)) {
        for (const term of expansions) {
          const tl = term.toLowerCase();
          if (genreMap.has(tl)) {
            matchedGenres.add(genreMap.get(tl));
            layer2Hit = true;
          } else if (tagMap.has(tl)) {
            matchedTags.add(tagMap.get(tl));
            layer2Hit = true;
          }
        }
      }
    }
    if (layer2Hit) layersUsed.push('L2:CaseLexicon');

    // Layer 3: Tag-Description Fallback
    if (matchedGenres.size === 0 && matchedTags.size === 0 && cleanWords.length > 0) {
      const stop = new Set(['crime', 'true', 'case', 'show', 'series', 'movie', 'like', 'with', 'about', 'that', 'from', 'very', 'good', 'best', 'vibe']);
      const meaningful = cleanWords.filter(w => w.length >= 3 && !stop.has(w));
      const scored = [];
      for (const t of taxonomy.tags) {
        const desc = (t.description + ' ' + t.name).toLowerCase();
        let score = 0;
        for (const w of meaningful) {
          if (desc.includes(w)) score += 1;
        }
        if (score > 0) scored.push({ name: t.name, score });
      }
      scored.sort((a, b) => b.score - a.score);
      scored.slice(0, 4).forEach(s => matchedTags.add(s.name));
      if (matchedTags.size > 0) layersUsed.push('L3:DossierDescFallback');
    }

    return {
      raw,
      genres: Array.from(matchedGenres),
      tags: Array.from(matchedTags),
      explicitGenres: Array.from(explicitGenres),
      explicitTags: Array.from(explicitTags),
      decadeRange,
      layersUsed
    };
  }

  async function fetchVibeCandidates(parsed, { limit = 26, maxPopularity = null } = {}) {
    const genres = parsed.genres || [];
    const tags = parsed.tags || [];
    const expTags = parsed.explicitTags?.length ? parsed.explicitTags : tags;
    const expGenres = parsed.explicitGenres?.length ? parsed.explicitGenres : genres;
    const rawWords = String(parsed.raw || '').toLowerCase().split(/\s+/).filter(w => w.length >= 4);

    // Combine canonical catalog + live TVMaze/iTunes search if raw prompt has specific keywords
    let pool = [...CANONICAL_DOSSIER_LIST];
    if (parsed.raw && parsed.raw.length >= 3) {
      const [liveTv, livePods] = await Promise.all([
        fetchLiveTvMazeCrimeShows(parsed.raw, 6),
        fetchLiveTrueCrimePodcasts(parsed.raw, 4)
      ]);
      const seen = new Set(pool.map(m => getDisplayTitle(m).toLowerCase()));
      for (const item of [...liveTv, ...livePods]) {
        const k = getDisplayTitle(item).toLowerCase();
        if (!seen.has(k)) {
          seen.add(k);
          pool.push(item);
        }
      }
    }

    if (maxPopularity) {
      const filteredPop = pool.filter(m => (m.popularity || 0) <= maxPopularity);
      if (filteredPop.length >= 6) pool = filteredPop;
    }

    const expTagSet = new Set(expTags.map(t => t.toLowerCase()));
    const moodTagSet = new Set(tags.map(t => t.toLowerCase()));
    const expGenreSet = new Set(expGenres.map(g => g.toLowerCase()));
    const moodGenreSet = new Set(genres.map(g => g.toLowerCase()));

    pool.forEach(m => {
      let score = 0;
      let explicitHits = 0;
      for (const t of (m.tags || [])) {
        const tl = t.name.toLowerCase();
        if (expTagSet.has(tl)) {
          score += (t.rank || 60) * 2.4;
          explicitHits++;
        } else if (moodTagSet.has(tl)) {
          score += (t.rank || 55) * 1.1;
        }
      }
      for (const g of (m.genres || [])) {
        const gl = g.toLowerCase();
        if (expGenreSet.has(gl)) {
          score += 70;
          explicitHits++;
        } else if (moodGenreSet.has(gl)) {
          score += 30;
        }
      }
      const descLow = `${getDisplayTitle(m)} ${m.description || ''}`.toLowerCase();
      for (const w of rawWords) {
        if (descLow.includes(w)) score += 28;
      }
      if (explicitHits >= 2) score *= (1 + explicitHits * 0.4);
      score += (m.averageScore || 80) * 0.35;
      m._vibeScore = score;
    });

    pool.sort((a, b) => (b._vibeScore || 0) - (a._vibeScore || 0));
    return pool.slice(0, limit);
  }

  // Starter Pack / Keyword Collection Importer (replaces AniList username import for True Crime)
  async function importAniListWatchlist(queryOrPack) {
    const clean = String(queryOrPack || '').trim();
    if (!clean) throw new Error('Enter a topic, network (e.g. HBO, Netflix, Podcasts), or "starter" to import.');
    const low = clean.toLowerCase();

    let matches = CANONICAL_DOSSIER_LIST.filter(m => {
      if (low === 'starter' || low === 'essentials' || low === 'top') return (m.averageScore || 0) >= 90;
      const hay = `${getDisplayTitle(m)} ${(m.genres || []).join(' ')} ${(m.tags || []).map(t => t.name).join(' ')} ${(m.studios?.nodes || []).map(s => s.name).join(' ')} ${(m._matchedPlatforms || []).join(' ')} ${m.caseStatus}`.toLowerCase();
      return hay.includes(low);
    });

    if (matches.length < 4) {
      const liveHits = await searchAnimeQuick(clean, 8);
      matches = [...matches, ...liveHits];
    }

    const state = getState();
    let importedCount = 0;
    for (const m of matches.slice(0, 14)) {
      if (!m || !m.id) continue;
      const prev = state.watchlist[m.id] || {};
      state.watchlist[m.id] = {
        id: m.id,
        title: getDisplayTitle(m),
        cover: getCover(m),
        format: m.format || 'DOCUSERIES',
        caseStatus: m.caseStatus || 'Solved',
        episodes: m.episodes ?? null,
        averageScore: m.averageScore ?? null,
        popularity: m.popularity ?? null,
        seasonYear: m.seasonYear ?? null,
        genres: m.genres || [],
        status: prev.status ? normalizeStatus(prev.status) : 'Case Backlog',
        rating: prev.rating || 0,
        progress: prev.progress || 0,
        notes: prev.notes || `[Imported via "${clean}" Dossier Pack]`,
        dubOverride: prev.dubOverride || m.caseStatus || '',
        customPlatforms: prev.customPlatforms || m._matchedPlatforms || [],
        customFreeWithAds: Boolean(prev.customFreeWithAds),
        updatedAt: Date.now()
      };
      delete state.tombstones[m.id];
      importedCount++;
    }
    state.settings.anilistUsername = clean;
    saveState(state, { triggerGist: true });
    return importedCount;
  }

  // --------------------------------------------------------------------------
  // Multi-Source Detail Enrichment (TVMaze, iTunes Podcasts, Wikipedia, TMDB)
  // --------------------------------------------------------------------------
  function normalizeTitleKey(str) {
    return String(str || '')
      .toLowerCase()
      .replace(/\(.*?\)/g, ' ')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\b(the|a|an|season|part|tv|docuseries|podcast)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function titlesMatch(expectedTitles, candidate) {
    const cand = normalizeTitleKey(candidate);
    if (!cand || cand.length < 2) return false;
    const candWords = new Set(cand.split(' ').filter(w => w.length >= 2));
    for (const rawExp of expectedTitles) {
      const exp = normalizeTitleKey(rawExp);
      if (!exp) continue;
      if (cand === exp || cand.includes(exp) || exp.includes(cand)) return true;
      const expWords = exp.split(' ').filter(w => w.length >= 2);
      if (!expWords.length) continue;
      let hits = 0;
      for (const w of expWords) if (candWords.has(w)) hits++;
      if (hits / Math.max(expWords.length, candWords.size) >= 0.55) return true;
    }
    return false;
  }

  async function fetchWikipediaSummary(title, altTitles = []) {
    if (!title) return null;
    const cleanTitle = title.replace(/\s*\(Season.*?\)/i, '').trim();
    const cacheKey = `wiki_tc_v1_${cleanTitle.toLowerCase()}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const trySummary = async (pageTitle) => {
      const data = await fetchJsonSafe(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`);
      if (data && data.extract && data.type !== 'disambiguation') {
        return {
          title: data.title,
          extract: data.extract,
          url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(data.title)}`
        };
      }
      return null;
    };

    const search = await fetchJsonSafe(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(cleanTitle)}&limit=5&format=json&origin=*`);
    const rawCandidates = (Array.isArray(search?.[1]) ? search[1] : [])
      .filter(c => c && !/^(list of|episodes of)\b/i.test(c));

    let result = null;
    for (const c of rawCandidates) {
      result = await trySummary(c);
      if (result) break;
    }
    if (result) await cacheSet(cacheKey, result, TTL_STABLE);
    return result;
  }

  async function fetchTmdbUsProviders(title, year, tmdbKey) {
    if (!tmdbKey || !title) return null;
    const cacheKey = `tmdb_tc_us_${title.toLowerCase()}_${year || ''}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const search = await fetchJsonSafe(`https://api.themoviedb.org/3/search/multi?api_key=${encodeURIComponent(tmdbKey)}&query=${encodeURIComponent(title)}`);
    const hit = (search?.results || []).find(r => (r.media_type === 'tv' || r.media_type === 'movie') && titlesMatch([title], r.name || r.title || r.original_name || r.original_title));
    if (!hit) return null;

    const prov = await fetchJsonSafe(`https://api.themoviedb.org/3/${hit.media_type}/${hit.id}/watch/providers?api_key=${encodeURIComponent(tmdbKey)}`);
    const us = prov?.results?.US;
    if (!us) return null;

    const collect = (arr) => (arr || []).map(p => p.provider_name);
    const out = {
      tmdbId: hit.id,
      mediaType: hit.media_type,
      link: us.link || '',
      flatrate: collect(us.flatrate),
      ads: collect(us.ads),
      free: collect(us.free),
      rent: collect(us.rent)
    };
    await cacheSet(cacheKey, out, TTL_STABLE);
    return out;
  }

  // Lazy poster hydrator for IMDb catalog cards (uses IndexedDB -> OMDb -> TVMaze IMDb lookup -> Wikipedia)
  async function resolveImdbPosterUrl(media) {
    if (!media || !media.imdbId) return '';
    const cacheKey = `poster_imdb_v1_${media.imdbId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    let found = '';
    const omdbKey = getState().settings.omdbKey || '';
    if (omdbKey) {
      const oData = await fetchJsonSafe(`https://www.omdbapi.com/?apikey=${encodeURIComponent(omdbKey)}&i=${encodeURIComponent(media.imdbId)}`, 4000);
      if (oData?.Poster && oData.Poster !== 'N/A') found = oData.Poster.replace(/^http:\/\//i, 'https://');
    }
    if (!found && media.format === 'DOCUSERIES') {
      const tv = await fetchJsonSafe(`https://api.tvmaze.com/lookup/shows?imdb=${encodeURIComponent(media.imdbId)}`, 4000);
      if (tv?.image?.original || tv?.image?.medium) {
        found = (tv.image.original || tv.image.medium).replace(/^http:\/\//i, 'https://');
      }
    }
    if (!found) {
      const title = getDisplayTitle(media);
      const wData = await fetchJsonSafe(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/\s+/g, '_'))}`, 4000);
      const src = wData?.originalimage?.source || wData?.thumbnail?.source;
      if (src) found = src.split('?')[0];
    }
    if (found) {
      media.coverImage = { large: found, medium: found, color: '#f59e0b' };
      media._needsPosterHydration = false;
      await cacheSet(cacheKey, found, TTL_STABLE);
    }
    return found;
  }

  function hydrateCardPosters(container, itemsById) {
    if (!container || !itemsById) return;
    const cards = Array.from(container.querySelectorAll('.anime-card[data-anime-id], .anime-card[data-id]'));
    if (!cards.length) return;

    const hydrateOne = async (card) => {
      const id = Number(card.dataset.animeId || card.dataset.id);
      const m = itemsById.get(id);
      if (!m || !m._needsPosterHydration || !m.imdbId) return;
      const url = await resolveImdbPosterUrl(m);
      if (url) {
        const img = card.querySelector('img.anime-card-cover');
        if (img) img.src = url;
      }
    };

    if (typeof IntersectionObserver !== 'undefined') {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            obs.unobserve(entry.target);
            hydrateOne(entry.target);
          }
        });
      }, { rootMargin: '250px' });
      cards.forEach(c => {
        const id = Number(c.dataset.animeId || c.dataset.id);
        if (itemsById.get(id)?._needsPosterHydration) obs.observe(c);
      });
    } else {
      cards.slice(0, 16).forEach(hydrateOne);
    }
  }

  async function fetchOmdbDetails(media, omdbKey) {
    if (!omdbKey || !media) return null;
    const imdbId = media.imdbId || '';
    const title = getDisplayTitle(media).replace(/\s*\(Season.*?\)/i, '').trim();
    const cacheKey = `omdb_tc_v1_${imdbId || title.toLowerCase()}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const url = imdbId
      ? `https://www.omdbapi.com/?apikey=${encodeURIComponent(omdbKey)}&i=${encodeURIComponent(imdbId)}&plot=short`
      : `https://www.omdbapi.com/?apikey=${encodeURIComponent(omdbKey)}&t=${encodeURIComponent(title)}&plot=short`;
    const data = await fetchJsonSafe(url, 4800);
    if (!data || data.Response === 'False') return null;

    const rt = (data.Ratings || []).find(r => r.Source === 'Rotten Tomatoes')?.Value || '';
    const out = {
      imdbID: data.imdbID || imdbId,
      imdbRating: data.imdbRating && data.imdbRating !== 'N/A' ? data.imdbRating : '',
      imdbVotes: data.imdbVotes && data.imdbVotes !== 'N/A' ? data.imdbVotes : '',
      rottenTomatoes: rt,
      metascore: data.Metascore && data.Metascore !== 'N/A' ? data.Metascore : '',
      rated: data.Rated && data.Rated !== 'N/A' ? data.Rated : '',
      awards: data.Awards && data.Awards !== 'N/A' ? data.Awards : '',
      plot: data.Plot && data.Plot !== 'N/A' ? data.Plot : '',
      poster: data.Poster && data.Poster !== 'N/A' ? data.Poster.replace(/^http:\/\//i, 'https://') : ''
    };
    await cacheSet(cacheKey, out, TTL_STABLE);
    return out;
  }

  async function fetchMultiSourceDetails(media) {
    if (!media || !media.id) return {};
    const cacheKey = `multisrc_tc_v2_${media.id}`;
    const st = getState().settings;
    const tmdbKey = st.tmdbKey || '';
    const omdbKey = st.omdbKey || '';
    const cached = await cacheGet(cacheKey);
    if (cached && (!tmdbKey || cached.tmdb !== undefined) && (!omdbKey || cached.omdb !== undefined)) return cached;

    const title = getDisplayTitle(media).replace(/\s*\(Season.*?\)/i, '').trim();

    const tvmazeTask = (async () => {
      const results = await fetchJsonSafe(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(title)}`, 4500);
      if (!Array.isArray(results)) return null;
      const hit = results.map(r => r.show).find(s => s && s.name && titlesMatch([title], s.name));
      if (!hit) return null;
      return {
        rating: hit.rating?.average,
        network: hit.network?.name || hit.webChannel?.name || '',
        status: hit.status,
        imdb: hit.externals?.imdb || '',
        officialSite: hit.officialSite || '',
        url: hit.url
      };
    })();

    const itunesTask = (async () => {
      const data = await fetchJsonSafe(`https://itunes.apple.com/search?media=podcast&term=${encodeURIComponent(title)}&limit=3`, 4500);
      const hit = (data?.results || []).find(p => titlesMatch([title], p.collectionName));
      if (!hit) return null;
      return {
        name: hit.collectionName,
        publisher: hit.artistName,
        episodes: hit.trackCount,
        url: hit.collectionViewUrl
      };
    })();

    const wikiTask = fetchWikipediaSummary(title);
    const tmdbTask = tmdbKey ? fetchTmdbUsProviders(title, media.seasonYear, tmdbKey) : Promise.resolve(undefined);
    const omdbTask = omdbKey ? fetchOmdbDetails(media, omdbKey) : Promise.resolve(undefined);

    const [tvmaze, itunes, wikipedia, tmdb, omdb] = await Promise.all([
      tvmazeTask, itunesTask, wikiTask, tmdbTask, omdbTask
    ]);

    const bundle = { tvmaze, itunes, wikipedia, tmdb, omdb };
    if (tvmaze || itunes || wikipedia || tmdb || omdb) {
      await cacheSet(cacheKey, bundle, TTL_STABLE);
    }
    return bundle;
  }

  // --------------------------------------------------------------------------
  // Accessible Shared Navigation Bar & Case Detail Modal
  // --------------------------------------------------------------------------
  function updateNavBadges(state) {
    const badge = document.getElementById('af-nav-wl-count');
    if (badge) {
      badge.textContent = String(Object.keys(state.watchlist || {}).length);
    }
  }

  function mountNav(activePage) {
    const host = document.getElementById('af-nav-host');
    if (!host) return;
    const state = getState();
    const wlCount = Object.keys(state.watchlist || {}).length;
    const hasGist = Boolean(state.settings.gistToken && state.settings.gistId);

    host.innerHTML = `
      <header class="af-nav" role="banner">
        <a class="af-brand" href="./index.html">
          <img src="./icon.svg" alt="" width="30" height="30">
          <span>TrueCrimeFinder</span>
          <span class="af-brand-sub">Dossier Suite</span>
        </a>
        <nav class="af-nav-links" aria-label="Primary Suite Navigation">
          <a class="af-nav-link ${activePage === 'hub' ? 'active' : ''}" href="./index.html" ${activePage === 'hub' ? 'aria-current="page"' : ''}>
            Case Hub <span class="badge badge-muted" id="af-nav-wl-count" title="Saved Case Files">${wlCount}</span>
          </a>
          <a class="af-nav-link ${activePage === 'graph' ? 'active' : ''}" href="./vibe-graph.html" ${activePage === 'graph' ? 'aria-current="page"' : ''}>
            Evidence &amp; Vibe Graph
          </a>
          <a class="af-nav-link ${activePage === 'lab' ? 'active' : ''}" href="./eclectic-lab.html" ${activePage === 'lab' ? 'aria-current="page"' : ''}>
            Forensic Lab
          </a>
        </nav>
        <div class="af-nav-right">
          <a href="./index.html?tab=saved" id="af-sync-pill" class="sync-pill" data-state="${hasGist ? 'synced' : 'local'}" title="Storage &amp; Gist Sync Status">
            <span class="sync-dot" aria-hidden="true"></span>
            <span class="sync-label">${hasGist ? 'Gist Ready' : 'Local Storage'}</span>
          </a>
        </div>
      </header>
    `;

    checkHashSyncOnBoot();
    if (hasGist && state.settings.gistAutoSync) {
      gistPull({ silent: true });
    }

    if (!document.getElementById('af-back-to-top')) {
      const btn = document.createElement('button');
      btn.id = 'af-back-to-top';
      btn.type = 'button';
      btn.className = 'back-to-top-btn';
      btn.setAttribute('aria-label', 'Back to top and filters');
      btn.innerHTML = '↑ Top';
      btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
      document.body.appendChild(btn);
      const toggleVis = () => btn.classList.toggle('visible', window.scrollY > 420);
      window.addEventListener('scroll', toggleVis, { passive: true });
    }
  }

  let lastFocusedEl = null;
  let activeModalAnime = null;
  let activeModalFlushFn = null;

  global.addEventListener('beforeunload', () => {
    if (typeof activeModalFlushFn === 'function') {
      try { activeModalFlushFn(); } catch {}
    }
  });

  function ensureDetailModal() {
    let backdrop = document.getElementById('af-detail-modal-backdrop');
    if (backdrop) return backdrop;
    backdrop = document.createElement('div');
    backdrop.id = 'af-detail-modal-backdrop';
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="af-modal-title" tabindex="-1">
        <div class="modal-header">
          <h3 id="af-modal-title" style="margin:0;font-size:17px;">Case File Dossier</h3>
          <button type="button" class="btn btn-sm" id="af-modal-close" aria-label="Close modal">✕ Close <span class="kbd">Esc</span></button>
        </div>
        <div class="modal-body" id="af-modal-body"></div>
        <div class="modal-footer" id="af-modal-footer" hidden></div>
      </div>
    `;
    document.body.appendChild(backdrop);

    backdrop.addEventListener('click', (ev) => {
      if (ev.target === backdrop) closeDetailModal();
    });
    backdrop.querySelector('#af-modal-close').addEventListener('click', closeDetailModal);

    backdrop.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        closeDetailModal();
        return;
      }
      if (ev.key !== 'Tab') return;
      const focusables = backdrop.querySelectorAll('button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])');
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (ev.shiftKey && document.activeElement === first) {
        ev.preventDefault();
        last.focus();
      } else if (!ev.shiftKey && document.activeElement === last) {
        ev.preventDefault();
        first.focus();
      }
    });
    return backdrop;
  }

  function closeDetailModal() {
    if (typeof activeModalFlushFn === 'function') {
      try { activeModalFlushFn(); } catch {}
      activeModalFlushFn = null;
    }
    const backdrop = document.getElementById('af-detail-modal-backdrop');
    if (!backdrop || !backdrop.classList.contains('open')) return;
    backdrop.classList.remove('open');
    activeModalAnime = null;
    if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') {
      lastFocusedEl.focus();
    }
    lastFocusedEl = null;
  }

  async function openDetailModal(mediaOrId) {
    lastFocusedEl = document.activeElement;
    const backdrop = ensureDetailModal();
    const titleEl = backdrop.querySelector('#af-modal-title');
    const bodyEl = backdrop.querySelector('#af-modal-body');
    const footerEl = backdrop.querySelector('#af-modal-footer');
    backdrop.classList.add('open');
    bodyEl.innerHTML = `<div class="empty-state"><span class="spinner"></span> Opening case dossier...</div>`;
    if (footerEl) { footerEl.innerHTML = ''; footerEl.hidden = true; }
    backdrop.querySelector('.modal-dialog').focus();

    let media = typeof mediaOrId === 'object' ? mediaOrId : null;
    if (!media || !media.description) {
      try {
        const fetched = await fetchAnimeById(typeof mediaOrId === 'object' ? mediaOrId.id : mediaOrId);
        if (fetched) media = fetched;
      } catch (err) {
        if (!media) {
          bodyEl.innerHTML = `<div class="empty-state">Failed to load case dossier: ${escapeHtml(err.message)}</div>`;
          return;
        }
      }
    }
    activeModalAnime = media;

    const state = getState();
    const wl = state.watchlist[media.id] || null;
    const ovr = state.overrides[media.id] || wl || {};
    const curStatus = wl?.status || ovr?.status || 'Case Backlog';
    const curRating = Number(wl?.rating ?? ovr?.rating ?? 0);
    const curProgress = Number(wl?.progress ?? ovr?.progress ?? 0);
    const curNotes = wl?.notes ?? ovr?.notes ?? '';
    const title = getDisplayTitle(media);
    const cover = getCover(media);
    const studioNodes = media.studios?.nodes || [];
    const studiosHtml = studioNodes.length
      ? studioNodes.map(s => `<a href="./index.html?tab=archives&amp;studio=${encodeURIComponent(s.name)}" style="color:var(--cyan);font-weight:600;">${escapeHtml(s.name)}</a>`).join(', ')
      : 'Independent Production';
    const sourceLabel = formatSourceLabel(media.source);
    const keyStaff = getKeyStaff(media);
    const topTags = getTopSubgenreTags(media, 5);
    const platforms = detectPlatforms(media);
    const dubInfo = getDubTrackInfo(media, media.nextAiringEpisode ? Math.max(1, media.nextAiringEpisode.episode - 1) : null);
    const dubLabel = dubInfo.dub;
    const freeAds = isFreeWithAds(media, platforms);
    const DAY_OPTS = [
      { v: '', l: 'Same day as Broadcast' },
      { v: '0', l: 'Monday' }, { v: '1', l: 'Tuesday' }, { v: '2', l: 'Wednesday' },
      { v: '3', l: 'Thursday' }, { v: '4', l: 'Friday' }, { v: '5', l: 'Saturday' }, { v: '6', l: 'Sunday' }
    ];

    titleEl.textContent = title;

    const ytTrailerId = media.trailer?.site === 'youtube' ? media.trailer.id : null;
    const justWatchUrl = `https://www.justwatch.com/us/search?q=${encodeURIComponent(title)}`;
    const initialStreamLinks = getStreamingLinks(media);
    const renderStreamChipsHtml = (links) => links.length
      ? links.map(s => `<a class="stream-link-chip" href="${escapeHtml(safeUrl(s.url))}" target="_blank" rel="noopener noreferrer" title="${s.isDirect ? 'Open directly on ' + escapeHtml(s.name) : 'Search on ' + escapeHtml(s.name)}" style="border-color:${s.color};color:${s.color};">▶ ${escapeHtml(s.name)}${s.freeWithAds ? ' (Free)' : ''} ↗</a>`).join('')
      : `<span style="font-size:12px;color:var(--text-dim);">No US streaming service indexed yet — check JustWatch US below or add a custom override</span>`;
    const cleanSynopsis = stripHtml(media.description || '').trim() || 'No case summary available.';
    const isLongSynopsis = cleanSynopsis.length > 260;

    bodyEl.innerHTML = `
      <div class="detail-hero">
        <img class="detail-cover" src="${escapeHtml(cover)}" alt="${escapeHtml(title)} cover">
        <div style="display:flex;flex-direction:column;gap:10px;min-width:0;">
          <div class="meta-row">
            ${media.averageScore ? `<span class="badge badge-emerald">★ ${media.averageScore}% Rating</span>` : ''}
            ${media.format ? `<span class="badge badge-accent">${escapeHtml(media.format)}</span>` : ''}
            ${sourceLabel ? `<span class="badge badge-purple">${escapeHtml(sourceLabel)}</span>` : ''}
            ${media.seasonYear ? `<span class="badge badge-muted">${media.seasonYear}</span>` : ''}
            ${media.episodes ? `<span class="badge badge-muted">${media.episodes === 1 ? 'Feature / 1 pt' : media.episodes + ' eps'}${media.duration ? ' · ' + media.duration + 'm' : ''}</span>` : ''}
            <span class="badge badge-cyan" id="af-modal-dub-badge" title="Case Status / Release Classification">${escapeHtml(dubLabel)}</span>
            ${freeAds ? `<span class="badge badge-amber">Free / Podcast</span>` : ''}
            <span class="badge badge-muted">Reach: ${formatCompactNumber(media.popularity)}</span>
          </div>
          <div class="meta-row" id="af-modal-stream-bar" style="gap:6px;align-items:center;">
            <span style="font-size:11.5px;color:var(--text-dim);font-weight:700;">WATCH / STREAM ON:</span>
            ${renderStreamChipsHtml(initialStreamLinks)}
          </div>
          <div style="font-size:12.5px;color:var(--text-muted);">
            <strong>Network / Producer:</strong> ${studiosHtml} &nbsp;•&nbsp; <strong>Categories:</strong> ${escapeHtml((media.genres || []).join(', ') || 'True Crime')}
          </div>
          ${keyStaff.length ? `
            <div class="meta-row" style="gap:6px;">
              <span style="font-size:11.5px;color:var(--text-dim);font-weight:700;">INVESTIGATORS / CREATORS:</span>
              ${keyStaff.map(st => `<a class="badge badge-muted" href="./eclectic-lab.html?tab=auteur&amp;staff=${encodeURIComponent(st.name)}" title="Open in Director &amp; Investigator Tree" style="text-decoration:none;"><strong style="color:var(--accent);">${escapeHtml(st.role)}:</strong>&nbsp;${escapeHtml(st.name)} ↗</a>`).join('')}
            </div>
          ` : ''}
          ${topTags.length ? `
            <div class="meta-row" style="gap:5px;">
              <span style="font-size:11.5px;color:var(--text-dim);font-weight:700;">FORENSIC TAGS:</span>
              ${topTags.map(t => `<a class="badge badge-accent" href="./vibe-graph.html?vibe=${encodeURIComponent(t)}" title="Explore #${escapeHtml(t)} in Evidence Graph" style="text-decoration:none;">#${escapeHtml(t)}</a>`).join('')}
            </div>
          ` : ''}
          <p id="af-modal-synopsis" class="${isLongSynopsis ? 'synopsis-clamped' : ''}" style="margin:0;font-size:13px;color:#cbd5e1;white-space:pre-line;line-height:1.55;">
            ${escapeHtml(cleanSynopsis)}
          </p>
          ${isLongSynopsis ? `<button type="button" class="synopsis-toggle" id="af-synopsis-toggle">Read full dossier summary ▾</button>` : ''}
          <div class="meta-row" style="margin-top:auto;">
            <a class="btn btn-primary btn-sm" href="./vibe-graph.html?seed=${media.id}">Explore in Evidence Graph</a>
            <a class="btn btn-cyan btn-sm" href="./eclectic-lab.html?tab=arithmetic&seed=${media.id}">Send to Case Arithmetic</a>
            ${ytTrailerId ? `<button type="button" class="btn btn-sm" id="af-toggle-trailer">▶ Watch Official Trailer</button>` : ''}
            <a class="btn btn-sm" href="${justWatchUrl}" target="_blank" rel="noopener noreferrer">JustWatch US ↗</a>
            <a class="btn btn-sm" id="af-imdb-hero-link" href="${media.imdbId ? `https://www.imdb.com/title/${encodeURIComponent(media.imdbId)}/` : `https://www.imdb.com/find/?q=${encodeURIComponent(title)}`}" target="_blank" rel="noopener noreferrer" style="border-color:rgba(245,158,11,0.55);color:#fde68a;">IMDb${media.imdbRating ? ` ★ ${media.imdbRating}` : ''} ↗</a>
            <a class="btn btn-sm" href="https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(title)}" target="_blank" rel="noopener noreferrer">Wikipedia Case File ↗</a>
          </div>
          <div id="af-trailer-slot"></div>
        </div>
      </div>

      <div class="detail-section">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
          <h4 style="margin:0;">Case File Dossier &amp; Personal Tracking</h4>
          <span id="af-autosave-badge" class="badge badge-muted" style="font-size:11px;">Changes auto-save on edit</span>
        </div>
        <div class="form-grid">
          <div class="form-field">
            <label for="af-wl-status">Dossier Status</label>
            <select id="af-wl-status" class="select">
              ${WATCHLIST_STATUSES.map(st => `<option value="${st}" ${curStatus === st ? 'selected' : ''}>${st}</option>`).join('')}
            </select>
          </div>
          <div class="form-field">
            <label for="af-wl-rating">Case Rating (0–10)</label>
            <select id="af-wl-rating" class="select">
              <option value="0">Unrated</option>
              ${[10,9,8,7,6,5,4,3,2,1].map(r => `<option value="${r}" ${curRating === r ? 'selected' : ''}>${r} / 10</option>`).join('')}
            </select>
          </div>
          <div class="form-field">
            <label for="af-wl-progress">Episodes / Parts Completed</label>
            <div style="display:flex;gap:6px;">
              <input id="af-wl-progress" type="number" min="0" max="${media.episodes || 9999}" class="input input-full" value="${curProgress}">
              <button type="button" class="btn btn-sm" id="af-wl-inc" title="Increment episode">+1</button>
            </div>
          </div>
          <div class="form-field">
            <label for="af-wl-dub">Case Status / Release Track Override</label>
            <select id="af-wl-dub" class="select">
              ${DUB_OPTIONS.map(d => `<option value="${d}" ${(ovr.dubOverride || '') === d ? 'selected' : ''}>${d || 'Auto (' + dubLabel + ')'}</option>`).join('')}
            </select>
          </div>
          <div class="form-field">
            <label for="af-wl-dublag">Episode Release Delay (0 = Simul-Release)</label>
            <input id="af-wl-dublag" type="number" min="0" max="1500" class="input input-full" placeholder="Blank=unset, 0=Simul-Release, 1=1w lag" value="${ovr.dubLag ?? ''}">
          </div>
          <div class="form-field">
            <label for="af-wl-dubday">Delayed Streaming / Podcast Day</label>
            <select id="af-wl-dubday" class="select">
              ${DAY_OPTS.map(o => `<option value="${o.v}" ${String(ovr.dubDay ?? '') === o.v ? 'selected' : ''}>${o.l}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-field" style="margin-top:10px;">
          <label for="af-wl-notes">Investigator Case Notes &amp; Theories</label>
          <textarea id="af-wl-notes" class="textarea" placeholder="Key timeline evidence, theories, episodes to revisit...">${escapeHtml(curNotes)}</textarea>
        </div>
        <div class="form-field" style="margin-top:10px;">
          <label>Custom Streaming &amp; Network Overrides</label>
          <div class="pills-row" id="af-custom-platforms">
            ${PLATFORM_CONFIG.map(p => {
              const active = (ovr.customPlatforms || []).includes(p.id);
              return `<button type="button" class="pill ${active ? 'active' : ''}" data-pid="${p.id}">${escapeHtml(p.name)}</button>`;
            }).join('')}
            <button type="button" class="pill ${ovr.customFreeWithAds ? 'active' : ''}" id="af-custom-free-ads">★ Free / Ad-Supported</button>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h4>Streaming &amp; Multi-Source Case Metadata (TVMaze · Apple Podcasts · Wikipedia · TMDB US)</h4>
        <div id="af-multisrc-area" style="font-size:13px;color:var(--text-muted);">
          <span class="spinner"></span> Querying TVMaze, Apple Podcasts, Wikipedia${state.settings.tmdbKey ? ' &amp; TMDB US' : ''}...
        </div>
      </div>
    `;

    if (footerEl) {
      footerEl.hidden = false;
      footerEl.innerHTML = `
        <button type="button" class="btn btn-emerald" id="af-wl-save">${wl ? 'Update Case File' : '+ Save to Case Files'}</button>
        <button type="button" class="btn btn-sm" id="af-ovr-only">Save Network/Case Status Overrides Only</button>
        ${wl ? `<button type="button" class="btn btn-danger btn-sm" id="af-wl-remove" style="margin-left:auto;">Remove Case File</button>` : ''}
      `;
    }

    const synToggle = bodyEl.querySelector('#af-synopsis-toggle');
    if (synToggle) {
      synToggle.addEventListener('click', () => {
        const p = bodyEl.querySelector('#af-modal-synopsis');
        const expanded = !p.classList.contains('synopsis-clamped');
        p.classList.toggle('synopsis-clamped', expanded);
        synToggle.textContent = expanded ? 'Read full dossier summary ▾' : 'Show less ▴';
      });
    }

    const trailerBtn = bodyEl.querySelector('#af-toggle-trailer');
    if (trailerBtn && ytTrailerId) {
      trailerBtn.addEventListener('click', () => {
        const slot = bodyEl.querySelector('#af-trailer-slot');
        if (slot.innerHTML) {
          slot.innerHTML = '';
          trailerBtn.textContent = '▶ Watch Official Trailer';
        } else {
          slot.innerHTML = `<div class="trailer-embed-wrap"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(ytTrailerId)}?autoplay=1" title="Official Trailer" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
          trailerBtn.textContent = '✕ Hide Trailer';
        }
      });
    }

    const customSet = new Set(ovr.customPlatforms || []);
    let customFree = Boolean(ovr.customFreeWithAds);
    let modalAutoSaveTimer = null;
    let pendingAutoSaveMode = null;

    const readDubScheduleInputs = () => {
      const rawLag = bodyEl.querySelector('#af-wl-dublag')?.value.trim() ?? '';
      return {
        dubOverride: bodyEl.querySelector('#af-wl-dub').value,
        dubLag: rawLag === '' ? null : Math.max(0, Number(rawLag)),
        dubDay: bodyEl.querySelector('#af-wl-dubday')?.value ?? ''
      };
    };

    const readAllModalTrackingFields = () => ({
      status: bodyEl.querySelector('#af-wl-status')?.value || 'Case Backlog',
      rating: Number(bodyEl.querySelector('#af-wl-rating')?.value) || 0,
      progress: Math.max(0, Number(bodyEl.querySelector('#af-wl-progress')?.value) || 0),
      notes: bodyEl.querySelector('#af-wl-notes')?.value ?? '',
      ...readDubScheduleInputs(),
      customPlatforms: Array.from(customSet),
      customFreeWithAds: customFree
    });

    const markAutoSavedBadge = (labelText = '✓ Auto-saved') => {
      const badge = bodyEl.querySelector('#af-autosave-badge');
      if (badge) {
        badge.className = 'badge badge-emerald';
        badge.textContent = labelText;
      }
      const saveBtn = backdrop.querySelector('#af-wl-save');
      if (saveBtn && getState().watchlist[media.id]) {
        saveBtn.textContent = '✓ Saved in Case Files';
      }
    };

    const syncModalHeroDubBadge = () => {
      const heroDubBadge = bodyEl.querySelector('#af-modal-dub-badge');
      if (heroDubBadge) {
        heroDubBadge.textContent = classifyDub(media);
      }
    };

    const persistModalChangesNow = (mode = 'watchlist') => {
      if (modalAutoSaveTimer) {
        clearTimeout(modalAutoSaveTimer);
        modalAutoSaveTimer = null;
      }
      pendingAutoSaveMode = null;
      if (!bodyEl.querySelector('#af-wl-status')) return;
      const fields = readAllModalTrackingFields();
      const inWl = Boolean(getState().watchlist[media.id]);
      if (mode === 'watchlist' || inWl) {
        upsertWatchlistItem(media, fields);
        markAutoSavedBadge('✓ Auto-saved to Case Files');
      } else {
        updateOverrides(media.id, fields);
        markAutoSavedBadge('✓ Overrides auto-saved');
      }
      syncModalHeroDubBadge();
    };

    const scheduleModalAutoSave = (mode = 'watchlist', immediate = false) => {
      if (pendingAutoSaveMode !== 'watchlist') {
        pendingAutoSaveMode = mode;
      }
      if (immediate) {
        persistModalChangesNow(pendingAutoSaveMode);
        return;
      }
      const badge = bodyEl.querySelector('#af-autosave-badge');
      if (badge) {
        badge.className = 'badge badge-cyan';
        badge.textContent = 'Saving...';
      }
      if (modalAutoSaveTimer) clearTimeout(modalAutoSaveTimer);
      modalAutoSaveTimer = setTimeout(() => {
        persistModalChangesNow(pendingAutoSaveMode || mode);
      }, 250);
    };

    activeModalFlushFn = () => {
      if (modalAutoSaveTimer || pendingAutoSaveMode) {
        persistModalChangesNow(pendingAutoSaveMode || 'watchlist');
      }
    };

    const refreshHeroStreamBar = (extraLinks = [], extraStreamNames = []) => {
      const bar = bodyEl.querySelector('#af-modal-stream-bar');
      if (!bar) return;
      const links = getStreamingLinks(media, extraLinks, extraStreamNames);
      bar.innerHTML = `<span style="font-size:11.5px;color:var(--text-dim);font-weight:700;">WATCH / STREAM ON:</span>${renderStreamChipsHtml(links)}`;
    };

    bodyEl.querySelectorAll('#af-custom-platforms [data-pid]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = btn.dataset.pid;
        if (customSet.has(pid)) { customSet.delete(pid); btn.classList.remove('active'); }
        else { customSet.add(pid); btn.classList.add('active'); }
        scheduleModalAutoSave('overrides', true);
        refreshHeroStreamBar();
      });
    });
    const freeBtn = bodyEl.querySelector('#af-custom-free-ads');
    freeBtn.addEventListener('click', () => {
      customFree = !customFree;
      freeBtn.classList.toggle('active', customFree);
      scheduleModalAutoSave('overrides', true);
    });

    bodyEl.querySelector('#af-wl-inc').addEventListener('click', () => {
      const inp = bodyEl.querySelector('#af-wl-progress');
      inp.value = String((Number(inp.value) || 0) + 1);
      scheduleModalAutoSave('watchlist', true);
    });

    ['#af-wl-status', '#af-wl-rating'].forEach(sel => {
      bodyEl.querySelector(sel)?.addEventListener('change', () => scheduleModalAutoSave('watchlist', true));
    });
    const dubSelect = bodyEl.querySelector('#af-wl-dub');
    const lagInput = bodyEl.querySelector('#af-wl-dublag');
    const dubDaySelect = bodyEl.querySelector('#af-wl-dubday');

    if (dubSelect) {
      dubSelect.addEventListener('change', () => {
        if (dubSelect.value === 'Simul-Release' && lagInput) {
          lagInput.value = '0';
          if (dubDaySelect) dubDaySelect.value = '';
        }
        scheduleModalAutoSave('overrides', true);
      });
    }
    if (dubDaySelect) {
      dubDaySelect.addEventListener('change', () => scheduleModalAutoSave('overrides', true));
    }
    const progInput = bodyEl.querySelector('#af-wl-progress');
    if (progInput) {
      progInput.addEventListener('input', () => scheduleModalAutoSave('watchlist', false));
      progInput.addEventListener('change', () => scheduleModalAutoSave('watchlist', true));
    }
    const notesInput = bodyEl.querySelector('#af-wl-notes');
    if (notesInput) {
      notesInput.addEventListener('input', () => scheduleModalAutoSave('watchlist', false));
      notesInput.addEventListener('blur', () => { if (modalAutoSaveTimer) persistModalChangesNow('watchlist'); });
    }
    if (lagInput) {
      const syncDubClassificationFromLag = (immediate) => {
        const raw = lagInput.value.trim();
        if (raw !== '') {
          const n = Math.max(0, Number(raw));
          if (n === 0) {
            if (dubSelect) dubSelect.value = 'Simul-Release';
            if (dubDaySelect) dubDaySelect.value = '';
          } else if (n > 0 && dubSelect && (dubSelect.value === '' || dubSelect.value === 'Simul-Release')) {
            dubSelect.value = 'Staggered Release';
          }
        }
        scheduleModalAutoSave('overrides', immediate);
      };
      lagInput.addEventListener('input', () => syncDubClassificationFromLag(false));
      lagInput.addEventListener('change', () => syncDubClassificationFromLag(true));
    }

    backdrop.querySelector('#af-wl-save').addEventListener('click', () => {
      persistModalChangesNow('watchlist');
      toast(`Saved "${title}" to Case Files.`, 'success');
      closeDetailModal();
    });

    backdrop.querySelector('#af-ovr-only').addEventListener('click', () => {
      persistModalChangesNow('overrides');
      toast(`Saved network & case status overrides for "${title}".`, 'success');
    });

    const remBtn = backdrop.querySelector('#af-wl-remove');
    if (remBtn) {
      remBtn.addEventListener('click', () => {
        if (modalAutoSaveTimer) {
          clearTimeout(modalAutoSaveTimer);
          modalAutoSaveTimer = null;
        }
        pendingAutoSaveMode = null;
        activeModalFlushFn = null;
        removeWatchlistItem(media.id);
        toast(`Removed "${title}" from Case Files.`, 'warn');
        closeDetailModal();
      });
    }

    try {
      const multi = await fetchMultiSourceDetails(media);
      if (!activeModalAnime || activeModalAnime.id !== media.id) return;
      const area = bodyEl.querySelector('#af-multisrc-area');
      const extraStreamNames = [
        multi.tvmaze?.network || '',
        ...(multi.tmdb?.flatrate || []),
        ...(multi.tmdb?.ads || []),
        ...(multi.tmdb?.free || [])
      ].filter(Boolean);
      const mergedPlatforms = detectPlatforms(media, extraStreamNames);
      const extraLinks = [];
      if (multi.tvmaze?.officialSite) extraLinks.push({ name: multi.tvmaze.network || 'Official Site', url: multi.tvmaze.officialSite });
      if (multi.itunes?.url) extraLinks.push({ name: 'Apple Podcasts', url: multi.itunes.url });
      const streamLinks = getStreamingLinks(media, extraLinks, extraStreamNames);
      refreshHeroStreamBar(extraLinks, extraStreamNames);

      const resolvedImdbId = multi.omdb?.imdbID || media.imdbId || multi.tvmaze?.imdb || '';
      if (resolvedImdbId) {
        const imdbBtn = bodyEl.querySelector('#af-imdb-hero-link');
        if (imdbBtn) {
          imdbBtn.href = `https://www.imdb.com/title/${encodeURIComponent(resolvedImdbId)}/`;
          const ratingTxt = multi.omdb?.imdbRating || media.imdbRating || '';
          if (ratingTxt) imdbBtn.textContent = `IMDb ★ ${ratingTxt} ↗`;
        }
      }
      if (multi.omdb?.poster) {
        const coverImg = bodyEl.querySelector('.detail-cover');
        if (coverImg && coverImg.src.startsWith('data:image/svg+xml')) coverImg.src = multi.omdb.poster;
      }

      area.innerHTML = `
        <div class="meta-row" style="margin-bottom:12px;">
          <strong style="color:var(--text);">Where to Watch / Listen:</strong>
          ${streamLinks.length
            ? streamLinks.map(s => `<a class="stream-link-chip" href="${escapeHtml(safeUrl(s.url))}" target="_blank" rel="noopener noreferrer" style="border-color:${s.color};color:${s.color};">${escapeHtml(s.name)} ↗</a>`).join('')
            : mergedPlatforms.length
              ? mergedPlatforms.map(p => `<span class="platform-tag" style="border-color:${p.color};color:${p.color};">${escapeHtml(p.name)}${p.freeWithAds ? ' (Free)' : ''}</span>`).join('')
              : '<span class="badge badge-muted">Check JustWatch US above or set custom network overrides</span>'}
        </div>
        ${(multi.omdb || media.imdbId || multi.tvmaze?.imdb) ? `
          <div class="panel" style="padding:10px;margin-bottom:12px;border-color:rgba(245,158,11,0.35);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <span style="font-size:11px;color:var(--amber);text-transform:uppercase;font-weight:700;">IMDb &amp; OMDb Ratings</span>
              ${resolvedImdbId ? `<a href="https://www.imdb.com/title/${encodeURIComponent(resolvedImdbId)}/" target="_blank" rel="noopener noreferrer" style="font-size:11.5px;color:var(--amber);">Open ${escapeHtml(resolvedImdbId)} on IMDb ↗</a>` : ''}
            </div>
            <div style="font-size:12.5px;color:var(--text);">
              <strong>IMDb:</strong> ${escapeHtml(multi.omdb?.imdbRating || (media.imdbRating ? String(media.imdbRating) : '—'))}/10
              ${(multi.omdb?.imdbVotes || media.imdbVotes) ? ` (${escapeHtml(multi.omdb?.imdbVotes || Number(media.imdbVotes).toLocaleString())} votes)` : ''}
              ${(multi.omdb?.rottenTomatoes || media.rottenTomatoes) ? ` &nbsp;·&nbsp; <strong>Rotten Tomatoes:</strong> ${escapeHtml(multi.omdb?.rottenTomatoes || media.rottenTomatoes)}` : ''}
              ${multi.omdb?.metascore ? ` &nbsp;·&nbsp; <strong>Metascore:</strong> ${escapeHtml(multi.omdb.metascore)}` : ''}
              ${(multi.omdb?.rated || media.mpaaRated) ? ` &nbsp;·&nbsp; <span class="badge badge-muted">${escapeHtml(multi.omdb?.rated || media.mpaaRated)}</span>` : ''}
            </div>
            ${multi.omdb?.awards ? `<div style="font-size:11.5px;color:var(--text-muted);margin-top:4px;">🏆 ${escapeHtml(multi.omdb.awards)}</div>` : ''}
          </div>
        ` : ''}
        <div class="grid-2" style="gap:10px;margin-bottom:12px;">
          <div class="panel" style="padding:10px;">
            <div style="font-size:11px;color:var(--text-dim);text-transform:uppercase;">TVMaze Broadcast Index</div>
            <div style="font-weight:700;color:var(--text);margin-top:3px;">
              ${multi.tvmaze ? `Rating: ${multi.tvmaze.rating ?? '—'} · ${escapeHtml(multi.tvmaze.status || 'Indexed')}` : 'Feature / Podcast Dossier'}
            </div>
            ${multi.tvmaze?.network ? `<div style="font-size:11.5px;">Network: <a href="${escapeHtml(safeUrl(multi.tvmaze.url))}" target="_blank" rel="noopener noreferrer">${escapeHtml(multi.tvmaze.network)} ↗</a></div>` : ''}
          </div>
          <div class="panel" style="padding:10px;">
            <div style="font-size:11px;color:var(--text-dim);text-transform:uppercase;">Apple Podcasts True Crime Directory</div>
            <div style="font-size:12.5px;color:var(--text);margin-top:3px;">
              ${multi.itunes
                ? `<a href="${escapeHtml(safeUrl(multi.itunes.url))}" target="_blank" rel="noopener noreferrer">${escapeHtml(multi.itunes.name)} (${multi.itunes.episodes || '?'} eps) ↗</a>`
                : 'No companion podcast feed matched'}
            </div>
            ${multi.itunes?.publisher ? `<div style="font-size:11.5px;">Producer: ${escapeHtml(multi.itunes.publisher)}</div>` : ''}
          </div>
        </div>
        ${multi.tmdb ? `
          <div class="panel" style="padding:10px;margin-bottom:12px;">
            <div style="font-size:11px;color:var(--cyan);text-transform:uppercase;">TMDB US Watch Providers (JustWatch)</div>
            <div style="font-size:12.5px;color:var(--text);margin-top:4px;">
              <strong>Stream:</strong> ${escapeHtml(multi.tmdb.flatrate.join(', ') || '—')} &nbsp;|&nbsp;
              <strong>Free/Ads:</strong> ${escapeHtml([...multi.tmdb.free, ...multi.tmdb.ads].join(', ') || '—')}
            </div>
          </div>
        ` : ''}
        ${multi.wikipedia ? `
          <div class="panel" style="padding:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <span style="font-size:11px;color:var(--amber);text-transform:uppercase;">Wikipedia Case Dossier Extract</span>
              <a href="${escapeHtml(safeUrl(multi.wikipedia.url))}" target="_blank" rel="noopener noreferrer" style="font-size:11.5px;">Read full article ↗</a>
            </div>
            <p style="margin:0;font-size:12.5px;color:#cbd5e1;">${escapeHtml(multi.wikipedia.extract)}</p>
          </div>
        ` : '<div style="font-size:12px;color:var(--text-dim);">Use the Wikipedia Case File link above to browse historical background records.</div>'}
      `;
    } catch {
      const area = bodyEl.querySelector('#af-multisrc-area');
      if (area) area.textContent = 'Multi-source enrichment partially unavailable right now.';
    }
  }

  const coreApi = {
    STATE_KEY,
    DB_NAME,
    GIST_FILENAME,
    TTL_DYNAMIC,
    TTL_STABLE,
    WATCHLIST_STATUSES,
    DUB_OPTIONS,
    PLATFORM_CONFIG,
    PLATFORM_BY_ID,
    MEDIA_CARD_FIELDS,
    CANONICAL_DOSSIER_LIST,
    formatSourceLabel,
    getTopSubgenreTags,
    getKeyStaff,
    isSequelOrRecap,
    escapeHtml,
    stripHtml,
    safeUrl,
    getDisplayTitle,
    getCover,
    normalizeStatus,
    formatCompactNumber,
    formatRelativeCountdown,
    toast,
    encodeBase64Utf8,
    decodeBase64Utf8,
    cacheGet,
    cacheSet,
    vectorGet,
    vectorSet,
    cacheStats,
    cacheClear,
    getState,
    saveState,
    onStateChange,
    onSyncStatus,
    upsertWatchlistItem,
    removeWatchlistItem,
    updateOverrides,
    updateSettings,
    mergeRemotePayload,
    buildPortableSyncPayload,
    gistPull,
    gistPush,
    gistCreateNew,
    gistConnectAndSetup,
    gistDisconnect,
    generateSyncCode,
    applySyncCode,
    detectPlatforms,
    getStreamingLinks,
    isFreeWithAds,
    classifyDub,
    getDubLanguages,
    getDubTrackInfo,
    verifyDubStatusBatch,
    anilistQuery,
    fetchAnimeById,
    searchAnimeQuick,
    getTaxonomy,
    parseVibePrompt,
    fetchVibeCandidates,
    importAniListWatchlist,
    fetchWikipediaSummary,
    fetchTmdbUsProviders,
    fetchTmdbTrueCrimeDiscover,
    fetchExpandedTvMazeCatalog,
    fetchOmdbDetails,
    hydrateCardPosters,
    fetchMultiSourceDetails,
    mountNav,
    openDetailModal,
    closeDetailModal
  };

  global.TrueCrimeFinderCore = coreApi;
  global.AnimeFinderCore = coreApi;
})(window);
