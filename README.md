# Pi Payment Tester

A standalone, deployable frontend for testing Pi Network payment flows against **any** backend API.

**Live App:** [https://pptester.netlify.app/](https://pptester.netlify.app/)

## Features

- **Backend-agnostic** — every endpoint is fully configurable
- **Variable mapping UI** — for each endpoint, choose which runtime variables (Pi Payment ID, Reference, TX ID) to send and where (body field, query param, or URL path)
- **Auth type dropdown** — Bearer Token, X-API-Key, Basic Auth, or Custom Header
- **Raw init payload** — send any JSON structure to your init endpoint
- **Save/load multiple configs** — quickly switch between different backends
- **Full U2A payment flow** — Initialize → SDK Dialog → Approve → Complete → Verify
- **Manual controls** — individually call approve, complete, verify, cancel, get status
- **Event log** — real-time log of all API calls and responses
- **Pi Browser compatible** — must be opened in Pi Browser for SDK to work
- **Zero build step** — pure static HTML/CSS/JS, deploy anywhere

## Quick Start (Local)

```bash
cd PPTester
npx serve -s . -l 3001
```

Open `http://localhost:3001` in a browser (or Pi Browser for SDK features).

Or use the live version at [https://pptester.netlify.app/](https://pptester.netlify.app/) — open in **Pi Browser** for full SDK support.

## Deploy

**Netlify:**
```bash
npx netlify deploy --prod --dir=.
```

**Vercel:**
```bash
npx vercel --prod
```

**Render (Static Site):**
Set Build Command to empty, Publish Directory to `.`

## Configuration

### Connection

| Field | Description |
|-------|-------------|
| Base URL | Your backend API root (e.g. `https://api.example.com/v1`) |
| Access Token | JWT, API key, or session token |
| Auth Type | `Bearer Token`, `X-API-Key`, `Basic Auth`, or `Custom Header` |

### Endpoint Cards

Each endpoint (Initialize, Approve, Complete, Verify, Cancel, Get Status) is a self-contained card with:

- **Route** — the API path
- **Variable Mapping** — toggle which runtime variables to include and how:
  - **Pi Payment ID** — the payment identifier from Pi SDK
  - **Reference** — the payment reference from your init endpoint
  - **TX ID** — the blockchain transaction ID
  - Each variable can be sent as a **Body field**, **Query param**, or **URL path** segment
  - You set the key name (e.g. `paymentId`, `ref`, `id` — whatever your backend expects)
- **Extra Body** — optional static JSON fields merged into the request body

### Response Mapping

| Field | Description |
|-------|-------------|
| Reference Path | Dot-notation path to extract reference from init response (e.g. `data.reference`) |
| Status Path | Dot-notation path to extract status from verify response (e.g. `data.status`) |

## Payment Flow

```
1. User writes init payload JSON and clicks "Pay with Pi"
2. POST init route with raw JSON → extract reference via Response Mapping
3. Pi SDK opens payment dialog
4. onReadyForServerApproval → call Approve endpoint with mapped variables
5. User approves in Pi app
6. onReadyForServerCompletion → call Complete endpoint with mapped variables
7. Call Verify endpoint with mapped variables → extract status
```

## Saved Configs

Configs are saved to `localStorage`. Click "Save Config" to store the current form state. Click a config chip to load it. Click × to delete. All endpoint configs, variable mappings, and init payload are saved.
