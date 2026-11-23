export const FEEDBACK_UNAVAILABLE = 'Client reviews are temporarily unavailable. Please try again later.';

export async function readFeedbackJson(url, options={}) {
  let response;
  try {response=await fetch(url,{cache:'no-store',credentials:'same-origin',...options});}
  catch (cause) {const error=new Error(FEEDBACK_UNAVAILABLE,{cause});error.status=503;throw error;}
  let data;
  try {data=await response.json();} catch {const error=new Error(FEEDBACK_UNAVAILABLE);error.status=503;throw error;}
  if (!response.ok) {
    const details=data?.errors && Object.values(data.errors).flat().filter(value=>typeof value==='string').join(' ');
    const error=new Error([typeof data?.message==='string' ? data.message:'',details].filter(Boolean).join(' ') || (response.status===429 ? 'Too many reviews. Please try again later.':FEEDBACK_UNAVAILABLE));
    error.status=response.status;error.disabled=data?.enabled===false;throw error;
  }
  return {data,status:response.status};
}

export function isFeedbackConfigAvailable(config) {
  return config?.enabled===true && ['broker','agency'].includes(config.scope)
    && config.avatarMaxBytes===2097152 && config.messageMaxLength===3000
    && Array.isArray(config.avatarMimeTypes) && config.avatarMimeTypes.length>0
    && config.avatarMimeTypes.every(type=>['image/jpeg','image/png','image/webp'].includes(type))
    && Array.isArray(config.ratingFaces) && config.ratingFaces.length===5
    && config.ratingFaces.every(face=>typeof face==='string' && face.trim())
    && (!config.brokerCreditEnabled || config.scope!=='agency' || Array.isArray(config.brokers)
      && config.brokers.every(broker=>typeof broker?.id==='string' && broker.id.trim() && typeof broker.name==='string' && broker.name.trim()));
}
