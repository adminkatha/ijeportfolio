# Contact form setup (email)

The website's contact form emails each message to Ehjay (ehjaylorenzo2@gmail.com), with a copy to
admin.katha@gmail.com. It works through a small Google Apps Script "web app" that belongs to admin.katha@gmail.com.
Nothing is stored anywhere else: the emails are the only record of the messages, so keep them.

The website needs two values to reach the script:

- `CONTACT_WEBHOOK_URL`: the web app's address (it ends with `/exec`)
- `CONTACT_SECRET`: a long random password, stored in two places (the script and the website). It is already in
  Vercel; ask the site owner or developer for it.

Until both are set on the website, the site shows an **"Email me instead"** link where the form would be, so nothing breaks.

> **Keep these private.** Never paste the `/exec` address or the secret into the code, a commit, an issue, a
> chat, an email or a shared document. They belong only in the script's settings, Vercel's settings and
> `.env.local` on this PC. (`pnpm check:push` refuses to push Apps Script addresses.)

Time needed: about 10 minutes. Do every step signed in as **admin.katha@gmail.com**.
Tip: if your browser is signed in to several Google accounts, use a private (incognito) window signed in to this one
only. Apps Script sometimes picks the wrong account otherwise.

---

## 1. Create the script
1. Go to https://script.google.com and click **New project** (top left).
   A new tab opens with a file called `Code.gs` that holds a few lines of sample code (`function myFunction() { … }`).
2. Click the name at the top left (**Untitled project**), type **Portfolio contact form**, and click **Rename**.
3. Click inside `Code.gs`, select everything (**Ctrl+A**) and press **Delete**, so the file is empty.
4. In the website's folder, open `docs\contact\apps-script.gs` (right-click → **Open with** → **Notepad**).
   Select everything (**Ctrl+A**) and copy it (**Ctrl+C**).
5. Back in Apps Script, click inside the empty `Code.gs` and paste (**Ctrl+V**).
6. Click the **Save** icon (the floppy disk) or press **Ctrl+S**.

