import * as THREE from './vendor/three.module.min.js';

const $=selector=>document.querySelector(selector),$$=selector=>[...document.querySelectorAll(selector)];
const P=window.RoomPlanner;
let state=P.defaults(),check=P.inspect(state);
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width: 760px)');
let materialName={oak:'Natural oak',walnut:'Dark walnut',stone:'Cool stone'};
let renderer,tourRenderer;
try {
 renderer=new THREE.WebGLRenderer({canvas:$('#scene'),antialias:true,alpha:false});
 tourRenderer=new THREE.WebGLRenderer({canvas:$('#tour-scene'),antialias:true,alpha:false});
} catch(error) {
 $('#loading').hidden=true;$('#loading').style.display='none';$('#scene-error').hidden=false;
 throw error;
}
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));tourRenderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
tourRenderer.shadowMap.enabled=true;tourRenderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;tourRenderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;tourRenderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.2;tourRenderer.toneMappingExposure=1.2;
const scene=new THREE.Scene();scene.background=new THREE.Color('#eef0eb');
const camera=new THREE.PerspectiveCamera(37,1,.05,100),tourCamera=new THREE.PerspectiveCamera(40,1,.05,100);
const ambient=new THREE.HemisphereLight(0xffffff,0x8b9485,2.1);scene.add(ambient);
const sunlight=new THREE.DirectionalLight(0xfff7e6,3.0);sunlight.position.set(-3,9,6);sunlight.castShadow=true;sunlight.shadow.mapSize.set(1024,1024);sunlight.shadow.camera.left=-10;sunlight.shadow.camera.right=10;sunlight.shadow.camera.top=10;sunlight.shadow.camera.bottom=-10;sunlight.shadow.normalBias=.035;sunlight.shadow.bias=-.0002;scene.add(sunlight);
const fill=new THREE.DirectionalLight(0xdae7f3,.7);fill.position.set(8,5,-3);scene.add(fill);
const roomGroup=new THREE.Group(),furnitureGroup=new THREE.Group(),overlayGroup=new THREE.Group();scene.add(roomGroup,furnitureGroup,overlayGroup);
const objects=new Map();
const mats={
 wall:new THREE.MeshStandardMaterial({color:'#e6e7df',roughness:.96}),trim:new THREE.MeshStandardMaterial({color:'#f8f8ee',roughness:.9}),
 wood:new THREE.MeshStandardMaterial({color:'#c5a679',roughness:.77}),darkWood:new THREE.MeshStandardMaterial({color:'#927958',roughness:.7}),
 linen:new THREE.MeshStandardMaterial({color:'#edeee5',roughness:1}),blanket:new THREE.MeshStandardMaterial({color:'#a4b494',roughness:1}),
 pillow:new THREE.MeshStandardMaterial({color:'#fbf9e9',roughness:1}),metal:new THREE.MeshStandardMaterial({color:'#394539',roughness:.4,metalness:.3}),
 seat:new THREE.MeshStandardMaterial({color:'#b6bea4',roughness:.9}),wardrobe:new THREE.MeshStandardMaterial({color:'#d3c9af',roughness:.75}),
 screen:new THREE.MeshStandardMaterial({color:'#243e3e',roughness:.3,metalness:.2}),glass:new THREE.MeshStandardMaterial({color:'#b0cbd1',transparent:true,opacity:.22,roughness:.2}),
 greenLeaf:new THREE.MeshStandardMaterial({color:'#5c8052',roughness:.9}),lightLeaf:new THREE.MeshStandardMaterial({color:'#91a967',roughness:.9}),terracotta:new THREE.MeshStandardMaterial({color:'#b9684c',roughness:.85}),mirror:new THREE.MeshStandardMaterial({color:'#b9d5d2',metalness:.45,roughness:.16}),
 red:new THREE.LineBasicMaterial({color:'#b75549'}),green:new THREE.LineBasicMaterial({color:'#6f9660'}),amber:new THREE.LineBasicMaterial({color:'#b98c42'})
};
function box(parent,w,h,d,x,y,z,material){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function cylinder(parent,radiusTop,radiusBottom,height,x,y,z,material,segments=20){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radiusTop,radiusBottom,height,segments),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function sphere(parent,radius,x,y,z,material){const mesh=new THREE.Mesh(new THREE.SphereGeometry(radius,16,10),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function disposeTree(group){group.traverse(object=>{if(object.geometry)object.geometry.dispose();if(object.userData.ownMaterial){object.material.map?.dispose();object.material.dispose();}});group.clear();}
function floorTexture(finish){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const ctx=canvas.getContext('2d');
 if(finish==='stone'){ctx.fillStyle='#bfc4be';ctx.fillRect(0,0,512,512);ctx.strokeStyle='#aab3a8';ctx.lineWidth=2;for(let x=0;x<=512;x+=128){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,512);ctx.stroke();ctx.beginPath();ctx.moveTo(0,x);ctx.lineTo(512,x);ctx.stroke();}}
 else{
  const colors=finish==='oak'?['#c6aa7e','#cbb186','#d1b58b','#c6ac84']:['#715440','#7b5b43','#80624b','#745741'];
  for(let i=0;i<12;i++){ctx.fillStyle=colors[i%4];ctx.fillRect(i*44,0,44,512);ctx.strokeStyle=finish==='oak'?'#b99e734c':'#4a37264a';ctx.lineWidth=1;for(let j=0;j<9;j++){ctx.beginPath();ctx.moveTo(i*44+j*5,0);ctx.bezierCurveTo(i*44+j*5+3,140,i*44+j*5-3,330,i*44+j*5,512);ctx.stroke();}ctx.strokeStyle=finish==='oak'?'#a58a5d88':'#402d2588';ctx.strokeRect(i*44,0,44,512);ctx.beginPath();ctx.moveTo(i*44,150+(i%3)*90);ctx.lineTo((i+1)*44,150+(i%3)*90);ctx.stroke();}
 }
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(state.width/3,state.depth/3);texture.anisotropy=4;return texture;
}
let floorMat;
function makeRoom(){
 disposeTree(roomGroup);if(floorMat){floorMat.map.dispose();floorMat.dispose();}
 floorMat=new THREE.MeshStandardMaterial({map:floorTexture(state.material),roughness:.88});
 box(roomGroup,state.width,.12,state.depth,state.width/2,-.06,state.depth/2,floorMat);
 box(roomGroup,state.width+.15,.10,state.depth+.15,state.width/2,-.17,state.depth/2,mats.trim);
 const height=2.5;
 box(roomGroup,.09,height,state.depth,-.045,height/2,state.depth/2,mats.wall);
 // The back wall has a real opening for the window, not an opaque painted rectangle.
 const opening=Math.min(1.7,state.width*.42),cx=state.width*.6,left=cx-opening/2,right=cx+opening/2;
 box(roomGroup,left,height,.09,left/2,height/2,-.045,mats.wall);
 box(roomGroup,state.width-right,height,.09,right+(state.width-right)/2,height/2,-.045,mats.wall);
 box(roomGroup,opening,1.1,.09,cx,.55,-.045,mats.wall);
 box(roomGroup,opening,.4,.09,cx,2.3,-.045,mats.wall);
 box(roomGroup,opening+.1,.065,.18,cx,1.08,.005,mats.trim);
 box(roomGroup,opening+.1,.065,.12,cx,2.1,-.005,mats.trim);
 box(roomGroup,.055,1.05,.12,left,1.59,-.01,mats.trim);box(roomGroup,.055,1.05,.12,right,1.59,-.01,mats.trim);
 box(roomGroup,.04,1.03,.08,cx,1.59,-.01,mats.trim);
 const glass=box(roomGroup,opening,1,.015,cx,1.6,-.04,mats.glass);glass.castShadow=false;
 box(roomGroup,state.width,.07,.035,state.width/2,.035,.008,mats.trim);box(roomGroup,.035,.07,state.depth,.008,.035,state.depth/2,mats.trim);
 // A neutral ground plane receives the room's exterior shadow.
 const ground=box(roomGroup,200,.04,200,state.width/2,-.26,state.depth/2,new THREE.MeshStandardMaterial({color:'#eef0eb',roughness:1}));ground.castShadow=false;ground.userData.ownMaterial=true;
 // Ceiling is intentionally cut away to keep furniture editable from above.
}
function makeFurniture(item){
 const root=new THREE.Group();root.userData.itemId=item.id;
 const w=item.w,d=item.d;
 if(item.id==='bed'){
  box(root,w,.18,d,0,.19,0,mats.wood);box(root,w-.05,.15,d-.06,0,.34,.015,mats.linen);
  box(root,w+.02,.8,.085,0,.47,-d/2+.025,mats.wood);
  box(root,w-.04,.08,d*.64,0,.46,d*.14,mats.blanket);
  box(root,w*.41,.105,.37,-w*.23,.47,-d*.31,mats.pillow);box(root,w*.41,.105,.37,w*.23,.47,-d*.31,mats.pillow);
  for(const x of [-w*.4,w*.4])for(const z of [-d*.4,d*.4])box(root,.065,.15,.065,x,.075,z,mats.darkWood);
 }else if(item.id==='desk'){
  box(root,w,.055,d,0,.73,0,mats.wood);
  for(const x of [-w*.44,w*.44])for(const z of [-d*.36,d*.36])box(root,.045,.71,.045,x,.355,z,mats.metal);
  box(root,.31,.015,.21,0,.77,-.08,mats.metal);box(root,.04,.14,.035,0,.845,-.13,mats.metal);
  box(root,.51,.31,.027,0,1.04,-.145,mats.metal);box(root,.475,.265,.012,0,1.04,-.124,mats.screen);
  box(root,.3,.012,.12,0,.772,.19,mats.trim);
  cylinder(root,.041,.033,.085,.43,.8,.11,mats.linen);
 }else if(item.id==='chair'){
  box(root,w*.92,.075,d*.83,0,.44,0,mats.seat);box(root,w*.94,.39,.065,0,.68,d*.39,mats.seat);
  for(const x of [-w*.37,w*.37])for(const z of [-d*.32,d*.32])box(root,.034,.42,.034,x,.21,z,mats.metal);
  for(const x of [-w*.44,w*.44]){box(root,.03,.15,.03,x,.54,d*.27,mats.metal);box(root,.05,.035,d*.7,x,.63,0,mats.wood);}
 }else if(item.id==='wardrobe'){
  box(root,w,item.h,.05,0,item.h/2,-d/2+.025,mats.wardrobe);
  box(root,.05,item.h,d,-w/2+.025,item.h/2,0,mats.wardrobe);box(root,.05,item.h,d,w/2-.025,item.h/2,0,mats.wardrobe);
  box(root,w,.05,d,0,item.h-.025,0,mats.wardrobe);box(root,w,.08,d,0,.04,0,mats.wardrobe);
  for(const y of [.65,1.23])box(root,w-.09,.025,d-.06,0,y,0,mats.wood);
  const leftDoor=new THREE.Group(),rightDoor=new THREE.Group();leftDoor.position.set(-w/2,.04,d/2);rightDoor.position.set(w/2,.04,d/2);
  box(leftDoor,w/2-.01,item.h-.08,.032,w/4,(item.h-.08)/2,0,mats.wardrobe);
  box(rightDoor,w/2-.01,item.h-.08,.032,-w/4,(item.h-.08)/2,0,mats.wardrobe);
  box(leftDoor,.018,.17,.033,w/2-.08,.92,.035,mats.metal);box(rightDoor,.018,.17,.033,-w/2+.08,.92,.035,mats.metal);
    root.add(leftDoor,rightDoor);root.userData.doors=[leftDoor,rightDoor];
 }else if(item.id==='plant-holder'){
    box(root,w,.06,d,0,.58,0,mats.wood);box(root,.055,1.1,.055,-w*.38,.3,0,mats.darkWood);box(root,.055,1.1,.055,w*.38,.3,0,mats.darkWood);
    box(root,w-.08,.045,d,0,.12,0,mats.wood);cylinder(root,.12,.14,.15,0,.69,0,mats.terracotta);cylinder(root,.03,.07,.16,0,.84,0,mats.greenLeaf);
    for(const [x,y,z,s] of [[-.1,.91,0,.13],[.1,.96,.02,.11],[0,1.03,-.02,.12]])sphere(root,s,x,y,z,mats.lightLeaf);
    for(const x of [-w*.38,w*.38])box(root,.25,.04,.03,x,.8,-.12,mats.wood);
 }else if(item.id==='hanging-plants'){
    box(root,.42,.035,.42,0,2.47,0,mats.darkWood);
    for(const x of [-.14,.14]){cylinder(root,.012,.012,1.05,x,1.95,0,mats.metal);cylinder(root,.1,.12,.13,x,1.43,0,mats.terracotta);cylinder(root,.025,.055,.2,x,1.58,0,mats.greenLeaf);sphere(root,.11,x-.06,1.72,.01,mats.lightLeaf);sphere(root,.1,x+.06,1.78,-.02,mats.greenLeaf);}
 }else if(item.id==='big-plant'){
    cylinder(root,.23,.28,.24,0,.12,0,mats.terracotta);cylinder(root,.045,.055,.75,0,.58,0,mats.darkWood);
    for(const [x,y,z,s] of [[-.2,.92,0,.2],[.18,1.05,.02,.22],[0,1.23,0,.2],[-.1,1.38,-.02,.16],[.24,1.35,-.02,.15]])sphere(root,s,x,y,z,mats.greenLeaf);
 }else if(item.id==='book-cabinet'){
    box(root,w,item.h,.06,0,item.h/2,-d/2+.03,mats.darkWood);box(root,.04,item.h,d,-w/2+.02,item.h/2,0,mats.darkWood);box(root,.04,item.h,d,w/2-.02,item.h/2,0,mats.darkWood);
    for(const y of [.32,.67,1.02]){box(root,w-.08,.035,d-.04,0,y,0,mats.wood);for(const x of [-.28,-.08,.14,.3])box(root,.055,.24,.12,x,y+.14,.02,[mats.blanket,mats.terracotta,mats.greenLeaf,mats.screen][Math.abs(Math.round(x*10))%4]);}
 }else if(item.id==='swing'){
    box(root,.95,.05,.95,0,2.42,0,mats.darkWood);for(const x of [-.38,.38]){cylinder(root,.014,.014,1.95,x,1.45,-.35,mats.metal);cylinder(root,.014,.014,1.95,x,1.45,.35,mats.metal);}
    box(root,.76,.09,.62,0,.5,0,mats.wood);box(root,.76,.55,.07,0,.79,.28,mats.wood);box(root,.7,.07,.55,0,.57,0,mats.linen);
 }else if(item.id==='vanity'){
    box(root,w,.06,d,0,1.03,0,mats.wood);for(const x of [-w*.4,w*.4])box(root,.05,1,.05,x,.5,0,mats.darkWood);box(root,.72,.06,.32,0,.7,-.02,mats.wood);
    box(root,.57,.48,.035,0,1.5,-.14,mats.mirror);box(root,.62,.06,.34,0,1.28,.04,mats.wood);cylinder(root,.06,.08,.06,.2,1.11,-.08,mats.terracotta);
 }else if(item.id==='prayer-mat'){
    box(root,w,.025,d,0,.015,0,mats.greenLeaf);box(root,w-.08,.012,d-.08,0,.032,0,mats.linen);box(root,w-.18,.008,.035,0,.045,-d/2+.12,mats.wood);for(const x of [-.22,0,.22])box(root,.035,.008,.18,x,.045,d/2-.14,mats.wood);
 }else if(item.id==='coffee-corner'){
    box(root,w,.07,d,0,.88,0,mats.darkWood);for(const x of [-w*.38,w*.38])box(root,.05,.85,.05,x,.43,0,mats.wood);box(root,.63,.05,.45,0,.45,0,mats.wood);
    box(root,.25,.22,.2,0,1.04,0,mats.metal);cylinder(root,.06,.08,.08,.18,1.02,.1,mats.terracotta);cylinder(root,.045,.055,.07,-.18,1.02,.1,mats.terracotta);
 }
 root.traverse(object=>{if(object.isMesh)object.userData.itemId=item.id;});furnitureGroup.add(root);objects.set(item.id,root);
}
function lineRect(rect,color,y=.013){const points=[[rect.x-rect.w/2,y,rect.z-rect.d/2],[rect.x+rect.w/2,y,rect.z-rect.d/2],[rect.x+rect.w/2,y,rect.z+rect.d/2],[rect.x-rect.w/2,y,rect.z+rect.d/2],[rect.x-rect.w/2,y,rect.z-rect.d/2]].map(p=>new THREE.Vector3(...p));const material=new THREE.LineBasicMaterial({color,transparent:true,opacity:.95});const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),material);line.userData.ownMaterial=true;overlayGroup.add(line);}
function drawMeasurements(){
 const m=new THREE.LineBasicMaterial({color:'#99ae87'});
 const positions=[-.3,0,-.3,state.width,0,-.3, -.3,0,-.3,-.3,0,state.depth];
 const line=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(positions,3)),m);line.userData.ownMaterial=true;overlayGroup.add(line);
 for(const [x,z] of [[0,-.3],[state.width,-.3],[-.3,0],[-.3,state.depth]]){const tick=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x-.045,.002,z-.045),new THREE.Vector3(x+.045,.002,z+.045)]),m.clone());tick.userData.ownMaterial=true;overlayGroup.add(tick);}
}
function syncScene(){
 check=P.inspect(state);disposeTree(overlayGroup);
 state.items.forEach(item=>{
  const group=objects.get(item.id),p=P.footprint(item,state.daily);
  group.position.set(p.x,0,p.z);group.rotation.y=item.rotation*Math.PI/180;
  if(group.userData.doors){group.userData.doors[0].rotation.y=-state.daily*Math.PI/2;group.userData.doors[1].rotation.y=state.daily*Math.PI/2;}
  if(check.bad.has(item.id)||item.id===state.selected)lineRect({...p,w:p.w+.03,d:p.d+.03},check.bad.has(item.id)?'#be5b4d':'#6e944f');
  if($('#show-clearance').checked){const zone=P.useZone(item,state.daily);if(zone){const blocked=check.blocked.has(item.id);const material=new THREE.MeshBasicMaterial({color:blocked?'#dbac62':'#b9d189',transparent:true,opacity:.20,side:THREE.DoubleSide,depthWrite:false});const plane=new THREE.Mesh(new THREE.PlaneGeometry(zone.w,zone.d),material);plane.rotation.x=-Math.PI/2;plane.position.set(zone.x,.018,zone.z);plane.userData.ownMaterial=true;overlayGroup.add(plane);lineRect(zone,blocked?'#bd8b3e':'#a0b777',.02);}}
 });
 if($('#show-dimensions').checked)drawMeasurements();
 $('#width-label').hidden=!$('#show-dimensions').checked;
 updateUI();requestRender();
}
function selected(){return state.items.find(item=>item.id===state.selected);}
function updateUI(){
 const item=selected();$('#selected-name').textContent=item.name;$('#selected-size').textContent=`${item.w.toFixed(2)} × ${item.d.toFixed(2)} m · ${item.rotation}°`;
 if(document.activeElement!==$('#item-x'))$('#item-x').value=item.x.toFixed(2);if(document.activeElement!==$('#item-z'))$('#item-z').value=item.z.toFixed(2);
 $$('.furniture-item').forEach(button=>{const active=button.dataset.item===state.selected;button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));});
 $('#room-area').textContent=check.area.toFixed(2)+' m²';$('#width-label').textContent=state.width.toFixed(2)+' × '+state.depth.toFixed(2)+' m';
 $('#stat-area').innerHTML=check.area.toFixed(1)+'<small> m²</small>';$('#stat-used').innerHTML=check.used.toFixed(1)+'<small> m²</small>';$('#stat-free').innerHTML=check.free+'<small>%</small>';
 const problems=check.physical.length+check.clearance.length;
 $('#fit-summary').innerHTML=problems?`${problems} ${problems===1?'issue':'issues'} to check <i style="background:#efcbb7">!</i>`:'All pieces fit <i>✓</i>';
 const issues=$('#issues');issues.replaceChildren();if(problems){const list=document.createElement('ul');check.physical.forEach(message=>{const li=document.createElement('li');li.textContent=message;list.append(li);});check.clearance.forEach(message=>{const li=document.createElement('li');li.className='clearance-issue';li.textContent=message;list.append(li);});issues.append(list);}
 $('#daily-value').textContent=Math.round(state.daily*100)+'%';$('#daily-slider').style.setProperty('--life',state.daily*100+'%');
 $('#daily-status').textContent=state.daily===0?'Move the slider to test wardrobe and chair clearance.':check.clearance.length?`${check.clearance.length} use-zone ${check.clearance.length===1?'conflict':'conflicts'}. Amber zones show where everyday movement needs more space.`:'No use-zone conflicts in this simplified layout. Check actual clearances before buying.';
}
const icons={bed:'▰',desk:'⊓',chair:'⊔',wardrobe:'▥','plant-holder':'♧','hanging-plants':'♧','big-plant':'♧','book-cabinet':'▤',swing:'◯',vanity:'▱','prayer-mat':'▭','coffee-corner':'◌'};
state.items.forEach(item=>{const button=document.createElement('button');button.className='furniture-item';button.dataset.item=item.id;button.innerHTML=`<span class="item-icon" aria-hidden="true">${icons[item.id]}</span><span><strong>${item.name}</strong><small>${item.w.toFixed(2)} × ${item.d.toFixed(2)} m</small></span><span class="item-arrow">↗</span>`;button.addEventListener('click',()=>{state.selected=item.id;syncScene();});$('#furniture-list').append(button);});
$('.furniture-heading span:last-child').textContent=`${state.items.length} PIECES`;

