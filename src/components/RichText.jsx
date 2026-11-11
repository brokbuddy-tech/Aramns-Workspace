import React from 'react';
import DOMPurify from 'dompurify';
import {marked} from 'marked';
export function richTextHtml(value) {
  let text=typeof value==='string' ? value : '';
  for(let pass=0;pass<4 && /&(?:amp;)*(?:lt|gt|quot|#\d+|#x[\da-f]+);/i.test(text);pass++) {
    // DOMParser does not execute scripts, fetch media or attach nodes to the page.
    text=new DOMParser().parseFromString(text.replaceAll('<','&lt;').replaceAll('>','&gt;'),'text/html').body.textContent || '';
  }
  return DOMPurify.sanitize(marked.parse(text,{breaks:true,gfm:true}),{
    ALLOWED_TAGS:['p','br','strong','em','b','i','ul','ol','li','h1','h2','h3','h4','h5','h6','blockquote','a','code','pre','hr','div','span'],
    ALLOWED_ATTR:['href','title'],FORBID_TAGS:['style','script','iframe','form','svg','math'],
  });
}
export function plainText(value) {
  return new DOMParser().parseFromString(richTextHtml(value), 'text/html').body.textContent || '';
}
export default function RichText({value}) {
  return <div dangerouslySetInnerHTML={{__html:richTextHtml(value)}} />;
}
