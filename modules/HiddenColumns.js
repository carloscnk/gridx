define([
	"dojo/_base/declare",
	"dojo/_base/Deferred",
	"dojo/_base/array",
	"dojo/query",
	"../core/_Module"
], function(declare, Deferred, array, query, _Module){

/*=====
	return declare(_Module, {
		// summary:
		//		Hide columns.
		// description:
		//		Hide columns and change the column array at the same time so that other grid features 
		//		are not affected by hidden columns. That means, hidden columns can no longer be accessed 
		//		through grid.columns() function.

		// init: String[]
		//		IDs of columns to be hidden when grid is initially created.
		init: [],

		add: function(colId){
			// summary:
			//		Hide all the given columns in arguments.
			// colId: String|gridx.core.Column...
			//		Column IDs can be provided directly as arguments.
			//		gridx.core.Column object can also be provided.
			// example:
			//	|	//Hide columnA
			//	|	grid.hiddenColumns.add("columnA");
			//	|	//Hide columnB, columnC and columnD
			//	|	grid.hiddenColumns.add("columnB", "columnC", "columnD");
			//	|	//Column object is also acceptable.
			//	|	var col = grid.column("columnA");
			//	|	grid.hiddenColumns.add(col);
		},

		remove: function(colId){
			// summary:
			//		Show all the given columns in arguments.
			// colId: String|gridx.core.Column...
			//		Column IDs can be provided directly as arguments.
			//		gridx.core.Column object can also be provided.
			// example:
			//	|	//show columnA
			//	|	grid.hiddenColumns.remove("columnA");
			//	|	//show columnB, columnC and columnD
			//	|	grid.hiddenColumns.remove("columnB", "columnC", "columnD");
			//	|	//Column object is also acceptable.
			//	|	var col = { id: "columnA", ...};	//Can also be a column object retreived before it is hidden.
			//	|	grid.hiddenColumns.remove(col);
		},

		clear: function(){
			// summary:
			//		Show all hidden columns.
		},

		get: function(){
			// summary:
			//		Get an array of current hidden column IDs.
			// returns:
			//		An array of current hidden column IDs.
		}
	});
=====*/

	return declare(_Module, {
		name: 'hiddenColumns',

		getAPIPath: function(){
			return {
				hiddenColumns: this
			};
		},

		constructor: function(){
			this._cols = array.map(this.grid._columns, function(col){
				return col;
			});
		},

		load: function(args, startup){
			var t = this,
				g = t.grid,
				ids = t.arg('init', []);
			if(g.move && g.move.column){
				t.connect(g.move.column, 'onMoved', '_syncOrder');
			}
			if(g.persist){
				ids.concat(g.persist.registerAndLoad('hiddenColumns', function(){
					return t.get();
				}) || []);
			}
			if(ids.length){
				startup.then(function(){
					t.add.apply(t, ids);
					t.loaded.callback();
				});
			}else{
				t.loaded.callback();
			}
		},

		add: function(){
			var t = this,
				g = t.grid,
				columnsById = g._columnsById,
				changed,
				columns = g._columns;
			array.forEach(arguments, function(id){
				id = id && typeof id == "object" ? id.id: id;
				var col = columnsById[id];
				if(col){
					changed = 1;
					col.hidden = true;
					delete columnsById[id];
					columns.splice(array.indexOf(columns, col), 1);
					//Directly remove dom nodes instead of refreshing the whole body to make it faster.
					query('[colid="' + g._escapeId(id) + '"].gridxCell', g.domNode).forEach(function(node){
						node.parentNode.removeChild(node);
					});
				}
			});
			if(changed){
				array.forEach(columns, function(col, i){
					col.index = i;
				});
			}
			g.columnWidth._adaptWidth();
			query('.gridxCell', g.bodyNode).forEach(function(node){
				node.style.width = columnsById[node.getAttribute('colid')].width;
			});
			//FIXME: this seems ugly....
			if(g.vScroller._doVirtualScroll){
				g.body.onForcedScroll();
			}
			return t._refresh(0);
		},

		remove: function(){
			var t = this,
				columns = t.grid._columns,
				changed;
			array.forEach(arguments, function(id){
				id = id && typeof id == "object" ? id.id: id;
				var c,
					index = -1,
					i = 0,
					len = t._cols.length;
				for(; i < len; ++i){
					c = t._cols[i];
					if(c.id == id && c.hidden){
						delete c.hidden;
						c.index = ++index;
						break;
					}else if(!c.hidden){
						index = c.index;
					}
				}
				if(i < len){
					changed = 1;
					t.grid._columnsById[id] = c;
					columns.splice(index, 0, c);
					for(i = index + 1; i < columns.length; ++i){
						columns[i].index = i;
					}
				}
			});
			return t._refresh(changed);
		},

		clear: function(){
			var g = this.grid,
				changed;
			g._columns = array.map(this._cols, function(col, i){
				col.index = i;
				if(col.hidden){
					changed = 1;
					delete col.hidden;
					g._columnsById[col.id] = col;
				}
				return col;
			});
			return this._refresh(changed);
		},

		get: function(){
			var t = this,
				res = [],
				cols = t._cols,
				i = 0;
			for(; i < cols.length; ++i){
				if(cols[i].hidden){
					res.push(cols[i].id);
				}
			}
			return res;
		},

		_syncOrder: function(){
			var t = this,
				cols = t._cols,
				columns = t.grid._columns,
				i = 0,
				j = 0,
				c, k;
			//Sort the cached columns to have the same order as g._columns.
			for(; i < columns.length && j < cols.length; ++i, ++j){
				//j must not overflow here because t._cols and g._columns are synced up.
				for(c = cols[j]; c.hidden; c = cols[j]){
					++j;
				}
				if(columns[i] != c){
					k = array.indexOf(cols, columns[i]);
					cols[j] = cols[k];
					cols[k] = c;
				}
			}
		},

		_refresh: function(changed){
			if(changed){
				var g = this.grid;
				g.header.refresh();
				g.columnWidth._adaptWidth();
				return g.body.refresh();
			}else{
				var d = new Deferred();
				d.callback();
				return d;
			}
		}
	});
});
