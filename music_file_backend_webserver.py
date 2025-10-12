from flask import Flask, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import random

load_dotenv()

app = Flask(__name__)
CORS(app)  # Allow JavaScript to access this API

def get_songs_and_paths(folder_path: str) -> tuple[list[tuple[str, str]],list[str]]:
    try:
        items = os.listdir(folder_path)

        song_path : list[tuple[str, str]] = []
        song_names : list[str] = []
        # this returns a list with the file name and file path
        
        for item in items:
            full_path = os.path.join(folder_path, item)
            if os.path.isfile(full_path):
                clean_name = item

                if clean_name.lower().endswith('.mp3'):
                    clean_name = clean_name[:-4]

                clean_name : str = clean_name.replace('-', ' ')

                song_path.append((clean_name, full_path))
                song_names.append(clean_name)

        return song_path, song_names
    
    except FileNotFoundError:
        print(f"Error: The folder '{folder_path}' was not found.")
        return ([],[])
    except PermissionError:
        print(f"Error: Permission denied to access '{folder_path}'.")
        return ([],[])
    
def pick_correct_song(song_path: list[tuple[str, str]]) -> tuple[str, str]:
    correct_song_path = random.choice(song_path)
    return correct_song_path

# API ENDPOINT that JavaScript will call
@app.route('/api/tracks', methods=['GET'])
def get_local_album_tracks_endpoint():
    """This endpoint is what JavaScript calls"""
    folder_path = "./assets/music/The-Latin-Side-Of-Vince-Guaraldi-By-Vince-Guaraldi"
    try:
        song_path, song_names = get_songs_and_paths(folder_path)
        correct_song_path = pick_correct_song(song_path)
        return jsonify({
            'success': True,
            'song_names': song_names,
            'correct_choice_and_path': correct_song_path,
            'album_path': folder_path
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)