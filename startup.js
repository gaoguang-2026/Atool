
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
				let e1;
				if(i%2 == 0) {
					e1 = new window.Echelon(elCanvas, echelons[Math.floor(i/2)], rect);      //连板
				} else {
					e1 = new window.bandEchelon(elCanvas, echelons[Math.floor(i/2)], rect);   // 波段，首板断板
				}
				
				e1.draw();
			}			
		}
	};
	
	var fillTicketsTable = function() {
		var d = $('#date')[0].value.replace(/\-/g, '');	
		table.createTable(d);
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
			
		$('#form1').change(function(e) {
			fillTicketsTable();
		});
		
		$('#form2').change(function(e) {
			fillTicketsTable();
			
			var fr2 = document.getElementById('form2');
			var paramEchelons = [];
			if (fr2.gainian) {
				fr2.gainian.forEach((input)=> {
					if(input.checked) {
						paramEchelons = paramEchelons.concat(input.dataset.titleName);
					} 
				});
			}
			drawimage(paramEchelons);
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
			displayAI(AI.getRecommend());
			drawEchelons();
			fillTicketsTable();
			
			addEvent();
        };
        // 以二进制方式打开文件
        fileReader.readAsBinaryString(files[0]);
    });