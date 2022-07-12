var Configure = (function(){
	var debug = false;
	
	var date = debug ? new Date(2022,06,09) : new Date();
	
		/**
     * 格式化excel传递的时间
     * @param numb 需转化的时间 43853
     * @param format 分隔符 "-"
     * @returns {string} 2020-1-22
     */
	var formatExcelDate = function(numb, format = "-") {
		// 如果numb为空则返回空字符串
		if (!numb) {
			return "";
		}
		let time = new Date(new Date("1900-1-1").getTime() + (numb - 1) * 3600*24*1000);
		const year = time.getFullYear() + '';
		const month = time.getMonth() + 1 + '';
		const date = time.getDate();
		if (format && format.length === 1) {
			return year + format + (month < 10 ? '0' + month : month) + format + (date < 10 ? '0' + date : date)
		}
		return year + (month < 10 ? '0' + month : month) + (date < 10 ? '0' + date : date)
	}
	
	var getDateStr = function(d, separator='') {   // ex. 20220704
		var month = d.getMonth() + 1 < 10 ?
					'0' + (d.getMonth() + 1) : 
					d.getMonth() + 1;
		var day = d.getDate() < 10 ? 
					'0' + d.getDate() :
					d.getDate();
		return d.getFullYear()+ separator + month + separator + day;
	};
	
	var updatetitle = function (dateStr) {
		if(dateStr) {
			Configure.title.reason = '涨停原因类别' + '[' + dateStr + ']';
			Configure.title.dayNumber = '连续涨停天数' + '[' + dateStr + ']';
			Configure.title.boardPercent = '涨停封成比%' + '[' + dateStr + ']';
			Configure.title.handoverPercent = '换手率%' + '[' + dateStr + ']';
			Configure.title.profitProportion = '收盘获利%' + '[' + dateStr + ']';
			Configure.title.boardTime = '最终涨停时间' + '[' + dateStr + ']';
		};
	};
	var replaceTitleDate = function(t, dateStr) {
		return t.replace(/\[[\d]*\]/g, '[' + dateStr + ']');
	}
	
	// 封板力度算法
	var getBoardStrength = function(bType, bPercent, bTime = '') {
		var ret = '@~@';
		switch (bType) {
			case '一字板':
				if (bPercent > 5) {
					ret = '很强'
				} else {
					ret = '强';
				} 
				break;
			case 'T字板':
				if (bPercent > 20) {
					ret = '很强'
				} else {
					ret = '强'
				} 
				break;
			case '换手板':
				if (bPercent > 50) {
					ret = '很强';
				} else if (bPercent > 20 || bTime.substr(0,1) == '9') {
					ret = '强';
				} else if(bPercent < 5 || bTime.substr(0,2) == '14'){
					ret = '弱';
				} else {
					ret = '一般';
				}
				break;
			default:
				break;
			} 
			return ret;
	};
	
	var title = {
		code: '代码',
		name: '    名称',
		price: '现价',
		value: '流通市值',
		reason: '涨停原因类别' + '[' + 
				getDateStr(date) +
				']',
		boardType: '涨停类型',
		boardPercent: '涨停封成比%'  + '[' + 
				getDateStr(date) +
				']',
		dayNumber: '连续涨停天数' + '[' + 
				getDateStr(date) +
				']' ,
		handoverPercent: '换手率%'  + '[' + 
				getDateStr(date) +
				']' ,
		profitProportion: '收盘获利%' + '[' + 
				getDateStr(date) +
				']' ,
		orgProportion: '机构持股比例合计%',
		boardTime : '最终涨停时间' + '[' + 
				getDateStr(date) +
				']' ,
		boardAndDay:'几天几板',
		
		score:'题材得分',                //根据reasion 算出来的概念评分
		realValue: '实际流通市值',
		realValueDivergence: '实际流通市值背离率',  //与dragon对比的背离率
		priceDivergence:'价格背离率',   		 // 与dragon对比的背离率
		profitDivergence: '筹码背离率',			 // 与dragon对比的背离率   这个值越大越好，只有小于dargon才会有值
		totalDivergence: '背离率',              // 总背离率
		realHandoverPercent: '实际换手率',
		boardStrength: '封板力度'
	};
	var showInTableTitile = ['name',  'realValue','score','totalDivergence','realHandoverPercent', 'boardStrength','reason', 'dayNumber'];
	
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
	var MIN_KAINIAN = 1;     // 最少出现的次数
	
	var HIGH_factor = 1;     //连板数对概念权重的影响因子， 影响股票最后的得分
	var MAX_BEILI = 10;    //最大背离率 ,  影响canvas纵坐标
	var SZ_zero = 3200;    // sz 0轴坐标
	var SZ_MaxOffset = 200;   // 纵轴
	var winFactor = 0.4;    // 两个窗口的比率
	
	var Min_weight = 10;    //draw概念的条件
	var Max_weight = 30;
	
	// 左右窗口
	var WinXFactor = 0.5;     //  左边窗口占比
	
	// echelon 
	var echelons = [
		{name: '新能源车', hotPoints:['新能源汽车', '汽车零部件', '汽车热管理', '锂电池']},
		{name: '风光电储', hotPoints:['光伏', '电力', '储能','风电', 'HJT电池', '智能电网', '特高压']},
		{name: '机器人', hotPoints:['机器人']},
		{name: '医药', hotPoints:['新冠预防药', '医药商业', '医药', '中药', '新冠治疗', '生物医药']}
	];
	var Echelons_Draw_NUM = 2;
	var Echelons_tickit_period = 3;    // 选出股票的期限
	var Echelons_ticket_NUM = 10;     // 画出来的数量
	var Echelons_handover_factor = 2; // 换手放大便于观察
	
	return {
		date: date,
		debug: debug,
		showInTableTitile:showInTableTitile,
		MIN_LB_NUMBER:MIN_LB_NUMBER,
		MIN_KAINIAN:MIN_KAINIAN,
		HIGH_factor:HIGH_factor,
		title:title,
		title2:title2,
		echelons:echelons,
		MAX_BEILI:MAX_BEILI,
		SZ_zero:SZ_zero,
		SZ_MaxOffset:SZ_MaxOffset,
		WinXFactor:WinXFactor,
		Min_weight:Min_weight,
		Max_weight:Max_weight,
		Echelons_Draw_NUM:Echelons_Draw_NUM,
		Echelons_tickit_period:Echelons_tickit_period,
		Echelons_ticket_NUM:Echelons_ticket_NUM,
		Echelons_handover_factor:Echelons_handover_factor,
		site_color:site_color,
		sz_color:sz_color,
		line_color:line_color,
		gainian_color:gainian_color,
		getDateStr:getDateStr,
		getBoardStrength:getBoardStrength,
		formatExcelDate:formatExcelDate,
		updatetitle:updatetitle,
		replaceTitleDate:replaceTitleDate
	}	
})();