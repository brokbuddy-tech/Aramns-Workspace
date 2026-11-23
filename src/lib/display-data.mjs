// Missing API fields and legacy placeholders should never become visible metrics.
export function hasDisplayValue(value) {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0;
  if (Array.isArray(value)) return value.some(hasDisplayValue);
  if (typeof value !== 'string') return false;
  const text = value.replace(/<[^>]*>/gu, '').replace(/&nbsp;|&#160;/giu, ' ').trim();
  return Boolean(text) && !/^(?:[-–—]+|n\/?a|not (?:available|provided|specified)|unavailable|unknown|null|undefined)$/iu.test(text);
}

export function displayValues(value) {
  return (Array.isArray(value) ? value : []).filter(hasDisplayValue);
}

export function firstDisplayValue(...values) {
  return values.find(hasDisplayValue);
}

export function propertySummaryMetrics(property = {}) {
  return [
    {key:'beds', label:'Beds', value:property.beds},
    {key:'baths', label:'Baths', value:property.baths},
    {key:'sqft', label:'sqft', value:property.sqft},
  ].filter(metric => hasDisplayValue(metric.value)).map(metric => ({
    ...metric,
    text:`${typeof metric.value === 'number' ? metric.value.toLocaleString('en-US') : metric.value} ${metric.label}`,
  }));
}
