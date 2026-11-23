import {validSingleLine,validPhone} from './inquiry-validation.mjs';

export const visitorTypes=[['broker','Broker'],['customer','Customer'],['under18','Below 18']];
export const occupantTypes=['Married couple','Family','Unmarried couple','Solo male','Solo female','Group of men','Group of women','Mixed-gender group'];
export const residentialTypes=['Apartment','Villa','Townhouse','Penthouse','Residential land'];
export const commercialTypes=['Office','Shop / Retail','Warehouse','Showroom','Labour camp','Commercial land','Commercial building'];
export const completionOptions=['Any','Ready','Off-plan'];
export const purposeOptions=['Not decided','Own business','Investment'];
export const emptyRequirements={propertyType:'',readiness:'Any',purpose:'Not decided',occupants:''};

export function contactErrors(step,details,requirements=emptyRequirements) {
  const errors={};
  if(step===0) {
    if(!validSingleLine(details.nationality,2,80) || !/\p{L}/u.test(details.nationality)) errors.nationality='Enter your nationality using 2–80 characters.';
    if(!visitorTypes.some(([key])=>key===details.visitorType)) errors.visitorType='Choose an option.';
  }
  if(step===1) {
    if(!validSingleLine(details.name,2,120) || !/\p{L}/u.test(details.name)) errors.name='Enter your name using 2–120 characters.';
    if(!validPhone(details.phone)) errors.phone='Enter a valid phone number with 7–15 digits, including your country code.';
    if(!['buy','rent'].includes(details.service)) errors.service='Choose Buy property or Rent property.';
  }
  if(step===2) {
    if(!['residential','commercial'].includes(details.sector)) errors.sector='Choose Residential or Commercial.';
    if(!(details.sector==='residential' ? residentialTypes : commercialTypes).includes(requirements.propertyType)) errors.propertyType='Choose a property type.';
    if(details.service==='buy' && details.sector==='residential' && !completionOptions.includes(requirements.readiness)) errors.readiness='Choose a completion status.';
    if(details.service==='buy' && details.sector==='commercial' && !purposeOptions.includes(requirements.purpose)) errors.purpose='Choose a purpose.';
    if(details.service==='rent' && details.sector==='residential' && !occupantTypes.includes(requirements.occupants)) errors.occupants='Choose who will live here.';
  }
  return errors;
}

export function contactSummary(details,requirements) {
  const buy=details.service==='buy',residential=details.sector==='residential';
  return [
    ['Nationality',details.nationality.trim()],['You are',visitorTypes.find(([key])=>key===details.visitorType)?.[1] || ''],
    ['Name',details.name.trim()],['Phone number',details.phone.trim()],
    ['Service',`${buy ? 'Buy' : 'Rent'} property`],['Property category',residential ? 'Residential' : 'Commercial'],
    ['Property type',requirements.propertyType],
    ...(buy ? [[residential ? 'Completion status' : 'Purpose',residential ? requirements.readiness : requirements.purpose]] : residential ? [['Occupants',requirements.occupants]] : []),
  ];
}

export function buildContactInquiry(details,requirements) {
  if([0,1,2].some(step=>Object.keys(contactErrors(step,details,requirements)).length)) throw new Error('Please check your enquiry.');
  const summary=contactSummary(details,requirements);
  const keys={'Nationality':'nationality','You are':'visitorType','Name':'name','Phone number':'phone','Service':'service','Property category':'sector','Property type':'propertyType','Completion status':'readiness','Purpose':'purpose','Occupants':'occupants'};
  return {
    name:details.name.trim(),phone:details.phone.trim(),propertyType:requirements.propertyType,
    nationality:details.nationality.trim(),transactionType:details.service,
    specialNotes:summary.map(([label,value])=>({key:keys[label],label,value})),
    // Keep readable notes for API versions that predate structured answers.
    message:[`Contact enquiry: ${details.service==='buy' ? 'Buy' : 'Rent'} ${details.sector}`, ...summary.map(([label,value])=>`${label}: ${value}`)].join('\n'),
  };
}