let yaw=.66,pitch=.78,distance=8.8,view='perspective';
let targetPosition=new THREE.Vector3(),targetLook=new THREE.Vector3(),look=new THREE.Vector3(state.width/2,.25,state.depth/2);
let frameId=0,mainVisible=true,tourVisible=false,tourProgress=0;
function cameraTarget(){
 const scale=Math.max(state.width,state.depth)/4.8;
 const aspect=camera.aspect;const fit=aspect<1?1/aspect*.82:1;
 targetLook.set(state.width/2,.38,state.depth/2);
 if(view==='eye'){targetPosition.set(state.width/2,1.55,state.depth+.45);targetLook.set(state.width/2,1.25,0);}
 else{const r=distance*scale*fit;targetPosition.set(state.width/2+Math.sin(yaw)*Math.cos(pitch)*r,Math.sin(pitch)*r,state.depth/2+Math.cos(yaw)*Math.cos(pitch)*r);}
}
function setView(name){view=name;if(name==='top'){pitch=1.54;yaw=0;}if(name==='perspective'){pitch=.78;yaw=.66;}distance=8.8;cameraTarget();$$('[data-view]').forEach(button=>{const active=button.dataset.view===name;button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));});requestRender();}
$$('[data-view]').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.view)));
function updateTourCamera(){
 const t=tourProgress,scale=Math.max(state.width,state.depth)/4.8,center=new THREE.Vector3(state.width/2,.35,state.depth/2);
 const plan=new THREE.Vector3(state.width/2,8.8*scale,state.depth/2+.03);
 const three=new THREE.Vector3(state.width/2+4.4*scale,5.1*scale,state.depth/2+5.4*scale);
 const eye=new THREE.Vector3(state.width/2,1.62,state.depth+.35);
 const target=new THREE.Vector3();
 if(t<=.5){const q=t*2;target.lerpVectors(plan,three,q);tourCamera.position.copy(target);tourCamera.lookAt(center);}
 else{const q=(t-.5)*2;target.lerpVectors(three,eye,q);tourCamera.position.copy(target);center.lerp(new THREE.Vector3(state.width/2,1.15,.1),q);tourCamera.lookAt(center);}
 const index=t<.25?0:t<.75?1:2;
 const titles=['Start with<br><em>the footprint.</em>','See the room<br><em>take shape.</em>','Picture<br><em>the everyday.</em>'];
 const descriptions=['Look down to compare scale and spacing. Every object uses the same dimensions as your plan.','The same layout, with a little depth. See how height and volume change the feel of your space.','A view closer to real life. Your furniture positions and open doors carry through from the planner.'];
 $('#tour-title').innerHTML=titles[index];$('#tour-description').textContent=descriptions[index];$$('.tour-steps span').forEach((el,i)=>el.classList.toggle('active',i===index));$('#tour-view-label').textContent=['PLAN VIEW / SCALED FURNITURE','3D VIEW / YOUR CURRENT LAYOUT','EYE LEVEL / APPROXIMATELY 1.6 M'][index];
}
function renderFrame(){
 frameId=0;cameraTarget();
 const factor=reduced.matches?1:.17;camera.position.lerp(targetPosition,factor);look.lerp(targetLook,factor);camera.lookAt(look);
 if(mainVisible){scene.background.set('#eef0eb');renderer.render(scene,camera);}
 if(tourVisible){scene.background.set('#e8ece4');updateTourCamera();tourRenderer.render(scene,tourCamera);}
 if(mainVisible&&(camera.position.distanceTo(targetPosition)>.005||look.distanceTo(targetLook)>.005))requestRender();
}
function requestRender(){if(!frameId&&!document.hidden)frameId=requestAnimationFrame(renderFrame);}
function resize(){const main=$('#viewport');renderer.setSize(main.clientWidth,main.clientHeight,false);camera.aspect=main.clientWidth/main.clientHeight;camera.updateProjectionMatrix();const tour=$('.tour-viewport');tourRenderer.setSize(tour.clientWidth,tour.clientHeight,false);tourCamera.aspect=tour.clientWidth/tour.clientHeight;tourCamera.updateProjectionMatrix();requestRender();}
new ResizeObserver(resize).observe($('#viewport'));new ResizeObserver(resize).observe($('.tour-viewport'));
new IntersectionObserver(entries=>{mainVisible=entries[0].isIntersecting;requestRender();}).observe($('#viewport'));
new IntersectionObserver(entries=>{tourVisible=entries[0].isIntersecting;requestRender();}).observe($('.tour-viewport'));
addEventListener('scroll',()=>{if(mobile.matches||reduced.matches||!tourVisible)return;const rect=$('#tour').getBoundingClientRect();tourProgress=Math.max(0,Math.min(1,-rect.top/Math.max(1,rect.height-innerHeight)));requestRender();},{passive:true});
$$('[data-tour]').forEach(button=>button.addEventListener('click',()=>{tourProgress=Number(button.dataset.tour);requestRender();}));
document.addEventListener('visibilitychange',requestRender);

