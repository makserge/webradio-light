var itemsData = { };
var itemsCurrent = 1;
var host = "http://" + window.location.hostname + "/cgi-bin/webradio/";
var isManageMode;
var encoding = "en";

$(document).ready(function() {
	$("#show_manage_streams_button").click(function() {
		$("#show_manage_streams_button").hide();
		$("#add_stream_block").show();
		$(".network_label_selected").css("width", "390px");
		$(".network_label").css("width", "390px");
		$(".manage").show();
	});
	$("#cancel_add_stream_button").click(function() {
		$("#stream_title").val("");
		$("#stream_url").val("");
		$("#add_stream_block").hide();
		$("#show_manage_streams_button").show();
		$(".network_label_selected").css("width", "505px");
		$(".manage").hide();
	});
	$("#add_stream_button").click(function() {
		addStream();
	});
	loadItemsList("network");
				
});

function loadItemsList(mode) {
	var url = host + "items.cgi?action=" + mode;

	var action = "curnetwork";
			
	var url2 = host + "items.cgi?action=" + action;
	
	$.get(url, function(items) {
		$.get(url2, function(current) {
			itemsData = parseItemsData(items.trim());
			
			updateItemsList(mode, current.trim(), false, true, true);
			playCurrentItem();
			loadStatus();
		});	
	});
}

function playCurrentItem() {
	playItem("network", itemsCurrent);
}

function updateItemsList(mode, currentItem, subtitle, sort, remove) {
	var contentElement = $("#" + mode + "_list");
	contentElement.empty();

	var items = itemsData;
	
	if (items && items.length > 0) {
		var itemsCount = items.length;
		itemsCurrent = currentItem;
		
		var id;
		var selected;
		var sortContent = "";
		var removeContent = "";
		var subTitleContent = "";
		var content;
		var title;
		for (item in items) {
			title = items[item].title;
			id = parseInt(item) + 1;
			selected = (id == currentItem);
			if (subtitle) {
				subTitleContent = '<span class="' + mode + '_sublabel">' + items[item].value + '</span>';
			}
			if (sort) {
				sortContent = ((id == itemsCount) ? '<img class="img manage" src="img/transparent.png">' : '<img class="img manage" src="img/down.png" onClick="moveItem(\'' + mode + '\', ' + subtitle + ', ' + sort + ', ' + remove + ', ' + id + ',\'down\')">') + ((id == 1) ? '<img class="img manage" src="img/transparent.png">' : '<img class="img manage" src="img/up.png" onClick="moveItem(\'' + mode + '\', ' + subtitle + ', ' + sort + ', ' + remove + ', ' + id + ',\'up\')">' );
			}
			if (remove) {
				removeContent = ((itemsCount == 1) ? '' : '<img class="img manage" src="img/remove.png" onClick="removeItem(\'' + mode + '\', ' + subtitle + ', ' + sort + ', ' + remove + ', ' + id + ')">');
			}
			content = '<div class="list_item"><div class="' + mode + '_label' + (selected ? "_selected" : "") + '" id="' + mode + '_label' + id + '"><a class="' + mode + '_label_link' + (selected ? "_selected" : "") + '" href="javascript:void(0)" id="' + mode + '_label_link' + id + '" onClick="playItem(\'' + mode + '\', ' + id + ')">' + title + '</a></div>' + subTitleContent + sortContent + removeContent + '<p class="clear" /></div>';
			contentElement.append(content);
		}
		contentElement.append('<p class="clear" />');
	}
	else {
		contentElement.append('No items');
	}
}

function playItem(mode, id) {
	setSelectedRow(mode, id);
	
	sendPlayItem(id);
}

function setSelectedRow(mode, id) {
	$("." + mode + "_label_selected").attr("class", mode + "_label");
	$("." + mode + "_label_link_selected").attr("class", mode + "_label_link");
	
	var el = $("#" + mode + "_label" + id);
	el.attr("class", mode + "_label_selected");
	el.css("width", ($("#add_stream_block").is(":visible")) ? "390px" : "505px");
	$("#" + mode + "_label_link" + id).attr("class", mode + "_label_link_selected");
	$("." + mode + "_label").css("width", ($("#add_stream_block").is(":visible")) ? "390px" : "505px");
}

function removeItem(mode, subtitle, sort, remove, id) {
	itemsData[id - 1] = null;

	var tempList = [];
	var i = 0;
	for (item in itemsData) {
		if (itemsData[item]) {
			tempList[i] = itemsData[item];
			i++;
		}
	}
	itemsData = tempList;
	
	updateItemsList(mode, 1, subtitle, sort, remove);
	
	$(".network_label_selected").css("width", "390px");
	$(".manage").show();

	sendItemsUpdate(mode, id, "remove");
}

