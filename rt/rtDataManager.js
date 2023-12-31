
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
	var getPreRTTickets = function() {
		return preRealTimeTickets;
	};
	var getRTTickets = function() {
		return realTimeTickets;
	};
	// 当前涨幅大于6切最大涨幅回撤不到30%   或者5日涨幅大于20%或者10日涨幅大于30%或者20日涨幅大于40%
	var getRTTicketsLeader = function() {
		return realTimeTickets.filter((t)=>{
			return  (t['f3'] > (Configure.isBJTicket(t['f12']) ? 1200 : 600) &&  
					(t['f15'] - t['f2'])/(t['f15'] - t['f18']) < 0.3)
					||  topFilter(t);          
		});
	};
	
	// 5日涨幅大于20%或者10日涨幅大于30%或者20日涨幅大于40%
	var getActiveTickets = function() {
		return realTimeTickets.filter((t)=>{
			return  topFilter(t) && 
					!Configure.isNew(t['f26']);          
		});
	};
		
	var topFilter = function(t){
		return t['f109'] > (Configure.isBJTicket(t['f12']) ? 6000 : 2000) ||
				t['f160'] > (Configure.isBJTicket(t['f12']) ? 8000 : 3000) ||
				t['f110'] > (Configure.isBJTicket(t['f12']) ? 12000 : 4000);  
	};
	// 涨停
	var boardFilter = function(rtData){
		if(!rtData || !rtData['f18'] || ! rtData['f2']) return false;
		var per = Configure.isBJTicket(rtData['f12']) ? 1.3 :
				Configure.isKechuangTicket(rtData['f12']) ? 1.2 : 1.1;
		return  Math.round(rtData['f18'] * per) == rtData['f2'];
	};
	// 涨停过
	var boardedFilter = function(rtData){
		if(!rtData || !rtData['f18'] || ! rtData['f2']) return false;
		var per = Configure.isBJTicket(rtData['f12']) ? 1.3 :
					Configure.isKechuangTicket(rtData['f12']) ? 1.2 : 1.1;
		return  Math.round(rtData['f18'] * per) == rtData['f15'];
	};
	// 大涨过     20cm涨幅 > 15% , 10cm涨幅 > 8%
	var raisedFilter = function(rtData){
		if(!rtData || !rtData['f18'] || ! rtData['f2']) return false;
		var per = Configure.isBJTicket(rtData['f12']) ? 1.20 :
					Configure.isKechuangTicket(rtData['f12']) ? 1.15 : 1.08;
		return  Math.round(rtData['f18'] * per) < rtData['f15'];
	};
	// 跌停
	var floorFilter = function(rtData){
		if(!rtData || !rtData['f18'] || ! rtData['f2']) return false;
		var per =  Configure.isBJTicket(rtData['f12']) ? 0.7 :
					Configure.isKechuangTicket(rtData['f12']) ? 0.8 : 0.9;
		return  Math.round(rtData['f18'] * per) == rtData['f2'];
	};
	// 跌停过
	var flooredFilter = function(rtData){
		if(!rtData || !rtData['f18'] || ! rtData['f2']) return false;
		var per = Configure.isBJTicket(rtData['f12']) ? 0.7 :
					Configure.isKechuangTicket(rtData['f12']) ? 0.8 : 0.9;
		return  Math.round(rtData['f18'] * per) == rtData['f16'];
	};
	// 快速下跌
	var jumpeFilter = function(rtData){
		if(!rtData || !rtData['f18'] || ! rtData['f2']) return false;
		var per = Configure.isBJTicket(rtData['f12']) ? 0.88 :
					Configure.isKechuangTicket(rtData['f12']) ? 0.92 : 0.94;
		return  Math.round(rtData['f18'] * per) > rtData['f16'];
	};
	// 超跌过  默认 -5%
	var jumpedFilter = function(rtData){
		if(!rtData || !rtData['f18'] || ! rtData['f2']) return false;
		var per = Configure.isBJTicket(rtData['f12']) ? 0.85 :
					Configure.isKechuangTicket(rtData['f12']) ? 0.9 : 0.93; 
		return  Math.round(rtData['f18'] * per) > rtData['f16'];
	};
	
	var getHistoryRTticketsLeader = function(dateStr) {
		return rtDataStore.getHistoryFromDatestr(dateStr).filter(topFilter);
	};
	var getHistoryRTticketsBoard = function(dateStr) {
		return rtDataStore.getHistoryFromDatestr(dateStr).filter(boardFilter);
	};
	var getHistoryRTticketsFloored = function(dateStr) {
		return rtDataStore.getHistoryFromDatestr(dateStr).filter(flooredFilter);
	};
	var getHistoryRTticketsJumped = function(dateStr) {
		return rtDataStore.getHistoryFromDatestr(dateStr).filter(jumpedFilter);
	};
	
	var init = function(dateArr) {
		return rtDataStore.init(dateArr);
	};

	return {
		init:init,
		boardFilter:boardFilter,
		boardedFilter:boardedFilter,
		raisedFilter:raisedFilter,
		floorFilter:floorFilter,
		flooredFilter:flooredFilter,
		jumpedFilter:jumpedFilter,
		jumpeFilter:jumpeFilter,
		setRTTickets:setRTTickets,
		getRTTickets:getRTTickets,
		getPreRTTickets:getPreRTTickets,
		getRTTicketsLeader:getRTTicketsLeader,
		getActiveTickets:getActiveTickets,
		getRTTicketFromCode:getRTTicketFromCode,
		getHistoryRTticketsLeader:getHistoryRTticketsLeader,
		getHistoryRTticketsBoard:getHistoryRTticketsBoard,
		getHistoryRTticketsFloored:getHistoryRTticketsFloored,
		getHistoryRTticketsJumped:getHistoryRTticketsJumped,
		checkIfRtDataUpdated:checkIfRtDataUpdated,
	}
})();