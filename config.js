var Configure = (function(){
	var debug = false;
	
	var date = debug ? new Date(2022,06,04) : new Date();
	
	var getDateStr = function(d, separator='') {   // ex. 20220704
		var month = d.getMonth() + 1 < 10 ?
					'0' + (d.getMonth() + 1) : 
					d.getMonth() + 1;
		var day = d.getDate() < 10 ? 
					'0' + d.getDate() :
					d.getDate();
		return d.getFullYear()+ separator + month + separator + day;
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
	
	var title2 = {
		date: '日期',
		erban: '二板数',
		high:'高度',
		lianban:'连板',
		jinji:'连板晋级率',
		lianbanzhishu:'连板指数',
		ma5:'5日线',
		beili:'背离率',
		sz:'SZ',
		gaiNianRank:'热点概念'   // 记录当天热点概念
	}
	
	var site_color = 'black';
	var sz_color = 'purple';
	var line_color = 'red';
	var gainian_color = 'orange';
	
	var MIN_LB_NUMBER = 2;
	var MIN_KAINIAN = 3;     // 最少出现的次数
	
	var HIGH_factor = 1;     //连板数对概念权重的影响因子， 影响股票最后的得分
	var MAX_BEILI = 10;    //最大背离率 ,  影响canvas纵坐标
	var SZ_zero = 3200;    // sz 0轴坐标
	var SZ_MaxOffset = 200;   // 纵轴
	var winFactor = 0.4;    // 两个窗口的比率
	
	var Min_weight = 10;    //draw概念的条件
	var Max_weight = 30;
	
	return {
		date: date,
		debug: debug,
		MIN_LB_NUMBER:MIN_LB_NUMBER,
		MIN_KAINIAN:MIN_KAINIAN,
		HIGH_factor:HIGH_factor,
		title:title,
		title2:title2,
		MAX_BEILI:MAX_BEILI,
		SZ_zero:SZ_zero,
		SZ_MaxOffset:SZ_MaxOffset,
		winFactor:winFactor,
		Min_weight:Min_weight,
		Max_weight:Max_weight,
		site_color:site_color,
		sz_color:sz_color,
		line_color:line_color,
		gainian_color:gainian_color,
		getDateStr:getDateStr
	}	
})();