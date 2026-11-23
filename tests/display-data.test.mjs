import {test} from 'node:test';
import assert from 'node:assert/strict';
import {hasDisplayValue,displayValues,firstDisplayValue,propertySummaryMetrics} from '../src/lib/display-data.mjs';

test('missing public fields and placeholders are hidden, while supplied zero values remain visible',()=>{
  for (const value of [undefined,null,'','  ','—','–','-','N/A','n/a','Not available','not provided','not specified','unknown','null','undefined',NaN,Infinity,-1,{},false,[],['','—'], '<p>&nbsp;</p>']) {
    assert.equal(hasDisplayValue(value),false,`Unexpected value: ${String(value)}`);
  }
  for (const value of [0,'0','0 years','English','None','BRN-123',['','English']]) assert.equal(hasDisplayValue(value),true);
  assert.deepEqual(displayValues([' ',null,'—','English','Arabic']),['English','Arabic']);
  assert.equal(firstDisplayValue('—','',null,'Villa'),'Villa');
});

test('listing summaries omit individual missing metrics without inventing values or discarding zero bedrooms',()=>{
  assert.deepEqual(propertySummaryMetrics({beds:null,baths:'—',sqft:undefined}),[]);
  assert.deepEqual(propertySummaryMetrics({beds:0,baths:null,sqft:1250}).map(metric=>metric.text),['0 Beds','1,250 sqft']);
  assert.deepEqual(propertySummaryMetrics({beds:2,baths:0,sqft:0}).map(metric=>metric.text),['2 Beds','0 Baths','0 sqft']);
});
