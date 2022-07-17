
var AI = (function(){
	var recommendText = '';
	var dataStorage = {
		emotion:'',
		tickits:[],
		sucessRate:0,
		scoreFator: 50         // 默认值，localstorage没有值使用它； 越大结构权重越大，越小题材权重越小
	};
	
	var RectifyDay_num = 30;
	var Rectify_factor = 7;
	
	var cangMap = new Map([
		['修复', '加仓，六成'],
		['持续修复', '仓位五层'],
		['高潮', '注意兑现风险，减仓'],
		['继续高潮', '注意兑现风险，减仓'],
		['高位分化', '减仓至二成以下'],
		['退潮', '空仓'],
		['持续退潮', '空仓'],
		['冰点', '提防二次冰点，适当开仓']
	]);
	
	var getAndUpdateLoacalstorage = function() {
		var dateArr = workbook.getDateArr((a,b)=>{
				return b - a;
		});
		var datestr = dateArr[0];
		var preDatestr = dateArr[1];
		var objStorage = LocalStore.getAll();
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
			if(obj && obj.sucessRate > 0.5) {
				total += obj.scoreFator;
				num ++;
			}
		}
		var aveage = total/num;
		if (objStorage[preDatestr].sucessRate) {
			dataStorage.scoreFator = objStorage[preDatestr].scoreFator - aveage > 0 ? 
					aveage - Rectify_factor : aveage + Rectify_factor;
		} else {
			dataStorage.scoreFator +=  Rectify_factor;
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
		var radian = Math.atan2(p1.y - p2.y, p1.x - p2.x); // 返回来的是弧度
		var angle = 180 / Math.PI * radian; // 根据弧度计算角度
		return angle;
	};
	var getEmotions = function() {
		var emotionPoints = canvas.getLastEmotionPoints(2);    // 
		var angle = getAngle(emotionPoints[0].point, emotionPoints[1].point);
		var value = parseFloat(emotionPoints[0].value);
		if (angle > 45) {
			if (value < 5) {
				dataStorage.emotion = '修复';
			} else {
				dataStorage.emotion = '高潮';
			}
		} else if(angle < -45) {
			if (value > 5) {
				dataStorage.emotion = '高位分化';
			} else {
				dataStorage.emotion = '退潮';
			}
		} else if (Math.abs(angle) < 30) {
			if(value < 2.5) dataStorage.emotion = '冰点';
			else if (value > 7) dataStorage.emotion = '继续高潮';
			else if (angle > 0) dataStorage.emotion = '持续修复';
			else dataStorage.emotion = '持续退潮';
		} else {
			dataStorage.emotion = '持续修复';
		};
		
		
		return '情绪' + dataStorage.emotion + '，' + cangMap.get(dataStorage.emotion) + '。';
		
	};
	
	// 根据题材和背离率算最后的得分
	var getFinalScroe = function(t) {
		return  parseInt(t[Configure.title.score]) - 
				t[Configure.title.totalDivergence] * dataStorage.scoreFator;
	};
	var getTickits = function() {
		var dateStr = workbook.getLastDate();
		var echelons = parser.getEchelons(dateStr);
		var hotpoints = [];
		hotpoints = hotpoints.concat(echelons[0].hotPoints);
		//如果梯队一与梯队二得分相差很小，选用两个梯队的票
		if(echelons[0].score - echelons[1].score < 7) {
			hotpoints = hotpoints.concat(echelons[1].hotPoints);
		}
		
		var param = {
			hotpointArr: hotpoints,
			type:1,
			sort:1
		}
		var tickets =  parser.getTickets(dateStr, param);
		tickets.sort((a, b)=>{
			return getFinalScroe(b) - getFinalScroe(a);
		});
		
		var txt = '今日关注：';
		var num = tickets.length > 3 ? 3 : tickets.length;
		for(var i = 0; i < num; i ++ ) {
			dataStorage.tickits.push(tickets[i][Configure.title.name]);
			txt += tickets[i][Configure.title.name] + '  ';
		}
		
		return txt;
	};
	var getRecommend = function() {
		// 更新获取storage的数据
		getAndUpdateLoacalstorage();
		
		recommendText += getEmotions();
		recommendText += getTickits();
		
		saveLoacalstorage(dataStorage);
		return recommendText;
	};
	
	return {
		getRecommend:getRecommend
	}
})();