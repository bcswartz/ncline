//Load needed core Node modules
var fs = require( 'fs' );
var os = require( 'os' );

//Load needed library files
var output = require( '../../../lib/output' );
var core = require( '../../../lib/core' );

//Persistent configuration or usage data should be stored in a subdirectory of cmdData with same name as cmdModule folder
var dataDirectory = './cmdData/' + core.getModulePath( __dirname );

var dataFile = dataDirectory + '/data.json';
var data;

//Reference: http://stackoverflow.com/questions/18620270/get-application-full-path-in-node-js
var nclinePath = require( 'path' ).dirname( process.mainModule.filename );

var initialData = {
    verbose: false,
    target: {
        alias: "self",
        path: nclinePath
    },
    source: {},
    previousTarget: {},
    previousSource: {},
    aliases: {
        self: nclinePath
    }
};

var createDataFile = function() {
    //Make sure directory exists
    try{
        fs.statSync( dataDirectory );
    } catch( err ) {
        fs.mkdirSync( dataDirectory );
    }

    fs.writeFile( dataFile, JSON.stringify( initialData, null, 2 ), function( err ) {
        output.passError( err );
    } );
}

module.exports = {

    //Looks for data file in expected location.  If found, loads data.  If not, creates data file with default data.
    execute: function() {
        try {
            fs.statSync( dataFile );
            data = JSON.parse( fs.readFileSync( dataFile ) );
        } catch( err ) {
            createDataFile();
            //Just use the initialData as is rather than reading it from the newly-created file.
            data = initialData;
        }
    },

    getData: function() {
        return data;
    },

    getConfig: function() {
        return { dataFile: dataFile }
    }
}