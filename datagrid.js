// HONEY-DO LIST
//
// Rotate
// Draw polygon
// Draw better lines
// Force paths


class DataGrid{
	
	constructor(width,height,defaultValue,wrapX,wrapY){
		this.data = [];
		this.wrapX = (wrapX == true) ? true : false;
		this.wrapY = (wrapY == true) ? true : false;
		defaultValue = (typeof(defaultValue) != "undefined") ? defaultValue : null;

		var usePreviousData = (defaultValue !== null && typeof(defaultValue[0]) != "undefined" && defaultValue[0].constructor.name == "Array");
		var useRandomizer = (defaultValue !== null && !usePreviousData && defaultValue.constructor.name == "Array");

		for (var tempy = 0; tempy <= height - 1; tempy++) {
			var newRow = [];

			for (var tempx = 0; tempx <= width - 1; tempx++) {
				if( usePreviousData ){
					var currentSubY = tempy % defaultValue.length;
					var currentSubX = tempx % defaultValue[currentSubY].length;
					newRow.push(defaultValue[currentSubY][currentSubX])
				} else if (useRandomizer) {
					newRow.push( DataGrid.randomize(defaultValue) );
				} else {
					newRow.push(defaultValue);
				}
			}

			this.data.push(newRow);
		}
	}

	get height(){
		return this.data.length;
	}

	get width(){
		return this.data[0].length;
	}

	toString(){
		return JSON.stringify(this.data);
	}

	clampXBounds(x){
		var maxX = this.width - 1;

		if (( x < 0 || x > maxX ) && this.wrapX){
			x = Math.abs( maxX - Math.abs(x) + 1);
		}

		return x;
	}

	clampYBounds(y){
		var maxY = this.height - 1;

		if (( y < 0 || y > maxY ) && this.wrapY){
			y = Math.abs( maxY - Math.abs(y) + 1);
		}

		return y;
	}

	static fromString(JSONstring){
		var dataArray = JSON.parse(JSONstring);
		if (typeof(dataArray[0]) == "undefined" || typeof(dataArray[0][0]) == "undefined"){
			console.log('string must be JSONified array of arrays');
			return;
		}
		var height = dataArray.length;
		var width = dataArray[0].length;
		return new DataGrid(width,height,dataArray);
	}

	static randomize(array){
		return array[Math.floor(Math.random()*array.length)]
	}

	static findValue(value){
		if (value == null){
			return null;
		} else if (value.constructor.name == "Array"){ 
			var returnValue = DataGrid.randomize(value); 
		} else {
			var returnValue = value;
		}
		return returnValue;
	}

	static isValidData(input){
		return (typeof(input) != "undefined" && input.constructor.name == "Array" && input[0].constructor.name == "Array")
	}

	static distanceBetween(x1,y1,x2,y2){
		var dY = Math.abs(y2 - y1);
		var dX = Math.abs(x2 - x1);
		return Math.sqrt( Math.pow(dY,2) + Math.pow(dX,2) );
	}

	static invertMask(mask){
		if (!DataGrid.isValidData(mask)){
			console.log('invert mask can only be applied to an array of arrays');
			return;
		}

		var tempGrid = new DataGrid( mask[0].length, mask.length, mask);
		function inversionCallback(value){
			return (value == null) ? 1 : null;
		}
		tempGrid.forAll(inversionCallback);
		return tempGrid.data;
	}

	forRect(x1,y1,x2,y2,callback,mask,edgesOnly){
		var maskExists = DataGrid.isValidData(mask);
		if (edgesOnly == true){
			var oldMaskData = maskExists ? mask : 1;
			var newMask = new DataGrid(x2 - x1 + 1, y2 - y1 + 1, oldMaskData);
			newMask.fillRect(1,1,newMask.width - 2, newMask.height - 2, null);
			mask = newMask.data;
			maskExists = true;
		}
		for (var boxY = 0; y1 + boxY <= y2; boxY++) {
			for (var boxX = 0; x1 + boxX <= x2; boxX++) {
				var value = this.get([x1 + boxX],[y1 + boxY])
				var maskIsBlocking = maskExists && ( mask[boxY][boxX] == null || typeof(mask[boxY][boxX]) == "undefined")
				if (!maskIsBlocking){
					this.set( [x1 + boxX],[y1 + boxY], callback(value, boxX, boxY, x1, y1) );
				}
			}
		}
	}