The first lines of the script say who gets each message (`TO` and `CC`). To change them later, see
[Changing who gets the messages](#changing-who-gets-the-messages).

## 2. Add the secret
1. In the left sidebar, click **Project Settings** (the gear icon).
2. Scroll down to **Script Properties** and click **Add script property**.
3. **Property:** `CONTACT_SECRET` · **Value:** the same value as the website's `CONTACT_SECRET`.
   Paste it with no spaces before or after it.
4. Click **Save script properties**.

## 3. Check the setup (optional, recommended)
1. In the left sidebar, click **Editor** (the `< >` icon).
2. In the toolbar, open the list of functions (it shows a name such as `doPost`), choose **checkSetup**, and click **Run**.
3. The first time, Google asks for permission: follow [step 5](#5-authorize), then click **Run** again if needed.
4. The **Execution log** at the bottom should say `Setup OK. The secret is set (… characters)…` and how many emails
   the account can still send today. It sends nothing.
   If it shows an error instead, the error says what's missing (usually the script property from step 2).

## 4. Deploy it as a web app
1. Click **Deploy** (top right) → **New deployment**.
2. Next to **Select type**, click the gear icon → **Web app**.
3. **Description:** `Contact form`.
4. **Execute as:** **Me (admin.katha@gmail.com)**. The emails are then sent from this account.
5. **Who has access:** **Anyone**. This lets the website reach the script without a Google sign-in.
   Without the secret, nobody can send anything through it: the script answers "unauthorized" and sends no email.
6. Click **Deploy**.

## 5. Authorize
Google asks for permission the first time (in step 3 or step 4). If you already allowed it in step 3, it may skip this.
1. Click **Authorize access** and choose **admin.katha@gmail.com**.
2. You'll see **"Google hasn't verified this app"**. That's expected: this is your own private script, and Google
   only reviews apps that are published for other people to use. Nothing is wrong.
   Click **Advanced** (bottom left), then **Go to Portfolio contact form (unsafe)**.
3. The next screen lists what the script may do. It asks only to **send email as you** (it can't read your inbox,
   your Drive or anything else). If the screen shows checkboxes, tick that one (or **Select all**).
   Click **Allow** (or **Continue**).

## 6. Copy the web app URL
After **Deploy**, the dialog shows a **Web app** URL that starts with `https://script.google.com/macros/s/` and ends
with `/exec`. Click **Copy**, and keep it somewhere private for the next step.
(You can find it again later under **Deploy → Manage deployments**.)

Quick check: paste the URL into a browser tab. You should see `{"ok":false,"error":"post_only"}`. That means it's
live (the website sends messages with POST, which a browser tab doesn't).

## 7. Connect the website (Vercel)
1. Vercel → the project → **Settings → Environment Variables**.
2. **Add:** `CONTACT_WEBHOOK_URL` = the web app URL from step 6. Tick **Production** and **Preview**. Click **Save**.
3. Check that `CONTACT_SECRET` is also there for **Production** and **Preview**, with the same value as the script property.
4. **Deployments** → the latest deployment → **⋯** → **Redeploy**.
   The site decides between the form and "Email me instead" when it's built, so the form appears only after a new build.

## 8. Test it
1. Open the live site and go to the contact section. You should see the form (not "Email me instead").
2. Fill it in with your own name and email address and click **Send message**. (If you're very quick, it asks you to
   press Send again: it refuses messages sent within 3 seconds, which stops simple spam bots.)
3. Within a few seconds "Thanks, … Your message is on its way" appears, and an email arrives at
   ehjaylorenzo2@gmail.com with a copy at admin.katha@gmail.com. The first ones may land in Spam
   (see [Spam and Promotions](#spam-and-promotions)).

---

## What each message looks like
- **From:** Portfolio contact form `<admin.katha@gmail.com>` (the account that owns the script)
- **To:** ehjaylorenzo2@gmail.com
- **CC:** admin.katha@gmail.com
- **Reply-To:** the visitor's address, so **Reply** answers the visitor directly. (**Reply all** also copies the admin account.)
- **Subject**, by the inquiry type the visitor chose (the company in brackets only when they gave one):

  | The visitor chose | Subject |
  |---|---|
  | Hire full-time | `Hiring enquiry: Ana Cruz (Acme Studio)` |
  | Freelance project | `Freelance project: Ana Cruz (Acme Studio)` |
  | Other | `Message: Ana Cruz` |

- **Body** (plain text, the time in Philippine time):
  ```
  New message from the contact form on Ehjay Lorenzo's portfolio.

  Name: Ana Cruz
  Email: ana@example.com
  Company: Acme Studio
  Inquiry type: Freelance project
  Page: /work/sabbath-spa
  Received: 2026-10-08 14:30 (Philippine time)

  Message:
  Hello Ehjay, …

  --
  Reply to this email to answer Ana Cruz directly.
  ```
  **Company** and **Page** show `-` when empty. **Page** is the page on the site the visitor wrote from.

## Changing who gets the messages
1. Go to https://script.google.com as admin.katha@gmail.com, open **Portfolio contact form**, and click `Code.gs`.
2. Edit these two lines near the top. Keep the quotes and the semicolon:
   ```js
   const TO = 'ehjaylorenzo2@gmail.com';
   const CC = 'admin.katha@gmail.com';
   ```
   For several addresses, separate them with commas inside the quotes (`'one@example.com,two@example.com'`).
   For no copy, use `const CC = '';`.
3. Click **Save**.
4. Publish the change **without changing the URL**: **Deploy → Manage deployments** → select the **Contact form**
   deployment → the pencil icon (**Edit**) → **Version:** **New version** → **Deploy**.

Don't use **New deployment** for changes: that creates a second, different URL, and the website would keep using the old one.
Every extra address uses up the daily limit faster (next section).

To install a newer `docs/contact/apps-script.gs` from the website, do the same: paste it over the old code (step 1),
check the `TO` and `CC` lines, **Save**, then **New version** as above. If Google asks for permission again, follow step 5.

## The daily email limit
A free Gmail account can send script emails to **100 recipients a day**. Each message has two recipients (To and CC),
so that's about **50 messages a day**. When the limit is reached, the form says the message couldn't be sent and shows
Ehjay's email address instead; the limit frees up again within 24 hours.
**checkSetup** (step 3) shows how many recipients are left today.

## Spam and Promotions
The first messages may land in **Spam** or **Promotions**, in either inbox. Open the message and click **Not spam**
(or drag it to **Primary**). To keep them out of Spam for good, in ehjaylorenzo2@gmail.com:
1. Click the **Show search options** icon at the right of the Gmail search bar.
2. **From:** `admin.katha@gmail.com` → **Create filter**.
3. Tick **Never send it to Spam** (and, if you like, **Categorize as: Primary**) → **Create filter**.

## Changing the secret
1. Make a new one. Press the **Windows key**, type **PowerShell**, open **Windows PowerShell**, paste this line and press **Enter**:
   ```powershell
   $b = [byte[]]::new(32); [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); -join ($b | ForEach-Object { $_.ToString('x2') }) | Set-Clipboard
   ```
   Nothing is printed: a 64-character random secret is now on your clipboard.
   (Alternative, if Node.js is installed: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.)
2. In the script: **Project Settings → Script Properties** → **Edit script properties** → replace the value of
   `CONTACT_SECRET` → **Save script properties**. No new deployment is needed: the script reads it on every message.
3. In Vercel: **Settings → Environment Variables** → `CONTACT_SECRET` → **⋯** → **Edit** → paste → **Save**, then
   **Deployments → ⋯ → Redeploy**. If you test on this PC, change it in `.env.local` too.

Until both sides match, the form answers "couldn't be sent" and shows Ehjay's email address, so do both at once.

## Troubleshooting
When a message fails, the website's log (Vercel → the project → **Logs**, or the `run-local.bat` window) has a line
`[contact] webhook failed: …` with the reason. In Apps Script, **Executions** (left sidebar) lists every run of the
script and any error (never what the visitor wrote).

| The log says | What to do |
|---|---|
| `the script answered ok:false (unauthorized)` | The secret in the script property and on the website differ. Look for a stray space or a missing character, fix one side, and redeploy if you changed Vercel. |
| `… (not_configured)` | The `CONTACT_SECRET` script property is missing, misspelled, or shorter than 16 characters (step 2). |
| `… (invalid)` | The script rejected the fields (no name, no message, or an email address it couldn't read). The website checks the same things first, so the script is probably out of date: paste the current `docs/contact/apps-script.gs` and publish a new version. |
| `… (bad_request)` | The request didn't look like the website's (not JSON, or over 30,000 characters). Check that `CONTACT_WEBHOOK_URL` is this script's URL. |
| `… (mail_failed)` | The script couldn't send the email. Usually the [daily limit](#the-daily-email-limit) is used up (it frees up within 24 hours), or the permission was removed: run **checkSetup** (step 3) and allow it again. **Executions** shows the error. |
| `… (server_error)` | Something unexpected failed in the script. **Executions** shows the error. If the code was edited by hand, paste `docs/contact/apps-script.gs` again. |
| `the response was not JSON (check the deployment's access is Anyone)` | **Who has access** isn't **Anyone** (**Deploy → Manage deployments** → pencil → **Who has access: Anyone** → **Deploy**), or the URL is wrong: it must end in `/exec`, not `/dev`. |
| `no answer within 10s` | Google was slow. Try again; if it keeps happening, check **Executions**. |
| `HTTP 404` | The deployment was deleted or archived. Copy the current URL from **Manage deployments** into Vercel and redeploy. |
| "Email me instead" instead of the form | Both variables are in Vercel (or `.env.local`), spelled exactly, the URL starts with `https://`, and the secret has at least 16 characters. Then redeploy (or run `run-local.bat` again). The build log has a `[contact] …` line saying which value is the problem. |
| "Thanks…" appears but no email | Check **Spam** and **Promotions** in both inboxes, then **Executions** in Apps Script. |

## Testing on this PC (optional)
1. Open the website's folder in File Explorer. If there is no file called `.env.local`, copy `.env.example`, paste it
   into the same folder, and rename the copy to `.env.local`. (If Windows hides the name, use PowerShell in that
   folder: `Copy-Item .env.example .env.local`.)
2. Open `.env.local` with Notepad and fill in the two lines, with no quotes and no spaces:
   ```
   CONTACT_WEBHOOK_URL=https://script.google.com/macros/s/…/exec
   CONTACT_SECRET=…the same secret…
   ```
3. Save, close Notepad, and double-click `run-local.bat`. It rebuilds the site (needed after changing these values)
   and opens it at http://localhost:3000.
4. Go to http://localhost:3000/#contact and send a message as in step 8. This sends a real email, which counts
   towards the daily limit.

## For developers
- The form: `components/contact/` · the server action and validation: `lib/contact/` · the script: `docs/contact/apps-script.gs`.
- The website sends the inquiry type's label (`INQUIRY_TYPES` in `lib/contact/fields.ts`) and the script chooses the
  subject from it (`subject_()`). If a label changes, change the script too; `apps-script.test.mjs` fails until they agree.
- Test without Google: `node tests/e2e/contact.test.mjs` (builds the site, runs it against a local fake of the web app
  in `tests/e2e/fake-webhook.mjs`, and checks the flows with and without JavaScript) and
  `node tests/e2e/apps-script.test.mjs` (runs the script against mocked MailApp, PropertiesService, Utilities and
  ContentService).
