class DataGrid{
	
	constructor(width,height,defaultValue){
		this.height = height;
		this.width = width;
		this.data = [];
		defaultValue = (typeof(defaultValue) != "undefined") ? defaultValue : null;

		for (var tempy = height; tempy >= 0; tempy--) {
			var newRow = [];

			for (var tempx = width; tempx >= 0; tempx--) {
				newRow.push(defaultValue);
			}

			this.data.push(newRow);
		}
	}

	get(x,y){
		return this.data[y][x];
	}

	set(x,y, value){
		this.data[y][x] = value;
		return this.data[y][x];
	}

	forAll(callback){
		for (var y = 0; y <= this.height; y++) {
			for (var x = 0; x <= this.width; x++) {
				this.data[y][x] = callback(this.data[y][x]);
			}
		}
	}

	forRect(x1,y1,x2,y2,callback){
		for (var boxY = 0; y1 + boxY <= y2; boxY++) {
			for (var boxX = 0; x1 + boxX <= x2; boxX++) {
				this.data[y1 + boxY][x1 + boxX] = callback(this.data[y1 + boxY][x1 + boxX]);
			}
		}
	}
}