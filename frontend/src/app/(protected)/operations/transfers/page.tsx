"use client";
import OperationPage from '../../../../components/OperationPage';
export default function TransfersPage() {
    return <OperationPage type="Transfer" title="Internal Transfers" description="Move stock between internal locations." requireSource={true} requireDest={true} />;
}
