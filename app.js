(() => {
  const $ = id => document.getElementById(id);
  const ui = {
    statusCard:$('statusCard'),statusText:$('statusText'),statusSubtext:$('statusSubtext'),
    roll:$('rollValue'),pitch:$('pitchValue'),rollMeter:$('rollMeter'),pitchMeter:$('pitchMeter'),
    rollDirection:$('rollDirection'),pitchDirection:$('pitchDirection'),start:$('startButton'),
    calibrate:$('calibrateButton'),tolerance:$('tolerance'),toleranceLabel:$('toleranceLabel'),
    message:$('message'),sensor:$('sensorState'),sound:$('soundToggle'),haptics:$('hapticsToggle')
  };
  let running=false, calibrated=false, zeroRoll=0, zeroPitch=0, roll=0, pitch=0, smoothRoll=0, smoothPitch=0;
  let stableSince=0, isLevel=false, beepTimer=null, audioContext=null, wakeLock=null, lastBeep=0;
  const tolerance=()=>Number(ui.tolerance.value);
  const fmt=n=>(n>=0?'+':'')+n.toFixed(1);
  function message(s){ui.message.textContent=s}
  function updateMeter(el,value){const max=5,half=Math.min(Math.abs(value)/max*50,50);el.style.width=half+'%';el.style.left=(value<0?50-half:50)+'%';el.style.background=Math.abs(value)<=tolerance()?'var(--green)':'var(--red)'}
  function render(){
    ui.roll.textContent=fmt(roll);ui.pitch.textContent=fmt(pitch);
    updateMeter(ui.rollMeter,roll);updateMeter(ui.pitchMeter,pitch);
    ui.rollDirection.textContent=Math.abs(roll)<=tolerance()?'Within tolerance':(roll>0?'Right side down':'Left side down');
    ui.pitchDirection.textContent=Math.abs(pitch)<=tolerance()?'Within tolerance':(pitch>0?'Front down':'Rear down');
    ui.toleranceLabel.textContent='±'+tolerance().toFixed(1)+'°';
  }
  function tone(freq=880,duration=.12){
    if(!ui.sound.checked)return;
    try{audioContext ||= new (window.AudioContext||window.webkitAudioContext)();if(audioContext.state==='suspended')audioContext.resume();const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type='sine';osc.frequency.value=freq;gain.gain.setValueAtTime(.0001,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.18,audioContext.currentTime+.015);gain.gain.exponentialRampToValueAtTime(.0001,audioContext.currentTime+duration);osc.connect(gain);gain.connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+duration+.02)}catch(e){message('Sound is unavailable in this browser.')}
  }
  function vibrate(){if(ui.haptics.checked&&navigator.vibrate)navigator.vibrate([80,60,80])}
  function stopBeeping(){if(beepTimer){clearInterval(beepTimer);beepTimer=null}}
  function setLevel(value){
    if(value===isLevel)return;
    isLevel=value;ui.statusCard.classList.toggle('is-level',value);ui.statusCard.classList.toggle('is-error',false);
    if(value){ui.statusText.textContent='RV IS LEVEL';ui.statusSubtext.textContent='Both axes are within your target tolerance.';tone(1046,.18);vibrate();lastBeep=Date.now();beepTimer=setInterval(()=>{tone(880,.12);vibrate();lastBeep=Date.now()},1800);message('Level confirmed. Repeated alerts will continue while both axes stay within tolerance.')}
    else{ui.statusText.textContent='Not quite level';ui.statusSubtext.textContent='Adjust your leveling blocks or jacks.';stopBeeping();tone(330,.2);message('The RV moved outside your leveling tolerance.')}
  }
  function onOrientation(e){
    if(!running)return;
    if(e.beta===null||e.gamma===null){message('No orientation data received. Try rotating or repositioning your device.');return}
    // Beta is front/back tilt; gamma is left/right tilt. Device is assumed flat, screen facing up.
    const rawRoll=e.gamma-zeroRoll,rawPitch=e.beta-zeroPitch;
    smoothRoll=smoothRoll*.78+rawRoll*.22;smoothPitch=smoothPitch*.78+rawPitch*.22;
    roll=smoothRoll;pitch=smoothPitch;render();
    const within=Math.abs(roll)<=tolerance()&&Math.abs(pitch)<=tolerance();
    if(within){if(!stableSince)stableSince=Date.now();if(Date.now()-stableSince>=2000)setLevel(true);else{ui.statusText.textContent='Checking stability…';ui.statusSubtext.textContent='Hold steady for a moment.'}}
    else{stableSince=0;setLevel(false);if(!isLevel){ui.statusText.textContent='Adjusting…';ui.statusSubtext.textContent='Move the RV until both readings are within tolerance.'}}
  }
  async function requestWakeLock(){try{if('wakeLock'in navigator)wakeLock=await navigator.wakeLock.request('screen')}catch(e){}}
  async function start(){
    if(running){stop();return}
    if(!('DeviceOrientationEvent'in window)){message('This browser does not provide device orientation sensors. Please use Safari on a supported iPhone or iPad.');return}
    try{
      if(typeof DeviceOrientationEvent.requestPermission==='function'){const permission=await DeviceOrientationEvent.requestPermission();if(permission!=='granted'){message('Motion permission was not granted. Enable it in Safari settings and try again.');return}}
      running=true;stableSince=0;isLevel=false;ui.statusCard.classList.remove('is-level','is-error');ui.statusText.textContent='Measuring tilt';ui.statusSubtext.textContent='Keep your device flat on a firm surface.';ui.start.textContent='Stop leveling';ui.calibrate.disabled=false;ui.sensor.textContent='Sensor active';message('Sensor active. Measurements are relative to the device being flat and screen-up.');window.addEventListener('deviceorientation',onOrientation);await requestWakeLock();tone(660,.08);
    }catch(e){message('Unable to start motion sensors: '+e.message)}
  }
  function stop(){running=false;window.removeEventListener('deviceorientation',onOrientation);stopBeeping();stableSince=0;isLevel=false;if(wakeLock){wakeLock.release().catch(()=>{});wakeLock=null}ui.start.textContent='Start leveling';ui.calibrate.disabled=true;ui.sensor.textContent='Sensor stopped';ui.statusCard.classList.remove('is-level','is-error');ui.statusText.textContent='Paused';ui.statusSubtext.textContent='Start again when you are ready.';message('Leveling paused.')}
  function calibrate(){if(!running)return;zeroRoll+=smoothRoll;zeroPitch+=smoothPitch;smoothRoll=0;smoothPitch=0;roll=0;pitch=0;stableSince=0;setLevel(false);render();message('Zero point calibrated. Current device position is now your reference.')}
  ui.start.addEventListener('click',start);ui.calibrate.addEventListener('click',calibrate);
  ui.tolerance.addEventListener('input',()=>{render();if(Math.abs(roll)<=tolerance()&&Math.abs(pitch)<=tolerance()){if(!stableSince)stableSince=Date.now()}else{stableSince=0;setLevel(false)}});
  $('themeButton').addEventListener('click',()=>{const root=document.documentElement;root.dataset.theme=root.dataset.theme==='light'?'dark':'light';localStorage.setItem('rv-level-theme',root.dataset.theme)});
  const savedTheme=localStorage.getItem('rv-level-theme');if(savedTheme)document.documentElement.dataset.theme=savedTheme;
  document.addEventListener('visibilitychange',async()=>{if(document.visibilityState==='visible'&&running)await requestWakeLock()});
  if('serviceWorker'in navigator&&location.protocol.startsWith('http'))window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
  render();
})();