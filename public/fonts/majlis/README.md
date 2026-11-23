# Novalux Majlis

Original Latin display lettering drawn for the Novalux loading-screen wordmark.
The geometric outlines use arched stems, angled terminals, open counters and
restrained dot accents. They are not extracted from the supplied reference image
or from another typeface.

The API name remains real, accessible English text. Unsupported characters use
the existing font fallback; the tagline retains its subtler Mirza lettering.

Rebuild with `python3 scripts/build-majlis-font.py` (fontTools and brotli needed
only to regenerate the asset). The application serves the generated WOFF2 file
locally and has no runtime dependency on Python or a font service.