	fillRect(x1,y1,x2,y2,value,mask){
		var fillCallback = function(){
			return DataGrid.findValue(value);
		};
		this.forRect(x1,y1,x2,y2,fillCallback,mask);
	}

	drawRect(x1,y1,x2,y2,value,mask,edgesOnly){
		var fillCallback = function(){
			return DataGrid.findValue(value);
		};
		this.forRect(x1,y1,x2,y2,fillCallback,mask,true);
	}

	cloneFromRect(x1,y1,x2,y2,wrapX,wrapY){
		var rectWidth = x2 - x1 + 1;
		var rectHeight = y2 - y1 + 1
		return new DataGrid(rectWidth, rectHeight, this.get(x1,y1,x2,y2), wrapX, wrapY)
	}

	runRect(x1,y1,x2,y2,callback){
		var newData = new DataGrid(x2 - x1 + 1, y2 - y1 + 1);
		var injectedCallback = function(oldValue, rectX, rectY, x1, y1){
			newData.set(rectX, rectY, callback(oldValue, rectX, rectY, x1, y1) );
			return oldValue;
		}
		this.forRect(x1,y1,x2,y2,injectedCallback);
		this.stamp(x1,y1,newData);
	}

	runLifeRect(x1,y1,x2,y2,onValue,offValue){
		var thisDataGrid = this;
		var lifeCallback = function(oldValue, rectX, rectY, x1, y1){
			var statsObject = thisDataGrid.getNeighborsStats(x1 + rectX, y1 + rectY);
			statsObject[oldValue]--;
			if (oldValue == onValue){
				if (statsObject[onValue] < 2 || statsObject[onValue] > 3){
					return offValue;
				} else {
					return onValue;
				}
			} else if (oldValue == offValue){
				if (statsObject[onValue] == 3){
					return onValue;
				} else {
					return offValue;
				}
			}
		}

		this.runRect(x1,y1,x2,y2, lifeCallback);
	}

	smoothRect(x1,y1,x2,y2,valuesGroup,rulesSet){
		if(valuesGroup.constructor.name != "Array"){
			console.log("acceptable values needs to be an array of values part of smoothing group");
			return;
		}

		if(rulesSet.constructor.name != "Array" || rulesSet[0].constructor.name != "DataGrid" ){
			console.log("rules set needs to be an array of DataGrids");
			return;
		}

		var thisDataGrid = this;
		var matchesRule;

		function checkRule(rule,x,y){
			var areaToCheck = new DataGrid(3,3,thisDataGrid.getNeighbors(x,y));

			rule.forAll(function(ruleCellValue,ruleX,ruleY){
				var cellIsMatchesGroup = ruleCellValue == "group" && valuesGroup.indexOf(areaToCheck.data[ruleY][ruleX]) != -1;
				var cellIsMatchesOutside = ruleCellValue == "outside" && valuesGroup.indexOf(areaToCheck.data[ruleY][ruleX]) == -1;
				var checkingCenterCell = ruleX == 1 && ruleY == 1 && valuesGroup.indexOf(areaToCheck.data[ruleY][ruleX]) != -1;
				var cellMatchesExactly = ruleCellValue == areaToCheck.data[ruleY][ruleX];
				if (ruleCellValue == "ignore" || checkingCenterCell || cellIsMatchesGroup || cellMatchesExactly || cellIsMatchesOutside){
					return ruleCellValue;
				} else {
					matchesRule = false;
					return ruleCellValue;
				};
			});
		}

		function smoothingCallback(originalValue,rectX,rectY,x1,y1){
			for (var i = 0; i < rulesSet.length; i++) {
				matchesRule = true;
				checkRule(rulesSet[i], x1 + rectX, y1 + rectY);
				if (matchesRule != false){
					return rulesSet[i].get(1,1);
					break;
				}
			}
			return originalValue;
		}

		this.runRect(x1,y1,x2,y2,smoothingCallback);
	}

