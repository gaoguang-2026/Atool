var Configure = (function(){
	var debug = false;
	
	var date = debug ? new Date(2022,06,04) : new Date();

	var MIN_LB_NUMBER = 2;
	var MIN_KAINIAN = 2;
	
	var HIGH_factor = 1;     //连板数对概念权重的影响因子， 影响股票最后的得分
	
	var getDateStr = function(d) {   // ex. 20220704
		var month = d.getMonth() + 1 < 10 ?
					'0' + (d.getMonth() + 1) : 
					d.getMonth() + 1;
		var day = d.getDate() < 10 ? 
					'0' + d.getDate() :
					d.getDate();
		return d.getFullYear() + month + day;
	};
	
	var title = {
		code: '代码',
		name: '    名称',
		value: '流通市值',
		reason: '涨停原因类别' + '[' + 
				getDateStr(date) +
				']',
		dayNumber: '连续涨停天数' + '[' + 
				getDateStr(date) +
				']' ,
		
		score:'score'                //根据reasion 算出来的评分
	};
	
	return {
		date: date,
		debug: debug,
		MIN_LB_NUMBER:MIN_LB_NUMBER,
		MIN_KAINIAN:MIN_KAINIAN,
		HIGH_factor:HIGH_factor,
		title:title,
		getDateStr:getDateStr
	}	
})();