# iTunes Music Library Tracks
This module loops through iTunes Music Library XML and spits out a stream of JSON objects for each track (or playlist). 

## Motivation
There are similar npm modules that do this, however when trying to utilise them in an electon application they all failed in one way or another. 
I created my module using minimal dependencies so that it works without issue.

## Installation
```bash
$ npm install @johnpaulvaughan/itunes-music-library-tracks --save
```

## Code Example
Supply the module with a path to your xml file. It returns a node readStream of tracks. <br>
It throws an error if something goes wrong.


```javascript
let getItunesTracks = require('@johnpaulvaughan/itunes-music-library-tracks').getItunesTracks;
let validXMLpath = 'C:\\Users\\JohnPaulVaughan\\Music\\iTunes\\iTunes Music Library.xml'

let trackStream = getItunesTracks(validXMLpath)

trackStream.on('data', function(track) {
    console.log(JSON.parse(track))
})

trackStream.on('error', function(err) {
    console.log(err)
})

trackStream.on('end', () => {
console.log('finished parsing xml stream')
})


```

## Methods
There are two methods that work in a similsr fashion 
- getItunesTracks for track info
- getItunesPlaylists for playlist info
