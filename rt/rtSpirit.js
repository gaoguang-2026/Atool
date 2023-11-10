var rtSpirit = (function(){
	
	var getGain = function(dataT) {
		if(dataT && dataT['f103']) {
			var arr = dataT['f103'].split(',');
			for(i = arr.length - 1; i >= 0; i --) {
				if(Configure.gaiBlackList_critical.indexOf(arr[i]) == -1 &&
					Configure.gaiBlackList_verbose.indexOf(arr[i]) == -1) {
					return arr[i];
				}
			};
		}
		return dataT['f100'];
	};
	
	var remind = function(filter, type, isRevert = false) {
		var tPreArray = rtDataManager.getPreRTTickets().filter(filter);
		var tArray = rtDataManager.getRTTickets().filter(filter);
		if (tPreArray && tPreArray.length > 0) {
			var tA = isRevert ? tArray : tPreArray;
			var tB = isRevert ? tPreArray : tArray;
			var tDiffArr = tB.filter((t)=>{
				return tA.findIndex((tPre)=>{
					return tPre['f12'] == t['f12'];
				}) == -1;
			});
			if (tDiffArr.length > 0) {
				var txt = '';
				tDiffArr.forEach((t)=>{
					txt += tDiffArr.length > 2 ? '' : getGain(t);
					txt +=  t['f14'] + ' ';
				});
				txt += type;
				speecher.speak(txt);
			}
		}
	}
	var init = function() {
		Timer.addTimerCallback(()=>{
			remind(rtDataManager.raisedFilter, '接近涨停');
			remind(rtDataManager.jumpedFilter, '快速下跌');
			remind(rtDataManager.boardedFilter, '涨停');
			remind(rtDataManager.flooredFilter, '跌停');
			
			remind(rtDataManager.boardFilter, '炸板', true);
			remind(rtDataManager.floorFilter, '打开跌停', true);
		})
	};
	
	return {
		init:init,
	}
})();