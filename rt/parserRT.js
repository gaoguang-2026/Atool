var parserRT = (function(){
	var rtRankData = new window.GaiData();
	
	var getGaiRankData = function() {
		return rtRankData;
	};
	var generateEchelons = function(gaiNianArr) {
		var rtEchelons = [];
		var alreadyInConfig = [];
		// configure 的echelon
		if(Configure.RT_echelon_contain_config) {
			Configure.echelons.forEach((echelon)=>{
				var e = {};
				e.score = 0;
				e.name = echelon.name;
				e.hotPoints = echelon.hotPoints.slice();
				e.hotPoints.forEach((hot)=>{
					var gFind = gaiNianArr.find((g)=>{
						return  g[Configure.titleGainian.name].includes(hot);
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
				return parseFloat(b.score) - parseFloat(a.score);
			});
			rtEchelons.forEach((e)=>{
				alreadyInConfig = alreadyInConfig.concat(e.hotPoints);
			})
		};
		
		var filterGai = function(g) {
			if(Configure.RT_echelon_contain_config) {
				return !alreadyInConfig.includes(g[Configure.titleGainian.name]) &&
				g[Configure.titleGainian.weight] > rtEchelons[rtEchelons.length-1].score;
			} else 
				return g[Configure.titleGainian.ticketNum] >= Configure.RT_show_min_rank_ticket_num;
		}

		for (var i = 0; i < gaiNianArr.length; i ++) {
			var g = gaiNianArr[i];
			if(filterGai(g)){ 
				var newEche = {};
				newEche.name = Configure.gaiBlackList_verbose.indexOf(g[Configure.titleGainian.name]) == -1 ? 
									'*' + g[Configure.titleGainian.name] : '$' + g[Configure.titleGainian.name] ;
				newEche.score = parseFloat(g[Configure.titleGainian.weight]).toFixed(3);   // 横向显示权重
				newEche.hotPoints = [g[Configure.titleGainian.name]];
				newEche.fund = 0;
				rtEchelons.push(newEche);
			}
		}
		rtEchelons.sort((a, b) => {
			return parseFloat(b.score) - parseFloat(a.score);
		});
		return rtEchelons; 
	};
	
	var generateGais = function(rtTickets){
		var retArr = [];
		if (!rtTickets) return retArr;
		var scoreTotal = 0;
		rtTickets.forEach((rtData)=>{
			var tGainArr = rtData['f103'].split(',');
			tGainArr.push(rtData['f100']);   // 加上行业
			tGainArr.forEach((gtxt)=>{
				if ( Configure.gaiBlackList_critical.indexOf(gtxt) == -1) {  // 过滤频繁出现的概念
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
		return retArr;
	};
	
	var parseAndStoreRTData = function(rtTickets = rtDataManager.getRTTicketsLeader()) {
		var retArr = generateGais(rtTickets);
		var retEchelons = generateEchelons(retArr);
		rtRankData.setRankDataFromNow(retArr.slice(0, retArr.length > Configure.RT_GAI_rank_max_length ?  
												Configure.RT_GAI_rank_max_length : retArr.length - 1), 
										retEchelons.splice(0, Configure.RT_echelons_max_num));
	};
	var getHistoryEchelonFromDateStr = function(echelon, dateStr) {
		var historyRTticketsLeader = rtDataManager.getHistoryRTticketsLeader(dateStr);
		var gaiNianArr = generateGais(historyRTticketsLeader);
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
		return e;
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
	var getScoreTotalByIndex = function(index) {
		var retScoreTotal = 0;
		if(rtRankData.getRankData().data[index]&& 
				rtRankData.getRankData().data[index].gaiRank) {
			rtRankData.getRankData().data[index].gaiRank.forEach((gai)=>{
				retScoreTotal += gai[Configure.titleGainian.score];
			});		
		}
		return retScoreTotal;
	};
	var getMaxScoreWithDaynum = function(rtShowDaynum = 1, type = 'echelon') {
		var max = 0;
		var length = rtShowDaynum * Configure.RT_data_length / Configure.RT_canvas_record_days_num;
		for(var i = Configure.RT_data_length - length; i < Configure.RT_data_length; i ++) {
			if(type == 'echelon') {
				rtRankData.getEchelons().forEach((e)=>{
				var tmpScore = getEchelonByIndex(e, i).score;
				max = max > tmpScore ? max : tmpScore;
				});
			} else if (type == 'total') {
				var tmpScoretotal = getScoreTotalByIndex(i);
				max = max > tmpScoretotal ? max : tmpScoretotal;
			}
		}
		return max;
	};
	var getRTEchelons = function() {
		// 选出全天最高的RT_echelons_max_num个 
		var topEchelons = rtRankData.getEchelons().slice(0, Configure.RT_echelons_max_num);
		
		// 更新当前的得分, 需要拷贝对象
		var gaiNianArr = rtRankData.getLastRankData();
		var retEchelons = [];
		var verboseEchelons = [];
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
			Configure.gaiBlackList_verbose.indexOf(newEche.name.substr(1, newEche.name.length - 1)) != -1 ? 
							 verboseEchelons.push(newEche) : retEchelons.push(newEche);
		});
		var sort = function(a, b){
			return parseFloat(b.score) - parseFloat(a.score);
		};
		return retEchelons.sort(sort).concat(verboseEchelons.sort(sort));  // 分开排序
	};
	
	/* 
	* Param 见 parser getTickets， type = 5 排名
	*/
	var getRankTickets = function(datestr, param) {
		var ticketsArr = [];
		var tDatas = Configure.getMode() == Configure.modeType.DP ? 
							rtDataManager.getRTTicketsLeader() : 
							rtDataManager.getHistoryRTticketsLeader(datestr);

		tDatas.forEach((tData)=>{
			var tTemp = ticketsArr.find((t)=>{
				return t[Configure.title.name] == tData['f14'];
			});
			if (!tTemp) {
				var tnew = {};
				tnew[Configure.title.code] = tData['f12'];
				tnew[Configure.title.name] = tData['f14'];
				tnew[Configure.title.price] = parseFloat(tData['f2']/100);
				tnew[Configure.title.value] = tData['f21'];
				tnew[Configure.title.totalValue] = tData['f20'];
				tnew[Configure.title.handoverPercent] = tData['f8'];
				tnew[Configure.title.gainian] = tData['f103'];
				tnew[Configure.title.industry] = tData['f100'];
				tnew[Configure.title.time] = '' + tData['f26'];
				tnew[Configure.title.rise_5] = parseFloat(tData['f109']/100);
				tnew[Configure.title.rise_10] = parseFloat(tData['f160']/100);
				tnew[Configure.title.rise_20] = parseFloat(tData['f110']/100);
				tnew[Configure.title.rise_1] = parseFloat(tData['f3']/100);
				ticketsArr.push(tnew);
			}
		});
		// 如果没有抓取的数据就从默认的表格中取数据
		if (ticketsArr.length == 0) {   
			ticketsArr = workbook.getRankTickets();
		}
		
		if (param.hotpointArr && param.hotpointArr.length != 0) {
			ticketsArr = ticketsArr.filter((t)=>{
				var isSelect = false;
				param.hotpointArr.find((hotpoint)=>{
					if (t[Configure.title.gainian].includes(hotpoint) || 
							t[Configure.title.industry].includes(hotpoint)) {// 加上行业
						isSelect = true;
					};   
				});
				return param.other ? !isSelect : isSelect;
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
			
			var dataT = rtDataManager.getRTTicketFromCode(ticket[Configure.title.code]);
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
					!Configure.isSuspend(t[Configure.title.price]) && 
					!Configure.isBJTicket(t[Configure.title.code])) {
					if(tagObj.tagDes == '补涨新发') {
						var rise_20 = parseFloat(t[Configure.title.rise_20] == '--' ? 0 : t[Configure.title.rise_20]);
						var rise_10 = parseFloat(t[Configure.title.rise_10] == '--' ? 0 : t[Configure.title.rise_10]);
						var rise_5 = parseFloat(t[Configure.title.rise_5] == '--' ? 0 : t[Configure.title.rise_5]);
						var rise_1 = parseFloat(t[Configure.title.rise_1]);
						if(rise_20 <= rise_10 && 
							rise_10 <= 1.5 * rise_5 &&
							rise_5 <= 2 * rise_1 && 
							rise_5 >= 6) {
								t[Configure.title.dragonTag] = tagObj;
							};
					} else {
						t[Configure.title.dragonTag] = tagObj;
						tagObj = undefined;
					}
				}
			});
		}
		tagDargon(Configure.title.rise_20, {tagDes:'高度龙头', style: 'orange'});
		tagDargon(Configure.title.rise_5, {tagDes:'强度龙头', style: 'blue'});
		tagDargon(Configure.title.riseTotal, {tagDes:'总龙', style: 'pink bold'});
		tagDargon(Configure.title.rise_1, {tagDes:'补涨新发', style: 'LightYellow'});

		ticketsArr.sort((a, b)=>{
			var title;
			var reverse = false;
			switch(param.sort) {
				case 1:
					title = Configure.title.rise_20;
					break;
				case 2:
					title = Configure.getMode() == Configure.modeType.DP ?
									Configure.title.f3 : Configure.title.rise_5;
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

	return {
		parseAndStoreRTData:parseAndStoreRTData,
		getRTEchelons:getRTEchelons,
		getGaiRankData:getGaiRankData,
		getEchelonByIndex:getEchelonByIndex,
		getMaxScoreWithDaynum:getMaxScoreWithDaynum,
		getRankTickets:getRankTickets,
		getHistoryEchelonFromDateStr:getHistoryEchelonFromDateStr,
		getScoreTotalByIndex:getScoreTotalByIndex,
	}
})();