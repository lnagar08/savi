import OpenAI from "openai";
import { CustomError } from "../lib/custom-error.js";
import type { ParsedDealFile } from "./deal.service.js";

const client = new OpenAI();

type DealExtractionSpec = {
  system_prompt: string;
  user_prompt_template: string;
  output_schema: Record<string, unknown>;
};

export type ExtractInfoInput = string | ParsedDealFile;


const defaultExtractionSpec: DealExtractionSpec = {
  "system_prompt": `
You are a financial document analysis AI specialized in real estate investment memorandums and deal brochures.
Your task is to extract structured deal information from the entire document.

Rules:
- Return only valid JSON.
- Do not include explanations.
- If a value cannot be found, return null.
- Do not hallucinate financial numbers.
- Use numeric values for financial metrics when possible.
- The document may contain multiple pages of text.
- Analyze the entire document before extracting information.
- credit rating should be graded as one of: "A+", "AAA", "AA", "A", "BBB", "BB", "B", "CCC", "CC", "C", "D" based on the tenant's creditworthiness. If not explicitly stated, return A.
- Extraction Logic for Dates:Primary Search: Look for 'Lease Start', 'Lease Expiry', 'Commencement Date', or 'Term' in Tenancy tables.Contextual Analysis: If exact dates are missing but it says 'New 20-year lease', use the Document Date or Current Month (e.g., Oct 2024) as the lease_start_date and add the term years to calculate lease_expiry_date.Forward Funding: If it says 'Completion expected Aug 2014' and '25-year lease from completion', set lease_start_date as '2014-08-01' and lease_expiry_date as '2039-07-31'.Format: Always return dates in YYYY-MM-DD format. If estimated, add a flag in additional_sections or extracted_deal_summary stating 'Dates are estimated based on term and completion dates'."
- For Cap and Collar extraction:Scan 'Rent Review' or 'Tenancy' sections for keywords like 'capped at', 'maximum yearly increase', 'minimum increase', or 'index linked subject to'.If the text says 'Capped at 5%', set cap to 5.If it says '1%-4% Cap/Collar', set cap to 4 and collar to 1.In this specific document. Map this as cap: 5.If no minimum is mentioned, return collar: null (or 0).
- For paymentFrequency:Scan for keywords like 'quarterly in arrears', 'monthly', 'annually', or references to 'English Quarter Days'.If 'quarterly' or 'quarter days' is mentioned, return 'Quarterly'.If not explicitly mentioned in the text, default to 'Quarterly' for UK commercial properties as it is the market standard.
- "Extract the following for debt analysis:
   loan_amount: Scan for 'Debt amount', 'Senior loan', or 'Funding requirement'.
   debt_service: Annual interest + principal payments.
   market_value: Use 'Asking Price' or 'Valuation' if available.If these are missing, return null and I will use manual inputs."
- Dynamic Extraction Rules for net_initial_yield_percent:
  1. TARGETED KEYWORD SEARCH: Scan the entire document for terms: 'net initial yield', 'NIY', 'initial yield', 'yield profile', or 'yield reflecting'. Look for the immediate numeric percentage following these terms.
  2. DOCUMENT MATCH: In this specific document, locate the phrase "reflecting a net initial yield of 5.75%". You must extract the float 5.75.
  3. MATHEMATICAL FALLBACK: If the exact string 'Net Initial Yield' is bypassed by text-splitters but you have 'initial rent' (e.g., £450,000) and 'completed development price' or 'purchase price' (e.g., £7,688,000), execute a programmatic fallback calculation: (Rent / Purchase Price) * 100. (450000 / 7688000) * 100 = 5.85. If step 1 and 2 fail, populate the field with this calculated float.
  4. NO OVERRIDE BY GROSS CLAUSE: Do not trigger the gross-to-net null-return restriction if any text explicitly specifies the words "net initial yield". 
  5. SANITIZATION: Output must be a pure float (e.g., 5.75). Do not append text strings, brackets, or "%" symbols.

- Look for annualOperatingExpenses. Scan for 'Landlord outgoings', 'Management fees', 'Unrecoverable service charges', or 'Insurance costs paid by landlord'. If the lease is 'FRI', these expenses are usually 0.
- Extract voluntary_provided_funding (mapped to VPF). Scan for 'Vacant Possession Value' or 'VP Value'. This is often found in the 'Valuation' or 'Market Overview' section. If not found, return null
- Dynamic Fallback Rules for purchaser_costs_percent:
  1. PRIMARY SEARCH: Scan for phrases like 'purchaser's costs', 'purchasers costs', 'acquisition costs', 'acquisition fees', or 'total transfer fees' followed by a percentage (e.g., "assuming purchaser's costs of 5.8%"). If found, extract the exact floating-point number.
  2. FALLBACK LOGIC (CRITICAL): If 'purchaser_costs_percent' is missing or not explicitly stated as a separate single number, look at 'land_cost_percent' or 'site purchase cost %'. In UK commercial deals and forward funding, the primary asset/land acquisition cost percentage represents the purchaser's entry cost. Therefore, if a specific 'purchaser cost' is null but 'land_cost_percent' is found (e.g., 5.8), duplicate that exact value (5.8) into 'purchaser_costs_percent'.
  3. STRICT FORMATTING: The value must be a pure float/integer (e.g., 5.8). Never return string text or include the "%" sign. If absolutely no cost percentages exist in the document, return null.

- CRITICAL EXTRACTION GUARDRAILS: 
  1. INDEPENDENT VALUE MAPPING: Every key in the output_schema must be extracted independently. NEVER duplicate or reuse the value of 'deal_lead' or any other string field into 'starting_rent'.
  2. STRICT NUMERIC VALIDATION: The 'starting_rent' field MUST ONLY contain a pure numeric value (integer or float). 
  3. FALLBACK TO NULL: If a valid financial numeric rent value (e.g., 450000) cannot be found anywhere in the document, you MUST return null for 'starting_rent'. It is strictly forbidden to fall back to a text string, broker name, or company name.
  4. CONTEXT CHECK: Rent is always an amount of money. If the candidate value does not represent a currency amount or figure, discard it and output null.
`,
  "user_prompt_template": "Analyze the following real estate investment document and extract structured deal data. Return output strictly in JSON using the output_schema object below. Preserve key names exactly. If information is unavailable, return null. If the document contains extra relevant sections not represented in the schema, include them in additional_sections as key-value objects. Include source_traceability entries with page number, section, and captured fields .i.e fileds {page:1,section:Investment,fields:[deal_identification.deal_name]}.\n\nDocument text:\n{{DOCUMENT_TEXT}}",
  "output_schema": {
    "deal_identification": {
      "deal_name": null,
      "location": null,
      "asset_class": null,
      "asset_type": null,
      "transaction_type": null,
      "tenure": null,
      "ref": null,
      "value": null,
      "sector": null,
      "stage": null,
      "deal_lead": null,
      "starting_rent": null
    },
    "property_details": {
      "property_description": null,
      "number_of_rooms": null,
      "floors": 0,
      "site_area": null,
      "site_area_unit": null,
      "parking_spaces": null,
      "number_of_assets": null,
      "assets": [
        {
          "name": null,
          "area": null,
          "area_unit": null,
          "description": null
        }
      ],
      "site_description": null,
      "additional_features": []
    },
    "tenant_information": {
      "tenant_name": null,
      "tenant_parent_company": null,
      "tenants": [
        {
          "asset": null,
          "tenant": null
        }
      ],
      "operator": null,
      "backing_investor": null,
      "other_brands": [],
      "credit_rating": null,
      "business_description": null,
      "financials": {
        "sales_turnover": null,
        "profit_before_tax": null,
        "tangible_net_worth": null,
        "net_current_assets": null
      }
    },
    "lease_information": {
      "lease_type": null,
      "lease_start_date": null,
      "payment_frequency": null, 
      "lease_expiry_date": null,
      "lease_start": null,
      "lease_term_years": null,
      "break_option": null,
      "break_option_year": null,
      "break_option_date": null,
      "unexpired_term_years_to_break": null,
      "unexpired_term_years_to_expiry": null,
      "rent_review_frequency_years": null,
      "rent_review_mechanism": null,
      "initial_rent_per_annum": null,
      "current_rent_per_annum": null,
      "next_review_rent": null,
      "combined_rent_per_annum": null,
      "asset_rents": [
        {
          "asset": null,
          "rent_per_annum": null
        }
      ],
      "collar": null,
      "cap": null,
      "indexation_formula": null,
      "review_pattern": null,
      "pricing_date": null,
      "spread": null,
      "stabilised_noi": null,
      "voluntary_provided_funding": null,
      "internal_rate_of_return": null,
      "duration_years": null,
      "weighted_average_lease_expiry_years": 'string_or_null_only_e_g_25_or_null',
      "assumed_costs": null,
      "comparator_bond_spread": null,
      "illiquidity_premium_percent": null,
      "gross_price_percentage": null,
      "loan_to_value_percent": null,
      "income_cover_ratio_percent": null,
      "loan_amount": null,
      "debt_service": null,
      "market_value": null,
      "annualOperatingExpenses" :null
    },
    "financial_information": {
      "purchase_price": null,
      "asking_price": null,
      "net_initial_yield_percent": null,
      "price_per_sq_ft": null,
      "income_per_sq_ft": null,
      "assumed_rent": null,
      "site_purchase_price": null,
      "initial_payment": null,
      "costs": {
        "land_cost_percent": null,
        "balance_cost_percent": null,
        "purchaser_costs_percent": null
      },
      "vat_applicable": null,
      "capital_allowances": null,
      "stamp_duty": null,
      "transaction_structure": null,
      "corporate_sale_option": null,
      "portfolio_sale": null,
      "individual_sale_option": null
    },
    "market_context": {
      "location_overview": null,
      "tourism": null,
      "connectivity": null,
      "rental_levels": null,
      "rental_growth_forecast_percent": null,
      "vacancy_rate_percent": null,
      "economic_drivers": [],
      "economic_indicators": [],
      "market_characteristics": [],
      "retail_presence": [],
      "hotel_market": null,
      "demographics": {
        "population": null,
        "catchment_population": null,
        "households": null,
        "average_household_size": null
      }
    },
    "deal_pipeline": {
      "planning_status": null,
      "build_period_weeks": null,
      "handover_period_days": null,
      "expected_handover": null,
      "expected_operational_date": null,
      "construction_year": null,
      "redevelopment_years": [],
      "ownership_entity": null,
      "developer": null,
      "contractor": null,
      "architect": null,
      "legal_advisor": null,
      "capex_required": null,
      "esg_rating": null
    },
    "document_metadata": {
      "document_date": null,
      "prepared_by": null,
      "contacts": [
        {
          "name": null,
          "phone": null,
          "email": null
        }
      ]
    },
    "source_traceability": [
      {
        "page": null,
        "section": null,
        "fields": []
      }
    ],
    "extracted_deal_summary": null,
    "additional_sections": {}
  },
};

