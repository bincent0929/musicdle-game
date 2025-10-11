from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)  # Allow JavaScript to access this API

def get_file_names(folder_path):
    try:
        items = os.listdir(folder_path)

        # this returns a list with the file name and file path
        files = [os.path.join(folder_path, item) for item in items 
                if os.path.isfile(os.path.join(folder_path, item))]
        
        return files
    
    except FileNotFoundError:
        print(f"Error: The folder '{folder_path}' was not found.")
        return []
    except PermissionError:
        print(f"Error: Permission denied to access '{folder_path}'.")
        return []


# API ENDPOINT that JavaScript will call
@app.route('/api/album/<album_id>/tracks', methods=['GET'])
def get_album_tracks_endpoint(album_id):
    """This endpoint is what JavaScript calls"""
    try:
        tracks = 
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