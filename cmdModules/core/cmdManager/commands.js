var colors = require( 'colors' );
//Load needed library modules
var core = require( '../../../lib/core' );

module.exports = {

    showCmds: function() {
        var sortedCmd = core.sortObjectProperties( core.getCmdObject() );
        console.log( "Available commands:".magenta.underline );
        for ( var c in sortedCmd ) {
            if( sortedCmd[ c ].signature != undefined  ) {
                console.log( sortedCmd[ c ].signature.cyan );
            }
        }
    }

}