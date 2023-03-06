
	var displayAI = function (recommend) {
		var oDiv = document.getElementById("AI");
		//remove child
		while(oDiv.hasChildNodes()) {
			oDiv.removeChild(oDiv.lastChild);
		};
		
		oDiv.style.color = oDiv.style.borderColor  = recommend.color;
        var oStrong = document.createElement("div");
        var oTxt = document.createTextNode(recommend.txt);
		Tip.show(oDiv, recommend.tatics);
		
		oStrong.appendChild(oTxt);
		oDiv.appendChild(oStrong);
	};
	var drawimage = function(echelonNames = []) {
		canvas.draw(echelonNames, document.getElementById('indecator').value, 
				document.getElementById('showdays').value);
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
		echelons = echelons.concat([(parser.getCombinedEchelon(dateArr[0]))]);
		echelons = echelons.concat(parser.getEchelons(dateArr[0]));

		for (var i = 0; i < Configure.Echelons_Draw_NUM; i ++) {
			var rect = {x: elCanvas.width * Configure.WinXFactor + 30 +
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
	
	var init = function() {
		var dateArr = workbook.getDateArr(()=>{}, '-');
		$('#date').val(dateArr[dateArr.length - 1]);
		document.getElementById('date').min = dateArr[0];
	//	document.getElementById('date').max = dateArr[dateArr.length - 1];
		
		dragons.init();
		table.updateForm();
		
		canvas.init(document.getElementById("drawing"), Configure.WinXFactor);
	};
	
	var addEvent = function() {
		var formUpdate = function() {
			var fr2 = document.getElementById('form2');
			var paramEchelons = [];
			if (fr2.gainian && fr2.gainian.length > 1) {
				Array.from(fr2.gainian).forEach((input)=> {
					if(input.checked) {
						paramEchelons = paramEchelons.concat(input.dataset.titleName);
					} 
				});
			} else if(fr2.gainian){
				if(fr2.gainian.checked) {
					paramEchelons = paramEchelons.concat(fr2.gainian.dataset.titleName);
				} 
			}
			
			// canvas update
			drawimage(paramEchelons);
			if (document.getElementById('showdays').value < 120 ) { //canvas显示大于等于120天时不显示Echelons
				// Echelon update 
				var type = document.getElementById('form1').gtype[3].checked ? 
							3 : 0;   // 画趋势还是连扳
				drawEchelons(paramEchelons, type);
			}
			
			// table update
			fillTicketsTable();
			
			displayAI(AI.getRecommend());
		};
		
		var showDaysUpdate = function() {
			if (document.getElementById('showdays').value >= 120 ) {  // canvas显示大于等于120天时resize宽度
				canvas.resize(document.getElementById("drawing"), 1);
				drawimage([]);
			} else {
				canvas.resize(document.getElementById("drawing"), Configure.WinXFactor);
				formUpdate();
			}
		};
		$('#form1').change(formUpdate);
		$('#form2').change(formUpdate);
		$('#indecator').change(formUpdate);
		$('#showdays').change(showDaysUpdate);
		
		var dateChange = function(e) {
			Configure.date = new Date($('#date')[0].value);
	//		if (document.getElementById('showdays').value < 120 ) {  // canvas显示大于等于120天时不reload
				canvas.reload();
	//		}
			table.updateForm();
			formUpdate();
		}
		
		var dateOnclick = function(e) {
			var dateStr = $('#date')[0].value.replace(/\-/g, '');
			var retDatestr = e.currentTarget.id ==  'last' ? workbook.getLastDate('-') :
								e.currentTarget.id == 'next' ? workbook.getNextDate(dateStr, '-') : 
																workbook.getPreDate(dateStr, '-');
			$('#date').val(retDatestr);
			dateChange();
		};
		
		$('#date').change(dateChange);
		$('#pre').click(dateOnclick);
		$('#next').click(dateOnclick);
		$('#last').click(dateOnclick);
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
	
	window.onload = function(){
		$('#date').val(Configure.getDateStr(Configure.date, '-'));
		
		var indecator = document.getElementById('indecator');
		var options = indecator.getElementsByTagName("option");
		for(var i = 0; i < options.length; i++) {
			indecator.removeChild(options[i]);
			i--;
		}
		for(var i = 0; i < Configure.selectIndicators.length; i++) {
			var option1 = document.createElement("option");
			var text1 = document.createTextNode(Configure.selectIndicators[i].name);
			option1.appendChild(text1);
			indecator.appendChild(option1);
		}
	};