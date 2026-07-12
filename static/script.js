document.addEventListener("DOMContentLoaded", () => {
    const board = document.getElementById("board");
    const boardWrapper = document.getElementById("board-wrapper");
    const colorPicker = document.getElementById("colorPicker");
    const clearBtn = document.getElementById("clear-btn");
    const cursorIcon = document.getElementById("cursor-icon");
    const toolButtons = document.querySelectorAll(".tool-btn");

    let tool = "pencil";
    let color = colorPicker.value;
    let isPainting = false;

    // ---------- Icons for the floating cursor ----------
    const icons = {
        pencil: `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 20c1-3 1-5 3-7l9-9 3 3-9 9c-2 2-4 2-7 3-1 .3-1.3 0-1-1z" fill="#ea433b" stroke="#7a1f1b" stroke-width="1.2" stroke-linejoin="round"/>
                <path d="M15 5l3-3 3 3-3 3z" fill="#bf6b99" stroke="#7a1f1b" stroke-width="1.2" stroke-linejoin="round"/>
            </svg>`,
        eraser: `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="10" width="14" height="8" rx="1.5" transform="rotate(-15 12 14)" fill="#f5b82e" stroke="#8a5a00" stroke-width="1.2"/>
                <rect x="5" y="10" width="14" height="4" rx="1" transform="rotate(-15 12 14)" fill="#fff6e0" stroke="#8a5a00" stroke-width="1"/>
            </svg>`,
    };

    function renderCursorIcon() {
        cursorIcon.innerHTML = icons[tool];
    }

    function setTool(newTool) {
        tool = newTool;
        toolButtons.forEach((btn) => {
            btn.classList.toggle("active", btn.dataset.tool === newTool);
        });
        renderCursorIcon();
    }

    toolButtons.forEach((btn) => {
        btn.addEventListener("click", () => setTool(btn.dataset.tool));
    });

    colorPicker.addEventListener("input", (e) => {
        color = e.target.value;
    });

    // ---------- Floating cursor icon follows the mouse over the board ----------
    boardWrapper.addEventListener("mouseenter", () => {
        renderCursorIcon();
        cursorIcon.classList.add("visible");
    });

    boardWrapper.addEventListener("mouseleave", () => {
        cursorIcon.classList.remove("visible");
        isPainting = false;
    });

    document.addEventListener("mousemove", (e) => {
        cursorIcon.style.left = `${e.clientX}px`;
        cursorIcon.style.top = `${e.clientY}px`;
    });

    // ---------- Painting ----------
    function paintPixel(pixel) {
        const x = parseInt(pixel.dataset.x, 10);
        const y = parseInt(pixel.dataset.y, 10);
        const appliedColor = tool === "eraser" ? "#ffffff" : color;

        pixel.style.backgroundColor = appliedColor;

        fetch("/draw_pixel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ x, y, color: appliedColor }),
        }).catch((err) => console.error("Failed to save pixel:", err));
    }

    board.addEventListener("mousedown", (e) => {
        const pixel = e.target.closest(".pixel");
        if (!pixel) return;
        isPainting = true;
        paintPixel(pixel);
    });

    board.addEventListener("mouseover", (e) => {
        if (!isPainting) return;
        const pixel = e.target.closest(".pixel");
        if (!pixel) return;
        paintPixel(pixel);
    });

    document.addEventListener("mouseup", () => {
        isPainting = false;
    });

    // ---------- Clear canvas ----------
    clearBtn.addEventListener("click", () => {
        if (!confirm("Clear the whole canvas?")) return;

        document.querySelectorAll(".pixel").forEach((pixel) => {
            pixel.style.backgroundColor = "#ffffff";
        });

        fetch("/clear", { method: "POST" }).catch((err) =>
            console.error("Failed to clear canvas:", err)
        );
    });

    // Initialize
    setTool(tool);
});
