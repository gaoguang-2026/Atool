
var AI = (function(){
	var recommendText;
	var objStorage = LocalStore.getAll();
	var dataStorage = {
		emotion:'',
		tickits:[],
		sucessRate:0,
		scoreFator: Configure.AI_Default_Factor,         // 默认值，localstorage没有值使用它；
		
		sz_average_angle:0,
		sz_ma_beili : 0,
		bandScoreFator: Configure.AI_Default_Band_Factor,   // 默认值，localstorage没有值使用它； 
		band_ticktes:[]
	};
	
	var RectifyDay_num = Configure.Days_Max_lengh;
	var Rectify_factor = 7;
	
	var cangMap = new Map([
		['冰点', '（退三）提防二次冰点，打板确认龙头，预期修复'],   // 退三
		['二冰', '（退三）冰点衰竭，打板确认龙头，预期修复'],
		['修复', '（启动）加仓，5成以上，盯住龙头和低位首发'],    	// 启动
		['持续修复', '（发酵）去弱留强，尝试低位补涨'],				// 发酵
		['高潮', '（加速）注意中位分化，关注低位补涨和龙头'],		// 加速
		['继续高潮', '（加速）注意兑现风险，高位减仓止盈'],			// 中位
		['分化', '（分歧）减仓至二成以下，避免中位吹哨人'],			// 分歧
		['退潮', '（退一）空仓，关注缠打趋势型品种'],				// 退一
		['持续退潮', '（退二）空仓，尝试低吸中位大长腿']			// 退二
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
		
		return num == 0 ? '' : '前' +  total + '天出现' + 
			num + '次,成功率' + parseInt(totalValue * 100/num) + '%。';
	};
	var getEmotions = function() {
		var emotionPoints = canvas.getLastEmotionPoints(3);    
		var angle = getAngle(emotionPoints[0].point, emotionPoints[1].point);
		var value = parseFloat(emotionPoints[0].value);
		if (angle > 30) {
			if (value < 5) {
				dataStorage.emotion = '修复';
			} else {
				dataStorage.emotion = '高潮';
			}
		} else if(angle < -30) {
			if (value > 5) {
				dataStorage.emotion = '分化';
			} else {
				dataStorage.emotion = '退潮';
			}
		} else if (Math.abs(angle) < 30) {
			if(value < 2.5) {
				dataStorage.emotion = '冰点';
				if (parseFloat(emotionPoints[1].value) < 2.5 && 
					parseFloat(emotionPoints[2].value)){
						dataStorage.emotion = '二次冰点';
					}
			}
			else if (value > 7) dataStorage.emotion = '继续高潮';
			else {
				dataStorage.emotion = angle > 0 ?'持续修复' :  dataStorage.emotion = '持续退潮';
			}
		}
		
		return '短线情绪' + dataStorage.emotion + '，' + cangMap.get(dataStorage.emotion) + '。' +
				getEmotionSuccessRate(dataStorage.emotion);
		
	};
	
	// 根据题材、背离率、连扳和 封板强度 算最后的得分    
	var getFinalScroe = function(t) {
		var emotionPoints = canvas.getLastEmotionPoints(1); 
		return parseInt(parseInt(t[Configure.title.score]) - 
				t[Configure.title.totalDivergence] * dataStorage.scoreFator + 
				(10 - emotionPoints[0].value)* Configure.getDayBoard(t[Configure.title.boardAndDay]).b + 
				t[Configure.title.boardStrength].v * 10);   // 封板强度 X10
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
		
		var txt = '';
		if(dataStorage.sz_average_angle > 0 && dataStorage.sz_ma_beili > 0 
			|| Configure.debug) {
		//	txt += '上证背离率' + dataStorage.sz_ma_beili*100 + '%(angle:' + dataStorage.sz_average_angle + '),趋势关注：';
			//选出趋势票
			var tickets = parser.getBandTickets({hotpointArr:[], sort:2, type:3});
			tickets.sort((a, b)=>{
				return window.GetBandFinalScroe(b, dataStorage.bandScoreFator) - 
							window.GetBandFinalScroe(a, dataStorage.bandScoreFator);
			});
			if (Configure.debug) {
				console.log('AI趋势得分排名:');
				tickets.forEach((t)=>{
					console.log(t[Configure.title.name] + '  ' + window.GetBandFinalScroe(t));
				})
			}

			var num = tickets.length > 1 ? 1 : tickets.length;
			for(var i = 0; i < num; i ++ ) {
				txt += tickets[i][Configure.title.name];
				dataStorage.band_ticktes.push({name:tickets[i][Configure.title.name], price: tickets[i][Configure.title.price]});
			}
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
			type:1,
			sort:1
		}
		var tickets =  parser.getTickets(dateStr, param);
		tickets.sort((a, b)=>{
			return getFinalScroe(b) - getFinalScroe(a);
		});
		if (Configure.debug) {
			console.log('AI超短得分排名:');
			tickets.forEach((t)=>{
				console.log(t[Configure.title.name] + '  ' + getFinalScroe(t));
			})
		}
		
		var bandTxt = getBandtickets();
		var num = bandTxt == '' ?  3 : 2;
		var txt = '';
		for(var i = 0; i < num; i ++ ) {
			dataStorage.tickits.push(tickets[i][Configure.title.name]);
			txt += tickets[i][Configure.title.name] + ' ';
		}
		return txt;
	};
	var getRecommend = function() {
		// 更新获取storage的数据
		getAndUpdateLoacalstorage();
		
		recommendText = '【AI 提示】';
		recommendText += getEmotions();
		recommendText += '今日关注：';
		recommendText += getTickits();
		recommendText += getBandtickets() == '' ?  '' : 
					'(~)' + getBandtickets() + ' ';
		
		saveLoacalstorage(dataStorage);
		return recommendText;
	};
	
	return {
		getRecommend:getRecommend
	}
})();