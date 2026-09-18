from PIL import Image, ImageDraw
import base64
import io

def generate_icon():
    scale = 4
    size = 512 * scale
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Background rounded rectangle (Rich Deep Navy #1E293B)
    bg_color = (30, 41, 59, 255)
    corner_radius = int(120 * scale)
    draw.rounded_rectangle([0, 0, size, size], radius=corner_radius, fill=bg_color)

    # 2. Chimney (#D97706)
    draw.rounded_rectangle([int(320*scale), int(100*scale), int(360*scale), int(200*scale)], radius=int(10*scale), fill=(217, 119, 6, 255))

    # 3. Solid House Body (White with rounded bottom corners)
    # The house shape: roof triangle + body rectangle unified
    # Points for cohesive house
    house_points = [
        (int(256 * scale), int(80 * scale)),   # Roof top peak
        (int(430 * scale), int(230 * scale)),  # Roof right eave
        (int(385 * scale), int(230 * scale)),  # Right wall top
        (int(385 * scale), int(420 * scale)),  # Right wall bottom
        (int(127 * scale), int(420 * scale)),  # Left wall bottom
        (int(127 * scale), int(230 * scale)),  # Left wall top
        (int(82 * scale), int(230 * scale))    # Roof left eave
    ]
    draw.polygon(house_points, fill=(255, 255, 255, 255))

    # Golden Roof Overhang Highlight (#F59E0B)
    roof_polygon = [
        (int(256 * scale), int(70 * scale)),
        (int(440 * scale), int(225 * scale)),
        (int(410 * scale), int(245 * scale)),
        (int(256 * scale), int(115 * scale)),
        (int(102 * scale), int(245 * scale)),
        (int(72 * scale), int(225 * scale))
    ]
    draw.polygon(roof_polygon, fill=(245, 158, 11, 255))

    # 4. Loving Heart in the center (#E11D48)
    # Heart center (256, 325)
    # Draw smooth heart using bezier / polygons + circles
    cx = 256 * scale
    cy = 315 * scale
    r = 42 * scale

    # Two circles for upper lobes
    draw.ellipse([cx - int(70*scale), cy - int(45*scale), cx - int(2*scale), cy + int(25*scale)], fill=(225, 29, 72, 255))
    draw.ellipse([cx + int(2*scale), cy - int(45*scale), cx + int(70*scale), cy + int(25*scale)], fill=(225, 29, 72, 255))
    
    # Triangle / polygon for lower point
    draw.polygon([
        (cx - int(66*scale), cy - int(5*scale)),
        (cx + int(66*scale), cy - int(5*scale)),
        (cx, cy + int(78*scale))
    ], fill=(225, 29, 72, 255))

    # Downsample
    final_img = img.resize((512, 512), Image.Resampling.LANCZOS)
    final_img.save("c:/class/언약교회4구역/icon.png", "PNG")
    
    img_192 = img.resize((192, 192), Image.Resampling.LANCZOS)
    img_192.save("c:/class/언약교회4구역/icon-192.png", "PNG")

    buf = io.BytesIO()
    final_img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    with open("c:/class/언약교회4구역/icon_base64.txt", "w") as f:
        f.write(b64)
    print("Regenerated clean icon!")

if __name__ == "__main__":
    generate_icon()
