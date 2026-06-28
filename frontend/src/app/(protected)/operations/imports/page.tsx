"use client";
import React from 'react';
import OperationPage from '../../../../components/OperationPage';

export default function ImportsPage() {
    return <OperationPage type="Import" title="Imports" description="Manage inbound sea/air freight and customs clearances." requireSource={false} requireDest={true} />;
}
