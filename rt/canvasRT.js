var canvasRT = (function() {
	var drawing;
	var rect;
	var width = 0;
	var height = 0;
	var width_factor = 0.9;
	var height_factor = 0.8;
	var siteX;
	var siteY;
	var siteHeight;
	var siteWidth;
	var cellWidth, cellNum;
	var cell_factor = 1;
	
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
		var offset = Configure.RT_canvas_show_days_num * 240 / Configure.RT_data_length;
		ctx.fillStyle = 'red';
		ctx.font="14px 楷体";
		ctx.fillText(Configure.RT_GAI_show_weight_min, siteX + siteWidth + 4, siteY + siteHeight);
		ctx.fillText(Configure.RT_GAI_show_weight_max, siteX + siteWidth + 4, siteY + 12);
		
		ctx.fillStyle = Configure.site_color;
		ctx.font="14px 楷体";
		ctx.fillText('09:30', siteX - 10, siteY + siteHeight + 15);
		ctx.fillText('15:00',  siteX + siteWidth/offset - 30, siteY + siteHeight + 15);
		ctx.fillText( Configure.getDateStr(new Date(parserRT.getGaiRankData().getRankData().eDate), '-'), 
						siteX + siteWidth * (Configure.RT_canvas_show_days_num - 1)/
						Configure.RT_canvas_show_days_num, 
						siteY - 10);
		ctx.stroke(); 
	};
	var drawGainLine = function(name, color) {
		var ctx = drawing.getContext("2d");		
		ctx.beginPath();
		ctx.fillStyle= color;
		var rtRankData = parserRT.getGaiRankData();   // getRankData() -> {sDate:,eDate:,data: []};
		var getGaiFromIndex = function(index) {  // index  0 ~ 239
			return rtRankData.getRankData().data[index].gaiRank.find((d)=>{
				return d[Configure.titleGainian.name] == name;
			})
		}
		
		// 从数据中取要显示的第一天index 和最后一天 indexLast
		var index = Configure.RT_data_length * 
						(Configure.RT_canvas_record_days_num - Configure.RT_canvas_show_days_num) / 
							Configure.RT_canvas_record_days_num;
		var indexLast = rtRankData.getIndexFromNow();
		indexLast = indexLast > Configure.RT_data_length ? Configure.RT_data_length : indexLast;
		for(i = 0; i < cellNum; i ++, index ++) {
			var g = getGaiFromIndex(index);
			if(g && g[Configure.titleGainian.weight]) {
				var pointH = siteHeight * 
					(parseFloat(g[Configure.titleGainian.weight])- Configure.RT_GAI_show_weight_min)/
						Configure.RT_GAI_show_weight_max;
				var szPoint = {x: siteX + cellWidth  * i + 0.5 * cellWidth,
					y: siteY + siteHeight - pointH};
				//	ctx.fillRect(szPoint.x, szPoint.y, 2, 2);
		
				if (index < indexLast - 1) {// 不是最后一个点
					var gNext = getGaiFromIndex(index + 1);
					if(gNext) {
						var pointNextH = siteHeight  * 
							(parseFloat(gNext[Configure.titleGainian.weight]) - Configure.RT_GAI_show_weight_min)/
								Configure.RT_GAI_show_weight_max;
						var szpointNext = {x:siteX + cellWidth  * (i + 1) + 0.5 * cellWidth,
											y: siteY + siteHeight - pointNextH};
						ctx.lineWidth="2";
						ctx.strokeStyle = color;
						ctx.moveTo(szPoint.x, szPoint.y);
						ctx.lineTo(szpointNext.x, szpointNext.y);
						ctx.stroke();
					}
				} else {
					ctx.font="14px 楷体";
					
					ctx.fillText('<' + g[Configure.titleGainian.name] + '>', 
					Configure.isAfterNoon() ?  siteX  : siteX + siteWidth - 70, 
					szPoint.y);
					ctx.stroke();
				}
			}
		}
	};
	
	var drawGain = function(nameArr) {
		Array.from(parserRT.getRTEchelons()).forEach((e, index) => {
			var color = Configure.echelon_color[index%Configure.echelon_color.length];
			drawGainLine(e.name, color);
		});
	};
	var reDraw = function() {
		clear();
		console.log('canvasRT redraw');
		drawSite();
		drawGain();
	}
	var draw = function(c, r) {
		if (c.getContext){
			drawing = c;
			rect = r;
			clear();
			
			width = rect.width;
			height = rect.height;
			siteX = rect.x + width * (1 - width_factor)/2;
			siteY = rect.y + height * (1 - height_factor)/2;
			siteWidth = width * width_factor;
			siteHeight = height * height_factor;
			
			cellNum = Configure.RT_data_length * Configure.RT_canvas_show_days_num / 
							Configure.RT_canvas_record_days_num;
			cellWidth = siteWidth/ cellNum  * cell_factor;
			console.log('RT canvas width:' + width + 
					' height:' + height + 
					' siteX' + siteX +
					' siteY:' + siteY +
					' siteWidth:' + siteWidth + 
					' siteHeight:' + siteHeight);			

		}
	};
	return {
		draw:draw,
		reDraw:reDraw,
	}
})();