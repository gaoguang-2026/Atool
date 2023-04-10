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
				var bData = workbook.getRTTicketFromCode(b[Configure.title.code]);
				var aData = workbook.getRTTicketFromCode(a[Configure.title.code]);
				if(bData && bData['f3'] && aData && aData['f3']) {
					return bData['f3'] - aData['f3'] ;
				} else {
					return b.increaseRate - a.increaseRate;
				}
				
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
	/*type  0 首板 ， 1 连板 , 2 涨停,  3 科创 4 中军趋势  5排名 6 全部
	/*sort  0 得分 ， 1 高度,  2 涨速
	/*other  true 热点外的其他票
	//*/
	var getTickets = function(dateStr, obj) {
		if(obj.type == 4) {
			return getBandTickets(obj);
		};
		
		loadSheet(dateStr);
		// sort
		tickets.sort((a, b) => {
			if (obj && obj.sort == 1) {
				if(obj.type == 0) {
					return  b[Configure.title.boardAndDay] - a[Configure.title.boardAndDay];
				} else {
					return b[Configure.replaceTitleDate(Configure.title.dayNumber, dateStr)]  - 
						a[Configure.replaceTitleDate(Configure.title.dayNumber, dateStr)] ;
				}
			} else if (obj && obj.sort == 2){
				var bData = workbook.getRTTicketFromCode(b[Configure.title.code]);
				var aData = workbook.getRTTicketFromCode(a[Configure.title.code]);
				if(bData && bData['f3'] && aData && aData['f3']) {
					return bData['f3'] - aData['f3'] ;
				} else {
					return 0;
				}
			} else {
				return b[Configure.title.score] - a[Configure.title.score];
			}
			
		});
			
		// type
		var retArr = tickets;
		if (obj.type == 0 || obj.type == 1) {
			retArr= tickets.filter((t)=>{
				return obj.type === 1 ?  t[Configure.replaceTitleDate(Configure.title.dayNumber, dateStr)] > 1 : 
									t[Configure.replaceTitleDate(Configure.title.dayNumber, dateStr)] == 1;
			});			
		} else if (obj.type == 3) { // 科创
			retArr= tickets.filter((t)=>{
				return Configure.isKechuangTicket(t[Configure.title.code]);
			});			
		} else if (obj.type == 2){
			// type = 2, 过滤掉跌停和炸板
			retArr= tickets.filter((t)=>{
				return Configure.isFloorOrFailed(t, dateStr);
			});	
		} else {
			// type = 6  do nothing
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
		// 计算梯队的短线资金量
		function calEchelonFund(hotPoints) {
			var fundtotal = 0;
			var param = {
				hotpointArr: hotPoints,
				type:2,
				sort:1
			}
			var tickets = getTickets(dateStr, param);
			tickets.forEach((t)=>{
				fundtotal += t[Configure.title.realHandoverPercent] * t[Configure.title.realValue] / 100;
			})
			fundtotal = (fundtotal / 100000000).toFixed(2);
			return fundtotal;
		};
		//////
		// configure 的echelon
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
			e.fund = calEchelonFund(e.hotPoints);
			echelons.push(e);
		});
			
		//如果某个概念大于echelons前三名得分，分离出来单独做echelon.
		for (var [name, value] of gaiNian) {
			if(value.weight >= echelons[2].score &&        //得分大于等于第三名
				value.weight > Configure.Echelons_show_min_score ){ 
				var newEche = {};
				newEche.name = '*' + name;
				newEche.score = parseInt(value.weight);
				newEche.hotPoints = [name];
				newEche.fund = calEchelonFund(newEche.hotPoints);
				echelons.push(newEche);
			}

		}
		echelons.sort((a, b) => {
			return b.score - a.score;
		});  
		
		var retEchelons = echelons.filter((e)=>{
			return e.score > Configure.Echelons_show_min_score;
		});
		
		return retEchelons.length == 0 ? echelons.splice(0,3) : retEchelons;
	};
	
	/* 
	* Param 见 getTickets， type = 5 排名
	*/
	var getRankTickets = function(param) {
		var ticketsArr = [];
		if(Configure.getMode() == Configure.modeType.DP) {
			var tDatas = workbook.getRTTicketsLeader();
			tDatas.forEach((tData)=>{
				var tTemp = ticketsArr.find((t)=>{
					return t[Configure.title.name] == tData['f14'];
				});
				if (!tTemp) {
					var tnew = {};
					tnew[Configure.title.code] = tData['f12'];
					tnew[Configure.title.name] = tData['f14'];
					tnew[Configure.title.price] = tData['f2'];
					tnew[Configure.title.value] = tData['f21'];
					tnew[Configure.title.totalValue] = tData['f20'];
					tnew[Configure.title.handoverPercent] = tData['f8'];
					tnew[Configure.title.gainian] = tData['f103'];
					tnew[Configure.title.time] = '' + tData['f26'];
					tnew[Configure.title.rise_5] = parseFloat(tData['f109']/100);
					tnew[Configure.title.rise_10] = parseFloat(tData['f160']/100);
					tnew[Configure.title.rise_20] = parseFloat(tData['f110']/100);
					tnew[Configure.title.f3] = parseFloat(tData['f3']/100);
					ticketsArr.push(tnew);
				}
			});
		}

		// 如果没有抓取的数据就从默认的表格中取数据
		if (ticketsArr.length == 0 || Configure.getMode() == Configure.modeType.FP) {   
			ticketsArr = workbook.getRankTickets();
		}
		
		if (param.hotpointArr && param.hotpointArr.length != 0) {
			ticketsArr = ticketsArr.filter((t)=>{
				return param.hotpointArr.find((hotpoint)=>{
					return t[Configure.title.gainian].includes(hotpoint);
				});
			});
		}
		ticketsArr.forEach((ticket)=>{
			// 平均涨速 = MA20 + MA10 + MA5
			var sum_5 = 0, sum_10 = 0, sum_20 = 0;
			sum_5 = !!parseFloat(ticket[Configure.title.rise_5]) ? parseFloat(ticket[Configure.title.rise_5]) : 0;
			sum_10 = !!parseFloat(ticket[Configure.title.rise_10]) ? parseFloat(ticket[Configure.title.rise_10]) : 0;
			sum_20 = !!parseFloat(ticket[Configure.title.rise_20]) ? parseFloat(ticket[Configure.title.rise_20]) : 0;
			ticket[Configure.title.increaseRate] = parseFloat(sum_5/5 + sum_10/10 + sum_20/20).toFixed(2);
			
			ticket[Configure.title.riseTotal] = sum_5 + sum_10 + sum_20;
			
			var dataT = workbook.getRTTicketFromCode(ticket[Configure.title.code]);
			ticket[Configure.title.f3] = dataT && dataT['f3']!='-' ? parseFloat(dataT['f3']/100) : '-20';  //排名用
		});
		
		//  标记龙头
		var tagDargon = function(title, tagObj){
			ticketsArr.sort((a, b)=>{
				return (parseInt(b[title] == '--' ? 0 : b[title]) - parseInt(a[title] == '--' ? 0 : a[title]));
			});
			ticketsArr.forEach((t, index) => {
				if(title == Configure.title.riseTotal) {
					t[Configure.title.index] = index + 1;
				}
				if(tagObj && !Configure.isNew(t[Configure.title.time]) &&
					!Configure.isSuspend(t[Configure.title.price])) {
					t[Configure.title.dragonTag] = tagObj;
					tagObj = undefined;
				}
			});
		}
		tagDargon(Configure.title.rise_20, {tagDes:'高度龙头', style: 'orange'});
		tagDargon(Configure.title.rise_5, {tagDes:'强度龙头', style: 'blue'});
		tagDargon(Configure.title.riseTotal, {tagDes:'总龙', style: 'pink bold'});

		ticketsArr.sort((a, b)=>{
			var title;
			var reverse = false;
			switch(param.sort) {
				case 1:
					title = Configure.title.rise_20;
					break;
				case 2:
					title = Configure.title.f3;
					break;
				case 0:
				default:
					title = Configure.title.index;
					reverse = true;
					break;
			}
			return reverse ? (parseInt(a[title] == '--' ? 0 : a[title]) - parseInt(b[title] == '--' ? 0 : b[title])) :
								(parseInt(b[title] == '--' ? 0 : b[title]) - parseInt(a[title] == '--' ? 0 : a[title]));
		});
		return ticketsArr;
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
		getRankTickets:getRankTickets,
		getBoardHeight:getBoardHeight
	}
})();