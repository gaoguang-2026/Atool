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
	
	var remind = function(filter, type, isRevert = false, gain = false) {
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
			var txt = '';
			if (tDiffArr.length > 0 && tDiffArr.length < 5) {
				tDiffArr.forEach((t)=>{
					txt += tDiffArr.length == 1 && gain ? getGain(t) : '';
					txt +=  t['f14'] + ' ';
				});
				txt += type;
				speecher.speak(txt);
			} else if(tDiffArr.length >= 5) {
				txt +=  tDiffArr[0]['f14'] + ' ' + tDiffArr[1]['f14'] + '等' + tDiffArr.length + '支票';
				txt += type;
				speecher.speak(txt);
			} else {
				// do noting...
			}
		}
	}
	var init = function() {
		Timer.addTimerCallback(()=>{
			if (!Configure.isHalfBidding()) {
				remind(rtDataManager.raisedFilter, '接近涨停', false, true);
				remind(rtDataManager.jumpeFilter, '快速下跌', false, true);
				remind(rtDataManager.boardedFilter, '涨停', false, true);
				remind(rtDataManager.flooredFilter, '跌停', false, true);
				
				remind(rtDataManager.boardFilter, '炸板', true);
				remind(rtDataManager.floorFilter, '打开跌停', true);
			}
		})
	};
	
	return {
		init:init,
	}
})();