(function(){
'use strict';
var D=window.GAME_DATA,people=['xu','shen','tang'],own=Object.prototype.hasOwnProperty;
function object(v){return !!v&&typeof v==='object'&&!Array.isArray(v);}
function member(v,list){return list.indexOf(v)>=0;}
function uniqueSet(v,allowed){return Array.isArray(v)&&v.every(function(x,i){return member(x,allowed)&&v.indexOf(x)===i;});}
function core(s,pageCount){
 if(!object(s)||s.version!==D.version||!object(s.step)||!own.call(D.nodes,s.step.node)||!Number.isInteger(s.step.page)||s.step.page<0)return false;
 if(!member(s.role,[null,'reporter','doctor','heir'])||s.role===null&&!member(s.step.node,['N01','N02']))return false;
 var specialized={N11:'reporter',N12:'doctor',N13:'heir'};if(specialized[s.step.node]&&s.role!==specialized[s.step.node])return false;
 if(!Number.isInteger(s.budget)||s.budget<0||s.budget>3||!uniqueSet(s.visited,['service','archive','role','social'])||s.visited.length>3||!uniqueSet(s.clues,D.clues.map(function(c){return c.id;})))return false;
 if(!object(s.life)||people.some(function(k){return !member(s.life[k],['alive','dead','sacrificed'])||!Number.isInteger(s[k])||s[k]<0||s[k]>2;}))return false;
 if(!member(s.phase,['arrival','explore','midnight','finale','ended'])||typeof s.clip!=='boolean'||typeof s.code!=='boolean'||!member(s.gate,['closed','tool','sacrifice'])||!member(s.action,[null,'release','burn','escape'])||!member(s.ending_reason,[null,'door','room','red','deal']))return false;
 if(s.phase!=={1:'arrival',2:'explore',3:'midnight',4:'finale',5:'ended'}[D.nodes[s.step.node].chapter]||s.budget!==3-s.visited.length)return false;
 if(typeof s.run_id!=='string'||!s.run_id||s.run_id.length>128||!(s.feedback===null||typeof s.feedback==='string'))return false;
 var ended=s.step.node.charAt(0)==='E';if(ended?(s.phase!=='ended'||s.ending!==s.step.node):(s.phase==='ended'||s.ending!==null))return false;
 if(!Array.isArray(s.history)||s.history.length>200||!Array.isArray(s.committed)||s.committed.length!==s.history.length)return false;
 var seen={};if(s.history.some(function(h,i){if(!object(h)||!own.call(D.nodes,h.node)||!own.call(D.nodes,h.next))return true;var choice=D.nodes[h.node].choices.filter(function(c){return c.id===h.choice;})[0],event='EV_'+h.choice;if(!choice||s.committed[i]!==event||seen[event])return true;seen[event]=true;return false;}))return false;
 return s.step.page<pageCount(s);
}
function validate(s,pageCount){try{
 if(!core(s,pageCount)||!object(s.checkpoints))return false;
 return Object.keys(s.checkpoints).every(function(key){var snap=s.checkpoints[key];if(!member(key,['chapter2','gate','danger'])||!core(snap,pageCount)||own.call(snap,'checkpoints')||snap.run_id!==s.run_id||snap.history.length>s.history.length)return false;
 if(key==='chapter2'&&snap.step.node!=='N08'||key==='gate'&&snap.step.node!=='N28')return false;
 return snap.history.every(function(h,i){return JSON.stringify(h)===JSON.stringify(s.history[i]);});
 });
 }catch(e){return false;}}
window.CastleState={validate:validate};
})();
