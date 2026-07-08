import type { Request, Response } from "express";
import { CustomError } from "../lib/custom-error.js";
import { prisma } from "../lib/prisma.js";
import { extractDealFileContent } from "../services/deal.service.js";
//import { exportPdfPagesAsImages } from "../services/pdfExtractImage.js";
import { extractInfo } from "../services/openai.service.js";
//import fs from "node:fs/promises";
import { Prisma } from "../generated/prisma/client.js";
//import path from "node:path";
import { AuthenticatedRequest } from '../types/express.js';

export const createDeal = async (req: Request, res: Response) => {
   const {
    name,
    fileUrl,
    publicId,
    fileName,
    fileSize,
    fileType,
    extension,
  } = req.body;
  //const file = req.file;
  if (!name) throw new CustomError("Deal name is required", 400);
  //if (!file) throw new CustomError("Deal document is required", 400);

  const toDate = (value?: string | null): Date | null => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  //const filename = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_').replace(/_+/g, '_')}`;

  const cleanNumber = (val: any): number | null => {
    if (!val || typeof val !== 'string') return null;
    const cleaned = val.replace(/[£,$\s]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  };

  // save file to disk 
  //import('fs').then(fs => {
  //  if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
  //  fs.writeFileSync(`./uploads/${filename}`, file.buffer);
  //})

const pages = await extractDealFileContent(fileUrl, extension);
const data = await extractInfo(pages)

//const extractedFiles = await exportPdfPagesAsImages(`./uploads/${filename}`);
//console.log(extractedFiles);
//return;
  // const data = await fs.readFile('./data_1775557225509.json', 'utf-8').then(JSON.parse)
  // return res.send(data)

  const {
    deal_identification,
    property_details,
    tenant_information,
    lease_information,
    financial_information,
    market_context,
    deal_pipeline,
    source_traceability,
    extracted_deal_summary,
    additional_sections,
    document_metadata,
  } = data;
  
  const sourceTraceabilityRows = Array.isArray(source_traceability)
    ? source_traceability.map((item: { page: number; section?: string | null; fields?: string[] }) => ({
      page: item.page,
      section: item.section ?? null,
      fields: Array.isArray(item.fields) ? item.fields : [],
    }))
    : [];

  const additionalInfoRows = [
    ...(additional_sections && typeof additional_sections === "object"
      ? Object.entries(additional_sections).map(([key, value]) => ({ key, value: value ?? {} }))
      : []),
    ...(document_metadata && typeof document_metadata === "object"
      ? [{ key: "document_metadata", value: document_metadata }]
      : []),
  ];
  const deal = await prisma.deal.create({
    data: {
      userId: Number((req as AuthenticatedRequest).user!.id),
      name: name,
      assetClass: deal_identification?.asset_class ?? null,
      extracted_deal_summary: extracted_deal_summary,
      dealLead: deal_identification?.deal_lead ?? null,
      ref: deal_identification?.ref ?? null,
      location: deal_identification?.location ?? null,
      value: cleanNumber(deal_identification?.value) ?? null,
      sector: deal_identification?.sector ?? null,
      stage: deal_identification?.stage ?? null,
      tenant: tenant_information?.tenant_name ?? null,
      leaseTerm: lease_information?.lease_term_years != null ? `${lease_information.lease_term_years} years` : null,
      remainingLease: lease_information?.unexpired_term_years_to_expiry != null
        ? `${lease_information.unexpired_term_years_to_expiry} years`
        : null,
      deal_identification: {
        create: {
          deal_name: deal_identification?.deal_name ?? null,
          location: deal_identification?.location ?? null,
          asset_type: deal_identification?.asset_type ?? null,
          transaction_type: deal_identification?.transaction_type ?? null,
          tenure: deal_identification?.tenure ?? null,
          ref: deal_identification?.ref ?? null,
          value: cleanNumber(deal_identification?.value) ?? null,
          sector: deal_identification?.sector ?? null,
          stage: deal_identification?.stage ?? null,
          deal_lead: deal_identification?.deal_lead ?? null,
          starting_rent: deal_identification?.starting_rent ?? null,
        },
      },
      /*visual_assets: {
      create: {
        asset_images: { create: mapImages(visual_assets.asset_images, extractedFiles) },
        aerial_views: { create: mapImages(visual_assets.aerial_views, extractedFiles) },
        site_plans: { create: mapImages(visual_assets.site_plans, extractedFiles) },
      }
    },*/
      property_details: {
        create: {
          property_description: property_details?.property_description ?? null,
          number_of_rooms: property_details?.number_of_rooms ?? null,
          floors: property_details?.floors ?? null,
          site_area: property_details?.site_area ?? null,
          site_area_unit: property_details?.site_area_unit ?? null,
          parking_spaces: property_details?.parking_spaces ?? null,
          number_of_assets: property_details?.number_of_assets ?? null,
          assets: property_details?.assets ?? null,
          site_description: property_details?.site_description ?? null,
          additional_features: property_details?.additional_features ?? [],
          contacts: document_metadata?.contacts ?? null,
        },
      },
      tenant_information: {
        create: {
          tenant_name: tenant_information?.tenant_name ?? null,
          tenant_parent_company: tenant_information?.tenant_parent_company ?? null,
          tenants: tenant_information?.tenants ?? null,
          operator: tenant_information?.operator ?? null,
          backing_investor: tenant_information?.backing_investor ?? null,
          other_brands: tenant_information?.other_brands ?? [],
          credit_rating: tenant_information?.credit_rating ?? null,
          business_description: tenant_information?.business_description ?? null,
          financials: tenant_information?.financials ?? null,
        },
      },
      lease_information: {
        create: {
          lease_type: lease_information?.lease_type ?? null,
          lease_start_date: toDate(lease_information?.lease_start_date),
          lease_expiry_date: toDate(lease_information?.lease_expiry_date),
          lease_term_years: lease_information?.lease_term_years ?? null,
          break_option: lease_information?.break_option == null ? null : String(lease_information.break_option),
          break_option_years: lease_information?.break_option_year ?? null,
          break_option_date: toDate(lease_information?.break_option_date),
          remaining_lease:
            lease_information?.unexpired_term_years_to_expiry != null
              ? `${lease_information.unexpired_term_years_to_expiry} years`
              : null,
          collar: lease_information?.collar == null ? null : String(lease_information.collar),
          cap: lease_information?.cap == null ? null : String(lease_information.cap),
          indexation_formula: lease_information?.indexation_formula ?? null,
          review_pattern: lease_information?.review_pattern ?? null,
          pricing_date: toDate(lease_information?.pricing_date),
          spread: lease_information?.spread ?? null,
          stabllised_NOI: lease_information?.stabilised_noi ?? null,
          voluntary_provided_funding: lease_information?.voluntary_provided_funding ?? null,
          internal_rate_of_return: lease_information?.internal_rate_of_return ?? null,
          duration_years: lease_information?.duration_years !== null && lease_information?.duration_years !== undefined
          ? lease_information?.duration_years.toString()
          : null,
          weighted_average_lease_expiry_years: lease_information?.weighted_average_lease_expiry_years.toString() ?? null,
          assumed_costs: lease_information?.assumed_costs !== null && lease_information?.assumed_costs !== undefined
          ? lease_information?.assumed_costs.toString()
          : null,
          comparator_bond_spread: lease_information?.comparator_bond_spread ?? null,
          illiquidity_premium_percent: lease_information?.illiquidity_premium_percent ?? null,
          gross_price_percentage: lease_information?.gross_price_percentage ?? null,
          loan_to_value_percent: lease_information?.loan_to_value_percent ?? null,
          income_cover_ratio_percent: lease_information?.income_cover_ratio_percent ?? null,
          loan_amount: lease_information?.loan_amount !== null && lease_information?.loan_amount !== undefined
          ? lease_information?.loan_amount.toString()
          : null,
          debt_service: lease_information?.debt_service !== null && lease_information?.debt_service !== undefined
          ? lease_information?.debt_service.toString()
          : null,
          market_value: lease_information?.market_value !== null && lease_information?.market_value !== undefined
          ? lease_information?.market_value.toString()
          : null,
          annualOperatingExpenses: lease_information.annualOperatingExpenses !== null && lease_information.annualOperatingExpenses !== undefined
          ? lease_information.annualOperatingExpenses.toString()
          : null,
          payment_frequency: lease_information?.payment_frequency ?? null
          
        },
      },
      financial_information: {
        create: {
          purchase_price: cleanNumber(financial_information?.purchase_price) ?? null,
          asking_price: cleanNumber(financial_information?.asking_price) ?? null,
          net_initial_yield_percent: financial_information?.net_initial_yield_percent ?? null,
          initial_payment: cleanNumber(financial_information?.initial_payment) ?? null,
          vat_applicable: financial_information?.vat_applicable ?? null,
          site_purchase_price: cleanNumber(financial_information?.site_purchase_price) ?? null,
          transaction_structure: financial_information?.transaction_structure ?? null,
          costs: financial_information?.costs ?? null,
        },
      },
      market_context: {
        create: {
          location_overview: market_context?.location_overview ?? null,
          tourism: market_context?.tourism ?? null,
          connectivity: market_context?.connectivity ?? null,
          rental_levels: market_context?.rental_levels ?? null,
          rental_growth_forecast_percent: market_context?.rental_growth_forecast_percent ?? null,
          economic_drivers: market_context?.economic_drivers ?? [],
          economic_indicators: market_context?.economic_indicators ?? [],
          market_characteristics: market_context?.market_characteristics ?? [],
          retail_presence: market_context?.retail_presence ?? [],
          hotel_market: market_context?.hotel_market ?? null,
          demographics: market_context?.demographics ?? null,
        },
      },
      deal_pipeline: {
        create: {
          planning_status: deal_pipeline?.planning_status ?? null,
          build_period_weeks: deal_pipeline?.build_period_weeks ?? null,
          handover_period_days: deal_pipeline?.handover_period_days ?? null,
          expected_handover: deal_pipeline?.expected_handover ?? null,
          expected_operational_date: deal_pipeline?.expected_operational_date ?? null,
          construction_year: String(deal_pipeline?.construction_year) ?? null,
          redevelopment_years: deal_pipeline?.redevelopment_years ?? [],
          ownership_entity: deal_pipeline?.ownership_entity ?? null,
          developer: deal_pipeline?.developer ?? null,
          contractor: deal_pipeline?.contractor ?? null,
          architect: deal_pipeline?.architect ?? null,
          legal_advisor: deal_pipeline?.legal_advisor ?? null,
          capex_required: String(deal_pipeline?.capex_required) ?? null,
          esg_rating: deal_pipeline?.esg_rating ?? null,
        },
      },
      source_traceabilities: {
        create: sourceTraceabilityRows,
      },
      additional_infos: {
        create: additionalInfoRows,
      },
      documents: {
        create: {
          contentType: extension,
          name: fileName,
          url: fileUrl,
          userId: Number((req as AuthenticatedRequest).user!.id),
          size: fileSize,
        }
      }
    },
  });

  res.status(201).json({
    success: true,
    message: "Deal created successfully",
    data: deal,
  });
};

export const parseDeal = async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    throw new CustomError("File is required. Upload a PDF or DOCX file.", 400);
  }

  //const pages = await extractDealFileContent(file);
  //const data = await extractInfo(pages);

  res.status(200).json({
    success: true,
    message: "Deal file parsed successfully",
    //data,
  });
};



