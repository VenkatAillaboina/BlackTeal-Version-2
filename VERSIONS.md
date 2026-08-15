# Why I Built the BlackTeal Project This Way

When I read the assignment, the main goal was to build a live dashboard for operators to monitor the batteries and grid. But since this will be the main landing page of the company website, I thought about the normal people who will visit the site. If a non-technical person or a client opens the website and directly sees a complex dashboard with lots of numbers and alarms, they will get confused. They won't know what a "Power Skid" or "Substation" is.

So, I came up with an idea to make it easy for everyone to understand.

---

## 🟢 Version 1 (V1): The 3D Experience

In the first version, the focus was on making things look very cool using 3D graphics. The goal was to explain the hardware using interactive 3D models before showing the complicated dashboard.

### How it worked:
- **The 3-Step Flow:** As you scroll down the page, you see 3D models of the substation, the batteries, and the data center.
- **The Assembly:** After seeing the parts, the 3D models fly together to show the full layout of the site.
- **The Dashboard:** Finally, the 3D scene smoothly turns into the main operator dashboard to show live data.

### Tech Stack used:
- **React & Three.js:** These were used to show the 3D models in the browser.
- **Zustand:** Used to keep track of the data and animations.

### Pros & Cons:
- **Pros:** It looks amazing and gives visitors a huge "wow" factor.
- **Cons:** 3D graphics are very heavy. They take a long time to load and can make older phones or slow computers freeze and lag. It was too heavy for a fast, everyday dashboard.

---

## 🔵 Version 2 (V2): The Fast and Simple Version (Current)

Version 2 was built to solve the problems of Version 1. I wanted to keep the easy step-by-step introduction, but make the website lightning fast and perfectly reliable.

### How it worked:
- **The Simple Drawing (SVG):** Instead of heavy 3D models, I used simple, clean 2D line drawings. As you scroll, the lines draw themselves to show how electricity flows through the site.
- **A Smooth Change:** The lines you see in the introduction are the exact same lines used in the final dashboard. So, once you learn what the lines mean, you are ready to read the real dashboard.
- **Easy Colors:** I used mostly dark grey colors. I only used bright colors like Red or Orange when something is wrong. This makes it very easy for operators to spot a problem quickly.

### Tech Stack used:
- **React & GSAP:** GSAP is a tool that makes the line drawings animate very smoothly when you scroll, without freezing the browser.
- **Strict TypeScript:** I wrote the code very strictly so the computer catches any bugs before the website even goes live.
- **Tailwind CSS:** Used to style the website quickly and beautifully.

### Pros & Cons:
- **Pros:** It is extremely fast. The page loads instantly, uses very little battery power on phones, and never lags even when live data is updating every second.
- **Cons:** It doesn't have the flashy 3D graphics, but it looks much more like a professional software tool.

