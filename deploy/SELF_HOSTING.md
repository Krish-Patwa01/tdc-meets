# Apna Jitsi server, Oracle Cloud pe

Yeh steps ek baar karne hain. Uske baad platform pura apna ho jayega, koi limit nahi aur koi doosre server pe depend nahi.

## Step 1: Oracle Cloud account

1. cloud.oracle.com pe jaake free account banao
2. Card verify karna padega, paisa nahi katta. Always Free resources par charge nahi lagta.
3. Region chunte waqt dhyan rakhna: baad mein badla nahi ja sakta. India ke liye Mumbai ya Hyderabad theek hai.

### Debit card se signup, jo cheezein atakti hain

**International transactions on karo.** Yeh sabse badi wajah hai fail hone ki. Zyadatar Indian debit cards pe yeh by default band rehta hai. Bank ke app mein jaao, Cards, Manage, aur "International" ya "Online International" wala toggle on karo. Kuch banks isko 24 ghante ke liye hi on rakhte hain, toh on karke turant signup kar lena.

**Visa ya Mastercard use karo.** RuPay aksar reject hota hai.

**Ek dollar ka hold aayega.** Woh charge nahi hai, kuch din mein apne aap wapas aa jaata hai. Account mein thoda balance hona chahiye warna verification fail ho jayegi.

**Card declined aaye toh:** doosra browser try karo, ya thodi der baad. Baar baar try karne se bank temporary block laga deta hai, toh ek do baar se zyada mat karna ek saath.

## Step 2: VM banao

Compute, Instances, Create Instance.

| Setting | Value |
|---|---|
| Image | Ubuntu 22.04 |
| Shape | VM.Standard.A1.Flex |
| OCPUs | 2 |
| Memory | 12 GB |
| SSH key | Apni key upload karo, ya nayi generate karke private key download kar lo |

A1.Flex shape Always Free hai 4 OCPU aur 24 GB tak. Maine 2 aur 12 rakha hai kyunki utna kaafi hai aur baaki bacha rahega.

Instance ka Public IP note kar lena.

**Agar "Out of capacity" aaye:** A1 shapes kai regions mein bhare rehte hain. Thodi der baad ya alag availability domain pe try karo. Yeh Oracle ki taraf se hota hai, iska koi jugaad nahi.

## Step 3: Ports kholo

VM ke Subnet, Security List, Add Ingress Rules. Yeh chaar rules chahiye:

| Source | Protocol | Port |
|---|---|---|
| 0.0.0.0/0 | TCP | 80 |
| 0.0.0.0/0 | TCP | 443 |
| 0.0.0.0/0 | UDP | 10000 |
| 0.0.0.0/0 | TCP | 22 |

10000/udp wala sabse zaroori hai. Woh na khula ho toh page toh khulega par call kabhi connect nahi hogi.

## Step 4: DNS point karo

Domain ke DNS panel mein:

```
Type: A
Name: meet
Value: <VM ka public IP>
TTL: 300
```

Certificate lene se pehle yeh propagate hona zaroori hai. Check karne ke liye:

```bash
nslookup meet.thedarknetcommunity.com
```

VM ka IP dikhna chahiye. Na dikhe toh 10 minute ruk ke phir dekho.

## Step 5: Jitsi install

VM mein SSH karo, phir:

```bash
sudo bash jitsi-setup.sh meet.thedarknetcommunity.com krish@thedarknetcommunity.com
```

Script ye sab karti hai: hostname set, firewall ports, Jitsi install, Let's Encrypt certificate, aur nginx mein woh header jo humare app ko embed karne deta hai.

Script ko main test nahi kar paya kyunki server abhi hai nahi. Isliye ek ek step ka output padhte jaana, kahin atke toh error bata dena, main fix kar dunga.

## Step 6: Check karo

Browser mein `https://meet.thedarknetcommunity.com` kholo. Jitsi ka apna page khulna chahiye, bina kisi login ke.

Do bande alag alag device se ek hi room join karke dekho ki video aur audio dono chal rahe hain. Yahan tak chal gaya toh server ready hai.

## Step 7: Frontend

Iske baad main frontend ko is server pe point karunga aur video UI pura naye sire se likhunga, `lib-jitsi-meet` ke saath. Tab Jitsi ka koi bhi hissa nahi dikhega, sirf video streams aayenge aur baaki sab humara hoga.

Frontend ka `.env`:

```
REACT_APP_JITSI_DOMAIN=meet.thedarknetcommunity.com
```

## Kharcha

| Cheez | Kharcha |
|---|---|
| Oracle VM | 0, Always Free |
| Bandwidth | 0, 10 TB monthly free |
| SSL certificate | 0, Let's Encrypt |
| Domain | Saal ka 300 se 500 |
