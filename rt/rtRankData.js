 'use strict';
(function(exports){	
	const datesAreOnSameDay = function(first, second) {
		return first.getFullYear() === second.getFullYear() &&
				first.getMonth() === second.getMonth() &&
				first.getDate() === second.getDate();
	}

	let rtGaiData = function () {
		var storeData = LocalStore.get('rtGaiData');
		if(storeData) {
			this.gRankData = storeData;
			if(!datesAreOnSameDay(new Date(this.gRankData.date), new Date())) {
				//如果不是今天的数据需要清空
				for(var i = 0; i < 240; i ++) {
					this.gRankData.data[i].gaiRank = [];
				}
			}
		} else {
			this.gRankData = {
				date: new Date(),
				data: [],
			};
			
			for (var i = 0; i < 240; i ++) {
				this.gRankData.data.push({
					index:i,
					gaiRank:[],
				})
			}
		}
	};
	
	
	rtGaiData.prototype.getIndexFromDate = function(date) {
		var index = -1;
		var hour = date.getHours();
		var minute = date.getMinutes();
		if (hour == 9 && minute >= 30) {
			index = minute - 30;
		} else if(hour == 10) {
			index = 30 + minute;
		}else if(hour == 11 && minute < 30) {
			index = 90 + minute;
		}
		else if(hour == 13) {
			index = minute + 120;
		}else if(hour == 14) {
			index = minute + 180;
		}else {
			index = 240;
		}
		return index;
	}
	
	rtGaiData.prototype.getRankData = function() {

		return this.gRankData;
	}
	rtGaiData.prototype.getRankDataFromindex = function() {
		//return this.gRankData;
	};
	
	rtGaiData.prototype.setRankDataFromDate = function(d , dArr) {
		this.gRankData.date = d;
		var index = this.getIndexFromDate(d);
		if (index >= 0 && index < 240) {
			this.gRankData.data[index].gaiRank = dArr;
			//清空index后面的数据
			for(var i = index; i < 240; i ++) {
				this.gRankData.data[i].gaiRank = [];
			}
			// 保存到storage避免数据丢失
			LocalStore.set('rtGaiData', this.gRankData);
		} else {
			// debug 数据
		/*	for(var i = 4; i < 240; i ++) {
				this.gRankData.data[i].gaiRank = dArr;
			}
			LocalStore.set('rtGaiData', this.gRankData); */
		}
	};
	
	exports.GaiData = rtGaiData;	
}(window));
