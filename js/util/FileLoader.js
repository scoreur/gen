var openFor = openFor || (function(validator){
	var handlers = {};
	var opener = null;
	var delegate = document.createElement('input');
	var validator = validator || function(){return true;};
	delegate.type = 'file';
	delegate.multiple = true;
	delegate.className = 'hidden';
	delegate.addEventListener('change', function(evt){
		if(validator(evt)){
			(handlers[opener]||function(){})(evt);
		}
		// allow choosing the same file
		setTimeout(50,function(){evt.target.value='';});
	});
	
	function openFor(id,callback){
		if(!(id in handlers)){
			var el = document.getElementById(id);
			el && el.addEventListener('click', function(evt){
				console.log(id);
			    opener = id;
			    delegate.click();
		    }); 

		}

		handlers[id] = callback || function(){};
	}
	return openFor;

})();