 'use strict';
(function(exports){	
	var storageName = 'rtGaiData';
	
	const datesAreOnSameDay = function(first, second) {
		return first.getFullYear() === second.getFullYear() &&
				first.getMonth() === second.getMonth() &&
				first.getDate() === second.getDate();
	}

	let rtGaiData = function () {
		var storeData = LocalStore.get(storageName);
		if(storeData) {
			this.gRankData = storeData;
			//如果eDate不是今天并且今天不是周末， 数据清理
			var today = new Date();
			if(!datesAreOnSameDay(new Date(this.gRankData.eDate), today) && 
				today.getDay() != 0 && today.getDay() != 6) {
				this.gRankData.sDate = this.gRankData.eDate;
				this.gRankData.eDate = JSON.stringify(today).replace(/\"/g, '');
				var start = Configure.RT_data_length / Configure.RT_canvas_record_days_num;
				this.gRankData.data = this.gRankData.data.slice(start, Configure.RT_data_length);
				for(var i = start; i < Configure.RT_data_length; i ++) {
					this.gRankData.data.push({
						gaiRank:[],
					});
				}
			}
		} else {
			this.gRankData = {
				sDate: new Date(),
				eDate: new Date(),
				data: [],
			};
			
			for (var i = 0; i < 240; i ++) {
				this.gRankData.data.push({
					gaiRank:[],
				})
			}
		}
	};
	
	
	rtGaiData.prototype.getIndexFromDate = function(d = new Date()) {
		var date = d;
		var hour = date.getHours();
		var minute = date.getMinutes();
		var base = Configure.RT_data_length * (Configure.RT_canvas_record_days_num - 1)/ 
							Configure.RT_canvas_record_days_num;
		var offset = Configure.RT_canvas_record_days_num * 240 / Configure.RT_data_length;
		var index = -1;
		if (hour == 9 && minute >= 30) {
			index = (minute - 30) / offset;
		} else if(hour == 10) {
			index = (minute + 30) /offset;
		}else if(hour == 11 && minute < 30) {
			index = (minute + 90) /offset;
		}
		else if(hour == 13) {
			index = (minute + 120) /offset;
		}else if(hour == 14) {
			index = (minute + 180) /offset;
		}else {
			index = 240/offset;
		}
		return base + Math.floor(index);
	}
	
	rtGaiData.prototype.getRankData = function() {
		return this.gRankData;
	}
	rtGaiData.prototype.getLastRankData = function() {
		var index = this.getIndexFromDate(new Date(this.gRankData.eDate));
		
		return this.gRankData.data[index] ? this.gRankData.data[index].gaiRank : [];
	};
	
	rtGaiData.prototype.setRankDataFromNow = function(dArr) {
		var d = new Date();
		var index = this.getIndexFromDate(d);
		var base = Configure.RT_data_length * (Configure.RT_canvas_record_days_num - 1)/ 
							Configure.RT_canvas_record_days_num;
		if (index >= base && index < Configure.RT_data_length) {
			this.gRankData.eDate = d;
			this.gRankData.data[index].gaiRank = dArr;
			// 保存到storage避免数据丢失
			LocalStore.set(storageName, this.gRankData);
		} else {
			// debug 数据
		/*	for(var i = 4; i < 240; i ++) {
				this.gRankData.data[i].gaiRank = dArr;
			}
			LocalStore.set(storageName, this.gRankData);  */
		}
	};
	
	exports.GaiData = rtGaiData;	
}(window));
