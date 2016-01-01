//Load needed core Node modules
var fs =  require( 'fs' );
var childProcess = require( 'child_process' );

//Load needed library files
var output = require( './output' );

//Set outcome values
var outcomeDirectory = './lib/data/dispatcher'; //Path from main ncline file
var outcomeFile = outcomeDirectory + '/outcome.txt';
var defaultOutcomeMsg = 'Dispatch sequence completed';

var initialized = false;

//Create outcome directory and file if necessary
var generateOutputFile = function() {
    try{
        fs.statSync( outcomeDirectory );
    } catch( err ) {
        fs.mkdirSync( outcomeDirectory );
    }

    try{
        fs.statSync( outcomeFile );
    } catch( err ) {
        fs.writeFile( outcomeFile, defaultOutcomeMsg, function( err ) {
            output.passError( err );
        } );
    }

    initialized = true;
}

var terminal,
    errorArray = [],
    cmdProcessCreated = false;

var spawnCmd = function() {
    terminal = childProcess.spawn( 'cmd' );

    //Catch any errors that come through stderr and record them.
    terminal.stderr.on( 'data', function ( errMsg ) {
        errorArray.push( errMsg );
    });

    //Set a watch on the outcomeFile, which will be our indicator that all commands have been processed
    fs.watchFile( outcomeFile, function() {
        fs.readFile( outcomeFile, function( err, outcomeMsg ) {
            //Loop through any caught errors
            errorArray.forEach( function( errMsg ) {
                output.error( errMsg, true );
            })

            //Output as msg because no idea if success or failure
            output.msg( outcomeMsg );

        })
    });

    cmdProcessCreated = true;
}

var writeOutcome = function( outcomeMsg ) {
    terminal.stdin.write( 'echo ' + outcomeMsg + ' > ' + outcomeFile + '\n' );
}

module.exports = {

    dispatch: function( cmdArray, msg ) {

        if( cmdArray == undefined || !( cmdArray instanceof Array ) ) {
            output.throwError( "The first dispatch argument must be an array." );
        } else {
            if( !initialized ) {
                generateOutputFile();
            }
        }

        if( !cmdProcessCreated ) {
            spawnCmd();
        }

        //Reset errors
        errorArray = [];
        cmdArray.forEach( function( statement ) {
            terminal.stdin.write( statement + '\n');
        });

        if( msg != undefined ) {
            writeOutcome( msg );
        }

    }
}

