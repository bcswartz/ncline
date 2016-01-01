//Load needed core Node modules
var childProcess = require( 'child_process' );
var os = require( 'os' );

//Load needed library modules
var output = require( '../../../lib/output' );

//Load needed command modules
var fp = require( '../../core/filePath/commands' );

//TODO: remove Windows-only restriction
if( os.platform() == 'win32' ) {
    module.exports = {
        window: function ( alias ) {
            var windowAlias = alias != null ? alias : fp.getTargetAlias()
            var paths = fp.getAlias( windowAlias );
            if ( paths instanceof Array ) {
                paths.forEach( function ( filepath ) {
                    childProcess.exec( 'start "" "' + filepath + '"', function ( err ) {
                        output.passError( err );
                    } );
                } );
            } else {
                childProcess.exec( 'start "" "' + paths + '"', function ( err ) {
                    output.passError( err );
                } );
            }
        }
    }
}