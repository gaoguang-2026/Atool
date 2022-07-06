
var canvas = (function(canvas) {
	var drawing;
	var Days;
	
	var width = 0;
	var height = 0;
	var width_factor = 0.9;
	var height_factor = 0.8;
	
	var siteX;
	var siteY;
	var siteHeight;
	var siteWidth;
	var cellWidth = 0;
	//var cellHeight;
	var cell_factor = 0.9;
	
	var winFactor = Configure.winFactor;
	
	/**
     * 格式化excel传递的时间
     * @param numb 需转化的时间 43853
     * @param format 分隔符 "-"
     * @returns {string} 2020-1-22
     */
	var formatExcelDate = function(numb, format = "-") {
		// 如果numb为空则返回空字符串
		if (!numb) {
			return "";
		}
		let time = new Date(new Date("1900-1-1").getTime() + (numb - 1) * 3600*24*1000);
		const year = time.getFullYear() + '';
		const month = time.getMonth() + 1 + '';
		const date = time.getDate();
		if (format && format.length === 1) {
			return year + format + (month < 10 ? '0' + month : month) + format + (date < 10 ? '0' + date : date)
		}
		return year + (month < 10 ? '0' + month : month) + (date < 10 ? '0' + date : date)
	}
	
	var init = function(c, sheet) {
		drawing = c;
		Days = sheet;
		
		width = c.width;
		height = c.height;
		
		siteX = width * (1 - width_factor)/2;
		siteY = height * (1 - height_factor)/2;
		siteWidth = width * width_factor;
		siteHeight = height * height_factor;
		
		cellWidth = siteWidth / Days.length *cell_factor;
		
		console.log('canvas width:' + width + 
					' height:' + height + 
					' siteX' + siteX +
					' siteY:' + siteY +
					' siteWidth:' + siteWidth + 
					' siteHeight:' + siteHeight +
					' cellWidth:' + cellWidth);
					
		// 通过parser分析出当天的热点概念
		Days.forEach((d)=>{
			var dateStr = formatExcelDate(d[Configure.title2.date], '');
			if (workbook.sheetExist(dateStr)) {
				var gainainArr = parser.getRedianGainian( dateStr );
				d[Configure.title2.gaiNianRank] = gainainArr.filter((g)=>{
					return g[1].weight > Configure.Min_weight;
				});
			} else {
				d[Configure.title2.gaiNianRank] = [];
			}
		});
	};

	var drawSite = function() {
		//画线
		var ctx = drawing.getContext("2d");		
		ctx.beginPath();
		ctx.lineWidth="2";
		ctx.strokeStyle = "blue";
		ctx.moveTo(siteX,siteY);
		ctx.lineTo(siteX ,siteY + siteHeight);
		ctx.lineTo(siteX + siteWidth, siteY + siteHeight);
		ctx.lineTo(siteX + siteWidth, siteY);
		ctx.lineTo(siteX,siteY);
		
		// 画日期
		for(i = 0; i < Days.length; i ++) {
			if (i % 5 == 0 || i == Days.length -1) {
				//日期
			//	ctx.rotate(310*Math.PI/180);
				ctx.font="12px Times new Roman";
				ctx.fillStyle = "red"
				ctx.fillText(formatExcelDate(Days[i][Configure.title2.date], '-'),
					 siteX + cellWidth  * i, siteY + siteHeight + 20);
			//	ctx.rotate(50*Math.PI/180);
			}
			// 网格
			/*ctx.lineWidth="0.5";
			ctx.strokeStyle = "blue";
			ctx.moveTo(siteX + cellWidth  * i,siteY);
			ctx.lineTo(siteX + cellWidth  * i,siteY + siteHeight);*/
			
		};		
		
		// 画0轴
		ctx.lineWidth="0.5";
		ctx.strokeStyle = "blue";
		ctx.moveTo(siteX,siteY + siteHeight * (1-winFactor));
		ctx.lineTo(siteX + siteWidth,siteY + siteHeight * (1-winFactor));
		
		ctx.font="12px Times new Roman";
		ctx.fillStyle = "red"
		ctx.fillText('0', siteX - 20, siteY + siteHeight);
		ctx.fillText(Configure.SZ_zero, siteX - 30, siteY + siteHeight * (1- winFactor));
		ctx.fillText('(1)', siteX - 20, siteY + siteHeight * (1- winFactor) + 10);
		ctx.fillText(Configure.SZ_zero + Configure.SZ_MaxOffset, siteX - 30, siteY);
		
		ctx.fillStyle = "black";
		ctx.fillText('0', siteX + siteWidth + 10, siteY + siteHeight * (1- winFactor));
		ctx.fillText(Configure.MAX_BEILI + '%', siteX + siteWidth, siteY);
		ctx.stroke(); 

	};
	var drawLine = function() {
		var ctx = drawing.getContext("2d");		
		ctx.beginPath();
		for(i = 0; i < Days.length; i ++) {
			// 画连扳晋级率
			ctx.beginPath();
			if(parseFloat(Days[i][Configure.title2.jinji]) < 33) {
				ctx.fillStyle="green";
			} else {
				ctx.fillStyle="red";
			}
			var rectHeight = siteHeight * winFactor * parseFloat(Days[i][Configure.title2.jinji])/100;
			ctx.fillRect(siteX + cellWidth  * i,
						siteY + siteHeight - rectHeight,
						cellWidth*0.9, rectHeight);		
						
			// 画背离率
			ctx.fillStyle="black";
			var pointH = siteHeight * (1-winFactor) * parseFloat(Days[i][Configure.title2.beili])/Configure.MAX_BEILI;
			var point = {x :siteX + cellWidth  * i + 0.5 * cellWidth,
						y: siteY + siteHeight*(1-winFactor) - pointH};	
			if (parseFloat(Days[i][Configure.title2.beili]) > 8) {
				ctx.fillStyle="red";
				ctx.fillRect(point.x, point.y, 6, 6);
			} else if(parseFloat(Days[i][Configure.title2.beili]) < 3){
				ctx.fillStyle="green";
				ctx.fillRect(point.x, point.y, 6, 6);
			}
			
			if (i < Days.length - 1) {// 不是最后一个点
				var pointNextH = siteHeight * (1-winFactor) * parseFloat(Days[i + 1][Configure.title2.beili])/Configure.MAX_BEILI;
				var pointNext = {x:siteX + cellWidth  * (i + 1) + 0.5 * cellWidth,
								y: siteY + siteHeight*(1-winFactor) - pointNextH};
				ctx.lineWidth="2";
				ctx.strokeStyle = "black";
				ctx.moveTo(point.x, point.y);
				ctx.lineTo(pointNext.x, pointNext.y);
				ctx.stroke();
			} else {
				ctx.font="12px Times new Roman";
				ctx.fillText(parseFloat(Days[i][Configure.title2.beili]) + '%', point.x + 10, point.y);
			}
			
			// 画SZ
			ctx.fillStyle="red";
			var szPointH = siteHeight * (1-winFactor) * 
				(parseFloat(Days[i][Configure.title2.sz])- Configure.SZ_zero)/Configure.SZ_MaxOffset;
			var szPoint = {x: siteX + cellWidth  * i + 0.5 * cellWidth,
					y: siteY + siteHeight*(1-winFactor) - szPointH};
		//	ctx.fillRect(szPoint.x, szPoint.y, 2, 2);
			if (i < Days.length - 1) {// 不是最后一个点
				var pointNextH = siteHeight * (1-winFactor) * 
					(parseFloat(Days[i + 1][Configure.title2.sz]) - Configure.SZ_zero)/Configure.SZ_MaxOffset;
				var szpointNext = {x:siteX + cellWidth  * (i + 1) + 0.5 * cellWidth,
								y: siteY + siteHeight*(1-winFactor) - pointNextH};
				ctx.lineWidth="0.5";
				ctx.strokeStyle = "red";
				ctx.moveTo(szPoint.x, szPoint.y);
				ctx.lineTo(szpointNext.x, szpointNext.y);
				ctx.stroke();
			} else {
				ctx.font="12px Times new Roman";
				ctx.fillText(parseFloat(Days[i][Configure.title2.sz]) + '', szPoint.x + 10, szPoint.y);
			}
			
		};
		ctx.stroke();
	};
	
	var drawGaiNian = function() {
		var ctx = drawing.getContext("2d");		
		ctx.beginPath();
		ctx.fillStyle="blue";
		for(i = 0; i < Days.length; i ++) {
			var gaiaNainArr = Days[i][Configure.title2.gaiNianRank];
			gaiaNainArr.forEach((g)=> {    //  g : [1, {times:11, weight:17}]
				var pointH = siteHeight * (1-winFactor) * 
								parseFloat(g[1].weight - Configure.Min_weight)/Configure.Max_weight;
				var point = {x :siteX + cellWidth  * i + 0.5 * cellWidth,
						y: siteY + siteHeight*(1-winFactor) - pointH};	
				ctx.fillRect(point.x, point.y, 2, 2);	
				var isEnd = true;				
				if (i < Days.length - 1) {   // 不是最后一天
					var gaiaNainArrNext = Days[i+1][Configure.title2.gaiNianRank];
					
					gaiaNainArrNext.forEach((gNext)=>{
						if (gNext[0] == g[0]){
							var pointNextH = siteHeight * (1-winFactor) * 
									parseFloat(gNext[1].weight - Configure.Min_weight)/Configure.Max_weight;
							var pointNext = {x:siteX + cellWidth  * (i + 1) + 0.5 * cellWidth,
												y: siteY + siteHeight*(1-winFactor) - pointNextH};
							ctx.lineWidth="2";
							ctx.strokeStyle = "blue";
							ctx.moveTo(point.x, point.y);
							ctx.lineTo(pointNext.x, pointNext.y);
							ctx.stroke();
							isEnd = false;
						}
					});
				}
				if (isEnd) {  // 没有连线，画名称
					ctx.font="10px Times new Roman";
					ctx.fillText('<' + g[0] + '>', point.x + 10, point.y);
				};
			});

		};
	};
	
	var draw = function() {
		if (drawing.getContext){
			drawSite();
			drawLine();
			drawGaiNian();
		}
	}
	
	return {
		init: init,
		draw: draw,
		Days:Days
	}
})();
