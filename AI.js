
var AI = (function(){
	var recommendText;
	var objStorage = LocalStore.getAll();
	var dataStorage = {};
	
	var RectifyDay_num = Configure.Days_Max_lengh;
	var Rectify_factor = 7;
	
	var dragonStage = ['启动', '发酵', '加速', /*'放量',*/'分歧', /*'反包',*/'盘顶', '退一', '退二','退三'];
	var cangMap = new Map([
		['冰点', {tips:'提防二次冰点，低位潜伏', stage:'退三', tactics:['博弈']}],    // 退三
		['二次冰点', {tips:'冰点衰竭，打板确认龙头', stage:'启动', tactics:['博弈']}],			
		['修复', {tips:'加仓，打板龙头和低位首发', stage:'发酵', tactics:['博弈']}],    	// 启动
		['持续修复', {tips:'去弱留强', stage:'加速', tactics:['主升']}],				// 发酵
		['分歧', {tips:'关注中位大长腿', stage:'分歧', tactics:['主升']}],    						
		['高潮', {tips:'注意中位分化，关注低位补涨', stage:'加速', tactics:['主升']}],		// 加速
		['继续高潮',{tips:'注意兑现风险，高位减仓止盈', stage:'盘顶', tactics:['主升']}],			
		['分化', {tips:'减仓至二成以下，避免中位吹哨人', stage:'分歧', tactics:['主升']}],			// 分歧
		['退潮', {tips:'空仓，关注缠打趋势型品种', stage:'退一', tactics:['退潮']}],				// 退一
		['持续退潮', {tips:'空头衰竭，选强低吸反核', stage:'退二', tactics:['退潮']}],			// 退二
		['混沌', {tips:'资金没有主攻方向，趋势低吸', stage:'退三', tactics:['博弈']}]
	]);
	
	var getAndUpdateLoacalstorage = function() {
		var dateArr = workbook.getDateArr((a,b)=>{
				return b - a;
		});
		var datestr = dateArr[0];
		var preDatestr = dateArr[1];
		if (objStorage[preDatestr]) {
			var sucessNum = 0;
			objStorage[preDatestr].tickits.forEach((name)=>{
				var ticket = parser.getTicket(datestr, name);
				if(ticket) {
					sucessNum ++;
				}
			})
			objStorage[preDatestr].sucessRate = parseFloat(sucessNum / objStorage[preDatestr].tickits.length).toFixed(2);
			//重新set更新后的结果
			LocalStore.set(preDatestr, objStorage[preDatestr]);
		}
		
		RectifyDay_num = dateArr.length > RectifyDay_num ? RectifyDay_num : dateArr.length;
		var num = 0;
		var total = 0;
		for (var i = 0; i < RectifyDay_num; i ++) {
			var obj = objStorage[dateArr[i]];
			if(obj && obj.sucessRate >= 0.5) {
				total += obj.scoreFator;
				num ++;
			}
		}
		// 计算 scoreFator
		var aveage = total/num;
		if (objStorage[preDatestr] && objStorage[preDatestr].sucessRate) {
			dataStorage.scoreFator = aveage && objStorage[preDatestr].scoreFator - aveage > 0 ? 
										aveage  - Rectify_factor : aveage + Rectify_factor;
		} else {
			dataStorage.scoreFator += Rectify_factor;
		}
		// 计算 bandScoreFator
		var param = {
			hotpointArr: [],
			type:2,
			sort:1
		}
		var tickets =  parser.getTickets(datestr, param);
		for(var i = 0; i < Configure.Band_miss_tickit_period, objStorage[dateArr[i]]; i ++) {   
			// 检查过去Band_miss_tickit_period天内是否有票出现在今天的首板
			objStorage[dateArr[i]].band_ticktes.forEach((bandTicket)=>{
				tickets.forEach((t)=>{
					if(bandTicket.name == t[Configure.title.name]) {
						var priceIncrease = (t[Configure.title.price] - bandTicket.price)/bandTicket.price;
						var startFator = objStorage[dateArr[i]].bandScoreFator;
						var preFaotor = objStorage[preDatestr].bandScoreFator;
						dataStorage.bandScoreFator = preFaotor - startFator > 0 ? 
										preFaotor + parseInt(startFator * priceIncrease) : 
										preFaotor - parseInt(startFator * priceIncrease);
								
					}
				})
			})
		}
	};
	
	var saveLoacalstorage = function(dataStorage) {
		console.log(dataStorage);
		var datestr = workbook.getLastDate();
		if (LocalStore.get(datestr)) {
			LocalStore.remove(datestr);
		}
		LocalStore.set(datestr, dataStorage);
	};
	
	var getAngle = function(p2, p1) {
		var radian = Math.atan2(p1.y - p2.y, p2.x - p1.x); // 返回来的是弧度
		var angle = 180 / Math.PI * radian; // 根据弧度计算角度
		return angle;
	};
	
	var getEmotionSuccessRate = function(emotion) {
		var dateArr = workbook.getDateArr((a,b)=>{
			return b - a;
		});
		var total = 0;
		var num = 0;
		var totalValue = 0;
		for (var i = 1; i <= RectifyDay_num; i ++) {
			if (objStorage[dateArr[i]] ) {
				total ++;
				if(objStorage[dateArr[i]].emotion == emotion) {
					num ++;
					totalValue += parseFloat(objStorage[dateArr[i]].sucessRate);
				}
			}
		}
		
		return num == 0 || 'NaN' ? '' : '前' +  total + '天出现' + 
			num + '次,成功率' + parseInt(totalValue * 100/num) + '%。';
	};
	var getEmotions = function() {
		var emotionPoints = canvas.getLastEmotionPoints(3);    
		var sumLevel = 0;
		var getLevel = function(point) {
			return Math.floor(point.value * 4/Configure.MAX_BEILI);
		}
		for(var i = 0; i < 3; i ++){
			sumLevel += getLevel(emotionPoints[i]);
		}
		var angle = getAngle(emotionPoints[0].point, emotionPoints[1].point);
		var value = parseFloat(emotionPoints[0].value);
		var level = getLevel(emotionPoints[0]) - sumLevel/3;
		if(value < Configure.MAX_BEILI / 8) {
			dataStorage.emotion = '冰点';
			if (parseFloat(emotionPoints[1].value) < Configure.MAX_BEILI / 4 || 
				parseFloat(emotionPoints[2].value) < Configure.MAX_BEILI / 4){
					dataStorage.emotion = '混沌';
			}
		} else if(value < Configure.MAX_BEILI / 4) {
			dataStorage.emotion = '冰点';
			if (parseFloat(emotionPoints[1].value) < Configure.MAX_BEILI / 4 || 
				parseFloat(emotionPoints[2].value) < Configure.MAX_BEILI / 4){
					dataStorage.emotion = '二次冰点';
			}
			// 混沌期 前5个交易日连扳背离率小于涨停背离率出现3次以上且值小于5为混沌期。
			var ePoints = canvas.getLastEmotionPoints(5, Configure.title2.lianbanzhishu); 
			var ztEPoints = canvas.getLastEmotionPoints(5, Configure.title2.zhangtingzhishu); 
			var n = 0;
			for(var i = 0 ; i < 5 ; i ++) {
				if(ztEPoints[i].value - ePoints[i].value > Configure.MAX_BEILI / 8 &&
					ePoints[i].value < Configure.MAX_BEILI / 2) {
					n ++;
				}
			}
			if(n >= 3) {
				dataStorage.emotion = '混沌';
			}
		} else if(value < Configure.MAX_BEILI / 2) {
			if(Math.abs(angle) < 30) dataStorage.emotion = '分歧';
			else {
				if(angle > 0) {
					dataStorage.emotion =  level > 0 ?  '修复' : '分歧';
				} else {
					dataStorage.emotion = level < 0 ?  '持续退潮' : '分歧';
				}
			}   
		} else if(value < Configure.MAX_BEILI * 3 / 4) {
			if(Math.abs(angle) < 30) dataStorage.emotion = '分歧';
			else  {
				if(angle > 0) {
					dataStorage.emotion = level > 0 ?  '持续修复' : '分歧';
				} else {
					dataStorage.emotion = level < 0 ?  '退潮' : '分歧';
				}
			}
		} else {
			dataStorage.emotion = '高潮';
			if (parseFloat(emotionPoints[1].value) > Configure.MAX_BEILI * 3 / 4 || 
				parseFloat(emotionPoints[2].value) > Configure.MAX_BEILI * 3 / 4){
				dataStorage.emotion = angle > 0 ? '继续高潮' : '分化';
			}
		}		
		return '情绪' + dataStorage.emotion + '，' + cangMap.get(dataStorage.emotion).tips + '。' + 
				getEmotionSuccessRate(dataStorage.emotion) + ' 窗口：[' + 
				cangMap.get(dataStorage.emotion).tactics.toString() + ']，';
	};
	
	// 根据题材、背离率、连扳和 封板强度 算最后的得分    
	var getFinalScroe = function(t, dateStr) {
		var emotionPoints = canvas.getLastEmotionPoints(1); 
		return parseInt(parseInt(t[Configure.title.score]) - 
				t[Configure.title.totalDivergence] * dataStorage.scoreFator + 
				// 情绪高位，板块越向低位找
				((Configure.MAX_BEILI / 2 - emotionPoints[0].value) * 3)* t[Configure.replaceTitleDate(Configure.title.dayNumber, dateStr)] +
				t[Configure.title.boardStrength].v * 10) +    // 封板强度 X10
				(Configure.isSZTicket(t[Configure.title.code]) ? 100 : 0);   // 深市票
	};
	
	var getBandtickets = function() {
		// 算斜率
		var szPoinsts = canvas.getLastSZPoints(Configure.Band_MA_NUM);    
		var sumAngle = 0;
		var sumValue = 0;
		for(var i = 0; i < Configure.Band_MA_NUM - 1; i ++){
			sumAngle += getAngle(szPoinsts[i].point, szPoinsts[i+1].point);
			sumValue +=  szPoinsts[i].value;    // 前Configure.Band_MA_NUM - 1天的和，还要加最后一天
		}
		dataStorage.sz_average_angle = parseFloat(sumAngle / Configure.Band_MA_NUM).toFixed(2);
		// 算sz和MA的背离率
		var MA_value = (sumValue + parseInt(szPoinsts[Configure.Band_MA_NUM - 1].value))/Configure.Band_MA_NUM;
		dataStorage.sz_ma_beili = parseFloat((szPoinsts[0].value - MA_value) / MA_value).toFixed(4);
		
		var txt = 'sz趋势' + (dataStorage.sz_average_angle > 0 ? '向上' : '向下，') + 'MA' + 
				Configure.Band_MA_NUM + '背离率' + (dataStorage.sz_ma_beili*100).toFixed(2) + '(%)，';
		//选出趋势票
		var tickets = parser.getBandTickets({hotpointArr:[], sort:2, type:3});
		tickets.sort((a, b)=>{
			return window.GetBandFinalScroe(b, dataStorage.bandScoreFator) - 
						window.GetBandFinalScroe(a, dataStorage.bandScoreFator);
		});
		if (/*Configure.debug*/false) {
			console.log('AI趋势得分排名:');
			tickets.forEach((t)=>{
				console.log(t[Configure.title.name] + '  ' + window.GetBandFinalScroe(t));
			})
		}

		var num = tickets.length >= 2 ? 2 : tickets.length;
		txt += '关注：';
		for(var i = 0; i < num; i ++ ) {
			txt += tickets[i][Configure.title.name] + ' ';
			dataStorage.band_ticktes.push({name:tickets[i][Configure.title.name], price: tickets[i][Configure.title.price]});
		}
		
		return txt;
	};
	var getTickits = function() {
		var dateStr = workbook.getLastDate();
		var echelons = parser.getEchelons(dateStr);
		var hotpoints = [];
		hotpoints = hotpoints.concat(echelons[0].hotPoints);
		//在排名靠前的梯队里面找
		echelons.forEach((echelon)=>{
			if (echelon.score > Configure.Echelons_show_min_score){
				hotpoints = hotpoints.concat(echelon.hotPoints);
			}
		})
		
		var param = {
			hotpointArr: hotpoints,
			type:2,
			sort:1
		}
		var tickets =  parser.getTickets(dateStr, param);
		tickets = tickets.filter((t)=>{
			return t[Configure.title.realHandoverPercent] < Configure.Dead_Handover &&       // 过滤掉换手率不符合的票
					t[Configure.title.realHandoverPercent] > Configure.Min_handover; //&&
					//t[Configure.replaceTitleDate(Configure.title.dayNumber, dateStr)] > 1;   //过滤掉1连扳的票，只能做趋势
		}); 
		tickets.sort((a, b)=>{
			return getFinalScroe(b, dateStr) - getFinalScroe(a, dateStr);
		});
		if (/*Configure.debug*/false) {
			console.log('AI超短得分排名:');
			tickets.forEach((t)=>{
				console.log(t[Configure.title.name] + '  ' + getFinalScroe(t, dateStr));
			})
		}
		var txt = '关注短线：';
		var num = tickets.length >= 3 ? 3 : tickets.length;
		for(var i = 0; i < num; i ++ ) {
			dataStorage.tickits.push(tickets[i][Configure.title.name]);
			txt += tickets[i][Configure.title.name] + ' ';
		}
		return txt;
	};
	var getTaticsTxt = function() {
		var retTxt = '';
		// 获取明天的交易计划
		var arr = workbook.getDatesSheet();
		var d = arr[arr.length-1];
		var titles = [Configure.title2.context, Configure.title2.qst1, 
				Configure.title2.qst2, Configure.title2.qst3, Configure.title2.qst4, 
				Configure.title2.currentOpt, Configure.title2.objOpt,
				 Configure.title2.optReason, Configure.title2.nextOpt];
		titles.forEach((t)=> {
			retTxt += '【' + t + '】:  ' + d[t] + '<br>';
		});
		retTxt += '--------------------------------------------------------------------------------------<br><br>';
		
		// 获取策略
		cangMap.get(dataStorage.emotion).tactics.forEach((t)=>{
			var tactic = workbook.getTactics(t);
			for (var prop in tactic) {
				retTxt += '【' + prop + '】:  ' + tactic[prop] + '<br>';
			}
			retTxt += '<br>';
		});
		return retTxt;
	};
	var clearAndInit = function() {
		dataStorage = {
		emotion:'',
		tickits:[],
		sucessRate:0,
		scoreFator: Configure.AI_Default_Factor,         // 默认值，localstorage没有值使用它；
		
		sz_average_angle:0,
		sz_ma_beili : 0,
		bandScoreFator: Configure.AI_Default_Band_Factor,   // 默认值，localstorage没有值使用它； 
		band_ticktes:[]
		};
	};
	var isBandInCharge = function() {
		return dataStorage.emotion == '混沌';
	};
	var getRecommend = function() {
		clearAndInit();
		// 更新获取storage的数据
		getAndUpdateLoacalstorage();
		
		recommendText = '【AI 提示】';
		recommendText += getEmotions();
		recommendText += isBandInCharge() ? getBandtickets() : getTickits();
		saveLoacalstorage(dataStorage);
		
		canvas.drawEmotionCycle(dragonStage, cangMap.get(dataStorage.emotion).stage);
		
		var displayColor = cangMap.get(dataStorage.emotion).tactics == '博弈' ? 'blue' :
					cangMap.get(dataStorage.emotion).tactics == '主升' ? 'red' : 'green';
		return {color: displayColor, txt: recommendText, tatics: getTaticsTxt()};
	};
	
	return {
		getRecommend:getRecommend
	}
})();