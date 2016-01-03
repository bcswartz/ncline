var colors = require( 'colors' );
var _ = require( 'lodash' );

//Load needed library modules
var core = require( '../../../lib/core' );
var output = require( '../../../lib/output' );

module.exports = {

    showCmds: function() {
        var sortedCmd = core.sortObjectProperties( core.getCmdObject() );
        console.log( "Available commands:".magenta.underline );
        for ( var c in sortedCmd ) {
            if( sortedCmd[ c ].signature != undefined  ) {
                console.log( sortedCmd[ c ].signature.cyan );
            }
        }
    },

    man: function( cmdName ) {
        if( !cmdName ) {
            output.throwError( "You must provide the name of a command; use 'showCmds' to list all available commands." )
        }
        var cmd = core.getCmdObject();
        if( !cmd.hasOwnProperty( cmdName ) ) {
            output.throwError( "Command not found; use 'showCmds' to list all available commands." );
        }

        console.log( '' );
        console.log( cmd[ cmdName ].signature.cyan );
        console.log( ('(Location: ' + cmd[ cmdName ].modulePath + '/commands.js)\n').yellow );

        if( !cmd[ cmdName ].manual ) {
            console.log( 'No manual documentation provided; look at the function code for possible comment-based documentation.\n'.cyan )
        } else {
            for( var item in cmd[ cmdName ].manual ) {
                console.log( ( _.capitalize( item ) + ':' ).cyan );
                console.log( ( _.repeat( '-', ( item.length + 1 ) ) ).cyan );

                if( cmd[ cmdName ].manual[ item ] ) {
                    switch( cmd[ cmdName ].manual[ item ].constructor ) {
                        case Array:
                            cmd[ cmdName ].manual[ item ].forEach( function( element ) {
                               console.log( element );
                            });
                            console.log( '' );
                            break;
                        case Object:
                            for( var prop in cmd[ cmdName ].manual[ item ] ) {
                                console.log( ( prop + ':' ).yellow );
                                console.log( cmd[ cmdName ].manual[ item ][ prop ] + '\n' );
                            }
                            break;
                        default:
                            console.log( cmd[ cmdName ].manual[ item ] + '\n' );
                            break;
                    }
                }
            }
        }
    },

    about: function() {
        console.log('');
        console.log( 'ncline is a platform for writing and executing Node-powered JavaScript functions ("commands") from a command line interface.\n'.yellow );
        console.log( 'To execute a command, you simply type in the command name followed by any arguments, separated by spaces, then hit Enter.\n'.yellow );
        console.log( 'If any argument value contains spaces, enclose the argument value in double-quotes.\n'.yellow );
        console.log( 'Example: createAlias docs "C:\\My Documents"\n'.yellow );
        console.log( 'You can also provide named arguments enclosed in square or curly brackets; useful if you want to skip a number of optional arguments.\n'.yellow);
        console.log( 'Example: updateAliasSet [action:add alias:docs filePath:"D:\\My Documents"]\n'.yellow );
        console.log( 'Hitting the Tab key at the command prompt will list the commands by name, and will also auto-suggest commands if you type a partial command name.\n'.yellow );
        console.log( 'To view a list of commands that include their arguments, type the command "showCmds" and hit Enter.\n'.yellow );
        console.log( 'To view manual documentation for a specific command, type "man" and then the command name, and hit Enter.\n'.yellow );
        console.log( 'To exit ncline, hit Control/Command C. You may need to hit it twice if windows created by ncline are still open.\n'.yellow );
    }

};