
	var drawimage = function() {
		var sheet = workbook.getSheet('情绪');
		canvas.init(document.getElementById("drawing"), sheet, Configure.WinXFactor);
		canvas.draw();
	};
	var drawEchelons = function(){
		// 梯队
		var elCanvas = document.getElementById("drawing")
		var dateArr = workbook.getDateArr((a,b)=>{
				return b - a;
			});
		var echelons = parser.getEchelons(dateArr[0]);
		if (echelons.length >= Configure.Echelons_Draw_NUM){
			for (var i = 0; i < Configure.Echelons_Draw_NUM; i ++) {
				var rect = {x: elCanvas.width * Configure.WinXFactor + 
									i * elCanvas.width * (1-Configure.WinXFactor)/Configure.Echelons_Draw_NUM, 
								y:0,
								width:elCanvas.width * (1-Configure.WinXFactor)/Configure.Echelons_Draw_NUM,
							height:elCanvas.height};
				let e1 = new window.Echelon(elCanvas, echelons[i], rect);
				e1.draw();
			}			
		}
	};
	
	var fillTicketsTable = function() {
		var d = $('#date')[0].value.replace(/\-/g, '');	
		table.createTable(d);
	};
	
	var updateForm = function() {
		var fr = document.getElementById('form2');
		while(fr.hasChildNodes()) {
			fr.removeChild(fr.lastChild);
		};
		
		var t = document.createTextNode('概念：');
		t
		fr.appendChild(t);	
		var d = $('#date')[0].value.replace(/\-/g, '');	
		var gaiNianArr = parser.getHotpoint(d);
		
		gaiNianArr.forEach((g)=>{
			var oTxt = document.createTextNode(g[0] + ' (' + g[1].times + ')\xa0\xa0\xa0\xa0');
			var input = document.createElement('input');
			input.type = 'checkbox';
			input.name = 'gainian';
			input.checked = false;
			input.dataset.titleProp = g[0];
				
			fr.appendChild(input);	
			fr.appendChild(oTxt);			
		});

	};
	
	$('#date').val(Configure.getDateStr(Configure.date, '-'));
	var init = function() {
		var dateArr = workbook.getDateArr(()=>{}, '-');
		$('#date').val(dateArr[dateArr.length - 1]);
		dragons.init();
		updateForm();
	};
	
	var addEvent = function() {
		$('#date').change(function(e) {
			fillTicketsTable();
			updateForm();
		});
			
		$('#form1').change(function(e) {
			fillTicketsTable();
		});
		
		$('#form2').change(function(e) {
			fillTicketsTable();
		});
	};
	
    $('#excel-file').change(function(e) {
        var files = e.target.files;
        var fileReader = new FileReader();
        fileReader.onload = function(ev) {
            try {
                var data = ev.target.result
                workbook.Book(XLSX.read(data, {
                    type: 'binary'
                })); // 以二进制流方式读取得到整份excel表格对象
            } catch (e) {
                console.log('文件类型不正确');
                return;
            }
			init();
			
			drawimage();
			drawEchelons();
			fillTicketsTable();
			
			addEvent();
        };
        // 以二进制方式打开文件
        fileReader.readAsBinaryString(files[0]);
    });