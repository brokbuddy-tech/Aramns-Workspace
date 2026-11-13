import React from 'react';

function Block({ className = '' }) {
  return <div className={`skeleton-block rounded-lg ${className}`} />;
}

function Copy({ centered = false }) {
  return (
    <div className={`space-y-4 ${centered ? 'mx-auto flex max-w-3xl flex-col items-center' : 'max-w-3xl'}`}>
      <Block className="h-3 w-32" />
      <Block className="h-9 w-full max-w-xl sm:h-12" />
      <Block className="h-4 w-full max-w-lg" />
      <Block className="h-4 w-2/3 max-w-sm" />
    </div>
  );
}

function Cards({ portraits = false, count = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
          <Block className={`${portraits ? 'aspect-[4/5]' : 'aspect-[4/3]'} !rounded-none`} />
          <div className="space-y-4 p-5">
            <Block className="h-3 w-1/3" />
            <Block className="h-6 w-3/4" />
            <Block className="h-3 w-1/2" />
            <div className="flex gap-4 border-t border-black/5 pt-4">
              {[0, 1, 2].map(item => <Block key={item} className="h-4 w-16" />)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Filters() {
  return (
    <div className="grid grid-cols-2 gap-4 rounded-2xl border border-black/[0.06] bg-white p-5 sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="space-y-3">
          <Block className="h-2 w-16" />
          <Block className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

function Content({ variant }) {
  if (variant === 'home' || variant === 'content') {
    return (
      <>
        <div className={`flex flex-col items-center justify-end bg-[#eae7e1] px-5 pb-12 pt-24 sm:px-10 sm:pb-20 ${variant === 'home' ? 'min-h-[540px] sm:min-h-[620px] lg:min-h-[calc(100svh-88px)]' : 'min-h-[440px] sm:min-h-[500px]'}`}>
          <div className="w-full max-w-4xl space-y-10">
            <Copy centered />
            {variant === 'home' && (
              <div className="space-y-5 rounded-2xl border border-black/5 bg-white/70 p-5 sm:p-6">
                <div className="flex gap-3">
                  <Block className="h-8 w-20" /><Block className="h-8 w-20" />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Block className="h-12" /><Block className="h-12" /><Block className="h-12" />
                </div>
                <Block className="h-12" />
              </div>
            )}
          </div>
        </div>
        <div className="skeleton-container space-y-10 py-14">
          <Copy />
          {variant === 'home' ? <Cards count={3} /> : (
            <div className="grid gap-8 md:grid-cols-2">
              <Block className="min-h-72" />
              <div className="space-y-5"><Copy /><Block className="h-24" /><Block className="h-12 w-40" /></div>
            </div>
          )}
        </div>
      </>
    );
  }

  if (variant === 'map') {
    return (
      <div className="flex min-h-[calc(100svh-88px)] flex-col gap-5 p-4 sm:p-6">
        <Filters />
        <div className="grid flex-1 gap-5 lg:grid-cols-[380px_1fr]">
          <div className="hidden space-y-5 lg:block"><Cards count={1} /><Block className="h-36" /></div>
          <Block className="min-h-[55svh] !rounded-2xl" />
        </div>
      </div>
    );
  }

  if (variant === 'property' || variant === 'profile' || variant === 'article') {
    return (
      <div className="skeleton-container space-y-8 py-8 sm:py-12">
        <Block className="h-3 w-40" />
        {variant === 'profile' ? (
          <div className="grid gap-8 lg:grid-cols-[5fr_7fr]">
            <Block className="h-[380px] sm:h-[430px] !rounded-2xl" />
            <div className="space-y-8 py-4"><Copy /><Block className="h-28" /><Filters /><Block className="h-12 w-44" /></div>
          </div>
        ) : (
          <>
            <Copy centered={variant === 'article'} />
            <Block className="h-[300px] sm:h-[480px] !rounded-2xl" />
            {variant === 'property' && (
              <div className="grid grid-cols-4 gap-3">
                {[0, 1, 2, 3].map(item => <Block key={item} className="h-16 sm:h-24" />)}
              </div>
            )}
            <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
              <div className="space-y-6"><Copy /><Block className="h-24" /></div>
              <Block className="h-64 !rounded-2xl" />
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="skeleton-container space-y-10 py-12 sm:py-16">
      <Copy />
      <Filters />
      <div className="flex items-center justify-between gap-4"><Block className="h-4 w-40" /><Block className="h-9 w-24" /></div>
      <Cards portraits={variant === 'agents'} />
    </div>
  );
}

export default function PageSkeleton({ variant = 'home' }) {
  return (
    <div className="min-h-screen bg-[#F9F9F8]">
      <div role="status" className="sr-only">Loading page…</div>
      <div aria-hidden="true">
        <div className="flex h-[72px] items-center justify-between gap-6 border-b border-black/[0.06] bg-white px-4 sm:h-[88px] sm:px-8 lg:px-12">
          <div className="flex items-center gap-3"><Block className="h-10 w-10 !rounded-full" /><Block className="h-5 w-28 sm:w-40" /></div>
          <div className="hidden items-center gap-7 lg:flex">
            {[0, 1, 2, 3].map(item => <Block key={item} className="h-3 w-16" />)}
          </div>
          <Block className="h-10 w-10 sm:w-32" />
        </div>
        <Content variant={variant} />
      </div>
    </div>
  );
}
