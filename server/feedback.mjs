// Server-private BrokBuddy feedback adapter. No browser-provided URLs or scope.
import {getConfig, PublicError} from './brokbuddy.mjs';
import {createCredentialGuard} from './template-security.mjs';
export const feedbackId = /^[A-Za-z0-9_-]{1,120}$/;
const unavailable = () => new PublicError(503, 'Client reviews are temporarily unavailable. Please try again.');
const object = v => v && typeof v === 'object' && !Array.isArray(v);
const text = v => typeof v === 'string' ? v : '';
export function getFeedbackConfig(env) {
  const scope = env.BROKBUDDY_FEEDBACK_SCOPE || 'broker';
  if (scope === 'broker') return {...getConfig(env), scope, header:'x-brokbuddy-broker-code'};
  if (scope !== 'agency') throw unavailable();
  // Explicit agency selection uses only that agency's private settings.
  const config = getConfig({BROKBUDDY_API_BASE_URL:env.BROKBUDDY_API_BASE_URL,
    BROKBUDDY_BROKER_PROFILE_SLUG:env.BROKBUDDY_AGENCY_SLUG,
    BROKBUDDY_BROKER_CODE:env.BROKBUDDY_AGENCY_CODE});
  return {...config, scope, header:'x-brokbuddy-agency-code'};
}
async function boundedJson(response) {
  if (Number(response.headers.get('content-length')) > 1_000_000) throw unavailable();
  let size = 0; const chunks = [];
  for await (const chunk of response.body || []) {
    size += chunk.length;
    if (size > 1_000_000) throw unavailable();
    chunks.push(chunk);
  }
  try {return JSON.parse(Buffer.concat(chunks).toString('utf8'));} catch {throw unavailable();}
}
function publicFailure(value, containsCredential) {
  // Preserve useful validation messages, never arbitrary backend payloads/URLs.
  const safe = v => typeof v === 'string' && v.length <= 500 && !containsCredential(v) && !/https?:\/\/|(?:secret|token|password|verifier|stack|authorization)/i.test(v);
  const candidate=value?.message || value?.error;
  const result = {message:safe(candidate) ? candidate : 'Unable to process this review. Please check your details or try again.'};
  if (object(value?.errors)) result.errors = Object.fromEntries(Object.entries(value.errors).filter(([k,v]) => ['name','rating','message','avatar','consent','creditedBrokerId','submissionKey'].includes(k) && (safe(v) || Array.isArray(v) && v.every(safe))));
  return result;
}
export function createFeedbackClient({env=process.env, fetchImpl=fetch, timeoutMs=10000}={}) {
  const containsCredential = createCredentialGuard(env);
  async function request(suffix, {body, range, media=false}={}) {
    const config = getFeedbackConfig(env);
    const base = config.scope === 'agency' ? `/api/public/agency/${config.slug}/feedback` : `/api/public/broker-template/${config.slug}/feedback`;
    if (containsCredential({apiBase:config.base, base, suffix, body, range})) throw new PublicError(400, 'Please check your review.');
    try {
      const response = await fetchImpl(new URL(base + suffix, config.base), {
        method:body ? 'POST':'GET', cache:'no-store', redirect:'error', signal:AbortSignal.timeout(media ? Math.max(timeoutMs,120000):timeoutMs),
        headers:{accept:media ? '*/*':'application/json', [config.header]:config.code,
          ...(body ? {'content-type':'application/json'}:{}), ...(range ? {range}:{})},
        ...(body ? {body:JSON.stringify(body)}:{}),
      });
      if (media && [200,206,416].includes(response.status)) return response;
      if (response.status === 404 && suffix === '/config' && config.scope === 'broker') {
        await response.body?.cancel();
        const error=new PublicError(404,'Client reviews are not enabled.');error.feedbackBody={enabled:false};throw error;
      }
      if (body && response.status===202) {await response.body?.cancel();return {data:{},status:202,scope:config.scope};}
      let data;
      try {data=await boundedJson(response);} catch(error) {if(response.ok) throw error;data={};}
      if (!response.ok) {
        const error = new PublicError(response.status, 'Unable to load client reviews.');
        error.feedbackBody = publicFailure(data, containsCredential);
        throw error;
      }
      if (containsCredential(data) || !object(data)) throw unavailable();
      return {data, status:response.status, scope:config.scope};
    } catch (error) {if (error instanceof PublicError) throw error; throw unavailable();}
  }
  async function config() {
    const {data,scope} = await request('/config');
    if (data.avatarMaxBytes !== 2097152 || data.avatarPixels !== 256 || data.ratingMin !== 1 || data.ratingMax !== 5 || data.messageMaxLength !== 3000 || !Array.isArray(data.ratingFaces) || data.ratingFaces.length !== 5 || data.ratingFaces.some(v=>typeof v!=='string') || !Array.isArray(data.avatarMimeTypes) || data.avatarMimeTypes.some(v=>!['image/jpeg','image/png','image/webp'].includes(v))) throw unavailable();
    const brokers = scope === 'agency' && data.brokerCreditEnabled === true ? data.brokers : [];
    if (!Array.isArray(brokers) || brokers.some(b=>!object(b) || typeof b.id!=='string' || !feedbackId.test(b.id) || typeof b.name !== 'string')) throw unavailable();
    return {enabled:true, scope, avatarMaxBytes:data.avatarMaxBytes, avatarPixels:data.avatarPixels,
      avatarMimeTypes:data.avatarMimeTypes, ratingMin:1, ratingMax:5, ratingFaces:data.ratingFaces,
      messageMaxLength:3000, brokerCreditEnabled:scope==='agency' && data.brokerCreditEnabled===true,
      brokers:brokers.map(({id,name})=>({id,name})), moderationText:text(data.moderationText || data.moderation)};
  }
  async function feed({kind,page,pageSize}) {
    const {data,scope} = await request(`?kind=${kind}&page=${page}&pageSize=${pageSize}`);
    if (!Array.isArray(data.items) || data.items.length > pageSize || !Number.isSafeInteger(data.total) || data.total<0 || data.page!==page || data.pageSize!==pageSize || typeof data.hasMore !== 'boolean') throw unavailable();
    const items = data.items.map(item => {
      if (!object(item) || typeof item.id!=='string' || !feedbackId.test(item.id) || item.kind!==kind || kind==='REVIEW' && (!Number.isInteger(item.rating) || item.rating<1 || item.rating>5)) throw unavailable();
      return {id:item.id, kind, name:text(item.name), rating:kind==='REVIEW' ? item.rating:null,
        message:text(item.message), creditedBrokerName:scope==='agency' ? text(item.creditedBrokerName):'',
        response:text(item.response), featured:item.featured===true, publishedAt:text(item.publishedAt), createdAt:text(item.createdAt),
        source:text(item.source), avatarUrl:`/api/feedback/${item.id}/avatar`,
        ...(kind==='VIDEO' ? {videoUrl:`/api/feedback/${item.id}/video`,videoMime:['video/mp4','video/webm'].includes(item.videoMime) ? item.videoMime:null,videoSize:Number.isSafeInteger(item.videoSize) ? item.videoSize:null}:{}),
      };
    });
    const summary=data.ratingSummary;
    const average=summary?.average ?? summary?.averageRating ?? null;
    const count=summary?.count ?? summary?.total ?? summary?.totalReviews ?? null;
    return {items,total:data.total,page,pageSize,hasMore:data.hasMore,
      ratingSummary:{average:typeof average==='number' && average>=1 && average<=5 ? average:null,count:Number.isSafeInteger(count) && count>=0 ? count:null},disclosure:text(data.disclosure)};
  }
  async function submit(body) {
    const result = await request('', {body});
    if (result.status !== 202) throw new PublicError(502,'Receipt could not be confirmed. Please retry your review.');
    return {message:'Thank you. Your review has been submitted for review.'};
  }
  async function media(id, type, range) {
    if (typeof id!=='string' || !feedbackId.test(id) || !['avatar','video'].includes(type)) throw new PublicError(404,'Not found.');
    const result=await request(`/${id}/${type}`,{range,media:true});
    if (!(result instanceof Response) && !result?.headers) throw unavailable();
    const publicHeaders=Object.fromEntries(['content-type','content-length','content-range','accept-ranges'].map(name=>[name,result.headers.get(name)]));
    if (containsCredential(publicHeaders)) {await result.body?.cancel();throw unavailable();}
    const mime=result.headers.get('content-type')?.split(';')[0];
    if (result.status!==416 && !(type==='avatar' ? mime==='image/webp' : ['video/mp4','video/webm'].includes(mime))) {await result.body?.cancel();throw unavailable();}
    return result;
  }
  return {config,feed,submit,media};
}
