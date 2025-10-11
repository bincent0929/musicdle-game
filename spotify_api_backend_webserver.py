from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import base64
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)  # Allow JavaScript to access this API

class SpotifyClient:
    def __init__(self):
        self.client_id = os.environ.get('SPOTIFY_CLIENT_ID')
        self.client_secret = os.environ.get('SPOTIFY_CLIENT_SECRET')
        self.access_token = None
    
    def get_access_token(self):
        # print(self.client_id)
        # print(self.client_secret)
        credentials = base64.b64encode(
            f"{self.client_id}:{self.client_secret}".encode()
        ).decode()

        response = requests.post(
            'https://accounts.spotify.com/api/token',
            headers={
                'Authorization': f'Basic {credentials}',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data={'grant_type': 'client_credentials'}
        )
        
        if response.ok:
            data = response.json()
            self.access_token = data['access_token']
            return self.access_token
        raise Exception("Failed to get token")
    
    def get_album_tracks(self, album_id):
        if not self.access_token:
            self.get_access_token()
        
        response = requests.get(
            f'https://api.spotify.com/v1/albums/{album_id}/tracks',
            headers={'Authorization': f'Bearer {self.access_token}'}
        )
        
        if response.status_code == 401:  # Token expired
            self.get_access_token()
            return self.get_album_tracks(album_id)
        
        if not response.ok:
            raise Exception(f'Error: {response.status_code}')
        
        data = response.json()
        
        tracks = [
            {
                'name': track['name']
                #'preview_url': track['preview_url']
            }
            for track in data['items']
        ]
        
        return tracks

# Create a global Spotify client instance
spotify = SpotifyClient()

# API ENDPOINT that JavaScript will call
@app.route('/api/album/<album_id>/tracks', methods=['GET'])
def get_album_tracks_endpoint(album_id):
    """This endpoint is what JavaScript calls"""
    try:
        tracks = spotify.get_album_tracks(album_id)
        return jsonify({
            'success': True,
            'data': tracks,
            'album_id': album_id
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # spotify.get_access_token()
    app.run(port=5000, debug=True)