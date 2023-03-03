 var workbook = (function() {
	var Book;
	
	var BandTickets = [];
	
	var Book = function(b){
		Book = b
	};
	var sheetExist = function(name) {
		for (var sheet in Book.Sheets) {
			if (Book.Sheets.hasOwnProperty(sheet) && name.includes(sheet)) {
				return true;
			};
		 }
		return false;
	};
	
	var getSheet = function(name) {
		// 表格的表格范围，可用于判断表头是否数量是否正确
        var fromTo = '';
		var persons = [];  // 存储要使用的表
        // 遍历每张表读取
        for (var sheet in Book.Sheets) {
            if (Book.Sheets.hasOwnProperty(sheet) && name && name.substr(-4) == (sheet)) {
				fromTo = Book.Sheets[sheet]['!ref'];
                persons = persons.concat(XLSX.utils.sheet_to_json(Book.Sheets[sheet]));
                //  break; // 如果只取第一张表，就取消注释这行
            }
        }
		return persons;
	};
	
	var setBandTicket = function(ticketArr) {
		BandTickets = [];
		ticketArr.forEach((t)=>{
			BandTickets.push(t);
		});
	};
	
	var getBandTickets = function() {
		return BandTickets;
	};
	
	var getEmotionalCycles = function(dateStr) {
		var sheet = getSheet('周期');
		sheet.reverse();
		var index = sheet.findIndex((e)=>{
				if (dateStr >= Configure.formatExcelDate(e[Configure.titleCycles.date])) return true;
			});
		var retCycle = {};
		for(var i = index; i < sheet.length; i ++) {
			if(sheet[i][Configure.titleCycles.cycles]) {
				retCycle.cycles = sheet[i][Configure.titleCycles.cycles];
				retCycle.hotpoint = sheet[i][Configure.titleCycles.hotpoint];
				retCycle.isTurning = false;
				if (dateStr == Configure.formatExcelDate(sheet[i][Configure.titleCycles.date])) {
					retCycle.isTurning = true;
				}
				break;
			}
		}
		return retCycle;
	};
	var getTactics = function(t) {
		var sheet = getSheet('交易模式');
		return sheet.find((item)=> {
			return item[Configure.titleTactics.tractic] && 
					item[Configure.titleTactics.tractic].includes(t);
		});
	};
	var getContext = function(contextStr) {
		var sheet = getSheet('交易模式');
		return sheet.find((item)=> {
			return item[Configure.titleTactics.context] && 
					contextStr.includes(item[Configure.titleTactics.context]);
		});
	};
	var getContextTypeAndParam = function(contextStr) {
		var item = getContext(contextStr);
		var ret = item && item[Configure.titleTactics.contextType] ? 
				{type:item[Configure.titleTactics.contextType], param:item[Configure.titleTactics.param]}  
					: null;
		return  ret;
	};
	
	var getDatesSheet= function() {
		var sheet = getSheet('情绪');
		var start = sheet.length > Configure.Days_Max_lengh ? 
						sheet.length - Configure.Days_Max_lengh : 0;
		var lastDate = Configure.getDateStr(Configure.date, '-');
		var end = sheet.findIndex((d)=>{
			return Configure.formatExcelDate(d[Configure.title2.date]) > lastDate;
		});
		return  end > start ? sheet.slice(start, end) : sheet.slice(start);
	};
	
	var getDateArr = function(sort, separator = '') {
		var sheet = getDatesSheet();
		var retArr = [];
		sheet.forEach((d)=>{
			 retArr.push(Configure.formatExcelDate(d[Configure.title2.date], separator));
		});
		return retArr.sort(sort);
	};
		
	var getLastDate = function() {
		return getDateArr((a,b)=>{
			return b - a;
		})[0];
	};
	
	var getAllTickets = function() {
		return getSheet('涨幅排名');
	};
	
	// param = {sheetName: '0707',ticketCode:'SZ002527'}}
	var getValue = function(param) {
		var s = getSheet(param.sheetName);
		var ret ;
		s.forEach((t)=>{
			if(t[Configure.title.code] == param.ticketCode) {
				ret = t;
			}
		})
		return ret;
	};
	return {
		Book:Book,
		getSheet:getSheet,
		sheetExist:sheetExist,
		getDateArr:getDateArr,
		getDatesSheet:getDatesSheet,
		getValue:getValue,
		getEmotionalCycles:getEmotionalCycles,
		getTactics:getTactics,
		getContext:getContext,
		getContextTypeAndParam:getContextTypeAndParam,
		getLastDate:getLastDate,
		setBandTicket:setBandTicket,
		getBandTickets:getBandTickets,
		getAllTickets:getAllTickets
	}
 })();