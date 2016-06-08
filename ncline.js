//Load needed core Node modules
var readline = require( 'readline' );
var fs = require( 'fs' );

//Load NPM modules
var colors = require( 'colors' );

//Load needed library modules
var core = require( './lib/core' );
var output = require( './lib/output' );
var watchers = require( './lib/watchers' );

//Create or load file with command name overrides, if any exist
var nameOverrideFile = './cmdData/nameOverrides.json';
var commandNameOverrides;
try {
    fs.statSync( nameOverrideFile );
    commandNameOverrides = require( nameOverrideFile );
} catch( err ) {
    commandNameOverrides = {};
    fs.writeFile( nameOverrideFile, '{}', function( err ) {
        output.passError( err );
    } );
}

var moduleArray,
    stat,
    cmdModule,
    cmdManual,
    cmdName,
    finalCmdName;

//Announce startup
console.log( "Starting ncline...".yellow );

/*
 Load the cmdModule sets:
 core: commands part of the base application, meant to be used by other commands. Mandatory
 public: command modules shared with other users
 private: command modules that only work on your machine (hard-coded file paths, etc.)
 */
var commandSets = [ 'core', 'public', 'private' ];
var cmd = {};
var cmdCatalog = [];
var nameCollisions = [];


//Invoking ncline with "node ncline.js demo:true" will include demo command modules for learning purposes.
if( process.argv.indexOf( 'demo:true' ) != -1 ) {
    commandSets.push( 'demo' );
}

//Populate commands
commandSets.forEach( function( setName ) {
    moduleArray = fs.readdirSync( './cmdModules/' + setName );
    moduleArray.forEach( function ( entry ) {
        stat = fs.statSync( './cmdModules/' + setName + '/' + entry );
        if ( stat && stat.isDirectory() ) {
            cmdModule = require( './cmdModules/' + setName + '/' + entry + '/commands' ).commands;
            cmdManual = fs.existsSync( './cmdModules/' + setName + '/' + entry + '/manual.json' ) ? require( './cmdModules/' + setName + '/' + entry + '/manual.json' ) : {};
            for ( cmdName in cmdModule ) {
                //Set to user-defined command name override if one exists
                finalCmdName = ( commandNameOverrides.hasOwnProperty( entry ) && commandNameOverrides[ entry ].hasOwnProperty( cmdName ) ) ? commandNameOverrides[ entry ][ cmdName ] : cmdName;
                //Track name collisions and record them to report out later but allow execution to continue
                if( cmd[ finalCmdName ] != undefined ) {
                    nameCollisions.push( "Command '" + finalCmdName + "' is defined more than once, last command defined wins." )
                }

                cmd[ finalCmdName ] = {
                    object: cmdModule,
                    function: cmdModule[ cmdName ],
                    signature: core.renderSignature( finalCmdName, cmdModule[ cmdName ] ),
                    modulePath: setName + '/' + entry,
                    manual: cmdManual.hasOwnProperty( cmdName ) ? cmdManual[ cmdName ] : null
                };
                cmdCatalog.push( finalCmdName );

            }
        }
    } );
});

//Provides the core library with the cmd object
core.setCmdObject( cmd );

//Report any name collisions amongst the commands
nameCollisions.forEach( function( msg ) {
    console.log( ('WARNING: ' + msg).yellow );
});

//Function that provides ability to start typing in a command name and hit Tab to see commands that match
function commandCompleter( line ) {
    var hits = cmdCatalog.filter( function ( c ) {
        return c.indexOf( line ) == 0
    } )
    //Shows all completions if none found
    return [ hits.length ? hits : cmdCatalog, line ]
}

//Create readline interface
var rl = readline.createInterface( {
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    completer: commandCompleter
});

rl.setPrompt( core.generateCommandPrompt() );

/*
 TODO: Find a better solution -
 Right now this is the best way I've found to workaround the behavior with the first prompt/line of input where it a) ignores the
 readline completer on Tab, and b) echos the first command
*/

rl.question( 'ncline ready. Hit Enter to start. Type "about" and hit Enter for help.', function( answer ) {
    rl.prompt();
});

//Event subscription that takes the command line input
rl.on( 'line', function ( input ) {
    var cmdName,
        argumentString,
        outcome;

    cmdName = input.match(/\S*(?=\s?)/);
    if( input.split(' ' ).length > 1 ) {
        argumentString = input.replace(/\S*\s/,'');
    } else {
        argumentString = '';
    }

    if( cmd.hasOwnProperty( cmdName ) ) {
        try {
            if( argumentString != '' ) {
                //Parse arguments
                argumentsArray = core.generateArgumentsArray( argumentString, cmd[ cmdName ].function );

                //Clear existing arguments object
                arguments = [].slice.call(arguments, 1);

                //Now populate arguments object with parsed arguments
                for( var i = 0; i < argumentsArray.length; i++ ) {
                    [].push.call(arguments, argumentsArray[ i ] );
                }

                cmd[ cmdName ].function.apply( cmd[ cmdName ].object, arguments );
                rl.setPrompt( core.generateCommandPrompt() );
                rl.prompt();


            } else {
                //Clear existing arguments object
                arguments = [].slice.call(arguments, 1);

                cmd[ cmdName ].function.apply( cmd[ cmdName ].object, arguments );
                rl.setPrompt( core.generateCommandPrompt() );
                rl.prompt();
            }

        } catch( err ) {
            if( err.message ) {
                console.log( err.message );
            } else {
                console.log( ("\nAn uncaught error occurred with command '" + cmdName + "'.").red );
            }
            rl.prompt();
        }
    } else {
        if( cmdName != '') {
            console.log( "'" + cmdName + "' is not a recognized commmand." );
        }
        rl.prompt();
    }

});

rl.on( 'SIGINT', function() {
    watchers.closeAllWatchers();
    console.log( '\nExiting...'.yellow );
    rl.close();
});

//Provides the core library with the rl object
core.setReadlineInterface( rl );