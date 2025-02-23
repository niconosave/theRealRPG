//=============================================================================
// QMFollowers
//=============================================================================

var Imported = Imported || {};

if (!Imported.QMovement || !QPlus.versionCheck(Imported.QMovement, '1.2.2')) {
  alert('Error: QM+Followers requires QMovement 1.2.2 or newer to work.');
  throw new Error('Error: QM+Followers requires QMovement 1.2.2 or newer to work.');
}

Imported.QMFollowers = '1.0.2';

//=============================================================================
/*:
 * @plugindesc <QMFollowers>
 * QMovement Addon: Adds follower support
 * @version 1.0.2
 * @author Quxios  | Version 1.0.2
 * @site https://quxios.github.io/
 * @updateurl https://quxios.github.io/data/pluginsMin.json
 *
 * @requires QMovement
 *
 * @help
 * ============================================================================
 * ## About
 * ============================================================================
 * This adds support for followers when using QMovement.
 *
 * *Note:* I won't be continuing working on this plugin. I personally dislike
 * followers and rather not do anything with them. So if you have issues with this
 * plugin you will need to try to fix it your self or find another plugin dev
 * to fix it for you. Sorry!
 * ============================================================================
 * ## Links
 * ============================================================================
 * Formated Help:
 *
 *  https://quxios.github.io/#/plugins/QM+Followers
 *
 * RPGMakerWebs:
 *
 *  http://forums.rpgmakerweb.com/index.php?threads/qplugins.73023/
 *
 * Terms of use:
 *
 *  https://github.com/quxios/QMV-Master-Demo/blob/master/readme.md
 *
 * Like my plugins? Support me on Patreon!
 *
 *  https://www.patreon.com/quxios
 *
 * @tags QM-Addon, followers
 */
//=============================================================================


//=============================================================================
// QMFollowers

