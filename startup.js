   //给input标签绑定change事件，一上传选中的.xls文件就会触发该函数
	var display = function (text) {
		var oDiv = document.getElementById("window");
		//remove child
		while(oDiv.hasChildNodes()) {
			oDiv.removeChild(oDiv.lastChild);
		};
			
        var oStrong = document.createElement("div");
        var oTxt = document.createTextNode(text);
		oStrong.appendChild(oTxt);
        //将strong元素插入div元素（这个div在HTML已经存在）
		oDiv.appendChild(oStrong);
	};
	

	
	var drawimage = function() {
		var sheet = workbook.getSheet('情绪');
		console.log(sheet);
		canvas.init(document.getElementById("drawing"), sheet);
		canvas.draw();
	};
	
	var loadData = function() {
		var d = $('#date')[0].value.replace(/\-/g, '');
		display(parser.getRedianGainiantxt(d));			
		table.createTable(d);
	};
	
	$('#date').val(parser.getDateStr(Configure.date, '-'));
	
	$('#date').change(function(e) {
		console.log('date on change');
		loadData();
	});
	
	$('#form1').change(function(e) {
		console.log('form1 on change');
		loadData();
	});
	
    $('#excel-file').change(function(e) {
        var files = e.target.files;
        var fileReader = new FileReader();
        fileReader.onload = function(ev) {
			console.log('load done!');
            try {
                var data = ev.target.result
                workbook.Book(XLSX.read(data, {
                    type: 'binary'
                })); // 以二进制流方式读取得到整份excel表格对象
            } catch (e) {
                console.log('文件类型不正确');
                return;
            }
			dragons.init();
			drawimage();
			loadData();
        };
        // 以二进制方式打开文件
        fileReader.readAsBinaryString(files[0]);
    });