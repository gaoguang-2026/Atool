var requests = (function(){
	var urlH = 'http://23.push2.eastmoney.com/api/qt/clist/get?cb=jQuery112403461296577881501_1600744555568';
	var param = {
		pn:1,
		pz:10000,
		po:1,
		np:1,
		ut:'bd1d9ddb04089700cf9c27f6f74262812&invt=2&fid=f3&fs=m:0+t:6,m:0+t:13,m:0+t:80,m:1+t:2,m:1+t:23',
		_:1600744555569,
		fields:'f12,f14,f2,f3,f8,f15,f18,f20,f21,f100,f101,f103,f109,f160,f110,f26',
	}
	var request = function(url, callback) {
		const xhr = new XMLHttpRequest();
		console.log('start request date from 东方财富');
		xhr.open('GET', url);
		xhr.onload = () => {
			if (xhr.status === 200) {
				const responseText = xhr.responseText;
				// 处理响应文本
				console.info(responseText);
				var s = responseText.indexOf('(') + 1; 
				var json_str = responseText.substr(s, responseText.length - s - 2);
			    workbook.setRTTickets(JSON.parse(json_str)['data']['diff']);
				
				if(typeof callback === 'function') {
					callback();
				};
			}
		};
		xhr.send();
	};
	
	var start = function(callback){
		var url = urlH;
		for(let prop in param) {
			url += '&' + prop + '=' + param[prop];
		}
		/*for(var i = 1; i < 200; i ++) {
			url += ',f' + i;
		} */
		request(url, callback);
		Timer.addTimerCallback(()=>{
			request(url, callback);
		});
		Timer.start();
	};
	
	var stop = function() {
		Timer.stop();
	};
	
	return {
		start:start,
		stop:stop,
	}
})();