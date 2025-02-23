//=============================================================================
// MainObject.js
//=============================================================================

/*:
 * @plugindesc MainObject for the Real RPG
 * @author Nick
 *
 * @help This plugin does not provide plugin commands.
 * 
 */

var MainObject = MainObject || {};

(function() {

    var parameters = PluginManager.parameters('MainObject');
        
    	MainObject.playerRegion="";
	MainObject.campSiteDirections=[];
	MainObject.campSiteIndex=0;
	MainObject.campSiteMax=10;
	//character face pictures
	MainObject.char_face_size=85;
	MainObject.char_face_start=125;
	MainObject.char_face_distance=100;
	MainObject.char_face_height=160;
	MainObject.char_face_initialIndex=50;
	MainObject.char_face_i=0;
	MainObject.playerInput="";
	MainObject.room="";
	MainObject.char_face_pictureNames=
	["father",
	"mother",
	"daugther1",
	"son1",
	"son2",
	"guts",
	"caska",
	"berzerk",
	"dog1",
	"dog2"];
	//Threads
	MainObject.threads=[];
	MainObject.currentAction;
	MainObject.eventTriggered=false;
	//region
	MainObject.regionActors=[];
	//HUD
	MainObject.hud_transparency=255;
	MainObject.hud_i=0;
	//world map
	MainObject.worldMap=new Object();
	//actors
	MainObject.actors=new Object();
	//tech moon
	MainObject.actors.techMoon=new Object();
	//electric dam
	MainObject.worldMap.electricDam=new Object();
	MainObject.worldMap.electricDam.operator==null;
	//scene characters
	MainObject.scene=new Object();
	MainObject.scene.names;
	MainObject.scene.firstLayer;
	MainObject.scene.flips;
	
	//actorMaps
	MainObject.actorMaps={};
	
	MainObject.setActorMap=function(actor,map){
		MainObject.actorMaps[actor]=map;
		console.log("set actor "+actor+" to "+map);
	}
	
	
	//tokens
	
	MainObject.tokens=[];
	MainObject.actions=[];
	
	MainObject.saveCurrentAction(action,place){
		MainObject.actions=[];
		MainObject.actions.push(action);
		MainObject.actions.push(place);
		//save the party leader
		//save all party members
		var partyMembers = $gameParty.members();
		for (var i = 0; i < partyMembers.length; i++) {
		    MainObject.actions.push(partyMembers[i].name());
		}
		//save characters in the same place
	}
	
	MainObject.hasToken=function(token){
		return Main.tokens.includes(token);
	}
	
	MainObject.addToken=function(token){
		MainObject.tokens.push(token);
		console.log("added token: "+token);
	}
	
	MainObject.removeToken=function(token){
		const index = MainObject.tokens.indexOf(token);
		if (index > -1) MainObject.tokens.splice(index, 1); 
		console.log("removed token: "+token); 
	}
	
	MainObject.queryCurrentAction=function(arrayTokens){
		let combinedArray = MainObject.tokens.concat(MainObject.actions)
		return combinedArray.every(function(item) {
			return arrayTokens.includes(item);
		});
	}
	
	//draws the body pictures of a character in the HUD
	MainObject.drawCharacterPicture=function(name){
	    $gameScreen.showPicture(MainObject.char_face_i,name,1,
	    MainObject.char_face_start+(MainObject.char_face_i-50)*MainObject.char_face_distance,
	    Graphics.height - MainObject.char_face_height+Math.sin(MainObject.char_face_i+new Date().getTime() / 1000 * Math.PI)*10,
	    MainObject.char_face_size,MainObject.char_face_size,255,0);
	}
	
	//draws many characters for a scene and stores them in memory
	MainObject.drawCharactersInScene=function(names,firstLayer,flips){
	    MainObject.scene.names=names;
	    MainObject.scene.firstLayer=firstLayer;
	    MainObject.scene.flips=flips;
	    let length = names.length;
	    for (var i = 0; i < length; i++) {
		$gameScreen.showPicture(firstLayer+i,names[i],1,
	        125+Graphics.width/length*i/1.35,
	        Graphics.height - 250,
	        90*flips[i],90,255,0);
	        
	    }
	}
	
	//makes a character bigger
	MainObject.highlightCharactersInScene=function(characterIndex){
	let length = MainObject.scene.names.length;
		$gameScreen.showPicture(MainObject.scene.firstLayer+characterIndex,MainObject.scene.names[characterIndex],1,
	        125+Graphics.width/length*characterIndex/1.35,
	        Graphics.height - 250,
	        100*MainObject.scene.flips[characterIndex],100,255,0);
	}
	
	//makes a character bigger
	MainObject.normalizeCharactersInScene=function(characterIndex){
	let length = MainObject.scene.names.length;
		$gameScreen.showPicture(MainObject.scene.firstLayer+characterIndex,MainObject.scene.names[characterIndex],1,
	        125+Graphics.width/length*characterIndex/1.35,
	        Graphics.height - 250,
	        90*MainObject.scene.flips[characterIndex],90,255,0);
	}
	
	//makes a character face the other way
	MainObject.flipCharactersInScene=function(characterIndex){
	let length = MainObject.scene.names.length;
		MainObject.scene.flips[characterIndex]*=(-1);
	    $gameScreen.showPicture(MainObject.scene.firstLayer+characterIndex,MainObject.scene.names[characterIndex],1,
	        125+Graphics.width/length*characterIndex/1.35,
	        Graphics.height - 250,
	        90*MainObject.scene.flips[characterIndex],90,255,0);
	}
	
	//deletes character portraits
	MainObject.deleteCharactersInScene=function(){
	    let length = MainObject.scene.firstLayer + MainObject.scene.names.length;
	    for (var i = MainObject.scene.firstLayer; i < length; i++) {
		$gameScreen.erasePicture(i);
	    }
	}
	
	//reset all self switches
	MainObject.resetAllSelfSwitches=function(){
	    const mapId = $gameMap.mapId(); // Get the current map ID
	    $gameMap.events().forEach(event => {
		// Reset all self-switches (A, B, C, D) for each event on the map
		['A', 'B', 'C', 'D'].forEach(switchId => {
		    $gameSelfSwitches.setValue([mapId, event.eventId(), switchId], false);
		});
	    });
	};
	
	//calculate distance
	MainObject.distance=function(fx,fy,px,py){
	    let dx = fx - px;
	    let dy = fy - py;
	    // Return the straight-line distance (Pythagoras)
	    return Math.sqrt(dx * dx + dy * dy);
	}

	//obsolete method
	const alias_updateSceneMap = Scene_Map.prototype.update;
	
	Scene_Map.prototype.update = function() { alias_updateSceneMap.call(this);
	if ($gameSwitches.value(21)) {
		if (Input.isTriggered("left")) { MainObject.playerInput="left";
			} else if (Input.isTriggered("right")) { MainObject.playerInput="right";
		} else if (Input.isTriggered("up")) { MainObject.playerInput="up";
		} else if (Input.isTriggered("down")) { MainObject.playerInput="down";
		}else MainObject.playerInput="";
	}};
	

	// Function to move an event towards a given tile position by a specific distance
	MainObject.moveEventTowardsTile = function(eventId, targetX, targetY, distance) {
	    // Get the event by its ID
	    const event = $gameMap.event(eventId);

	    if (!event) {
		console.error(`Event with ID ${eventId} not found.`);
		return;
	    }

	    // Get the current position of the event
	    const currentX = event._realX;
	    const currentY = event._realY;

	    // Calculate the direction vector towards the target position
	    const deltaX = targetX - currentX;
	    const deltaY = targetY - currentY;
	    const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

	    // If the event is already at the target position, stop
	    if (length === 0) return;

	    // Ensure the movement distance does not exceed the remaining distance
	    const moveDistance = Math.min(distance, length);

	    // Normalize the direction vector
	    const dirX = deltaX / length;
	    const dirY = deltaY / length;

	    // Calculate the new position based on the adjusted distance
	    const newX = currentX + dirX * moveDistance;
	    const newY = currentY + dirY * moveDistance;

	    // Set the event's new position
	    event.locate(newX, newY);
	    
	    //return distance
	    return MainObject.distance(newX,newY,targetX,targetY);
	}
	
	//saves the data of the events that move on the world map because they'll reset after changing maps
	MainObject.getWorldEventActorData= function(eventId){
		const event = $gameMap.event(eventId);
		return {"_x":event._realX,"_y":event._realY,"_id":eventId};
	}
	
	//loads the data of the events that move on the world map because they'll reset after changing maps
	MainObject.setWorldEventActorData= function(eventActorData){
		const event = $gameMap.event(eventActorData._id);
		event.locate(eventActorData._x, eventActorData._y);
	}
	
	//hope this is handled by the garbage collection
	MainObject.addWorldEventActorToIdRegion= function(eventId){
		const event = $gameMap.event(eventId);
		const region = $gameMap.regionId(Math.floor(event.x), Math.floor(event.y));
		if(MainObject.regionActors[region]===undefined)MainObject.regionActors[region]=[];
		MainObject.regionActors[region].push(eventId);
	}
	
	// Store the original Game_Battler.useSkill function
	var _Game_Battler_useSkill = Game_Battler.prototype.useSkill;

	// Override the useSkill function to track the actor
	Game_Battler.prototype.useSkill = function(skill) {
	    // If this battler is an actor, store their ID
	    if (this.isActor()) {
		MainObject.skillActorId = this.actorId();
	    }
	    // Call the original function
	    _Game_Battler_useSkill.call(this, skill);
	};

	// Intercept skill execution in battle
	var _Game_Actor_useItem = Game_Actor.prototype.useItem;
	Game_Actor.prototype.useItem = function(item) {
	    MainObject.skillActorId = this.actorId();
	    _Game_Actor_useItem.call(this, item);
	};

	// Intercept skill execution outside of battle
	var _Game_Interpreter_command339 = Game_Interpreter.prototype.command339;
	Game_Interpreter.prototype.command339 = function() {
	    // Store actor ID before executing skill
	    var actorId = this._params[0];
	    MainObject.skillActorId = actorId;
	    // Call original function
	    return _Game_Interpreter_command339.call(this);
	};

	// Additional coverage for skill actions via events
	var _Game_Interpreter_command339 = Game_Interpreter.prototype.command339;
	Game_Interpreter.prototype.command339 = function() {
	    MainObject.skillActorId = this._params[0];
	    return _Game_Interpreter_command339.call(this);
	};
	
	//it saves all the metadata of the player so that the event triggers can check for it
	MainObject.saveAction = function(actionName){
		let action={};
		action.name=actionName;
		action.regionId=$gameMap.regionId(Math.floor($gamePlayer.x), Math.floor($gamePlayer.y));
		action.leaderId=$gameParty.leader()._actorId;
		action.actorId=MainObject.skillActorId;
		action.triggerSymbols=[];
		switch(actionName){
			case "scouting":
			break;
			case "updateWorldTurn":
				action.day=$gameVariables.value(10);
				action.map=$gameMap.mapId();
				if($gameSwitches.value(84))action.triggerSymbols.push("host_moonCaptured");
			break;
			default:
				return;
			break;
		}
		MainObject.currentAction=action;
	};
	
	// Calculate for action Triggers
	MainObject.runActionEventTrigger = function(action){
		MainObject.currentAction=action;
		MainObject.eventTriggered=false;
		const length=MainObject.threads.length;
		//go through all Threads and call for the common event of each one
		for (var i = 0; i < length; i++) {
		 	$gameTemp.reserveCommonEvent(MainObject.threads[i].eventId);
		}
	};
	
	//adds a thread object from the list
	MainObject.addThread = function(threadName){
		MainObject.threads.push(threadName);
	};
	

})();
