var parser = (function(){
	var tickets = [];   // 所有股票
	var gaiNian = new Map();   // 所有概念  元素【概念，{times，weight}】:['猪肉'， {13, 0.24}]
	
	var dateToload;
		
	var loadSheet = function(dateStr = Configure.getDateStr(Configure.date)) {
		//避免重复加载
		if(dateStr == dateToload || !workbook.getSheet(dateStr)) {
			return;
		};
		clear();
		dateToload = dateStr;
		tickets = workbook.getSheet(dateStr);
		// 主动更新表头
		Configure.updatetitle(dateStr);
		
		///////
		var totalscored = 0;      // 出现次数*该股票的连扳数*Configure.HIGH_factor，做后面计算权重的分母
		tickets.forEach((ticket) => {
			var reasons = ticket[Configure.title.reason].split('+');
			reasons.forEach((r) => {
				var reasonWeight = ticket[Configure.title.dayNumber] * Configure.HIGH_factor;
				if (gaiNian.has(r)) {
					gaiNian.set(r, {times:gaiNian.get(r).times + 1, weight: parseInt(gaiNian.get(r).weight + reasonWeight)});
				} else {
					// 初始化这个概念, 此时的weight保存次数*股票的连扳数之和
					gaiNian.set(r, {times:1, weight:parseInt(reasonWeight)});           
				}
				totalscored += reasonWeight;
			});
		});
		totalscored = parseInt(totalscored);

		tickets.forEach((ticket) => {
			//根据概念的权重计算每只股票的得分
			var reasons = ticket[Configure.title.reason].split('+');
			ticket[Configure.title.score] = 0;   //初始化
			reasons.forEach((r) => {
				ticket[Configure.title.score] += gaiNian.get(r).weight;
			});
			ticket[Configure.title.score] = parseInt(ticket[Configure.title.score]/totalscored * 1000);
			
			var dragon = dragons.getDragonStandard(ticket[Configure.title.dayNumber]);
			// realValue 实际流通市值
			ticket[Configure.title.realValue] = parseInt(ticket[Configure.title.value] * 
											(100 - ticket[Configure.title.orgProportion])/100);
			//实际流通市值背离率
			ticket[Configure.title.realValueDivergence] = 
					parseFloat((ticket[Configure.title.realValue] - dragon.realCirculateValue)/
					dragon.realCirculateValue).toFixed(2);
			//价格背离率
			ticket[Configure.title.priceDivergence] = parseFloat((ticket[Configure.title.price] - dragon.price)/
					dragon.price).toFixed(2);
			// 实际换手率
			ticket[Configure.title.realHandoverPercent] = parseFloat(ticket[Configure.title.handoverPercent] * ticket[Configure.title.value] /
															ticket[Configure.title.realValue]).toFixed(2);
			//筹码背离率  X10
			ticket[Configure.title.profitDivergence] = ticket[Configure.title.profitProportion] - dragon.profitProportion > 0 ? 0 : 
				parseFloat((ticket[Configure.title.profitProportion] - dragon.profitProportion)/dragon.profitProportion * 10).toFixed(2);
			// 总背离率
			ticket[Configure.title.totalDivergence] = parseFloat(Math.abs(ticket[Configure.title.realValueDivergence]) + 
														Math.abs(ticket[Configure.title.priceDivergence]) + 
														Math.abs(ticket[Configure.title.profitDivergence])).toFixed(2);
			// 封板力度
			ticket[Configure.title.boardStrength] = Configure.getBoardStrength(ticket[Configure.title.boardType], 
									ticket[Configure.title.boardPercent],
									ticket[Configure.title.boardTime]);

		})
	};
	
	var getHotpoints = function(dateStr) {
		loadSheet(dateStr);
		var hotPointsArr = Array.from(gaiNian);
		hotPointsArr.sort((a, b)=> {
			return b[1].weight - a[1].weight;
		});
		return hotPointsArr;
	};
	
	var getHotpointstxt = function(dateStr) {
		var txt = '热点概念排名：';
		var index = 0;
		var arr = getHotpoints(dateStr);

		arr.forEach((a) => {   // a = ['猪肉'， 13]
			txt += '【' + (++index) + '】' + 
				a[0] + '  ' + a[1].times + '    score:' + a[1].weight + '   \t\r\n';
		});
		return txt;
	};
	
	//param : {hotpointArr: ['光伏','储能'], type: 1, sort: 0}
	/*gainian  热点概念排序的索引 
	/*type  0 首板 ， 1 连板 , 2 all
	/*sort  0 得分 ， 1 高度
	/*
	//*/
	var getTickets = function(dateStr, obj) {      
		loadSheet(dateStr);
		// sort
		tickets.sort((a, b) => {
			if (obj && obj.sort == 1) {
				return b[Configure.title.dayNumber] - a[Configure.title.dayNumber];
			} else {
				return b[Configure.title.score] - a[Configure.title.score];
			}
			
		});
			
		// type
		var retArr = tickets;
		if (obj.type !== 2) {
			retArr= tickets.filter((t)=>{
				return obj.type === 1 ? t[Configure.title.dayNumber] > 1 : 
									t[Configure.title.dayNumber] == 1;
			});			
		}
		
		// gainian
		if (obj.hotpointArr && obj.hotpointArr.length != 0) {
			retArr = retArr.filter((t)=>{
				var isSelect = false;
				obj.hotpointArr.forEach((g)=> {
					if(t[Configure.title.reason].indexOf(g) != -1){
						isSelect = true;
					}
				})
				return isSelect;
			});	
		}
	
		return retArr;
	};
	
	
	// 根据hotpoint算出echelons
	var getEchelons = function(dateStr) {
		loadSheet(dateStr);
		if (!gaiNian) return [];
		var echelons = [];
		Configure.echelons.forEach((echelon)=>{
			var e = {};
			e.score = 0;
			e.name = echelon.name;
			e.hotPoints = echelon.hotPoints;
			echelon.hotPoints.forEach((hot)=>{
				if (gaiNian.has(hot)) {
					e.score += parseInt(gaiNian.get(hot).weight);
				}
			});
			echelons.push(e);
		});
		console.log(dateStr);
		console.log(gaiNian);
		console.log(echelons);
		echelons.sort((a, b) => {
			return b.score - a.score;
		})
		return echelons;
	};
	
	var clear = function() {
		tickets = [];
		gaiNian = new Map();
	};
	
	return {
		tickets: tickets,
		getHotpoints: getHotpoints,
		getHotpointstxt:getHotpointstxt,
		getTickets: getTickets,
		getEchelons:getEchelons
	}
})();