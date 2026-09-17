export const ANGONALOY_STOREFRONT_HANDLE = "angonaloy";

export function getAngonaloyCatalogApiBase(merchantSuiteUrl: string) {
  const suiteUrl = merchantSuiteUrl.replace(/\/+$/, "");

  return `${suiteUrl}/api/public/v1/${ANGONALOY_STOREFRONT_HANDLE}`;
}
