 'use strict';

(function(exports){	

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
	bandEchelon.prototype.ticket_miss_period = 10;
	bandEchelon.prototype.getBoardDateIndex = function(ticket, selectDate) {
		var dayNumber = parseInt(ticket[Configure.replaceTitleDate(Configure.title.dayNumber, selectDate)]);
		dayNumber = dayNumber > 0 ? dayNumber : 1;  // check valid 
		var startIndex = this.dateArr.indexOf(selectDate) + dayNumber - 1;
		
		var obj = {};
		for (var i = 1; i <= this.ticket_miss_period ; i ++ ) {
			var param = {sheetName:this.dateArr[startIndex + i],
				ticketCode:ticket[Configure.title.code]};
			obj.tkt = workbook.getValue(param);
			if(obj.tkt) {
				obj.date = this.dateArr[startIndex + i];
				break;
			}
		}
		if (obj.tkt) {
			startIndex = this.getBoardDateIndex(obj.tkt, obj.date);
		}
		return startIndex;
	};
	
	bandEchelon.prototype.drawTitle = function () {
		var ctx = this.canvas.getContext("2d");	
		ctx.lineWidth="2";
		ctx.font="16px Times new Roman";
		ctx.fillStyle = 'blue';
		ctx.fillText(this.echelon.name + ' ' + this.ticket_miss_period + '天波段', this.rect.x + 5, this.rect.y + 15);
	};
	
	bandEchelon.prototype.getSitePoint = function (ticket) {
		var retP = this.points[0];
		this.points = this.points.slice(1);
		return retP;
	};
	
	bandEchelon.prototype.filterTickets = function() {
		this.tickets = this.tickets.filter((t)=>{
			var isSelect = true;
			//首板
			var dayNumber = t[Configure.replaceTitleDate(Configure.title.dayNumber, t.selectDate)];
			if (dayNumber > 1 || this.dateArr.indexOf(t.startDate) - this.dateArr.indexOf(t.selectDate)
					< Configure.Echelons_tickit_period ) {
				isSelect = false;
			} 
			return isSelect;
		});  
		
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
