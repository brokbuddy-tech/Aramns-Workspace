// Shared by the form and the Node proxy; Unicode names remain plain text.
const invalidUnicode = /[\u007f-\u009f\u202a-\u202e\u2066-\u2069]|\p{Cs}/u;
export function validSingleLine(value, min=0, max=120) {
  return typeof value==='string' && value.trim().length>=min && value.trim().length<=max && !/[\u0000-\u001f\u2028\u2029]/u.test(value) && !invalidUnicode.test(value);
}
export function validPhone(value) {
  if(!validSingleLine(value,1,40) || !/^\+?[0-9\s().-]+$/u.test(value.trim())) return false;
  const digits=value.replace(/\D/gu,'');
  return digits.length>=7 && digits.length<=15;
}
export function validMessage(value) {
  return typeof value==='string' && value.trim().length>=10 && value.trim().length<=4000 && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(value) && !invalidUnicode.test(value);
}
