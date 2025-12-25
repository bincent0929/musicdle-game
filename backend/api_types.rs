use serde::{Deserialize, Serialize};

/**
 * iTunes Search API Track Result
 * Based on Apple's official documentation
 */
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ITunesTrack {
    // Core identification
    pub wrapper_type: String, // "track" | "collection" | "artist"
    pub kind: String, // "book" | "album" | ...

    // IDs
    pub track_id: i64,
    pub artist_id: i64,
    pub collection_id: i64,

    // Names
    pub track_name: String,
    pub artist_name: String,
    pub collection_name: String,

    // Censored versions (objectionable words *'d out)
    pub track_censored_name: String,
    pub collection_censored_name: String,

    // URLs for viewing in iTunes Store
    pub artist_view_url: String,
    pub collection_view_url: String,
    pub track_view_url: String,

    // Preview URL (30-second preview) - only for tracks
    pub preview_url: Option<String>,

    // Artwork URLs
    #[serde(rename = "artworkUrl60")]
    pub artwork_url_60: Option<String>,
    #[serde(rename = "artworkUrl100")]
    pub artwork_url_100: Option<String>,

    // Pricing
    pub collection_price: f64,
    pub track_price: f64,
    pub currency: String, // e.g., "USD"

    // Explicit content ratings (RIAA parental advisory)
    pub track_explicitness: String, // "explicit" | "cleaned" | "notExplicit"
    pub collection_explicitness: String,

    // Track metadata
    pub disc_count: i32,
    pub disc_number: i32,
    pub track_count: i32,
    pub track_number: i32,
    pub track_time_millis: i64, // Track duration in milliseconds

    // Location and genre
    pub country: String, // e.g., "USA"
    pub primary_genre_name: String, // e.g., "Rock"

    // Additional fields commonly returned but not in the example
    pub release_date: Option<String>, // ISO 8601 format
    pub collection_artist_id: Option<i64>,
    pub collection_artist_name: Option<String>,
    pub collection_artist_view_url: Option<String>,

    // For different media types
    pub content_advisory_rating: Option<String>, // For movies/TV
    pub short_description: Option<String>,
    pub long_description: Option<String>,

    // Radio station specific
    pub radio_station_url: Option<String>,

    // Streaming availability
    pub is_streamable: Option<bool>,

    // Additional artwork sizes (sometimes included)
    #[serde(rename = "artworkUrl30")]
    pub artwork_url_30: Option<String>,
    #[serde(rename = "artworkUrl512")]
    pub artwork_url_512: Option<String>,
    #[serde(rename = "artworkUrl600")]
    pub artwork_url_600: Option<String>,

    // Genre IDs
    pub genre_ids: Option<Vec<String>>,
    pub genres: Option<Vec<String>>,
}

/**
 * iTunes API Response wrapper
 */
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ITunesSearchResponse {
    #[serde(rename = "resultCount")]
    pub result_count: i32,
    pub results: Vec<ITunesTrack>,
}

// RSS Feed Types

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ITunesRSSAttributes {
    #[serde(rename = "im:id")]
    pub im_id: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ITunesRSSId {
    pub attributes: ITunesRSSAttributes,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ITunesRSSLabel {
    pub label: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ITunesRSSEntry {
    /**
     * The reason `im` is here is because that's how the
     * RSS XML is formatted by Apple in the response
     */
    pub id: ITunesRSSId,
    #[serde(rename = "im:name")]
    pub im_name: ITunesRSSLabel, // track title
    #[serde(rename = "im:artist")]
    pub im_artist: ITunesRSSLabel, // artist name
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ITunesRSSFeed {
    pub entry: Vec<ITunesRSSEntry>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ITunesRSSResponse {
    pub feed: ITunesRSSFeed,
}

/**
 * Media kinds enum for better type safety
 */
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum ITunesMediaKind {
    Book,
    Album,
    CoachedAudio,
    FeatureMovie,
    InteractiveBooklet,
    MusicVideo,
    Pdf,
    Podcast,
    PodcastEpisode,
    SoftwarePackage,
    Song,
    TvEpisode,
    Artist,
}
