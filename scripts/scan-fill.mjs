import sharp from "sharp";
const dir = "/Users/jacksonorndorff/Developer/Kairo-Labs/public/_regen";
async function scan(slug){
  const { data, info } = await sharp(`${dir}/${slug}.png`).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const W=info.width,H=info.height,ch=info.channels;
  const px=(x,y)=>{const i=(y*W+x)*ch;return [data[i],data[i+1],data[i+2]];};
  let rows=[];
  for(let y=700;y<900;y+=8){
    const [r,g,b]=px(520,y);
    rows.push(`${y}:${Math.round(0.299*r+0.587*g+0.114*b)}`);
  }
  const yProbe=830;
  let lx=520,rx=520;
  while(lx>340){const[r,g,b]=px(lx,yProbe);if(0.299*r+0.587*g+0.114*b<120)break;lx--;}
  while(rx<700){const[r,g,b]=px(rx,yProbe);if(0.299*r+0.587*g+0.114*b<120)break;rx++;}
  console.log(slug.padEnd(12),"interiorX@830:",lx,"-",rx,"\n   ",rows.join(" "));
}
for(const s of ["tirzepatide","tb-500","ipamorelin","bpc-157","ghk-cu"]) await scan(s);
