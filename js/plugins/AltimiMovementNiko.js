
( function() {

    CollisionMesh.makeCollisionMesh = function( gameMap, passFunc ) {
      // Make collision mask
      var collisionGrid = [];
      if ( !passFunc ) {
        passFunc = function( x, y, d ) { return true; };
      }
      for ( var xx = 0; xx < gameMap.width(); xx++ ) {
        collisionGrid[xx] = [];
        for ( var yy = 0; yy < gameMap.height(); yy++ ) {
          collisionGrid[xx][yy] = 0;
          if ( !passFunc.call( gameMap, xx, yy, Direction.UP ) ) {
            collisionGrid[xx][yy] |= ( 0x1 << 0 );
          }
          if ( !passFunc.call( gameMap, xx, yy, Direction.LEFT ) ) {
            collisionGrid[xx][yy] |= ( 0x1 << 1 );
          }
          if ( !passFunc.call( gameMap, xx, yy, Direction.DOWN ) ) {
            collisionGrid[xx][yy] |= ( 0x1 << 2 );
          }
          if ( !passFunc.call( gameMap, xx, yy, Direction.RIGHT ) ) {
            collisionGrid[xx][yy] |= ( 0x1 << 3 );
          }
        }
      }

      var colliders = [];
      var d = 2;

      // Non-looping sides
      if ( !gameMap.isLoopHorizontal() ) {
        var q = gameMap.isLoopVertical() ? 0 : d;
        colliders.push( Collider.createPolygon(
          [ [ 0, 0 ], [ 0, gameMap.height() ], [ -d, gameMap.height() + q ] , [ -d, -q ]  ]
        ) );
        colliders.push( Collider.createPolygon(
          [ [ gameMap.width(), gameMap.height() ], [ gameMap.width(), 0 ], [ gameMap.width() + d, -q ], [ gameMap.width() + d, gameMap.height() + q ] ]
        ) );
      }
      if ( !gameMap.isLoopVertical() ) {
        var q = gameMap.isLoopHorizontal() ? 0 : d;
        colliders.push( Collider.createPolygon(
          [ [ gameMap.width(), 0 ], [ 0, 0 ], [ -q, -d ], [ gameMap.width() + q, -d ] ]
        ) );
        colliders.push( Collider.createPolygon(
          [ [ 0, gameMap.height() ], [ gameMap.width(), gameMap.height() ], [ gameMap.width() + q, gameMap.height() + d ], [ -q, gameMap.height() + d ] ]
        ) );
      }

      // Build tiles (Fixes some cases for humpy corner collision)
      for ( var yy = 0; yy < gameMap.height(); yy++ ) {
        var top = gameMap.roundY( yy - 1 );
        var bottom = gameMap.roundY( yy + 1 );
        for ( var xx = 0; xx < gameMap.width(); xx++ ) {
          if ( collisionGrid[xx][yy] !== 0xf ) {
            continue;
          }
          
            collisionGrid[xx][yy] = 0;
            colliders.push( Collider.createCircle(xx+0.5,yy+0.5,0.5) );
        }
      }


      // TileD colliders
      if ( gameMap.tiledData ) {
        var tileWidth = gameMap.tileWidth();
        var tileHeight = gameMap.tileHeight();
        var scale = ( gameMap.isHalfTile && gameMap.isHalfTile() ) ? 2 : 1;
        var tilesetColliders = [];

        // Build tile colliders
        var tilesets = gameMap.tiledData.tilesets;
        for ( var ii = 0; ii < tilesets.length; ii++ ) {
          tilesetColliders[ii] = {};

          var tiles = tilesets[ii].tiles;
          for ( var key in tiles ) {
            if ( tiles[key].objectgroup ) {
              tilesetColliders[ii][key] = tiles[key].objectgroup.objects;
            }
          }
        }

        // Place tile colliders
        for ( var ii = 0; ii < gameMap.tiledData.layers.length; ii++ ) {
          var layer = gameMap.tiledData.layers[ii];
          for ( var yy = 0; yy < layer.height; yy++ ) {
            var row = yy * layer.width;
            for ( var xx = 0; xx < layer.width; xx++ ) {
              var tileId = layer.data[row + xx];
              if ( tileId === 0 ) {
                continue;
              }
              tileId++;

              // Find tileset belonging to tileId
              var tilesetId = -1;
              var firstId = 0;
              for ( var jj = 0; jj < gameMap.tiledData.tilesets.length; jj++ ) {
                firstId = gameMap.tiledData.tilesets[jj].firstgid;
                var lastId = firstId + gameMap.tiledData.tilesets[jj].tilecount;
                if ( tileId >= firstId && tileId <= lastId ) {
                  tilesetId = jj;
                  break;
                }
              }
              if ( tilesetId < 0 ) {
                continue;
              }

              // Get objectGroup for this tileId
              var tileSet = tilesetColliders[tilesetId];
              var objectGroup = tileSet['' + ( tileId - firstId - 1 )];
              if ( objectGroup ) {
                for ( var jj = 0; jj < objectGroup.length; jj++ ) {
                  var object = objectGroup[jj];
                  var x = xx * scale;
                  var y = yy * scale;
                  CollisionMesh.addTileDCollisionObject( x, y, object, scale, tileWidth, tileHeight, colliders );
                }
              }
            }
          }
        }

        // Find collision mesh layers
        for ( var ii = 0; ii < gameMap.tiledData.layers.length; ii++ ) {
          var layer = gameMap.tiledData.layers[ii];
          if ( layer.type == "objectgroup" && layer.properties && layer.properties.collision == "mesh" ) {
            for ( var jj = 0; jj < layer.objects.length; jj++ ) {
              CollisionMesh.addTileDCollisionObject( 0, 0, layer.objects[jj], scale, tileWidth, tileHeight, colliders );
            }
          }
        }
      }

      // We sort the horizontal and vertical lines separately as we check
      // map collision in two stages: horizontal then vertical
      var collisionMesh = Collider.createList();
      if ( colliders.length > 0 ) {
        Collider.addToList( collisionMesh, Collider.treeFromArray( colliders ) );
      }
      return collisionMesh;
    };


} )();
