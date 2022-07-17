 var workbook = (function() {
	var Book;
	
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
            if (Book.Sheets.hasOwnProperty(sheet) && name.includes(sheet)) {
				fromTo = Book.Sheets[sheet]['!ref'];
                persons = persons.concat(XLSX.utils.sheet_to_json(Book.Sheets[sheet]));
                //  break; // 如果只取第一张表，就取消注释这行
            }
        }
		return persons;
	};
	
	var getDateArr = function(sort, separator = '') {
		var sheet = getSheet('情绪');
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
		getValue:getValue,
		getLastDate:getLastDate
	}
 })();