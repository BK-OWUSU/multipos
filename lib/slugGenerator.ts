import { prisma } from "./dbHelper";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // remove special chars
    .replace(/\s+/g, "-")         // spaces → dash
    .replace(/-+/g, "-");         // remove duplicate dashes
}


//SLUG GENERATOR FOR BUSINESS
export async function generateUniqueBusinessSlug(name: string): Promise<string> {
    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let count =1;

    while (true) {
        const existing  = await prisma.business.findUnique({
            where: {slug}
        })
        if (!existing) break;
        slug =  `${baseSlug}-${count}`;;
        count++;
    }
    return slug;
}


/**
 * Generates a unique slug for a Shop SCOPED to a specific Business.
 */
export async function generateUniqueShopSlug(name: string, businessId: string): Promise<string> {
    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let count = 1;

    while (true) {
        // Check for uniqueness using the new composite key rule
        const existing = await prisma.shop.findUnique({
            where: {
                businessId_slug: {
                    businessId: businessId,
                    slug: slug
                }
            }
        });
        if (!existing) break;
        slug = `${baseSlug}-${count}`;
        count++;
    }
    return slug;
}