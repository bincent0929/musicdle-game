/**
 * Look at https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/index.html#//apple_ref/doc/uid/TP40017632-CH3-SW1
 * for the iTunes Search API documentation.
 */
/**
 * iTunes Search API Track Result
 * Based on Apple's official documentation
 */


/**
 * I had Claude go ahead and write up an interface (kind of like a structure)
 * for the return type of the iTunes API.
 */
export interface ITunesTrack {
  // Core identification
  wrapperType: "track" | "collection" | "artist";
  kind: "book" | "album" | "coached-audio" | "feature-movie" |
  "interactive-booklet" | "music-video" | "pdf" | "podcast" |
  "podcast-episode" | "software-package" | "song" | "tv-episode" | "artist";

  // IDs
  trackId: number;
  artistId: number;
  collectionId: number;

  // Names
  trackName: string;
  artistName: string;
  collectionName: string;

  // Censored versions (objectionable words *'d out)
  trackCensoredName: string;
  collectionCensoredName: string;

  // URLs for viewing in iTunes Store
  artistViewUrl: string;
  collectionViewUrl: string;
  trackViewUrl: string;

  // Preview URL (30-second preview) - only for tracks
  previewUrl?: string;

  // Artwork URLs
  artworkUrl60?: string;   // 60x60 pixels
  artworkUrl100?: string;  // 100x100 pixels

  // Pricing
  collectionPrice: number;
  trackPrice: number;
  currency: string;  // e.g., "USD"

  // Explicit content ratings (RIAA parental advisory)
  trackExplicitness: "explicit" | "cleaned" | "notExplicit";
  collectionExplicitness: "explicit" | "cleaned" | "notExplicit";

  // Track metadata
  discCount: number;
  discNumber: number;
  trackCount: number;
  trackNumber: number;
  trackTimeMillis: number;  // Track duration in milliseconds

  // Location and genre
  country: string;  // e.g., "USA"
  primaryGenreName: string;  // e.g., "Rock"

  // Additional fields commonly returned but not in the example
  releaseDate?: string;  // ISO 8601 format
  collectionArtistId?: number;
  collectionArtistName?: string;
  collectionArtistViewUrl?: string;

  // For different media types
  contentAdvisoryRating?: string;  // For movies/TV
  shortDescription?: string;
  longDescription?: string;

  // Radio station specific
  radioStationUrl?: string;

  // Streaming availability
  isStreamable?: boolean;

  // Additional artwork sizes (sometimes included)
  artworkUrl30?: string;
  artworkUrl512?: string;
  artworkUrl600?: string;

  // Genre IDs
  genreIds?: string[];
  genres?: string[];
}

/**
 * iTunes API Response wrapper
 */
export interface ITunesSearchResponse {
  resultCount: number;
  results: ITunesTrack[];
}

export interface ITunesRSSEntry {
  /**
   * The reason `im` is here is because that's how the
   * RSS XML is formatted by Apple in the response
   */
  id: {
    attributes: {
      "im:id": string;
    };
  };
  "im:name": {
    label: string; // track title
  }
  "im:artist": {
    label: string; // artist name
  }
}

export interface ITunesRSSResponse {
  feed: {
    entry: ITunesRSSEntry[]
  }
}

/**
 * Media kinds enum for better type safety
 */
export enum ITunesMediaKind {
  Book = "book",
  Album = "album",
  CoachedAudio = "coached-audio",
  FeatureMovie = "feature-movie",
  InteractiveBooklet = "interactive-booklet",
  MusicVideo = "music-video",
  PDF = "pdf",
  Podcast = "podcast",
  PodcastEpisode = "podcast-episode",
  SoftwarePackage = "software-package",
  Song = "song",
  TVEpisode = "tv-episode",
  Artist = "artist"
}