//Load needed library modules
var core = require( '../../../lib/core' );

module.exports = {

    showCmds: function() {
        var sortedCmd = core.sortObjectProperties( core.getCmdObject() );
        console.log( "Available commands:".magenta.underline );
        for ( var c in sortedCmd ) {
            console.log( sortedCmd[ c ].signature.cyan );
        }
    }

}