(function() {

  //-----------------------------------------------------------------------------
  // Game_Player

  var Alias_Game_Player_onPositionChange = Game_Player.prototype.onPositionChange;
  Game_Player.prototype.onPositionChange = function() {
    Alias_Game_Player_onPositionChange.call(this);
    var dir = this.radianToDirection(this._radian, QMovement.diagonal);
    //this._followers.addMove(this._px, this._py, this.realMoveSpeed(), dir);
  };

  //-----------------------------------------------------------------------------
  // Game_Follower

  var Alias_Game_Follower_initialize = Game_Follower.prototype.initialize;
  Game_Follower.prototype.initialize = function(memberIndex) {
    Alias_Game_Follower_initialize.call(this, memberIndex);
    this._moveList = [];
  };

  Game_Follower.prototype.addMove = function(x, y, speed, dir) {
    this._moveList.push([x, y, speed, dir]);
  };

  Game_Follower.prototype.clearList = function() {
    this._moveList = [];
  };

  Game_Follower.prototype.update = function() {
    Game_Character.prototype.update.call(this);
    this.setOpacity($gamePlayer.opacity());
    this.setBlendMode($gamePlayer.blendMode());
    this.setWalkAnime($gamePlayer.hasWalkAnime());
    this.setStepAnime($gamePlayer.hasStepAnime());
    this.setDirectionFix($gamePlayer.isDirectionFixed());
    this.setTransparent($gamePlayer.isTransparent());
  };

  Game_Follower.prototype.updateMoveList = function(preceding, gathering) {
    if (this._moveList.length === 0 || this.startedMoving()) return;
    if (this._moveList.length <= this._memberIndex) return;
    var move = this._moveList.shift();
    if (!gathering) {
      var collided = this.collideWithPreceding(preceding, move[0], move[1], move[3]);
      if (collided) {
        this._moveList.unshift(move);
        return;
      }
    }
    this.setMoveSpeed(move[2]);
    this.setDirection(move[3]);
    this._realPX = this._px;
    this._realPY = this._py;
    this._px = move[0];
    this._py = move[1];
    this._moveCount++;
  };
  

Game_Followers.prototype.normalizePositions = function(old_px, old_py, new_px, new_py) {
    this.forEach(function(follower) {
        follower._px += old_px - new_px;
        follower._py += old_py - new_py;
    });
};

Game_Follower.prototype.updateFollow = function(preceding) {
    if (!preceding) return;

    const mapWidth = $gameMap.width() * $gameMap.tileWidth();
    const mapHeight = $gameMap.height() * $gameMap.tileHeight();

	if ($gamePlayer.followers()._gathering) {
        // Gathering logic: move followers directly to the player
        const playerX = $gamePlayer._px;
        const playerY = $gamePlayer._py;
        const dx = playerX - this._px;
        const dy = playerY - this._py;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 1) {
            const moveSpeed = $gamePlayer.realMoveSpeed();
            const vx = (dx / distance) * moveSpeed;
            const vy = (dy / distance) * moveSpeed;

            this._px += vx;
            this._py += vy;

            const radian = Math.atan2(-vy, vx);
            const direction = this.radianToDirection(radian, QMovement.diagonal);
            this.setDirection(direction);
        } else {
            // Snap to the player's position when close enough
            this._px = playerX;
            this._py = playerY;
        }
        return;
    }
    // Handle looping for the first follower (relative to the player)
    if (this._memberIndex === 1) {
        const old_px = this._px;
        const old_py = this._py;
        this._px = $gameMap.roundPXWithDirection(this._px, 0);
        this._py = $gameMap.roundPYWithDirection(this._py, 0);
        
        let followers = $gamePlayer.followers()._data;
	followers.forEach(follower => {
	    follower._px += old_px - this._px;
	    follower._py += old_py - this._py;
	});
    }

    // Calculate the vector to the preceding character
    let dx = preceding._px - this._px;
    let dy = preceding._py - this._py;

    // Adjust for horizontal looping
    if ($gameMap.isLoopHorizontal()) {
        if (preceding._px > this._px && dx > mapWidth / 2) {
            dx -= mapWidth; // Wrap around left
        } else if (preceding._px < this._px && dx < -mapWidth / 2) {
            dx += mapWidth; // Wrap around right
        }
    }

    // Adjust for vertical looping
    if ($gameMap.isLoopVertical()) {
        if (preceding._py > this._py && dy > mapHeight / 2) {
            dy -= mapHeight; // Wrap around top
        } else if (preceding._py < this._py && dy < -mapHeight / 2) {
            dy += mapHeight; // Wrap around bottom
        }
    }

    const distance = Math.sqrt(dx * dx + dy * dy);

    // Adjust stopping distance and slowdown behavior
    const desiredDistance = 24; // Ideal distance to maintain from the preceding character
    const maxDistance = 48; // Max distance for full speed
    const minSpeed = 1.0; // Minimum speed (slower as they approach the desired distance)
    const maxSpeed = this.realMoveSpeed(); // Maximum speed
    const slowFactor = Math.max((distance - desiredDistance) / (maxDistance - desiredDistance), 0); // Slow down earlier
    const adjustedSpeed = minSpeed + (maxSpeed - minSpeed) * slowFactor;

    // Move if the distance is greater than a small threshold
    const moveThreshold = 8; // Minimum distance before moving
    if (distance > desiredDistance) {
        // Normalize the vector and apply the adjusted speed
        const vx = (dx / distance) * adjustedSpeed;
        const vy = (dy / distance) * adjustedSpeed;

        this._px += vx;
        this._py += vy;

        // Update direction based on movement
        const radian = Math.atan2(-vy, vx);
        const direction = this.radianToDirection(radian, QMovement.diagonal);
        this.setDirection(direction);
    }
};


  Game_Follower.prototype.collideWithPreceding = function(preceding, x, y, dir) {
    if (!this.isVisible()) return false;
    this.collider('collision').moveTo(x, y);
    if (this.collider('collision').intersects(preceding.collider('collision'))) {
      if (this._direction === preceding._direction) {
        this.collider('collision').moveTo(this._px, this._py);
        return true;
      }
    }
    this.collider('collision').moveTo(this._px, this._py);
    return false;
  };

  Game_Follower.prototype.defaultColliderConfig = function() {
    return QMovement.playerCollider;
  };

  //-----------------------------------------------------------------------------
  // Game_Followers

  Game_Followers.prototype.update = function() {
    for (var i = 0; i < this._data.length; i++) {
      var precedingCharacter = (i > 0 ? this._data[i - 1] : $gamePlayer);
      this._data[i].update();
      //this._data[i].updateMoveList(precedingCharacter, this._gathering);
      this._data[i].updateFollow(precedingCharacter);
    }
  };

  Game_Followers.prototype.addMove = function(x, y, speed, dir) {
    for (var i = 0; i < this._data.length; i++) {
      this._data[i].addMove(x, y, speed, dir);
    }
  };

  Game_Followers.prototype.synchronize = function(x, y, dir) {
    var chara = $gamePlayer;
    this.forEach(function(follower) {
      follower.copyPosition(chara);
      follower.straighten();
      follower.setDirection(chara.direction());
      follower.clearList();
    }, this);
  };

  Game_Followers.prototype.areGathering = function() {
    if (this.areGathered() && this._gathering) {
      this._gathering = false;
      return true;
    }
    return false;
  };

  Game_Followers.prototype.areGathered = function() {
    return this.visibleFollowers().every(function(follower) {
      return follower.cx() === $gamePlayer.cx() && follower.cy() === $gamePlayer.cy();
    }, this);
  };
  
  Game_Followers.prototype.areGathered = function() {
	    return this.visibleFollowers().every(function(follower) {
		const dx = follower._px - $gamePlayer._px;
		const dy = follower._py - $gamePlayer._py;
		const distance = Math.sqrt(dx * dx + dy * dy);
	      return distance <= 6;
	    }, this);
	};
})()
