import DonationSuccessClient from "./DonationSuccessClient";
import { getPageSeoMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return getPageSeoMetadata({
    slug: "donation/success",
    fallbackTitle: "Donation Successful",
    fallbackDescription: "Your donation payment was successful.",
    fallbackCanonical: "/donation/success",
    fallbackOpenGraphUrl: "/donation/success",
  });
}

export default function DonationSuccessPage() {
  return <DonationSuccessClient />;
}
