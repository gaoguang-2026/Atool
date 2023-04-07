var parserRT = (function(){
	var titleGainian = {
		name: '概念名称',
		ticketNum: '股票数量',
		ticketsCode: '股票代码',
	};
	
	var gFilter = ['融资融券', '深股通', '创业板综', '预亏预减', '预盈预增', '富时罗素',
					'沪股通', '华为概念', '机构重仓', '基金重仓', '区块链', '标准普尔',
					'深成500', '物联网', '大数据', '注册制次新股', '次新股', '百元股',
					'MSCI中国', '专精特新', '国企改革', '中证500', '深圳特区'];

	var getGainianRank = function(rtTickets = workbook.getRTTicketsLeader()) {
		var retArr = [];
		rtTickets.forEach((rtData)=>{
			var tGainArr = rtData['f103'].split(',');
			tGainArr.forEach((gtxt)=>{
				var gain = retArr.find((item)=>{
					return item[titleGainian.name] == gtxt;
				});
				if(!gain) {
					gain = {};
					gain[titleGainian.name] = gtxt;
					gain[titleGainian.ticketNum] = 0;
					gain[titleGainian.ticketsCode] = [];
					retArr.push(gain);
				} 
				
				gain[titleGainian.ticketNum] += 1;
				gain[titleGainian.ticketsCode].push(rtData['f12']);
			});
		});
		
		retArr.sort((a, b)=>{
			return parseInt(b[titleGainian.ticketNum]) - parseInt(a[titleGainian.ticketNum]);
		});
		return retArr;
	};
	
	var getRTEchelons = function() {
		var gaiNianArr = getGainianRank();
		var rtEchelons = [];
		for (var i = 0; i < gaiNianArr.length; i ++) {
			var g = gaiNianArr[i];
			if(g[titleGainian.ticketNum] >= Configure.Echelons_show_min_rank_number && 
					gFilter.indexOf(g[titleGainian.name]) == -1){ 
				var newEche = {};
				newEche.name = '~' + g[titleGainian.name];
				newEche.score = parseInt(g[titleGainian.ticketNum]);
				newEche.hotPoints = [g[titleGainian.name]];
				newEche.fund = 0;
				rtEchelons.push(newEche);
			}
		}
		return rtEchelons;
	}

	return {
		getGainianRank:getGainianRank,
		getRTEchelons:getRTEchelons,
	}
})();