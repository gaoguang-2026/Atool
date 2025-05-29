var requests = (function(){

	/**
	*  数据请求放在后台线程
	*/
	const workerCode = `
	// worker.js
	let interval = 1000; // 默认间隔 1 秒
	let timerId = null;
	var urlH = 'http://23.push2.eastmoney.com/api/qt/clist/get?cb=jQuery112403461296577881501_1600744555568';
	var param = {
		pn:1,
		pz:200,
		po:0,
		np:1,
		ut:'bd1d9ddb04089700cf9c27f6f74262812&invt=2&fid=f12&fs=m:0+t:6,m:0+t:13,m:0+t:80,m:1+t:2,m:1+t:23,m:0+t:81+s:2048',
		_:1600744555569,
		fields:'f12,f14,f2,f3,f6,f8,f15,f16,f18,f20,f21,f100,f101,f103,f109,f160,f110,f26',
	};

	var reqPageNumberIndex = 1;
	var pageSize = 100;   // 平台限制最大100
	
	function gernerateURL(){
		var url = urlH;
		for(let prop in param) {
			if (prop == 'pn') {
				url += '&' + prop + '=' + reqPageNumberIndex;
			} else if (prop == 'pz') {
				url += '&' + prop + '=' + pageSize;
			} else {
				url += '&' + prop + '=' + param[prop];
			}
		}
		return url;
	}

	// 接收主线程的消息
	self.onmessage = function(e) {
	  const { action, data } = e.data;
	  // 启动/停止定时器
	  if (action === 'start') {
		startTimer(data);
	  } else if (action === 'stop') {
		stopTimer();
	  }

	  // 调整间隔
	  if (action === 'setInterval' && data?.interval) {
		interval = data.interval;
		restartTimer();
	  }
	};

	// 启动定时器
	function startTimer(data) {
	  if (data && data.interval) interval = data.interval;
	  stopTimer(); // 确保先清除旧定时器
	  timerId = setInterval(() => {
		fetchData();
	  }, interval);
	}

	// 停止定时器
	function stopTimer() {
	  if (timerId) {
		clearInterval(timerId);
		timerId = null;
	  }
	}

	// 重启定时器（用于动态调整间隔）
	function restartTimer() {
	  stopTimer();
	  startTimer();
	}

	// 发送请求
	function fetchData() {
	  let url = gernerateURL();
	  console.log('fetch url -> ' + url);
	  fetch(url)
		.then(response => {
		  if (!response.ok) throw new Error('请求失败');
		  return response.text();
		})
		.then(data => {
			// 将数据发送回主线程（可选）
			var s = data.indexOf('(') + 1; 
			var json_str = data.substr(s, data.length - s - 2);
			if(JSON.parse(json_str)['data'] != null) {
			   var retObj = {data:json_str, reqPageNumberIndex:reqPageNumberIndex, pageSize:pageSize};
			   self.postMessage({ type: 'data', data: JSON.stringify(retObj)});
			   reqPageNumberIndex++;
		   } else {
			   reqPageNumberIndex = 1;
		   }

		})
		.catch(error => {
		  self.postMessage({ type: 'error', error: error.message });
		});
	}
	`;
	
	var worker;
	var startWorker = function(callback) {
		if (window.Worker) {
			var reqNum = 0;
			const blob = new Blob([workerCode], { type: 'application/javascript' });
			worker = new Worker(URL.createObjectURL(blob));

			// 监听 Worker 消息
			worker.onmessage = function(e) {
			  const { type, data, error } = e.data;
			  if (type === 'data') {
				//Configure.Debug('收到数据:', data);
				var resObj = JSON.parse(data);
				const json_str = resObj.data;
				const reqPageNumberIndex = resObj.reqPageNumberIndex;
				const pageSize = resObj.pageSize;
				Configure.Debug('Request Page number ' + reqPageNumberIndex);
				Configure.Debug(JSON.parse(json_str));
				var maxTicketNum = parseInt(JSON.parse(json_str)['data']['total']);
				var maxPage = Math.ceil(maxTicketNum / pageSize);
				rtDataManager.setRTTickets(JSON.parse(json_str)['data']['diff'], 
											maxTicketNum, reqPageNumberIndex, maxPage, pageSize);
				if (reqPageNumberIndex >= maxPage) {
					if(typeof callback === 'function') {
						callback();
					};
				} 
				Configure.Debug('Debug --- request num = ' + reqNum++ );
			  } else if (type === 'error') {
				console.error('请求出错:', error);
			  }
			};

			// 启动 Worker
			worker.postMessage({ action: 'start', data: { interval: Configure.Request_interval} });
		 } else {
			console.error('浏览器不支持 Web Workers!');
		 }
	}
	
	var stopWorker = function() {
		if (worker) {
			worker.postMessage({ action: 'stop' });
			worker.terminate(); // 强制终止 Worker
		}
	}

	return {
		start:startWorker,
		stop:stopWorker,
	}
})();