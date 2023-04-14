var canvasRT = (function() {
	var drawing;
	var rect;
	var width = 0;
	var height = 0;
	var width_factor = 0.95;
	var height_factor = 0.8;
	var siteX;
	var siteY;
	var siteHeight;
	var siteWidth;
	var cellWidth, cellNum;
	var cell_factor = 1;
	var site_weight_max = Configure.RT_GAI_show_weight_maxOffset + 
							Configure.RT_GAI_show_weight_min;
	var rtShowDays_num = Configure.RT_canvas_show_days_num;				
	
	var clear = function()  {
		drawing.getContext("2d").clearRect(rect.x, rect.y, rect.width, rect.height);
	};
	var drawSite = function() {
		//画线
		var ctx = drawing.getContext("2d");		
		ctx.beginPath();
		ctx.lineWidth="0.5";
		ctx.strokeStyle = 'grey';
		ctx.moveTo(siteX,siteY);
		ctx.lineTo(siteX ,siteY + siteHeight);
		ctx.lineTo(siteX + siteWidth, siteY + siteHeight);
		ctx.lineTo(siteX + siteWidth, siteY);
		ctx.lineTo(siteX,siteY);
		
		// 画内部网格
		for(var i = 1; i <= 3; i ++) {
			ctx.moveTo(siteX  + siteWidth * i / 4,siteY);
			ctx.lineTo(siteX + siteWidth * i / 4,siteY + siteHeight);	
			ctx.moveTo(siteX,siteY + siteHeight * i / 4);
			ctx.lineTo(siteX + siteWidth ,siteY + siteHeight * i / 4);
		}
		ctx.stroke(); 
		///
		var offset = rtShowDays_num * 240 / Configure.RT_data_length;
		ctx.fillStyle = 'red';
		ctx.font="14px 楷体";
		ctx.fillText(Configure.RT_GAI_show_weight_min, siteX + siteWidth + 4, siteY + siteHeight);
		ctx.fillText(site_weight_max, siteX + siteWidth + 4, siteY + 12);
		
		ctx.fillStyle = Configure.site_color;
		ctx.font="14px 楷体";
		ctx.fillText('09:30', siteX - 10, siteY + siteHeight + 15);
		ctx.fillText('15:00',  siteX + siteWidth/offset - 30, siteY + siteHeight + 15);
		ctx.fillText( Configure.getDateStr(new Date(parserRT.getGaiRankData().getRankData().eDate), '-'), 
						siteX + siteWidth * (rtShowDays_num - 1)/
						rtShowDays_num, 
						siteY - 10);
		ctx.stroke(); 
	};
	
	var ColorReverse = function(OldColorValue){
		var OldColorValue = "0x"+OldColorValue.replace(/#/g,"");
		var str="000000"+(0xFFFFFF-OldColorValue).toString(16);
		return '#' + str.substring(str.length-6,str.length);
	}

	var drawEchelonLine = function(echelon, color, eIndex, shouldColorReverse = true) {
		var ctx = drawing.getContext("2d");		
		ctx.beginPath();
		ctx.fillStyle= color;
		var rtRankData = parserRT.getGaiRankData();   // getRankData() -> {eDate:,data: []};
		// 从数据中取要显示的第一天index 和最后一天 indexLast
		var index = Configure.RT_data_length * 
						(Configure.RT_canvas_record_days_num - rtShowDays_num) / 
							Configure.RT_canvas_record_days_num;
		var indexLast = rtRankData.getIndexFromDate(new Date(rtRankData.getRankData().eDate));
		indexLast = indexLast > Configure.RT_data_length ? Configure.RT_data_length : indexLast;
		var eFirst; 	// 记录第一个点，数据不连贯，连线难看
		var offsetX = cellWidth * eIndex/ Configure.RT_canvas_show_echelons_num;  // 错位显示不同Echelon的cell
		for(i = 0; i < cellNum; i ++, index ++) {
			var e = parserRT.getEchelonByIndex(echelon, index);
			if(e&& e.score!=0) {
				var pointH = siteHeight * 
					(parseFloat(e.score) - Configure.RT_GAI_show_weight_min)/
						(site_weight_max - Configure.RT_GAI_show_weight_min);
				var szPoint = {x: siteX + cellWidth  * i + offsetX,
					y: siteY + siteHeight - pointH};
				//	ctx.fillRect(szPoint.x, szPoint.y, 2, 2);
				if(!eFirst ) {
					eFirst = parserRT.getEchelonByIndex(echelon, index); 
					ctx.font="14px 楷体";
					ctx.fillText('<' + e.name + '>', 
					Configure.isAfterNoon() ?  siteX  : siteX + siteWidth - 70, 
					szPoint.y);
					ctx.stroke();
				}
				if(eFirst && eFirst.score != 0) {
					ctx.beginPath();
					var pointFirstH = siteHeight  * 
							(parseFloat(eFirst.score) - Configure.RT_GAI_show_weight_min)/
								(site_weight_max - Configure.RT_GAI_show_weight_min);
					var szpointFirst = {x:siteX + cellWidth  * i + offsetX,
											y: siteY + siteHeight - pointFirstH};
					ctx.lineWidth= cellWidth/Configure.RT_canvas_show_echelons_num;
					ctx.strokeStyle = szPoint.y > szpointFirst.y && shouldColorReverse ?
										ColorReverse(color) : color;
					ctx.moveTo(szPoint.x, szPoint.y);
					ctx.lineTo(szpointFirst.x, szpointFirst.y);
					ctx.stroke();
				}
				ctx.stroke();
			}
		}
	};
	
	var drawEchelons = function(nameArr) {
		var displayIndex = 0;
		Array.from(parserRT.getRTEchelons()).forEach((e) => {
			var color = Configure.echelon_color[displayIndex%Configure.echelon_color.length];
			if((!nameArr || nameArr.length == 0) &&
					displayIndex <= Configure.RT_canvas_show_echelons_num) {   //最多显示5个
				drawEchelonLine(e, color, displayIndex, false);
				displayIndex ++;
			} else {
				if(nameArr.includes(e.name) && 
					displayIndex <= Configure.RT_canvas_show_echelons_num){
					drawEchelonLine(e, color, displayIndex);
					displayIndex ++;
				};
			}
		});
	};
	var reload = function() {
		cellNum = Configure.RT_data_length * rtShowDays_num / 
							Configure.RT_canvas_record_days_num;
		cellWidth = siteWidth/ cellNum  * cell_factor;
	};
	var reDraw = function(nameArr, rtShowD) {
		clear();
		console.log('canvasRT redraw');
		site_weight_max = Math.ceil(parserRT.getGaiRankData().getMaxScore());
		rtShowDays_num = rtShowD;
		
		reload();
		drawSite();
		drawEchelons(nameArr);
	}
	var draw = function(c, r, nameArr, rtShowD) {
		if (c.getContext){
			drawing = c;
			rect = r;
			
			width = rect.width;
			height = rect.height;
			siteX = rect.x + width * (1 - width_factor)/2;
			siteY = rect.y + height * (1 - height_factor)/2;
			siteWidth = width * width_factor;
			siteHeight = height * height_factor;
			console.log('RT canvas width:' + width + 
					' height:' + height + 
					' siteX' + siteX +
					' siteY:' + siteY +
					' siteWidth:' + siteWidth + 
					' siteHeight:' + siteHeight);		
			reDraw(nameArr, rtShowD);
		}
	};
	return {
		draw:draw,
		reDraw:reDraw,
	}
})();