# Deploy: frontend on Vercel, backend on Render

Frontend Vercel pe, backend Render pe. Dono free hain.

Vercel apne functions mein WebSockets support karta hai, toh import karte waqt woh backend ko bhi ek service ke roop mein detect kar lega. Us option ko chhod dena, do wajah se:

1. Hobby plan pe connection function ki max duration tak hi tikti hai, jo 300 second hai. Ghante bhar ke workshop mein har paanch minute pe sabka reconnect hoga.
2. Vercel kai instances chalata hai aur har user kisi bhi instance pe ja sakta hai. Humara chat `io.to(room).emit()` se broadcast karta hai, jo sirf usi instance ke logon tak pahunchta hai. 300 log bant jayenge aur message sabko nahi milega. Isko theek karne ke liye Redis aur socket.io ka redis adapter chahiye.

Render pe backend ek hi lambi chalne wali process hoti hai, toh Socket.io bina kisi extra cheez ke chal jaata hai.

## Step 1: Code GitHub pe daalo

```bash
git push
```

Repo: https://github.com/Krish-Patwa01/tdc-meets

## Step 2: Backend, Render pe

1. render.com pe GitHub se sign in karo
2. New, Web Service, apna repo chuno
3. Settings:

| Field | Value |
|---|---|
| Root Directory | `backend` |
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
| Root Directory | `frontend` |

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
