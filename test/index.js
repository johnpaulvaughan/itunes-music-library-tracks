var chai = require('chai');
var expect = require('chai').expect;
var should = require('chai').should;
var getItunesTracks = require('../index').getItunesTracks;




describe('#getItunesTracks', () => {

    it('should return music tracks', (done) => {
        let validXML = require('path').basename(__dirname) + "/iTunes Library.xml";
        let stream = getItunesTracks(validXML)
        stream.on('data', function(res) {
            let track = JSON.parse(res)
            expect(track).to.be.an('object');
            expect(track).to.have.property("Artist")
        })
        stream.on('error', function(err) {
            //done()
        })
        stream.on('end', function(res) {
            done()
        })
    }).timeout(5000);

    it('should emit an \'no tracks\' error when supplied a non itunes file', (done) => {
        let invalidXML = require('path').basename(__dirname) + "/not an iTunes Library.xml";
        let stream = getItunesTracks(invalidXML)
        stream.on('error', function(err) {
            //console.log(err)
            expect(err).to.equal('No tracks exist in the file')
            done()
        })
        stream.on('end', function(res) {
            throw new Error("failed test. Should have received an error before \'end\'");;
            done()
        })
    }).timeout(5000);

    it('should return \'does not exist\' error when supplied a file that does not exist', (done) => {
        let badFilepath = require('path').basename(__dirname) + "/not a real file.txt";
        let stream = getItunesTracks(badFilepath)
        stream.on('error', function(err) {
            //console.log(err)
            expect(err).to.equal('The file you selected does not exist')
            done()
        })
        stream.on('end', function() {
            throw new Error("failed test. Should have received an error before \'end\'");
            done()
        })
    }).timeout(5000);



});
