// HONEY-DO LIST
//
// translate
// export to CSV
// add rSeed?
// Add/remove/get/for/fill columns/rows
// Force pathing(maze functions)

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

	// getter functions

	get height(){
		return this.data.length;
	}

	get width(){
		return this.data[0].length;
	}

	// helper class functions

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

	static sortPointsClockwiseAroundPoint(pointsData,centerPoint){
		if (!DataGrid.isValidData(pointsData)){
			console.log('points data provided must be an array of arrays');
			return;
		};

		if ( centerPoint.constructor.name != "Array" || centerPoint.length != 2){
			console.log('center point must be a 2-length array');
			return;
		};

		function sortFunction(pointA,pointB){
			if (centerPoint[0] == pointA[0] && centerPoint[1] == pointA[1]){
				console.log('points data includes center point!')
				return 0;
			}
			var sortValA = Math.atan2(pointA[1] - centerPoint[1], pointA[0] - centerPoint[0]);
			var sortValB = Math.atan2(pointB[1] - centerPoint[1], pointB[0] - centerPoint[0]);
			if (sortValA == sortValB){ return 0 };
			var sortDiff = sortValA - sortValB;
			return ( sortDiff / Math.abs(sortDiff));
		}
		return pointsData.sort(sortFunction);
	}

	// masking class functions

	static cleanMask(mask,invert){
		if (!DataGrid.isValidData(mask)){
			console.log('invert mask can only be applied to an array of arrays');
			return;
		};

		var tempGrid = new DataGrid( mask[0].length, mask.length, mask);
		function inversionCallback(value){
			if (invert == true){
				return (value == null) ? 1 : null;
			} else {
				return (value == null) ? null : 1;
			}
		}
		tempGrid.forAll(inversionCallback);
		return tempGrid.data;
	}

	static invertMask(mask){
		return DataGrid.cleanMask(mask,true);
	}

	static contractMask(mask, pixels){
		if (!DataGrid.isValidData(mask)){
			console.log('contract mask can only be applied to an array of arrays');
			return;
		};
		pixels = (typeof(pixels) == 'undefined') ? 1 : pixels;

		var tempGrid = new DataGrid( mask[0].length, mask.length, DataGrid.cleanMask(mask));
		var contractionRules = [
			[["outside","outside","outside"],["outside",null,"outside"],["outside","group","outside"]],
			[["group","ignore","ignore"],["ignore",null,"ignore"],["ignore","ignore","outside"]],
			[["ignore","group","ignore"],["ignore",null,"ignore"],["ignore","outside","ignore"]],
			[["ignore","ignore","group"],["ignore",null,"ignore"],["outside","ignore","ignore"]],
			[["ignore","ignore","ignore"],["outside",null,"group"],["ignore","ignore","ignore"]],
			[["outside","ignore","ignore"],["ignore",null,"ignore"],["ignore","ignore","group"]],
			[["ignore","outside","ignore"],["ignore",null,"ignore"],["ignore","group","ignore"]],
			[["ignore","ignore","outside"],["ignore",null,"ignore"],["group","ignore","ignore"]],
			[["ignore","ignore","ignore"],["group",null,"outside"],["ignore","ignore","ignore"]],
			[["outside","ignore","ignore"],["ignore",null,"ignore"],["ignore","ignore","outside"]],
			[["ignore","outside","ignore"],["ignore",null,"ignore"],["ignore","outside","ignore"]],
			[["ignore","ignore","outside"],["ignore",null,"ignore"],["outside","ignore","ignore"]],
			[["ignore","ignore","ignore"],["outside",null,"outside"],["ignore","ignore","ignore"]]
		];
		for (var i = 0; i < pixels; i++) {
			tempGrid.smoothAll([1],contractionRules,tempGrid.data);
		}
		return tempGrid.data;
	}

	static expandMask(mask, pixels){
		if (!DataGrid.isValidData(mask)){
			console.log('expand mask can only be applied to an array of arrays');
			return;
		};
		pixels = (typeof(pixels) == 'undefined') ? 1 : pixels;

		var tempGrid = new DataGrid( mask[0].length, mask.length, DataGrid.cleanMask(mask));
		var expansionRules = [
			[["group","ignore","ignore"],["ignore",1,"ignore"],["ignore","ignore","outside"]],
			[["ignore","group","ignore"],["ignore",1,"ignore"],["ignore","outside","ignore"]],
			[["ignore","ignore","group"],["ignore",1,"ignore"],["outside","ignore","ignore"]],
			[["ignore","ignore","ignore"],["outside",1,"group"],["ignore","ignore","ignore"]],
			[["outside","ignore","ignore"],["ignore",1,"ignore"],["ignore","ignore","group"]],
			[["ignore","outside","ignore"],["ignore",1,"ignore"],["ignore","group","ignore"]],
			[["ignore","ignore","outside"],["ignore",1,"ignore"],["group","ignore","ignore"]],
			[["ignore","ignore","ignore"],["group",1,"outside"],["ignore","ignore","ignore"]],
			[["ignore","group","ignore"],["ignore",1,"ignore"],["ignore","group","ignore"]],
			[["ignore","ignore","ignore"],["group",1,"group"],["ignore","ignore","ignore"]],
			[["ignore","group","group"],["ignore",1,"ignore"],["group","group","ignore"]],
			[["group","ignore","ignore"],["ignore",1,"ignore"],["ignore","ignore","group"]]
		];
		for (var i = 0; i < pixels; i++) {
			tempGrid.smoothAll([1],expansionRules);
		}
		return tempGrid.data;
	}

	// Helper functions

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

	randomPoint(datagrid){
		var tempX = Math.floor(Math.random() * (this.width - 1));
		var tempY = Math.floor(Math.random() * (this.height - 1));
		return [tempX,tempY];
	}
	
	randomPointNearby(x,y,maxDistance){
		var tempX = x - maxDistance + Math.floor(Math.random() * (2 * maxDistance));
		var tempY = y - maxDistance + Math.floor(Math.random() * (2 * maxDistance));
		return [this.clampXBounds(tempX),this.clampXBounds(tempY)];
	}

	// get/set functions

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

	getMask(x1,y1,x2,y2,values,invert,mask){

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

	getStats(x,y,x2,y2){
		if ( typeof(x2) == "undefined" || typeof(y2) == "undefined" ){
			console.log("getStats requires two points");
			return;
		}
		var tempGrid = this.cloneFromRect(x,y,x2,y2);
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

	// Rectangle functions

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
				var maskIsBlocking = maskExists && ( mask[boxY][boxX] == null || typeof(mask[boxY][boxX]) == "undefined");
				if (!maskIsBlocking){
					var setValue = DataGrid.findValue(callback(value, boxX, boxY, x1, y1));
					if (setValue != "skip"){
						this.set( [x1 + boxX],[y1 + boxY], setValue );
					}
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

	shiftRect(x1,y1,x2,y2,dX,dY,background,mask){
		var newStamp = this.cloneFromRect(x1,y1,x2,y2);
		if (DataGrid.isValidData(mask)){
			var invertedMask = DataGrid.invertMask(mask);
		}
		this.fillRect(x1,y1,x2,y2,background,invertedMask);
		this.stamp(x1 + dX, y1 + dY, newStamp, mask);
	}

	rotateRect(x1,y1,x2,y2,turns,background){
		var rotateGrid = this.cloneFromRect(x1,y1,x2,y2);
		this.fillRect(x1,y1,x2,y2,background);
		rotateGrid.rotateAll(turns);
		this.stamp(x1,y1,rotateGrid);
	}

	// cellular automata

	runRect(x1,y1,x2,y2,callback,mask){
		var newData = new DataGrid(x2 - x1 + 1, y2 - y1 + 1);
		var injectedCallback = function(oldValue, rectX, rectY, x1, y1){
			newData.set(rectX, rectY, callback(oldValue, rectX, rectY, x1, y1) );
			return oldValue;
		}
		this.forRect(x1,y1,x2,y2,injectedCallback,mask);
		this.stamp(x1,y1,newData,mask);
	}

	runBornSurviveRect(x1,y1,x2,y2,onValue,offValue,bornArray,surviveArray,mask){
		if( bornArray.length > 8 || surviveArray.length > 8){
			console.log('Born/Survive requires 0-8 length arrays of numbers 1-8');
			return;
		}
		var thisDataGrid = this;
		function BSCallback(oldValue, rectX, rectY, x1, y1){
			var statsObject = thisDataGrid.getNeighborsStats(x1 + rectX, y1 + rectY);
			statsObject[oldValue]--;
			var neighborsAlive = statsObject[onValue];
			if (oldValue == onValue){
				if (surviveArray.indexOf(neighborsAlive) >= 0){
					return onValue;
				} else {
					return offValue;
				}
			} else if (oldValue == offValue){
				if (bornArray.indexOf(neighborsAlive) >= 0){
					return onValue;
				} else {
					return offValue;
				}
			}
		}
		this.runRect(x1,y1,x2,y2, BSCallback,mask);
	}

	runLifeRect(x1,y1,x2,y2,onValue,offValue,mask){
		this.runBornSurviveRect(x1,y1,x2,y2, onValue, offValue, [3], [2,3],mask);
	}

	runMazectricRect(x1,y1,x2,y2,onValue,offValue,mask){
		this.runBornSurviveRect(x1,y1,x2,y2, onValue, offValue, [3], [1,2,3,4],mask);
	}

	smoothRect(x1,y1,x2,y2,valuesGroup,rulesSet,mask){
		if(valuesGroup.constructor.name != "Array"){
			console.log("acceptable values needs to be an array of values part of smoothing group");
			return;
		}

		if(rulesSet.constructor.name != "Array" || (rulesSet[0].constructor.name != "DataGrid" && !(rulesSet[0].constructor.name == "Array" && rulesSet[0][0].constructor.name == "Array")) ){
			console.log("rules set needs to be an array of DataGrids or DataGrid data arrays");
			return;
		}

		var thisDataGrid = this;
		var matchesRule;

		function checkRule(rule,x,y){
			var areaToCheck = new DataGrid(3,3,thisDataGrid.getNeighbors(x,y));

			rule.forAll(function(ruleCellValue,ruleX,ruleY){
				var cellIsMatchesGroup = ruleCellValue == "group" && valuesGroup.indexOf(areaToCheck.data[ruleY][ruleX]) != -1;
				var cellIsMatchesOutside = ruleCellValue == "outside" && valuesGroup.indexOf(areaToCheck.data[ruleY][ruleX]) == -1;
				var checkingCenterCell = ruleX == 1 && ruleY == 1;
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
				var ruleToCheck = (rulesSet[i].constructor.name == "DataGrid") ? rulesSet[i] : new DataGrid(rulesSet[i][0].length, rulesSet[i].length, rulesSet[i]);
				matchesRule = true;
				checkRule(ruleToCheck, x1 + rectX, y1 + rectY);
				if (matchesRule != false){
					return ruleToCheck.get(1,1);
					break;
				}
			}
			return originalValue;
		}

		this.runRect(x1,y1,x2,y2,smoothingCallback,mask);
	}

	clumpRect(x1,y1,x2,y2,selectValues,clearValue,fillValue,mask){
		if (!DataGrid.isValidData(mask)){
			mask = this.getMask(x1,y1,x2,y2,selectValues);
		}

		var clumpingRules = [
			[["group","group","group"],["group",fillValue,"group"],["group","group","group"]],
			[["ignore","outside","ignore"],["ignore",clearValue,"ignore"],["ignore","outside","ignore"]],
			[["ignore","ignore","ignore"],["outside",clearValue,"outside"],["ignore","ignore","ignore"]],
		];
		this.smoothRect(x1,y1,x2,y2,selectValues,clumpingRules,mask);
	}

	// circle functions

	forCirc(centerX,centerY,radius,callback,mask,edgesOnly){
		radius = Math.floor(radius);
		var diameter = radius * 2 + 1;
		var circMask = new DataGrid(diameter,diameter,1);
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

		if (DataGrid.isValidData(mask)){
			var newMask = new DataGrid(mask[0].length, mask.length, mask).cloneFromRect(centerX - radius, centerY - radius, centerX + radius, centerY + radius);
			newMask.data = DataGrid.invertMask(newMask.data);
			circMask.fillAll(null, newMask.data);
		}

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

	// line/path functions

	forLine(x1,y1,x2,y2,callback,mask){
		var defaultValue = DataGrid.isValidData(mask) ? mask : 1;
		var lineMask = new DataGrid( Math.abs(x2 - x1) + 1, Math.abs(y2 - y1) + 1, defaultValue, true, true);
		var xMin = Math.min(x1,x2);
		var xMax = Math.max(x1,x2);
		var yMin = Math.min(y1,y2);
		var yMax = Math.max(y1,y2);
		var slope = (y2 - y1) / (x2 - x1);
		var xIntercept = (x1 - xMin) - (y1 - yMin) / slope;

		var lineCallback = function(value, boxX, boxY, x1, y1){
			if(!isFinite(slope)){
				if (xMin + boxX == x1){
					return callback(value, boxX, boxY, x1, y1);
				}
			} else if (slope == 0){
				if (yMin + boxY == y1){
					return callback(value, boxX, boxY, x1, y1);
				}
			} else {
				if ( Math.abs((boxX + 0.5) - (((boxY + 0.5) / slope) + xIntercept)) <= 0.5 ){
					return callback(value, boxX, boxY);
				}
			}
		}
		
		this.forRect(xMin,yMin,xMax,yMax,lineCallback,mask);
	}

	drawLine(x1,y1,x2,y2,value,mask){
		var fillCallback = function(){
			return DataGrid.findValue(value);
		};
		this.forLine(x1,y1,x2,y2,fillCallback,mask);
	}

	forPath(pointsData,callback,mask){
		for (var i = 0; i < pointsData.length - 1; i++) {
			var pointA = pointsData[i];
			var pointB =pointsData[i + 1];
			this.forLine(pointA[0],pointA[1],pointB[0],pointB[1],callback,mask);
		}
	}

	drawPath(pointsData,value,mask){
		var fillCallback = function(){
			return DataGrid.findValue(value);
		};
		this.forPath(pointsData,fillCallback,mask);
	}

	// polygon functions

	forPolygon(pointsData,callback,mask){
		if( !DataGrid.isValidData(pointsData) || pointsData[0].length != 2){
			console.log("point data for polygons needs to be an Array of 2-length Arrays");
			return;
		}

		var xValues = pointsData.map(function(pointArray){
			return pointArray[0];
		});
		var yValues = pointsData.map(function(pointArray){
			return pointArray[1];
		});
		var x1 = Math.min.apply(null, xValues);
		var y1 = Math.min.apply(null, yValues);
		var x2 = Math.max.apply(null, xValues);
		var y2 = Math.max.apply(null, yValues);
		var centerPoint = [Math.floor((x2 - x1) / 2),Math.floor((y2 - y1) / 2)];

		pointsData = DataGrid.sortPointsClockwiseAroundPoint(pointsData, centerPoint);
		pointsData.push(pointsData[0]);

		var previousMaskData = (DataGrid.isValidData(mask))? mask : 1;
		var maskGrid = new DataGrid (x2 - x1 + 1, y2 - y1 + 1, previousMaskData);
		var previousSlope = (pointsData[1][1] - pointsData[0][1])/(pointsData[1][0] - pointsData[0][0]);
		var realtiveMidY = Math.floor(maskGrid.height / 2);
		var chopDirection = (pointsData[0][1] != 0 && pointsData[1][1] != 0) ? "left" : "right";

		for (var i = 0; i < pointsData.length - 1; i++) {
			var pointA = [pointsData[i][0] - x1, pointsData[i][1] - y1];
			var pointB = [pointsData[i + 1][0] - x1, pointsData[i + 1][1] - y1];
			var slope = (pointB[1] - pointA[1])/(pointB[0] - pointA[0]) * 1;
			var xIntercept = pointA[0] - pointA[1] / slope;
			if (pointA[1] == 0 && pointB[1] != 0 && chopDirection == "left"){
				chopDirection = "right";
			} else if (pointA[1] == maskGrid.height - 1 && pointB[1] != maskGrid.height - 1 && chopDirection == "right"){
				chopDirection = "left";
			}

			function chopCallback(maskValue, boxX, boxY){
				if(!isFinite(slope)){
					var chopLeft = (boxX >= pointA[0]) ? 1 : null;
					var chopRight = (boxX <= pointA[0]) ? 1 : null;
				} else if (slope == 0){
					var chopLeft = (boxY >= pointA[1]) ? 1 : null;
					var chopRight = (boxY <= pointA[1]) ? 1 : null;
				} else {
					var chopLeft = (boxX >= Math.round(boxY / slope) + xIntercept) ? 1 : null;
					var chopRight = (boxX <= Math.round(boxY / slope) + xIntercept) ? 1 : null;
				}
				return (chopDirection == "left") ? chopLeft : chopRight;
			}

			//console.log('A: '+pointA[0]+","+pointA[1]+" B: "+pointB[0]+","+pointB[1]+" Slope: "+slope+" Chop: "+chopDirection);
			maskGrid.forAll(chopCallback,maskGrid.data)

			previousSlope = slope;
		}

		this.forRect(x1,y1,x2,y2,callback,maskGrid.data);

	}

	fillPolygon(pointsData,value,mask){
		var fillCallback = function(){
			return DataGrid.findValue(value);
		};
		this.forPolygon(pointsData,fillCallback,mask);
	}

	// 'stamp' functions

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
		},mask);
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

		this.forRect(x1,y1,x2,y2,function(currentValue,stampX,stampY,mask){
			var xCoord = (x1 + stampX == x1) ? 0 : (x1 + stampX == x2) ? 2 : 1;
			var yCoord = (y1 + stampY == y1) ? 0 : (y1 + stampY == y2) ? 2 : 1;

			return data[yCoord][xCoord];
		});
	}

	// 'all' aliases

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

	forAll(callback,mask){
		this.forRect(0,0,this.width - 1, this.height - 1, callback,mask);
	}

	fillAll(value,mask){
		this.fillRect(0,0,this.width - 1, this.height - 1, value,mask)
	}

	clone(){
		return this.cloneFromRect(0, 0, this.width - 1, this.height - 1, this.wrapX, this.wrapY)
	}

	runAll(callback,mask){
		this.runRect(0,0,this.width - 1, this.height - 1, callback)
	}

	runBornSurviveAll(onValue,offValue,bornArray,surviveArray,mask){
		this.runBornSurviveRect(0,0,this.width - 1,this.height - 1,onValue,offValue,bornArray,surviveArray,mask)
	}

	runLifeAll(onValue,offValue,mask){
		this.runLifeRect(0,0,this.width - 1,this.height - 1,onValue,offValue,mask)
	}

	runMazectricAll(onValue,offValue,mask){
		this.runMazectricRect(0,0,this.width - 1,this.height - 1,onValue,offValue,mask)
	}

	smoothAll(valuesGroup,rulesSet,mask){
		this.smoothRect(0,0,this.width - 1,this.height - 1,valuesGroup,rulesSet,mask);
	}

	getMaskAll(values,invert,mask){
		return this.getMask(0,0,this.width - 1,this.height - 1,values,invert,mask);
	}

	shiftAll(dX,dY,background,mask){
		this.shiftRect(0,0,this.width - 1,this.height - 1,dX,dY,background,mask);
	}

	rotateAll(turns){

		turns = Math.round(turns) % 4
		var direction = (turns > 0) ? 1 : -1;
		var orginalGrid = this;

		for (var i = 0; i < Math.abs(turns); i++) {
			var tempGrid = new DataGrid(orginalGrid.height,orginalGrid.width);
			tempGrid.forAll(function(value,x,y){
				return (direction == 1) ? orginalGrid.get(y,orginalGrid.height - x - 1) : orginalGrid.get(orginalGrid.width - y - 1,x);
			});
			this.data = tempGrid.data;
		}
	}

	clumpAll(selectValues,clearValue,fillValue,mask){
		this.clumpRect(0,0,this.width - 1,this.height - 1,selectValues,clearValue,fillValue,mask);
	}

}