# 🚀 Flowlist — How to Put Your App on the Internet

## Before we start: What are we actually doing?

Right now, your app only lives inside Claude. We need to do 3 things:

1. **Get a place to store your code** (GitHub — think of it like Google Drive, but for code)
2. **Get a place to store your data** (Supabase — this is your database where everyone's tasks get saved)
3. **Get a place to run your app** (Vercel — this puts your app on the internet with a real URL)

All three are **completely free**. You won't need a credit card.

Let's start!

---

## 🧑‍💻 STEP 1: Create a GitHub Account (5 minutes)

GitHub is where your app's code will live. Think of it like a special Google Drive made for code.

1. Open your browser (Chrome, Safari, whatever you use)
2. Go to **github.com**
3. You'll see a page that says "Let's build from here"
4. Click the big **Sign up** button
5. Enter your email address
6. Create a password (make it strong!)
7. Pick a username — this will be part of your app's address later, so pick something nice
   - Good: `vivek-codes`, `vivekbuilds`
   - Avoid: `xXx_darklord_xXx`
8. They'll ask you to solve a little puzzle to prove you're human
9. They'll send a code to your email — go check your email, copy the code, paste it
10. Click **Continue**

**That's it! You now have a GitHub account.**

---

## 💻 STEP 2: Install Tools on Your Computer (10 minutes)

You need to install 2 things. Think of these like apps on your phone — you install them once and they stay there.

### 2A: Install Node.js

Node.js is like an engine that runs your app on your computer.

1. Open your browser
2. Go to **nodejs.org**
3. You'll see TWO big green buttons. Click the one that says **LTS** (the left one — LTS means "Long Term Support", basically the stable/safe version)
4. A file will download (something like `node-v20.x.x.pkg` on Mac or `.msi` on Windows)
5. **Double-click the downloaded file**
6. An installer will open. Just keep clicking:
   - **Continue** → **Continue** → **Agree** → **Install**
   - It might ask for your computer password — that's normal, type it in
7. Click **Close** when it's done

**Let's check if it worked:**

8. On Mac: Open the app called **Terminal** (search for it in Spotlight — press Cmd+Space and type "Terminal")
   On Windows: Open the app called **Command Prompt** (search for it in the Start menu)
9. You'll see a scary-looking black/white window with a blinking cursor. Don't worry!
10. Type this exactly and press Enter:
    ```
    node --version
    ```
11. You should see something like `v20.11.0` (the numbers might be different, that's fine)
12. If you see that — **Node.js is installed!**
13. If you see "command not found" — try closing Terminal and opening it again. If it still doesn't work, restart your computer and try again.

### 2B: Install Git

Git is a tool that lets you upload your code to GitHub from your computer.

**On Mac:**
1. Open **Terminal** (same as before)
2. Type this and press Enter:
   ```
   git --version
   ```
3. If Mac asks you to "install developer tools" — click **Install** and wait
4. If it shows a version number like `git version 2.x.x` — you already have it!

**On Windows:**
1. Go to **git-scm.com**
2. Click the big **Download for Windows** button
3. Double-click the downloaded file
4. The installer has MANY screens. Just click **Next** on every single screen. Don't change anything.
5. Click **Install** at the end
6. Click **Finish**

**Check if it worked:**
7. Open Terminal (Mac) or Command Prompt (Windows)
8. Type:
   ```
   git --version
   ```
9. You should see `git version 2.x.x` — **Git is installed!**

---

## 🗄️ STEP 3: Set Up Supabase — Your Database (10 minutes)

Supabase is where all the data gets saved — your hats, todos, archives, everything. Each person who signs up gets their own private space.

### 3A: Create your Supabase account

1. Open your browser
2. Go to **supabase.com**
3. Click **Start your project** (big green button at top)
4. Click **Continue with GitHub** (this is the easiest — it connects to the GitHub account you just made)
5. GitHub will ask "Authorize Supabase?" — click **Authorize**

### 3B: Create your project

6. You're now in the Supabase dashboard. Click the **New project** button
7. You'll see a form:
   - **Organization**: It will have one already (your name). Leave it.
   - **Name**: Type `flowlist`
   - **Database Password**: Click **Generate a password** and then **COPY IT AND SAVE IT SOMEWHERE SAFE** (like in your phone's notes). You'll need this later.
   - **Region**: Pick the one closest to you. If you're in India, pick **South Asia (Mumbai)**
8. Click **Create new project**
9. **Wait 2-3 minutes.** Supabase is setting up your database. You'll see a loading screen. Go get some water.

### 3C: Create your database table

This is where we tell the database what kind of data to expect.

10. In the left sidebar (the menu on the left), click on **SQL Editor** (it has a little `>_` icon)
11. You'll see a code editor (like a notepad but for database commands)
12. Click **New query** (top left)
13. **Delete anything that's already in the editor**
14. Now open the file called `supabase-setup.sql` that came with your project
15. **Copy EVERYTHING inside that file**
16. **Paste it into the Supabase SQL editor**
17. Click the green **Run** button (or press Ctrl+Enter / Cmd+Enter)
18. At the bottom, you should see **"Success. No rows returned"** — that means it worked!
19. If you see an error in red — make sure you copied the ENTIRE file, not just part of it

### 3D: Turn off email verification (for testing)

By default, when someone signs up, they need to click a link in their email. Let's turn this off for now so testing is easier.

20. In the left sidebar, click **Authentication** (person icon)
21. At the top, click **Providers**
22. Click on **Email** (it should say "Enabled")
23. Find the toggle that says **"Confirm email"**
24. **Turn it OFF** (toggle it so it's grey/disabled)
25. Click **Save**

> 💡 When your app is ready for real users, come back here and turn this ON so people have to verify their email.

### 3E: Get your secret keys (VERY IMPORTANT!)

26. In the left sidebar, click on **Settings** (the gear ⚙️ icon at the bottom)
27. Click on **API** (under "Configuration")
28. You'll see a page with important information. Find these two things:

**Project URL** — It looks like:
```
https://abcdefghijk.supabase.co
```

**anon public key** — Under "Project API keys", the one labeled `anon` `public`. It's a very long string that starts with `eyJ...`

29. **COPY BOTH OF THESE AND SAVE THEM.** Paste them into a note on your phone, or a text file on your computer. You'll need them in Step 5.

Here's what they should look like (yours will be different):
```
URL:  https://xyzabcdef.supabase.co
KEY:  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im...
```

---

## 📁 STEP 4: Set Up Your Project Folder (5 minutes)

Now we need to put the code files on your computer and install some stuff.

### 4A: Extract the zip file

1. Find the `flowlist-deploy.zip` file that Claude gave you (it's probably in your Downloads folder)
2. **Double-click it** to extract/unzip it
3. You should now have a folder called `flowlist-deploy`
4. **Move this folder** to somewhere easy to find, like your **Desktop**

### 4B: Open Terminal in the right place

5. Open **Terminal** (Mac) or **Command Prompt** (Windows)

6. You need to "go into" the folder. Type this:

   **On Mac:**
   ```
   cd ~/Desktop/flowlist-deploy
   ```

   **On Windows:**
   ```
   cd %USERPROFILE%\Desktop\flowlist-deploy
   ```

   > 💡 The `cd` command means "change directory" — it's like double-clicking a folder, but in text form.

7. To make sure you're in the right place, type:
   ```
   ls
   ```
   (On Windows, type `dir` instead)

   You should see files like `package.json`, `next.config.js`, `supabase-setup.sql`, etc. If you see these files, you're in the right place!

### 4C: Install dependencies

8. Now type this and press Enter:
   ```
   npm install
   ```

   > 💡 This downloads all the extra code your app needs to run. Think of it like installing the "ingredients" for your app.

9. **Wait 1-2 minutes.** You'll see a progress bar and lots of text scrolling. That's normal. Don't touch anything until you see it finish and your cursor is blinking again.

10. If you see `added XXX packages` at the end — **it worked!**

---

## 🔑 STEP 5: Add Your Secret Keys (2 minutes)

Your app needs to know WHERE your database is and HOW to connect to it. We do this by creating a special secret file.

1. In your `flowlist-deploy` folder, you need to create a new file called **exactly** `.env.local`

   **On Mac:**
   In Terminal (make sure you're still in the flowlist-deploy folder), type:
   ```
   nano .env.local
   ```
   This opens a tiny text editor inside Terminal.

   **On Windows:**
   In Command Prompt, type:
   ```
   notepad .env.local
   ```
   Notepad will ask "Do you want to create a new file?" — click **Yes**.

2. Type (or paste) these TWO lines, replacing the values with YOUR actual keys from Step 3E:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-url.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-long-key-starting-with-eyJ
   ```

   **Example** (yours will look different):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xyzabcdef.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJz...
   ```

3. **Save the file:**
   - On Mac (nano): Press `Ctrl + X`, then `Y`, then `Enter`
   - On Windows (notepad): Press `Ctrl + S`, then close Notepad

> ⚠️ **Important:** There should be NO spaces around the `=` sign. And make sure you don't have any extra blank lines.

---

## 🧪 STEP 6: Test It On Your Computer! (3 minutes)

Let's see if everything works before putting it on the internet.

1. In Terminal/Command Prompt (still in the flowlist-deploy folder), type:
   ```
   npm run dev
   ```

2. Wait about 10-15 seconds. You'll see something like:
   ```
   ▲ Next.js 14.2.0
   - Local: http://localhost:3000
   ```

3. **Open your browser** and go to: **http://localhost:3000**

4. You should see the Flowlist login screen with the green "flowlist" text!

5. Try these things:
   - Click **"create account"** at the bottom
   - Enter a name, email, and password
   - Click **"create account →"**
   - You should now see the app!

6. **If something went wrong:**
   - Look at the Terminal window — if there are red error messages, read them
   - Most common issue: the keys in `.env.local` are wrong. Double-check them.

7. **To stop the test server:** Go back to Terminal and press `Ctrl + C`

---

## 📤 STEP 7: Upload Your Code to GitHub (5 minutes)

Now we push your code to GitHub so Vercel can find it.

### 7A: Create a repository on GitHub

1. Open your browser and go to **github.com**
2. Make sure you're logged in (you should see your profile picture in the top right)
3. Click the **+** icon (top right, next to your profile) → **New repository**
4. Fill in:
   - **Repository name**: `flowlist`
   - **Description** (optional): `My productivity app`
   - Keep **Public** selected (Vercel needs to see it)
   - **DO NOT** check any boxes under "Initialize this repository" — leave them all unchecked!
5. Click the green **Create repository** button
6. You'll see a page with instructions. **Don't close this page** — we'll need it.

### 7B: Push your code

7. Go back to **Terminal** (make sure you're still in the `flowlist-deploy` folder)

8. Type these commands **one at a time**, pressing Enter after each one:

   ```
   git init
   ```
   > This tells Git "hey, this folder is now a code project"

   ```
   git add .
   ```
   > This tells Git "include ALL the files" (the dot `.` means "everything")

   ```
   git commit -m "first version of flowlist"
   ```
   > This creates a "snapshot" of your code, like saving a game

   ```
   git branch -M main
   ```
   > This names your main version "main"

   Now the important one. **Replace `YOUR-USERNAME`** with your actual GitHub username:
   ```
   git remote add origin https://github.com/YOUR-USERNAME/flowlist.git
   ```
   > This tells Git WHERE to upload (your GitHub repository)

   ```
   git push -u origin main
   ```
   > This UPLOADS everything to GitHub!

9. It might ask for your GitHub username and password.
   - **Username:** Your GitHub username
   - **Password:** This is NOT your GitHub password. You need a "Personal Access Token":
     1. Go to github.com → Click your profile picture → **Settings**
     2. Scroll down on the left sidebar → **Developer settings** (at the very bottom)
     3. Click **Personal access tokens** → **Tokens (classic)**
     4. Click **Generate new token** → **Generate new token (classic)**
     5. Give it a name like "flowlist deploy"
     6. Under **Expiration**, pick "90 days" or "No expiration"
     7. Check the box next to **repo** (this gives it permission to push code)
     8. Click **Generate token**
     9. **COPY THE TOKEN IMMEDIATELY** (you won't see it again!)
     10. Paste this token as your "password" when Terminal asks

10. Go back to your GitHub repo page (github.com/YOUR-USERNAME/flowlist) and **refresh the page**
11. You should now see all your files listed there! 🎉

---

## 🌐 STEP 8: Deploy on Vercel — GO LIVE! (5 minutes)

This is the big moment. Vercel takes your code from GitHub and puts it on the internet.

### 8A: Create Vercel account

1. Open your browser
2. Go to **vercel.com**
3. Click **Sign Up**
4. Click **Continue with GitHub** (this connects it to your GitHub account)
5. GitHub will ask "Authorize Vercel?" — click **Authorize**

### 8B: Import your project

6. You should now see the Vercel dashboard
7. Click **Add New...** → **Project**
8. You'll see a list of your GitHub repositories
9. Find **flowlist** and click the **Import** button next to it

### 8C: Add your secret keys

10. You'll see a configuration page. Scroll down to **Environment Variables**
11. You need to add TWO variables. For each one:
    - Click in the **Name** field and type the name
    - Click in the **Value** field and paste the value
    - Click **Add**

    | Name | Value |
    |------|-------|
    | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL (the `https://xxxx.supabase.co` one) |
    | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key (the long `eyJ...` one) |

12. Double check: You should see BOTH variables listed with little eye 👁️ icons

### 8D: DEPLOY!

13. Click the big **Deploy** button
14. **Wait 1-2 minutes.** You'll see a build log (lots of text). This is Vercel building your app.
15. When it's done, you'll see **"Congratulations!"** with confetti 🎉
16. You'll see a preview of your app and a URL like:
    ```
    flowlist-abc123.vercel.app
    ```

17. **Click on the URL.** Your app is now LIVE on the internet!

18. Test it:
    - Open it on your phone too!
    - Create an account
    - Add some hats and tasks
    - Close the browser, open it again, log in — your data should still be there!

---

## 📱 STEP 9: Share With Your Friends!

Copy your Vercel URL and send it to your friends via WhatsApp, email, whatever.

Tell them:
> "Hey! I built an app called Flowlist. Open this link: [your-url].vercel.app
> Click 'create account', enter your name/email/password, and you're in!
> Works on phone, tablet, and computer."

Each person gets their own private account. Nobody can see anyone else's tasks.

---

## 🎨 Want a Cool Domain Name? (Optional, costs ₹500-1000/year)

Instead of `flowlist-abc123.vercel.app`, you can have something like `flowlist.app` or `myflowlist.com`.

1. Go to **namecheap.com** or **domains.google.com**
2. Search for a domain name you like
3. Buy it (usually ₹500-1000 per year)
4. In Vercel, go to your project → **Settings** → **Domains**
5. Type in your domain name and click **Add**
6. Vercel will show you instructions to connect it (usually you need to change some DNS settings on Namecheap/Google Domains)

---

## 🔧 Troubleshooting — If Something Goes Wrong

### "npm: command not found"
You didn't install Node.js properly. Go back to Step 2A and install it again. After installing, close Terminal completely and open a new one.

### "git: command not found"
You didn't install Git properly. Go back to Step 2B.

### The app shows a blank white page
Open the browser's developer tools (press F12), click "Console" tab, and look for red errors. Usually this means your `.env.local` file has a typo.

### "Invalid login credentials" when trying to sign in
You're trying to sign in but you haven't created an account yet. Click "create account" first.

### "Check your email to confirm your account"
Either:
- Check your email inbox (and spam folder) for a confirmation link
- OR go back to Supabase → Authentication → Providers → Email → turn OFF "Confirm email"

### Data doesn't save / disappears after refresh
- Check the green dot next to "flowlist.app" in the header — is it green (saved) or yellow (saving) or red (error)?
- Open browser developer tools (F12) → Console tab → look for red errors
- Most likely cause: the SQL setup in Step 3C didn't run properly. Go back and run it again.

### "relation 'user_data' does not exist"
The SQL setup didn't work. Go to Supabase → SQL Editor → paste the `supabase-setup.sql` contents again → click Run.

### The app works locally but not on Vercel
You forgot to add the environment variables in Vercel (Step 8C). Go to Vercel → your project → Settings → Environment Variables → add both keys → then click "Redeploy" from the Deployments tab.

---

## 🔄 How to Update Your App Later

When you want to make changes (or when Claude helps you improve something):

1. Replace the changed files in your `flowlist-deploy` folder
2. Test locally first:
   ```
   npm run dev
   ```
3. If it works, push the update to GitHub:
   ```
   git add .
   git commit -m "describe what you changed"
   git push
   ```
4. **Vercel automatically detects the change and redeploys!** Within 1-2 minutes, your live app will be updated.

---

## 📋 Quick Reference Card

| Service | URL | What it does |
|---------|-----|-------------|
| GitHub | github.com/YOUR-USERNAME/flowlist | Stores your code |
| Supabase | supabase.com (your project dashboard) | Stores your data + handles logins |
| Vercel | vercel.com (your project dashboard) | Runs your app on the internet |

| Command | What it does |
|---------|-------------|
| `npm install` | Downloads app ingredients (run once) |
| `npm run dev` | Starts the app on your computer for testing |
| `git add .` | Marks all files for upload |
| `git commit -m "message"` | Saves a snapshot of your code |
| `git push` | Uploads to GitHub (then Vercel auto-deploys) |
| `Ctrl + C` | Stops the local test server |

---

**You did it! You just deployed a full web app with a database, user accounts, and a live URL. That's genuinely impressive.** 🎉
