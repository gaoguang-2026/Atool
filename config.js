var Configure = (function(){
	var debug = false;
	var date = new Date();
	
		// echelon 
	var echelons = [
		//赛道
		{name: '风光', hotPoints:['光伏','有机硅概念','风电', '绿电']},
		{name: '电力', hotPoints:['智能电网', '特高压', '虚拟电厂', '电力', '充电桩']},
		{name: '储能', hotPoints:[ '储能', 'HJT电池','钒电池', 'TOPCON电池', 'HJT电池']},
		{name: '锂电池', hotPoints:[ '盐湖提锂', '锂电池']},
		{name: '新能源车', hotPoints:['新能源汽车', '汽车零部件', '汽车热管理','一体化压铸']},
		
		//大科技
		{name: '半导体芯片', hotPoints:['汽车芯片', '半导体', 'PCB概念', 'wifi6', '5G', 
				'第三代半导体', '中芯国际概念','芯片','集成电路', 'pcb']},
		{name: '机器人', hotPoints:['机器人', '智能制造', '减速器']},
		{name: '传媒', hotPoints:['传媒','文化传媒', '元宇宙', '人工智能', '游戏', '云游戏',
			'云计算', '东数西算', '计算机软件','手机游戏']},
		
		// 消费
		{name: '白酒', hotPoints:['白酒','啤酒概念','白酒概念', '烟草']},
		{name: '医药', hotPoints:['新冠预防药', '医药商业', '医药', '中药', '新冠治疗', '生物医药', '医药电商', '医美', '医疗器械']},
		{name: '消费电子', hotPoints:['消费电子','智能穿戴','无线耳机', '智能音箱', 'VR', '虚拟现实', 'OLED']},
		
		//周期能源
		{name: '老能源', hotPoints:['煤炭','石油','天然气']},
		{name: '金属', hotPoints:['有色金属','黄金','小金属概念', '钴', '金属锌', '金属铜', '金属铅', '金属镍', '']},
		
		{name: '基建', hotPoints:['建筑材料', '建筑装饰', '水利', '装配式建筑', '公路铁路运输']},
		{name: '房地产', hotPoints:['房地产开发', '房地产', '物业管理', '新型城镇化']},
		{name: '金融', hotPoints:['银行', '保险', '证券', '券商']},
		
		{name: '环保', hotPoints:['环保', '污水处理','固废处理','绿色发电']},		
		{name: '化工', hotPoints:['化工']},	
		{name: '军工', hotPoints:['航天航空', '军工','大飞机','国产航母', '卫星导航', '北斗','卫星通信']},
		
		{name: '国资改+', hotPoints:['央企国资改革', '地方国资改革']},
		{name: '半年报预增', hotPoints:['半年报预增']}
	];
	
	var isKechuangTicket = function(code) {
		return code.substr(2, 2) == '30' || code.substr(2, 2) == '68';
	};
	var isSHTicket = function(code) {
		return code.substr(2, 2) == '60' ;
	};
	var isSZTicket = function(code) {
		return code.substr(2, 2) == '00' ;
	};
		
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
		var retObj = {v:0, description:'@~@'};
		switch (bType) {
			case '一字板':
				if (bPercent > 5) {
					retObj.description = '很强'
				} else {
					retObj.description = '强';
				} 
				break;
			case 'T字板':
				if (bPercent > 20) {
					retObj.description = '很强'
				} else {
					retObj.description = '强'
				} 
				break;
			case '换手板':
				if (bPercent > 50) {
					retObj.description = '很强';
				} else if (bPercent > 20 || bTime.substr(0,1) == '9') {
					retObj.description = '强';
				} else if(bPercent < 5 || bTime.substr(0,2) == '14'){
					retObj.description = '弱';
				} else {
					retObj.description = '一般';
				}
				break;
			default:
				break;
			} 
		switch(retObj.description) {
			case '很强':
				retObj.v = 4;
				break;
			case '强':
				retObj.v = 3;
				break;
			case '一般':
				retObj.v = 2;
				break;
			case '弱':
				retObj.v = 1;
				break;
			default:
				break;
			}
		return retObj;
	};
	
	var getDayBoard = function(number){
		return {d: parseInt( number % 65537 + number / 65537), 
			b: parseInt(number / 65537)};
	}
	
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
		// 涨幅排名独有
		totalValue:'总市值',
		rase_20:'20日涨幅',
		industry:'所属行业',
		gainian:'所属概念',
		
		score:'题材得分',                //根据reasion 算出来的概念评分
		realValue: '实际流通市值',
		realValueDivergence: '实际流通市值背离率',  //与dragon对比的背离率
		priceDivergence:'价格背离率',   		 // 与dragon对比的背离率
		profitDivergence: '筹码背离率',			 // 与dragon对比的背离率   这个值越大越好，只有小于dargon才会有值
		totalDivergence: '背离率',              // 总背离率
		realHandoverPercent: '实际换手率',
		boardStrength: '封板力度',
		selectDate: '最近涨停日期',
		increaseRate: '平均涨速'
	};
	var showInTableTitile = ['name',  'realValue','score','totalDivergence',
					'realHandoverPercent', 'boardStrength','reason', 'boardAndDay'];
	var bandShowInTableTitile = ['name', 'realValue','score','price','increaseRate','totalDivergence','selectDate','reason'];
	var industryShowInTableTitile = ['index', 'name', 'value_100','value_250','value_500', 'totalValue','rise_d20_0',
								'rise_d20_10','rise_d20_20', 'average_20_rise','total'];
	
	var selectIndicators = [
								{name:'涨停背离', value: -1},
								{name:'上证指数', value: 0}, 
								{name:'连扳高度', value: 1},
								{name:'连扳数量', value: 2},
								{name:'涨停数量', value: 3}
							];
	
	var title2 = {
		date: '日期',
		erban: '二板数',
		height:'高度',
		lianban:'连板',
		jinji:'连板晋级率',
		lianbanzhishu:'连板指数',
		zhangtingzhishu:'涨停指数',
		ma5:'5日线',
		beili:'背离率',
		sz:'SZ',
		echelons:'echelon',   // 记录当天echelon排名
		boardHeight: 'height',   // 记录当天最高高度   BH_Draw_title
		dragon: 'dragon',   // 记录当天的龙头名字
		boardnum: '涨停数',
		
		subBeili:'涨停指标背离率',
		subMa5:'涨停指标5日线',
	};
	
	var titleCycles = {
		cycles: '时间周期',
		hotpoint: '热点',
		date: '日期',
		dragon:'龙头'
	};
	var titleTactics = {
		name:'名称',
		condition: '能见度',
		selectTicket:'选股',
		buy:'买点',
		stop:'止损',
		sell: '止盈',
		description: '说明',
		word: '道'
	};
	var titleIndustry = {
		index: '索引',
		name: '行业名称',
		value_100: '市值<100亿',
		value_250: '100-500亿',
		value_500: '市值>500亿',
		totalValue: '总市值（亿）',
		rise_d20_0: '20日涨幅<0',
		rise_d20_10: '0<涨幅<20%',
		rise_d20_20: '20日涨幅>20%',
		average_20_rise:'20日平均涨幅%',
		total: '合计(个)'
	};
	
	var site_color = 'black';
	var sz_color = 'purple';
	var boardHeight_color = 'black';
	var line_color = 'red';
	var echelon_color = ['orange', '#E89AF5', '#6F65DE', '#9D97FF', '#F597C0', '#8BEDD9'];
	
	var MIN_LB_NUMBER = 2;
	var MIN_KAINIAN = 2;     // 最少出现的次数
	var HIGH_factor = 1;     //连板数对概念权重的影响因子， 影响股票最后的得分
	var MAX_BEILI = 10;    //最大背离率 ,  影响canvas纵坐标
	var ZHISHU_TITLE = title2.lianbanzhishu;    // 情绪指标， title2.lianbanzhishu 
	var ZHISHU_SUB_TITLE = title2.zhangtingzhishu;   // 情绪指标 title2.zhangtingzhishu
	var winFactor = 0.4;    // 两个窗口的比率
	var Days_Max_lengh = 50;   // canvas 显示的最大期限
	
	var SZ_zero = 3200;    // sz 0轴坐标
	var SZ_MaxOffset = 200;   // 纵轴
	
	var BH_Draw_title = title2.height;  // title2.height or title2.boardHeight
	var BH_zero = BH_Draw_title == title2.height ? 
							 	4 : 4 * 65537;    // boardHeight 0轴坐标
	var BH_MaxOffset = BH_Draw_title == title2.height ? 
							6 : 6 * 65537;   // boardHeight 纵轴

	
	var Min_echelon_score = 0;    //draw 的条件
	var Max_echelon_score = 40;
	
	// 左右窗口
	var WinXFactor = 0.5;     //  左边窗口占比
	
	var Echelons_Draw_NUM = 2;
	var Echelons_ticket_NUM = 7;     // 画出来的数量
	var Echelons_handover_factor = 2; // 换手放大便于观察
	
	var Echelons_miss_tickit_period = 3; //连扳检查断板的期限  ’几天几板‘ 是3
	var Echelons_tickit_period = 1;    // 连扳选出股票的期限
	var Echelons_show_min_score = 7;  // 最小显示限制
	
	var Band_tickit_period = 11;    // 趋势选出股票的期限      SED + TFD
	var Band_Max_LENGTH = 22;    // 趋势选出股票画出的长度。    (SED + TFD)  * 2
	var Band_miss_tickit_period = 11;    //趋势检查断板的期限     SED + TFD
	var Band_tickit_filter_period = 0;   //趋势票涨停过滤期限     0 是一个涨停
	var Band_MA_NUM = 5;    //MA5
	var Band_Min_Value = 5000000000;  // 趋势票最小流通市值
	
	var AI_Default_Factor = 50;        // 超短选票默认因子   越大结构权重越大，越小题材权重越大
	var AI_Default_Band_Factor = 180;   // 趋势选票默认因子  越大涨速权重越大，越小题材权重越大
	var Dead_Handover = 55;				// 过滤掉死亡换手
	var Min_handover = 3;				// 过滤掉太低的换手，买不进去
	
	return {
		date: date,
		debug: debug,
		showInTableTitile:showInTableTitile,
		bandShowInTableTitile:bandShowInTableTitile,
		industryShowInTableTitile:industryShowInTableTitile,
		MIN_LB_NUMBER:MIN_LB_NUMBER,	
		MIN_KAINIAN:MIN_KAINIAN,
		HIGH_factor:HIGH_factor,
		title:title,
		title2:title2,
		titleCycles:titleCycles,
		titleTactics:titleTactics,
		titleIndustry:titleIndustry,
		Days_Max_lengh:Days_Max_lengh,
		echelons:echelons,
		selectIndicators:selectIndicators,
		MAX_BEILI:MAX_BEILI,
		ZHISHU_TITLE:ZHISHU_TITLE,
		ZHISHU_SUB_TITLE:ZHISHU_SUB_TITLE,
		SZ_zero:SZ_zero,
		SZ_MaxOffset:SZ_MaxOffset,
		BH_zero:BH_zero,
		BH_MaxOffset:BH_MaxOffset,
		BH_Draw_title:BH_Draw_title,
		AI_Default_Factor:AI_Default_Factor,
		AI_Default_Band_Factor:AI_Default_Band_Factor,
		Dead_Handover:Dead_Handover,
		Min_handover:Min_handover,
		WinXFactor:WinXFactor,
		Min_echelon_score:Min_echelon_score,
		Max_echelon_score:Max_echelon_score,
		Echelons_Draw_NUM:Echelons_Draw_NUM,
		Echelons_tickit_period:Echelons_tickit_period,
		Echelons_show_min_score:Echelons_show_min_score,
		Band_tickit_period:Band_tickit_period,
		Echelons_miss_tickit_period:Echelons_miss_tickit_period,
		Band_miss_tickit_period:Band_miss_tickit_period,
		Band_tickit_filter_period:Band_tickit_filter_period,
		Band_Max_LENGTH:Band_Max_LENGTH,
		Band_MA_NUM:Band_MA_NUM,
		Band_Min_Value:Band_Min_Value,
		Echelons_ticket_NUM:Echelons_ticket_NUM,
		Echelons_handover_factor:Echelons_handover_factor,
		site_color:site_color,
		boardHeight_color:boardHeight_color,
		sz_color:sz_color,
		line_color:line_color,
		echelon_color:echelon_color,
		getDateStr:getDateStr,
		getBoardStrength:getBoardStrength,
		formatExcelDate:formatExcelDate,
		updatetitle:updatetitle,
		replaceTitleDate:replaceTitleDate,
		getDayBoard:getDayBoard,
		isKechuangTicket:isKechuangTicket,
		isSHTicket:isSHTicket,
		isSZTicket:isSZTicket
	}	
})();