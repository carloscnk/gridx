define([], function(){
	var seed = 9973;

	var randomNumber = function(range){
		var a = 8887;
		var c = 9643;
		var m = 8677;
		seed = (a * seed + c) % m;
		var res = Math.floor(seed / m * range);
		return res;
	};

	var chars = "0,1,2,3, ,4,5,6,7, ,8,9,a,b, ,c,d,e,f, ,g,h,i,j, ,k,l,m,n, ,k,o,p,q, ,r,s,t,u, ,v,w,x,y, ,z".split(',');
	var randomString = function(){
		var len = randomNumber(50), i, str = [];
		for(i = 0; i < len; ++i){
			str.push(chars[randomNumber(chars.length)]);
		}
		return str.join('');
	};

	var randomDate = function(){
		return new Date(randomNumber(10000000000000));
	};

	var generateItem = function(parentId, index){
		return {
			id: parentId + "-" + (index + 1),
			number: randomNumber(10000),
			string: randomString(),
			date: randomDate().toDateString(),
			time: randomDate().toTimeString().split(' ')[0],
			bool: randomNumber(10) < 5
		};
	};

	var generateLevel = function(parentId, level, maxLevel, maxChildrenCount){
		var i, item, res = [];
		var childrenCount = randomNumber(maxChildrenCount);
		for(i = 0; i < childrenCount; ++i){
			item = generateItem(parentId, i);
			res.push(item);
			if(level < maxLevel){
				item.children = generateLevel(item.id, level + 1, maxLevel, maxChildrenCount);
			}
		}
		return res;
	};

	return {
		getData: function(maxLevel, maxChildrenCount){
			return {
				identifier: 'id', 
				label: 'id', 
				items: generateLevel('item', 1, maxLevel, maxChildrenCount)
			};
		},
		
		layouts: [
			[
				{id: 'id', name: 'id', field: 'id', expandField: 'children'},
				{id: 'number', name: 'number', field: 'number'},
				{id: 'string', name: 'string', field: 'string'},
				{id: 'date', name: 'date', field: 'date'},
				{id: 'time', name: 'time', field: 'time'},
				{id: 'bool', name: 'bool', field: 'bool'}
			]
		]
	};
});
