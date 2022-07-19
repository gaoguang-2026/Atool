 'use strict';

(function(exports){	

	var handOverBar_w = 6;
	var handOverBar_h = 30;

	let bandEchelon = function (canvas, e, rect) {
		Echelon.call(this, canvas, e, rect);

		this.points = [[1/2, 1/12],
						[1/4,3/12],[3/8, 5/12], 
						[3/4, 3/12],[5/8, 5/12],[3/8, 9/12], 
									[1/8, 5/12],[5/8, 9/12],[1/4, 7/12], 
												[1/8, 9/12],[3/4, 7/12],[3/4, 11/12],
															[1/2, 7/12],[1/2,11/12],
																		[1/4, 11/12]];
	};			
	
	function F() {
	}
	// 把F的原型指向Student.prototype:
	F.prototype = Echelon.prototype;
	bandEchelon.prototype = new F();
	bandEchelon.prototype.constructor = bandEchelon;
	bandEchelon.prototype.getBoardDateIndex = function(ticket, selectDate) {
		var dayNumber = parseInt(ticket[Configure.replaceTitleDate(Configure.title.dayNumber, selectDate)]);
		dayNumber = dayNumber > 0 ? dayNumber : 1;  // check valid 
		var startIndex = this.dateArr.indexOf(selectDate) + dayNumber - 1;
		
		var obj = {};
		for (var i = 1; i <= Configure.Band_miss_tickit_period ; i ++ ) {
			var param = {sheetName:this.dateArr[startIndex + i],
				ticketCode:ticket[Configure.title.code]};
			obj.tkt = workbook.getValue(param);
			if(obj.tkt) {
				obj.date = this.dateArr[startIndex + i];
				break;
			}
		}
		if (obj.tkt && this.dateArr.indexOf(obj.date) < Configure.Band_Max_LENGTH) {
			startIndex = this.getBoardDateIndex(obj.tkt, obj.date);
		}
		return startIndex;
	};
	
	bandEchelon.prototype.calBarRect = function(startPoint, drawLenth, index) {
		return {x: startPoint.x + (drawLenth - 1 - index) * handOverBar_w,
							y: startPoint.y,
							width: handOverBar_w,
							height: handOverBar_h};
	};
	/*bandEchelon.prototype.drawBar = function(rect, realHandoverPer, boardStrength) {
		var ctx = this.canvas.getContext("2d");		
		ctx.beginPath();
		ctx.lineWidth="2";

		if(parseFloat(realHandoverPer) < 100 && parseFloat(realHandoverPer) > 0) {
			if(boardStrength == '很强') {
				ctx.fillStyle= 'red';
			} else if (boardStrength == '强'){
				ctx.fillStyle= 'orange';
			} else if (boardStrength == '一般') {
				ctx.fillStyle= '#E0E080';
			} else if (boardStrength == '弱'){
				ctx.fillStyle= 'green';
			}
			
			var barHeight = rect.height * parseFloat(realHandoverPer)/100 * Configure.Echelons_handover_factor;
			ctx.fillRect(rect.x, rect.y + rect.height - barHeight, rect.width * 0.9, barHeight);
	//		ctx.fillStyle= 'black';			
	//		ctx.fillText(realHandoverPer, rect.x + 100, rect.y + rect.height - barHeight);
		} else {
			ctx.fillStyle= 'grey';
			ctx.fillRect(rect.x, rect.y, rect.width * 0.9, rect.height);	
		}
	}; */
	
	bandEchelon.prototype.drawTitle = function () {
		var ctx = this.canvas.getContext("2d");	
		ctx.lineWidth="2";
		ctx.font="16px Times new Roman";
		ctx.fillStyle = 'Orange';
		ctx.fillText(this.echelon.name , this.rect.x + 5, this.rect.y + 15);
		
		ctx.font="12px Times new Roman";
		ctx.fillStyle = 'Orange';
		ctx.fillText('<' + Configure.Band_miss_tickit_period + '天波段>', this.rect.x + 5, this.rect.y + 30);
	};
	
	bandEchelon.prototype.getSitePoint = function (ticket) {
		var retP = this.points[0];
		this.points = this.points.slice(1);
		return retP;
	};
	
	bandEchelon.prototype.get_tickit_period = function() {
		return Configure.Band_tickit_period;
	};
	
	bandEchelon.prototype.filterTickets = function() {
		this.tickets = this.tickets.filter((t)=>{
			var isSelect = true;
			//首板
			var dayNumber = t[Configure.replaceTitleDate(Configure.title.dayNumber, t.selectDate)];
			if (dayNumber > 1 || this.dateArr.indexOf(t.startDate) - this.dateArr.indexOf(t.selectDate)
					< this.get_tickit_period() ) {
				isSelect = false;
			} 
			return isSelect;
		});  
		
		// 计算涨速
		this.tickets.forEach((ticket)=>{
			var param = {
				sheetName: ticket.startDate,
				ticketCode:ticket[Configure.title.code]
			}
			
			var tktStart = workbook.getValue(param);
			var priceStart = tktStart ? tktStart[Configure.title.price] : 0;
			var dayNum = this.dateArr.indexOf(ticket.startDate) - this.dateArr.indexOf(ticket.selectDate);
			ticket.increaseRate = (!priceStart || priceStart == 0) ? 0 : 
				parseFloat((parseFloat(ticket[Configure.title.price]) - priceStart) / (priceStart * dayNum)).toFixed(4);
		});
		workbook.setBandTicket(this.tickets);   // 显示剔除前保存
		console.log(this.tickets);
		// echelon股票
		this.tickets = this.tickets.filter((t) => {
			var isSelect = false;
			this.echelon.hotPoints.forEach((g)=> {
				if(t[Configure.replaceTitleDate(Configure.title.reason, t.selectDate)].indexOf(g) != -1){
						isSelect = true;
				}
			});
			return isSelect;
		})
		
		console.log(this.tickets);
		// 按涨停基因排序，减除多余的
		this.tickets.sort((a, b)=> {
			var bDateNum = this.dateArr.indexOf(b.startDate) - this.dateArr.indexOf(b.selectDate);
			var aDateNum = this.dateArr.indexOf(a.startDate) - this.dateArr.indexOf(a.selectDate);
			return bDateNum - aDateNum;
		});
		this.tickets = this.tickets.slice(0,Configure.Echelons_ticket_NUM);
	};
	
	exports.bandEchelon = bandEchelon;
}(window));
