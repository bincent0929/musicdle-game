/**
 * 
 */

use std::error::Error;
use rand::seq::SliceRandom;
use api_types::{ITunesRSSResponse, ITunesSearchResponse, ITunesRSSEntry};

use crate::itunesapi::api_types::ITunesTrack;

mod api_types;

pub fn extract_year(release_date: Option<&str>) -> String {
    match release_date {
        Some(date) if date.len() >= 4 => date[0..4].to_string(),
        _ => "Unknown".to_string(),
    }
}

async fn fetch_songs() {
    let rss_url: &str = "https://itunes.apple.com/us/rss/topsongs/limit=200/genre=1/json";

    let feed_response: ITunesRSSResponse = reqwest::get(rss_url).await?;

    let feed_data: ITunesTrack = feed_response.json().await
        .map_err(|_| "Failed to parse RSS feed")?;

    let entries: ITunesRSSEntry = feed_data.feed.entry.ok_or("No songs found for that genre/country.")?;
    if entries.is_empty() {
        return Err("No songs found for that genre/country.".into());
    }
    return entries;
}

pub async fn pick_song_with_preview(tries: usize) {
    let mut rng_val: rand::prelude::ThreadRng = rand::rng();

    for _ in 0..tries {
        if let Some(chosen) = entries.choose(&mut rng_val) {
            let track_id = &chosen.id.attributes.im_id;

            let lookup_url = format!("https://itunes.apple.com/lookup?id={}&entity=song", track_id);

            let lookup_result = async {
                let resp = reqwest::get(&lookup_url).await?;
                let data: ITunesSearchResponse = resp.json().await?;
                Ok::<ITunesSearchResponse, Box<dyn Error>(data)
            }.await;

            if let Ok(looked) = lookup_result {
                let item = looked.results.iter()
                    .find(|x| x.kind.as_deref() == Some("song"))
                    .or(looked.results.first());

                if let Some(item) = item {
                    if let Some(preview) = &item.preview_url {
                        return Ok(CurrentSong {
                            preview: preview.clone(),
                            artist: item.artist_name.clone(),
                            title: item.track_name.clone(),
                            genre: item.primary_genre_name.clone(),
                            release_year: extract_year(item.release_date.as_deref()),
                            album_name: item.collection_name.clone(),
                            full_track: item.clone(),
                        });
                    }
                }
            }
        }
    }

    Err("Could not find a preview for any of the picked tracks. Try again.".into());
}