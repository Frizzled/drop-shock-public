selectedcrew = "none";
selectedmod = "none";
comUnit = "none";
multiMod = false;
modsToLoad = Array();
armyCountT = "";
modCount = Array();

commandQueue = Array();
GL_sendingCommand = 0;
webSendCommand = getHTTPObject();

FilterUnitsExp = Array();
FilterUnitsCmp = Array();
FilterCrews = Array();
FilterModsExp = Array();
FilterModsCmp = Array();

FilterOptions = Array();
FilterOptions["MF"] = "only";
FilterOptions["NMC"] = "show";

function init() {

	layerWrite('helptext1DIV','','container1DIV.document.text1DIV')

	preLoadModImg();	
	preLoadCrews()
	preLoadMods()
	drawCrews();
	drawMods();
	initArmy();
	setCE();

	sizeWindow();
	display("container1DIV");

	setTimeout("runQueue()", 250);

	isLoaded = 1;
	drawFilter();
//	applyFilter();
}

function queueCommand(myActor,myAction,myTarget) {
	myCommand = myActor + "," + myAction + "," + myTarget;
	if (commandQueue.length < 10) { 
		commandQueue[(commandQueue.length)] = myCommand 
		drawQueue();
	} else { document.getElementById("queuetext1DIV").innerHTML = "<span class='alerttextb'>Queue Full!</span>"; }
}

function drawQueue() {
	if (commandQueue.length == 0) { myHTML = ""; }
	else { myHTML = "<span class='comtextb'>Queue</span>: "+commandQueue.length; }
	document.getElementById("queuetext1DIV").innerHTML = myHTML;
	}

function dequeueCommand(myMark) {
	myI = 0;
	newcommandQueue = Array();
	for (var i=0; i<commandQueue.length; i++) { if (i!=myMark) { newcommandQueue[myI] = commandQueue[i]; myI += 1; } }	
	commandQueue = newcommandQueue;	

	drawQueue();
//	document.getElementById("queuetext1DIV").innerHTML = myHTML;
}

function runQueue() {
	processQueue();
	setTimeout("runQueue()", 200);
}

function processQueue() {
	if ( (GL_sendingCommand == 0) && (commandQueue.length > 0) ) { sendCommand(commandQueue[0]); }
}

function sendCommand(myCommand) {
	if (GL_sendingCommand == 0) {
		commandArray = myCommand.split(',');
		
		if (webSendCommand.readyState == 4 || webSendCommand.readyState == 0) {
			GL_sendingCommand = 1;

			param = "theactor=" + commandArray[0] +
				"&theaction=" + commandArray[1] +
				"&thetarget=" + commandArray[2]

			cProcess = true;			
			try { webSendCommand.open("POST", "process_get_modify.php", true); } catch(err) { webSendCommand = getHTTPObject(); GL_sendingCommand = 0; setTimeout("sendCommand(myCommand);", 4000); cProcess = false; }
			if (cProcess) {
				webSendCommand.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
				webSendCommand.onreadystatechange = commandSent;
				webSendCommand.send(param);
			}
		} else { setTimeout('sendCommand(myCommand);',2000); }
	}
}

function commandSent() {
	if (webSendCommand.readyState == 4) { if (webSendCommand.status == 200) { 

		comResults = webSendCommand.responseText.split('<*>');
		comResults[0] = trim(comResults[0]);

		processedCommand = commandQueue[0].split(',');
		thisactor = processedCommand[0];
		thisaction = processedCommand[1];
		thistarget = processedCommand[2];

		if (thisaction=="setmod") { 
			if (comResults[0]=="ok") { thistarget = thistarget.split('x'); setmodConfirmed(thistarget[1],thisactor); }
		} else if (thisaction=="removemod") { 
			if (comResults[0]=="ok") { thistarget = thistarget.split('x'); removemodConfirmed(thistarget[1]); }
		} else if (thisaction=="setcrew") { 
			if (comResults[0]=="ok") { setcrewConfirmed(unitids.indexOf(parseInt(thistarget)),crewids.indexOf(parseInt(thisactor))); }
		} else if (thisaction=="removecrew") { 
			if (comResults[0]=="ok") { removecrewConfirmed(thistarget); }
		} else if (thisaction=="togglearmy") { 
			if (comResults[0]=="ok") { togglearmyConfirm(parseInt(thisactor),thistarget); }
		} else if (thisaction=="integrate") { 
			if (comResults[0]=="integrated") { integrateUnit(parseInt(thisactor),comResults[1],comResults[2]); }
			else if (comResults[0]=="checkChance") { document.getElementById(`integrationChance${comResults[1]}`).innerHTML = `<span class="integrateChance" onmousemove="showtwHelp('Integrate_Chance',event);" onmouseout="hidetwHelp();">${comResults[2]}%</span><br><span class="integrateDestroy" onmousemove="showtwHelp('Tear_Loss_Chance',event);" onmouseout="hidetwHelp();">${comResults[3]}%</span>` }
			else if (comResults[0]=="tearlost") { removeTear(parseInt(thisactor)); }
			else if (thistarget == 'checkChance') { }
			else { checkTears(parseInt(thisactor)); }
		} else if (thisaction=="activate") { 
			if (comResults[0]=="ok") { activateUnit(parseInt(thisactor)); }
			else { checkEye(parseInt(thistarget)); }
		} else if (thisaction=="repair") {
			if (comResults[0]=="ok") {
				parent.frames['stats'].checkNewStats();
				unitRepaired(parseInt(thistarget));
			}
		}
	}
	
	dequeueCommand(0); 
	GL_sendingCommand = 0; }
}


function sizeWindow() {

	newWidth = (window.frameElement.offsetWidth) - 35

	if (newWidth < 800) newWidth = 800;
	
	document.getElementById("container1DIV").style.width = newWidth

	document.getElementById("container1bgDIV").style.width = (newWidth - 15)
	document.getElementById("container2bgDIV").style.width = (newWidth - 13)

	document.getElementById("line1DIV").style.width = (newWidth - 33)
	document.getElementById("line2DIV").style.width = (newWidth - 33)

	document.getElementById("unitbar1DIV").style.width = (newWidth - 34)
	document.getElementById("crewbar1DIV").style.width = (newWidth - 34)
	document.getElementById("modbar1DIV").style.width = (newWidth - 34)

	document.getElementById("popmsg1DIV").style.width = (newWidth - 15)
	document.getElementById("popmsg1bgDIV").style.width = (newWidth - 13)

	document.getElementById("text1DIV").style.width = (newWidth - 14)
	document.getElementById("text1bgDIV").style.width = (newWidth - 15)
	document.getElementById("text2bgDIV").style.width = (newWidth - 14)
	document.getElementById("queuetext1DIV").style.width = (newWidth - 35)
	document.getElementById("armyCE1DIV").style.width = (newWidth - 150)
	document.getElementById("multimod1DIV").style.width = (newWidth - 380)
	document.getElementById("filter1DIV").style.width = (newWidth - 465)

}

function initArmy() {
	for (var i=0;i<unitinarmy.length;i++) { if (document.getElementById("unitinarmy" + i)) {
		if (unitDamaged[i] == 'Y') {
			mytext = "[ <a href='javascript:repairUnit("+i+")' class='bantextb'>Repair: "+new Intl.NumberFormat('en-IN').format(repairMultiplier * unitOreCost[(unittypes[i])])+" Ore</a> ]"
		} else if (unitinarmy[i]  == 1) {
			if (crewassignment[i] != -1) {
				mytext = "[ <a href='javascript:togglearmy("+i+")'>In Army</a> ]"
			} else { mytext = "" }
		} else {
			if (crewassignment[i] != -1) {
				mytext = "[ <a href='javascript:togglearmy("+i+")' class='alerttextb'>In Reserve</a> ]"
			} else { mytext = "" }
		}
		if (comUnit != i) { layerWrite("unitinarmy"+i,mytext); }
	}}	
}

function drawArmyCE() {
	if (armyCE > armyMaxCE) {armyCountT = 'alerttext';} else {armyCountT = 'helptext';}
	mytext = "<b>Army CE</b>: <span class='helptext'>"+addCommas(armyCE)+"</span> / <span class='"+armyCountT+"b'>"+ addCommas(armyMaxCE) +"</span>";
	layerWrite("armyCE1DIV",mytext)
}

function preLoadModImg() {
	for (var pmodi in modnum) { if (modPUG[pmodi] == 0) {
		myMod = "mod" + pmodi;
		myImg = imgPath + "mods/" + modimgG[pmodi];
		preload(myMod,myImg);
	} }
}

function preLoadCrews() {
	for (var i=0;i<crewassignment.length;i++) {
		if ( (crewassignment[i] != -1) && (document.getElementById("unitname" + i + "DIV")) ) { eval("setcrewConfirmed(" + i + "," + crewassignment[i] + ")"); }
	}
}

