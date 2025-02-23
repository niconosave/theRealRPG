/*:
 *
 * @plugindesc centers the text in the dialog boxes
 * @author niconosave
 *
 * @param adjustableWindow
 * @type boolean
 * @default true
 * @desc Enable or disable the adjustable message window width.
 *
 * @param margin
 * @type number
 * @default 40
 * @min 0
 * @desc Margin to apply around the text in the message window.
 
 * @help This plugin does not provide plugin commands.
 *
 *
*/

(function() {


	const parameters = PluginManager.parameters('TextExpanded');
	const adjustableWindow = parameters['adjustableWindow'] === 'true'; // Boolean flag for adjustable window
    	const margin = Number(parameters['margin']); // Margin around the text
	
	Window_Message.prototype.processNormalCharacter = function(textState) {
	    if (textState.index === 0 || textState.x === 0) {
		// If this is the start of a new line, calculate the line width
		const currentLineWidth = this.calculateLineWidth(textState);
		const lineWidth = this.contentsWidth();
		const offsetX = (lineWidth - currentLineWidth) / 2;
		textState.x = offsetX > 0 ? offsetX : textState.x; // Apply offset if it fits
	    }
	    // Draw the character normally
	    Window_Base.prototype.processNormalCharacter.call(this, textState);
	};

	// Helper function to calculate the width of the line
	Window_Message.prototype.calculateLineWidth = function(textState) {
	    const startingIndex = textState.index;
	    let lineWidth = 0;

	    // Iterate through the remaining text until a new line or the end of text
	    while (textState.index < textState.text.length) {
		const char = textState.text[textState.index];
		if (char === '\n') break; // Stop at a new line
		lineWidth += this.textWidth(char);
		textState.index++;
	    }

	    // Reset the index to its original position
	    textState.index = startingIndex;
	    return lineWidth;
	};
	
	// Override the startMessage function
	var originalStartMessage = Window_Message.prototype.startMessage;
    Window_Message.prototype.startMessage = function() {
    console.log("back "+this._background);
        if (adjustableWindow && this._background !== 1) { // Exclude dim background windows
            this.calculateWindowWidth();
        }else {
        	this.width = SceneManager._screenWidth;
        }
        originalStartMessage.call(this);
    };

	// Calculate the new width of the window based on the text
	Window_Message.prototype.calculateWindowWidth = function() {
	    if(this._background === 1) {
	    	this.width = SceneManager._screenWidth;
	    	return;
	    }
	    const text = $gameMessage.allText();
	    const lines = text.split('\n');

	    // Find the longest line width
	    const longestLineWidth = lines.reduce((maxWidth, line) => {
		const lineWidth = this.textWidth(line);
		return Math.max(maxWidth, lineWidth);
	    }, 0);

	    const newWidth = Math.min(Graphics.boxWidth, longestLineWidth + margin * 2); // Avoid exceeding screen width

	    // Adjust the window width and position
	    this.width = newWidth;
	    this.x = (Graphics.boxWidth - this.width) / 2; // Center horizontally
	    
	};
	
})();

