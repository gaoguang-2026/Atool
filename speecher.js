var speecher = (function(text) {
	var speeckerEL = document.getElementById("speecker");
	var textContainer = []; 
	
	var speak = function(text) {
		var d = new Date();
		speeckerEL.innerHTML = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + ' ' + text;
		speeckerEL.classList.add("speak");
		textContainer.unshift(speeckerEL.innerHTML);
		var textshow = '';
		textContainer.forEach((txt)=>{
			textshow += txt + '<br>';
			if(textshow.length > 700) return;
		});
		Tip.show(speeckerEL, textshow);
		
		// 创建一个SpeechSynthesisUtterance对象  
		var utterance = new SpeechSynthesisUtterance();
		// 设置语音合成的语速  
		utterance.rate = 0.8; // 0.5表示正常语速，可以设置为0.1到10之间的值 
		// 设置语音合成的音调  
		utterance.pitch = 2; // 1表示正常音调，可以设置为0到2之间的值  
		// 设置语音合成的音量  
		utterance.volume = 1; // 1表示正常音量，可以设置为0到1之间的值  
		utterance.text = text;  
		window.speechSynthesis.speak(utterance);
	};
	
	var init = function() {
		var txt = Configure.apothegms[Math.round(Math.random() * Configure.apothegms.length)];
		speeckerEL.innerHTML = txt ? txt : Configure.apothegms[0];
	};
	
	return {
		init:init,
		speak:speak,
	}
})();

speecher.init();