function preAssignMod(mymod, myunit) {
	aUnit = 0;
	for (var uniti=modbyunit.indexOf(myunit); uniti<=modbyunit.lastIndexOf(myunit); uniti++) { 
		if ( (modbyunit[uniti] == myunit) && (modassignment[uniti] == -1) ) { aUnit =1; break; }
	}

	if ( (aUnit) && (document.getElementById('imgslot'+uniti)) ) { setmodConfirmed(uniti,mymod); }
	else if ( (aUnit) && (!document.getElementById('imgslot'+uniti)) ) { 
		if (typeof modsToLoad[myunit] == 'undefined') {modsToLoad[myunit]=Array();} 
		mLi = modsToLoad[myunit].length; 
		modsToLoad[myunit][mLi] = mymod;
	}
}

function drawCrews() {
	mytext = "<table cellpadding='0' cellspacing='0' background='" + imgPath + "mod_crew_bg.gif' height='100%'><tr height='103'>"
	for (var i=0;i<crewids.length;i++) {
		crewIsAssigned = 0
		for (var ii=0;ii<crewassignment.length;ii++) { if (crewassignment[ii] == i) { crewIsAssigned = 1 } }

		if (crewIsAssigned == 0) { hideText = ""; } 
		else { hideText = "visibility:hidden;display:none;"; }

		mymerit = "";
		if (typeof crewmerits[i] != 'undefined') {
			for (var meriti=0;meriti<crewmerits[i].length;meriti++) {
				mymerit += "<img onmousemove=\"showVoM("+crewmerits[i][meriti]+",'M',event);\" onmouseout='hideVoM();' src='" + imgPath + "merits/merit_" + crewmerits[i][meriti] + ".gif'>";
			}
		} 

		mytext = mytext + "<td valign=top class='unittext' width=129 id='crewDIV" + i + "' style='" + hideText + "'><img src='" + imgPath + "pixel.gif' width='129' height='3'><br>" +
		"<center><table cellpadding=0 cellspacing=0 border=0 width=19 height=19><tr><td rowspan=2 valign='middle' class='unittext'>" +
		"<b>Crew:</b>&nbsp;</td><td><a href='javascript:selectcrew(" + i + ");'><img src='" + imgPath + "crews/g_" + crewgun[i] + ".gif' name='imgcrew" + i + "c1'><br><img src='" + imgPath + "crews/p_" + crewpil[i] + ".gif' name='imgcrew" + i + "c2'></a></td><td>" + mymerit + "</td></tr></table>" +
		"<img src='" + imgPath + "pixel.gif' width='129' height='5'><br><table cellpadding=0 cellspacing=0 border=0 height='24' width='100%'><tr><td class='unittext' style='text-align:center'><b>" + crewname[i] + "</b></td></tr></table>" +
		"Gunnery: " + skilltext[(crewgun[i])] + "<br>Piloting: " + skilltext[(crewpil[i])] + "<br><img src='" + imgPath + "pixel.gif' width='1' height='4'><br><font color='#0099ff'><b>CE Factor: " + crewce[i] + "</b></font></center></td>"
		
	}
	mytext = mytext + "<td width=1><img src='" + imgPath + "pixel.gif' width='1'></td></tr></table>"
	layerWrite("crewbar1DIV",mytext)
}

function drawMods() {
	mytext = "<table cellpadding='0' cellspacing='0' background='" + imgPath + "mod_mod_bg.gif' height='100%'><tr height='103'>"
	CHi = 0;
	for ( var i in modnum ) {
		if (chrome) { for (var ii=CHi;ii<modsortedG.length;ii++) {  if (typeof modnum[modsortedG[ii]] != 'undefined') { i = modsortedG[ii]; CHi=ii+1; break; } } }

		if (modPUG[i] == 0) {
			if (modnum[i] <= 0) { styleText = "filter:alpha(opacity=60);-moz-opacity:.60;opacity:.60;"; } else { styleText = ""; }

			if (modcomplexityG[i] == "A") { myComplexity="Advanced"; myColorC="ff0006"; }
			else if (modcomplexityG[i] == "E") { myComplexity="Elite"; myColorC="0099ff"; }
			else if (modcomplexityG[i] == "I") { myComplexity="Intermediate"; myColorC="777777"; }
			else { myComplexity="Simple"; myColorC="ffffff"; }

			mytext = mytext + "<td valign='top' width='129' ID='modTD"+i+"'"	
			if (modnum[i] == 0) {mytext = mytext + " style='display:none;'"}	
			mytext = mytext + "><div class='mDiv'><img src='" + imgPath + "pixel.gif' width='129' height='3'><br>" +
			"<center><table cellpadding=0 cellspacing=0 border=0 width=123><tr><td><img src='" + imgPath + "pixel.gif' width=2 height=1></td><td>" +
			"<a href='javascript:selectmod(" + i + ")'><img style='" + styleText + "' src='" + eval("mod"+i+".src") + "' name='imgmod" + i + "' class='imgM'></a>" +
			"</td><td><img src='" + imgPath + "pixel.gif' width=4 height=1></td><td class='modtext' valign='middle' height='35'>" +
			"<b>" + modNames[i] + "</b></td></tr></table>" +
			"<img src='" + imgPath + "pixel.gif' width='115' height='1'><font class='unittext'><br><font style='color: #" + myColorC + ";'>" + myComplexity + "</font> [<font class='helptextb'>" + modnum[i] + "</font>]<br><b>CE Factor: <font color='#" + myColorC + "'>" + modceG[i] + "</font><br></b></font>" +
			"<img src='" + imgPath + "pixel.gif' width='115' height='2'><br>" +
			"<table cellpadding=0 cellspacing=0 border=0 width=125 height=32><tr><td valign='top' align='center'><font class='moddesctext'>" + modEffects[i] + "<br></font></td></tr></table>" +
			"</center></div></td>"
		}
	}

	mytext = mytext + "<td width=1><img src='" + imgPath + "pixel.gif' width='1'></td></tr></table>"
	layerWrite("modbar1DIV",mytext)
}

function redrawMod(i) {
	if (modnum[i] <= 0) { styleText = "filter:alpha(opacity=60);-moz-opacity:.60;opacity:.60;"; } else { styleText = ""; }

	if (modcomplexityG[i] == "A") { myComplexity="Advanced"; myColorC="ff0006"; }
	else if (modcomplexityG[i] == "E") { myComplexity="Elite"; myColorC="0099ff"; }
	else if (modcomplexityG[i] == "I") { myComplexity="Intermediate"; myColorC="777777"; }
	else { myComplexity="Simple"; myColorC="ffffff"; }

	mytext = "<img src='" + imgPath + "pixel.gif' width='129' height='3'><br>" +
	"<center><table cellpadding=0 cellspacing=0 border=0 width=123><tr><td><img src='" + imgPath + "pixel.gif' width=2 height=1></td><td>" +
	"<a href='javascript:selectmod(" + i + ")'><img style='" + styleText + "' src='" + eval("mod"+i+".src") + "' name='imgmod" + i + "' class='imgM'></a>" +
	"</td><td><img src='" + imgPath + "pixel.gif' width=4 height=1></td><td class='modtext' valign='middle' height='35'>" +
	"<b>" + modNames[i] + "</b></td></tr></table>" +
	"<img src='" + imgPath + "pixel.gif' width='115' height='1'><font class='unittext'><br><font style='color: #" + myColorC + ";'>" + myComplexity + "</font> [<font class='helptextb'>" + modnum[i] + "</font>]<br><b>CE Factor: <font color='#" + myColorC + "'>" + modceG[i] + "</font><br></b></font>" +
	"<img src='" + imgPath + "pixel.gif' width='115' height='2'><br>" +
	"<table cellpadding=0 cellspacing=0 border=0 width=125 height=32><tr><td valign='top' align='center'><font class='moddesctext'>" + modEffects[i] + "<br></font></td></tr></table>" +
	"</center>"

	layerWrite("modTD"+i,mytext)

	if (modnum[i] <= 0) { 
		document.getElementById("modTD"+i).style.display="none";
	} else {
		showTM = true;
		if (FilterModsExp.indexOf(modexpansionG[i]) != -1) { showTM = false;  }
		if (FilterModsCmp.indexOf(modcomplexityG[i]) != -1) { showTM = false;  }

		if (showTM) {
			document.getElementById("modTD"+i).style.visibility="visible";
			if (fx) { document.getElementById("modTD"+i).style.display="table-cell"; }
			else { document.getElementById("modTD"+i).style.display="block"; }
		}
	}
}

