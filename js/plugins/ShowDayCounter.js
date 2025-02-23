/*:
 * @plugindesc Displays the current date in the pause menu.
 * @author DuckDuckGo AI
 *
 * @param Day Variable ID
 * @desc The ID of the variable that holds the day count.
 * @default 1
 *
 * @help
 * This plugin will add a new element to the pause menu that displays the current date.
 * The date will be tracked using the Gregorian calendar system.
 */

(function() {

var parameters = PluginManager.parameters('ShowDayCounter');
var dayVariableId = Number(parameters['Day Variable ID'] || 1);
var _daysPassed = 0;

    // Gregorian calendar constants
    var DAYS_PER_WEEK = 7;
    var MONTHS_PER_YEAR = 12;
    var DAYS_PER_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var MONTH_NAME = ["January", "February", "March", "April", "May", "June", "July", "Agust", "September", "October", "November", "December"];

    // Game date variables
    var _gameDate = {
        year: 3756,
        month: 6,
        day: 12,
        dayOfWeek: 1 // 1 = Monday, 7 = Sunday
    };

    var _Scene_Menu_prototype_create = Scene_Menu.prototype.create;

    Scene_Menu.prototype.create = function() {
        _Scene_Menu_prototype_create.call(this);
        this.createDateWindow();
    };

    Scene_Menu.prototype.createDateWindow = function() {
        this._dateWindow = new Window_Base(0, 0, 640, this._goldWindow.height);
        this._dateWindow.x = Graphics.boxWidth - this._dateWindow.width;
        this._dateWindow.y = 0;//Graphics.boxHeight-this._goldWindow.height*2;
        this.addWindow(this._dateWindow);
    };
    
    var _Scene_Menu_prototype_update = Scene_Menu.prototype.update;
    
    Scene_Menu.prototype.update = function() {
        _Scene_Menu_prototype_update.call(this);
        this.updateDateWindow();
    };


    Scene_Menu.prototype.updateDateWindow = function() {
        this._dateWindow.contents.clear();
        this._dateWindow.drawText(
            _gameDate.day+"th of " + MONTH_NAME[_gameDate.month] + ' in the ' + _gameDate.year + "th year of the Star",
            0, 0, this._dateWindow.width, 'left'
        );
    };

    var _Game_Interpreter_prototype_pluginCommand =
        Game_Interpreter.prototype.pluginCommand;

    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_prototype_pluginCommand.call(this, command, args);
        if (command === 'UpdateDate') {
            this.updateDate();
        }
    };
    
    Game_Interpreter.prototype.updateDate = function(days) {
	    var daysDiff = days - _daysPassed;
	    if (daysDiff > 0) {
		for (var i = 0; i < daysDiff; i++) {
		    this.advanceOneDay();
		}
	    } else {
		for (var i = daysDiff; i < 0; i++) {
		    this.rewindOneDay();
		}
	    }
	    _daysPassed = days;
	    $gameMap.requestRefresh();
	};
    
    Game_Interpreter.prototype.advanceOneDay = function() {
	    _gameDate.day++;
	    if (_gameDate.day > DAYS_PER_MONTH[_gameDate.month - 1]) {
		_gameDate.day = 1;
		_gameDate.month++;
		if (_gameDate.month > MONTHS_PER_YEAR) {
		    _gameDate.month = 1;
		    _gameDate.year++;
		}
	    }
	    _gameDate.dayOfWeek = (_gameDate.dayOfWeek % DAYS_PER_WEEK) + 1;
	};

	Game_Interpreter.prototype.rewindOneDay = function() {
	    _gameDate.day--;
	    if (_gameDate.day === 0) {
		_gameDate.month--;
		if (_gameDate.month === 0) {
		    _gameDate.month = MONTHS_PER_YEAR;
		    _gameDate.year--;
		}
		_gameDate.day = DAYS_PER_MONTH[_gameDate.month - 1];
	    }
	    _gameDate.dayOfWeek = (_gameDate.dayOfWeek % DAYS_PER_WEEK) + 1;
	};

})();

