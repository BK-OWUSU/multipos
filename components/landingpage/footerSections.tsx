import {useAuthStore} from "@/store/useAuthStore";

type slug = string;

interface FooterLink {
  label: string;
  href: string;
  isExternal?: boolean; // Optional, defaults to false
}

// 2. Define the shape of a Section
interface FooterSection {
  title: string;
  links: FooterLink[];
}

export const footerSections = (slug: slug): FooterSection[] => [
  {
    title: "Features",
    links: [
      { label: "Point of Sale", href: slug ? `/${slug}/sale` : "/login" },
      { label: "Reports", href: slug ? `/${slug}/sale_summary` : "/login" },
      { label: "Products", href: slug ? `/${slug}/product_list` : "/login" },
    ],
  },
  {
    title: "Management",
    links: [
      { label: "Employees", href: slug ? `/${slug}/employees_list` : "/login" },
      { label: "Customers", href: slug ? `/${slug}/customers_base` : "/login" },
      { label: "Settings", href: slug ? `/${slug}/access_controls` : "/login" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Documentation", href: "#", isExternal: true },
      { label: "Contact Us", href: "#", isExternal: true },
      { label: "Privacy Policy", href: "#", isExternal: true },
    ],
  },
];