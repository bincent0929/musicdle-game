I literally programmed the whole backend for our website this is the json

```
{
  "album_path": "./assets/music/The-Latin-Side-Of-Vince-Guaraldi-By-Vince-Guaraldi",
  "correct_choice_and_path": [
    "What Kind Of Fool Am I",
    "./assets/music/The-Latin-Side-Of-Vince-Guaraldi-By-Vince-Guaraldi/What-Kind-Of-Fool-Am-I.mp3"
  ],
  "song_names": [
    "Treat Street",
    "Mr. Lucky",
    "What Kind Of Fool Am I",
    "Whirlpool",
    "Dor Que Faz Doer",
    "Star Song",
    "Work Song",
    "Brasilia",
    "Corcovado"
  ],
  "success": true
}
```

The typescript just needs to be programmed to take that input and then print out the songs names as buttons in the html, set the correct song, and print out the audio to play so that the user can guess 
we're using typescript bc I tried to do some actual serious stuff in javascript and not having it typed pissed me off lol
nathan decided to go to san francisco so he hasn't been helping me
the branch is game-functionality-branch

I've made the typescript types and supposedly I also got a function from claude that saves all the info to a struct I think
The setAlbumData function is supposed to save it all and then we'd use the info from that in other functions