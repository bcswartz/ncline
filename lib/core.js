//Load NPM modules
var introspect = require( 'introspect' );
var os = require( 'os' );
var _ = require( 'lodash' );

//Deferring load of output module until end of file to resolve circular dependency

//Placeholders for the cmd and readlineInterface objects from ncline
var cmdObject = {};
var readlineInterface = {};

module.exports = {

    spaceReplacement: '@#Sp#@',
    semicolonReplacement: '@#Semi#@',

    generateCommandPrompt: function( cmd ) {
        var promptText;
        if( cmd.getSourceAlias.function() != undefined ) {
            promptText = 'source -> ' + cmd.getSourceAlias.function() + ', ';
        } else {
            promptText = '';
        }
        promptText += 'target -> ' + cmd.getTargetAlias.function() + ' >>';

        return promptText;
    },

    escapeRegExp: function( str ) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    },

    isBoolean: function( str ) {
        if( str == 0 || str == 1 ) {
            return true;
        } else if ( str.constructor == Number ) {
            return false;
        }

        if( str.trim().match(/^(T|t)rue$/) || str.trim().match(/^(F|f)alse$/) ) {
            return true;
        }
        if( str.trim().match(/^(Y|y)es$/) || str.trim().match(/^(N|n)o$/) ) {
            return true;
        }
        if( str.trim().match(/^(Y|y)$/) || str.trim().match(/^(N|n)$/) ) {
            return true;
        }
        if( str.trim() == '1' || str.trim() == '0') {
            return true;
        }
        return false;
    },

    booleanValue: function( str ) {
        if( typeof( str ) == "boolean" ) {
            return str;
        }

        if( str.constructor == Number ) {
            return str == 1 ? true : false;
        }
        switch( str.trim() ) {
            case "true":
            case "True":
            case "yes":
            case "Yes":
            case "y":
            case "Y":
            case "1":
                return true;
                break;
            default:
                return false;
        }
    },

    //Adapted from https://gist.github.com/colingourlay/82506396503c05e2bb94
    sortObjectProperties: function( obj ) {
        var keys = _.sortBy( _.keys( obj ), function ( key ) {
            return key;
        });

        var objectWithSortedProperties =  _.object( keys, _.map( keys, function ( key ) {
            return obj[ key ];
        }));

        return objectWithSortedProperties;
    },

    transformQuotedValues: function( argumentString ) {
        var rawQuotes,
            revisedQuote,
            quoteRegExp;

        //Find any values enclosed in double-quote marks
        rawQuotes = argumentString.match( /"[^"]*"/g );
        if( rawQuotes ) {

            for( var i = 0; i < rawQuotes.length; i++ ) {
                revisedQuote = rawQuotes[ i ].replace( /\s/g, this.spaceReplacement );
                //Make a RegExp out of the original quote, escaping any special RegExp characters in the quote
                quoteRegExp = new RegExp( this.escapeRegExp( rawQuotes[ i ] ) );
                //Use the RegExp to replace the original quote with the revised one
                argumentString = argumentString.replace( quoteRegExp, revisedQuote );
            }
        }

        //Remove all of the " marks from the argument string before returning it:
        argumentString = argumentString.replace( /\"/g, "" );
        return argumentString;
    },

    parseNamedArguments: function( cmdArgumentsArray, cmdFunction ) {
        var methodArgumentsObject = {},
            parsedArgumentsArray = [];

        //Use the introspect module to return an array of the argument names of the targeted function
        var methodArgumentsArray = introspect( cmdFunction );

        //Transform that data into a value object, with the position of each argument stored under the argument name
        methodArgumentsArray.forEach( function( value, index ) {
            methodArgumentsObject[ value ] = index;
        } );

        //Replace the first colon in each command argument array element (perserving any colons in the argument value)
        for( var i = 0; i < cmdArgumentsArray.length; i++ ) {
            cmdArgumentsArray[ i ] = cmdArgumentsArray[ i ].replace(/\:/, this.semicolonReplacement );
            var paramArray = cmdArgumentsArray[ i ].split( this.semicolonReplacement );
            if( methodArgumentsObject.hasOwnProperty( paramArray[ 0 ] ) ) {
                //The argument value will be placed at the index location in the parsedArgumentArray that matches the
                //corresponding method argument position.
                parsedArgumentsArray[ methodArgumentsObject[ paramArray[ 0 ] ] ] = paramArray[ 1 ];
            }
        }

        //Now loop through the methodArgumentsObject, and make sure any array position represented in the object that didn't
        //get populated in the parsedArgumentsArray gets a null value:
        for( var arg in methodArgumentsObject ) {
            if( parsedArgumentsArray[ methodArgumentsObject[ arg ] ] == undefined ) {
                parsedArgumentsArray[ methodArgumentsObject[ arg ] ] = null;
            }
        }

        return parsedArgumentsArray;
    },

    generateArgumentsArray: function( argumentString, cmdFunction ) {
        var namedArguments = false,
            initialArgumentsArray = [],
            spaceReplacementRegExp = new RegExp( this.spaceReplacement, 'g' ),
            argumentsArray = [];

        argumentString = argumentString.trim();
        argumentString = this.transformQuotedValues( argumentString );

        //If the argument string is enclosed in [] or {}, it indicates named parameters being used
        if( argumentString.match(/^\[.*\]$/) || argumentString.match(/^\{.*\}$/) ) {
            namedArguments = true;
            //Remove the brackets
            argumentString = argumentString.slice(0, -1).slice(1, argumentString.length-1);
        }

        //Now the arguments can be split into an array based on the remaining spaces
        initialArgumentsArray = argumentString.trim().split(' ');

        if( namedArguments ) {
            initialArgumentsArray = this.parseNamedArguments( initialArgumentsArray, cmdFunction );
        }

        //Loop through the arguments, restoring any spaces and transforming any 'null' values to true null
        initialArgumentsArray.forEach( function( value ) {
            //Process any null argument values, whether a string or an actual null
            if( value == 'null' || value == null ) {
                argumentsArray.push( null );
            } else if ( value != null ) {
                //Make sure all spaces are restored
                argumentsArray.push( value.replace( spaceReplacementRegExp, ' ' ) );
            }
        });

        return argumentsArray;
    },

    renderSignature: function( cmdName, cmdFunction ) {
        var argumentArray = introspect( cmdFunction )
        if( argumentArray.length > 0 ) {
            return cmdName + '( ' + introspect( cmdFunction ).join(', ') + ' )';
        } else {
            return cmdName + '()';
        }
    },

    createTerminalExecutionPrefix: function( path, title ) {
        switch( os.platform() ) {
            case "win32":
                var driveLetter = path.match(/\S{1}\:/);
                if( driveLetter != undefined ) {
                    var cdPath = path.replace(/\S{1}\:/, '');
                    return 'start "' + title + '" cmd /k "' + driveLetter + ' & cd ' + cdPath;
                } else {
                    return 'start "' + title + '" cmd /k "cd ' + path;
                }
                break;
            default:
                output.throwError( 'Currently only executes on Windows operating systems.' );
                break;
        }
    },

    setCmdObject: function ( cmd ) {
        cmdObject = cmd;
    },

    getCmdObject: function() {
        return cmdObject;
    },

    setReadlineInterface: function( rl ) {
        readlineInterface = rl;
    },

    getReadlineInterface: function() {
        return readlineInterface;
    }


};

//Load needed core files
var output = require( './output' );
