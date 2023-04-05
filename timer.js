var Timer = (function(){
	var timerId;
	
	var callbackArray = [];
	var start = function() {
		timerId = setInterval(function () {
			callbackArray.forEach((f) => {
				f();
			});
		}, Configure.timerDuration)
	};
	
	var addTimerCallback = function(callback) {
		callbackArray.push(callback);
	};
	
	var stop = function() {
		clearInterval(timerId);
	};
	
	return {
		start:start,
		stop:stop,
		addTimerCallback:addTimerCallback,
	}
})();