import numpy as np
from PIL import Image
from skimage import measure

src_path = r'C:\Users\ADMIN\.gemini\antigravity\brain\cbd90c4b-1217-42c1-9033-8adfae0d4dde\.user_uploaded\media_1795343365680_754eeddc.jpg'
im = Image.open(src_path).convert('RGB')
arr = np.array(im)

# Orange dot mask
orange_mask = (arr[:,:,0] > 180) & (arr[:,:,1] > 120) & (arr[:,:,2] < 100)
# Dark aperture blades in mark region
dark_mask = np.zeros((1024, 1024), dtype=bool)
dark_mask[240:610, 340:710] = (arr[240:610, 340:710, 0] < 80) & (arr[240:610, 340:710, 1] < 80) & (arr[240:610, 340:710, 2] < 80)

oy, ox = np.where(orange_mask)
dy, dx = np.where(dark_mask)
all_x = np.concatenate([ox, dx])
all_y = np.concatenate([oy, dy])

pad = 6
min_x, max_x = all_x.min() - pad, all_x.max() + pad
min_y, max_y = all_y.min() - pad, all_y.max() + pad
width = max_x - min_x
height = max_y - min_y
side = max(width, height)
ox_offset = min_x - (side - width) / 2
oy_offset = min_y - (side - height) / 2

dot_cx = (ox.mean() - ox_offset) / side * 100.0
dot_cy = (oy.mean() - oy_offset) / side * 100.0
dot_r = ((ox.max() - ox.min()) / 2) / side * 100.0

contours = measure.find_contours(dark_mask.astype(float), 0.5)

svg_out = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">',
    f'  <circle cx="{dot_cx:.2f}" cy="{dot_cy:.2f}" r="{dot_r:.2f}" fill="#F4A830" />'
]

for i, c in enumerate(contours):
    if len(c) < 50:
        continue
    # Subpixel polygon approximation with smooth tolerance
    poly = measure.approximate_polygon(c, tolerance=0.55)
    norm_x = (poly[:, 1] - ox_offset) / side * 100.0
    norm_y = (poly[:, 0] - oy_offset) / side * 100.0
    d = 'M ' + ' L '.join(f'{x:.2f} {y:.2f}' for x, y in zip(norm_x, norm_y)) + ' Z'
    svg_out.append(f'  <path d="{d}" fill="currentColor" />')

svg_out.append('</svg>')

svg_content = '\n'.join(svg_out)
with open(r'D:\projects\codebenders_Hackathon\public\mark.svg', 'w') as f:
    f.write(svg_content)

print(f"Generated mark.svg with {len(contours)} contours.")
