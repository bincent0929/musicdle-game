import os

def get_file_names(folder_path):
    try:
        items = os.listdir(folder_path)

        files = {}
        # this returns a list with the file name and file path
        
        for item in items:
            full_path = os.path.join(folder_path, item)
            if os.path.isfile(full_path):
                clean_name = item

                if clean_name.lower().endswith('.mp3'):
                    clean_name = clean_name[:-4]

                clean_name = clean_name.replace('-', ' ')

                files[clean_name] = full_path

        print(files)

        return files
    
    except FileNotFoundError:
        print(f"Error: The folder '{folder_path}' was not found.")
        return []
    except PermissionError:
        print(f"Error: Permission denied to access '{folder_path}'.")
        return []
    
if __name__ == '__main__':
    folder_path = "./assets/music/The-Latin-Side-Of-Vince-Guaraldi-By-Vince-Guaraldi"
    get_file_names(folder_path)