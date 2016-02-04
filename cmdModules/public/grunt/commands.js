//Load needed core Node modules
var childProcess = require( 'child_process' );

//Load needed library modules
var output = require( '../../../lib/output' );
var core = require( '../../../lib/core' );

//Load needed command modules
var fp = require( '../../core/filePath/commands' );

module.exports = {

    commands: {
        //Use for "grunt taskname" or "grunt taskname:parameters"
        grunt: function( alias, task ) {
            var filePath, taskName;
            if( arguments.length == 0 ) {
                output.throwError( "This function requires at least one argument: task name or taskname:parameters" );
            } else if( arguments.length > 2 ) {
                output.throwError( "This function takes only two arguments: a path alias and a task name or taskname:parameters" );
            }
            if( arguments.length == 1 ) {
                filePath = fp.hooks.getTargetPath();
                taskName = arguments[ 0 ];
            } else {
                filePath = fp.hooks.getAlias( arguments[ 0 ] );
                //Make sure selected alias is not an alias set
                if( filePath instanceof Array ) {
                    output.throwError( "The specified alias is an alias set." );
                }
                taskName = arguments[ 1 ]
            }

            var gruntPrefix = core.createTerminalExecutionPrefix( filePath, taskName );

            childProcess.exec( gruntPrefix + ' & grunt ' + taskName + '"', function ( err ) {
                output.passError( err );
            } );

        },

        //Use for "grunt taskname --option1=value..." or "grunt taskname:parameters --option1=value..."
        gruntWithOptions: function( alias, task, optionsEnclosedInQuotes ) {
            var filePath, taskName, options;

            if( arguments.length < 2 ) {
                output.throwError( "This function requires at least two arguments: task name or taskname:parameters and option data for the task." );
            }

            if( arguments.length == 2 ) {
                filePath = fp.hooks.getTargetPath();
                taskName = arguments[ 0 ];
                options = arguments[ 1 ];
            } else {
                filePath = fp.hooks.getAlias( arguments[ 0 ] );
                //Make sure selected alias is not an alias set
                if( filePath instanceof Array ) {
                    output.throwError( "The specified alias is an alias set." );
                }
                taskName = arguments[ 1 ];
                options = arguments[ 2 ];
            }

            var gruntPrefix = core.createTerminalExecutionPrefix( filePath, taskName );

            childProcess.exec( gruntPrefix + ' & grunt ' + taskName + ' ' + options + '"', function ( err ) {
                output.passError( err );
            } );

        }
    }

}

