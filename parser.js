var parser = (function(){
	var tickets;   // 所有股票
	var gaiNian = new Map();   // 所有概念  元素【概念，{times，weight}】:['猪肉'， {13, 0.24}]
		
	var init = function(data) {
		this.tickets = data;
		var totalscored = 0;      // 出现次数*该股票的连扳数*Configure.HIGH_factor，做后面计算权重的分母
		this.tickets.forEach((ticket) => {
			var reasons = ticket[Configure.title.reason].split('+');
			reasons.forEach((r) => {
				if (gaiNian.has(r)) {
					gaiNian.set(r, {times:gaiNian.get(r).times + 1,
									weight:gaiNian.get(r).weight + 
									ticket[Configure.title.dayNumber] * Configure.HIGH_factor});
				} else {
					// 初始化这个概念, 此时的weight保存次数*股票的连扳数之和
					gaiNian.set(r, {times:1, 
						weight:ticket[Configure.title.dayNumber] * Configure.HIGH_factor});           
				}
				totalscored += ticket[Configure.title.dayNumber] * Configure.HIGH_factor;
			});
		});
		console.log(totalscored);
		console.log(gaiNian);

		//根据概念的权重计算每只股票的得分
		this.tickets.forEach((ticket) => {
			var reasons = ticket[Configure.title.reason].split('+');
			ticket[Configure.title.score] = 0;   //初始化
			reasons.forEach((r) => {
				ticket[Configure.title.score] += gaiNian.get(r).weight;
			});
			ticket[Configure.title.score] = parseInt(ticket[Configure.title.score]/totalscored * 1000);
		})
		
	};
	
	var getRedianGainian = function() {
		var gaiNianArr = Array.from(gaiNian);
		gaiNianArr.sort((a, b)=> {
			return b[1].times - a[1].times;
		});
		return gaiNianArr;
	};
	
	var getRedianGainiantxt = function() {
		var txt = '热点概念排名：';
		var index = 0;
		var arr = getRedianGainian();

		arr.forEach((a) => {   // a = ['猪肉'， 13]
			if (a[1].times > Configure.MIN_KAINIAN) {
				txt += '【' + (++index) + '】' + 
					a[0] + '  ' + a[1].times + '    score:' + a[1].weight + '   \t\r\n';
			}
		});
		return txt;
	};
	
	//param : {gainian: '4', type: 1, sort: 0}
	/*gainian  热点概念排序的索引 
	/*type  0 首板 ， 1 连板 , 2 all
	/*sort  0 得分 ， 1 高度
	/*
	//*/
	var getTickets = function(obj) {      
		console.log(obj);
		// sort
		this.tickets.sort((a, b) => {
			if (obj && obj.sort == 1) {
				return b[Configure.title.dayNumber] - a[Configure.title.dayNumber];
			} else {
				return b[Configure.title.score] - a[Configure.title.score];
			}
			
		});
			
		// type
		var retArr = this.tickets;
		if (obj.type !== 2) {
			retArr= this.tickets.filter((t)=>{
				return obj.type === 1 ? t[Configure.title.dayNumber] > 1 : 
									t[Configure.title.dayNumber] == 1;
			});			
		}
		
		// gainian
		var sortGainian = getRedianGainian();
		var curGaiNian = sortGainian && sortGainian[obj.gainian - 1] ?
						sortGainian[obj.gainian - 1] : null;
		console.log(curGaiNian);
		if (curGaiNian) {
			retArr = retArr.filter((t)=>{
				return t[Configure.title.reason].indexOf(curGaiNian[0]) != -1;
			});		
		}
		return retArr;
	};
	
	var clear = function() {
		tickets = {};
		gaiNian = new Map();
	};
	
	return {
		tickets: tickets,
		init: init,
		getRedianGainian: getRedianGainian,
		getRedianGainiantxt:getRedianGainiantxt,
		getTickets: getTickets,
		getDateStr: Configure.getDateStr,
		clear:clear
	}
})();