// Raycast to select a real mesh, then drag on a shared horizontal floor plane.
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0),hitPoint=new THREE.Vector3();
let drag=null,previousX=0,previousY=0;
function ray(event){const rect=$('#scene').getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);}
$('#scene').addEventListener('pointerdown',event=>{
 ray(event);previousX=event.clientX;previousY=event.clientY;
 const hits=raycaster.intersectObjects(furnitureGroup.children,true);const hit=hits.find(h=>h.object.userData.itemId);
 if(hit&&raycaster.ray.intersectPlane(groundPlane,hitPoint)){state.selected=hit.object.userData.itemId;const item=selected();drag={type:'item',offsetX:item.x-hitPoint.x,offsetZ:item.z-hitPoint.z};syncScene();}
 else drag={type:'orbit'};
 $('#scene').setPointerCapture(event.pointerId);$('#scene').focus({preventScroll:true});
});
$('#scene').addEventListener('pointermove',event=>{
 if(!drag)return;
 if(drag.type==='item'){
  ray(event);if(raycaster.ray.intersectPlane(groundPlane,hitPoint)){const item=selected();item.x=Math.round(Math.max(-.75,Math.min(state.width+.75,hitPoint.x+drag.offsetX))*20)/20;item.z=Math.round(Math.max(-.75,Math.min(state.depth+.75,hitPoint.z+drag.offsetZ))*20)/20;syncScene();}
 }else{if(view==='eye'){view='perspective';pitch=.55;distance=8.8;}yaw-=(event.clientX-previousX)*.007;pitch=Math.max(.15,Math.min(1.54,pitch+(event.clientY-previousY)*.005));view='perspective';$$('[data-view]').forEach(button=>{button.classList.toggle('selected',button.dataset.view==='perspective');button.setAttribute('aria-pressed',String(button.dataset.view==='perspective'));});requestRender();}
 previousX=event.clientX;previousY=event.clientY;
});
['pointerup','pointercancel','lostpointercapture'].forEach(type=>$('#scene').addEventListener(type,()=>drag=null));
function move(dx,dz){const item=selected();item.x=Math.round(Math.max(-.75,Math.min(state.width+.75,item.x+dx))*100)/100;item.z=Math.round(Math.max(-.75,Math.min(state.depth+.75,item.z+dz))*100)/100;syncScene();}
function rotate(){selected().rotation=(selected().rotation+90)%360;syncScene();}
$('#scene').addEventListener('keydown',event=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','r','R'].includes(event.key)){event.preventDefault();if(event.key==='ArrowUp')move(0,-.1);if(event.key==='ArrowDown')move(0,.1);if(event.key==='ArrowLeft')move(-.1,0);if(event.key==='ArrowRight')move(.1,0);if(event.key.toLowerCase()==='r')rotate();}});
$$('[data-nudge]').forEach(button=>button.addEventListener('click',()=>move(...button.dataset.nudge.split(',').map(Number))));$('#rotate').addEventListener('click',rotate);
for(const [id,key] of [['item-x','x'],['item-z','z']])$('#'+id).addEventListener('change',()=>{const el=$('#'+id),value=Number(el.value);if(el.value.trim()===''||!Number.isFinite(value)){el.value=selected()[key].toFixed(2);return;}selected()[key]=Math.round(Math.max(-.75,Math.min((key==='x'?state.width:state.depth)+.75,value))*100)/100;syncScene();el.value=selected()[key].toFixed(2);});
$('#zoom-in').addEventListener('click',()=>{if(view==='eye')setView('perspective');distance=Math.max(4.7,distance-.65);requestRender();});$('#zoom-out').addEventListener('click',()=>{if(view==='eye')setView('perspective');distance=Math.min(15,distance+.65);requestRender();});$('#camera-reset').addEventListener('click',()=>setView('perspective'));
$('#room-form').addEventListener('submit',event=>{event.preventDefault();if(!$('#room-form').reportValidity())return;state.width=Number($('#room-width').value);state.depth=Number($('#room-depth').value);makeRoom();syncScene();});
$$('[data-material]').forEach(button=>button.addEventListener('click',()=>{state.material=button.dataset.material;$$('[data-material]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));});$('#material-name').textContent=materialName[state.material];makeRoom();syncScene();}));
$('#daily-slider').addEventListener('input',()=>{state.daily=Number($('#daily-slider').value)/100;syncScene();});$('#show-clearance').addEventListener('change',syncScene);$('#show-dimensions').addEventListener('change',syncScene);
$('#reset').addEventListener('click',()=>{state=P.defaults();$('#room-width').value=state.width;$('#room-depth').value=state.depth;$('#daily-slider').value=0;$('#show-clearance').checked=true;$('#show-dimensions').checked=true;$$('[data-material]').forEach(b=>{const active=b.dataset.material==='oak';b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));});$('#material-name').textContent='Natural oak';makeRoom();setView('perspective');syncScene();toast('Room reset to the original layout.');});
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');setTimeout(()=>$('#toast').classList.remove('show'),3500);}
$('#export').addEventListener('click',()=>{
 const summary=`ROOMFIT / ROOM PLAN\n\nRoom: ${state.width.toFixed(2)} × ${state.depth.toFixed(2)} m\nArea: ${check.area.toFixed(2)} m²\nFloor: ${materialName[state.material]}\nDaily life: ${Math.round(state.daily*100)}%\n\nCoordinates use the back-left floor corner as the origin. X runs right; Z runs toward the front. Positions describe the furniture center at rest. Rotations use the 3D Y axis.\n\n${state.items.map(item=>`${item.name}\nFootprint: ${item.w.toFixed(2)} × ${item.d.toFixed(2)} m\nCenter: X ${item.x.toFixed(2)}, Z ${item.z.toFixed(2)} m\nRotation: ${item.rotation}°`).join('\n\n')}\n\nLAYOUT CHECK\n${[...check.physical,...check.clearance].join('\n')||'No rectangular footprint or use-zone conflicts detected.'}\n\nRoomFit is a concept planning tool. Use-zone checks estimate clearances conservatively. Verify real furniture sizes, door access and walking routes before purchasing.\n`;
 const url=URL.createObjectURL(new Blob([summary],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='ROOMFIT-room-plan.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);toast('Your room plan is ready. Check your downloads.');
});
$('#help-button').addEventListener('click',()=>$('#help').showModal());$('#help-close').addEventListener('click',()=>$('#help').close());
makeRoom();state.items.forEach(makeFurniture);cameraTarget();camera.position.copy(targetPosition);look.copy(targetLook);resize();syncScene();$('#loading').style.display='none';
