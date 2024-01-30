var requests = (function(){
	
	// 加上北交所
	/*https://3.push2.eastmoney.com/api/qt/clist/get?cb=jQuery112402057185733619813_1703817250460
	&pn=1&pz=20&po=1&np=1&ut=bd1d9ddb04089700cf9c27f6f7426281&fltt=2&invt=2&wbp2u=3914345612125854|0|1|0|web
	&fid=f3&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23,m:0+t:81+s:2048
	&fields=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f12,f13,f14,f15,f16,f17,f18,f20,f21,f23,f24,f25,f22,f11,f62,f128,f136,f115,f152
	&_=1703817250480 */
	
	// 淘股吧动态
	// https://www.taoguba.com.cn/spmatch/spefocus/getSpeFriensAction?perPageNum=20&actionID=0
	
	var urlH = 'http://23.push2.eastmoney.com/api/qt/clist/get?cb=jQuery112403461296577881501_1600744555568';
	var param = {
		pn:1,
		pz:10000,
		po:1,
		np:1,
		ut:'bd1d9ddb04089700cf9c27f6f74262812&invt=2&fid=f3&fs=m:0+t:6,m:0+t:13,m:0+t:80,m:1+t:2,m:1+t:23,m:0+t:81+s:2048',
		_:1600744555569,
		fields:'f12,f14,f2,f3,f6,f8,f15,f16,f18,f20,f21,f100,f101,f103,f109,f160,f110,f26',
	}
	var request = function(url, callback, isFirst = false) {
		const xhr = new XMLHttpRequest();
		console.log('request -> ' + url + ' time:' + new Date().toGMTString());
		xhr.open('GET', url);
		xhr.onload = () => {
			if (xhr.status === 200) {
				const responseText = xhr.responseText;
				// 处理响应文本
				
				var s = responseText.indexOf('(') + 1; 
				var json_str = responseText.substr(s, responseText.length - s - 2);
			    rtDataManager.setRTTickets(JSON.parse(json_str)['data']['diff']);
				console.log(JSON.parse(json_str));
				if(typeof callback === 'function' && 
					rtDataManager.checkIfRtDataUpdated() || 
					isFirst) {
					callback();
				};
			} else {
				console.error('request error ' + xhr.status);
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
		request(url, callback, true);
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