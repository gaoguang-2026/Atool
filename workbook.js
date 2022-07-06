 var workbook = (function() {
	var Book;
	
	var Book = function(b){
		Book = b
	};
	var getSheet = function(name) {
		// 表格的表格范围，可用于判断表头是否数量是否正确
        var fromTo = '';
		var persons = [];  // 存储要使用的表
        // 遍历每张表读取
        for (var sheet in Book.Sheets) {
			console.log(sheet + '  date:' + name);
            if (Book.Sheets.hasOwnProperty(sheet) && name.includes(sheet)) {
				fromTo = Book.Sheets[sheet]['!ref'];
                console.log(fromTo);
                persons = persons.concat(XLSX.utils.sheet_to_json(Book.Sheets[sheet]));
                //  break; // 如果只取第一张表，就取消注释这行
            }
        }
		return persons;
	};
	return {
		Book:Book,
		getSheet:getSheet
	}
 })();