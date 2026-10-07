(function(){
'use strict';
function create(storage,valid){var available=true;
 function read(key,fallback,check){var raw;try{raw=storage.getItem(key);}catch(e){available=false;return {value:fallback,status:'unavailable'};}if(raw===null)return {value:fallback,status:'missing'};
 try{var value=JSON.parse(raw);if(!check(value))return {value:fallback,status:'invalid'};return {value:value,status:'ok'};}catch(e){return {value:fallback,status:'invalid'};}}
 function write(key,value){try{storage.setItem(key,JSON.stringify(value));return true;}catch(e){available=false;return false;}}
 function load(){var game=read('thirteenth-bell-save',null,valid),prefs=read('thirteenth-bell-settings',{},function(p){return !!p&&typeof p==='object'&&!Array.isArray(p);}),endings=read('thirteenth-bell-endings',[],function(a){return Array.isArray(a);}),legacy=false;
 try{legacy=!!storage.getItem('black-tide-castle-v1');}catch(e){available=false;}
 var p=prefs.value;return {game:game.value,gameStatus:game.status,preferences:{expanded:p.expanded===true,large:[0,1,2].indexOf(p.large)>=0?p.large:0,day:p.day===true},endings:endings.value.filter(function(id,i,a){return /^E0[1-5]$/.test(id)&&typeof id==='string'&&a.indexOf(id)===i;}),legacy:legacy,available:available};}
 return {load:load,save:function(s){return valid(s)&&write('thirteenth-bell-save',s);},saveSettings:function(p){return write('thirteenth-bell-settings',p);},saveEndings:function(e){return write('thirteenth-bell-endings',e);},available:function(){return available;}};
}
window.CastleStorage={create:create};
})();
