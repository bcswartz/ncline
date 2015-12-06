//Load needed core Node modules
var exec = require( 'child_process' ).exec;
var os = require( 'os' );

//Load needed library modules
var output = require( '../../../lib/output' );
var core = require( '../../../lib/core' );

//Load needed command modules
var fp = require( '../../core/filePath/commands' );

//TODO: remove Windows-only restriction
if( os.platform() == 'win32' ) {
    module.exports = {
        term: function( alias ) {
            var termAlias = alias != null ? alias : fp.getTargetAlias()
            var paths = fp.getAlias( termAlias );
            if( paths instanceof Array ) {
                paths.forEach( function( filepath ) {
                    exec( core.createTerminalExecutionPrefix( filepath, termAlias ) + '"', function( err ) {
                        output.passError( err );
                    });
                });
            } else {
                exec( core.createTerminalExecutionPrefix( paths, termAlias ) + '"', function( err ) {
                    output.passError( err );
                } );
            }
        }
    }
}
