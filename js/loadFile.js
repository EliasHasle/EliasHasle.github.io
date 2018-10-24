//@EliasHasle

function loadFile(url, callback, responseType="") {
	var request = new XMLHttpRequest();
	request.responseType = responseType;
	request.open( 'GET', url, true );
	request.addEventListener("load", function(event) {
		var response = event.target.response;
		callback(response);
	});
	request.send(null);
}