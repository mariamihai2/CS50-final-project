import io
import os

from flask import Flask, jsonify, render_template, request, send_file
from PIL import Image

# Configure application
app = Flask(__name__)

# Pixel grid for canvas
BOARD_SIZE = 50
PIXEL_SIZE = 10  # on-screen (and exported) size of each pixel, in px
pixel_grid = [["#ffffff" for _ in range(BOARD_SIZE)] for _ in range(BOARD_SIZE)]


@app.after_request
def after_request(response):
    """Ensure responses aren't cached"""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response


@app.route("/")
def index():
    # Build a render-friendly grid: rows of {x, y, color} dicts,
    # so the template doesn't need to juggle nested loop indices.
    render_grid = [
        [{"x": x, "y": y, "color": pixel_grid[x][y]} for x in range(BOARD_SIZE)]
        for y in range(BOARD_SIZE)
    ]
    return render_template(
        "index.html",
        grid=render_grid,
        board_size=BOARD_SIZE,
        pixel_size=PIXEL_SIZE,
    )


@app.route("/draw_pixel", methods=["POST"])
def draw_pixel():
    """Change a single pixel's color"""
    data = request.json
    x = data["x"]
    y = data["y"]
    color = data["color"]
    if 0 <= x < BOARD_SIZE and 0 <= y < BOARD_SIZE:
        pixel_grid[x][y] = color if color else "#ffffff"
    return jsonify(success=True)


@app.route("/clear", methods=["POST"])
def clear():
    """Reset the whole canvas to white"""
    for x in range(BOARD_SIZE):
        for y in range(BOARD_SIZE):
            pixel_grid[x][y] = "#ffffff"
    return jsonify(success=True)


@app.route("/download")
def download():
    """Generate and download the canvas as PNG"""
    img = Image.new("RGB", (BOARD_SIZE * PIXEL_SIZE, BOARD_SIZE * PIXEL_SIZE))
    pixels = img.load()

    # Fill with grid colors
    for x in range(BOARD_SIZE):
        for y in range(BOARD_SIZE):
            color = pixel_grid[x][y]
            r = int(color[1:3], 16)
            g = int(color[3:5], 16)
            b = int(color[5:7], 16)

            for px in range(PIXEL_SIZE):
                for py in range(PIXEL_SIZE):
                    pixels[x * PIXEL_SIZE + px, y * PIXEL_SIZE + py] = (r, g, b)

    img_io = io.BytesIO()
    img.save(img_io, "PNG")
    img_io.seek(0)
    return send_file(img_io, mimetype="image/png", as_attachment=True, download_name="drawing.png")


if __name__ == "__main__":
    app.run(debug=True)
