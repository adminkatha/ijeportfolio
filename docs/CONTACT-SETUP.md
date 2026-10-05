# Contact form setup (Google Sheet)

The website's contact form sends each message to a Google Sheet and emails a copy to ehjaylorenzo2@gmail.com.
It works through a small script that lives inside the sheet (a Google Apps Script "web app").
The website needs two values to reach it:

- `CONTACT_WEBHOOK_URL`: the web app's address (it ends with `/exec`)
- `CONTACT_SECRET`: a long random password that you make once and put in two places (the script and the website)

Until both are set, the site shows an **"Email me instead"** link where the form would be, so nothing breaks.

> **Keep these private.** Never paste the sheet link, the sheet ID, the `/exec` address or the secret into the
> code, a commit, an issue or a chat. They belong only in the script's settings, `.env.local` on this PC, and
> Vercel's settings. (`pnpm check:push` refuses to push Apps Script and Sheets addresses.)

Time needed: about 10 minutes.

---

## 1. Open the script editor
1. Open the Google Sheet (use the link you already have), signed in as the Google account that owns it.
2. In the menu, click **Extensions → Apps Script**. A new tab opens with a file called `Code.gs`.
3. Click the project name at the top left ("Untitled project") and rename it to **Portfolio contact form**.

## 2. Paste the script
1. In the website's folder, open `docs\contact\apps-script.gs` (right-click → Open with → Notepad).
2. Select everything (**Ctrl+A**) and copy it (**Ctrl+C**).
3. In the Apps Script tab, click inside `Code.gs`, select everything (**Ctrl+A**), and paste (**Ctrl+V**) so the old text is replaced.
4. Click the **Save** icon (the floppy disk) or press **Ctrl+S**.

