var parserRT = (function(){
	var gFilter = ['融资融券', '深股通', '创业板综', '预亏预减', '预盈预增', '富时罗素',
					'沪股通', '华为概念', '机构重仓', '基金重仓', '区块链', '标准普尔',
					'深成500', '物联网', '大数据', '注册制次新股', '次新股', '百元股',
					'MSCI中国', '专精特新', '国企改革', '中证500', '深圳特区',
					'昨日涨停_含一字', '昨日涨停', '股权激励', '转债标的'];

	var rtRankData = new window.GaiData();
	
	var getGaiRankData = function() {
		return rtRankData;
	};
	
	var getGainianRank = function(rtTickets = workbook.getRTTicketsLeader()) {
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
					var s = parseFloat(Configure.isBoardDone(rtData) ? Configure.HIGH_factor * 7 : 1);
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
		
		rtRankData.setRankDataFromNow(retArr);
		return retArr;
	};
	
	var getRTEchelons = function() {
		var gaiNianArr = getGainianRank();
		var rtEchelons = [];
		for (var i = 0; i < gaiNianArr.length; i ++) {
			var g = gaiNianArr[i];
			if(g[Configure.titleGainian.ticketNum] >= Configure.RT_show_min_rank_ticket_num){ 
				var newEche = {};
				newEche.name = '' + g[Configure.titleGainian.name];
				newEche.score = parseFloat(g[Configure.titleGainian.weight]).toFixed(3);   // 横向显示权重
				newEche.hotPoints = [g[Configure.titleGainian.name]];
				newEche.fund = 0;
				rtEchelons.push(newEche);
			}
		}
		return rtEchelons.splice(0, 3);   // 只画出前三个
	}

	return {
		gFilter:gFilter,
		getGainianRank:getGainianRank,
		getRTEchelons:getRTEchelons,
		getGaiRankData:getGaiRankData,
	}
})();