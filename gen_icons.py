#!/usr/bin/env python3
import struct, zlib, math, os

W = H = 48
icons_dir = os.path.join(os.path.dirname(__file__), "assets", "icons")
os.makedirs(icons_dir, exist_ok=True)

def new_canvas():
    return [[(0,0,0,0) for _ in range(W)] for _ in range(H)]

def set_px(c, x, y, color):
    if 0 <= x < W and 0 <= y < H:
        c[y][x] = color

def fill_rect(c, x0, y0, x1, y1, color):
    for y in range(max(0,int(y0)), min(H,int(y1))):
        for x in range(max(0,int(x0)), min(W,int(x1))):
            c[y][x] = color

def stroke_rect(c, x0, y0, x1, y1, t, color):
    fill_rect(c, x0, y0, x1, y0+t, color)
    fill_rect(c, x0, y1-t, x1, y1, color)
    fill_rect(c, x0, y0, x0+t, y1, color)
    fill_rect(c, x1-t, y0, x1, y1, color)

def line(c, x0, y0, x1, y1, t, color):
    x0,y0,x1,y1 = float(x0),float(y0),float(x1),float(y1)
    dx, dy = x1-x0, y1-y0
    dist = max(abs(dx), abs(dy)) * t + 1
    for i in range(int(dist)+1):
        f = i/dist if dist else 0
        x = x0 + dx*f
        y = y0 + dy*f
        fill_rect(c, x-t/2, y-t/2, x+t/2, y+t/2, color)

def disc(c, cx, cy, r, color, stroke=0):
    cx,cy,r = float(cx),float(cy),float(r)
    for y in range(H):
        for x in range(W):
            d = math.hypot(x+0.5-cx, y+0.5-cy)
            if stroke:
                if abs(d-r) <= stroke/2:
                    c[y][x] = color
            else:
                if d <= r:
                    c[y][x] = color

def circle(c, cx, cy, r, t, color):
    disc(c, cx, cy, r, color, stroke=t)

def flood_poly(c, pts, color):
    # scanline fill of polygon (even-odd) on integer grid
    ys = [p[1] for p in pts]
    ymin, ymax = int(min(ys)), int(max(ys))
    for y in range(max(0,ymin), min(H,ymax+1)):
        xs = []
        n = len(pts)
        for i in range(n):
            x1,y1 = pts[i]; x2,y2 = pts[(i+1)%n]
            if (y1 <= y < y2) or (y2 <= y < y1):
                x = x1 + (y - y1)/(y2 - y1)*(x2 - x1)
                xs.append(x)
        xs.sort()
        for i in range(0, len(xs)-1, 2):
            fill_rect(c, xs[i], y, xs[i+1], y+1, color)

WHITE = (255,255,255,255)

def save(name, c):
    raw = bytearray()
    for y in range(H):
        raw.append(0)
        for x in range(W):
            r,g,b,a = c[y][x]
            raw += bytes((r,g,b,a))
    comp = zlib.compress(bytes(raw), 9)
    def chunk(typ, data):
        return struct.pack(">I", len(data)) + typ + data + struct.pack(">I", zlib.crc32(typ+data) & 0xffffffff)
    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", W, H, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", comp)
    png += chunk(b"IEND", b"")
    with open(os.path.join(icons_dir, name+".png"), "wb") as f:
        f.write(png)

# ---- icon definitions ----
def icon_home():
    c=new_canvas()
    flood_poly(c, [(24,6),(40,20),(40,40),(30,40),(30,30),(18,30),(18,40),(8,40),(8,20)], WHITE)
    return c

def icon_box():
    c=new_canvas()
    stroke_rect(c,8,14,40,40,3,WHITE)
    line(c,8,14,22,6,3,WHITE)
    line(c,22,6,40,14,3,WHITE)
    line(c,8,14,22,6,3,WHITE)
    line(c,24,10,24,14,3,WHITE)
    line(c,14,22,34,22,2,WHITE)
    line(c,14,30,34,30,2,WHITE)
    return c

def icon_cart():
    c=new_canvas()
    # basket
    flood_poly(c, [(8,16),(40,16),(36,38),(12,38)], WHITE)
    # handle
    line(c,8,16,14,8,3,WHITE)
    line(c,40,16,34,8,3,WHITE)
    # wheels
    circle(c,16,42,4,3,WHITE)
    circle(c,32,42,4,3,WHITE)
    return c

def icon_cash():
    c=new_canvas()
    stroke_rect(c,8,10,40,38,3,WHITE)
    # dollar
    line(c,24,14,24,34,2,WHITE)
    flood_poly(c,[(20,16),(28,16),(28,20),(20,20)],WHITE)
    flood_poly(c,[(20,28),(28,28),(28,32),(20,32)],WHITE)
    circle(c,32,36,3,3,WHITE)  # coin hint
    return c

