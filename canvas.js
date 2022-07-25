
var canvas = (function(canvas) {
	var drawing;
	var Days;
	
	var emotionPoints = [];   // 保存背离率的点
	var szPoints = [];   // 保存sz的点
	
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
	
	var init = function(c, winXfactor = 1) {
		drawing = c;
		Days = workbook.getDatesSheet();
		
		width = c.width * winXfactor;
		height = c.height;
		
		var ctx = drawing.getContext("2d");
		ctx.clearRect(0, 0, width, height);
		
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
					
		// 通过parser分析出当天的echelon
		Days.forEach((d)=>{
			var dateStr = Configure.formatExcelDate(d[Configure.title2.date], '');
			if (workbook.sheetExist(dateStr)) {
				d[Configure.title2.echelons] = parser.getEchelons(dateStr);
				var objBH = parser.getBoardHeight(dateStr);
				if (objBH) {
					d[Configure.title2.boardHeight] = objBH.value;
					d[Configure.title2.dragon] = objBH.name;
				}
			} else {
				d[Configure.title2.echelons] = [];
				d[Configure.title2.boardHeight] = 0;
			}
		});
	};

	var drawSite = function(indecatorName) {
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
				ctx.font="14px Times new Roman";
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
		
		ctx.font="14px Times new Roman";
		ctx.fillStyle = Configure.line_color;
		ctx.fillText('0', siteX - 20, siteY + siteHeight);
		ctx.fillText('(1)', siteX - 20, siteY + siteHeight * (1- winFactor) + 10);
		
		ctx.fillStyle = Configure.line_color;
		ctx.fillText('0', siteX + siteWidth + 10, siteY + siteHeight * (1- winFactor));
		ctx.fillText(Configure.MAX_BEILI + '%', siteX + siteWidth, siteY);
		ctx.fillStyle = Configure.echelon_color[0];
		ctx.fillText('(' + Configure.Min_echelon_score + ')', siteX + siteWidth + 6, siteY + siteHeight * (1- winFactor) + 15);
		ctx.fillText('(' + Configure.Max_echelon_score + ')', siteX + siteWidth, siteY + 15);
		
		var zero, max;
		switch(indecatorName) {
			case '上证指数':
				ctx.fillStyle = Configure.sz_color;
				zero = Configure.SZ_zero;
				max = Configure.SZ_zero + Configure.SZ_MaxOffset;
				break;
			case '连扳高度':
				ctx.fillStyle = Configure.boardHeight_color;
				var temp = Configure.BH_zero > 65537 ? 65537 : 1;
				zero = parseInt(Configure.BH_zero/temp);
				max = parseInt((Configure.BH_zero + Configure.BH_MaxOffset)/temp);
				break;
			case '连扳数量':
				zero = 0;
				max = 30;
				break;
			default:
				break;
		};
		if(zero && max) {
			ctx.fillText(zero, siteX - 30, siteY + siteHeight * (1- winFactor));
			ctx.fillText(max, siteX - 30, siteY);
		}
		ctx.stroke(); 
	};
	var drawLine = function(color, zero, max, title, draw = true) {
		var ctx = drawing.getContext("2d");		
		ctx.beginPath();
		ctx.fillStyle= color;
		var pointH = siteHeight * (1-winFactor) * 
			(parseFloat(Days[i][title])- zero)/max;
		var szPoint = {x: siteX + cellWidth  * i + 0.5 * cellWidth,
				y: siteY + siteHeight*(1-winFactor) - pointH};
		//	ctx.fillRect(szPoint.x, szPoint.y, 2, 2);
		if (draw) {
			if (i < Days.length - 1) {// 不是最后一个点
				var pointNextH = siteHeight * (1-winFactor) * 
					(parseFloat(Days[i + 1][title]) - zero)/max;
				var szpointNext = {x:siteX + cellWidth  * (i + 1) + 0.5 * cellWidth,
								y: siteY + siteHeight*(1-winFactor) - pointNextH};
				ctx.lineWidth="1";
				ctx.strokeStyle = color;
				ctx.moveTo(szPoint.x, szPoint.y);
				ctx.lineTo(szpointNext.x, szpointNext.y);
				ctx.stroke();
			} else {
				ctx.font="14px Times new Roman"
				ctx.fillText(parseFloat(Days[i][title]) + '', szPoint.x, szPoint.y);
				ctx.stroke();
			}
		}
		return szPoint;
	};
	var drawIndicators = function(indecatorName) {
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
						
			emotionPoints.push({point:point, value:parseFloat(Days[i][Configure.title2.beili]), 
						date:Days[i][Configure.title2.date]});
						
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
				ctx.font="14px Times new Roman";
				ctx.fillText(parseFloat(Days[i][Configure.title2.beili]) + '%', point.x + 10, point.y);
				ctx.stroke();
			}
			// 画sz,  需要保存点给AI使用
			var point = drawLine(Configure.sz_color, Configure.SZ_zero,
								Configure.SZ_MaxOffset, Configure.title2.sz , indecatorName == '上证指数');
			szPoints.push({point:point, value:parseFloat(Days[i][Configure.title2.sz]),
									 date:Days[i][Configure.title2.date]});
				
			switch(indecatorName) {
				case '上证指数':
					break;
				case '连扳高度':
					//画连扳高度
					point = drawLine(Configure.boardHeight_color, Configure.BH_zero,
								Configure.BH_MaxOffset, Configure.BH_Draw_title);
					if (i < Days.length - 1 && i > 0 && Days[i][Configure.title2.dragon] &&
					   Days[i][Configure.BH_Draw_title] > Days[i+1][Configure.BH_Draw_title] &&
					   Days[i][Configure.BH_Draw_title] > Days[i-1][Configure.BH_Draw_title]) {    // 只写最高点的名字
						ctx.fillText(Days[i][Configure.title2.dragon].substr(0,2) + '', point.x - 10, point.y - 5);
						ctx.stroke();
					}
					break;
				case '连扳数量':
					drawLine(Configure.boardHeight_color, 0, 30, Configure.title2.lianban);
					break;
				default:
					break;
			}

		};
		ctx.stroke();
	};
	
	var drawEchelon = function(echelonNames) {
		var ctx = drawing.getContext("2d");		
		for(i = 0; i < Days.length; i ++) {
			var echelonArr = Days[i][Configure.title2.echelons];
			echelonArr.forEach((g)=> {    //  g : {name:'', hotPoints:[], score:''};
				if(echelonNames.indexOf(g.name) != -1) {
					var drawNameDone = false;	
					var pointH = siteHeight * (1-winFactor) * 
									parseFloat(g.score - Configure.Min_echelon_score)/Configure.Max_echelon_score;
					var point = {x :siteX + cellWidth  * i + 0.5 * cellWidth,
							y: siteY + siteHeight*(1-winFactor) - pointH};	
							
					var color = Configure.echelon_color[echelonNames.indexOf(g.name)%Configure.echelon_color.length];
								
					if (i < Days.length - 1) {   // 不是最后一天
						var echelonsNext = Days[i+1][Configure.title2.echelons];
						
						echelonsNext.forEach((gNext)=>{
							if (gNext.name == g.name){
								var pointNextH = siteHeight * (1-winFactor) * 
										parseFloat(gNext.score - Configure.Min_echelon_score)/Configure.Max_echelon_score;
								var pointNext = {x:siteX + cellWidth  * (i + 1) + 0.5 * cellWidth,
													y: siteY + siteHeight*(1-winFactor) - pointNextH};
								ctx.beginPath();
								ctx.lineWidth="2";
								ctx.strokeStyle = color;
								ctx.moveTo(point.x, point.y);
								ctx.lineTo(pointNext.x, pointNext.y);
								ctx.stroke();
								drawNameDone = true;
							}
						});
					}
					if (!drawNameDone) {  // 没有连线，画名称
						drawNameDone = true;
						ctx.beginPath();
						ctx.fillStyle= color;
						ctx.font="12px Times new Roman";
						ctx.fillText('<' + g.name + '>', point.x + 5, point.y);
						ctx.stroke();
					};
				}
			});

		};
	};
	
	var getLastEmotionPoints = function(num) {
		var n = num > emotionPoints.length ? emotionPoints.length : num;
		var retP = [];
		for(var i = emotionPoints.length - 1; i > emotionPoints.length - 1 - n; i --) {
			retP.push(emotionPoints[i]);
		}
		return retP;
	};
	
	var getLastSZPoints = function(num) {
		var n = num > szPoints.length ? szPoints.length : num;
		var retP = [];
		for(var i = szPoints.length - 1; i > szPoints.length - 1 - n; i --) {
			retP.push(szPoints[i]);
		}
		return retP;
	};
	
	var draw = function(echelonNames, indecatorName) {
		if (drawing.getContext){
			drawSite(indecatorName);
			drawIndicators(indecatorName);
			drawEchelon(echelonNames);
		}
	}
	
	return {
		init: init,
		draw: draw,
		getLastEmotionPoints:getLastEmotionPoints,
		getLastSZPoints:getLastSZPoints
	}
})();
