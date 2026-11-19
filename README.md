# Elite Paradise — MERN version

**M**ongoDB · **E**xpress · **R**eact · **N**ode.js
(plus tRPC for the API, Tailwind for styling, Mongoose for the database.)

One project, one server: Express serves both the API and the website.

---

## A. Run it on your computer

1. Install **Node.js 22** (https://nodejs.org) and open this folder in VS Code.
2. Open the terminal in VS Code and run:
   ```
   npm install
   ```
3. Copy `.env.example` to a new file named `.env` and fill in 3 things:
   - `MONGODB_URI` — your MongoDB Atlas link (see section B)
   - `JWT_SECRET` — any long random text
   - `ADMIN_EMAIL` and `ADMIN_PASSWORD` — your admin login
4. Start it:
   ```
   npm run dev
   ```
5. Open http://localhost:3000 — the shop.
   Log in at http://localhost:3000/login with your admin email, then open http://localhost:3000/admin.

The first time it starts, it fills the shop with 24 **sample** products so it is not empty. Replace them in Admin → Products.

## B. Get a free MongoDB (Atlas)

1. https://www.mongodb.com/cloud/atlas → create a free **M0** cluster.
2. **Database Access** → add a user + password (use only letters and numbers in the password).
3. **Network Access** → add IP `0.0.0.0/0` (allow from anywhere).
4. **Connect → Drivers** → copy the link. Put it in `MONGODB_URI`:
   - replace `<password>` with your real password (remove the `< >`)
   - add the database name after `.net/`, like `.net/eliteparadise?retryWrites=...`

## C. Put it online (GitHub + Render)

1. Create a GitHub repo and upload this whole folder (`.env` is ignored automatically — it must NOT go online).
   ```
   git init
   git add .
   git commit -m "Elite Paradise"
   git branch -M main
   git remote add origin https://github.com/YOUR-NAME/YOUR-REPO.git
   git push -u origin main
   ```
2. https://render.com → **New → Web Service** → pick your repo.
3. Fill in:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Environment Variables:** `MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NODE_VERSION` = `22`
4. Deploy. Your shop is live at `https://your-service.onrender.com`. No Vercel needed.

> Render free plan sleeps after 15 minutes without visitors; the first visit then takes ~30 seconds. Use a paid plan for a real shop.

## D. Add your real products and photos

- Admin → **Products** → *Add product*. Drag your photos into the uploader.
  Photos are saved inside MongoDB (max 8 MB each; Atlas free = 512 MB total).
- The placeholder pictures (`client/public/images/*.svg`) are only temporary. The home-page banners and menu pictures use files in that folder — replace them with your own photos (keep the same file names, or change the names in `shared/catalog.ts`).
- Admin → **Website** — change the announcement bar, headline, phone, WhatsApp, delivery charge.

## E. Commands

| Command | What it does |
|---|---|
| `npm run dev` | shop + API with live reload (http://localhost:3000) |
| `npm run build` | build for production |
| `npm start` | run the production build |
| `npm run seed` | add the sample products again (never overwrites yours) |
| `npm test` | run the tests |
| `npm run typecheck` | check the TypeScript |

## F. Good to know

- **Payments:** there is no online payment gateway. Orders start as *unpaid*; you confirm bKash/Nagad/cash by hand in Admin → Orders.
- **Emails:** none are sent. Customers track orders with order number + phone. `server/_core/email.ts` is ready if you want to add one later.
- **Forgot password:** logged-in users change it on their account page. If the *admin* forgets theirs: in Atlas → Browse Collections → `users`, delete the admin user, then restart the server — it creates the admin again from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
- **Tests** need a MongoDB. By default they download a temporary one (needs internet once). Or run `TEST_MONGODB_URI=mongodb://localhost:27017/test npm test`.

## G. Where things are

```
client/src      React app (pages, components)
server/models   Mongoose models (the MongoDB collections)
server/db.ts    all database queries
server/routers.ts  the API (tRPC)
server/_core    login, image storage, server start-up
shared/         values used by both client and server
```
