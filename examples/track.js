const getItunesTracks = require('../index').getItunesTracks


async function example() {

    console.log('Example of how the getItunesTracks function works!')

    let validXML = "C:\\Users\\JohnPaul\\Music\\iTunes\\iTunes Music Library.xml" //replace this with your xml path

    return new Promise(function(resolve, reject) {

        let stream = getItunesTracks(validXML)
        stream.on('data', function(res) {
            let track = JSON.parse(res)
            console.log(track)
        })
        stream.on('error', function(err) {
            console.error(err)
            return reject()
        })
        stream.on('end', function(res) {
            return resolve()
        })

    })

}


example()
    .then(res => {
        console.log('finished!!!')
    })