function setCE() {
	for (var j=0;j<unitids.length;j++) { unitnewce[j] = unitCEArray[(unittypes[j])]; }
	for (var j=0;j<crewassignment.length;j++) { if (crewassignment[j] != -1 ) { unitnewce[j] = unitnewce[j] * crewce[(crewassignment[j])]; } }
	for (var i=0;i<modassignment.length;i++) { 
		modassignedto = modassignment[i]; 
		if (modassignedto != -1) { 
			unitid = modbyunit[i];
			mymodce = modceG[modassignedto]; 
			extraMod = 1
			for (var jj=0;jj<unitids.length;jj++) { 
				if (unitids[jj]==unitid) {
					myid=jj
					if ( (unitComplexityArray[(unittypes[myid])] == "S") && (modcomplexityG[modassignedto] == "I") ) { extraMod = 1.25 }
					if ( (unitComplexityArray[(unittypes[myid])] == "S") && (modcomplexityG[modassignedto] == "A") ) { extraMod = 1.5 }
					if ( (unitComplexityArray[(unittypes[myid])] == "I") && (modcomplexityG[modassignedto] == "A") ) { extraMod = 1.25 }
					if ( (unitComplexityArray[(unittypes[myid])] == "S") && (modcomplexityG[modassignedto] == "E") ) { extraMod = 1.5 }
					if ( (unitComplexityArray[(unittypes[myid])] == "I") && (modcomplexityG[modassignedto] == "E") ) { extraMod = 1.25 }
					break;
				} 
			}
			unitnewce[myid] = unitnewce[myid] * mymodce * extraMod; 
		}
	}

	for (var myid=0;myid<unitids.length;myid++) {
		unitid = unitids[myid];
		if (typeof modsToLoad[unitid] != 'undefined') { 
			for(var MLi=0;MLi<modsToLoad[unitid].length;MLi++) {
				if (modsToLoad[unitid][MLi]!=-1) {
					mymod = modsToLoad[unitid][MLi];
					mymodce = modceG[mymod]; 
					extraMod = 1
					if ( (unitComplexityArray[(unittypes[myid])] == "S") && (modcomplexityG[mymod] == "I") ) { extraMod = 1.25 }
					if ( (unitComplexityArray[(unittypes[myid])] == "S") && (modcomplexityG[mymod] == "A") ) { extraMod = 1.5 }
					if ( (unitComplexityArray[(unittypes[myid])] == "I") && (modcomplexityG[mymod] == "A") ) { extraMod = 1.25 }
					if ( (unitComplexityArray[(unittypes[myid])] == "S") && (modcomplexityG[mymod] == "E") ) { extraMod = 1.5 }
					if ( (unitComplexityArray[(unittypes[myid])] == "I") && (modcomplexityG[mymod] == "E") ) { extraMod = 1.25 }
					unitnewce[myid] = unitnewce[myid] * mymodce * extraMod; 
				}
			}
		}
		if (typeof unitIntMods[unitid] != 'undefined') { 
			if (typeof unitIntMods[unitid] != 'object') { unitIntMods[unitid] = unitIntMods[unitid].split(","); }
			for (var imyIntMods=0;imyIntMods<unitIntMods[unitid].length;imyIntMods++) {
				mymodce = modceG[unitIntMods[unitid][imyIntMods]]; 
				extraMod = 1
				if ( (unitComplexityArray[(unittypes[myid])] == "S") && (modcomplexityG[unitIntMods[unitid][imyIntMods]] == "I") ) { extraMod = 1.25 }
				if ( (unitComplexityArray[(unittypes[myid])] == "S") && (modcomplexityG[unitIntMods[unitid][imyIntMods]] == "A") ) { extraMod = 1.5 }
				if ( (unitComplexityArray[(unittypes[myid])] == "I") && (modcomplexityG[unitIntMods[unitid][imyIntMods]] == "A") ) { extraMod = 1.25 }
				if ( (unitComplexityArray[(unittypes[myid])] == "S") && (modcomplexityG[unitIntMods[unitid][imyIntMods]] == "E") ) { extraMod = 1.5 }
				if ( (unitComplexityArray[(unittypes[myid])] == "I") && (modcomplexityG[unitIntMods[unitid][imyIntMods]] == "E") ) { extraMod = 1.25 }
				unitnewce[myid] = unitnewce[myid] * mymodce * extraMod; 
			}
		}
	}
	
	armyCE = 0;
	armyCount = 0;
	for (var j=0;j<unitids.length;j++) { 
		if (document.getElementById('CEtext' + j  + 'DIV')) { layerWrite('CEtext' + j  + 'DIV',"&nbsp;<b>CE:</b> <span class='helptext'>" + addCommas(Math.round(unitnewce[j])) + "</span>"); }
		if ( (unitinarmy[j] == 1) && (crewassignment[j] != -1 ) ) { armyCE += Math.round(unitnewce[j]); armyCount++; } 
	}	

	drawArmyCE();
}

function showGroup(myType,myCount) {
	if (!document.getElementById("unitCell" + myType + "x1")) {	
	isLoaded = 0;
	groupLoad = 1;
	myIndex = unittypes.indexOf(myType)
	for (i=1; i<=myCount; i++) {
		newCell = document.getElementById("unitTable").rows[0].insertCell(document.getElementById("unitGroup" + myType).cellIndex+1)
		newCell.id = "unitCell" + myType + "x" + i
		newCell.className = "helptext bgIMG tdHolder"
		newCell.style.backgroundImage = "url(" + imgPath + "3d_full/l_" + unitImagesArray[myType] + ".gif)";

		intText = "";
		if (typeof unitIntMods[unitids[myIndex]] == 'object') {
			for (var imyIntMods=0;imyIntMods<unitIntMods[unitids[myIndex]].length;imyIntMods++) { intText += "<img onmousemove='showMod("+unitIntMods[unitids[myIndex]][imyIntMods]+",event);' onmouseout='hideMod();' src='"+imgPath+"mods/"+modimgG[unitIntMods[unitids[myIndex]][imyIntMods]]+"' class='modTrans'>&nbsp;"; }
			modCSS = "I";
		} else { modCSS = ""; }


		myText = "<table class='unitBox'><tr><td align='center' valign='top' class='unittext'>" +
		"<div id='nameClass"+unitids[myIndex]+"' class='NameBox"+modCSS+"'><a href='#' onClick=\"showinfo(" + myType + ",'unit')\"><font class='unittextb'>" + unitNamesArray[myType] + "</font> <span onmousemove=\"showVoM('" + unitvar[myIndex] + "','V',event);\" onmouseout='hideVoM();' id='unitVarText"+unitids[myIndex]+"'>" + unitvar[myIndex] + "</span></a></div>" +
		"<table id='modClass"+unitids[myIndex]+"' class='modBox"+modCSS+"'><tr><td class='actionBox' id='actionBoxInt"+unitids[myIndex]+"'></td><td class='modBoxtd' id='unitModBox"+unitids[myIndex]+"'>";
		
		myText = myText + intText;
	
		if (modbyunit.indexOf(unitids[myIndex]) != -1) { modSlots = 1 + (modbyunit.lastIndexOf(unitids[myIndex]) - modbyunit.indexOf(unitids[myIndex])); modSlotCounter = modbyunit.indexOf(unitids[myIndex]); }
		else { modSlots = 0 }

		for (ii=0;ii<modSlots;ii++) {
			myText = myText + "<a href='javascript:setmod(" + modSlotCounter + ",selectedmod)' onmousemove=\"displayModInfo(" + modSlotCounter + ",event)\" onmouseout=\"hideMod()\"><img src='" + imgPath + "mods/mod_slot.gif' name='imgslot" + modSlotCounter + "' id='imgslot" + modSlotCounter + "' class='modTrans'></a>&nbsp;";
			modSlotCounter += 1;
		}

		if (unitDamaged[myIndex] == 'N') {
			switch(unitComplexityArray[(unittypes[myIndex])]) {
				case "S": myCom = "Simple"; break;
				case "I": myCom = "Intermediate"; break;
				case "A": myCom = "Advanced"; break;
				case "E": myCom = "Elite"; break;
			}
		} else {
			myCom = "<span class='alerttext'>Damaged!</span>";
		}


		myText = myText + "</td><td class='actionBox' id='actionBoxAct"+unitids[myIndex]+"'></td></tr></table></td></tr></table>" +
		"<DIV ID='unitinarmy" + myIndex  + "' class='armyInfo unittext'></DIV>" +
		"<DIV ID='unitname" + myIndex  + "DIV' style='padding-bottom:2px;'>" + myCom + "</DIV>" +
		"<table class='crewInfo'>" +
		"<tr><td ID='CEtext" + myIndex  + "DIV' class='unittext' style='width:100px;'></td><td valign='middle' class='unittextb''>Crew:</td><td><a href='javascript:setcrew(" + myIndex + ",selectedcrew)' onfocus='this.blur();'><img src='" + imgPath + "mod_crew_box_top.gif' name='imgunit" + myIndex + "c1' border='0'><br><img src='" + imgPath + "mod_crew_box_bot.gif' name='imgunit" + myIndex + "c2' border='0'></a></td><td><DIV id='unitmerits" + myIndex + "' STYLE='width:30; height:19;'></DIV></td></tr></table>" +
		"</td>";

		newCell.innerHTML = myText;

		if (crewassignment[myIndex] != -1) { eval("setcrewConfirmed(" + myIndex + "," + crewassignment[myIndex] + ")"); }
		uLi = unitids[myIndex];
		if (typeof modsToLoad[uLi] != 'undefined') { for (mi=0; mi<modsToLoad[uLi].length; mi++) { preAssignMod(modsToLoad[uLi][mi],uLi); modsToLoad[uLi][mi] = -1;} }
		layerWrite('CEtext' + myIndex  + 'DIV',"&nbsp;<b>CE:</b> <span class='helptext'>" + addCommas(Math.round(unitnewce[myIndex])) + "</span>");
		myIndex += 1;


	}
	initArmy();
	isLoaded = 1;
	groupLoad = 0;
	} 	
	for (i=1; i<=myCount; i++) {
		mydiv = "unitCell" + myType + "x" + i 
		document.getElementById(mydiv).style.visibility="visible";
		if (fx) { document.getElementById(mydiv).style.display="table-cell"; }
		else { document.getElementById(mydiv).style.display="block"; }
	}	
	mytext = "<a href='javascript:hideGroup(" + myType + "," + myCount + ")' class='unittext'><img src='" + imgPath + "icon_minus.gif' /><br>Hide Group</a>" 
	layerWrite("unitGroup" + myType + "text",mytext)
}

