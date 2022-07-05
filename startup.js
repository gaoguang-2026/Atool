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
	
	var createTable = function () {
		var tbl = document.getElementById('tbl');
		var tBody = tbl.tBodies[0];
		
		var fr = document.getElementById('form1');
		var gainian = fr.gainian;
	//	var oBtn = document.getElementById('btn');
	//	oBtn.onclick = function() {
			//remove all tr
			while(tBody.hasChildNodes()) {
				tBody.removeChild(tBody.lastChild);
			};
			
			var param = {
				gainian: gainian.value,
				type: fr.gtype[2].checked ? 2 : 
						fr.gtype[0].checked ? 0 : 1,   
				sort: fr.sort[0].checked ? 0 : 1
			};

			var tks = parser.getTickets(param);
			console.log(tks);
			tks.forEach((ticket)=> {
				var tr = document.createElement('tr');
				var tID = document.createElement('td');
				tID.setAttribute('class','id');//为ID单元格增加class属性
				var tName = document.createElement('td');
				var tValue = document.createElement('td');
				var tReason = document.createElement('td');
				var tHighNum = document.createElement('td');
				var tScore = document.createElement('td');
				
				//为各个单元格添加表单提交的数据
				tID.innerHTML = ticket[Configure.title.code];
				tName.innerHTML = ticket[Configure.title.name];
				tValue.innerHTML = (ticket[Configure.title.value]/100000000).toFixed(2);
				tReason.innerHTML = ticket[Configure.title.reason];
				tHighNum.innerHTML = ticket[Configure.title.dayNumber];
				tScore.innerHTML = ticket[Configure.title.score];
				//添加详细超链接
				var tDetail = document.createElement('td');
				tDetail.innerHTML = '<a href="baidu.com" target="_blank">详细</a>';
				var oD = tDetail.children[0];
				oD.onclick = function(){
					var url = "http://quote.eastmoney.com/" + ticket[Configure.title.code] + ".html"
					window.open(url);
				};
				//添加删除超链接
				var tDel = document.createElement('td');
				tDel.innerHTML = '<a href="javascript:;">删除</a>';
				//执行删除表格行操作
				var oA = tDel.children[0];
				oA.onclick = function(){
					if(confirm("确定删除吗？")){
						tBody.removeChild(this.parentNode.parentNode);
					}
				};
				 //为表格添加单元格和行
				tr.appendChild(tID);
				tr.appendChild(tName);
				tr.appendChild(tValue);
				tr.appendChild(tReason);
				tr.appendChild(tHighNum);
				tr.appendChild(tScore);
				tr.appendChild(tDetail);
				tr.appendChild(tDel);
				 
				tBody.appendChild(tr);
			});
	//	}
	};
	
	var workbook;    // 存储所有的表
	var loadData = function() {
		//re-configure , Design defects 
		Configure.date = new Date($('#date')[0].value.replace('-', ',').replace('-', ','));
		Configure.title.reason = '涨停原因类别' + '[' + parser.getDateStr(Configure.date) + ']';
		Configure.title.dayNumber = '连续涨停天数' + '[' + parser.getDateStr(Configure.date) + ']';
		// 表格的表格范围，可用于判断表头是否数量是否正确
        var fromTo = '';
		var persons = [];  // 存储要使用的表
        // 遍历每张表读取
        for (var sheet in workbook.Sheets) {
			console.log(sheet + '  date:' + parser.getDateStr(Configure.date));
            if (workbook.Sheets.hasOwnProperty(sheet) &&
				(parser.getDateStr(Configure.date)+'').includes(sheet)) {
				fromTo = workbook.Sheets[sheet]['!ref'];
                console.log(fromTo);
                persons = persons.concat(XLSX.utils.sheet_to_json(workbook.Sheets[sheet]));
                //  break; // 如果只取第一张表，就取消注释这行
            }
        }
            //在控制台打印出来表格中的数据
            console.log(persons);
			parser.clear();
			parser.init(persons);
			display(parser.getRedianGainiantxt());			
			createTable();
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
                workbook = XLSX.read(data, {
                    type: 'binary'
                }) // 以二进制流方式读取得到整份excel表格对象
            } catch (e) {
                console.log('文件类型不正确');
                return;
            }
			loadData();
        };
        // 以二进制方式打开文件
        fileReader.readAsBinaryString(files[0]);
    });