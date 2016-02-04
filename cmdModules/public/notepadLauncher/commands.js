//Load needed core modules
var childProcess = require( 'child_process' );
var fs = require( 'fs' );
var os = require( 'os' );

//Load needed library modules
var output = require( '../../../lib/output' );

//Load needed command modules
var fp = require( '../../core/filePath/commands' );

//Only available for Windows
if( os.platform() == 'win32' ) {
    module.exports = {
        commands: {
            //Creates/loads text file in Notepad in either current target path or supplied alias path
            note: function ( filename, alias ) {
                if ( filename == null ) {
                    output.throwError( "You must provide a filename." );
                }
                if ( alias == null ) {
                    var filePath = fp.hooks.getTargetPath();
                } else {
                    var filePath = fp.hooks.getAlias( alias );
                    if ( filePath instanceof Array ) {
                        output.throwError( "Alias '" + alias + "' refers to an alias set; you cannot use it to create a file." );
                    }
                }

                var fileTarget = filePath + '\\' + filename + '.txt';
                childProcess.exec( 'start notepad ' + fileTarget, function ( err ) {
                    output.passError( err );
                } )
            },

            //Creates/loads text file in Notepad in specified file path (use when no alias exists for path)
            notep: function ( filePath, filename ) {
                if ( filename == null ) {
                    output.throwError( "You must provide a filename." );
                }

                try {
                    var stat = fs.statSync( filePath );
                } catch ( e ) {
                    output.throwError( "File path '" + filePath + "' not found." );
                }

                if ( !stat.isDirectory() ) {
                    output.throwError( "File path '" + filePath + "' does not exist as a directory." );
                }

                var fileTarget = filePath + '\\' + filename + '.txt';
                childProcess.exec( 'start notepad ' + fileTarget, function ( err ) {
                    output.passError( err );
                } )
            },

            //Will attempt to shut down Notepad / close all Notepad windows (unsaved files will prompt for a save before closing)
            killpad: function() {
                childProcess.exec( 'taskkill /im notepad.exe', function ( err ) {
                    output.passError( err );
                });
            }
        }

    }
}