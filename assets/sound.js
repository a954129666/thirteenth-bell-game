(function(){
'use strict';
var ctx=null,master=null,noise=null,enabled=false,unavailable=false,volume=0.4,profile='sea',ambient=[],effects=[],timer=null,lastFx={},musicTimer=null,cueTimer=null,tension=0,musicNodes=[],musicEnabled=true,musicGain=null,phraseIndex=0,status='点击启程或开启声音',autoStart=true;
try{musicEnabled=localStorage.getItem('castle-music-muted')!=='yes';autoStart=localStorage.getItem('castle-audio-muted')!=='yes';var saved=localStorage.getItem('castle-audio-volume');if(saved!==null&&isFinite(Number(saved)))volume=Math.max(0,Math.min(1,Number(saved)));}catch(e){}
function dispose(list){list.forEach(function(n){try{if(n.stop)n.stop();n.disconnect();}catch(e){}});list.length=0;}
function stopMusic(){if(musicTimer){clearInterval(musicTimer);musicTimer=null;}dispose(musicNodes);}
function stopAmbient(){if(cueTimer){clearTimeout(cueTimer);cueTimer=null;}stopMusic();if(timer){clearInterval(timer);timer=null;}dispose(ambient);}
function stopAll(){stopAmbient();dispose(effects);}
function gain(value){var g=ctx.createGain();g.gain.value=value;return g;}
function init(){if(ctx)return true;var C=window.AudioContext||window.webkitAudioContext;if(!C){unavailable=true;status='当前环境不支持音效';return false;}try{ctx=new C();master=gain(0);var limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-18;limiter.knee.value=12;limiter.ratio.value=8;master.connect(limiter);limiter.connect(ctx.destination);musicGain=gain(0.65);musicGain.connect(master);noise=ctx.createBuffer(1,44100,22050);var a=noise.getChannelData(0),prev=0;for(var i=0;i<a.length;i++){prev=(prev+Math.random()*0.18-0.09)*0.98;var edge=Math.min(1,i/500,(a.length-1-i)/500);a[i]=prev*edge;}unavailable=false;return true;}catch(e){var failed=ctx;ctx=null;master=null;musicGain=null;noise=null;if(failed&&failed.close){try{Promise.resolve(failed.close()).catch(function(){});}catch(ignore){}}unavailable=true;status='当前环境无法启动音效';return false;}}
function setMaster(){if(!ctx||!master)return;var now=ctx.currentTime;master.gain.cancelScheduledValues(now);master.gain.setTargetAtTime(enabled?volume*0.7:0,now,0.08);}
function tone(freq,amplitude,duration,delay,type){var o=ctx.createOscillator(),g=gain(0),t=ctx.currentTime+(delay||0);o.type=type||'sine';o.frequency.value=freq;o.connect(g);g.connect(master);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(amplitude,t+0.014);g.gain.exponentialRampToValueAtTime(0.0001,t+duration);o.start(t);o.stop(t+duration+0.03);effects.push(o,g);o.onended=function(){o.disconnect();g.disconnect();effects=effects.filter(function(n){return n!==o&&n!==g;});};}
function burst(seconds,amplitude,frequency,delay){var src=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=gain(0),t=ctx.currentTime+(delay||0);src.buffer=noise;f.type='bandpass';f.frequency.value=frequency;f.Q.value=0.6;src.connect(f);f.connect(g);g.connect(master);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(amplitude,t+0.012);g.gain.exponentialRampToValueAtTime(0.0001,t+seconds);src.start(t);src.stop(t+seconds+0.03);effects.push(src,f,g);src.onended=function(){[src,f,g].forEach(function(n){n.disconnect();});effects=effects.filter(function(n){return n!==src&&n!==f&&n!==g;});};}
function bed(freq,level,rate,depth){var src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=gain(level),lfo=ctx.createOscillator(),mod=gain(depth);src.buffer=noise;src.loop=true;filter.type='lowpass';filter.frequency.value=freq;src.connect(filter);filter.connect(g);g.connect(master);lfo.frequency.value=rate;lfo.connect(mod);mod.connect(g.gain);src.start();lfo.start();ambient.push(src,filter,g,lfo,mod);}
function drone(freq,level){var o=ctx.createOscillator(),g=gain(level);o.frequency.value=freq;o.connect(g);g.connect(master);o.start();ambient.push(o,g);}
function tick(){tone(900,0.025,0.07,0,'triangle');burst(0.09,0.08,1100,0.45);}
var scores={
 sea:{name:'黑潮来信',notes:[146.83,174.61,220,155.56],bass:73.42,period:9000},
 arrival:{name:'孤岛降落',notes:[110,130.81,164.81,116.54],bass:55,period:8600},
 hall:{name:'门厅的第七声脚步',notes:[130.81,155.56,196,138.59],bass:65.41,period:8700},
 dining:{name:'空席晚宴',notes:[164.81,196,246.94,174.61],bass:82.41,period:9200},
 study:{name:'刮去的名字',notes:[146.83,174.61,207.65,155.56],bass:73.42,period:10000},
 clinic:{name:'错误的死亡证明',notes:[123.47,146.83,174.61,130.81],bass:61.74,period:9800},
 archive:{name:'缺页',notes:[138.59,164.81,207.65,146.83],bass:69.3,period:10500},
 control:{name:'第七个频道',notes:[110,138.59,164.81,116.54],bass:55,period:8100},
 mirror:{name:'倒影先行',notes:[155.56,185,220,164.81],bass:77.78,period:9300},
 west:{name:'被删去的规则',notes:[103.83,123.47,146.83,110],bass:51.92,period:7800},
 dock:{name:'沉船回声',notes:[116.54,138.59,174.61,123.47],bass:58.27,period:10400},
 tower:{name:'钟摆缺拍',notes:[146.83,196,233.08,155.56],bass:73.42,period:8400},
 failure:{name:'下一批来客',notes:[98,116.54,130.81,103.83],bass:49,period:8000},
 dawn:{name:'完整的名单',notes:[174.61,220,261.63,349.23],bass:87.31,period:10000}
};
function musicNote(freq,level,duration,delay,type){var o=ctx.createOscillator(),g=gain(0),t=ctx.currentTime+delay;o.type=type||'sine';o.frequency.value=freq;o.connect(g);g.connect(musicGain);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(level,t+0.35);g.gain.exponentialRampToValueAtTime(0.0001,t+duration);o.start(t);o.stop(t+duration+0.05);musicNodes.push(o,g);o.onended=function(){o.disconnect();g.disconnect();musicNodes=musicNodes.filter(function(n){return n!==o&&n!==g;});};}
function phrase(){if(!enabled||!musicEnabled||!ctx||document.hidden||ctx.state!=='running')return;var q=scores[profile]||scores.sea,reverse=phraseIndex++%2;musicNote(q.bass,0.036,7,0);if(tension>=2)musicNote(q.bass*1.05946,0.009,5.5,0.3);musicNote(q.bass*2.003,0.018,6.5,0.3);q.notes.forEach(function(n,i){musicNote(n,0.024,3.1,(reverse?3-i:i)*1.4,'triangle');musicNote(n*2,0.008,2.8,i*1.4+0.12);});}
function beginMusic(){if(!musicEnabled)return;phraseIndex=0;phrase();musicTimer=setInterval(phrase,(scores[profile]||scores.sea).period);}
function begin(){stopAmbient();if(!enabled||!ctx||document.hidden||ctx.state!=='running')return;
if(profile==='sea'||profile==='arrival'||profile==='dawn'){bed(680,0.27,0.12,0.17);bed(1500,0.035,0.19,0.02);}
else if(profile==='dock'){bed(460,0.19,0.13,0.1);timer=setInterval(function(){burst(0.17,0.12,2200);tone(1100,0.025,0.5);},3400);}
else if(profile==='control'||profile==='radio'){bed(2400,0.055,0.17,0.01);drone(60,0.018);timer=setInterval(function(){tone(690,0.024,0.09);},4800);}
else if(profile==='tower'||profile==='hall'||profile==='clock'){bed(350,0.10,0.08,0.05);timer=setInterval(tick,1200);}
else if(profile==='dining'||profile==='study'||profile==='fire'){bed(1900,0.09,0.4,0.03);timer=setInterval(function(){burst(0.08,0.13,1800);},2200);}
else if(profile==='west'||profile==='mirror'||profile==='failure'){bed(440,0.11,0.09,0.05);drone(52,0.014);drone(55.5,0.008);}
else{bed(520,0.055,0.11,0.025);drone(62,0.008);}beginMusic();}
function toggleMusic(){musicEnabled=!musicEnabled;try{localStorage.setItem('castle-music-muted',musicEnabled?'no':'yes');}catch(e){}if(!musicEnabled)stopMusic();else if(enabled&&ctx&&ctx.state==='running'&&!document.hidden)beginMusic();notify();}
function notify(){window.dispatchEvent(new Event('castle-audio-status'));}
function unlock(){if(!init()){notify();return Promise.resolve(false);}enabled=true;status='声音已开启';setMaster();var result;try{result=ctx.resume();}catch(e){result=Promise.reject(e);}return Promise.resolve(result).then(function(){if(ctx.state!=='running'){enabled=false;status='点击声音按钮重试';setMaster();notify();return false;}begin();notify();return true;}).catch(function(){enabled=false;status='声音被拦截，点击重试';setMaster();notify();return false;});}
function toggle(){try{localStorage.setItem('castle-audio-muted',enabled?'yes':'no');}catch(e){}autoStart=!enabled;if(enabled){enabled=false;status='已静音';stopAll();setMaster();notify();return Promise.resolve(false);}return unlock();}
function scene(key){if(key===profile)return;stopAll();profile=key;if(enabled)begin();notify();}
function fx(key){if(!enabled||!ctx||ctx.state!=='running'||document.hidden)return;var now=Date.now();if(lastFx[key]&&now-lastFx[key]<90)return;lastFx[key]=now;try{if(key==='pendulum'){stopAmbient();dispose(effects);var cueProfile=profile;cueTimer=setTimeout(function(){cueTimer=null;if(enabled&&profile===cueProfile&&!document.hidden)begin();},7200);for(var p=0;p<6;p++){tone(p%2?680:880,0.08,0.14,p*0.8,'triangle');burst(0.10,0.22,700,p*0.8);}tone(146.83,0.025,1.0,6.4);}else if(key==='key'){[1800,2400,3100].forEach(function(f,i){tone(f,0.06,0.45,i*0.12);});}else if(key==='glass'){[1120,2240,3380].forEach(function(f,i){tone(f,0.075/(i+1),1.5);});}else if(key==='heartbeat'){for(var h=0;h<3;h++){tone(58,0.11,0.19,h*0.85);tone(72,0.07,0.13,h*0.85+0.2);}}else if(key==='drawer'){burst(0.75,0.32,530);tone(124,0.08,0.8,0,'triangle');}else if(key==='mirror'){tone(880,0.035,2.5);tone(887,0.035,2.5);burst(0.45,0.14,3000);}else if(key==='water'){for(var w=0;w<3;w++){burst(0.24,0.22,1500,w*0.6);tone(850+w*130,0.045,0.5,w*0.6);}}else if(key==='arrival-warning'){burst(0.14,0.26,280);burst(0.14,0.24,300,0.36);tone(65.41,0.085,2.8);tone(69.3,0.05,2.8);tone(1800,0.025,0.5,0.7);}else if(key==='bell'){for(var i=0;i<3;i++){[220,442,594,882].forEach(function(f,k){tone(f,0.09/(k+1),2.4,i*1.0);});}}else if(key==='rotor'){bed(130,0.22,14,0.16);tone(72,0.05,3.8,0,'triangle');setTimeout(function(){if(profile==='arrival'&&enabled&&!document.hidden)begin();},4300);}else if(key==='door'){burst(0.6,0.3,400);tone(115,0.055,0.6,0,'triangle');}else if(key==='paper'){burst(0.24,0.28,2600);burst(0.16,0.14,3800,0.1);}else if(key==='evidence'){tone(440,0.055,0.7);tone(660,0.035,0.85,0.12);}else if(key==='warning'){tone(92,0.12,1.2);tone(98,0.08,1.2);burst(0.32,0.19,500);}else if(key==='success'){[261.63,329.63,392,523.25].forEach(function(f,i){tone(f,0.06,1.9,i*0.18);});}else if(key==='failure'){tone(58,0.09,2.4);tone(62,0.06,2.4);burst(0.4,0.3,300);}else if(key==='step'){burst(0.14,0.18,320);burst(0.14,0.15,280,0.3);}else if(key==='radio'){burst(0.6,0.2,2100);tone(680,0.04,0.12,0.2);}else{tone(610,0.025,0.08);}}catch(e){status='音效暂不可用';enabled=false;stopAll();setMaster();notify();}}
function setTension(value){tension=Math.max(0,Math.min(3,Number(value)||0));}
function setVolume(value){volume=Math.max(0,Math.min(1,Number(value)||0));setMaster();try{localStorage.setItem('castle-audio-volume',String(volume));}catch(e){}}
function pauseAudio(){stopAll();if(ctx&&ctx.suspend){try{Promise.resolve(ctx.suspend()).catch(function(){});}catch(e){}}}
function resumeAudio(){if(!enabled||!ctx||document.hidden)return;try{Promise.resolve(ctx.resume()).then(begin).catch(function(){enabled=false;status='点击声音按钮恢复';notify();});}catch(e){enabled=false;status='点击声音按钮恢复';notify();}}
document.addEventListener('visibilitychange',function(){if(document.hidden)pauseAudio();else resumeAudio();});
if(window.addEventListener){window.addEventListener('pagehide',pauseAudio);window.addEventListener('pageshow',resumeAudio);}
window.CastleSound={unlock:unlock,toggle:toggle,toggleMusic:toggleMusic,scene:scene,fx:fx,setTension:setTension,setVolume:setVolume,getStatus:function(){return {enabled:enabled,musicEnabled:musicEnabled,track:(scores[profile]||scores.sea).name,unavailable:unavailable,volume:volume,autoStart:autoStart,text:status,profile:profile};}};
})();
