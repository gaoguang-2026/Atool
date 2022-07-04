var parser = (function(){
	var tickets;   // 所有股票
	var gaiNian = new Map();   // 所有概念  元素:{name: '新能源', times: '3'}
	
	var MIN_LB_NUMBER = 2;
	var MIN_KAINIAN = 3;
	
	var getDateStr = function(date) {   // ex. 20220704
		var month = date.getMonth() + 1 < 10 ?
					'0' + (date.getMonth() + 1) : 
					date.getMonth() + 1;
		var day = date.getDate() < 10 ? 
					'0' + date.getDate() :
					date.getDate();
		return date.getFullYear() + month + day;
	};
	
	var title = {
		code: '代码',
		name: '    名称',
		value: '流通市值',
		reason: '涨停原因类别' + '[' + 
				getDateStr(Configure.date) +
				']',
		dayNumber: '连续涨停天数' + '[' + 
				getDateStr(Configure.date) +
				']' 
	};
	var init = function(data) {
		this.tickets = data;
		this.tickets.sort((a, b) => {
			return b[title.dayNumber] - a[title.dayNumber];
		});
		
		this.tickets.forEach((ticket) => {
			var reasons = ticket[title.reason].split('+');
			reasons.forEach((r) => {
				if (gaiNian.has(r)) {
					gaiNian.set(r, gaiNian.get(r) + 1);
				} else {
					gaiNian.set(r, 1);           // 初始化这个概念
				}
			});
		});
	//	console.log(gaiNian);
		this.gaiNian = Array.from(gaiNian);
		this.gaiNian.sort((a, b)=> {
			return b[1] - a[1];
		});
	};
	
	var arrayTostring = function(title, arr) {
		var txt = title + "      ";
		arr.forEach((a) => {
			txt += a.toString() + '   \t\r\n';
		});
		return txt;
	};
	
	var getRedianGainian = function() {
//		this.gaiNian.splice((g) => { 
//			return g.times > this.MIN_KAINIAN;
//		})
		return arrayTostring('热点概念排名：', this.gaiNian);
	};
	
	var getTicketRank = function() {
		console.log(title.name);
		var txt = '连扳股票排名：';
		this.tickets.forEach((t)=>{
	//		if (t[title.dayNumber] >= this.MIN_LB_NUMBER) {
			txt += //t[title.code] + '   ' + 
					t[title.name] + '   ' +
					//t[title.value] + '   ' +
					t[title.reason]+ '   ' +
					t[title.dayNumber] + '       \\\\\     \t\r\n';
	//		}
		})
		return txt;
	};
	
	return {
		tickets: tickets,
		init: init,
		getRedianGainian: getRedianGainian,
		getTicketRank: getTicketRank,
		getDateStr: getDateStr
	}
})();