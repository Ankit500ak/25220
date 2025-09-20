
Frontend for URL Shortener

Install & Run:
```
cd "Frontend Test Submision"
npm install
npm run dev
```

The frontend expects backend at `http://localhost:4000` by default.

Use a different backend host/port with Vite env var:
```
# PowerShell example: run frontend using backend at port 5001
$env:VITE_BACKEND = "http://localhost:5001"
npm run dev
```

