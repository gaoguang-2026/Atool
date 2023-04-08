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
	var cellWidth;
	var cell_factor = 1;
	
	var clear = function()  {
		
	};
	var drawSite = function() {
		//画线
		var ctx = drawing.getContext("2d");		
		ctx.beginPath();
		ctx.lineWidth="0.5";
		ctx.strokeStyle = Configure.site_color;
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
		///
		ctx.fillStyle = Configure.site_color;
		ctx.fillText('0', siteX + siteWidth - 10, siteY + siteHeight);
		ctx.fillText('5', siteX + siteWidth - 16, siteY + 12);
		
		ctx.fillText('09:30', siteX - 10, siteY + siteHeight + 15);
		ctx.fillText('11:30(13:00)', siteX + siteWidth/2 - 16, siteY + siteHeight + 15);
		ctx.fillText('15:00', siteX + siteWidth - 25, siteY + siteHeight + 15);
		ctx.stroke(); 
	};
	var drawGainLine = function(name, color) {
		var ctx = drawing.getContext("2d");		
		ctx.beginPath();
		ctx.fillStyle= color;
		var rtRankData = parserRT.getGaiRankData();       // getRankData() -> {date: new Date,data: []};
		var getGaiFromIndex = function(index) {  // index  0 ~ 239
			return rtRankData.getRankData().data[index].gaiRank.find((d)=>{
				return d[Configure.titleGainian.name] == name;
			})
		}
		var last = rtRankData.getIndexFromDate(new Date());
		last = last > 240 ? 240 : last;
		for(i = 0; i < last; i ++) {
			var g = getGaiFromIndex(i);
			if(g && g[Configure.titleGainian.weight]) {
				var pointH = siteHeight * (parseFloat(g[Configure.titleGainian.weight])- 0)/5;
				var szPoint = {x: siteX + cellWidth  * i + 0.5 * cellWidth,
					y: siteY + siteHeight - pointH};
				//	ctx.fillRect(szPoint.x, szPoint.y, 2, 2);
		
				if (i < last - 1) {// 不是最后一个点
					var gNext = getGaiFromIndex(i + 1);
					if(gNext) {
						var pointNextH = siteHeight  * 
							(parseFloat(gNext[Configure.titleGainian.weight]) - 0)/5;
						var szpointNext = {x:siteX + cellWidth  * (i + 1) + 0.5 * cellWidth,
											y: siteY + siteHeight - pointNextH};
						ctx.lineWidth="2";
						ctx.strokeStyle = color;
						ctx.moveTo(szPoint.x, szPoint.y);
						ctx.lineTo(szpointNext.x, szpointNext.y);
						ctx.stroke();
					}
				} else {
					ctx.font="14px 楷体"
					ctx.fillText(g[Configure.titleGainian.name], szPoint.x - 40, szPoint.y - 30);
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
		drawing.getContext("2d").clearRect(rect.x, rect.y, rect.width, rect.height);
		clear();
		console.log('canvasRT redraw');
		drawSite();
		drawGain();
	}
	var draw = function(c, r) {
		if (c.getContext){
			drawing = c;
			rect = r;
			width = rect.width;
			height = rect.height;
			siteX = rect.x + width * (1 - width_factor)/2;
			siteY = rect.y + height * (1 - height_factor)/2;
			siteWidth = width * width_factor;
			siteHeight = height * height_factor;
			
			cellWidth = siteWidth/240 * cell_factor;
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