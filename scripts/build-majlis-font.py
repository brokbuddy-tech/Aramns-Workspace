"""Build Novalux's original Latin display lettering. Requires fontTools + brotli.

The geometric outlines below are drawn for this project, rather than extracted
from a specimen or a third-party typeface. Coordinates use a 1000-unit SVG grid
with a baseline at 700. Run from any directory to rebuild the local WOFF2 asset.
"""

from pathlib import Path
import re
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.areaPen import AreaPen
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.reverseContourPen import ReverseContourPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.svgLib.path import parse_path


def stem(x, top=300, width=64, bottom=700):
    return f'M{x} {top + 28}L{x + width} {top}V{bottom}H{x}Z'


def dot(x, y, radius=20):
    return (f'M{x - radius} {y}Q{x - radius} {y - radius} {x} {y - radius}'
            f'Q{x + radius} {y - radius} {x + radius} {y}'
            f'Q{x + radius} {y + radius} {x} {y + radius}'
            f'Q{x - radius} {y + radius} {x - radius} {y}Z')


def bar(x, y, width, height=32):
    return f'M{x + 18} {y}H{x + width}L{x + width - 18} {y + height}H{x}Z'


arch = 'M50 700V328L114 300V344Q167 300 220 300Q330 300 330 422V700H266V426Q266 338 209 338Q156 338 114 388V700Z'
bowl = 'M50 500Q50 300 210 300Q370 300 370 500Q370 700 210 700Q50 700 50 500ZM118 500Q118 660 210 660Q302 660 302 500Q302 340 210 340Q118 340 118 500Z'
a = ('M330 700V310H208Q50 310 50 510Q50 700 204 700Z'
     'M262 352V658H210Q118 658 118 510Q118 352 208 352Z'
     'M262 320L330 292V644Q330 674 360 674H390L372 700H330Q262 700 262 644Z')

# Narrow hairlines, broad upright strokes, square shoulders and cut terminals.
# The uppercase A and lowercase n carry restrained paired/single dot accents.
outlines = {
    'A': (460, 'M58 700V252Q58 102 210 102H322V700H254V142H210Q82 142 82 252V700Z'
          + bar(24, 398, 260, 34) + bar(254, 670, 174, 30)
          + dot(188, 40) + dot(238, 40)),
    'a': (420, a),
    'b': (420, stem(50, 100) + 'M114 354Q165 300 225 300Q370 300 370 500Q370 700 218 700H114V660H210Q302 660 302 500Q302 340 218 340Q163 340 114 394Z'),
    'c': (380, 'M338 300H213Q50 300 50 500Q50 700 213 700H344L364 670H220Q118 670 118 500Q118 340 220 340H312Z'),
    'd': (420, 'M266 100L330 76V700H208Q50 700 50 510Q50 310 208 310H266V352H210Q118 352 118 510Q118 658 210 658H266Z' + bar(266, 674, 124, 26)),
    'e': (400, 'M352 488H118Q118 658 218 658H350L328 700H210Q50 700 50 500Q50 300 210 300Q352 300 352 488ZM118 450H284Q284 340 210 340Q132 340 118 450Z'),
    'f': (290, 'M92 850V260Q92 100 238 100H280L258 140H238Q156 140 156 260V850Z' + bar(32, 340, 248, 34)),
    'g': (420, a + 'M266 670V733Q266 830 148 830H68L48 870H150Q330 870 330 733V670Z'),
    'h': (420, stem(50, 100) + 'M114 354Q166 300 222 300Q330 300 330 424V700H266V428Q266 340 210 340Q158 340 114 394Z'),
    'i': (192, stem(64) + dot(96, 228)),
    'j': (220, 'M106 328L170 300V718Q170 870 20 870H0L22 832Q106 832 106 718Z' + dot(138, 228)),
    'k': (390, stem(50, 100) + 'M114 502L284 300H328L166 490L360 700H270L114 526Z'),
    'l': (230, 'M54 128L118 100V638Q118 674 152 674H218L200 700H132Q54 700 54 638Z'),
    'm': (588, 'M50 700V328L114 300V344L206 300L292 350L378 300Q504 300 504 424V700H440V428Q440 340 384 340L324 374V700H260V412L206 342L114 388V700Z'),
    'n': (414, arch + dot(214, 228) + bar(266, 674, 124, 26)),
    'o': (420, bowl),
    'p': (420, stem(50, 300, bottom=870) + 'M114 354Q165 300 225 300Q370 300 370 500Q370 700 218 700H114V660H210Q302 660 302 500Q302 340 218 340Q163 340 114 394Z'),
    'q': (420, 'M266 340H210Q118 340 118 500Q118 660 210 660H266V700H208Q50 700 50 500Q50 300 208 300H330V870H266Z'),
    'r': (302, 'M50 700V426Q50 300 176 300H278L252 340H184Q114 340 114 426V700Z' + dot(188, 760, 13)),
    's': (382, 'M344 300H177Q50 300 50 414Q50 500 176 520L214 526Q292 538 292 600Q292 658 218 658H48L26 700H221Q358 700 358 584Q358 490 232 470L194 464Q116 452 116 394Q116 340 186 340H320Z'),
    't': (286, 'M92 176L156 148V638Q156 674 192 674H268L250 700H170Q92 700 92 638Z' + bar(28, 330, 246, 34)),
    'u': (414, 'M50 328L114 300V578Q114 660 174 660Q230 660 266 610V328L330 300V700H266V658Q218 700 164 700Q50 700 50 580Z' + bar(266, 674, 124, 26)),
    'v': (380, 'M30 300H102L232 620L338 300H366L230 700H196Z'),
    'w': (560, 'M30 300H98L190 620L266 360H296L390 620L490 300H518L394 700H354L268 426L190 700H148Z'),
    'x': (380, 'M30 300H108L350 700H272Z M310 300H344L74 700H40Z'),
    'y': (388, 'M30 300H102L224 602L328 300H356L188 786Q152 870 62 870H12L34 832H64Q128 832 152 770L188 676Z'),
    'z': (380, bar(38, 300, 304, 36) + 'M272 324H344L108 664H36Z' + bar(36, 664, 322, 36)),
    'space': (200, ''),
    'hyphen': (240, bar(30, 484, 180, 30)),
    'period': (170, dot(85, 684, 17)),
    'apostrophe': (160, 'M60 100H110V174L60 210H44L60 172Z'),
    'ampersand': (450, 'M360 700H278L196 602Q130 700 64 700Q18 700 18 626Q18 552 142 474Q66 374 66 306Q66 224 160 224Q254 224 254 306Q254 378 188 448L284 570L334 490H372L304 596ZM164 416Q210 356 210 306Q210 262 166 262Q122 262 122 306Q122 350 164 416ZM166 558Q76 618 76 644Q76 662 98 662Q132 662 166 604L174 590Z'),
}

