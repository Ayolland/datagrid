class DataGrid{
	
	constructor(height,width,defaultValue){
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
		for (var y = this.height; y >= 0; y--) {
			for (var x = this.width; x >= 0; x--) {
				this.data[y][x] = callback(this.data[y][x]);
			}
		}
	}
}