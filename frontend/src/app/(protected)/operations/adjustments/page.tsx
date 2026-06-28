"use client";
import OperationPage from '../../../../components/OperationPage';
export default function AdjustmentsPage() {
    // Assuming adjustments happen within a single location. We capture 'sourceLocation' as the location.
    return <OperationPage type="Adjustment" title="Stock Adjustments" description="Update physical stock counts." requireSource={true} requireDest={false} />;
}