function hideGroup(myType,myCount) {
	for (i=1; i<=myCount; i++) {
		mydiv = "unitCell" + myType + "x" + i 

		document.getElementById(mydiv).style.visibility="hidden";
		document.getElementById(mydiv).style.display="none";
	}	
	
	mytext = "<a href='javascript:showGroup(" + myType + "," + myCount + ")' class='unittext'><img src='" + imgPath + "icon_plus.gif' /><br>Show Group</a>" 
	layerWrite("unitGroup" + myType + "text",mytext)
}

function toggleMM() {
	if (multiMod) {
		multiMod = false;
		document.getElementById("multimod1DIV").innerHTML="[ <a href='javascript:toggleMM();'>Single-Mod</a> ]";
		layerWrite('helptext1DIV',"You can now place/remove Mods one at a time.",'container1DIV.document.text1DIV');
		selectedmod = "none";
	} else {
		multiMod = true;
		document.getElementById("multimod1DIV").innerHTML="[ <a href='javascript:toggleMM();'>Multi-Mod</a> ]";
		layerWrite('helptext1DIV',"You can now place multiple Mods at once.",'container1DIV.document.text1DIV');
	}
}

function togglearmy(myUnit) {
	if (unitinarmy[myUnit] == 1) { queueCommand(unitids[myUnit],'togglearmy',0); } else { queueCommand(unitids[myUnit],'togglearmy',1); }
}

function togglearmyConfirm(myUnit,myStatus) {
	myUnit = unitids.indexOf(myUnit);
	mytext = "";
	if (myStatus == 0) {
		unitinarmy[myUnit] = 0;
		armyCE -= Math.floor(unitnewce[myUnit])
		armyCount--;
		mytext = "[ <a href='javascript:togglearmy("+myUnit+")' class='alerttextb'>In Reserve</a> ]"
	} else {
		unitinarmy[myUnit] = 1;
		armyCE += Math.floor(unitnewce[myUnit])
		armyCount++;
		if (crewassignment[myUnit] != 0) { mytext = "[ <a href='javascript:togglearmy("+myUnit+")'>In Army</a> ]" } 
	}
	if (mytext != "") { layerWrite("unitinarmy"+myUnit,mytext); }
	drawArmyCE()
}

function repairUnit(unitIndex) {
	queueCommand(unitids[unitIndex],'repair', unitIndex);
}

function unitRepaired(unitIndex) {
	unitDamaged[unitIndex] = 'N';

	let complexity;
	switch(unitComplexityArray[(unittypes[unitIndex])]) {
		case "S": complexity = "Simple"; break;
		case "I": complexity = "Intermediate"; break;
		case "A": complexity = "Advanced"; break;
		case "E": complexity = "Elite"; break;
	}
	layerWrite("unitname" + unitIndex  + "DIV",complexity);
	layerWrite("unitinarmy"+unitIndex,'');

	layerWrite('helptext1DIV','<span class=\"nameNewbie\">'+unitNamesArray[(unittypes[unitIndex])]+' repaired!</span>','container1DIV.document.text1DIV')
}

function selectcrew(mycrew) {
	crewinunit=0;
	for (i=0; i<crewassignment.length; i++)
	{ if (mycrew == crewassignment[i]) {removecrew(i); crewinunit=1;}; }
	if (crewinunit==0) {
	selectedcrew = mycrew;
	layerWrite('helptext1DIV',"Select Crew Slot on Unit for <span class='helptextb'>"+crewname[mycrew]+"</span>",'container1DIV.document.text1DIV')
	}
}

function setcrew(myunit,crewconst) {
	if (crewmerits[crewconst] == undefined) { crewmerits[crewconst] = ""; }
	if ((crewconst == "none") && (crewassignment[myunit] != -1)) { removecrew(myunit); }
	else if ((crewconst == "none") && (crewassignment[myunit] == -1)) { layerWrite('helptext1DIV','Please Select a Crew for this Unit','container1DIV.document.text1DIV') }
	else if (unitDamaged[myunit] === 'Y') { layerWrite('helptext1DIV','<span class=\"alerttext\">Crews cannot be assigned to a Damaged Unit</span>','container1DIV.document.text1DIV') }
	else {

		if (unitIsMekaArray[(unittypes[myunit])] == "N") {
			myunittype = "vehicle"
			if (unitComplexityArray[(unittypes[myunit])] == "A") { minskill=3; mintext="Veteran"; }
			else if (unitComplexityArray[(unittypes[myunit])] == "E") { minskill=3; mintext="Veteran"; }
			else if (unitComplexityArray[(unittypes[myunit])] == "I") { minskill=2; mintext="Skilled"; }
			else { minskill=1 }
		} else {
			myunittype = "Meka"
			if (unitComplexityArray[(unittypes[myunit])] == "A") { minskill=4; mintext="Elite"; }
			else if (unitComplexityArray[(unittypes[myunit])] == "E") { minskill=4; mintext="Elite"; }
			else if (unitComplexityArray[(unittypes[myunit])] == "I") { minskill=3; mintext="Veteran"; }
			else { minskill=2; mintext="Skilled"; }
		}

		if ( (typeof unitIsComArray[(unittypes[myunit])] != 'undefined') && (typeof crewmerits[crewconst] == 'undefined') ) { 
			layerWrite('helptext1DIV','<font class=alerttext><b>ERROR:</b></font> This ' + myunittype + ' requires a crew with the Battlefield Promotion Merit. ','container1DIV.document.text1DIV')		
		} else if ( (unitvar[myunit].indexOf('+') != -1) && (crewconst != 0) ) { 
			layerWrite('helptext1DIV','<font class=alerttext><b>ERROR:</b></font> Only your Commander can crew an Activated unit. ','container1DIV.document.text1DIV')		
		} else if ( (typeof unitIsComArray[(unittypes[myunit])] != 'undefined') && (crewmerits[crewconst].indexOf(12) == -1) && ((crewconst != 0) || (!comHasAO)) ) {
			layerWrite('helptext1DIV','<font class=alerttext><b>ERROR:</b></font> This ' + myunittype + ' requires a crew with the Battlefield Promotion Merit. ','container1DIV.document.text1DIV')		
//		} else if ( (typeof unitIsComArray[(unittypes[myunit])] != 'undefined') && (isPaid!=1) ) {
//			layerWrite('helptext1DIV','<font class=alerttext><b>ERROR:</b></font> You need TinyDayz to use a Command Unit. ','container1DIV.document.text1DIV')
		} else if (minskill <= crewpil[crewconst]) { 
			if ((crewconst != "none") && (crewassignment[myunit] != -1)) { removecrew(myunit); }
			queueCommand(crewids[crewconst],'setcrew',unitids[myunit]); 
		} else if (isLoaded == 1) {
			if (unitComplexityArray[(unittypes[myunit])] == "A") { myComplexity="Advanced" }
			else if (unitComplexityArray[(unittypes[myunit])] == "E") { myComplexity="Elite" }
			else if (unitComplexityArray[(unittypes[myunit])] == "I") { myComplexity="Intermediate" }
			else { myComplexity="Simple" }
		
			layerWrite('helptext1DIV','<font class=alerttext><b>ERROR:</b></font> Crew must have ' + mintext + ' or better Piloting to use this ' + myComplexity + ' ' + myunittype + '. ','container1DIV.document.text1DIV')
		}

		selectedcrew = "none";
	}
	
}

