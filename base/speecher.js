var speecher = (function(text) {
	// 创建一个SpeechSynthesisUtterance对象  
	var utterance = new SpeechSynthesisUtterance();
		
	// 设置语音合成的语速  
	utterance.rate = 1; // 0.5表示正常语速，可以设置为0.1到10之间的值 
	// 设置语音合成的音调  
	utterance.pitch = 2; // 1表示正常音调，可以设置为0到2之间的值  
	// 设置语音合成的音量  
	utterance.volume = 0.5; // 1表示正常音量，可以设置为0到1之间的值  
	// 设置要播报的文本内容  
	var speak = function(text) {
		utterance.text = text;  
		window.speechSynthesis.speak(utterance);
	};

	return {
		speak:speak,
	}
})();