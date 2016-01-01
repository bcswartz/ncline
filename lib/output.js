//Load NPM modules
var colors = require( 'colors' );

//Load needed core files
var core = require( './core' );

//Error object used to throw an error during synchronous statement execution
function OutputError( message ) {
    var msg = '\nERROR: ' + message;
    this.message = msg.red;
}

module.exports = {
    /* Use throwError to perform a standard throw() fromitemsynchronous function execution; use error to simply output an error message
    from within a callback or promise before stopping further execution within the callback
    */
    throwError: function( message ) {
        throw new OutputError( message );
    },

    error: function ( message, skipPrompt ) {
        var msg = '\nERROR: ' + message;
        console.log( msg.red );
        if( !skipPrompt ) {
            core.getReadlineInterface().prompt( true );
        }
    },

    passError: function( err ) {
      if( err ) {
          this.error( err.message );
      }
    },

    prompt: function() {
        core.getReadlineInterface().prompt( true );
    },

    msg: function ( message, skipPrompt ) {
        var msg = '\n' + message;
        console.log( msg.cyan );
        if( !skipPrompt ) {
            core.getReadlineInterface().prompt( true );
        }
    },

    warn: function ( message, skipPrompt ) {
        var msg = '\nWARN: ' + message;
        console.log( msg.yellow );
        if( !skipPrompt ) {
            core.getReadlineInterface().prompt( true );
        }
    },

    success: function( message ) {
        var msg = '\n' + message;
        console.log( msg.green );
        core.getReadlineInterface().prompt( true );
    }
}
