var table = (function(){
	
	//var tableHeadDone = false;
	var tbl = document.getElementById('tbl');
	
	var updateForm = function() {
		var fr = document.getElementById('form2');
		while(fr.hasChildNodes()) {
			fr.removeChild(fr.lastChild);
		};
		
		var t = document.createTextNode('概念：');
		fr.appendChild(t);	
		// all
		var oAll = document.createTextNode('全部\xa0\xa0\xa0\xa0');
		var inputAll = document.createElement('input');
		var oOther = document.createTextNode('其他\xa0\xa0\xa0\xa0');
		var inputOther = document.createElement('input');
		inputAll.type = 'checkbox';
		inputAll.name = 'all';
		inputAll.checked = false;
		inputAll.onchange = function(e){
			if (e.target.checked) {
				if (fr.gainian) {
					fr.gainian.forEach((input)=>{
						input.checked = false;
						inputOther.checked = false;
					})
				}
			}
		};
		fr.appendChild(inputAll);	
		fr.appendChild(oAll);		
		// other
		inputOther.type = 'checkbox';
		inputOther.name = 'all';
		inputOther.checked = false;
		inputOther.onchange = function(e){
			if (e.target.checked) {
				if (fr.gainian) {
					fr.gainian.forEach((input)=>{
						input.checked = false;
						inputAll.checked = false;
					})
				}
			}
		};
			
		
		var d = $('#date')[0].value.replace(/\-/g, '');	
		var echelonArr = parser.getEchelons(d);
		echelonArr.forEach((g)=>{
			if (g.score > 10) {
				var oTxt = document.createTextNode(g.name + '(' + g.score + ')\xa0\xa0\xa0\xa0');
				var input = document.createElement('input');
				input.type = 'checkbox';
				input.name = 'gainian';
				input.checked = false;
				input.dataset.titleProp = g.hotPoints;
				input.dataset.titleName = g.name;
				input.onchange = function(e){
					if(e.target.checked) {
						inputAll.checked = false;
						inputOther.checked = false;
					}
				}
				Tip.show(input, g.hotPoints.toString().replace(/\,/g, '、<br>'));
					
				fr.appendChild(input);	
				fr.appendChild(oTxt);	
			}
		
		});
		
		fr.appendChild(inputOther);	
		fr.appendChild(oOther);	

	};
	
	var createTableHead = function() {
	//	if(tableHeadDone) return;
		tableHeadDone = true;
		var tHead = tbl.tHead;
		//remove all tr
		while(tHead.hasChildNodes()) {
			tHead.removeChild(tHead.lastChild);
		};
		
		var tr = document.createElement('tr');
		if (Configure.debug) {
			for (var prop in Configure.title) {
				var td = document.createElement('td');
				td.innerHTML = Configure.title[prop];
				td.dataset.titleProp = prop;
				tr.appendChild(td);
			}
		} else {
			var titleArr = document.getElementById('form1').gtype[3].checked ? 
						Configure.bandShowInTableTitile : Configure.showInTableTitile;
			titleArr.forEach((t)=> {
				var td = document.createElement('td');
				if (t == 'reason') {
					td.innerHTML = '涨停原因';
				} else if (t == 'dayNumber') {
					td.innerHTML = '连板数'
				} else {
					td.innerHTML = Configure.title[t];
				}
				td.dataset.titleProp = t;
				tr.appendChild(td);
			});
		}

		tHead.appendChild(tr);
	}
	var createTable = function (datetoload) {
		var fr = document.getElementById('form1');
		var fr2 = document.getElementById('form2');
		
		var paramGainian = [];
		var paramGainianForOther = [];
		if (fr2.gainian) {
			fr2.gainian.forEach((input)=> {
				if(input.checked) {
					paramGainian =paramGainian.concat(input.dataset.titleProp.split(','));
				} else {
					paramGainianForOther= paramGainianForOther.concat(input.dataset.titleProp.split(','));
				}
			});
		}

	//	var gainian = fr.gainian;
		var isOther = fr2.all[1].checked;  // other 选项
		var param = {
			hotpointArr: isOther ? paramGainianForOther : paramGainian,
			type: fr.gtype[3].checked ? 3 :
				fr.gtype[2].checked ? 2 : 
				fr.gtype[0].checked ? 0 : 1,   
			sort: fr.sort[2].checked ? 2 :
				fr.sort[0].checked ? 0 : 1,
			other: fr2.all[1].checked
		};
		var tks = parser.getTickets(datetoload,param);
		var dateArr = workbook.getDateArr((a,b)=>{
			return b - a;
		});
		createTableHead();
		
		// create body
		var tBody = tbl.tBodies[0];
		var tHead = tbl.tHead;
		var tHeadtds = Array.from(document.getElementById('tbl').tHead.getElementsByTagName('td'));
		//remove all tr
		while(tBody.hasChildNodes()) {
			tBody.removeChild(tBody.lastChild);
		};
		
		tks.forEach((ticket)=> {
			var tr = document.createElement('tr');
			tHeadtds.forEach((t)=> {
				var td = document.createElement('td');
				td.innerHTML =ticket.selectDate ? 
								ticket[Configure.replaceTitleDate(Configure.title[t.dataset.titleProp],ticket.selectDate)] :
									ticket[Configure.title[t.dataset.titleProp]];
				switch (t.dataset.titleProp) {
					case 'realValue':
						td.innerHTML = parseFloat(ticket[t.innerHTML]/100000000).toFixed(2);
						Tip.show(td, '流通市值：' + parseFloat(ticket[Configure.title.value]/100000000).toFixed(2) + '<br>' +
								'机构持股比例合计: ' + ticket[Configure.title.orgProportion] + '%<br>');
						break;
					case 'boardStrength':
						Tip.show(td, '封板类型：' + ticket[Configure.title.boardType] + '<br>' +
								'封板时间: ' + ticket[Configure.title.boardTime] + '<br>' + 
								'封成比: ' + ticket[Configure.title.boardPercent] + '%');
						break;
					case 'dayNumber':
						if(parseInt(ticket[Configure.title.boardAndDay]) > 196611){  // 196611 三连扳
							Tip.show(td, '板：' + ticket[Configure.title.boardAndDay] + '<br>');
						};
						break;
					case 'totalDivergence':
						Tip.show(td, '价格：' + ticket[Configure.title.price] + '<br>' +
								'筹码: ' + ticket[Configure.title.profitProportion]);
						break;
					case 'realHandoverPercent':
						var txtshow = '前' + (parseInt(ticket[Configure.title.dayNumber]) - 1) +  '天实际换手率：';
						for(var i = parseInt(ticket[Configure.title.dayNumber]) - 1; i ; i --){
							var param = {sheetName:dateArr[i],
								ticketCode:ticket[Configure.title.code]};
							var tkt = workbook.getValue(param);
							if (tkt) {
								txtshow += parseFloat(tkt[Configure.replaceTitleDate(Configure.title.handoverPercent, dateArr[i])] 
										/ ((100 - tkt[Configure.title.orgProportion])/100)).toFixed(2) + '  ';
							}
						}
						Tip.show(td, txtshow);
						break;
					case 'reason':
						Tip.show(t, parser.getHotpointstxt(datetoload));
						break;
					case 'selectDate':
						td.innerHTML = ticket.selectDate.slice(0,4) + '-' + 
										ticket.selectDate.slice(4,6) + '-' + 
										ticket.selectDate.slice(6);
						break;
					case 'price' : 
						td.innerHTML = '&nbsp;&nbsp;&nbsp;' + td.innerHTML + '&nbsp;&nbsp;&nbsp;';
						break;
					case 'increaseRate':
						td.innerHTML = ticket.increaseRate == '' ? '' : parseFloat(ticket.increaseRate * 100).toFixed(2);
					default:
						break;
					} 
				tr.appendChild(td);
			});
			
			//添加详细超链接
			var tDetail = document.createElement('td');
			tDetail.innerHTML = '<a href="baidu.com" target="_blank">详细</a>';
			var oD = tDetail.children[0];
			oD.onclick = function(){
				var url = "http://quote.eastmoney.com/" + ticket[Configure.title.code] + ".html"
				window.open(url);
			};
			//添加删除超链接
			var tDel = document.createElement('td');
			tDel.innerHTML = '<a href="javascript:;">删除</a>';
			//执行删除表格行操作
			var oA = tDel.children[0];
			oA.onclick = function(){
				if(confirm("确定删除吗？")){
					tBody.removeChild(this.parentNode.parentNode);
				}
			};
			tr.appendChild(tDetail);
			tr.appendChild(tDel);
			tBody.appendChild(tr);
		});
	};
	
	return {
		createTable:createTable,
		updateForm:updateForm
	}
})();
