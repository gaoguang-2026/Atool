var rtSpirit = (function(){
	
	var getGain = function(dataT) {
		if(dataT && dataT['f103']) {
			var arr = dataT['f103'].split(',');
			for(i = arr.length - 1; i >= 0; i --) {
				if(Configure.gaiBlackList_critical.indexOf(arr[i]) == -1 &&
					Configure.gaiBlackList_verbose.indexOf(arr[i]) == -1) {
					return '[' + arr[i]+ ']';
				}
			};
		}
		return '[' + dataT['f100'] + ']';
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
	var cacheReprot = function(gainName, type) {
		if(Configure.isBidding()) return;
		if(ticketCache[type] == undefined) {
			ticketCache[type] = [];
		}
		if(!ticketCache[type].includes(gainName)) {
			ticketCache[type].push(gainName);
		};
	};
	var checkReport = function(gainName, type) {
		return ticketCache[type] == undefined || !ticketCache[type].includes(gainName);
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
						txt += tDiffArr.length == 1 && gain ? getGain(t) + ' ' : '';
						txt +=  '【' + t['f14'] + '】';
					}
				});
				if(txt != '') {
					txt += type;
					speecher.speak(txt);
				}
			} else if(tDiffArr.length >= 5) {
				txt +=  '【' + tDiffArr[0]['f14'] + '】【' + tDiffArr[1]['f14'] + '】等' + tDiffArr.length + '支票';
				txt += type;
				speecher.speak(txt);
			} else {
				// do noting...
			}
			return tDiffArr;
		}
		return [];
	};
	
	/// report 概念 
	var GaiRankDataArr = [];
	var GaiRaiseRateDuration = 3 * 60 * 1000;   // 3分钟
	var GaiReportDuration = 0.5 * 60 * 1000;   // 半分钟播报一次
	var GaiReportThreshold = {raise:{des:'快速流入', Threshold: 0.6},
								drop:{des:'快速流出', Threshold: -0.5}
								};
	var reportGain = function() {
		if(Configure.isBidding()) return;   // 竞价不report
		if (GaiRankDataArr.length < GaiRaiseRateDuration / GaiReportDuration) {
			GaiRankDataArr.push(parserRT.getGaiRankData().getLastRankData());
		} else {
			var preRankData = GaiRankDataArr.shift();
			var currentRankData = parserRT.getGaiRankData().getLastRankData();
			GaiRankDataArr.push(currentRankData);
			var gaiNameArr = [];  //{name:'', raiseRate:0}
			currentRankData.forEach((g)=> {
				var gPre = preRankData.find((gP)=>{
					return gP[Configure.titleGainian.name] == g[Configure.titleGainian.name];
				});
				if (gPre && gPre[Configure.titleGainian.score]) {
					var raiseRate = (g[Configure.titleGainian.score] - gPre[Configure.titleGainian.score])/ 
									gPre[Configure.titleGainian.score];
					if(raiseRate != 0) {
						gaiNameArr.push({name:g[Configure.titleGainian.name], raiseRate: raiseRate});
					}
				}
			});
			if (gaiNameArr.length > 0) {
				gaiNameArr.sort((a, b)=>{
					return b.raiseRate - a.raiseRate;
				});
				gaiNameArr.forEach((g)=>{
					console.log('概念 ' + g.name + ' ' + g.raiseRate);
				});
				// 最快的那个判断是否需要播报
				if(gaiNameArr[0].raiseRate > GaiReportThreshold.raise.Threshold
					&& checkReport(gaiNameArr[0].name,  GaiReportThreshold.raise.des)) {
					cacheReprot(gaiNameArr[0].name, GaiReportThreshold.raise.des);
					speecher.speak('[' + gaiNameArr[0].name + '] ' + GaiReportThreshold.raise.des);
				}
				// 最慢的那个判断是否需要播报
				if(gaiNameArr[gaiNameArr.length - 1].raiseRate < GaiReportThreshold.drop.Threshold
					&& checkReport(gaiNameArr[gaiNameArr.length - 1].name,  GaiReportThreshold.drop.des)) {
					cacheReprot(gaiNameArr[gaiNameArr.length - 1].name, GaiReportThreshold.drop.des);
					speecher.speak('[' + gaiNameArr[gaiNameArr.length - 1].name + '] ' + GaiReportThreshold.drop.des);
				}
			}
		};
	};
	/// monitor echelons
	var preRTEchelons;
	var monitorEchelons = function() {
		if(Configure.isBidding()) return;   // 竞价
		if(!preRTEchelons) {
			preRTEchelons = parserRT.getRTEchelons();
		} else {
			var curRTEcholons = parserRT.getRTEchelons();
			curRTEcholons.forEach((curE)=> {
				var index = preRTEchelons.findIndex((preE)=>{
					return preE.name == curE.name;
				});
				if(index == -1) {
					speecher.speak('非主流[' + curE.name + ']快速流入');
				}
			});
			preRTEchelons = curRTEcholons;
		}
	};
	
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
		// 提示概念和echelons
		setInterval(()=>{
			reportGain();
			monitorEchelons();
		}, GaiReportDuration);
		
		// 10min 清除cache
		setInterval(clearCache, 10 * 60 * 1000);
	};
	
	return {
		init:init,
	}
})();