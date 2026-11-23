import {hasDisplayValue} from '../lib/display-data.mjs';
import React, {useEffect, useRef, useState} from 'react';
import {ArrowLeft, ArrowRight, Check, CheckCircle2, Mail, Phone} from 'lucide-react';
import {useInquiry} from '../lib/inquiry';
import {AGENTS} from '../data/agents';
import InquiryError from './InquiryError';
import './ContactPage.css';
import {visitorTypes,occupantTypes,residentialTypes,commercialTypes,completionOptions,purposeOptions,emptyRequirements,contactErrors,contactSummary,buildContactInquiry} from '../lib/contact-workflow.mjs';

const emptyDetails = {nationality:'', visitorType:'', name:'', phone:'', service:'', sector:''};
const titles = ['What is your nationality?', 'Your details', 'What kind of property?', 'Review your enquiry'];

function Choices({legend, name, value, options, onChange, hideLegend=false}) {
  return <fieldset className="contact-choices">
    <legend className={hideLegend ? 'sr-only' : undefined}>{legend} <span aria-hidden="true">*</span></legend>
    <div className="contact-choice-options">{options.map(([key,label]) => <label key={key} className={value === key ? 'is-selected' : ''}>
      <input type="radio" name={name} value={key} checked={value === key} required onChange={() => onChange(key)}/>
      <span>{label}</span>{value === key && <Check size={14} aria-hidden="true"/>}
    </label>)}</div>
  </fieldset>;
}

function Field({label, name, value, onChange, options, required=false, hideLabel=false, ...props}) {
  return <label className="contact-field" htmlFor={`contact-${name}`}>
    <span className={hideLabel ? 'sr-only' : undefined}>{label}{required && <span aria-hidden="true"> *</span>}</span>
    {options ? <select id={`contact-${name}`} name={name} value={value} required={required} onChange={event => onChange(name,event.target.value)} {...props}>
      {required && <option value="" disabled>Select an option</option>}
      {options.map(option => <option key={option} value={option}>{option}</option>)}
    </select> : <input id={`contact-${name}`} name={name} value={value} required={required} onChange={event => onChange(name,event.target.value)} onBlur={event => onChange(name,event.target.value.trim())} {...props}/>}
  </label>;
}