function removecrew(myunit) {
	layerWrite('helptext1DIV','Removing Crew from Unit','container1DIV.document.text1DIV')
	queueCommand(unitids[myunit],'removecrew',myunit); 
}

function removecrewConfirmed(myunit) {
	removedcrew = crewassignment[myunit]
	chgImg('imgunit'+myunit+'c1','nocrewt')
	chgImg('imgunit'+myunit+'c2','nocrewb')
	crewassignment[myunit] = -1
	unitinarmy[myunit] = 0
	
	layerWrite("unitinarmy" + myunit,"")
	layerWrite("unitmerits" + myunit ,"")
	
	if (unitComplexityArray[(unittypes[myunit])] == "A") { myComplexity="Advanced" }
	else if (unitComplexityArray[(unittypes[myunit])] == "E") { myComplexity="Elite" }
	else if (unitComplexityArray[(unittypes[myunit])] == "I") { myComplexity="Intermediate" }
	else { myComplexity="Simple" }
	
	layerWrite("unitname" + myunit + "DIV",myComplexity,"container1DIV.document.text1DIV")
	layerWrite('helptext1DIV','Crew Removed from Unit','container1DIV.document.text1DIV')
	
	if (isLoaded == 1) {
		if (FilterOptions["MF"] == "has") {
			tFilterFull = [0,1,2,3,4,5,6,7,8,9,10,11,12,13];
			tFilterCheck = Array();
			for (var mi=0;mi<tFilterFull.length;mi++) { if (FilterCrews.indexOf(tFilterFull[mi]) == -1) { tFilterCheck[tFilterCheck.length] = tFilterFull[mi]; } }
		}
		showTC = true;
		if (typeof crewmerits[removedcrew] != "undefined") { 
			if (FilterOptions["MF"] == "has") { showTC = false; }
			for (var ii=0;ii<crewmerits[removedcrew].length;ii++) {
				if (FilterOptions["MF"] == "only") {
					if (FilterCrews.indexOf(crewmerits[removedcrew][ii]) != -1) { showTC = false; break; }
				} else {
					if (tFilterCheck.indexOf(crewmerits[removedcrew][ii]) != -1) { showTC = true; break; }
				}
			} 
		} else if (FilterOptions["NMC"] != "show") { showTC = false; }

		if (showTC) {
			document.getElementById("crewDIV" + removedcrew).style.visibility="visible";
			if (fx) { document.getElementById("crewDIV" + removedcrew).style.display="table-cell"; }
			else { document.getElementById("crewDIV" + removedcrew).style.display="block"; }
		}

		setCE();
	}
}

function setcrewConfirmed(myunit,mycrew) {
	crewassignment[myunit] = mycrew
	chgImg('imgunit'+myunit+'c1','crewg'+crewgun[mycrew])
	chgImg('imgunit'+myunit+'c2','crewp'+crewpil[mycrew])

	layerWrite("unitname" + myunit + "DIV",crewname[mycrew],"container1DIV.document.text1DIV")
	
	if (mycrew != 0) {
		layerWrite("unitinarmy" + myunit,"[ <a href='javascript:togglearmy("+myunit+")' class='alerttextb'>In Reserve</a> ]")
	} else { 
		comUnit = myunit;
		if (isLoaded == 1) { togglearmy(myunit); } 
		layerWrite("unitinarmy"+myunit,"<span class='unittextb'>Commander</span>")			
	}

	merittext = "";
	if (typeof crewmerits[mycrew] != 'undefined') {
		for (var meriti=0;meriti<crewmerits[mycrew].length;meriti++) {
			merittext += "<img onmousemove=\"showVoM("+crewmerits[mycrew][meriti]+",'M',event);\" onmouseout='hideVoM();' src='" + imgPath + "merits/merit_" + crewmerits[mycrew][meriti] + ".gif'>";
		}
	} 
	layerWrite("unitmerits" + myunit ,merittext)

	if (isLoaded == 1) {
		layerWrite('helptext1DIV','Crew Assigned to Unit','container1DIV.document.text1DIV');
		setCE();
		document.getElementById("crewDIV" + mycrew).style.visibility="hidden";
		document.getElementById("crewDIV" + mycrew).style.display="none";
	}
}

function selectmod(mymod) {
	if (modnum[mymod] > 0) {
	selectedmod = mymod;
	layerWrite('helptext1DIV',"Select Mod Slot on Unit for <span class='helptextb'>"+modNames[mymod]+"</span>",'container1DIV.document.text1DIV')
	} else { layerWrite('helptext1DIV','You have no more Mods of that type','container1DIV.document.text1DIV') }
}

function setmod(myslot,modconst) { 
	myunit=modbyunit[myslot]; 
	addError = 0;
	for (MAi=modbyunit.indexOf(myunit); MAi<=modbyunit.lastIndexOf(myunit); MAi++) { if ( (modconst == modassignment[MAi]) && (myunit == modbyunit[MAi]) && (modassignment[myslot] != modconst) && (modconst!=120) ) { addError=1; } } 
	if (typeof unitIntMods[myunit] == 'object') { for (var imyIntMods=0;imyIntMods<unitIntMods[myunit].length;imyIntMods++) { if (unitIntMods[myunit][imyIntMods]==modconst) { addError=2; } } }

	if ((modconst == "none") && (modassignment[myslot] != -1)) { removemod(myslot); }
	else if (addError==1) { layerWrite('helptext1DIV','<font class=alerttext><b>ERROR:</b></font> Unit can only mount one of each mod. ','container1DIV.document.text1DIV'); if (!multiMod) { selectedmod = "none"; } }
	else if (addError==2) { layerWrite('helptext1DIV','<font class=alerttext><b>ERROR:</b></font> Unit can only mount one of each mod. ','container1DIV.document.text1DIV'); if (!multiMod) { selectedmod = "none"; } }
	else if ((modconst == "none") && (modassignment[myslot] == -1)) { layerWrite('helptext1DIV','Please Select a Mod for this Unit','container1DIV.document.text1DIV') }
	else { 	
		if ((modconst != "none") && (modassignment[myslot] != -1)) { removemod(myslot); }
		layerWrite('helptext1DIV','','container1DIV.document.text1DIV'); 
		if ( (!multiMod) && (groupLoad!=1) ) { selectedmod = "none"; }
		queueCommand(modconst,'setmod',myunit+'x'+myslot); 
	}
}

function setmodConfirmed(myslot,modconst) {
	addtype = 1;
	myunit=modbyunit[myslot];
	unitPos = unitids.indexOf(myunit);
	if (isLoaded == 1) {
		if ( (modcomplexityG[modconst] != "S") && (unitComplexityArray[(unittypes[unitPos])] == "S") ) { addtype = 2; }
		if ( (modcomplexityG[modconst] == "A") && (unitComplexityArray[(unittypes[unitPos])] == "I") ) { addtype = 2; }
		if ( (modcomplexityG[modconst] == "E") && (unitComplexityArray[(unittypes[unitPos])] == "I") ) { addtype = 2; }
	}

	confirmmod(myslot,modconst,addtype);
}

function removemod(myslot) {
	myunit=modbyunit[myslot]; 
	removedmod = modassignment[myslot]
	queueCommand(removedmod,'removemod',myunit+'x'+myslot);
}

function removemodConfirmed(myslot) {

	removedmod = modassignment[myslot]
	document.getElementById('imgslot'+myslot).style.backgroundColor = "transparent"
	if (!fx) { chgImg('imgslot'+myslot,'nomod') } else { setTimeout("chgImg('imgslot"+myslot+"','nomod')", 10) }

	modassignment[myslot] = -1
	modnum[removedmod] += 1

	if (removedmod == 104) { checkEye(myslot); }
	else if (removedmod == 120) { checkTears(myslot); }

	layerWrite('helptext1DIV','Mod Removed from Unit','container1DIV.document.text1DIV')

	redrawMod(removedmod);
	checkTears(myslot);
	setCE();
}

function confirmmod(myslot,mymod,addtype) {
	if ( (groupLoad!=1) && (isLoaded == 1) ) {modnum[mymod] -= 1;}
	if (modnum[mymod] == 0) { selectedmod = "none"; }
	modassignment[myslot] = mymod;
	chgImg('imgslot'+myslot,'mod'+mymod);
	document.getElementById('imgslot'+myslot).style.backgroundColor = "#3cff00";
	
	if (isLoaded == 1) {	
		if (addtype == 1) {	
			layerWrite('helptext1DIV','Mod Assigned to Unit','container1DIV.document.text1DIV');
		} else {
			layerWrite('helptext1DIV',"Mod Assigned to Unit [<font class='alerttextb'>Mod too Complex for Unit: CE Penalty Added!</font>]",'container1DIV.document.text1DIV');
		}
		setCE();
		redrawMod(mymod);
	}

	if (mymod == 104) { checkEye(myslot); }
	checkTears(myslot);
}

