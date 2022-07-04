var Configure = (function(){
	var debug = true;
	
	var date = debug ? new Date(2022,06,04) : new Date();

	return {
		date: date,
		debug: debug
	}	
})();