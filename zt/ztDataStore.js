
var ztDataStore = (function(){
	var indexDBName = 'ztData';
	var dataStoreName = 'ticketslist';
	var indexDBver = 1;
	
	var storeId = 'ztDataStore_storeDate';
	var storeDate = LocalStore.get(storeId);
	
//	var historyRtTicketsArray = [];
	
	var onupgradeneeded = function(event) {
		// 数据库创建或升级的时候会触发
		console.log("onupgradeneeded");
		db = event.target.result; // 数据库对象
		var objectStore;
		// 创建存储库
		objectStore = db.createObjectStore(dataStoreName, {
			keyPath: "ID", // 这是主键
			//autoIncrement: true // 实现自增
		});
		// 创建索引，在后面查询数据的时候可以根据索引查
		objectStore.createIndex("ID", "ID", { unique: false });
		objectStore.createIndex("Data", "Data", { unique: false });
	};
	
	var storeToday = function(ztTickets) {
		if((!storeDate || !Configure.datesAreOnSameDay(new Date(storeDate), new Date())) && 
				Configure.isAfterTrading()) {
			var todayStr = Configure.getDateStr(new Date());
			IndexDB.openDB(indexDBName, onupgradeneeded, indexDBver).then((db)=>{
				IndexDB.getDataByKey(db, dataStoreName, todayStr).then((result)=>{
					if(!result) {
						IndexDB.addData(db, dataStoreName, {ID:todayStr , Data:ztTickets});
					}
					IndexDB.closeDB(db);
				});
			});	
			storeDate = new Date();
			LocalStore.set(storeId, storeDate);
		}
	};
	
	return {
		storeToday:storeToday,
	};
})();