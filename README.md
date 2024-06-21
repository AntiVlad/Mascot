# Mascot

An automated WhatsApp bot for sports fixtures, match reminders, and announcements built using `whatsapp-web.js` and `node-schedule`.

## Features

- **Automated Scheduling**: Delivers automated daily/weekly match reminders via `node-schedule`.
- **Match Queries**: Queries upcoming fixtures, team schedules, and match times from `fixtures.json`.
- **Persistent Sessions**: Retains authentication state across restarts using `LocalAuth`.
- **Terminal QR Login**: Authenticates via terminal QR code scanning (`qrcode-terminal`).

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- Google Chrome or Chromium browser installed locally
- An active WhatsApp account on mobile for QR code pairing

---

## Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/AntiVlad/Mascot.git
   cd Mascot
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Chrome Path (if needed)**:
   In `mascot.js`, ensure the Puppeteer `executablePath` matches your system:
   - **Linux**: `/usr/bin/google-chrome-stable`
   - **Windows**: `C:\Program Files\Google\Chrome\Application\chrome.exe`

4. **Start the bot**:
   ```bash
   node mascot.js
   ```

5. **Scan QR Code**:
   Scan the terminal QR code using WhatsApp on your phone (**Linked Devices** > **Link a Device**).

---

## License

This project is open source and available under the ISC License.
