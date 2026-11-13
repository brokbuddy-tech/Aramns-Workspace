import React, {useEffect, useId, useMemo, useRef, useState} from 'react';
import {ChevronLeft, ChevronRight, Grid2X2, ImageOff, Images, X, ZoomIn, ZoomOut} from 'lucide-react';
import './PropertyPhotoGallery.css';

const EMPTY_PHOTOS = [];

function GalleryImage({src, alt, ...props}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (failed) return <span className="property-photo-unavailable" role="img" aria-label={`${alt} unavailable`}><ImageOff size={24} /><span>Photo unavailable</span></span>;
  return <img src={src} alt={alt} {...props} onError={() => setFailed(true)} />;
}

export default function PropertyPhotoGallery({images = EMPTY_PHOTOS, title}) {
  const photos = useMemo(() => [...new Set((Array.isArray(images) ? images : EMPTY_PHOTOS).filter(url => typeof url === 'string' && url.trim()))], [images]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [grid, setGrid] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const dialogRef = useRef(null);
  const thumbnailRef = useRef(null);
  const stageRef = useRef(null);
  const zoomButtonRef = useRef(null);
  const touchRef = useRef(null);
  const headingId = useId();
  const instructionsId = useId();
  const photoCount = photos.length;
  const current = Math.min(activeIndex, Math.max(0, photoCount - 1));

  const openGallery = (index = current) => {
    setActiveIndex(index);
    setGrid(false);
    setZoomed(false);
    setOpen(true);
  };
  const selectPhoto = index => {
    setActiveIndex(index);
    setZoomed(false);
    setGrid(false);
  };
  const step = offset => {
    setActiveIndex(index => (index + offset + photoCount) % photoCount);
    setZoomed(false);
  };

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open || grid) return;
    thumbnailRef.current?.scrollIntoView({block:'nearest', inline:'nearest'});
    const stage = stageRef.current;
    stage?.scrollTo({left:zoomed ? stage.clientWidth / 2 : 0, top:zoomed ? stage.clientHeight / 2 : 0});
  }, [open, current, grid, zoomed]);

  const handleKeyDown = event => {
    if (event.key === 'Tab') {
      const controls = [...dialogRef.current.querySelectorAll('button:not([disabled]), [tabindex="0"]')].filter(element => element.getClientRects().length);
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {event.preventDefault();last?.focus();}
      if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first?.focus();}
      return;
    }
    if (grid || event.altKey || event.ctrlKey || event.metaKey || photoCount < 2) return;
    if (event.key === 'ArrowRight') {event.preventDefault();step(1);}
    if (event.key === 'ArrowLeft') {event.preventDefault();step(-1);}
    if (event.key === 'Home') {event.preventDefault();selectPhoto(0);}
    if (event.key === 'End') {event.preventDefault();selectPhoto(photoCount - 1);}
  };

  return (
    <section className="property-photo-gallery" aria-label="Property photos">
      {photoCount === 0 ? (
        <div className="property-photo-empty"><ImageOff size={32} /><p>No photos available</p></div>
      ) : (
        <>
          <div className="property-photo-hero">
            <button type="button" className="property-photo-hero-image" onClick={() => openGallery()} aria-label="Open photo gallery">
              <GalleryImage src={photos[current]} alt={title} fetchPriority="high" />
            </button>
            <span className="property-photo-count">Photo {current + 1} of {photoCount}</span>
          </div>
          {photoCount > 1 && (
            <div className="property-photo-preview" aria-label="Photo previews" style={{gridTemplateColumns:`repeat(${Math.min(photoCount,4)}, minmax(0, 1fr))`}}>
              {photos.slice(0,4).map((src, index) => {
                return (
                  <button type="button" key={src}
                    onClick={() => selectPhoto(index)}
                    aria-label={`Preview photo ${index + 1}`}
                    aria-pressed={current === index}
                    className={`property-photo-preview-button ${current === index ? 'is-selected' : ''}`}>
                    <GalleryImage src={src} alt="" loading="lazy" />
                  </button>
                );
              })}
            </div>
          )}
          <div className="property-photo-actions">
            <button type="button" className="property-photo-open" onClick={() => openGallery()} aria-label={`View all photos (${photoCount})`}>
              <Images size={17} /><span>View all photos</span><span className="property-photo-total">{photoCount}</span>
            </button>
          </div>
        </>
      )}

      <dialog ref={dialogRef} className="property-photo-dialog" aria-labelledby={headingId} aria-describedby={instructionsId}
        onCancel={() => setOpen(false)} onClose={() => setOpen(false)} onKeyDown={handleKeyDown}>
        {open && (
          <div className="property-photo-dialog-content">
            <header className="property-photo-header">
              <div className="property-photo-heading">
                <h2 id={headingId}>{title} — {grid ? `${photoCount} photos` : `${current + 1} / ${photoCount}`}</h2>
                <p id={instructionsId}>{grid ? 'Choose a photo to view it.' : 'Swipe or use arrow keys to browse. Esc to close.'}</p>
              </div>
              <button type="button" className="property-photo-icon-button" onClick={() => setOpen(false)} aria-label="Close photo gallery" autoFocus><X size={22} /></button>
            </header>

            <div className="property-photo-toolbar">
              <span role="status" aria-live="polite" aria-atomic="true">{grid ? `${photoCount} photos` : `Photo ${current + 1} of ${photoCount}`}</span>
              <div className="property-photo-tools">
                {!grid && <button type="button" ref={zoomButtonRef} onClick={() => setZoomed(value => !value)} aria-pressed={zoomed}>
                  {zoomed ? <ZoomOut size={18} /> : <ZoomIn size={18} />}<span>{zoomed ? 'Zoom out' : 'Zoom in'}</span>
                </button>}
                {photoCount > 1 && <button type="button" onClick={() => {setGrid(value => !value);setZoomed(false);}} aria-pressed={grid}>
                  <Grid2X2 size={17} /><span>{grid ? 'Photo viewer' : 'Photo grid'}</span>
                </button>}
              </div>
            </div>

            {grid ? (
              <div className="property-photo-grid" aria-label="All property photos">
                {photos.map((src, index) => (
                  <button type="button" key={src} onClick={() => {selectPhoto(index);requestAnimationFrame(() => zoomButtonRef.current?.focus());}} aria-label={`Open photo ${index + 1}`}>
                    <GalleryImage src={src} alt={`${title} — photo ${index + 1}`} loading="lazy" />
                    <span className="property-photo-grid-number">{index + 1}</span>
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className={`property-photo-viewer ${zoomed ? 'is-zoomed' : ''}`}
                  onTouchStart={event => {touchRef.current = event.touches.length === 1 && !zoomed ? {x:event.touches[0].clientX,y:event.touches[0].clientY} : null;}}
                  onTouchMove={event => {if (event.touches.length !== 1) touchRef.current = null;}}
                  onTouchCancel={() => {touchRef.current = null;}}
                  onTouchEnd={event => {
                    const start = touchRef.current;
                    touchRef.current = null;
                    if (!start || zoomed || photoCount < 2) return;
                    const deltaX = event.changedTouches[0].clientX - start.x;
                    const deltaY = event.changedTouches[0].clientY - start.y;
                    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) step(deltaX < 0 ? 1 : -1);
                  }}>
                  <div ref={stageRef} className={`property-photo-stage ${zoomed ? 'is-zoomed' : ''}`} tabIndex={zoomed ? 0 : undefined}
                    role={zoomed ? 'region' : undefined} aria-label={zoomed ? 'Zoomed photo, scroll to explore' : undefined}>
                    <div className="property-photo-canvas">
                      <GalleryImage src={photos[current]} alt={`${title} — photo ${current + 1}`} draggable={false} />
                    </div>
                  </div>
                  {photoCount > 1 && <>
                    <button type="button" className="property-photo-arrow property-photo-previous" onClick={() => step(-1)} aria-label="Previous photo"><ChevronLeft size={25} /></button>
                    <button type="button" className="property-photo-arrow property-photo-next" onClick={() => step(1)} aria-label="Next photo"><ChevronRight size={25} /></button>
                  </>}
                </div>
                {photoCount > 1 && (
                  <div className="property-photo-filmstrip" aria-label="Gallery thumbnails">
                    {photos.map((src, index) => (
                      <button type="button" key={src} ref={current === index ? thumbnailRef : null}
                        onClick={() => selectPhoto(index)} aria-label={`Go to photo ${index + 1}`} aria-current={current === index ? 'true' : undefined}>
                        <GalleryImage src={src} alt="" loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </dialog>
    </section>
  );
}
