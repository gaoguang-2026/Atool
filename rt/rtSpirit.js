var rtSpirit = (function(){
	var remind = function(filter, type) {
		var tPreArray = rtDataManager.getPreRTTickets().filter(filter);
		var tArray = rtDataManager.getRTTickets().filter(filter);
		if (tPreArray && tPreArray.length > 0) {
			var tDiffArr = tArray.filter((t)=>{
				return tPreArray.findIndex((tPre)=>{
					return tPre['f12'] == t['f12'];
				}) == -1;
			});
			if (tDiffArr.length > 0) {
				var txt = '';
					tDiffArr.forEach((t)=>{
					txt += t['f14'] + ' ';
				});
				txt += type;
				speecher.speak(txt);
			}
		}
	}
	var init = function() {
		Timer.addTimerCallback(()=>{
			remind(rtDataManager.boardedFilter, '涨停');
			remind(rtDataManager.flooredFilter, '跌停');
			remind(rtDataManager.raisedFilter, '接近涨停');
			remind(rtDataManager.jumpedFilter, '快速下跌');
		})
	};
	
	return {
		init:init,
	}
})();