//Load needed core Node modules
var childProcess = require( 'child_process' );
var os = require( 'os' );

//Load needed library modules
var output = require( '../../../lib/output' );
var core = require( '../../../lib/core' );

//Load needed command modules
var fp = require( '../../core/filePath/commands' );

//TODO: remove Windows-only restriction
if( os.platform() == 'win32' ) {
    module.exports = {
        commands: {
            term: function( alias ) {
                var termAlias = alias != null ? alias : fp.hooks.getTargetAlias()
                var paths = fp.hooks.getAlias( termAlias );
                if( paths instanceof Array ) {
                    paths.forEach( function( filepath ) {
                        childProcess.exec( core.createTerminalExecutionPrefix( filepath, termAlias ) + '"', function( err ) {
                            output.passError( err );
                        });
                    });
                } else {
                    childProcess.exec( core.createTerminalExecutionPrefix( paths, termAlias ) + '"', function( err ) {
                        output.passError( err );
                    } );
                }
            }
        }

    }
}
