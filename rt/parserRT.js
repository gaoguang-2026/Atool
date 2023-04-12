var parserRT = (function(){
	var gFilter = ['融资融券', '深股通', '创业板综', '预亏预减', '预盈预增', '富时罗素',
					'沪股通', '华为概念', '机构重仓', '基金重仓', '区块链', '标准普尔',
					'深成500', '物联网', '大数据', '注册制次新股', '次新股', '百元股',
					'MSCI中国', '专精特新', '国企改革', '中证500', '深圳特区',
					'昨日涨停_含一字', '昨日涨停', '股权激励', '转债标的', '上证380'];

	var rtRankData = new window.GaiData();
	
	var getGaiRankData = function() {
		return rtRankData;
	};
	
	var generateEchelons = function(gaiNianArr) {
		var rtEchelons = [];
		// configure 的echelon
		Configure.echelons.forEach((echelon)=>{
			var e = {};
			e.score = 0;
			e.name = echelon.name;
			e.hotPoints = echelon.hotPoints.slice();
			e.hotPoints.forEach((hot)=>{
				var gFind = gaiNianArr.find((g)=>{
					return g[Configure.titleGainian.name] == hot;
				})
				if (gFind) {
					e.score += parseFloat(gFind[Configure.titleGainian.weight]) + 0; 
				}
			});
			e.score = parseFloat(e.score).toFixed(3);
			e.fund = 0;
			rtEchelons.push(e);
		});
		
		rtEchelons = rtEchelons.sort((a, b) => {
			return b.score - a.score;
		}).splice(0, Configure.RT_canvas_show_echelons_num);
		
		var alreadyInConfig = [];
		rtEchelons.forEach((e)=>{
			alreadyInConfig = alreadyInConfig.concat(e.hotPoints);
		})
		for (var i = 0; i < gaiNianArr.length; i ++) {
			var g = gaiNianArr[i];
			if(g[Configure.titleGainian.ticketNum] >= Configure.RT_show_min_rank_ticket_num &&
				!alreadyInConfig.includes(g[Configure.titleGainian.name]) &&
				g[Configure.titleGainian.weight] > rtEchelons[rtEchelons.length-1].score){ 
				var newEche = {};
				newEche.name = '*' + g[Configure.titleGainian.name];
				newEche.score = parseFloat(g[Configure.titleGainian.weight]).toFixed(3);   // 横向显示权重
				newEche.hotPoints = [g[Configure.titleGainian.name]];
				newEche.fund = 0;
				rtEchelons.push(newEche);
			}
		}
		rtEchelons.sort((a, b) => {
			return b.score - a.score;
		});
		return rtEchelons; 
	};
	
	var parseAndStoreRTData = function(rtTickets = workbook.getRTTicketsLeader()) {
		var retArr = [];
		var scoreTotal = 0;
		rtTickets.forEach((rtData)=>{
			var tGainArr = rtData['f103'].split(',');
			tGainArr.forEach((gtxt)=>{
				if ( gFilter.indexOf(gtxt) == -1) {  // 过滤频繁出现的概念
					var gain = retArr.find((item)=>{
						return item[Configure.titleGainian.name] == gtxt;
					});
					if(!gain) {
						gain = {};
						gain[Configure.titleGainian.name] = gtxt;
						gain[Configure.titleGainian.ticketNum] = 0;
						gain[Configure.titleGainian.ticketsCode] = [];
						gain[Configure.titleGainian.score] = 0;
						retArr.push(gain);
					} 
					
					gain[Configure.titleGainian.ticketNum] += 1;
					gain[Configure.titleGainian.ticketsCode].push(rtData['f12']);
					// 计算score
					var s = Configure.calScoreFromRtData(rtData);
					gain[Configure.titleGainian.score] += s;
					// 记录下总和
					scoreTotal += s;
				}
			});
		});
		
		retArr.forEach((g)=>{
			g[Configure.titleGainian.weight] = parseFloat(g[Configure.titleGainian.score] * 100 / scoreTotal);
		})
		retArr.sort((a, b)=>{
			return parseFloat(b[Configure.titleGainian.weight]) - parseFloat(a[Configure.titleGainian.weight]);
		});
		
		retArr = retArr.slice(0, retArr.length > Configure.RT_GAI_rank_max_length ?  
						Configure.RT_GAI_rank_max_length : retArr.length - 1);
						
		var retEchelons = generateEchelons(retArr);
		
		rtRankData.setRankDataFromNow(retArr, retEchelons);
		return retArr;
	};
	var getEchelonByIndex = function(e, index) {
		var retE = {};
		retE.name = e.name;
		retE.hotPoints = e.hotPoints.slice();
		retE.score = 0;
		retE.hotPoints.forEach((hot)=>{
			if(rtRankData.getRankData().data[index]  && 
				rtRankData.getRankData().data[index].gaiRank) {
				var gain = rtRankData.getRankData().data[index].gaiRank.find((d)=>{
					return d[Configure.titleGainian.name] == hot;
				});
				if(gain) {
					retE.score += parseFloat(gain[Configure.titleGainian.weight]) + 0; 
				}
			}
		});
		retE.fund = 0;
		return retE;
					
	};
	var getRTEchelons = function() {
		// 选出全天最高的RT_canvas_show_echelons_num个 
		var topEchelons = rtRankData.getTopEchelons().sort((a, b) => {
			return b.score - a.score;
		}).slice(0, Configure.RT_canvas_show_echelons_num);
		
		// 更新当前的得分, 需要拷贝对象
		var gaiNianArr = rtRankData.getLastRankData();
		var retEchelons = [];
		topEchelons.forEach((e)=>{
			var newEche = {};
			newEche.score = 0;
			newEche.name = e.name;
			newEche.hotPoints = e.hotPoints.slice();
			
			newEche.hotPoints.forEach((hot)=>{
				var gFind = gaiNianArr.find((g)=>{
					return g[Configure.titleGainian.name] == hot;
				})
				if (gFind) {
					newEche.score += parseFloat(gFind[Configure.titleGainian.weight]) + 0; 
				}
			});
			newEche.score = parseFloat(newEche.score).toFixed(3);
			retEchelons.push(newEche);
		});
		retEchelons.sort((a, b) => {
			return b.score - a.score;
		});
		return retEchelons;
	};

	return {
		gFilter:gFilter,
		parseAndStoreRTData:parseAndStoreRTData,
		getRTEchelons:getRTEchelons,
		getGaiRankData:getGaiRankData,
		getEchelonByIndex:getEchelonByIndex,
	}
})();