function checkTears(myslot) {
	hasMod = false;
	tearCount = 0;
	myunit = modbyunit[myslot];
	for (ti=modbyunit.indexOf(myunit); ti<=modbyunit.lastIndexOf(myunit); ti++) { if (modassignment[ti] == 120) { tearCount++; } else { hasMod = true; } }

	if (unitComplexityArray[(unittypes[unitids.indexOf(myunit)])] == "A") { tearNeed=3; }
	else if (unitComplexityArray[(unittypes[unitids.indexOf(myunit)])] == "I") { tearNeed=2; }
	else { tearNeed=1; }

	if (!hasMod) { tearCount = 0; }

	if (tearCount>=tearNeed) {
		layerWrite("actionBoxInt"+myunit,"<a href=\"javascript:queueCommand("+myunit+",'integrate',"+myslot+"); layerWrite('actionBoxInt"+myunit+"',''); \"><img onmousemove=\"showtwHelp('Integrate',event);\" onmouseout='hidetwHelp();' onClick='hidetwHelp();' src='images/mu_int_sm.png' border='0'><div id='integrationChance"+myunit+"'></div>",'container1DIV.document.text1DIV');
		queueCommand(myunit,'integrate', 'checkChance')
	} else {
		layerWrite('actionBoxInt'+myunit,"",'container1DIV.document.text1DIV'); 
	}
}

function removeTear(myunit) {
	for (ti=modbyunit.indexOf(myunit); ti<=modbyunit.lastIndexOf(myunit); ti++) { if (modassignment[ti] == 120) { myslot = ti; break; } } 
	document.getElementById('imgslot'+myslot).style.backgroundColor = "transparent"
	if (!fx) { chgImg('imgslot'+myslot,'nomod') } else { setTimeout("chgImg('imgslot"+myslot+"','nomod')", 10) }
	modassignment[myslot] = -1

	checkTears(myslot)
}

function integrateUnit(myunit,mytears,myintmod) {
	for (var ii=0;ii<mytears;ii++) {
		for (ti=modbyunit.indexOf(myunit); ti<=modbyunit.lastIndexOf(myunit); ti++) { if (modassignment[ti] == 120) { myslot = ti; break; } } 
		document.getElementById('imgslot'+myslot).style.backgroundColor = "transparent"
		if (!fx) { chgImg('imgslot'+myslot,'nomod') } else { setTimeout("chgImg('imgslot"+myslot+"','nomod')", 10) }
		modassignment[myslot] = -1
	}

	for (ti=modbyunit.indexOf(myunit); ti<=modbyunit.lastIndexOf(myunit); ti++) { if (modassignment[ti] == myintmod) { myslot = ti; break; } } 
	document.getElementById('imgslot'+myslot).style.backgroundColor = "transparent"
	if (!fx) { chgImg('imgslot'+myslot,'nomod') } else { setTimeout("chgImg('imgslot"+myslot+"','nomod')", 10) }
	modassignment[myslot] = -1
	myunit = modbyunit[myslot];
	
	document.getElementById("nameClass"+myunit).className = 'NameBoxI'
	document.getElementById("modClass"+myunit).className = 'modBoxI'
	document.getElementById("unitVarText"+myunit).innerHTML = document.getElementById("unitVarText"+myunit).innerHTML + "I";
	document.getElementById("unitModBox"+myunit).innerHTML = "<img onmousemove='showMod("+myintmod+",event);' onmouseout='hideMod();' src='"+imgPath+"mods/"+modimgG[myintmod]+"' class='modTrans'>" + document.getElementById("unitModBox"+myunit).innerHTML;
	
	if (typeof unitIntMods[myunit] == 'undefined') { unitIntMods[myunit] = myintmod; }
	else { unitIntMods[myunit] = unitIntMods[myunit] + "," + myintmod; }

	checkTears(myslot)
}

function checkEye(myslot) {
	myunit = modbyunit[myslot];
	hasEye = false;
	for (ti=modbyunit.indexOf(myunit); ti<=modbyunit.lastIndexOf(myunit); ti++) { if (modassignment[ti] == 104) { hasEye = true; break; } } 

	if (hasEye) {
		layerWrite("actionBoxAct"+myunit,"<a href=\"javascript:queueCommand("+myunit+",'activate',"+myslot+");layerWrite('actionBoxAct"+myunit+"','');\"><img onmousemove=\"showtwHelp('Activate',event);\" onmouseout='hidetwHelp();' onClick='hidetwHelp();' src='images/mu_act_sm.png' border='0'><a>",'container1DIV.document.text1DIV'); 
	} else {
		layerWrite('actionBoxAct'+myunit,"",'container1DIV.document.text1DIV'); 
	}
}

function activateUnit(myunit) {
	for (ti=modbyunit.indexOf(myunit); ti<=modbyunit.lastIndexOf(myunit); ti++) { if (modassignment[ti] == 104) { myslot = ti; break; } } 
	document.getElementById('imgslot'+myslot).style.backgroundColor = "transparent"
	if (!fx) { chgImg('imgslot'+myslot,'nomod') } else { setTimeout("chgImg('imgslot"+myslot+"','nomod')", 10) }
	modassignment[myslot] = -1
	myunit = modbyunit[myslot];
	
	document.getElementById("unitVarText"+myunit).innerHTML = document.getElementById("unitVarText"+myunit).innerHTML + "+";
	checkEye(myslot)
}

function applyFilter() {
//	for (var i=0;i<unitNamesArray.length;i++) { 
//		if (unittypes.indexOf(i) != -1) {
//			showTU = true;
//			if (FilterUnitsExp.indexOf(unitexpansionG[i]) != -1) { showTU = false;  }
//			if (FilterUnitsCmp.indexOf(unitComplexityArray[i]) != -1) { showTU = false;  }
//			
//			if (!document.getElementById("unitGroup"+i)) { isUGroup = false; }
//			else { isUGroup = true; }
//
//			if (showTU) {
//				if (isUGroup) {
//					document.getElementById("unitGroup"+i).style.visibility = "visible";
//					if (fx) { document.getElementById("unitGroup"+i).style.display="table-cell"; }
//					else { document.getElementById("unitGroup"+i).style.display="block"; }
//				} else {
//					document.getElementById("unitCell"+i+"x1").style.visibility = "visible";
//					if (fx) { document.getElementById("unitCell"+i+"x1").style.display="table-cell"; }
//					else { document.getElementById("unitCell"+i+"x1").style.display="block"; }
//				}
//			} else {
//				if (isUGroup) {
//					if (document.getElementById("unitCell"+i+"x1")) {
//						groupCount = (unittypes.lastIndexOf(i) - unittypes.indexOf(i)) + 1;
//						hideGroup(i,groupCount);
//					}
//					
//					document.getElementById("unitGroup"+i).style.visibility = "hidden";
//					document.getElementById("unitGroup"+i).style.display = "none";	
//				} else {
//					document.getElementById("unitCell"+i+"x1").style.visibility = "hidden";
//					document.getElementById("unitCell"+i+"x1").style.display = "none";	
//				}
//			}
//		}
//	}

	for (var i=0;i<crewids.length;i++) { 
		document.getElementById("crewDIV"+i).style.visibility = "hidden";
		document.getElementById("crewDIV"+i).style.display = "none";
	}
	
	if (FilterOptions["MF"] == "has") {
		tFilterFull = [0,1,2,3,4,5,6,7,8,9,10,11,12,13];
		tFilterCheck = Array();
		for (var mi=0;mi<tFilterFull.length;mi++) { if (FilterCrews.indexOf(tFilterFull[mi]) == -1) { tFilterCheck[tFilterCheck.length] = tFilterFull[mi]; } }
	}
	for (var i=0;i<crewids.length;i++) {
		showTC = true;
		if (crewassignment.indexOf(i) != -1) { showTC = false; }
		if (showTC) { if (typeof crewmerits[i] != "undefined") { 
			if (FilterOptions["MF"] == "has") { showTC = false; }
			for (var ii=0;ii<crewmerits[i].length;ii++) {
				if (FilterOptions["MF"] == "only") {
					if (FilterCrews.indexOf(crewmerits[i][ii]) != -1) { showTC = false; break; }
				} else {
					if (tFilterCheck.indexOf(crewmerits[i][ii]) != -1) { showTC = true; break; }
				}
			} 
		} else if (FilterOptions["NMC"] != "show") { showTC = false; } }
		
		if (showTC) {
			document.getElementById("crewDIV"+i).style.visibility = "visible";
			if (fx) { document.getElementById("crewDIV"+i).style.display="table-cell"; }
			else { document.getElementById("crewDIV"+i).style.display="block"; }
		}
	}	

	for (var i in modnum) { if (modPUG[i] == 0) {
		document.getElementById("modTD"+i).style.visibility = "hidden";
		document.getElementById("modTD"+i).style.display = "none";	
	} }

	for (var i in modnum) { if (modPUG[i] == 0) { if (modnum[i] > 0) {
		showTM = true;
		if (FilterModsExp.indexOf(modexpansionG[i]) != -1) { showTM = false;  }
		if (FilterModsCmp.indexOf(modcomplexityG[i]) != -1) { showTM = false;  }

		if (showTM) {
			document.getElementById("modTD"+i).style.visibility = "visible";
			if (fx) { document.getElementById("modTD"+i).style.display="table-cell"; }
			else { document.getElementById("modTD"+i).style.display="block"; }
		}
	} } }
}

