import { Metadata } from 'next';
import MaterialsManagementClient from '@/components/materials/MaterialsManagementClient';

export const metadata: Metadata = {
    title: 'Malzeme Yönetimi | Kimyasal Takip',
    description: 'Ham madde, kimyasal ve sarf malzemelerini yönetin',
};

export default function MaterialsPage() {
    return <MaterialsManagementClient />;
}
