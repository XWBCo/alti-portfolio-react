'use client';

import type { ClientInfo } from '@/lib/client-assessment-types';

interface ClientProfileCardProps {
  client: ClientInfo;
}

export default function ClientProfileCard({ client }: ClientProfileCardProps) {
  const fields = [
    { label: 'Family/Organization', value: client.family },
    { label: 'Client Name', value: client.client },
    { label: 'Advisor', value: client.advisor },
    { label: 'Portfolio Value', value: client.portfolioValue },
    { label: 'Location', value: client.location },
    { label: 'Entity Structure', value: client.entityStructure },
  ];

  return (
    <div className="bg-white border border-[#e6e6e6] rounded p-6">
      <h3
        className="text-[16px] font-light text-[#010203] mb-4"
        style={{ fontFamily: 'Georgia, serif' }}
      >
        Client Profile
      </h3>
      <div className="grid grid-cols-3 gap-6">
        {fields.map((field) => (
          <div key={field.label}>
            <p className="text-[11px] text-[#757575] uppercase tracking-wide mb-1">
              {field.label}
            </p>
            <p className="text-[15px] font-medium text-[#010203]">
              {field.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
