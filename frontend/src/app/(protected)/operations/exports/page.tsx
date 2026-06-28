"use client";
import OperationPage from '../../../../components/OperationPage';

export default function ExportsPage() {
    return <OperationPage type="Export" title="Exports" description="Manage outbound container shipments and global logistics." requireSource={true} requireDest={false} />;
}