def icon_people():
    c=new_canvas()
    disc(c,16,16,7,WHITE)
    disc(c,32,16,7,WHITE)
    flood_poly(c,[(6,40),(26,40),(22,26),(10,26)],WHITE)
    flood_poly(c,[(22,40),(42,40),(38,26),(26,26)],WHITE)
    return c

def icon_building():
    c=new_canvas()
    stroke_rect(c,10,8,38,40,3,WHITE)
    for ry in (14,24,34):
        for rx in (16,24,32):
            fill_rect(c, rx-2, ry-2, rx+2, ry+2, WHITE)
    return c

def icon_scale():
    c=new_canvas()
    line(c,24,8,24,38,3,WHITE)        # post
    line(c,10,16,38,16,3,WHITE)       # beam
    disc(c,10,28,6,WHITE,stroke=2)    # left pan
    disc(c,38,28,6,WHITE,stroke=2)    # right pan
    line(c,10,16,10,22,2,WHITE)       # left string
    line(c,38,16,38,22,2,WHITE)       # right string
    fill_rect(c,18,38,30,42,WHITE)    # base
    flood_poly(c,[(21,8),(27,8),(24,4)], WHITE)  # small fulcrum
    return c

def icon_swap():
    c=new_canvas()
    line(c,8,16,36,16,3,WHITE)
    flood_poly(c,[(38,16),(30,10),(30,22)],WHITE)
    line(c,40,32,12,32,3,WHITE)
    flood_poly(c,[(10,32),(18,26),(18,38)],WHITE)
    return c

def icon_chart():
    c=new_canvas()
    fill_rect(c,8,30,18,40,WHITE)
    fill_rect(c,20,20,30,40,WHITE)
    fill_rect(c,32,10,42,40,WHITE)
    line(c,6,40,42,40,3,WHITE)
    return c

def icon_gear():
    c=new_canvas()
    import math
    circle(c,24,24,15,4,WHITE)   # ring
    disc(c,24,24,6,WHITE)        # center hub
    for i in range(8):
        a = math.radians(i*45)
        cx = 24 + 18*math.cos(a)
        cy = 24 + 18*math.sin(a)
        fill_rect(c, cx-3, cy-3, cx+3, cy+3, WHITE)
    return c

def icon_lock():
    c=new_canvas()
    circle(c,24,18,8,4,WHITE)          # shackle (ring)
    fill_rect(c,12,22,36,40,WHITE)     # body
    disc(c,24,30,3,(0,0,0,0))          # keyhole
    fill_rect(c,23,30,25,36,(0,0,0,0))
    return c

def icon_food():
    c=new_canvas()
    disc(c,24,16,12,WHITE,stroke=3)  # top bun
    fill_rect(c,12,20,36,24,WHITE)   # patty
    line(c,12,28,36,28,3,WHITE)      # lettuce
    fill_rect(c,12,32,36,40,WHITE)   # bottom bun
    return c

def icon_list():
    c=new_canvas()
    for y in (16,24,32):
        fill_rect(c,8,y,40,y+3,WHITE)
    return c

def icon_chat():
    c=new_canvas()
    flood_poly(c,[(8,10),(40,10),(40,34),(24,34),(16,42),(16,34),(8,34)],WHITE)
    disc(c,17,22,2.5, (0,0,0,0))
    disc(c,24,22,2.5, (0,0,0,0))
    disc(c,31,22,2.5, (0,0,0,0))
    return c

def icon_search():
    c=new_canvas()
    circle(c,20,20,11,3,WHITE)
    line(c,28,28,40,40,4,WHITE)
    return c

def icon_scan():
    c=new_canvas()
    for x in (10,16,22,28,34,38):
        fill_rect(c, x, 14, x+3, 34, WHITE)
    line(c,8,10,8,18,3,WHITE); line(c,8,10,16,10,3,WHITE)
    line(c,40,10,40,18,3,WHITE); line(c,32,10,40,10,3,WHITE)
    line(c,8,38,8,30,3,WHITE); line(c,8,38,16,38,3,WHITE)
    line(c,40,38,40,30,3,WHITE); line(c,32,38,40,38,3,WHITE)
    return c

def icon_plus():
    c=new_canvas()
    fill_rect(c,20,8,28,40,WHITE)
    fill_rect(c,8,20,40,28,WHITE)
    return c

defs = {
    "home": icon_home, "box": icon_box, "cart": icon_cart, "cash": icon_cash,
    "people": icon_people, "building": icon_building, "scale": icon_scale,
    "swap": icon_swap, "food": icon_food, "list": icon_list, "chat": icon_chat,
    "search": icon_search, "scan": icon_scan, "plus": icon_plus,
    "chart": icon_chart, "gear": icon_gear, "lock": icon_lock,
}
for n,f in defs.items():
    save(n, f())
    print("wrote", n)
print("done", len(defs))
