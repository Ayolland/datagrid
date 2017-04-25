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

	forRect(x1,y1,x2,y2,callback){
		for (var boxY = 0; y1 + boxY <= y2; boxY++) {
			for (var boxX = 0; x1 + boxX <= x2; boxX++) {
				var value = this.get([x1 + boxX],[y1 + boxY])
				this.set( [x1 + boxX],[y1 + boxY], callback(value, boxX, boxY) );
			}
		}
	}

	fillRect(x1,y1,x2,y2,value){
		this.forRect(x1,y1,x2,y2,function(){
			if (value.constructor.name == "Array"){ 
				var returnValue = DataGrid.randomize(value); 
			} else {
				var returnValue = value;
			}
			return returnValue; 
		})
	}

	cloneFromRect(x1,y1,x2,y2,wrapX,wrapY){
		var rectWidth = x2 - x1 + 1;
		var rectHeight = y2 - y1 + 1
		return new DataGrid(rectWidth, rectHeight, this.get(x1,y1,x2,y2), wrapX, wrapY)
	}

	runRect(x1,y1,x2,y2,callback){
		var oldData = this.cloneFromRect(x1,y1,x2,y2);
		var newData = new DataGrid(oldData.width,oldData.height);
		var injectedCallback = function(oldValue, rectX, rectY){
			newData.set(rectX, rectY, callback(oldValue, rectX, rectY) );
		}
		oldData.forAll(injectedCallback);
		this.stamp(x1,y1,newData);
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
			var getterCallback = function(value,boxX,boxY){
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

	stamp(x,y,data){

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

	forAll(callback){
		this.forRect(0,0,this.width - 1, this.height - 1, callback);
	}

	fillAll(value){
		this.fillRect(0,0,this.width - 1, this.height - 1, value)
	}

	clone(){
		this.cloneFromRect(0, 0, this.width - 1, this.height - 1, this.wrapX, this.wrapY)
	}

	runAll(callback){
		this.runRect(0,0,this.width - 1, this.height - 1, callback)
	}
}