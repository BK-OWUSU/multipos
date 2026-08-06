import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/dbHelper";
import { generateNextCustomId } from "@/lib/utils";
import { SaleService } from "@/lib/services/business/sale-service";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    
    // Compute signature hash checks to prevent request spoofing
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY ?? "")
      .update(rawBody)
      .digest("hex");

    if (hash !== req.headers.get("x-paystack-signature")) {
      return NextResponse.json({ error: "Signature verification challenge failure." }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    console.log("Incoming Paystack Webhook Event Type:", event.event);

    // ── CASE A: PAYMENT IS SUCCESSFUL ──
    if (event.event === "charge.success") {
      const { reference, authorization, metadata } = event.data;
      const { saleId, shopId, businessId, employeeId } = metadata;
      
      const networkCarrier = authorization?.brand; 

      await prisma.$transaction(async (tx) => {
        const targetPayment = await tx.payment.findUnique({
          where: { reference }
        });

        if (!targetPayment || targetPayment.status === "COMPLETED") return;

        // 1. Update MoMo payment segment line status
        await tx.payment.update({
          where: { reference },
          data: {
            status: "COMPLETED",
            momoNetwork: networkCarrier ? networkCarrier.toUpperCase() : "MOMO"
          }
        });

        // 2. Set structural parent Sale instance to active state
        await tx.sale.update({
          where: { id: saleId },
          data: { status: "COMPLETED" }
        });

        // 3. Process inventory deductions safely now that payment is confirmed
        const itemsToDeduct = await tx.saleItem.findMany({
          where: { saleId }
        });

        for (const item of itemsToDeduct) {
          await tx.shopInventory.update({
            where: { shopId_productVariantId: { shopId, productVariantId: item.productVariantId } },
            data: { stock: { decrement: item.quantity } }
          });

          const stockLogCustomIdGen = await generateNextCustomId({tx, businessId, sequenceType: "STOCK_LOG", prefix: "STLG"});

          await tx.stockLog.create({
            data: {
              customId: stockLogCustomIdGen,
              productVariantId: item.productVariantId,
              employeeId,
              businessId,
              shopId,
              change: -item.quantity,
              reason: `POS Online Payment Capture Allocation - Sale: ${saleId}`
            }
          });
        }
      });
    }

    // ── CASE B: PAYMENT FAILED OR WAS ABANDONED ──
    if (event.event === "charge.failed") {
      const { metadata } = event.data;
      const { saleId, shopId, businessId, employeeId } = metadata;

      console.log(`Executing webhook automated rollback for failed sale ID: ${saleId}`);

      // Leverage our optimized transaction rollback tool
      // It handles inventory balance checks, clears the parent sale, and reverts loyalty footprints completely.
      await SaleService.rollbackCheckout(
        saleId,
        shopId,
        employeeId,
        businessId,
        "SYSTEM_WEBHOOK"
      );
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error("WEBHOOK_INGESTION_FATAL_ERROR:", error);
    return NextResponse.json({ error: "Webhook system processing dropped execution parameters." }, { status: 500 });
  }
}

// import { NextResponse } from "next/server";
// import crypto from "crypto";
// import { prisma } from "@/lib/dbHelper";
// import { generateNextCustomId } from "@/lib/utils";

// export async function POST(req: Request) {
//   try {
//     const rawBody = await req.text();
    
//     // Compute signature hash checks to prevent request spoofing
//     const hash = crypto
//       .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY ?? "")
//       .update(rawBody)
//       .digest("hex");

//     if (hash !== req.headers.get("x-paystack-signature")) {
//       return NextResponse.json({ error: "Signature verification challenge failure." }, { status: 401 });
//     }

//     const event = JSON.parse(rawBody);
//     console.log(event)

//     // return NextResponse.json({ received: true }, { status: 200 });

//     if (event.event === "charge.success") {
//       const { reference, authorization, metadata } = event.data;
//       const { saleId, shopId, businessId, employeeId } = metadata;
      
//       // Extracts telecom channel ("MTN", "Telecel", etc.)
//       const networkCarrier = authorization?.brand; 

//       await prisma.$transaction(async (tx) => {
//         // Fetch target billing line row
//         const targetPayment = await tx.payment.findUnique({
//           where: { reference }
//         });

//         if (!targetPayment || targetPayment.status === "COMPLETED") return;

//         // 1. Update MoMo payment segment line status
//         await tx.payment.update({
//           where: { reference },
//           data: {
//             status: "COMPLETED",
//             momoNetwork: networkCarrier.toUpperCase()
//           }
//         });

//         // 2. Set structural parent Sale instance to active state
//         await tx.sale.update({
//           where: { id: saleId },
//           data: { status: "COMPLETED" }
//         });

//         // 3. Process inventory deductions safely now that payment is confirmed
//         const itemsToDeduct = await tx.saleItem.findMany({
//           where: { saleId }
//         });

//         for (const item of itemsToDeduct) {
//           await tx.shopInventory.update({
//             where: { shopId_productVariantId: { shopId, productVariantId: item.productVariantId } },
//             data: { stock: { decrement: item.quantity } }
//           });

//           const stockLogCustomIdGen = await generateNextCustomId({tx,businessId, sequenceType: "STOCK_LOG",prefix: "STLG"});

//           await tx.stockLog.create({
//             data: {
//               customId: stockLogCustomIdGen ,
//               productVariantId: item.productVariantId,
//               employeeId,
//               businessId,
//               shopId,
//               change: -item.quantity,
//               reason: `POS Online Payment Capture Allocation - Sale: ${saleId}`
//             }
//           });
//         }
//       });
//     }

//     return NextResponse.json({ received: true }, { status: 200 });

//   } catch (error) {
//     console.error("WEBHOOK_INGESTION_FATAL_ERROR:", error);
//     return NextResponse.json({ error: "Webhook system processing dropped execution parameters." }, { status: 500 });
//   }
// }