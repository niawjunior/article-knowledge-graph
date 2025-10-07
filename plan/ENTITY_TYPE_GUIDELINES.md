# Entity Type Guidelines

## Critical Rules for Entity Extraction

### ⚠️ ORGANIZATION Type Usage

**ONLY use "ORGANIZATION" for:**
- ✅ The main company name (NVIDIA, Apple, Microsoft, Google)
- ✅ Competitor companies
- ✅ Partner companies
- ✅ Customer companies (when they are actual organizations)

**NEVER use "ORGANIZATION" for:**
- ❌ Business segments (Data Center, Gaming, Automotive) → Use **REVENUE STREAM**
- ❌ Departments (R&D, SG&A, Marketing) → Use **CONCEPT** or specific type
- ❌ Cost centers (Research & Development, Sales) → Use **CONCEPT**
- ❌ Product lines → Use **Product** or **REVENUE STREAM**
- ❌ Divisions within the company → Use **REVENUE STREAM** or **Segment**

---

## Entity Type Mapping by Article Type

### Financial Statement

| What It Is | Correct Type | Examples |
|------------|--------------|----------|
| Company name | `ORGANIZATION` | NVIDIA, Apple |
| Total revenue | `REVENUE METRIC` | Total Revenue $35.1B |
| Business segments | `REVENUE STREAM` | Data Center, Gaming, Automotive, OEM & Other |
| Departments | `CONCEPT` | R&D, SG&A, Marketing |
| Financial metrics | `CONCEPT` | Gross Profit, Net Profit, Operating Profit |
| Time periods | `TIME PERIOD` | Q3 FY25, October 2024 |
| Customer groups | `CUSTOMER SEGMENT` | Enterprise, Consumer |
| Geographic regions | `GEOGRAPHIC MARKET` | North America, APAC |

### Revenue Analysis

| What It Is | Correct Type | Examples |
|------------|--------------|----------|
| Company name | `ORGANIZATION` | NVIDIA, Salesforce |
| Total revenue | `REVENUE METRIC` | Total Revenue, ARR, MRR |
| Business segments | `REVENUE STREAM` | Data Center, Gaming, Cloud Services |
| Products | `Product` | GeForce RTX, Tesla V100 |
| Services | `Service` | Cloud Computing, Support Services |
| Customer types | `Segment` or `CUSTOMER SEGMENT` | Enterprise, SMB, Consumer |
| Sales channels | `Channel` | Direct Sales, Partners, Online |
| Markets | `Market` or `GEOGRAPHIC MARKET` | North America, Europe |
| Metrics | `CONCEPT` | Growth rate, ARPU, Churn rate |

### Investment Analysis

| What It Is | Correct Type | Examples |
|------------|--------------|----------|
| Target company | `Company` | Startup Inc, Tech Corp |
| Investor | `Investor` | Sequoia Capital, a16z |
| VC/PE firm | `Fund` | Sequoia Fund X |
| Valuation | `Valuation` | $1B valuation |
| Investment round | `Round` | Series A, Series B |

### Security Incident

| What It Is | Correct Type | Examples |
|------------|--------------|----------|
| Victim company | `Victim` or `ORGANIZATION` | Acme Corp |
| Attacker | `Attacker` or `ThreatActor` | APT28, Lazarus Group |
| Vulnerability | `Vulnerability` | CVE-2024-1234 |
| Malware | `Malware` | Ransomware, Trojan |
| System | `System` | Email Server, Database |

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Treating Departments as Organizations
```
WRONG:
- name: "Research & Development"
  type: "ORGANIZATION"

CORRECT:
- name: "Research & Development"
  type: "CONCEPT"
  description: "R&D department expenses"
```

### ❌ Mistake 2: Treating Business Segments as Organizations
```
WRONG:
- name: "Data Center"
  type: "ORGANIZATION"

CORRECT:
- name: "Data Center"
  type: "REVENUE STREAM"
  description: "Data Center business segment generating $30.8B"
```

### ❌ Mistake 3: Treating Cost Centers as Organizations
```
WRONG:
- name: "Sales, General & Administrative"
  type: "ORGANIZATION"

CORRECT:
- name: "Sales, General & Administrative"
  type: "CONCEPT"
  description: "SG&A operating expenses of $0.9B"
```

### ❌ Mistake 4: Treating Product Lines as Organizations
```
WRONG:
- name: "OEM & Other"
  type: "ORGANIZATION"

CORRECT:
- name: "OEM & Other"
  type: "REVENUE STREAM"
  description: "OEM and other revenue segment"
```

---

## Validation Checklist

Before finalizing entity extraction, verify:

- [ ] Is "ORGANIZATION" only used for actual company names?
- [ ] Are business segments marked as "REVENUE STREAM"?
- [ ] Are departments/cost centers marked as "CONCEPT"?
- [ ] Are financial metrics marked as "CONCEPT" or "REVENUE METRIC"?
- [ ] Are time periods marked as "TIME PERIOD"?
- [ ] Do all entity types match the columnOrder in visualization-config.ts?

---

## Quick Reference: NVIDIA Example

Given: "NVIDIA reported revenue of $35.1B. Data Center generated $30.8B. R&D expenses were $3.4B."

**Correct Extraction:**
```json
{
  "entities": [
    {
      "name": "NVIDIA",
      "type": "ORGANIZATION"
    },
    {
      "name": "Total Revenue",
      "type": "REVENUE METRIC"
    },
    {
      "name": "Data Center",
      "type": "REVENUE STREAM"
    },
    {
      "name": "Research & Development",
      "type": "CONCEPT"
    }
  ]
}
```

**Wrong Extraction:**
```json
{
  "entities": [
    {
      "name": "NVIDIA",
      "type": "ORGANIZATION"
    },
    {
      "name": "Data Center",
      "type": "ORGANIZATION"  // ❌ WRONG!
    },
    {
      "name": "Research & Development",
      "type": "ORGANIZATION"  // ❌ WRONG!
    }
  ]
}
```

---

## When to Update This Guide

Update this guide when:
1. Adding a new article type
2. Adding new entity types to columnOrder
3. Discovering new extraction mistakes
4. Changing visualization requirements

Always ensure article-types.ts prompts match this guide!