	getMaskRect(x1,y1,x2,y2,values,invert,mask){

		values = values.constructor.name == "Array" ? values : [values];
		invert = (invert == true) ? invert : false;
		var maskGrid = new DataGrid(x2 - x1 + 1, y2 - y1 + 1)

		function maskingCallback(selectValue,rectX,rectY){
			if (values.indexOf(selectValue) != -1){
				var maskValue = (invert) ? null : 1; 
			} else {
				var maskValue = (invert) ? 1 : null;
			}
			maskGrid.set(rectX,rectY,maskValue);
			return selectValue;
		};

		this.forRect(x1,y1,x2,y2,maskingCallback,mask);
		return maskGrid.data;
	}

	shiftRect(x1,y1,x2,y2,dX,dY,background,mask){
		var newStamp = this.cloneFromRect(x1,y1,x2,y2);
		if (DataGrid.isValidData(mask)){
			var invertedMask = DataGrid.invertMask(mask);
		}
		this.fillRect(x1,y1,x2,y2,background,invertedMask);
		this.stamp(x1 + dX, y1 + dY, newStamp, mask);
	}

	getPixel(x,y){
		x = this.clampXBounds(x);
		y = this.clampYBounds(y);
		if ( x < 0 || y < 0 || x > this.width - 1 || y > this.height - 1){
			return null;
		} else {
			return this.data[y][x];
		}
	}

	get(x,y,x2,y2){
		if (typeof(x2) == "undefined" || typeof(y2) == "undefined"){
			return this.getPixel(x,y);
		} else {
			var dataArray = new Array(y2 - y + 1);
			var getterCallback = function(value,boxX,boxY,x,y){
				if(typeof(dataArray[boxY]) == "undefined"){
					dataArray[boxY] = new Array(x2 - x + 1);
				}
				dataArray[boxY][boxX] = value;
				return value;
			}
			this.forRect(x,y,x2,y2,getterCallback);
			return dataArray;
		}
	}

	forCirc(centerX,centerY,radius,callback,mask,edgesOnly){
		radius = Math.floor(radius);
		var diameter = radius * 2 + 1;
		var defaultValue = DataGrid.isValidData(mask) ? mask : 1;
		var circMask = new DataGrid(diameter,diameter,defaultValue);
		var fillCallback = function(oldValue, boxX, boxY){
			var isInsideCircle = DataGrid.distanceBetween(radius + 0.5,radius + 0.5,boxX,boxY) <= radius;
			return (isInsideCircle) ? oldValue : null;
		}
		var edgeCallback = function(oldValue, boxX, boxY){
			var isOnPerimeter = Math.round(DataGrid.distanceBetween(radius + 0.5,radius + 0.5,boxX,boxY)) == radius;
			return (isOnPerimeter) ? oldValue : null;
		}
		var circCallback = (edgesOnly == true) ? edgeCallback : fillCallback;
		circMask.forAll(circCallback);

		this.forRect(centerX - radius, centerY - radius, centerX + radius, centerY + radius, callback, circMask.data);
	}

	fillCirc(centerX,centerY,radius,value,mask){
		var fillCallback = function(){
			return DataGrid.findValue(value);
		};
		this.forCirc(centerX,centerY,radius,fillCallback,mask);
	}

	drawCirc(centerX,centerY,radius,value,mask){
		this.forCirc(centerX,centerY,radius,function(){
			if (value.constructor.name == "Array"){ 
				var returnValue = DataGrid.randomize(value); 
			} else {
				var returnValue = value;
			}
			return returnValue; 
		}, mask, true);
	}

	forLine(x1,y1,x2,y2,callback,mask){
		var defaultValue = DataGrid.isValidData(mask) ? mask : 1;
		var lineMask = new DataGrid( Math.abs(x2 - x1) + 1, Math.abs(y2 - y1) + 1, defaultValue, true, true);
		var xMin = Math.min(x1,x2);
		var xMax = Math.max(x1,x2);
		var yMin = Math.min(y1,y2);
		var yMax = Math.max(y1,y2);
		var slope = (y2 - y1) / (x2 - x1);
		if (slope == 0){
			this.forRect(xMin,yMin,xMax,yMax,callback);
			return;
		}
		var lineCallback = function(maskValue, boxX, boxY){
			var postiveSlopeFix = (boxX == Math.round(boxY / slope)) ? 1 : null;
			var negativeSlopeHack = (boxX == lineMask.clampYBounds(Math.round((boxY + 1) / slope))) ? 1 : null;
			return slope > 0 ? postiveSlopeFix : negativeSlopeHack;
		}
		lineMask.forAll(lineCallback);
		
		this.forRect(xMin,yMin,xMax,yMax,callback,lineMask.data);
	}

