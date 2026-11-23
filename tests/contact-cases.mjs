import {visitorTypes,residentialTypes,commercialTypes,occupantTypes,completionOptions,purposeOptions,emptyRequirements} from '../src/lib/contact-workflow.mjs';

// Every combination of the currently available choices: 3 × (15 + 21 + 40 + 7).
export function* contactCases() {
  for(const [visitorType] of visitorTypes) for(const service of ['buy','rent']) for(const sector of ['residential','commercial']) {
    const types=sector==='residential' ? residentialTypes : commercialTypes;
    const choices=service==='buy' ? sector==='residential' ? completionOptions : purposeOptions : sector==='residential' ? occupantTypes : [''];
    for(const propertyType of types) for(const choice of choices) {
      const details={nationality:'Emirati',visitorType,name:'Synthetic Visitor',phone:'+971500000000',service,sector};
      const requirements={...emptyRequirements,propertyType};
      if(service==='buy') requirements[sector==='residential' ? 'readiness' : 'purpose']=choice;
      else if(sector==='residential') requirements.occupants=choice;
      yield {details,requirements};
    }
  }
}
