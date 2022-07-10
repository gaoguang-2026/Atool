
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
	var winFactor = 0.4;
	
	var init = function(c, sheet, winXfactor = 1) {
		drawing = c;
		Days = sheet;
		
		width = c.width * winXfactor;
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
			var dateStr = Configure.formatExcelDate(d[Configure.title2.date], '');
			if (workbook.sheetExist(dateStr)) {
				var gainainArr = parser.getHotpoint( dateStr );
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
		ctx.strokeStyle = Configure.site_color;
		ctx.moveTo(siteX,siteY);
		ctx.lineTo(siteX ,siteY + siteHeight);
		ctx.lineTo(siteX + siteWidth, siteY + siteHeight);
		ctx.lineTo(siteX + siteWidth, siteY);
		ctx.lineTo(siteX,siteY);
		
		// 画日期
		for(i = 0; i < Days.length; i ++) {
			if ((i % 5 == 0 && (Days.length - i > 8)) || i == Days.length -1) {
				//日期
			//	ctx.rotate(310*Math.PI/180);
				ctx.font="12px Times new Roman";
				ctx.fillStyle = Configure.site_color;
				ctx.fillText(Configure.formatExcelDate(Days[i][Configure.title2.date], '').substr(4,4),
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
		ctx.strokeStyle = Configure.site_color;
		ctx.moveTo(siteX,siteY + siteHeight * (1-winFactor));
		ctx.lineTo(siteX + siteWidth,siteY + siteHeight * (1-winFactor));
		
		ctx.font="12px Times new Roman";
		ctx.fillStyle = Configure.line_color;
		ctx.fillText('0', siteX - 20, siteY + siteHeight);
		ctx.fillText('(1)', siteX - 20, siteY + siteHeight * (1- winFactor) + 10);
		ctx.fillStyle = Configure.sz_color;
		ctx.fillText(Configure.SZ_zero + Configure.SZ_MaxOffset, siteX - 30, siteY);
		ctx.fillText(Configure.SZ_zero, siteX - 30, siteY + siteHeight * (1- winFactor));
		
		ctx.fillStyle = Configure.line_color;
		ctx.fillText('0', siteX + siteWidth + 10, siteY + siteHeight * (1- winFactor));
		ctx.fillText(Configure.MAX_BEILI + '%', siteX + siteWidth, siteY);
		ctx.fillStyle = Configure.gainian_color;
		ctx.fillText('(' + Configure.Min_weight + ')', siteX + siteWidth + 6, siteY + siteHeight * (1- winFactor) + 15);
		ctx.fillText('(' + Configure.Max_weight + ')', siteX + siteWidth, siteY + 15);
		ctx.stroke(); 

	};
	var drawLine = function() {
		var ctx = drawing.getContext("2d");		
		ctx.beginPath();
		for(i = 0; i < Days.length; i ++) {
			// 画连扳晋级率
			ctx.beginPath();
			var rectHeight = siteHeight * winFactor * parseFloat(Days[i][Configure.title2.jinji])/100;
			var rect = {x: siteX + cellWidth  * i,
						y: siteY + siteHeight - rectHeight,
						width: cellWidth*0.9,
						height: rectHeight};
			var grd=ctx.createLinearGradient(rect.x, rect.y + + siteHeight * winFactor * 0.5, 
											rect.x, rect.y);
			if(parseFloat(Days[i][Configure.title2.jinji]) < 33) {
				grd.addColorStop(0,"yellow");
				grd.addColorStop(1,"green");
			} else {
				grd.addColorStop(0,"orange");
				grd.addColorStop(1,"red");
			} 
			ctx.fillStyle=grd;
			ctx.fillRect(rect.x, rect.y, rect.width, rect.height);		
						
			// 画背离率
			ctx.fillStyle="black";
			ctx.strokeStyle = "black";
			var pointH = siteHeight * (1-winFactor) * parseFloat(Days[i][Configure.title2.beili])/Configure.MAX_BEILI;
			var point = {x :siteX + cellWidth  * i + 0.5 * cellWidth,
						y: siteY + siteHeight*(1-winFactor) - pointH};	
						
			grd=ctx.createLinearGradient(siteX, siteY + siteHeight * (1-winFactor), 
											siteX, siteY);
			grd.addColorStop(0,"green");
			grd.addColorStop(0.3,"orange");
			grd.addColorStop(1,Configure.line_color);  
			ctx.fillStyle = grd;
			ctx.strokeStyle = grd;
			if (i < Days.length - 1) {// 不是最后一个点
				var pointNextH = siteHeight * (1-winFactor) * parseFloat(Days[i + 1][Configure.title2.beili])/Configure.MAX_BEILI;
				var pointNext = {x:siteX + cellWidth  * (i + 1) + 0.5 * cellWidth,
								y: siteY + siteHeight*(1-winFactor) - pointNextH};
				ctx.lineWidth="3";
				ctx.moveTo(point.x, point.y);
				ctx.lineTo(pointNext.x, pointNext.y);
				ctx.stroke();
			} else {
				ctx.font="12px Times new Roman";
				ctx.fillText(parseFloat(Days[i][Configure.title2.beili]) + '%', point.x + 10, point.y);
				ctx.stroke();
			}
			
			// 画SZ
			ctx.fillStyle=Configure.sz_color;
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
				ctx.strokeStyle = Configure.sz_color;
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
		ctx.fillStyle= Configure.gainian_color;
		for(i = 0; i < Days.length; i ++) {
			var gaiaNainArr = Days[i][Configure.title2.gaiNianRank];
			gaiaNainArr.forEach((g)=> {    //  g : [1, {times:11, weight:17}]
				var drawNameDone = false;	
				var pointH = siteHeight * (1-winFactor) * 
								parseFloat(g[1].weight - Configure.Min_weight)/Configure.Max_weight;
				var point = {x :siteX + cellWidth  * i + 0.5 * cellWidth,
						y: siteY + siteHeight*(1-winFactor) - pointH};	
		//		ctx.fillRect(point.x, point.y, 2, 2);				
				if (i < Days.length - 1) {   // 不是最后一天
					var gaiaNainArrNext = Days[i+1][Configure.title2.gaiNianRank];
					
					gaiaNainArrNext.forEach((gNext)=>{
						if (gNext[0] == g[0]){
							var pointNextH = siteHeight * (1-winFactor) * 
									parseFloat(gNext[1].weight - Configure.Min_weight)/Configure.Max_weight;
							var pointNext = {x:siteX + cellWidth  * (i + 1) + 0.5 * cellWidth,
												y: siteY + siteHeight*(1-winFactor) - pointNextH};
							ctx.lineWidth="0.5";
							ctx.strokeStyle = Configure.gainian_color;
							ctx.moveTo(point.x, point.y);
							ctx.lineTo(pointNext.x, pointNext.y);
							ctx.stroke();
							drawNameDone = true;
						}
					});
				}
				if (!drawNameDone) {  // 没有连线，画名称
					drawNameDone = true;
 					ctx.font="10px Times new Roman";
					ctx.fillText(g[0].substr(0,1), point.x, point.y);
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
