# Yuvantara Technologies — Corporate & Academic Training Platform

Official website, Industrial Internship Portal, and Executive Command Center for **Yuvantara Technologies**, Patna, Bihar.

- **Headquarters**: 4A Prantika Building, Kankarbagh, Patna, Bihar - 800006
- **Contact**: +91 98765 43210 &nbsp;|&nbsp; `xyv@yuvantara.com`
- **Accreditation**: ISO 9001:2015 Certified &bull; MSME Registered

---

## 🚀 Live Hosting on GitHub Pages

This project is completely static (HTML5, modern CSS3, vanilla JavaScript) with **zero server dependencies**. It is pre-configured to deploy directly to GitHub Pages for free.

### Deployment Steps:
1. Push this repository to GitHub (e.g. `https://github.com/<your-username>/My_portal`).
2. Go to your repository on GitHub and click **Settings**.
3. Under the **Code and automation** section in the left sidebar, click **Pages**.
4. Under **Build and deployment** &rarr; **Branch**:
   - Select `main` (or `master`).
   - Select folder `/ (root)`.
   - Click **Save**.
5. Within 1 minute, your site will be live at:
   ```
   https://<your-username>.github.io/My_portal/
   ```

---

## 🔑 Default Demo Accounts

| Role | Portal URL | Email | Password |
| :--- | :--- | :--- | :--- |
| **Admin** | `/admin_login_777/` | `admin@yuvantara.com` | `admin777` |
| **Student** | `/portal/` | `student@yuvantara.com` | `student123` |
| **Public Verification** | `/verify-certificate/` | Sample ID: `YUV-2026-CS101` | *N/A* |

---

## 💻 Local Development

To run the site locally, launch the included PowerShell static web server:
```powershell
powershell -ExecutionPolicy Bypass -File server.ps1
```
Then open:
```
http://localhost:8080/
```

---

## 📁 Key Directories

- `index.html` — Main landing page & hero overview
- `portal/` — Student Dashboard (Progress tracker, certificate downloader/uploader, profile editor, password modifier)
- `admin_login_777/` — Executive Admin Command Center (Student management, application review, certificate issuance, data export/import)
- `internships/` — Comprehensive 22+ track industrial internship catalog with category filtering
- `verify-certificate/` — Official national credential verification portal
- `assets/db.js` — Client-side database & authentication engine (LocalStorage persistence)
- `assets/site.js` — Core site behaviors, modal handlers, dynamic auth indicators
- `assets/portal.css` — Portal & admin styling
- `.nojekyll` — Bypasses Jekyll processing on GitHub Pages
- `404.html` — Custom 404 handler with smart directory redirector
