import {AGENTS} from '../data/agents';
import React, { useState } from 'react';
import { Calculator, Check, ArrowRight } from 'lucide-react';

export default function MortgageCalculator({
  property,
  onContactAdvisor,
  showToast
}) {
  const initialUsdPrice = property?.price || 0;

  // Simple clean states
  const [currency, setCurrency] = useState(property?.currency || 'AED');
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [loanTermYears, setLoanTermYears] = useState(25);
  const [interestRate, setInterestRate] = useState(4.85);
  const [inquirySent, setInquirySent] = useState(false);

  const exchangeRate = 1;
  const currencySymbol = `${property?.currency || ''} `;
  const propertyPrice = Math.round(initialUsdPrice * exchangeRate);

  // Calculations
  const downPaymentAmount = Math.round(propertyPrice * (downPaymentPercent / 100));
  const loanPrincipal = Math.max(0, propertyPrice - downPaymentAmount);

  const monthlyRate = (interestRate / 100) / 12;
  const numberOfMonths = loanTermYears * 12;

  let monthlyPayment = 0;
  if (loanPrincipal > 0 && numberOfMonths > 0) {
    if (monthlyRate === 0) {
      monthlyPayment = loanPrincipal / numberOfMonths;
    } else {
      monthlyPayment = loanPrincipal * 
        (monthlyRate * Math.pow(1 + monthlyRate, numberOfMonths)) / 
        (Math.pow(1 + monthlyRate, numberOfMonths) - 1);
    }
  }

  const totalRepayment = Math.round(monthlyPayment * numberOfMonths);
  const totalInterest = Math.max(0, totalRepayment - loanPrincipal);

  const formatMoney = (amount) => {
    return `${currencySymbol}${Math.round(amount).toLocaleString()}`;
  };

  const handleConsultation = (e) => {
    e.preventDefault();
    onContactAdvisor?.(AGENTS[0]);
  };

  return (
    <div className="w-full bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calculator size={18} className="text-black" />
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Mortgage Calculator
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            Estimate your monthly payments and financing costs for {property?.title}.
          </p>
        </div>

        {/* Currency Switcher */}
        <div className="inline-flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            disabled={property?.currency !== 'AED'} title="Currency conversion unavailable" onClick={() => setCurrency('AED')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              currency === 'AED'
                ? 'bg-black text-white shadow-xs'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            AED (د.إ)
          </button>
          <button
            type="button"
            disabled={property?.currency !== 'USD'} title="Currency conversion unavailable" onClick={() => setCurrency('USD')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              currency === 'USD'
                ? 'bg-black text-white shadow-xs'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            USD ($)
          </button>
        </div>
      </div>

      {/* 2-Column Clean Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Inputs (7 Columns) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Purchase Price Display */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Purchase Price
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-base sm:text-lg font-bold text-gray-900">
              {formatMoney(propertyPrice)}
            </div>
          </div>

          {/* Down Payment */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Down Payment
              </label>
              <span className="text-sm font-bold text-black">
                {formatMoney(downPaymentAmount)} ({downPaymentPercent}%)
              </span>
            </div>

            {/* Quick Percentage Buttons */}
            <div className="grid grid-cols-5 gap-2">
              {[10, 20, 25, 30, 50].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setDownPaymentPercent(pct)}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    downPaymentPercent === pct
                      ? 'bg-black text-white border-black shadow-xs'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-black'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>

            <input
              type="range"
              min="10"
              max="60"
              step="1"
              value={downPaymentPercent}
              onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
              className="w-full accent-black cursor-pointer h-1.5 bg-gray-200 rounded-lg mt-1"
            />
          </div>

          {/* Loan Term */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Loan Term
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[15, 20, 25, 30].map((years) => (
                <button
                  key={years}
                  type="button"
                  onClick={() => setLoanTermYears(years)}
                  className={`py-2.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    loanTermYears === years
                      ? 'bg-black text-white border-black shadow-xs'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-black'
                  }`}
                >
                  {years} Years
                </button>
              ))}
            </div>
          </div>

          {/* Interest Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Interest Rate
              </label>
              <span className="text-sm font-bold text-black">
                {interestRate.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="2.5"
                max="8.5"
                step="0.05"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="flex-1 accent-black cursor-pointer h-1.5 bg-gray-200 rounded-lg"
              />
              <div className="w-20 shrink-0">
                <input
                  type="number"
                  step="0.05"
                  min="1"
                  max="15"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-900 text-center focus:outline-none focus:border-black"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Summary Box (5 Columns) */}
        <div className="lg:col-span-5 bg-stone-50 border border-[#E5E7EB] rounded-2xl p-6 space-y-5">
          <div className="text-center pb-4 border-b border-gray-200">
            <span className="text-xs uppercase tracking-wider text-gray-500 font-mono block mb-1">
              Estimated Monthly Payment
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight">
              {formatMoney(monthlyPayment)}
              <span className="text-xs text-gray-500 font-normal ml-1">/ mo</span>
            </div>
          </div>

          {/* Simple Clean Breakdown */}
          <div className="space-y-2.5 text-xs text-gray-700">
            <div className="flex items-center justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Loan Amount</span>
              <span className="font-bold text-black">{formatMoney(loanPrincipal)}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Down Payment ({downPaymentPercent}%)</span>
              <span className="font-bold text-black">{formatMoney(downPaymentAmount)}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Total Interest</span>
              <span className="font-bold text-black">{formatMoney(totalInterest)}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-gray-500">Total Repayment</span>
              <span className="font-bold text-black">{formatMoney(totalRepayment)}</span>
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-2">
            {inquirySent ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-0.5">
                <div className="flex items-center justify-center gap-1 text-emerald-800 font-bold text-xs">
                  <Check size={14} />
                  <span>Consultation Requested</span>
                </div>
                <p className="text-[11px] text-emerald-700">Our advisor will reach out to you.</p>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleConsultation}
                className="w-full py-3 px-4 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Request Financing Consultation</span>
                <ArrowRight size={13} />
              </button>
            )}
            <p className="text-[10px] text-gray-400 text-center mt-2">
              Estimates are for informational purposes only. Terms subject to lender approval.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
