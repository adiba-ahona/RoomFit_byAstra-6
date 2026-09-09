'use strict';
(function(root){
 const defaults=()=>({width:4.8,depth:4.2,material:'oak',daily:0,selected:'bed',items:[
  {id:'bed',name:'Platform bed',w:1.6,d:2.1,h:.55,x:1.05,z:1.25,rotation:0},
  {id:'desk',name:'Writing desk',w:1.3,d:.65,h:.75,x:3.6,z:.55,rotation:0},
  {id:'chair',name:'Desk chair',w:.55,d:.6,h:.85,x:3.6,z:1.35,rotation:0},
  {id:'wardrobe',name:'Double wardrobe',w:1.2,d:.6,h:1.9,x:4.32,z:3.15,rotation:270},
  {id:'plant-holder',name:'Plant & book holder',w:.55,d:.35,h:1.15,x:2.35,z:3.55,rotation:0},
  {id:'hanging-plants',name:'Hanging plants',w:.45,d:.45,h:1.9,x:2.75,z:.35,rotation:0},
  {id:'big-plant',name:'Big plant decor',w:.65,d:.65,h:1.55,x:2.05,z:3.55,rotation:0},
  {id:'book-cabinet',name:'Book cabinet',w:1.05,d:.38,h:1.35,x:3.12,z:3.72,rotation:0},
  {id:'swing',name:'Room swing',w:1.05,d:1.05,h:2.2,x:1.95,z:3.05,rotation:0},
  {id:'vanity',name:'Vanity table',w:1.1,d:.5,h:1.25,x:3.25,z:2.2,rotation:0},
  {id:'prayer-mat',name:'Islamic prayer mat',w:.85,d:1.35,h:.025,x:2.55,z:1.95,rotation:0},
  {id:'coffee-corner',name:'Coffee corner',w:.8,d:.7,h:1.05,x:1.05,z:3.35,rotation:0}
 ]});
 function rotatePoint(x,z,degrees){const a=degrees*Math.PI/180;return{x:x*Math.cos(a)+z*Math.sin(a),z:-x*Math.sin(a)+z*Math.cos(a)};}
 function rectangle(item,w=item.w,d=item.d,dx=0,dz=0){const offset=rotatePoint(dx,dz,item.rotation);const swap=(Math.round(item.rotation/90)%2)!==0;const width=swap?d:w,depth=swap?w:d;return{x:item.x+offset.x,z:item.z+offset.z,w:width,d:depth,id:item.id};}
 function footprint(item,daily=0){return rectangle(item,item.w,item.d,0,item.id==='chair'?.65*daily:0);}
 function useZone(item,daily){if(daily<=.001)return null;if(item.id==='wardrobe')return rectangle(item,item.w,.65*daily,0,item.d/2+.325*daily);if(item.id==='chair')return rectangle(item,item.w,item.d+.65*daily,0,.325*daily);return null;}
 function overlap(a,b){return Math.abs(a.x-b.x)<(a.w+b.w)/2-.005&&Math.abs(a.z-b.z)<(a.d+b.d)/2-.005;}
 function outside(rect,width,depth){return rect.x-rect.w/2<-.005||rect.z-rect.d/2<-.005||rect.x+rect.w/2>width+.005||rect.z+rect.d/2>depth+.005;}
 function inspect(state){
  const physical=[],clearance=[],bad=new Set(),blocked=new Set();const boxes=state.items.map(item=>footprint(item,state.daily));
  boxes.forEach((box,i)=>{if(outside(box,state.width,state.depth)){physical.push(`${state.items[i].name} extends outside the room.`);bad.add(box.id);}
   for(let j=i+1;j<boxes.length;j++)if(overlap(box,boxes[j])){physical.push(`${state.items[i].name} overlaps ${state.items[j].name.toLowerCase()}.`);bad.add(box.id);bad.add(boxes[j].id);}
  });
  state.items.forEach(item=>{const zone=useZone(item,state.daily);if(!zone)return;
   if(outside(zone,state.width,state.depth)){clearance.push(`${item.name}: use space reaches beyond the room.`);blocked.add(item.id);}
   boxes.forEach((box,i)=>{if(box.id!==item.id&&overlap(zone,box)){clearance.push(`${item.name}: ${state.items[i].name.toLowerCase()} blocks the use zone.`);blocked.add(item.id);}});
  });
  const area=state.width*state.depth,used=state.items.reduce((sum,item)=>sum+item.w*item.d,0);
  return{physical,clearance,bad,blocked,area,used,free:Math.max(0,Math.round((area-used)/area*100))};
 }
 const api={defaults,rotatePoint,rectangle,footprint,useZone,overlap,outside,inspect};root.RoomPlanner=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