The script writes to a tab called **Submissions** (it creates it, with a header row, on the first message; a brand-new empty sheet's only tab is renamed instead). To use a different tab name, change `SHEET_NAME` near the top of the script.

## 3. Make the secret
1. Press the **Windows key**, type **PowerShell**, and open **Windows PowerShell**.
2. Paste this line and press **Enter**:
   ```powershell
   $b = [byte[]]::new(32); [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); -join ($b | ForEach-Object { $_.ToString('x2') }) | Set-Clipboard
   ```
   Nothing is printed: a 64-character random secret is now on your clipboard. Paste it into a private note for the next steps (you'll need it twice), then delete the note when you're done.

   (Alternative, if Node.js is installed: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.)

## 4. Store the secret in the script
1. In the Apps Script tab, click **Project Settings** (the gear icon in the left sidebar).
2. Scroll to **Script Properties** and click **Add script property**.
3. **Property:** `CONTACT_SECRET` · **Value:** paste the secret. No spaces before or after it.
4. Click **Save script properties**.

## 5. Check the setup (optional, recommended)
1. Click **Editor** (the `< >` icon in the left sidebar).
2. In the toolbar, open the function list (it says `doPost` or `myFunction`) and choose **checkSetup**. Click **Run**.
3. Google asks for permission the first time: follow step 7 below ("Authorize"), then click **Run** again.
4. The **Execution log** at the bottom should say `Setup OK…`, and the sheet now has a **Submissions** tab with the header row (Timestamp, Name, Email, Company, Inquiry type, Message, Page).

## 6. Deploy it as a web app
1. Click **Deploy** (top right) → **New deployment**.
2. Next to **Select type**, click the gear icon → **Web app**.
3. **Description:** `Contact form`.
4. **Execute as:** **Me** (your email address). The script then writes to your sheet and sends email as you.
5. **Who has access:** **Anyone**. (This lets the website reach it without a Google sign-in. Nobody can add rows without the secret.)
6. Click **Deploy**.

## 7. Authorize
Google asks for permission the first time (during step 5 or 6):
1. Click **Authorize access** and choose your Google account.
2. You'll see **"Google hasn't verified this app"**. That's expected: the app is your own script, not something published by a company, so Google has never reviewed it.
   Click **Advanced**, then **Go to Portfolio contact form (unsafe)**.
3. Review the list. It asks to **see and edit this one spreadsheet** (only the sheet it's attached to, thanks to `@OnlyCurrentDoc` in the script) and to **send email as you** (the notification). Click **Allow**.

## 8. Copy the web app URL
After **Deploy**, the dialog shows a **Web app URL** that starts with `https://script.google.com/macros/s/` and ends with `/exec`. Click **Copy**, and keep it with the secret for the next step.
(You can find it again later under **Deploy → Manage deployments**.)

Quick check: paste the URL into a browser tab. You should see `{"ok":false,"error":"post_only"}`. That means it's live (the website sends messages with POST, which a browser tab doesn't).

## 9. Give both values to the website (this PC)
1. Open the website's folder in File Explorer.
2. If there is no file called `.env.local`, copy `.env.example`, paste it into the same folder, and rename the copy to `.env.local`. (If Windows hides the name, use PowerShell in that folder: `Copy-Item .env.example .env.local`.)
3. Open `.env.local` with Notepad and fill in the two lines, with no quotes and no spaces:
   ```
   CONTACT_WEBHOOK_URL=https://script.google.com/macros/s/…/exec
   CONTACT_SECRET=…the 64-character secret…
   ```
4. Save and close Notepad.

## 10. Restart the site
The form is built into the page when the site is built, so a plain refresh isn't enough:
1. If the site is running, close its window (or press **Ctrl+C** in it).
2. Double-click `run-local.bat` again. It rebuilds the site and opens it at http://localhost:3000.

## 11. Test it
1. Go to http://localhost:3000/#contact. You should see the form (not "Email me instead").
2. Fill it in with your own details and click **Send message**. (If you're very quick, it asks you to press Send again: it refuses messages sent within 3 seconds, which stops simple spam bots.)
3. Within a few seconds: "Thanks, … Your message is on its way" appears, a new row appears in the **Submissions** tab, and an email arrives at ehjaylorenzo2@gmail.com. Replying to that email replies to the visitor.
4. Delete the test row if you like.

## 12. Later, on Vercel
When the site is on Vercel (see `docs/DEPLOY.md`):
1. Vercel → your project → **Settings → Environment Variables**.
2. Add `CONTACT_WEBHOOK_URL` and `CONTACT_SECRET` with the same values, ticking **Production** and **Preview**. Click **Save**.
3. **Deployments** → the latest deployment → **⋯** → **Redeploy**. (Like locally, the form only appears after a new build.)
4. Test the live form the same way.

---

## Updating the script later
Edit it in the Apps Script editor and **Save**, then publish the change **without changing the URL**:
1. **Deploy → Manage deployments**.
2. Select the **Contact form** deployment and click the pencil icon (**Edit**).
3. **Version:** **New version** → **Deploy**.

Don't use **New deployment** for updates: that creates a second, different URL, and the website would keep using the old one.

## Changing the secret
1. Make a new one (step 3).
2. Replace it in **Project Settings → Script Properties** (no new deployment needed: the script reads it on every message).
3. Replace it in `.env.local` and in Vercel, then rebuild locally (`run-local.bat`) and redeploy on Vercel.
Until both sides match, the form answers "couldn't be sent" and offers your email address.

## Troubleshooting
| What you see | What to check |
|---|---|
| "Email me instead" instead of the form | Both variables are in `.env.local` (or Vercel), spelled exactly, the URL starts with `https://`, and the secret has at least 16 characters. Then rebuild (`run-local.bat`, or Redeploy on Vercel). The build log prints a `[contact] …` line saying which value is the problem. |
| "Sorry, your message couldn't be sent" | The site's log (the `run-local.bat` window, or Vercel → Logs) shows `[contact] webhook failed: …` with the reason. **unauthorized**: the secret in the script property and in the website differ (look for a stray space). **not_configured**: the `CONTACT_SECRET` script property is missing. **not JSON**: **Who has access** isn't **Anyone**, or the URL is wrong (it must end in `/exec`, not `/dev`). **no answer within 10s**: Google was slow; try again. **HTTP 404**: the deployment was deleted or archived; copy the current URL from **Manage deployments**. |
| A row appears but no email | Check Spam. A free Google account can send about 100 script emails a day. In Apps Script, **Executions** (left sidebar) lists every run and any error. |
| A value in the sheet starts with `'` | On purpose: text that starts with `=`, `+`, `-` or `@` is stored as plain text so the sheet never runs it as a formula. |
| "Almost there… press Send again" | Normal when the visitor's browser has JavaScript turned off (the first press starts the anti-spam timer), or when the page was left open for more than a day. |

## For developers
- The form: `components/contact/` · the server action and validation: `lib/contact/` · the script: `docs/contact/apps-script.gs`.
- Test without Google: `node tests/e2e/contact.test.mjs` (builds the site, runs it against a local fake of the web app in `tests/e2e/fake-webhook.mjs`, and checks the flows with and without JavaScript) and `node tests/e2e/apps-script.test.mjs` (runs the script against mocked Google services).
