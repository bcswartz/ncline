//Load needed core Node modules
var childProcess = require( 'child_process' );
var os = require( 'os' );

//Load needed library modules
var output = require( '../../../lib/output' );

//Load needed command modules
var fp = require( '../../core/filePath/commands' );

module.exports = {
    commands: {
        window: function ( alias ) {
            var windowAlias = alias != null ? alias : fp.hooks.getTargetAlias()
            var paths = fp.hooks.getAlias( windowAlias );
            if ( paths instanceof Array ) {
                paths.forEach( function ( filepath ) {
                    childProcess.exec( module.exports.hooks.generateFolderWindowCommand( filepath ), function ( err ) {
                        output.passError( err );
                    } );
                } );
            } else {
                childProcess.exec( module.exports.hooks.generateFolderWindowCommand( paths ), function ( err ) {
                    output.passError( err );
                } );
            }
        }
    },

    hooks: {
        generateFolderWindowCommand: function( filepath ) {
            switch( os.platform() ) {
                case "win32":
                    return 'start "" "' + filepath + '"';
                    break;
                case "darwin":
                    return 'open -a Finder "' + filepath + '"';
                    break;
                default:
                    output.throwError( 'Currently only executes on Windows and Macintosh operating systems.' );
                    break;
            }
        }
    }
}
