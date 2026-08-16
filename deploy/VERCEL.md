# Deploy: frontend on Vercel, backend on Render

Vercel sirf frontend chala sakta hai. Backend Vercel pe nahi ja sakta kyunki usme Socket.io hai, jo ek khuli connection maangta hai, aur Vercel ke serverless functions request khatam hote hi band ho jaate hain. Chat aur raise hand kaam nahi karenge.

Isliye backend Render pe jayega. Dono free hain.

## Step 1: Code GitHub pe daalo

```bash
git add meet-platform
git commit -m "Add TDC Meets platform"
git push
```

## Step 2: Backend, Render pe

1. render.com pe GitHub se sign in karo
2. New, Web Service, apna repo chuno
3. Settings:

| Field | Value |
|---|---|
| Root Directory | `meet-platform/backend` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance Type | Free |

4. Environment variables daalo:

```
JWT_SECRET=<koi lamba random string>
ADMIN_EMAIL=krish@thedarknetcommunity.com
ADMIN_PASSWORD=<naya password, purana mat rakhna>
NODE_ENV=production
FRONTEND_URL=https://meet.thedarknetcommunity.com
```

5. Deploy karo. URL milega jaise `https://tdc-meet-api.onrender.com`. Woh copy kar lo.

## Step 3: Frontend, Vercel pe

1. vercel.com pe GitHub se sign in karo
2. Add New, Project, apna repo chuno
3. Settings:

| Field | Value |
|---|---|
| Framework Preset | Create React App |
| Root Directory | `meet-platform/frontend` |

4. Environment variable:

```
REACT_APP_API_URL=https://tdc-meet-api.onrender.com
```

Render wala URL yahan daalna hai, apna wala.

5. Deploy karo.

## Step 4: Domain jodo

Vercel project mein Settings, Domains, `meet.thedarknetcommunity.com` add karo. Vercel jo CNAME batayega woh apne DNS panel mein daal do.

## Do problem jo pehle se pata honi chahiye

### Free Render 15 minute baad so jaata hai

Koi request na aaye toh service band ho jaati hai. Agli request pe wapas uthne mein 50 second lagte hain. Matlab workshop se pehle koi link kholega toh use ek baar lamba wait milega.

Iska aasan hal: workshop se 10 minute pehle khud admin panel khol lo, service jaag jayegi.

### Meetings ka data mit sakta hai

Abhi meetings `backend/data/` ki JSON files mein rehti hain. Render ka free plan restart pe files mita deta hai. Matlab aaj banayi meeting kal gayab mil sakti hai.

Yeh tere liye asli problem hai kyunki tu meeting pehle se banata hai.

Iska hal: storage ko MongoDB Atlas pe le jaana. Atlas ka free tier 512 MB deta hai, card nahi maangta, aur humare data ke liye woh bahut zyada hai. Yeh kaam abhi baaki hai, bolna toh kar dunga.

## Kharcha

| Cheez | Kharcha |
|---|---|
| Vercel | 0 |
| Render free | 0 |
| MongoDB Atlas free | 0 |
| Domain | Saal ka 300 se 500 |
