//Load needed core Node modules
var fs = require( 'fs' );
var os = require( 'os' );
var childProcess = require( 'child_process' );

//Load needed library files
var output = require( '../../../lib/output' );
var core = require( '../../../lib/core' );

//Load init module used to create/load existing configuration and usage data
var init = require( './init' );

init.execute();

var data = init.getData();
var dataFile = init.getConfig().dataFile;

var findSetMemberIndex = function( aliasSet, identifier ) {
    var indexLocation = -1;
    if( aliasSet[ parseInt( identifier ) ] != undefined ) {
        return parseInt( identifier );
    } else {
        for( var a = 0; a < aliasSet.length; a++ ) {
           if( aliasSet[ a ].url == identifier ) {
               indexLocation = a;
           }
        }
        return indexLocation;
    }
};

module.exports = {

    commands: {

        setWebAliasVerbose: function ( setting ) {
            if ( setting == null || !core.isBoolean( setting ) ) {
                output.throwError( "You must provide a string representing a Boolean value (true/false, yes/no, or y/n)" );
            }

            data.verbose = core.booleanValue( setting );

            fs.writeFile( dataFile, JSON.stringify( data, null, 2 ), function ( err ) {
                output.passError( err );
            } );
        },

        setDefaultBrowser: function ( browser ) {
            if ( browser == null ) {
                output.throwError( "You must provide the name of a browser or 'default'." );
            }

            if ( browser == 'default' ) {
                data.defaultBrowser = '';
            } else {
                data.defaultBrowser = browser;
            }

            fs.writeFile( dataFile, JSON.stringify( data, null, 2 ), function ( err ) {
                output.passError( err );
            } );
        },

        getDefaultBrowser: function () {
            var defaultBrowser = data.defaultBrowser == '' ? 'System default browser' : data.defaultBrowser;
            output.msg( "The current default browser for opening web pages with a command is: " + defaultBrowser );
        },

        createWebAlias: function ( alias, url, browser ) {
            if ( alias == null || url == null ) {
                output.throwError( "The web alias name and url parameters must be defined." );
            } else if ( data.aliases.hasOwnProperty( alias ) ) {
                if ( data.aliases[ alias ] instanceof Array ) {
                    output.throwError( "Alias '" + alias + "' already exists as an alias set; use updateWebAliasSet or deleteWebAliasSet to change." );
                } else {
                    output.throwError( "Alias '" + alias + "' already exists; use updateWebAlias or deleteWebAlias to change." );
                }
            }

            data.aliases[ alias ] = { url: url, browser: browser || 'default' };

            fs.writeFile( dataFile, JSON.stringify( data, null, 2 ), function ( err ) {
                output.passError( err );
                if ( !err && core.booleanValue( data.verbose ) ) {
                    output.success( "Web alias '" + alias + "' set to '" + url + "' (" + data.aliases[ alias ].browser + ")." );
                }
            } );
        },

        updateWebAlias: function ( alias, url, browser ) {
            if ( alias == null || url == null ) {
                output.throwError( "The web alias name and url parameters must be defined." );
            } else if ( !data.aliases.hasOwnProperty( alias ) ) {
                output.throwError( "Alias '" + alias + "' not found; use createWebAlias to create." );
            } else if ( data.aliases[ alias ] instanceof Array ) {
                output.throwError( "Alias '" + alias + "' belongs to an web alias set; use updateWebAliasSet to modify." );
            }

            data.aliases[ alias ].url = url;
            if ( browser ) {
                data.aliases[ alias ].browser = browser
            }
            ;

            fs.writeFile( dataFile, JSON.stringify( data, null, 2 ), function ( err ) {
                output.passError( err );
                if ( !err && core.booleanValue( data.verbose ) ) {
                    output.success( "Web alias '" + alias + "' updated to '" + url + "' (" + data.aliases[ alias ].browser + ")." );
                }
            } );
        },

        deleteWebAlias: function ( alias ) {
            if ( alias == null ) {
                output.throwError( "The web alias parameter must be defined." );
            } else if ( !data.aliases.hasOwnProperty( alias ) ) {
                output.throwError( "Alias '" + alias + "' not found." );
            } else if ( data.aliases[ alias ] instanceof Array ) {
                output.throwError( "Alias '" + alias + "' belongs to an web alias set; use deleteWebAliasSet to delete." );
            }

            delete data.aliases[ alias ];

            fs.writeFile( dataFile, JSON.stringify( data, null, 2 ), function ( err ) {
                output.passError( err );
                if ( !err && core.booleanValue( data.verbose ) ) {
                    output.success( "Web alias '" + alias + "' deleted." );
                }
            } );
        },

        updateWebAliasBrowser: function ( alias, browser ) {
            if ( alias == null || browser == null ) {
                output.throwError( "The web alias name and browser parameters must be defined." );
            } else if ( !data.aliases.hasOwnProperty( alias ) ) {
                output.throwError( "Alias '" + alias + "' not found; use createWebAlias to create." );
            } else if ( data.aliases[ alias ] instanceof Array ) {
                output.throwError( "Alias '" + alias + "' belongs to an web alias set; use updateWebAliasSet to modify the browser used with a URL in the set." );
            }

            data.aliases[ alias ].browser = browser;

            fs.writeFile( dataFile, JSON.stringify( data, null, 2 ), function ( err ) {
                output.passError( err );
                if ( !err && core.booleanValue( data.verbose ) ) {
                    output.success( "Browser for web alias '" + alias + "' updated to '" + browser + "'." );
                }
            } );
        },


        createWebAliasSet: function ( alias, url, browser ) {
            if ( alias == null || url == null ) {
                output.throwError( "The web alias name and url parameters must be defined." );
            } else if ( data.aliases.hasOwnProperty( alias ) ) {
                if ( data.aliases[ alias ] instanceof Array ) {
                    output.throwError( "Alias '" + alias + "' already exists as an web alias set; use updateWebAliasSet or deleteWebAliasSet to change." );
                } else {
                    output.throwError( "Alias '" + alias + "' already exists; use updateWebAlias or deleteWebAlias to change." );
                }
            }

            data.aliases[ alias ] = [
                { url: url, browser: browser || 'default' }
            ];

            fs.writeFile( dataFile, JSON.stringify( data, null, 2 ), function ( err ) {
                output.passError( err );
                if ( !err && core.booleanValue( data.verbose ) ) {
                    output.success( "Web alias set '" + alias + "' created with first URL set to '" + url + "' (" + data.aliases[ alias ][ 0 ].browser + ")." );
                }
            } );
        },

        updateWebAliasSet: function ( alias, action, urlOrIndex, newUrlOrBrowser ) {
            var pathIndex;

            if ( alias == null || action == null || urlOrIndex == null ) {
                output.throwError( "The alias name, action ('add', 'url', 'browser' or 'delete') and url/alias index parameters must be defined." );
            } else if ( action != 'add' && action != 'url' && action != 'browser' && action != 'delete' ) {
                output.throwError( "The action must be either 'add', 'url', 'browser' or 'delete'." );
            } else if ( ( action == 'url' || action == 'browser' ) && !newUrlOrBrowser ) {
                output.throwError( "When using the '" + action + "' action, you must provide both a url/alias index and the new url or browser to use with that alias." );
            } else if ( !data.aliases.hasOwnProperty( alias ) ) {
                output.throwError( "Alias set '" + alias + "' not found; use createWebAliasSet to create." );
            } else if ( !( data.aliases[ alias ] instanceof Array ) ) {
                output.throwError( "Alias '" + alias + "' does not match a web alias set." );
            }

            switch ( action ) {
                case "add":
                    data.aliases[ alias ].push(
                        { url: urlOrIndex, browser: newUrlOrBrowser || 'default' }
                    );
                    fs.writeFile( dataFile, JSON.stringify( data, null, 2 ), function ( err ) {
                        output.passError( err );
                        if ( !err && core.booleanValue( data.verbose ) ) {
                            output.success( "URL '" + urlOrIndex + "' (" + data.aliases[ alias ][ ( data.aliases[ alias ].length - 1 ) ].browser + ") added to alias set '" + alias + "'." );
                        }
                    } );
                    break;

                case "url":
                    aliasIndex = findSetMemberIndex( data.aliases[ alias ], urlOrIndex );
                    if ( aliasIndex == -1 ) {
                        output.throwError( "URL alias instance '" + urlOrIndex + "' not found in alias set '" + alias + "'." );
                    }
                    data.aliases[ alias ][ aliasIndex ].url = newUrlOrBrowser;
                    fs.writeFile( dataFile, JSON.stringify( data, null, 2 ), function ( err ) {
                        output.passError( err );
                        if ( !err && core.booleanValue( data.verbose ) ) {
                            output.success( "URL alias instance '" + urlOrIndex + "' URL changed to '" + newUrlOrBrowser + "' (" + data.aliases[ alias ][ aliasIndex ].browser + ")." );
                        }
                    } );
                    break;

                case "browser":
                    aliasIndex = findSetMemberIndex( data.aliases[ alias ], urlOrIndex );
                    if ( aliasIndex == -1 ) {
                        output.throwError( "URL alias instance '" + urlOrIndex + "' not found in alias set '" + alias + "'." );
                    }
                    data.aliases[ alias ][ aliasIndex ].browser = newUrlOrBrowser;
                    fs.writeFile( dataFile, JSON.stringify( data, null, 2 ), function ( err ) {
                        output.passError( err );
                        if ( !err && core.booleanValue( data.verbose ) ) {
                            output.success( "URL alias instance '" + urlOrIndex + "' changed to use browser '" + newUrlOrBrowser + "'." );
                        }
                    } );
                    break;

                case "delete":
                    aliasIndex = findSetMemberIndex( data.aliases[ alias ], urlOrIndex );
                    if ( aliasIndex == -1 ) {
                        output.throwError( "URL alias instance '" + urlOrIndex + "' not found in alias set '" + alias + "'." );
                    }
                    data.aliases[ alias ].splice( aliasIndex, 1 );
                    fs.writeFile( dataFile, JSON.stringify( data, null, 2 ), function ( err ) {
                        output.passError( err );
                        if ( !err && core.booleanValue( data.verbose ) ) {
                            output.success( "URL alias instance '" + urlOrIndex + "' removed from alias set '" + alias + "'." );
                        }
                    } );
                    break;
            }
        },

        deleteWebAliasSet: function ( alias ) {
            if ( alias == null ) {
                output.throwError( "The alias parameter must be defined." );
            } else if ( !data.aliases.hasOwnProperty( alias ) ) {
                output.throwError( "Alias '" + alias + "' not found." );
            } else if ( !( data.aliases[ alias ] instanceof Array ) ) {
                output.throwError( "Alias '" + alias + "' does not match a web alias set." );
            }

            delete data.aliases[ alias ];

            fs.writeFile( dataFile, JSON.stringify( data, null, 2 ), function ( err ) {
                output.passError( err );
                if ( !err && core.booleanValue( data.verbose ) ) {
                    output.success( "Web alias set '" + alias + "' deleted." );
                }
            } );
        },

        showWebsites: function () {
            var sortedAliases = core.sortObjectProperties( data.aliases );
            console.log( "Current website loading aliases:".underline.magenta );
            for ( var a in sortedAliases ) {
                if ( sortedAliases[ a ] instanceof Array ) {
                    console.log( ( a + ':' ).cyan );
                    sortedAliases[ a ].forEach( function ( alias ) {
                        console.log( ('   ' + alias.url + ' (' + alias.browser + ')' ).cyan );
                    } )
                    console.log( '' );
                } else {
                    console.log( ( a + ': ' + sortedAliases[ a ].url + ' (' + sortedAliases[ a ].browser + ')' ).cyan );
                }
            }
            output.prompt();
        },

        web: function ( alias ) {
            if ( alias == null ) {
                output.throwError( "The web alias parameter must be defined." );
            } else if ( !data.aliases.hasOwnProperty( alias ) ) {
                output.throwError( "The web alias '" + alias + "' not found." );
            }

            if ( data.aliases[ alias ] instanceof Array ) {
                data.aliases[ alias ].forEach( function ( aliasItem ) {
                    childProcess.exec( module.exports.hooks.getBrowserExecutionString( aliasItem ), function ( err ) {
                        output.passError( err );
                    } );
                });
            } else {
                childProcess.exec( module.exports.hooks.getBrowserExecutionString( data.aliases[ alias ] ), function ( err ) {
                    output.passError( err );
                } );
            }
        }

    },

    hooks: {
        getBrowserExecutionString: function ( webAliasObject ) {
            var executionString, browserToExecute;
            browserToExecute = webAliasObject.browser == 'default' ? data.defaultBrowser : webAliasObject.browser;

            switch ( os.platform() ) {
                case 'win32':
                    executionString = 'start ' + browserToExecute + ' ' + webAliasObject.url;
                    break;
                case 'darwin':
                    executionString = browserToExecute == '' ? 'open ' + webAliasObject.url : 'open -a ' + browserToExecute + ' ' + webAliasObject.url;
                    break;
                default:
                    executionString = 'start ' + browserToExecute + ' ' + webAliasObject.url;
                    break;
            }

            return executionString;
        },

        getWebAlias: function ( alias ) {
            if ( alias == null ) {
                output.throwError( "The web alias parameter must be defined." );
            } else if ( !data.aliases.hasOwnProperty( alias ) ) {
                output.throwError( "Web alias '" + alias + "' not found." );
            }

            return data.aliases[ alias ];
        }
    }

};


