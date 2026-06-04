# TaskVault — AWS Three-Tier Deployment

---

## Infrastructure Setup

### VPC & Networking

1. Created VPC
2. Created 2 public subnets and 2 private subnets
3. Created IGW and attached to VPC
4. Created NAT Gateway in public subnet and allocated EIP
5. Created public route table for public subnets — routed traffic through IGW
6. Associated public subnets with public route table
7. Created private route table — routed outbound traffic through NAT Gateway
8. Associated private subnets with private route table
9. Created S3 bucket for React frontend with CloudFront OAC — bucket can only be accessed through CloudFront, not directly

---

### Instance Deployment

1. Created backend EC2 in private subnet 1 — no public IP
2. Created Bastion Host in public subnet 2 — with public IPv4
3. Created RDS in private DB subnet
4. Created ALB in public subnet 1

---

## Deployment of Node Backend

### Step 1 — Built Node backend server

### Step 2 — Encountered Database Connection Error

**Error:**
```
error: no pg_hba.conf entry for host "10.0.3.146",
user "postgres", database "tododb", no encryption
```

**Fix:** Added SSL to PostgreSQL pool config:
```javascript
ssl: {
  rejectUnauthorized: false
},              // ← comma was missing
max: 10,
```

---

### Step 3 — Mixed Content Error

After the DB fix:
- Mapped `api.irshadshaikh.online` to ALB
- Built frontend with `REACT_APP_API_URL=http://api.irshadshaikh.online/api`
- Pushed build to S3

This caused a **Mixed Content Error**.

**What is Mixed Content Error?**

When a browser loads a webpage, it enforces a security rule:

> If the page is served over HTTPS, every resource it requests must also be HTTPS.
> If anything is loaded over HTTP on an HTTPS page — the browser blocks it.

**Exact Situation:**
```
Frontend: https://d1234abcdef.cloudfront.net  ← HTTPS ✅ (free AWS cert)
API:      http://api.irshadshaikh.online       ← HTTP  ❌ (ALB had no ACM)

Browser: Page is HTTPS but API is HTTP → Mixed Content → BLOCKED ❌
```

**Fix:**
1. Requested ACM SSL certificate and attached it to ALB
2. Added new listener rule on port 443 and associated target group
3. Rebuilt frontend with:
```bash
REACT_APP_API_URL=https://api.irshadshaikh.online/api
```

---

### Step 4 — Custom Domain on CloudFront

- Requested new ACM certificate in `us-east-1` for the CloudFront domain
- Added alternate domain `irshadshaikh.online` in the CloudFront distribution
- Updated `CLIENT_URL` to the custom domain

---

### Step 5 — CORS Error (if CLIENT_URL is not updated)

If `CLIENT_URL` is not updated to match the frontend domain, a CORS error occurs.

**Key Difference — Mixed Content vs CORS:**

| | Mixed Content | CORS |
|---|---|---|
| When checked | Before request is sent | After response comes back |
| Who stops it | Browser blocks the request | Browser blocks the response |
| Server involved | ❌ Request never reaches server | ✅ Request reaches server |
| Fix needed on | Frontend (use HTTPS) | Backend (set correct origin) |