export const getDeals = async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user!;
  const {
    page: pageRaw,
    limit: limitRaw,
    search: searchRaw,
    sortBy: sortByRaw,
    sortOrder: sortOrderRaw,
  } = req.query;

  const page = Number.isInteger(Number(pageRaw)) && Number(pageRaw) > 0 ? Number(pageRaw) : 1;
  const limit = Number.isInteger(Number(limitRaw)) && Number(limitRaw) > 0
    ? Math.min(Number(limitRaw), 100)
    : 10;
  const skip = (page - 1) * limit;
  const search = typeof searchRaw === "string" ? searchRaw.trim() : "";

  const sortableFields = {
    ref: "ref",
    name: "name",
    dealLead: "dealLead",
    location: "location",
    value: "value",
    progress: "progress",
    updatedAt: "updatedAt",
  } as const;

  type SortableField = keyof typeof sortableFields;

  const sortBy: SortableField =
    typeof sortByRaw === "string" && sortByRaw in sortableFields
      ? (sortByRaw as SortableField)
      : "updatedAt";

  const sortOrder: "asc" | "desc" = sortOrderRaw === "asc" ? "asc" : "desc";

  const sortByKey = sortableFields[sortBy];

  const orderByMap = {
    ref: { ref: sortOrder },
    name: { name: sortOrder },
    dealLead: { dealLead: sortOrder },
    location: { location: sortOrder },
    value: { value: sortOrder },
    progress: { progress: sortOrder },
    updatedAt: { updatedAt: sortOrder },
  } as const;

  const orderBy = orderByMap[sortByKey];

  const omit = {
    id: true,
    deal_id: true,
    created_at: true,
    updated_at: true,
  };

  const where: Prisma.DealWhereInput = {
    userId: Number(user.id)
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { ref: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
      { sector: { contains: search, mode: "insensitive" } },
      { stage: { contains: search, mode: "insensitive" } },
      { tenant: { contains: search, mode: "insensitive" } },
      { dealLead: { contains: search, mode: "insensitive" } },
    ]
  }

  const [deals, total] = await Promise.all([
    prisma.deal.findMany({
      where,
      include: {
        documents: true,
        deal_identification: { omit },
        property_details: { omit },
        tenant_information: { omit },
        lease_information: { omit },
        financial_information: { omit },
        market_context: { omit },
        deal_pipeline: { omit },
        source_traceabilities: { omit },
        additional_infos: {
          omit: { deal_id: true, created_at: true, updated_at: true }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.deal.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    success: true,
    message: "Deals retrieved successfully",
    data: deals,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  });
};

export const getDealById = async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user!;

  const dealId = Number(req.params.id);
  if (!Number.isInteger(dealId) || dealId <= 0) {
    throw new CustomError("Invalid deal id", 400);
  }

  const omit = {
    id: true,
    deal_id: true,
    created_at: true,
    updated_at: true,
  };

  const deal = await prisma.deal.findFirst({
    where: {
      id: dealId,
      userId: Number(user.id),
    },
    include: {
      documents: {
        include: {
          user: {
            select: { name: true }
          }
        }
      },
      deal_identification: { omit },
      property_details: { omit },
      tenant_information: { omit },
      lease_information: { omit },
      financial_information: { omit },
      market_context: { omit },
      deal_pipeline: { omit },
      source_traceabilities: { omit },
      additional_infos: {
        omit: { deal_id: true, created_at: true, updated_at: true },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!deal) {
    throw new CustomError("Deal not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Deal retrieved successfully",
    data: deal,
  });
};

export const updateInputs = async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    const dealIdNum = Number(dealId);

    if (isNaN(dealIdNum)) {
        return res.status(400).json({ success: false, message: "Invalid Deal ID" });
    }
    
    const {
        startDate,
        expiryDate,
        pricingDate,
        rent,
        paymentFrequency,
        //inflationLagMonths,
        cap,
        collar,
        spread,
        purchaserCosts,
        noi,
        vpv,
        //ltv,
        comparatorBondSpread
    } = req.body;
console.log(req.body);
    const deal = await prisma.deal.findFirst({
        where: {
            id: dealIdNum,
            userId: (req as AuthenticatedRequest).user!.id,
        },
        include: {
            lease_information: true,
            financial_information: true,
            deal_identification: true,
        }
    });

    if (!deal) {
        return res.status(404).json({ success: false, message: "Deal not found" });
    }

   
    const existingFinancialInfo = await prisma.financialInformation.findUnique({
      where: { deal_id: dealIdNum },
      select: { costs: true }
    });

    const currentCosts = existingFinancialInfo?.costs 
    ? { ...(existingFinancialInfo.costs as Record<string, any>) } 
    : {};
          
    currentCosts.purchaser_costs_percent = purchaserCosts;
     
    
    const [resDeal, resLease, resIdent, resFinancial] = await prisma.$transaction([

       
        prisma.deal.update({
            where: { id: dealIdNum },
            data: {
                //inflationLagMonths: inflationLagMonths,
                noi: noi,
                vpv: vpv,
                //ltv: Number(ltv),
                comparatorBondSpread: comparatorBondSpread * 100
            }
        }),

       
        prisma.leaseInformation.update({
            where: { deal_id: dealIdNum },
            data: {
                lease_start_date: startDate,
                lease_expiry_date: expiryDate,
                pricing_date: pricingDate,
                payment_frequency: paymentFrequency,
                spread: spread.toString(),
                cap: cap.toString(),
                collar: collar.toString()
            }
        }),

        
        prisma.dealIdentification.update({
            where: { deal_id: dealIdNum },
            data: {
                starting_rent: rent,
            }
        }),

      
        prisma.financialInformation.update({
            where: { deal_id: dealIdNum },
            data: {
                costs: currentCosts
            }
        })
    ]);
      
    
    return res.status(200).json({
        success: true,
        message: "Information updated successfully",
        data: { deal: resDeal, lease: resLease, identification: resIdent, financial: resFinancial },
    });

  } catch (error) {
    console.error("Update Inputs Controller Error:", error); 
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
      data: null,
    });
  }
}

export const removeDeal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const dealIdNum = Number(id);

    if (isNaN(dealIdNum)) {
      return res.status(400).json({ success: false, message: "Invalid Deal ID" });
    }

    const deletedDeal = await prisma.deal.delete({
      where: { id: dealIdNum }
    });

    return res.status(200).json({ 
      success: true, 
      message: "Deal deleted successfully",
      data: deletedDeal 
    });

  } catch (error: any) {
    console.error("Delete Deal Error:", error);

    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: "Deal not found" });
    }
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error occurred while deleting the deal" 
    });
  }
};
