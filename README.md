# Save the Date

A modern, accessible, and responsive "Save the Date" web app designed to offer an elegant invitation experience, complete with interactive animations, celebration videos, calendar integration, and a mobile-first layout.

---

## Features

- **Animated Countdown & Celebration**: Engaging reveal animation and confetti effects.
- **Interactive "Save the Date" Card**: Displays event details, venue sneak peek, and replayable celebration video.
- **Calendar Integration**: Add the event to Google Calendar, Apple Calendar, Outlook, and more.
- **Accessibility First**: Full keyboard navigation, screen reader support, skip links, ARIA roles, and visible focus outlines.
- **Responsive & Mobile Optimized**: Fluid layouts adapt to mobile, tablet, and desktop. Touch-friendly controls, mobile previews, and device-specific enhancements.
- **Performance Optimized**: Critical CSS, minimized DOM updates, and efficient resource loading.
- **Modern Codebase**: Uses ES6+ JavaScript and CSS custom properties for maintainability and flexibility.

---

## Getting Started

1. **Clone the repository:**
   ```sh
   git clone https://github.com/clcummin/save-the-date.git
   cd save-the-date
   ```

2. **Open `index.html` in your browser.**
   No build step is required. All assets are included.

---

## Folder Structure

```
assets/
  css/
    bordered-gallery.css      # Main styles (critical CSS, accessibility, responsive)
  js/
    main.js                  # App logic (animations, interactions, a11y)
  images/                    # Image assets
index.html                   # Main entry point
```

---

## Accessibility Highlights

- **Keyboard navigation** for all interactive elements
- **Skip link** to main content
- **Visible outlines** and high-contrast focus styles
- **Screen reader friendly**: ARIA roles, labels, visually hidden text
- **Reduced motion**: Respects `prefers-reduced-motion` for animations and transitions
- **Color contrast**: Supports high-contrast mode via `prefers-contrast`

---

## Browser Support

- Chrome, Firefox, Safari, Edge (latest versions)
- Graceful degradation in older browsers (no critical features blocked)
- *Some visual polish (e.g., `backdrop-filter`, CSS variables) may be missing in IE11 or very old mobile browsers*

---

## Customization

- Event details (title, date, location) can be updated in the HTML and JS.
- Styles and colors are controlled via CSS variables in `bordered-gallery.css`.
- To add/remove calendar integrations, edit the `createCalendarInviteControls` function in `main.js`.

---

## Contributing

Pull requests and suggestions are welcome! Please open an issue if you have feedback or questions.

---

## License

This project is open source and available under the [MIT License](LICENSE).
