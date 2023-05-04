
var rtDataManager = (function(){
	var storageNamePrefix = 'rtData';
	var realTimeTickets = [];
	var preRealTimeTickets;   // 保存上一次获取的数据

	// 实时数据
	var setRTTickets = function(ticketArr) {
		preRealTimeTickets = realTimeTickets.slice();
		realTimeTickets = [];
		ticketArr.forEach((t)=>{
			realTimeTickets.push(t);
		});
		rtDataStore.storeToday(realTimeTickets);
	};
	
	var checkIfRtDataUpdated = function() {
		if(preRealTimeTickets && preRealTimeTickets.length) {
			for(var i = 0; i < 10; i ++) {  //检查前10个数据是否一样
				if(preRealTimeTickets[i]['f12'] != realTimeTickets[i]['f12']
				  || preRealTimeTickets[i]['f2'] != realTimeTickets[i]['f2']) {
					  return true;
				}
			}
		}
		return false;
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
	var getRTTicketsLeader = function() {
		return realTimeTickets.filter((t)=>{
			return  (t['f3'] > 600 &&  (t['f15'] - t['f2'])/(t['f15'] - t['f18']) < 0.3)
					||  topFilter(t);          
		});
	};
	
		
	var topFilter = function(t){
		return t['f109'] > 2000 ||
				t['f160'] > 3000 ||
				t['f110'] > 4000;  
	};
		
	var flooredFilter = function(rtData){
		if(!rtData || !rtData['f18'] || ! rtData['f2']) return false;
		var per = Configure.isKechuangTicket(rtData['f12']) ? 0.8 : 0.9;
		return  Math.round(rtData['f18'] * per) == rtData['f16'];
	};
	
	var jumpedFilter = function(rtData){
		if(!rtData || !rtData['f18'] || ! rtData['f2']) return false;
		var per = Configure.isKechuangTicket(rtData['f12']) ? 0.95 : 0.93;
		return  Math.round(rtData['f18'] * per) >= rtData['f16'];
	};
	
	var getHistoryRTticketsLeader = function(dateStr) {
		return rtDataStore.getHistoryFromDatestr(dateStr).filter((t) =>{
			return  topFilter(t);
		});
	};
	var getHistoryRTticketsFloored = function(dateStr) {
		return rtDataStore.getHistoryFromDatestr(dateStr).filter((t) =>{
			return  flooredFilter(t);
		});
	};
	var getHistoryRTticketsJumped = function(dateStr) {
		return rtDataStore.getHistoryFromDatestr(dateStr).filter((t) =>{
			return  jumpedFilter(t);
		});
	};
	
	var init = function() {
		return rtDataStore.init();
	};

	return {
		init:init,
		setRTTickets:setRTTickets,
		getRTTickets:getRTTickets,
		getRTTicketsLeader:getRTTicketsLeader,
		getRTTicketFromCode:getRTTicketFromCode,
		getHistoryRTticketsLeader:getHistoryRTticketsLeader,
		getHistoryRTticketsFloored:getHistoryRTticketsFloored,
		getHistoryRTticketsJumped:getHistoryRTticketsJumped,
		checkIfRtDataUpdated:checkIfRtDataUpdated,
	}
})();