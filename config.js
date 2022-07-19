var Configure = (function(){
	var debug = false;
	var date = debug ? new Date(2022,06,09) : new Date();
	
		// echelon 
	var echelons = [
		//赛道
		{name: '新能源车', hotPoints:['新能源汽车', '汽车零部件', '汽车热管理', '锂电池', '一体化压铸']},
		{name: '风光储', hotPoints:['光伏', '储能','风电', 'HJT电池', '智能电网', '特高压', '钒电池', '虚拟电厂']},
		
		// 消费
		{name: '白酒', hotPoints:['白酒','啤酒概念','白酒概念']},
		{name: '医药', hotPoints:['新冠预防药', '医药商业', '医药', '中药', '新冠治疗', '生物医药', '医药电商']},
		
		{name: '国资改+', hotPoints:['央企国资改革', '地方国资改革']},
		{name: '基建', hotPoints:['建筑材料', '建筑装饰', '水利', '装配式建筑', '公路铁路运输']},
		{name: '房地产', hotPoints:['房地产开发', '房地产', '物业管理', '新型城镇化']},
		{name: '环保', hotPoints:['环保', '污水处理','固废处理','绿色发电']},
		
		{name: '机器人', hotPoints:['机器人']},
		{name: '半年报预增', hotPoints:['半年报预增']}
	];
	
	var site_color = 'black';
	var sz_color = 'purple';
	var line_color = 'red';
	var echelon_color = ['orange', '#8BEDD9', '#E89AF5', '#6F65DE', '#9D97FF', '#F597C0'];
	
	var MIN_LB_NUMBER = 2;
	var MIN_KAINIAN = 3;     // 最少出现的次数
	
	var HIGH_factor = 1;     //连板数对概念权重的影响因子， 影响股票最后的得分
	var MAX_BEILI = 10;    //最大背离率 ,  影响canvas纵坐标
	var SZ_zero = 3200;    // sz 0轴坐标
	var SZ_MaxOffset = 200;   // 纵轴
	var winFactor = 0.4;    // 两个窗口的比率
	
	var Min_echelon_score = 0;    //draw 的条件
	var Max_echelon_score = 100;
	
	// 左右窗口
	var WinXFactor = 0.4;     //  左边窗口占比
	
	var Echelons_Draw_NUM = 2;
	
	var Echelons_ticket_NUM = 10;     // 画出来的数量
	var Echelons_handover_factor = 2; // 换手放大便于观察
	
	var Echelons_miss_tickit_period = 3; //连扳检查断板的期限
	var Band_miss_tickit_period = 7;    //波段检查断板的期限
	var Echelons_tickit_period = 2;    // 连扳选出股票的期限
	var Band_tickit_period = 4;    // 波段选出股票的期限
	var Band_Max_LENGTH = 14;    // 波段选出股票画出的长度。
	
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
		boardStrength: '封板力度',
		selectDate: '最近涨停日期',
		increaseRate: '最近涨速%'
	};
	var showInTableTitile = ['name',  'realValue','score','totalDivergence',
			'realHandoverPercent', 'boardStrength','reason', 'dayNumber'];
	var bandShowInTableTitile = ['name', 'realValue','score','price','increaseRate','selectDate','reason'];
	
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
		echelons:'echelon'   // 记录当天echelon排名
	}
	
	return {
		date: date,
		debug: debug,
		showInTableTitile:showInTableTitile,
		bandShowInTableTitile:bandShowInTableTitile,
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
		Min_echelon_score:Min_echelon_score,
		Max_echelon_score:Max_echelon_score,
		Echelons_Draw_NUM:Echelons_Draw_NUM,
		Echelons_tickit_period:Echelons_tickit_period,
		Band_tickit_period:Band_tickit_period,
		Echelons_miss_tickit_period:Echelons_miss_tickit_period,
		Band_miss_tickit_period:Band_miss_tickit_period,
		Band_Max_LENGTH:Band_Max_LENGTH,
		Echelons_ticket_NUM:Echelons_ticket_NUM,
		Echelons_handover_factor:Echelons_handover_factor,
		site_color:site_color,
		sz_color:sz_color,
		line_color:line_color,
		echelon_color:echelon_color,
		getDateStr:getDateStr,
		getBoardStrength:getBoardStrength,
		formatExcelDate:formatExcelDate,
		updatetitle:updatetitle,
		replaceTitleDate:replaceTitleDate
	}	
})();