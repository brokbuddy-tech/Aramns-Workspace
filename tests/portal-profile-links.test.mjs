import {test} from 'node:test';
import assert from 'node:assert/strict';
import {portalProfileLinks} from '../src/lib/portal-profile-links.mjs';

test('profile buttons and footer share only saved broker portal links',()=>{
 const agent={portalLinks:{propertyfinder:'https://www.propertyfinder.ae/en/agent/example-123',bayut:'https://www.bayut.com/brokers/example-456.html',dubizzle:'https://dubai.dubizzle.com/profile/example/'}};
 assert.deepEqual(portalProfileLinks(agent).map(x=>x.href),Object.values(agent.portalLinks));
 assert.deepEqual(portalProfileLinks({}),[]);
 assert.deepEqual(portalProfileLinks({portalLinks:{propertyfinder:'javascript:alert(1)',bayut:'https://bayut.com.evil.test/brokers/example-123.html',dubizzle:'https://dubizzle.com/'}}),[]);
 const other={portalLinks:{bayut:'https://www.bayut.com/brokers/other-789.html'}};
 assert.deepEqual(portalProfileLinks(other),[{brand:'bayut',name:'Bayut',href:other.portalLinks.bayut}]);
});
