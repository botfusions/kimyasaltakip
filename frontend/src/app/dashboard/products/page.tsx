import { Metadata } from "next";
import ProductsManagementClient from "../../../components/products/ProductsManagementClient";

export const metadata: Metadata = {
  title: "Ürün Yönetimi | Kimyasal Takip",
  description: "Üretilen ürünleri yönetin",
};

export default function ProductsPage() {
  return <ProductsManagementClient />;
}
