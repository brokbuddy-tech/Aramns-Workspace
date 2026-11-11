import React from 'react';
export default function InquiryError({message}) {
  return message ? <p role="alert" className="text-xs text-[#64748B]">{message}</p> : null;
}