export default function ContactPage() {
  const inquiry = useInquiry();
  const [step,setStep] = useState(0);
  const [details,setDetails] = useState(emptyDetails);
  const [workflows,setWorkflows] = useState({});
  const [isSuccess,setIsSuccess] = useState(false);
  const [showError,setShowError] = useState(false);
  const heading = useRef(null);
  const card = useRef(null);
  const workflowKey = `${details.service}-${details.sector}`;
  const requirements = workflows[workflowKey] || emptyRequirements;
  const isBuy = details.service === 'buy';
  const isResidential = details.sector === 'residential';
  const workflowTitle = `${isBuy ? 'Buy' : 'Rent'} ${isResidential ? 'residential' : 'commercial'}`;
  const updateDetails = (name,value) => {
    setShowError(false);
    setDetails(previous => ({...previous,[name]:value,...(name === 'service' && previous.service !== value ? {sector:''} : {})}));
  };
  const updateRequirements = (name,value) => {
    setShowError(false);
    setWorkflows(previous => ({...previous,[workflowKey]:{...(previous[workflowKey] || emptyRequirements),[name]:value}}));
  };
  const summary = contactSummary(details,requirements);
  const reviewSummary = summary.filter(([label,value]) => !['Service','Property category'].includes(label) && !['Any','Not decided'].includes(value));

  useEffect(() => {
    heading.current?.focus({preventScroll:true});
    if (card.current?.getBoundingClientRect().top < 90) card.current.scrollIntoView({block:'start',behavior:'smooth'});
  },[step,isSuccess]);

  const handleSubmit = async event => {
    event.preventDefault();
    if (inquiry.pending) return;
    if (step < 3) {
      const errors=contactErrors(step,details,requirements);
      for(const control of event.currentTarget.elements) control.setCustomValidity?.(errors[control.name] || '');
      if(Object.keys(errors).length) {event.currentTarget.reportValidity();return;}
      // Repeated events in the same render can only advance to this next form.
      setStep(step+1);return;
    }
    const invalidStep=[0,1,2].find(index=>Object.keys(contactErrors(index,details,requirements)).length);
    if(invalidStep!==undefined) {setStep(invalidStep);return;}
    setShowError(false);
    const sent = await inquiry.submit(buildContactInquiry(details,requirements));
    if (!sent) {setShowError(true);return;}
    setIsSuccess(true);
  };

  return <div className="contact-page">
    <section className="bg-[#0A0A0C] text-white pt-32 sm:pt-36 pb-12">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
        <p className="text-[11px] uppercase tracking-[0.18em] text-bronze-light mb-3">Contact us</p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Let’s find your next property.</h1>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/80">
          {hasDisplayValue(AGENTS[0]?.phone) && <a href={`tel:${AGENTS[0].phone}`} className="inline-flex items-center gap-2 hover:text-white"><Phone size={14} className="text-bronze-light"/>{AGENTS[0].phone}</a>}
          {hasDisplayValue(AGENTS[0]?.email) && <a href={`mailto:${AGENTS[0].email}`} className="inline-flex items-center gap-2 hover:text-white"><Mail size={14} className="text-bronze-light"/>{AGENTS[0].email}</a>}
        </div>
      </div>
    </section>

    <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-10">
      <div ref={card} className="contact-card">
        {isSuccess ? <div className="contact-success">
          <CheckCircle2 size={34} className="text-bronze" aria-hidden="true"/>
          <h2 ref={heading} tabIndex={-1}>Enquiry received</h2>
          <p>Thank you, {details.name.trim()}. The broker will contact you on {details.phone.trim()}.</p>
          <button type="button" className="contact-secondary" onClick={() => {setDetails(emptyDetails);setWorkflows({});setShowError(false);setStep(0);setIsSuccess(false);}}>Start a new enquiry</button>
        </div> : <>
          <div className="contact-form-header">
            <h2 ref={heading} tabIndex={-1}>{titles[step]}</h2>
          </div>
          <form aria-label="Contact enquiry" onSubmit={handleSubmit} onInput={event => event.target.setCustomValidity?.('')}>
            <fieldset className="contact-form-fields" disabled={inquiry.pending}>
              {step === 0 && <div className="contact-nationality">
                <Field label="Nationality" name="nationality" value={details.nationality} onChange={updateDetails} required hideLabel minLength={2} maxLength={80} autoComplete="off" placeholder="e.g. Emirati, Indian, British"/>
                <Choices legend="You are" name="visitorType" value={details.visitorType} options={visitorTypes} onChange={value => updateDetails('visitorType',value)}/>
              </div>}
              {step === 1 && <>
                <div className="contact-grid">
                  <Field label="Full name" name="name" value={details.name} onChange={updateDetails} required minLength={2} maxLength={120} autoComplete="name"/>
                  <Field label="Phone number" name="phone" value={details.phone} onChange={updateDetails} required type="tel" maxLength={40} autoComplete="tel" placeholder="+971 50 000 0000"/>
                </div>
                <Choices legend="What service do you want?" name="service" value={details.service} options={[["buy","Buy property"],["rent","Rent property"]]} onChange={value => updateDetails('service',value)}/>
              </>}
              {step === 2 && <>
                <Choices legend="What kind of property?" name="sector" value={details.sector} options={[["residential","Residential"],["commercial","Commercial"]]} onChange={value => updateDetails('sector',value)} hideLegend/>
                {details.sector && <div className="contact-workflow" key={workflowKey}>
                  <div className="contact-grid">
                    <Field label="Property type" name="propertyType" value={requirements.propertyType} onChange={updateRequirements} required options={isResidential ? residentialTypes : commercialTypes}/>
                    {isBuy ? (isResidential
                      ? <Field label="Completion status" name="readiness" value={requirements.readiness} onChange={updateRequirements} options={completionOptions}/>
                      : <Field label="Purpose" name="purpose" value={requirements.purpose} onChange={updateRequirements} options={purposeOptions}/>) : isResidential
                      ? <Field label="Who will live here?" name="occupants" value={requirements.occupants} onChange={updateRequirements} required options={occupantTypes}/> : null}
                  </div>
                </div>}
              </>}
              {step === 3 && <>
                <div className="contact-review"><div className="contact-review-title"><span>{workflowTitle}</span><button type="button" onClick={() => setStep(2)}>Edit requirements</button></div>
                  <dl>{reviewSummary.map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
                </div>
                <p className="contact-hint">By sending this enquiry, you agree to be contacted about your property requirements.</p>
                <InquiryError message={showError ? inquiry.error : ''}/>
              </>}
              <div className="contact-form-actions">
                {step > 0 && <button type="button" className="contact-secondary" onClick={() => {setShowError(false);setStep(Math.max(0,step-1));}}><ArrowLeft size={14} aria-hidden="true"/>Back</button>}
                <button type="submit" className="contact-primary">{inquiry.pending ? 'Sending enquiry…' : step === 3 ? 'Send enquiry' : 'Continue'}<ArrowRight size={14} aria-hidden="true"/></button>
              </div>
            </fieldset>
          </form>
        </>}
      </div>
    </section>
  </div>;
}
