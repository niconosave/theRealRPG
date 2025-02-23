/*:
 *
 * @plugindesc changes the center for the playar character
 * @author Nick
 *
 * @help This plugin does not provide plugin commands.
 *
 * @param xOffset
 * @desc how many tiles to the right
 * @default 0
 * @param yOffset
 * @desc how many tiles to the bottom
 * @default 3
 * @param velocity
 * @desc how fast it transitions
 * @default 6
 *
*/

(function() {

	
	const parameters = PluginManager.parameters('CustomCamera');
	let xOffset = Number(parameters['xOffset'], 0);// Horizontal offset (positive moves right, negative moves left)
	let yOffset = Number(parameters['yOffset'], 3);// Vertical offset (positive moves down, negative moves up)
	const velocity = Number(parameters['velocity'], 6);
	
	const xOriginal = xOffset;
	const yOriginal = yOffset;
	
	let xNewOffset = xOffset;
	let yNewOffset = yOffset;
	
    // Override the center method
    Game_Player.prototype.center = function(x, y) {

        // Calculate new screen position
        const adjustedX = x - xOffset;
        const adjustedY = y - yOffset;

        // Center the map on the adjusted coordinates
        $gameMap.setDisplayPos(adjustedX - (Graphics.width / $gameMap.tileWidth()) / 2,
                               adjustedY - (Graphics.height / $gameMap.tileHeight()) / 2);
    };
    
    // Override the updateScroll method to apply custom offsets
    Game_Player.prototype.updateScroll = function(lastScrolledX, lastScrolledY) {
    
    	//move offset
    	xOffset-=(xOffset-xNewOffset)/velocity;
    	yOffset-=(yOffset-yNewOffset)/velocity;
        
        // Scroll horizontally if the player moved
        if (this.scrolledX() !== lastScrolledX) {
            $gameMap.scrollLeft(this.scrolledX() - lastScrolledX);
        }

        // Scroll vertically if the player moved
        if (this.scrolledY() !== lastScrolledY) {
            $gameMap.scrollDown(this.scrolledY() - lastScrolledY);
        }

        // Adjust the camera position to maintain the offset
        const adjustedX = this._realX - xOffset;
        const adjustedY = this._realY - yOffset;

        $gameMap.setDisplayPos(
            adjustedX - (Graphics.width / $gameMap.tileWidth()) / 2,
            adjustedY - (Graphics.height / $gameMap.tileHeight()) / 2
        );
    };
    
    Game_System.prototype.setCameraOffset = function(x, y) {
	    xNewOffset = x;
	    yNewOffset = y;
	};
	
	Game_System.prototype.resetCameraOffset = function(x, y) {
	    xNewOffset = xOriginal;
	    yNewOffset = yOriginal;
	};
})();

