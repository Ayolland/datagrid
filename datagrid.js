class DataGrid{
	
	constructor(width,height,defaultValue){
		this.height = height;
		this.width = width;
		this.data = [];
		this.isDataGrid = true;
		defaultValue = (typeof(defaultValue) != "undefined") ? defaultValue : null;

		var usePreviousData = (typeof(defaultValue[0]) == "object");

		for (var tempy = 0; tempy <= height - 1; tempy++) {
			var newRow = [];

			for (var tempx = 0; tempx <= width - 1; tempx++) {
				if( usePreviousData ){
					var currentSubY = tempy % defaultValue.length;
					var currentSubX = tempx % defaultValue[currentSubY].length;
					newRow.push(defaultValue[currentSubY][currentSubX])
				} else {
					newRow.push(defaultValue);
				}
			}

			this.data.push(newRow);
		}
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
		this.forRect(x1,y1,x2,y2,function(){ return value; })
	}

	cloneFromRect(x1,y1,x2,y2){
		return new DataGrid(x2 - x1 + 1, y2 - y1 + 1, this.get(x1,x2,y1,y2))
	}

	get(x,y,x2,y2){
		if (typeof(x2) == "undefined" || typeof(y2) == "undefined"){
			if ( x < 0 || y < 0 || x > this.width - 1 || y > this.height - 1){
				return null;
			} else {
				return this.data[y][x];
			}
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

	getNeighbors(x,y){
		return this.get(x - 1, y - 1, x + 1, y + 1)
	}

	set(x,y, value){
		if ( x < 0 || y < 0 || x > this.width - 1 || y > this.height - 1){
			return null;
		} else {
			this.data[y][x] = value;
			return this.data[y][x];
		}
	}

	stamp(x,y,data){

		if (data.constructor.name == "DataGrid"){
			data = data.data;
		}

		if(typeof(data.length) == "undefined" || typeof(data[0].length) == "undefined"){
			console.log('stamp data must be an array of arrays');
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
		this.forAll(function(){ return value; });
	}

	clone(){
		this.cloneFromRect(0,0,this.width - 1,this.height - 1)
	}
}