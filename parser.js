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
			
			var dragon = dragons.getDragonStandard(
						Configure.getDayBoard(ticket[Configure.title.boardAndDay]).b, ticket[Configure.title.code]);
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
			if(a[1].times >= Configure.MIN_KAINIAN) {
				txt += '【' + (++index) + '】' + 
				a[0] + '  ' + a[1].times + '    score:' + a[1].weight + '   \t\r\n';
			}
		});
		return txt;
	};
	
	var getTicket = function(datestr, name) {
		loadSheet(datestr);
		var ret;
		tickets.forEach((t) => {
			if(t[Configure.title.name] == name){
				ret = t;
			}
		});
		return ret;
	};
	
	var getBandTickets = function(obj) {
		var retArr = workbook.getBandTickets();
		// sort
		retArr.sort((a, b) => {
			if (obj && obj.sort == 2) {
				return b.increaseRate - a.increaseRate;
			} else if (obj.sort == 0){
				return b[Configure.title.score] - a[Configure.title.score];
			} else {
				return b[Configure.title.realValue] - a[Configure.title.realValue];
			}
			
		});
		
		// gainian
		if (obj.hotpointArr && obj.hotpointArr.length != 0) {
			retArr = retArr.filter((t)=>{
				var isSelect = false;
				obj.hotpointArr.forEach((g)=> {
					if(t[Configure.replaceTitleDate(Configure.title.reason,t.selectDate)].indexOf(g) != -1){
						isSelect = true;
					}
				})
				return obj.other ? !isSelect : isSelect;
			});	
		}
		return retArr;
	};
	
	//param : {hotpointArr: ['光伏','储能'], type: 1, sort: 0, other: false}
	/*hotpointArr  热点概念排序的索引 
	/*type  0 首板 ， 1 连板 , 2 全部, 3 趋势  4 科创
	/*sort  0 得分 ， 1 高度,  2 涨速
	/*other  true 热点外的其他票
	//*/
	var getTickets = function(dateStr, obj) {
		if(obj.type == 3) {
			return getBandTickets(obj);
		};
		
		loadSheet(dateStr);
		// sort
		tickets.sort((a, b) => {
			if (obj && obj.sort == 1) {
				if(obj.type == 0) {
					return  b[Configure.title.boardAndDay] - a[Configure.title.boardAndDay];
				} else {
					return Configure.replaceTitleDate(b[Configure.title.dayNumber], dateStr)  - 
						Configure.replaceTitleDate(a[Configure.title.dayNumber], dateStr) ;
				}
			} else {
				return b[Configure.title.score] - a[Configure.title.score];
			}
			
		});
			
		// type
		var retArr = tickets;
		if (obj.type == 0 || obj.type == 1) {
			retArr= tickets.filter((t)=>{
				return obj.type === 1 ?  Configure.replaceTitleDate(t[Configure.title.dayNumber], dateStr) > 1 : 
									Configure.replaceTitleDate(t[Configure.title.dayNumber], dateStr) == 1;
			});			
		} else if (obj.type == 4) { // 科创
			retArr= tickets.filter((t)=>{
				return Configure.isKechuangTicket(t[Configure.title.code]);
			});			
		} else {
			// type = 2, do nothing.
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
				return obj.other ? !isSelect : isSelect;
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
			e.hotPoints = echelon.hotPoints.slice();
			echelon.hotPoints.forEach((hot)=>{
				if (gaiNian.has(hot)) {
					e.score += parseInt(gaiNian.get(hot).weight);
				}
			});
			echelons.push(e);
		});
		echelons.sort((a, b) => {
			return b.score - a.score;
		})
		//如果某个概念大于echelons前三名得分，分离出来单独做echelon.
		var newEchelons = [];
		for (var [name, value] of gaiNian) {
			if(value.weight > echelons[2].score &&        //得分大于第三名
				value.weight > Configure.Echelons_show_min_score ){ 
				var newEche = {};
			/*	echelons.forEach((e)=>{
					if(e.hotPoints.indexOf(name) != -1) {
						e.hotPoints.splice(e.hotPoints.indexOf(name), 1);
						e.score -=  parseInt(value.weight);
					}
				}) */
				newEche.name = '*' + name;
				newEche.score = parseInt(value.weight);
				newEche.hotPoints = [name];
				newEchelons.push(newEche);
			}

		}
		echelons = echelons.concat(newEchelons);
		echelons.sort((a, b) => {
			return b.score - a.score;
		})   
		return echelons;
	};
	// 获取行业
	//param : {hotpointArr: ['光伏','储能'], type: 1, sort: 0, other: false}
	/*hotpointArr  热点概念排序的索引 
	/*type  0 首板 ， 1 连板 , 2 全部, 3 趋势  4 科创 5 行业
	/*sort  0 得分 ， 1 高度,  2 涨速
	/*other  true 热点外的其他票
	//*/
	var getIndustry = function(param) {
		var ticketsArr = workbook.getAllTickets();
		if (param.hotpointArr && param.hotpointArr.length != 0) {
			ticketsArr = ticketsArr.filter((t)=>{
				return param.hotpointArr.find((hotpoint)=>{
					return t[Configure.title.gainian].includes(hotpoint);
				});
			});
		}
		
		var retArr = [];
		ticketsArr.forEach((ticket)=>{
			var industry = retArr.find((item)=>{
				return item[Configure.titleIndustry.name] == ticket[Configure.title.industry];
			});
			if(!industry) {
				//初始化这个行业
				industry = {};
				industry[Configure.titleIndustry.name] = ticket[Configure.title.industry];
				industry[Configure.titleIndustry.value_100] = 0;
				industry[Configure.titleIndustry.value_250] = 0;
				industry[Configure.titleIndustry.value_500] = 0;
				industry[Configure.titleIndustry.totalValue] = 0;
				industry[Configure.titleIndustry.rise_d20_0] = 0;
				industry[Configure.titleIndustry.rise_d20_10] = 0;
				industry[Configure.titleIndustry.rise_d20_20] = 0;
				industry[Configure.titleIndustry.average_20_rise] = 0;
				industry[Configure.titleIndustry.total] = 0;
				retArr.push(industry);
			} 
			if(parseInt(ticket[Configure.title.totalValue]) < 100 * 100000000)  industry[Configure.titleIndustry.value_100] ++;
			else if(parseInt(ticket[Configure.title.totalValue]) < 500 * 100000000) industry[Configure.titleIndustry.value_250] ++;
			else  industry[Configure.titleIndustry.value_500] ++;
			industry[Configure.titleIndustry.totalValue] += parseInt(ticket[Configure.title.totalValue]) ? 
											parseInt(ticket[Configure.title.totalValue]/100000000) : 0;
			if(parseInt(ticket[Configure.title.rase_20]) < 0) industry[Configure.titleIndustry.rise_d20_0]++;
			else if(parseInt(ticket[Configure.title.rase_20]) < 10) industry[Configure.titleIndustry.rise_d20_10]++;
			else industry[Configure.titleIndustry.rise_d20_20] ++;
			industry[Configure.titleIndustry.average_20_rise] += parseInt(ticket[Configure.title.rase_20]) ? 
														parseInt(ticket[Configure.title.rase_20]) : 0;
			industry[Configure.titleIndustry.total]++;
		});
		//算平均涨幅
		retArr.forEach((industry)=>{
			industry[Configure.titleIndustry.average_20_rise] = parseFloat(industry[Configure.titleIndustry.average_20_rise]/
								industry[Configure.titleIndustry.total]).toFixed(2);
		})
		retArr.sort((a, b)=>{
			var title;
			switch(param.sort) {
				case 1:
					title = Configure.titleIndustry.totalValue;
					break;
				case 2:
					title = Configure.titleIndustry.average_20_rise;
					break;
				case 0:
				default:
					title = Configure.titleIndustry.total;
					break;
			}
			return parseInt(b[title]) - parseInt(a[title]);
		});
		return retArr;
	};
	
	// 根据hotpoint算出echelons
	var getCombinedEchelon = function(dateStr, echelonNames) {
		var echelons = getEchelons(dateStr);
		var combinedEchelon = {
			name:'',
			hotPoints: [],
			score: 0
		};
		if (echelonNames) {
			combinedEchelon.name = echelonNames.toString();
			echelonNames.forEach((name)=>{
				echelons.forEach((echelon)=>{
					if (echelon.name == name) {
						combinedEchelon.hotPoints = combinedEchelon.hotPoints.concat(echelon.hotPoints);
						combinedEchelon.score += parseInt(echelon.score);
					}
				});
			});
		} else {
			combinedEchelon.name = '全部';
			echelons.forEach((echelon)=>{
				combinedEchelon.hotPoints = combinedEchelon.hotPoints.concat(echelon.hotPoints);
				combinedEchelon.score += parseInt(echelon.score);
			});
		}
		return combinedEchelon;
	};
	
	var getBoardHeight = function(dateStr, titleName) {
		loadSheet(dateStr);
		tickets.sort((a, b) => {
			return b[titleName] - a[titleName];
		})
		return {name: tickets[0][Configure.title.name], value:tickets[0][titleName]};
	};
	
	var clear = function() {
		tickets = [];
		gaiNian = new Map();
	};
	
	return {
		getHotpoints: getHotpoints,
		getHotpointstxt:getHotpointstxt,
		getTickets: getTickets,
		getTicket:getTicket,
		getBandTickets:getBandTickets,
		getEchelons:getEchelons,
		getCombinedEchelon:getCombinedEchelon,
		getIndustry:getIndustry,
		getBoardHeight:getBoardHeight
	}
})();