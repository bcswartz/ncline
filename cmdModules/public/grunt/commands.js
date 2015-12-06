//Load needed core Node modules
var exec = require( 'child_process' ).exec;
var os = require( 'os' );

//Load needed library modules
var output = require( '../../../lib/output' );
var core = require( '../../../lib/core' );

//Load needed command modules
var fp = require( '../../core/filePath/commands' );

module.exports = {

    //Use for "grunt taskname" or "grunt taskname:parameters"
    grunt: function( alias, task ) {
        var filePath, taskName;
        if( arguments.length > 2 ) {
            output.throwError( "This function takes only two arguments: a path alias and a task name or taskname:parameters" );
        }
        if( arguments.length == 1 ) {
            filePath = fp.getTargetPath();
            taskName = arguments[ 0 ];
        } else {
            filePath = fp.getAlias( arguments[ 0 ] );
            taskName = arguments[ 1 ]
        }

        var gruntPrefix = core.createTerminalExecutionPrefix( filePath, taskName );

        exec( gruntPrefix + ' & grunt ' + taskName + '"', function ( err ) {
            output.passError( err );
        } );

    },

    //Use for "grunt taskname --option1=value..." or "grunt taskname:parameters --option1=value..."
    gruntWithOptions: function( alias, task, optionsEnclosedInQuotes ) {
        var filePath, taskName, options;

        if( arguments.length == 2 ) {
            filePath = fp.getTargetPath();
            taskName = task;
            options = optionsEnclosedInQuotes;

            filePath = fp.getTargetPath();
            taskName = arguments[ 0 ];
            options = arguments[ 1 ];
        } else {
            filePath = fp.getAlias( arguments[ 0 ] );
            taskName = arguments[ 1 ];
            options = arguments[ 2 ];
        }

        var gruntPrefix = core.createTerminalExecutionPrefix( filePath, taskName );

        exec( gruntPrefix + ' & grunt ' + taskName + ' ' + options + '"', function ( err ) {
            output.passError( err );
        } );

    }
}

