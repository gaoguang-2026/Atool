
var rtDataManager = (function(){
	var storageNamePrefix = 'rtData';
	var realTimeTickets = [];
	// 实时数据
	var setRTTickets = function(ticketArr) {
		realTimeTickets = [];
		ticketArr.forEach((t)=>{
			realTimeTickets.push(t);
		});
	};
	
	var getRTTicketFromCode = function(code) {
		return realTimeTickets.find((t)=>{
			return t['f12'] == code || code.indexOf(t['f12']) != -1;
		})
	};
	var getRTTickets = function() {
		return realTimeTickets;
	};
	// 当前涨幅大于6切最大涨幅回撤不到30%   或者5日涨幅大于20%或者10日涨幅大于30%或者20日涨幅大于40%
	var getRTTicketsLeader = function(filterToday = false) {
		var filter = function(t) {
			return !filterToday && t['f3'] > 600 &&  (t['f15'] - t['f2'])/(t['f15'] - t['f18']) < 0.3 ;
		}
		
		return realTimeTickets.filter((t)=>{
			return  filter(t)  ||                
					t['f109'] > 2000 ||
					t['f160'] > 3000 ||
					t['f110'] > 4000;   
		});
	};
	var getHistoryRTticketsLeader = function(dateStr) {
		return LocalStore.get(storageNamePrefix + dateStr);
	};
	
	var init = function() {
		// 清理storage过期的数据 LocalStore_history_period
		Object.keys(LocalStore.getAll()).forEach((key)=>{
			if(key.includes(storageNamePrefix)) {
				var dateStr = key.substr(key.indexOf(storageNamePrefix) + storageNamePrefix.length);
				if(dateStr.length == 8) {
					dateStr = dateStr.substr(0,4) + '/' + dateStr.substr(4,2) + '/' + dateStr.substr(6,2);
					if (Configure.getDaysBetween(new Date(dateStr), new Date()) > 
								Configure.LocalStore_history_period) {
						LocalStore.remove(key);
					}
				}
			}
		});
	};
	var store = function() {
		var d = new Date();
		if (!Configure.isWeekend(d) && !Configure.isAfterTrading(d)) {
			LocalStore.set(storageNamePrefix + Configure.getDateStr(d), getRTTicketsLeader(true));
		}
	};
	
	return {
		init:init,
		store:store,
		setRTTickets:setRTTickets,
		getRTTickets:getRTTickets,
		getRTTicketsLeader:getRTTicketsLeader,
		getRTTicketFromCode:getRTTicketFromCode,
		getHistoryRTticketsLeader:getHistoryRTticketsLeader,
	}
})();