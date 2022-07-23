
	var displayAI = function (text) {
		var oDiv = document.getElementById("AI");
		//remove child
		while(oDiv.hasChildNodes()) {
			oDiv.removeChild(oDiv.lastChild);
		};
			
        var oStrong = document.createElement("div");
        var oTxt = document.createTextNode(text);
		oStrong.appendChild(oTxt);
		oDiv.appendChild(oStrong);
	};
	var drawimage = function(echelonNames = []) {
		var sheet = workbook.getSheet('情绪');
		canvas.init(document.getElementById("drawing"), sheet, Configure.WinXFactor);
		canvas.draw(echelonNames);
	};
	
	
	var highlightTichets;
	// type = 0 画连扳， 3画趋势
	var drawEchelons = function(echelonNames = [], type = 0){
		// 梯队
		var elCanvas = document.getElementById("drawing")
		var dateArr = workbook.getDateArr((a,b)=>{
				return b - a;
			});
		var echelons = echelonNames.length ?  
						[(parser.getCombinedEchelon(dateArr[0], echelonNames))] : [];
		echelons = echelons.concat(parser.getEchelons(dateArr[0]));

		for (var i = 0; i < Configure.Echelons_Draw_NUM; i ++) {
			var rect = {x: elCanvas.width * Configure.WinXFactor + 
								i * elCanvas.width * (1-Configure.WinXFactor)/Configure.Echelons_Draw_NUM, 
							y:0,
							width:elCanvas.width * (1-Configure.WinXFactor)/Configure.Echelons_Draw_NUM,
						height:elCanvas.height};
			let e1;
			if(type == 0) {
				e1 = new window.Echelon(elCanvas, echelons[i], rect);      //连板
			} else {  // type = 3
				e1 = new window.bandEchelon(elCanvas, echelons[i], rect);   // 趋势，首板断板
			}
			e1.draw();
			
			if (i == 0) {
				highlightTichets = e1.getTickets();     // 记录需要highlight的票
				// 初始化一下趋势数据 AI需要使用
				new window.bandEchelon(elCanvas, echelons[i], rect);   
			}
		}			

	};
	
	var fillTicketsTable = function() {
		var d = $('#date')[0].value.replace(/\-/g, '');	
		table.createTable(d, highlightTichets);
	};
	
	
	$('#date').val(Configure.getDateStr(Configure.date, '-'));
	var init = function() {
		var dateArr = workbook.getDateArr(()=>{}, '-');
		$('#date').val(dateArr[dateArr.length - 1]);
		dragons.init();
		table.updateForm();
	};
	
	var addEvent = function() {
		$('#date').change(function(e) {
			fillTicketsTable();
			table.updateForm();
		});
		
		var formUpdate = function() {
			var fr2 = document.getElementById('form2');
			var paramEchelons = [];
			if (fr2.gainian) {
				fr2.gainian.forEach((input)=> {
					if(input.checked) {
						paramEchelons = paramEchelons.concat(input.dataset.titleName);
					} 
				});
			}
			// canvas update
			drawimage(paramEchelons);
			// Echelon update
			var type = document.getElementById('form1').gtype[3].checked ? 
						3 : 0;   // 画趋势还是连扳
			drawEchelons(paramEchelons, type);
			
			// table update
			fillTicketsTable();
		};
			
		$('#form1').change(formUpdate);
		$('#form2').change(formUpdate);
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
			
			displayAI(AI.getRecommend());
			addEvent();
        };
        // 以二进制方式打开文件
        fileReader.readAsBinaryString(files[0]);
    });