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
		var retCycle = {};
		for(var i = 0; i < sheet.length; i ++) {
			if(sheet[i][Configure.titleCycles.cycles] && 
				dateStr == Configure.formatExcelDate(sheet[i][Configure.titleCycles.date])) {
				retCycle.cycles = sheet[i][Configure.titleCycles.cycles];
				retCycle.hotpoint = sheet[i][Configure.titleCycles.hotpoint];
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
	
	var getDatesSheet= function() {
		var sheet = getSheet('情绪');
		var start = sheet.length > Configure.Days_Max_lengh ? 
						sheet.length - Configure.Days_Max_lengh : 0;
		return  sheet.slice(start);
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
		return getSheet('涨幅排名8-5');
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
		getLastDate:getLastDate,
		setBandTicket:setBandTicket,
		getBandTickets:getBandTickets,
		getAllTickets:getAllTickets
	}
 })();