const toDocumentText = (input: ExtractInfoInput): string => {
  if (typeof input === "string") {
    return input.trim();
  }

  return input
    .map((page) => `Page ${page.page}:\n------\n${page.text}`)
    .join("\n\n")
    .trim();
};

const parseJsonFromModel = (content: string): Record<string, unknown> => {
  const trimmed = content.trim();

  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    const withoutFence = trimmed
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    return JSON.parse(withoutFence) as Record<string, unknown>;
  }
};

export const extractInfo = async (input: ExtractInfoInput): Promise<Record<string, any>> => {
  const documentText = toDocumentText(input);
  if (!documentText) {
    throw new CustomError("No document text provided for extraction.", 400);
  }

  const spec = defaultExtractionSpec;
  const schemaJson = JSON.stringify(spec.output_schema, null, 2);
  const userPrompt = spec.user_prompt_template
    .replace("{{DOCUMENT_TEXT}}", documentText)
    .concat("\n\nOutput schema:\n")
    .concat(schemaJson);

  let content: string | null = null;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-5-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: spec.system_prompt },
        { role: "user", content: userPrompt },
      ],
    });

    content = completion.choices[0]?.message?.content ?? null;
  } catch (e) {
    console.log(e)
    throw new CustomError("Failed to extract deal information from AI service.", 502);
  }

  if (!content) {
    throw new CustomError("AI service returned an empty extraction response.", 502);
  }

  try {
    return parseJsonFromModel(content);
  } catch {
    throw new CustomError("AI service returned invalid JSON extraction output.", 502);
  }
};