	fillLine(x1,y1,x2,y2,value,mask){
		var fillCallback = function(){
			return DataGrid.findValue(value);
		};
		this.forLine(x1,y1,x2,y2,fillCallback,mask);
	}

	allStats(){
		var statsObject = {};
		var tempCallBack = function(value){
			if (typeof(statsObject[value]) == "undefined"){
				statsObject[value] = 0;
			}
			statsObject[value]++;
			return value;
		}
		this.forAll(tempCallBack);
		return statsObject;
	}

	getStats(x,y,x2,y2){
		if ( typeof(x2) == "undefined" || typeof(y2) == "undefined" ){
			console.log("getStats requires two points");
			return;
		}
		var tempGrid = new this.cloneFromRect(x,y,x2,y2);
		return tempGrid.allStats();
	}

	getNeighbors(x,y){
		return this.get(x - 1, y - 1, x + 1, y + 1);
	}

	getNeighborsStats(x,y){
		return new DataGrid(3,3,this.getNeighbors(x,y)).allStats();
	}

	set(x,y, value){
		x = this.clampXBounds(x);
		y = this.clampYBounds(y);

		if ( x < 0 || x > this.width - 1 || y < 0 || y > this.height - 1){
			return null;
		}

		if( typeof(value) != 'undefined'){
			this.data[y][x] = value;
		} else {
			console.log('cannot set pixel to undefined');
		}
		
		return this.data[y][x];
	}

	stamp(x,y,data,mask){

		if (data.constructor.name == "DataGrid"){
			data = data.data;
		}

		if(!DataGrid.isValidData(data)){
			console.log('stamp data must be an array of arrays or a DataGrid');
			return;
		}

		var x2 = x + data[0].length - 1;
		var y2 = y + data.length - 1;

		this.forRect(x,y,x2,y2,function(currentValue,stampX,stampY){
			return data[stampY][stampX];
		});
	}

	stretchStamp(x1,y1,x2,y2,data,mask){
		if (data.constructor.name == "DataGrid"){
			data = data.data;
		}

		if( !(DataGrid.isValidData(data) && data.length == 3 && data[0].length == 3) ){
			console.log('stretchStamp data must be a 3x3 array of arrays or a 3x3 DataGrid');
			return;
		}

		x2 = (x2 > x1 + 2) ? x2 : x1 + 2;
		y2 = (y2 > y1 + 2) ? y2 : y1 + 2;

		this.forRect(x1,y1,x2,y2,function(currentValue,stampX,stampY){
			var xCoord = (x1 + stampX == x1) ? 0 : (x1 + stampX == x2) ? 2 : 1;
			var yCoord = (y1 + stampY == y1) ? 0 : (y1 + stampY == y2) ? 2 : 1;

			return data[yCoord][xCoord];
		});
	}

	forAll(callback,mask){
		this.forRect(0,0,this.width - 1, this.height - 1, callback);
	}

	fillAll(value,mask){
		this.fillRect(0,0,this.width - 1, this.height - 1, value,mask)
	}

	clone(){
		return this.cloneFromRect(0, 0, this.width - 1, this.height - 1, this.wrapX, this.wrapY)
	}

	runAll(callback){
		this.runRect(0,0,this.width - 1, this.height - 1, callback)
	}

	runLifeAll(onValue,offValue){
		this.runLifeRect(0,0,this.width - 1,this.height - 1,onValue,offValue)
	}

	smoothAll(valuesGroup,rulesSet){
		this.smoothRect(0,0,this.width - 1,this.height - 1,valuesGroup,rulesSet);
	}

	getMaskAll(values,invert,mask){
		return this.getMaskRect(0,0,this.width - 1,this.height - 1,values,invert,mask);
	}

	shiftAll(dX,dY,background,mask){
		this.shiftRect(0,0,this.width - 1,this.height - 1,dX,dY,background,mask);
	}

}