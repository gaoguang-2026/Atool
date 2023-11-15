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
	
	/// 加一个cache避免重复播报同一个票
	var ticketCache = {};
	var cacheRemind = function(ticketArr, type) {
		if(Configure.isBidding()) return;
		if(ticketCache[type] == undefined) {
			ticketCache[type] = [];
		}
		ticketCache[type] = ticketCache[type].concat(ticketArr.filter((ticket) => {
				return ticketCache[type].findIndex((t)=>{
					return t['f12'] == ticket['f12'];
				}) == -1;
			}
		));
	};
	var checkCache = function(t, type) {
		return ticketCache[type] == undefined || ticketCache[type].findIndex((tCache)=>{
			return  t['f12'] == tCache['f12'];
		}) == -1;
	};
	var clearCache = function() {
		ticketCache = {};
	};
	////
	
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
					if (checkCache(t, type)) {
						txt += tDiffArr.length == 1 && gain ? getGain(t) : '';
						txt +=  t['f14'] + ' ';
					}
				});
				if(txt != '') {
					txt += type;
					speecher.speak(txt);
				}
			} else if(tDiffArr.length >= 5) {
				txt +=  tDiffArr[0]['f14'] + ' ' + tDiffArr[1]['f14'] + '等' + tDiffArr.length + '支票';
				txt += type;
				speecher.speak(txt);
			} else {
				// do noting...
			}
			return tDiffArr;
		}
		return [];
	}

	var init = function() {
		Timer.addTimerCallback(()=>{
			if (!Configure.isHalfBidding()) {
				remind(rtDataManager.raisedFilter, '接近涨停', false, true);
				remind(rtDataManager.jumpeFilter, '快速下跌', false, true);
				
				cacheRemind(remind(rtDataManager.floorFilter, '跌停', false, true), '跌停');
				cacheRemind(remind(rtDataManager.boardFilter, '涨停', false, true), '涨停');
				cacheRemind(remind(rtDataManager.boardFilter, '炸板', true), '炸板');
				cacheRemind(remind(rtDataManager.floorFilter, '打开跌停', true), '打开跌停');
			}
		});
		// 10min 清除cache
		setInterval(clearCache, 10 * 60 * 1000);
	};
	
	return {
		init:init,
	}
})();