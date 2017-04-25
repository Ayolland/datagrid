// HONEY-DO LIST
//
// Masks
// Draw Circle
// Draw Line
// Draw Outline Rect/Circle
// Draw Bordered Rect
// Rotate
// Run Smoothing
// Force paths
// Draw polygon


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

	static distanceBetween(x1,y1,x2,y2){
		var dY = Math.abs(y2 - y1);
		var dX = Math.abs(x2 - x1);
		return Math.sqrt( Math.pow(dY,2) + Math.pow(dX,2) );
	}

	forRect(x1,y1,x2,y2,callback,mask){
		for (var boxY = 0; y1 + boxY <= y2; boxY++) {
			for (var boxX = 0; x1 + boxX <= x2; boxX++) {
				var value = this.get([x1 + boxX],[y1 + boxY])
				var maskExists = (typeof(mask) != "undefined" && mask.constructor.name == "Array" && mask[0].constructor.name == "Array")
				var maskIsBlocking = maskExists && ( mask[boxY][boxX] == null || typeof(mask[boxY][boxX]) == "undefined")
				if (!maskIsBlocking){
					this.set( [x1 + boxX],[y1 + boxY], callback(value, boxX, boxY, x1, y1) );
				}
			}
		}
	}

	fillRect(x1,y1,x2,y2,value,mask){
		this.forRect(x1,y1,x2,y2,function(){
			if (value.constructor.name == "Array"){ 
				var returnValue = DataGrid.randomize(value); 
			} else {
				var returnValue = value;
			}
			return returnValue; 
		},mask)
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

	forCirc(centerX,centerY,radius,callback,mask){
		radius = Math.floor(radius);
		var diameter = radius * 2 + 1;
		var defaultValue = (typeof(mask) != "undefined" && mask.constructor.name == "Array" && mask[0].constructor.name == "Array") ? mask : 1;
		var circMask = new DataGrid(diameter,diameter,defaultValue);
		var circCallback = function(oldValue, boxX, boxY){
			var isInsideCircle = DataGrid.distanceBetween(radius + 0.5,radius + 0.5,boxX,boxY) <= radius;
			return (isInsideCircle) ? oldValue : null;
		}
		circMask.forAll(circCallback);

		this.forRect(centerX - radius, centerY - radius, centerX + radius, centerY + radius, callback, circMask.data);
	}

	fillCirc(centerX,centerY,radius,value,mask){
		this.forCirc(centerX,centerY,radius,function(){
			if (value.constructor.name == "Array"){ 
				var returnValue = DataGrid.randomize(value); 
			} else {
				var returnValue = value;
			}
			return returnValue; 
		},mask)
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

		this.data[y][x] = value;
		return this.data[y][x];
	}

	stamp(x,y,data,mask){

		if (data.constructor.name == "DataGrid"){
			data = data.data;
		}

		if(typeof(data.length) == "undefined" || typeof(data[0].length) == "undefined"){
			console.log('stamp data must be an array of arrays or a DataGrid');
			return;
		}

		var x2 = x + data[0].length - 1;
		var y2 = y + data.length - 1;

		this.forRect(x,y,x2,y2,function(currentValue,stampX,stampY){
			return data[stampY][stampX];
		});
	}

	forAll(callback,mask){
		this.forRect(0,0,this.width - 1, this.height - 1, callback);
	}

	fillAll(value,mask){
		this.fillRect(0,0,this.width - 1, this.height - 1, value)
	}

	clone(){
		this.cloneFromRect(0, 0, this.width - 1, this.height - 1, this.wrapX, this.wrapY)
	}

	runAll(callback){
		this.runRect(0,0,this.width - 1, this.height - 1, callback)
	}

	runLifeAll(onValue,offValue){
		this.runLifeRect(0,0,this.width - 1,this.height - 1,onValue,offValue)
	}

}