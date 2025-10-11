import os

def get_file_names(folder_path):
    try:
        items = os.listdir(folder_path)

        # this returns a list with the file name and file path
        files = [os.path.join(folder_path, item) for item in items 
                if os.path.isfile(os.path.join(folder_path, item))]
        
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