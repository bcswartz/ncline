/*
This library is written with the expectation that all watch objects implement a close() method equivalent to the
close() method in fs.FSWatcher (the standard Node watcher object).
*/
var watchers = [];

module.exports = {
    
    getWatchers: function() {
        return watchers;
    },
    
    registerWatcher: function( watcher ) {
        watchers.push( watcher );
    },
    
    closeAllWatchers: function() {
        watchers.forEach( function( watcher ) {
            watcher.close();
        });
    }
}