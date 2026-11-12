// Synthetic API contract fixtures. Never used as runtime inventory.
export const env={BROKBUDDY_API_BASE_URL:'https://api.example.test',BROKBUDDY_BROKER_PROFILE_SLUG:'test-broker',BROKBUDDY_BROKER_CODE:'a'.repeat(32)};
export function agent() {return {id:'broker-a',slug:'test-broker',name:'Test Broker',title:'Property Consultant',bio:'<p>A public <strong>broker biography</strong>.</p>',avatarUrl:'https://api.example.test/api/public/agency/agency/profile-assets/broker-a/avatar/view',phone:'+971500000000',email:'broker@example.test',brn:'BRN-123',languages:['English','Arabic'],specializations:['Villas'],yearsExperience:5,facebook:null,instagram:null,linkedin:null,twitter:null,website:null};}
export function listing(index=1, overrides={}) {return {id:`listing-${index}`,title:`Property ${String(index).padStart(2,'0')}`,description:'## A public residence\n\nBeautiful **waterfront** home.\n\n- Pool\n- Balcony',price:index*100000,currency:'AED',community:index%2 ? 'Palm Jumeirah' : 'Dubai Marina',city:'Dubai',mapAddress:null,bedrooms:index%5,bathrooms:2,builtUpArea:1000+index,propertyType:index%2 ? 'Villa':'Apartment',category:'Residential',transactionType:index%3===0 ? 'RENT':'SALE',readiness:index%4===0 ? 'OFFPLAN':'READY',status:'ACTIVE',images:[{id:'photo-1',url:'https://api.example.test/photo-1.jpg',category:'EXTERIOR',isHero:true,order:0},{id:'photo-1',url:'https://api.example.test/photo-1.jpg',category:'EXTERIOR',order:0},{id:'photo-2',url:'https://api.example.test/photo-2.jpg',category:'INTERIOR',order:1},{id:'floor-plan',url:'https://api.example.test/floor.jpg',category:'FLOORPLAN',order:2}],amenities:['Private Pool','Balcony'],broker:{id:'broker-a',brokerProfile:{slug:'test-broker'}},agent:{id:'broker-a',slug:'test-broker'},isFeatured:index<3,createdAt:'2026-01-01T00:00:00.000Z',latitude:25.12+index/10000,longitude:55.13+index/10000,...overrides};}
export function profile(inventory=[]) {return {agent:agent(),stats:{activeListings:Math.min(inventory.length,18),soldListings:0,rentedListings:0},activeListings:inventory.slice(0,2),soldListings:[],rentedListings:[]};}
export function mockApi({count=27,transform=(x)=>x,fail,confirmation={inquiry:{id:'inquiry-123'}}}={}) {
 const inventory=Array.from({length:count},(_,i)=>listing(i+1));const calls=[];
 const fetchImpl=async (input,options)=>{
  const url=new URL(input);calls.push({url,options});
  if(fail) {const value=fail(url,options);if(value) return value;}
  if(options.method==='POST') return Response.json(confirmation,{status:201});
  if(url.pathname.endsWith('/listings')) {const page=Number(url.searchParams.get('page')),limit=Number(url.searchParams.get('limit'))||12;return Response.json(transform({listings:inventory.slice((page-1)*limit,page*limit),page,total:count,totalPages:Math.max(1,Math.ceil(count/limit))},url));}
  if(url.pathname.includes('/listings/')) {const value=inventory.find(x=>url.pathname.endsWith('/'+x.id));return value ? Response.json(transform(value,url)) : Response.json({message:'Not found'},{status:404});}
  return Response.json(transform(profile(inventory),url));
 };
 return {calls,fetchImpl,inventory};
}