# Other capitals share the same display vocabulary at cap height. A has its
# own distinctive arched construction; API strings retain their actual case.
for character in 'BCDEFGHIJKLMNOPQRSTUVWXYZ':
    width, outline = outlines[character.lower()]
    outlines[character] = (width, outline)

order = ['.notdef'] + list(outlines)
glyphs = {}
metrics = {}
counter_contours = {'.notdef': {1}, 'a': {1}, 'g': {1}, 'o': {1},
                    'e': {1}, 'ampersand': {1, 2}}
for character in order:
    width, outline = outlines.get(character, (420, 'M50 700V100H370V700ZM80 130V670H340V130Z'))
    pen = TTGlyphPen(None)
    quadratic = Cu2QuPen(pen, max_err=1.0, reverse_direction=False)
    transformed = TransformPen(quadratic, (1, 0, 0, -1, 0, 700))
    # Overlapping stems must use the same winding as the bowl. Only actual
    # counters reverse it, keeping joins solid on every browser rasterizer.
    for index, contour in enumerate(re.findall(r'[Mm][^Mm]*', outline)):
        area = AreaPen(None)
        parse_path(contour, area)
        counter_key = character if character == 'A' else character.lower()
        desired_positive = index not in counter_contours.get(counter_key, set())
        target_pen = transformed if (area.value > 0) == desired_positive else ReverseContourPen(transformed)
        parse_path(contour, target_pen)
    glyph = pen.glyph()
    # All outlines are original; overlap flags improve rasterization at joins.
    if glyph.numberOfContours > 0:
        glyph.flags[0] |= 0x40
    glyphs[character] = glyph
    metrics[character] = (width, glyph.xMin if hasattr(glyph, 'xMin') else 0)

font = FontBuilder(1000, isTTF=True)
font.setupGlyphOrder(order)
font.setupCharacterMap({**{ord(c): c for c in outlines if len(c) == 1},
                        32: 'space', 45: 'hyphen', 46: 'period',
                        39: 'apostrophe', 8217: 'apostrophe', 38: 'ampersand'})
font.setupGlyf(glyphs)
font.setupHorizontalMetrics(metrics)
font.setupHorizontalHeader(ascent=820, descent=-200)
font.setupNameTable({'familyName': 'Novalux Majlis', 'styleName': 'Regular',
                     'uniqueFontIdentifier': 'NovaluxMajlis-Regular-1.0',
                     'fullName': 'Novalux Majlis Regular',
                     'psName': 'NovaluxMajlis-Regular', 'version': 'Version 1.0',
                     'description': 'Original geometric Latin display lettering for Novalux.'})
font.setupOS2(sTypoAscender=820, sTypoDescender=-200,
              usWinAscent=820, usWinDescent=200, fsType=0)
font.setupPost()
font.setupMaxp()
font.font.flavor = 'woff2'
target = Path(__file__).resolve().parents[1] / 'public/fonts/majlis/majlis-regular.woff2'
font.save(target)
print(f'Built {target.name}: {len(outlines)} glyphs, {target.stat().st_size} bytes')