function drawFilter() {
//	mytext="<span class='unittextb'>Filter Units</span>:<br><img src='" + imgPath + "pxiel.gif' width='1' height='4'><br>";
//	if (FilterUnitsExp.indexOf("X") != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
//	mytext+="<span onClick=\"setFilter('X','unitE')\" class='comtextb dsPointer' style='" + modCSS + "'>Default</span>&nbsp;";
//	if (FilterUnitsExp.indexOf("BT") != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
//	mytext+="<img onClick=\"setFilter('BT','unitE')\" src='" + imgPath + "expansion_bt.gif' border='0' style='" + modCSS + " vertical-align: middle;' title='Battle Tactics' class='dsPointer'>&nbsp;";
//	if (FilterUnitsExp.indexOf("XP") != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
//	mytext+="<img onClick=\"setFilter('XP','unitE')\" src='" + imgPath + "expansion_xp.png' border='0' style='" + modCSS + " vertical-align: middle;' title='X-Project' class='dsPointer png'>&nbsp;";
//	if (FilterUnitsExp.indexOf("SW") != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
//	mytext+="<img onClick=\"setFilter('SW','unitE')\" src='" + imgPath + "expansion_sw.png' border='0' style='" + modCSS + " vertical-align: middle;' title='Shadow Wars' class='dsPointer png'>&nbsp;";
//	if (FilterUnitsExp.indexOf("CD") != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
//	mytext+="<img onClick=\"setFilter('CD','unitE')\" src='" + imgPath + "expansion_cd.png' border='0' style='" + modCSS + " vertical-align: middle;' title='Combat Drop' class='dsPointer png'>&nbsp;";
//	if (FilterUnitsExp.indexOf("F") != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
//	mytext+="<img onClick=\"setFilter('F','unitE')\" src='" + imgPath + "expansion_fac.gif' border='0' style='" + modCSS + " vertical-align: middle;' title='Faction Levels' class='dsPointer'>&nbsp;";
//	if (FilterUnitsExp.indexOf("B") != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
//	mytext+="<img onClick=\"setFilter('B','unitE')\" src='" + imgPath + "expansion_ban.gif' border='0' style='" + modCSS + " vertical-align: middle;' title='Bandit' class='dsPointer'>&nbsp;";
//	if (FilterUnitsExp.indexOf("SK") != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
//	mytext+="<img onClick=\"setFilter('SK','unitE')\" src='" + imgPath + "expansion_sha.gif' border='0' style='" + modCSS + " vertical-align: middle;' title='Sha&rsquo;Kahr' class='dsPointer'>&nbsp;";

//	mytext+="<br><img src='" + imgPath + "pxiel.gif' width='1' height='4'><br>";

//	if (FilterUnitsCmp.indexOf("S") != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
//	mytext+="[ <span onClick=\"setFilter('S','unitC')\" class='greentextb dsPointer' style='" + modCSS + "' title='Simple'>S</span> ]&nbsp;";
//	if (FilterUnitsCmp.indexOf("I") != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
//	mytext+="[ <span onClick=\"setFilter('I','unitC')\" class='greentextb dsPointer' style='" + modCSS + "' title='Intermediate'>I</span> ]&nbsp;";
//	if (FilterUnitsCmp.indexOf("A") != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
//	mytext+="[ <span onClick=\"setFilter('A','unitC')\" class='greentextb dsPointer' style='" + modCSS + "' title='Advanced'>A</span> ]&nbsp;";
//	if (FilterUnitsCmp.indexOf("E") != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
//	mytext+="[ <span onClick=\"setFilter('E','unitC')\" class='greentextb dsPointer' style='" + modCSS + "' title='Elite'>E</span> ]&nbsp;";

	mytext="<span class='unittextb'>Filter Crews</span>:<br><img src='" + imgPath + "pixel.gif' width='1' height='4'><br>";
	if (FilterCrews.indexOf(0) != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
	mytext+="<img onClick=\"setFilter(0,'crew')\" src='" + imgPath + "merits/merit_0.gif' border='0' onmousemove=\"showVoM(0,'M',event);\" onmouseout='hideVoM();' class='dsPointer' style='" + modCSS + "'>&nbsp;";
	if (FilterCrews.indexOf(1) != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
	mytext+="<img onClick=\"setFilter(1,'crew')\" src='" + imgPath + "merits/merit_1.gif' border='0' onmousemove=\"showVoM(1,'M',event);\" onmouseout='hideVoM();' class='dsPointer' style='" + modCSS + "'>&nbsp;";
	if (FilterCrews.indexOf(2) != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
	mytext+="<img onClick=\"setFilter(2,'crew')\" src='" + imgPath + "merits/merit_2.gif' border='0' onmousemove=\"showVoM(2,'M',event);\" onmouseout='hideVoM();' class='dsPointer' style='" + modCSS + "'>&nbsp;";
	if (FilterCrews.indexOf(3) != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
	mytext+="<img onClick=\"setFilter(3,'crew')\" src='" + imgPath + "merits/merit_3.gif' border='0' onmousemove=\"showVoM(3,'M',event);\" onmouseout='hideVoM();' class='dsPointer' style='" + modCSS + "'>&nbsp;";
	if (FilterCrews.indexOf(4) != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
	mytext+="<img onClick=\"setFilter(4,'crew')\" src='" + imgPath + "merits/merit_4.gif' border='0' onmousemove=\"showVoM(4,'M',event);\" onmouseout='hideVoM();' class='dsPointer' style='" + modCSS + "'>&nbsp;";
	if (FilterCrews.indexOf(5) != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
	mytext+="<img onClick=\"setFilter(5,'crew')\" src='" + imgPath + "merits/merit_5.gif' border='0' onmousemove=\"showVoM(5,'M',event);\" onmouseout='hideVoM();' class='dsPointer' style='" + modCSS + "'>&nbsp;";
	if (FilterCrews.indexOf(6) != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
	mytext+="<img onClick=\"setFilter(6,'crew')\" src='" + imgPath + "merits/merit_6.gif' border='0' onmousemove=\"showVoM(6,'M',event);\" onmouseout='hideVoM();' class='dsPointer' style='" + modCSS + "'>&nbsp;";
	if (FilterCrews.indexOf(7) != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
	mytext+="<img onClick=\"setFilter(7,'crew')\" src='" + imgPath + "merits/merit_7.gif' border='0' onmousemove=\"showVoM(7,'M',event);\" onmouseout='hideVoM();' class='dsPointer' style='" + modCSS + "'>&nbsp;";
	if (FilterCrews.indexOf(8) != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
	mytext+="<img onClick=\"setFilter(8,'crew')\" src='" + imgPath + "merits/merit_8.gif' border='0' onmousemove=\"showVoM(8,'M',event);\" onmouseout='hideVoM();' class='dsPointer' style='" + modCSS + "'>&nbsp;";
	if (FilterCrews.indexOf(9) != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
	mytext+="<img onClick=\"setFilter(9,'crew')\" src='" + imgPath + "merits/merit_9.gif' border='0' onmousemove=\"showVoM(9,'M',event);\" onmouseout='hideVoM();' class='dsPointer' style='" + modCSS + "'>&nbsp;";
	if (FilterCrews.indexOf(10) != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
	mytext+="<img onClick=\"setFilter(10,'crew')\" src='" + imgPath + "merits/merit_10.gif' border='0' onmousemove=\"showVoM(10,'M',event);\" onmouseout='hideVoM();' class='dsPointer' style='" + modCSS + "'>&nbsp;";
	if (FilterCrews.indexOf(11) != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
	mytext+="<img onClick=\"setFilter(11,'crew')\" src='" + imgPath + "merits/merit_11.gif' border='0' onmousemove=\"showVoM(11,'M',event);\" onmouseout='hideVoM();' class='dsPointer' style='" + modCSS + "'>&nbsp;";
	if (FilterCrews.indexOf(12) != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
	mytext+="<img onClick=\"setFilter(12,'crew')\" src='" + imgPath + "merits/merit_12.gif' border='0' onmousemove=\"showVoM(12,'M',event);\" onmouseout='hideVoM();' class='dsPointer' style='" + modCSS + "'>&nbsp;";
	if (FilterCrews.indexOf(13) != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
	mytext+="<img onClick=\"setFilter(13,'crew')\" src='" + imgPath + "merits/merit_13.gif' border='0' onmousemove=\"showVoM(13,'M',event);\" onmouseout='hideVoM();' class='dsPointer' style='" + modCSS + "'>&nbsp;<br>" +
	"<img src='" + imgPath + "pixel.gif' width='1' height='4'><br>";

	if (FilterOptions["MF"] == "only") { mytext+="[ <a href=\"javascript:toggleFilter('MF');\" class='helptextb'>Only these Merits</a> ]"; }
	else { mytext+="[ <a href=\"javascript:toggleFilter('MF');\" class='greentextb'>At least these Merits</a> ]"; }

	if (FilterOptions["NMC"] == "show") { mytext+="[ <a href=\"javascript:toggleFilter('NMC');\" class='helptextb'>Showing No-merit Crews</a> ]"; }
	else { mytext+="[ <a href=\"javascript:toggleFilter('NMC');\" class='greentextb'>Hiding No-merit Crews</a> ]"; }

	mytext+="<br><img src='" + imgPath + "pixel.gif' width='1' height='8'><br><span class='unittextb'>Filter Mods</span>:<br><img src='" + imgPath + "pixel.gif' width='1' height='4'><br>";
	if (FilterModsExp.indexOf("X") != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
	mytext+="<span onClick=\"setFilter('X','modE')\" class='comtextb dsPointer' style='" + modCSS + "'>Default</span>&nbsp;";
	if (FilterModsExp.indexOf("BT") != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
	mytext+="<img onClick=\"setFilter('BT','modE')\" src='" + imgPath + "expansion_bt.gif' border='0' style='" + modCSS + " vertical-align: middle;' title='Battle Tactics' class='dsPointer'>&nbsp;";
	if (FilterModsExp.indexOf("XP") != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
	mytext+="<img onClick=\"setFilter('XP','modE')\" src='" + imgPath + "expansion_xp.png' border='0' style='" + modCSS + " vertical-align: middle;' title='X-Project' class='dsPointer png'>&nbsp;";
	if (FilterModsExp.indexOf("SW") != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
	mytext+="<img onClick=\"setFilter('SW','modE')\" src='" + imgPath + "expansion_sw.png' border='0' style='" + modCSS + " vertical-align: middle;' title='Shadow Wars' class='dsPointer png'>&nbsp;";
	if (FilterModsExp.indexOf("CD") != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
	mytext+="<img onClick=\"setFilter('CD','modE')\" src='" + imgPath + "expansion_cd.png' border='0' style='" + modCSS + " vertical-align: middle;' title='Combat Drop' class='dsPointer png'>&nbsp;";
	if (FilterModsExp.indexOf("F") != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
	mytext+="<img onClick=\"setFilter('F','modE')\" src='" + imgPath + "expansion_fac.gif' border='0' style='" + modCSS + " vertical-align: middle;' title='Faction Levels' class='dsPointer'>&nbsp;";
	if (FilterModsExp.indexOf("B") != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
	mytext+="<img onClick=\"setFilter('B','modE')\" src='" + imgPath + "expansion_ban.gif' border='0' style='" + modCSS + " vertical-align: middle;' title='Bandit' class='dsPointer'>&nbsp;";
	if (FilterModsExp.indexOf("SK") != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
	mytext+="<img onClick=\"setFilter('SK','modE')\" src='" + imgPath + "expansion_sha.gif' border='0' style='" + modCSS + " vertical-align: middle;' title='Sha&rsquo;Kahr' class='dsPointer'>&nbsp;";

	mytext+="<br><img src='" + imgPath + "pixel.gif' width='1' height='4'><br>";

	if (FilterModsCmp.indexOf("S") != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
	mytext+="[ <span onClick=\"setFilter('S','modC')\" class='helptextb dsPointer' style='" + modCSS + "' title='Simple'>S</span> ]&nbsp;";
	if (FilterModsCmp.indexOf("I") != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
	mytext+="[ <span onClick=\"setFilter('I','modC')\" class='helptextb dsPointer' style='" + modCSS + "' title='Intermediate'>I</span> ]&nbsp;";
	if (FilterModsCmp.indexOf("A") != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
	mytext+="[ <span onClick=\"setFilter('A','modC')\" class='helptextb dsPointer' style='" + modCSS + "' title='Advanced'>A</span> ]&nbsp;";
	if (FilterModsCmp.indexOf("E") != -1) { modCSS = "filter:alpha(opacity=25);opacity:.25;"; } else { modCSS = ""; }
	mytext+="[ <span onClick=\"setFilter('E','modC')\" class='helptextb dsPointer' style='" + modCSS + "' title='Elite'>E</span> ]&nbsp;";

	mytext+="<br><img src='" + imgPath + "pixel.gif' width='1' height='8'><br>[ <a href=\"javascript:hide('filter1holderDIV');\">Hide Filter</a> ]";
	
	layerWrite("filter1textDIV",mytext);
}

function setFilter(fId,fType) {
	if (fType == "crew") {
		if (FilterCrews.indexOf(fId) == -1) { FilterCrews[(FilterCrews.length)] = fId; }
		else { FilterCrews[(FilterCrews.indexOf(fId))] = null; }
	} else if (fType == "modE") {
		if (FilterModsExp.indexOf(fId) == -1) { FilterModsExp[(FilterModsExp.length)] = fId; }
		else { FilterModsExp[(FilterModsExp.indexOf(fId))] = null; }
	} else if (fType == "modC") {
		if (FilterModsCmp.indexOf(fId) == -1) { FilterModsCmp[(FilterModsCmp.length)] = fId; }
		else { FilterModsCmp[(FilterModsCmp.indexOf(fId))] = null; }
	} else if (fType == "unitE") {
		if (FilterUnitsExp.indexOf(fId) == -1) { FilterUnitsExp[(FilterUnitsExp.length)] = fId; }
		else { FilterUnitsExp[(FilterUnitsExp.indexOf(fId))] = null; }
	} else if (fType == "unitC") {
		if (FilterUnitsCmp.indexOf(fId) == -1) { FilterUnitsCmp[(FilterUnitsCmp.length)] = fId; }
		else { FilterUnitsCmp[(FilterUnitsCmp.indexOf(fId))] = null; }
	}
	
	applyFilter();
	drawFilter();
}

function toggleFilter(myToggle) {
	if (myToggle == "MF") { if (FilterOptions["MF"] == "only") {FilterOptions["MF"] = "has";} else {FilterOptions["MF"] = "only";} }
	else if (myToggle == "NMC") { if (FilterOptions["NMC"] == "show") {FilterOptions["NMC"] = "hide";} else {FilterOptions["NMC"] = "show";} }

	applyFilter();
	drawFilter();
}

function flipFilter() {
	if (document.getElementById("filter1holderDIV").style.visibility == "hidden") { document.getElementById("filter1holderDIV").style.visibility = "visible"; }
	else { document.getElementById("filter1holderDIV").style.visibility = "hidden"; }
}

function displayModInfo(myslot,e) { if (modassignment[myslot]!=-1) { showMod(modassignment[myslot],e); } }
function display(id) { document.getElementById(id).style.display = "block" }
function show(mydiv) { document.getElementById(mydiv).style.visibility = "visible"; }
function hide(mydiv) { document.getElementById(mydiv).style.visibility = "hidden"; }
function layerWrite(id,text) { document.getElementById(id).innerHTML = text }
function chgImg(imgField,newImg) { document[imgField].src = eval(newImg+'.src') }

function trim(str) {
	var	str = str.replace(/^\s\s*/, ''),
		ws = /\s/,
		i = str.length;
	while (ws.test(str.charAt(--i)));
	return str.slice(0, i + 1);
}

if(!Array.indexOf){
    Array.prototype.indexOf = function(obj){
	for(var i=0; i<this.length; i++){
	    if(this[i]==obj){
		return i;
	    }
	}
	return -1;
    }
}

if(!Array.lastIndexOf){
    Array.prototype.lastIndexOf = function(obj){
	for(var i=this.length-1; i>0; i--){
	    if(this[i]==obj){
		return i;
	    }
	}
	return -1;
    }
}

function addCommas(x1) {
	x1 = x1 + '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) { x1 = x1.replace(rgx, '$1' + ',' + '$2');}
	return x1;
}
