# 📡 FA Meeting Manager — Developer REST API Documentation

Comprehensive API documentation for integrating, querying, and managing Financial Advisory Meeting & Document prompt templates in **FA Meeting Manager**.

---

## 🌐 Base URLs

| Environment | Base URL |
|---|---|
| **Production** | `https://fameetingmanager.futuresolutionsai.com/api/v1` |
| **Local Development** | `http://localhost:3005/api/v1` |

> ℹ️ **Authentication Note**: All `/api/v1/*` developer endpoints are accessible programmatically for internal services, AI generation pipelines, and integrations without requiring a browser session.

---

## 🏷️ Standard Internal ID Reference

Every template possesses both an immutable database `UUID` and a human-readable `internalId`. You can query templates using **either identifier**.

### 📄 Document Templates (`type="Document"`)
| Internal ID | Template Name | Category | Default Sections |
|---|---|---|---|
| `DOC-001` | **Wealth Product Comparison** | Wealth | 52 |
| `DOC-002` | **Fact Find Document** | Wealth | 6 |
| `DOC-003` | **Letter of Authority Policy Analysis** | Wealth | 15 |
| `DOC-004` | **Annual Review Letter** | Wealth | 10 |
| `DOC-005` | **Vulnerability Assessment Check** | Wealth | 6 |
| `DOC-006` | **Client Proposal Letter** | Wealth | 5 |

### 🎙️ Meeting Templates (`type="Meeting"`)
| Internal ID | Template Name | Category | Available Tiers |
|---|---|---|---|
| `MTG-001` | **Review** | Wealth | `standard`, `complex` |
| `MTG-002` | **Advice Presentation** | Wealth | `standard`, `complex` |
| `MTG-003` | **Onboarding** | Wealth | `standard` |
| `MTG-004` | **Initial Strategy** | Wealth | `standard` |
| `MTG-005` | **Ad Hoc Meeting** | Wealth | `standard` |
| `MTG-006` | **Initial Consultation** | Wealth | `standard` |
| `MTG-007` | **Fact Find** | Wealth | `standard` |
| `MTG-008` | **General Summary** | Wealth | `standard` |
| `MTG-009` | **Statement of Advice** | Wealth | `standard` |

---

## 🚀 Endpoints

### 1. List Templates (`GET /templates`)
Fetch all templates with their metadata, available tiers, and section counts.

* **Method**: `GET`
* **Path**: `/api/v1/templates`
* **Query Parameters**:

| Parameter | Type | Required | Description | Example |
|---|---|---|---|---|
| `type` | string | No | Filter by `'Document'` or `'Meeting'` | `?type=Document` |
| `category` | string | No | Filter by category (`'Wealth'`, `'Mortgages'`, `'Protection'`) | `?category=Wealth` |
| `search` | string | No | Search keyword in template name or internal ID | `?search=comparison` |

#### Example Request (cURL):
```bash
curl -X GET "https://fameetingmanager.futuresolutionsai.com/api/v1/templates?type=Document"
```

#### Example Response (200 OK):
```json
{
  "success": true,
  "count": 6,
  "templates": [
    {
      "id": "f5f04006-ce28-4c0b-b347-a8e13b42af3e",
      "internalId": "DOC-001",
      "name": "Wealth Product Comparison",
      "type": "Document",
      "category": "Wealth",
      "scope": "Company",
      "icon": "📊",
      "tiers": ["standard"],
      "sectionCount": 52,
      "updatedAt": "2026-09-02T09:47:06.514Z",
      "endpoint": "/api/v1/templates/DOC-001"
    }
  ]
}
```

---

### 2. Get Template Details & Prompts (`GET /templates/:id`)
Retrieve the full structured template, including global AI instructions, section tree, guidance directives, and compliance checklists.

* **Method**: `GET`
* **Path**: `/api/v1/templates/:id`
* **URL Parameter**:
  * `:id` — The template's **`internalId`** (e.g. `DOC-001`) OR database **`UUID`**.
* **Query Parameters**:

| Parameter | Type | Required | Description | Example |
|---|---|---|---|---|
| `tier` | string | No | Complexity tier: `'simple'`, `'standard'`, or `'complex'` (defaults to `'standard'`) | `?tier=complex` |

#### Example Request (cURL):
```bash
curl -X GET "https://fameetingmanager.futuresolutionsai.com/api/v1/templates/DOC-001"
```

