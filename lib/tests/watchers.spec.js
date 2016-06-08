var expect = require( 'chai' ).expect;
var rewire = require( 'rewire' );

var watchersLib = rewire( '../watchers' );

describe( 'watchers', function() {

   var closeFunction = function() { this.name = 'closed' };

   beforeEach( function() {
       watchersLib.__set__( 'watchers', [
           { name: 'mockWatcher', close: closeFunction },
           { name: 'mockWatcher2', close: closeFunction }
       ])
   });
    
   describe( 'getWatchers', function() {
       it( 'should return "watchers" array', function() {
           var watcherArray = watchersLib.getWatchers();
           expect( watcherArray ).to.be.instanceof( Array );
           expect( watcherArray.length ).to.equal( 2 );
           expect( watcherArray[ 0 ].name ).to.equal( 'mockWatcher' );
       })
   });

   describe( 'registerWatcher', function() {
       it( 'should add argument to "watchers" array', function() {
           expect( watchersLib.getWatchers().length ).to.equal( 2 );
           watchersLib.registerWatcher( { name: 'mockWatcher3', close: closeFunction } );
           expect( watchersLib.getWatchers().length ).to.equal( 3 );
           expect( watchersLib.getWatchers()[ 2 ].name ).to.equal( 'mockWatcher3' );
       });
   });

   describe( 'closeAllWatchers', function() {
       it( 'should call close() on every watcher in the "watchers" array', function() {
           expect( watchersLib.getWatchers()[ 0 ].name ).to.equal( 'mockWatcher' );
           expect( watchersLib.getWatchers()[ 1 ].name ).to.equal( 'mockWatcher2' );
           watchersLib.closeAllWatchers();
           expect( watchersLib.getWatchers()[ 0 ].name ).to.equal( 'closed' );
           expect( watchersLib.getWatchers()[ 1 ].name ).to.equal( 'closed' );
       });
   });

});