function moveItem(mode, subtitle, sort, remove, id, dir) {
	var tempList = [];
	var i = 1;
	for (var j = 0; j < itemsData.length; j++) {
		tempList[i] = itemsData[j];
		i += 2;
	}
	var oldPosition = (id - 1) * 2 + 1;
	var newPosition = (dir == "down") ? (id - 1) * 2 + 4 : (id - 2) * 2;
	tempList[oldPosition] = null;
	tempList[newPosition] = itemsData[id - 1];
	
	itemsData = [];
	i = 0;
	for (item in tempList) {
		if (tempList[item]) {
			itemsData[i] = tempList[item];
			i++;
		}	
	}
	
	updateItemsList(mode, 1, subtitle, sort, remove);

	$(".network_label_selected").css("width", "390px");
	$(".manage").show();

	sendItemsUpdate(mode, id, "move");
}

function addStream() {
	var title = $("#stream_title").val();
	var value = $("#stream_url").val();
	title = title.replace('"', '');
	value = value.replace('"', '');
	if (title == "") {
		alert("Invalid title");
		$("#stream_title").focus();
		return;
	}
	if (checkTitle(title)) {
		alert("Item already exists");
		$("#stream_title").focus();
		return;
	}
	if (value == "" || checkURL(value)) {
		alert("Invalid URL");
		$("#stream_url").focus();
		return;
	}
	$("#stream_title").val("");
	$("#stream_url").val("");
	if (!itemsData) {
		itemsData = [ { "title": title, "value": value } ];
	}
	else {
		itemsData[itemsData.length] = { "title": title, "value": value };
	}	
	
	updateItemsList("network", 1, false, true, true);

	$(".network_label_selected").css("width", "390px");
	$(".manage").show();

	var rforeign = /[^\u0000-\u007f]/;
	encoding = (rforeign.test(title)) ? "ru" : "en";
	sendItemsUpdate("network", itemsData.length, "add");
}

function checkTitle(title) {
	if (!itemsData) {
		return false;
	}
	for (item in itemsData) {
		if (itemsData[item].title == title) {
			return true;
		}
	}
	return false;
}

function checkURL(value) {
	return !(value.substr(0, 7) == "http://" || value.substr(0, 8) == "https://");
}

function sendItemsUpdate(mode, id, action) {
	var url = host + "update.cgi";
	$.post(url, {
				'mode': mode,
				'id': id,
				'action': action,
				'encoding': encoding,
				'current': 1,
				'data': prepareItemsData(itemsData)				
				} );
}

function parseItemsData(items) {
	var output = [];
	var id;
	var item = [];
	var arr = items.split(';');
	if (arr.length > 0) {
		for (id in arr) {
			if (arr[id].length > 1) {
				item = arr[id].split('|');
				output[output.length] = { "title": item[0], "value": item[1] };
			}	
		}
	}
	return output;
}

function prepareItemsData(data) {
	var output = "";
	for (id in data) {
		output += data[id].title + "|" + data[id].value + ";";
	}
	return output;
}

function sendPlayItem(current) {
	if (!current) {
		return;
	}
	isItemChanged = true;
	
	var url = host + "update.cgi"
	var mode = "playnetwork";
	itemsCurrent = current;

	$.post(url, {
			'mode' : mode,
			'id': current
			},
			function(data) {
				setTimeout('isItemChanged = false', 2000);
			}
		   ).error(function() { 
				isItemChanged = false; 
		    });	 
}

function playItemByDirection(direction) {
	var total = itemsData.length;
	if (direction == 'next') {
		itemsCurrent++;
	}
	else {
		itemsCurrent--;
	}
	if (itemsCurrent > total) {
		itemsCurrent = 1;
	}
	else if (itemsCurrent < 1) {
		itemsCurrent = total;
	}
	playCurrentItem();
}

function loadStatus() {
	var action = "statusnetwork";
	
	var url = host + "items.cgi?action=" + action;
	$.get(url, function(data) {
		if (!isItemChanged) {
			var arr = data.split(' ');
			var currentNetItem = parseInt(arr[0]);
			if (itemsCurrent != currentNetItem) {
				itemsCurrent = currentNetItem;
				setSelectedRow("network", currentNetItem);
				currentNetTitle = "n/a";
			}
			var currentNetTitle = decodeURI(arr[1].trim());
			if (currentNetTitle == "") {
				currentNetTitle = "n/a";
			}
			if ($("#network_track_title").html() != "Track: " + currentNetTitle) {
				$("#network_track_title").html("Track: " + currentNetTitle);
			}
		}	
		
	});
	setTimeout(loadStatus, 1000);
}