#### Example Response (200 OK):
```json
{
  "success": true,
  "template": {
    "id": "f5f04006-ce28-4c0b-b347-a8e13b42af3e",
    "internalId": "DOC-001",
    "name": "Wealth Product Comparison",
    "type": "Document",
    "category": "Wealth",
    "scope": "Company",
    "icon": "📊",
    "activeTier": "standard",
    "availableTiers": ["standard"],
    "globalInstructions": [
      "Follow UK wealth management terminology and jurisdiction conventions.",
      "Format numerical currency in GBP (£) with appropriate precision.",
      "Ensure all compliance, fee disclosures, and risk warnings are explicitly captured."
    ],
    "sections": [
      {
        "title": "Cover Page",
        "type": "standard",
        "guidance": "Wealth Product Comparison\n\nPrepared for: [CLIENT NAME(S)]...",
        "contentToInclude": [],
        "subsections": []
      },
      {
        "title": "Pension Comparison [CONDITIONAL]",
        "type": "table",
        "guidance": "Create a comparison table with one column for the current scheme...",
        "contentToInclude": [
          "Provider Name",
          "Product Name",
          "Fund Charges (OCF)",
          "Platform Fee",
          "Total Estimated Fees p.a."
        ],
        "subsections": []
      }
    ],
    "sectionCount": 52,
    "updatedAt": "2026-09-02T09:47:06.514Z"
  }
}
```

---

### 3. Programmatic Import / Create (`POST /templates`)
Import one or multiple new document or meeting templates directly into the database.

* **Method**: `POST`
* **Path**: `/api/v1/templates`
* **Headers**: `Content-Type: application/json`
* **Payload**: Accepts either a single template object or an array of template objects `[...]`.

#### Example Request Payload:
```json
[
  {
    "name": "Mortgage & Protection Suitability Report",
    "internalId": "DOC-007",
    "type": "Document",
    "category": "Mortgages",
    "scope": "Company",
    "icon": "🏠",
    "data": {
      "globalInstructions": [
        "Follow UK FCA Consumer Duty regulations and mortgage advice disclosure rules.",
        "Ensure all monetary figures are formatted in GBP (£)."
      ],
      "sections": [
        {
          "title": "1. Executive Summary & Client Circumstances",
          "type": "standard",
          "guidance": "Document the client's current borrowing objectives, deposit source, and target completion date.",
          "contentToInclude": [
            "Client names and current property status",
            "Borrowing requirements and target loan amount",
            "Loan-to-value (LTV) percentage"
          ],
          "subsections": []
        },
        {
          "title": "2. Recommended Product & Cost Schedule",
          "type": "table",
          "guidance": "Provide tabular comparison of the recommended mortgage lender, interest rate, monthly repayment, and fees.",
          "contentToInclude": [
            "Lender name and product code",
            "Initial fixed interest rate and follow-on SVR",
            "Monthly repayment (£)",
            "Lender arrangement and valuation fees"
          ],
          "subsections": []
        }
      ]
    }
  }
]
```

#### Example Response (200 OK):
```json
{
  "success": true,
  "message": "Successfully imported 1 template(s).",
  "imported": [
    {
      "id": "8a7d11f2-51bc-4b30-9b33-e60d3c647491",
      "internalId": "DOC-007",
      "name": "Mortgage & Protection Suitability Report",
      "type": "Document"
    }
  ]
}
```

---

## 💻 Integration Code Examples

### 🟢 JavaScript / TypeScript (Node.js & Fetch)
```typescript
// Fetch all Document templates
async function getDocumentTemplates() {
  const res = await fetch('https://fameetingmanager.futuresolutionsai.com/api/v1/templates?type=Document');
  const data = await res.json();
  console.log('Available Document Templates:', data.templates);
}

// Fetch full prompt for a specific template
async function getTemplatePrompt(templateId: string, tier = 'standard') {
  const res = await fetch(`https://fameetingmanager.futuresolutionsai.com/api/v1/templates/${templateId}?tier=${tier}`);
  const { template } = await res.json();
  
  console.log(`Template: ${template.name}`);
  console.log('Global Instructions:', template.globalInstructions);
  console.log('Sections:', template.sections);
  return template;
}
```

### 🐍 Python (`requests`)
```python
import requests

BASE_URL = "https://fameetingmanager.futuresolutionsai.com/api/v1"

# 1. List all templates
response = requests.get(f"{BASE_URL}/templates", params={"type": "Document"})
templates = response.json().get("templates", [])
for t in templates:
    print(f"[{t['internalId']}] {t['name']} ({t['sectionCount']} sections)")

# 2. Get full details of LOA Policy Analysis
loa_response = requests.get(f"{BASE_URL}/templates/DOC-003")
loa_template = loa_response.json().get("template", {})
print("Global Instructions:", loa_template.get("globalInstructions"))
```

---

## 🛡️ Error Handling

The API returns standard HTTP status codes:

| Status Code | Reason | Example Response |
|---|---|---|
| `200 OK` | Success | `{ "success": true, ... }` |
| `400 Bad Request` | Missing required fields / Invalid format | `{ "success": false, "error": "Invalid request payload" }` |
| `404 Not Found` | Template identifier does not exist | `{ "success": false, "error": "Template with identifier 'DOC-999' not found." }` |
| `500 Server Error` | Unexpected server failure | `{ "success": false, "error": "Internal database error" }` |