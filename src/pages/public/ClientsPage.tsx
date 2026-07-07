import React from 'react';
import { PublicPageLayout } from './PublicPageLayout';
import { usePublicFooterPage } from '../../hooks/usePublicFooterPage';
import { resolveImageUrl } from '../home/utils';

export const ClientsPage: React.FC = () => {
  const { data, loading, error } = usePublicFooterPage('clients');

  return (
    <PublicPageLayout
      title="Our Clients"
      subtitle="Trusted by leading organisations across industries"
      accentColor="#6366f1"
      loading={loading}
      error={error}
    >
      {data.length === 0 ? (
        <p className="text-center text-gray-400 py-16">No clients listed yet.</p>
      ) : (
        <>
          <p className="text-center text-gray-500 text-sm mb-8">
            {data.length} client{data.length !== 1 ? 's' : ''} trust us
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {data.map((client) => (
              <a
                key={client.id}
                href={client.url || undefined}
                target={client.url ? '_blank' : undefined}
                rel="noopener noreferrer"
                className={`flex flex-col items-center justify-center p-5 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group ${
                  client.url ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                {client.image ? (
                  <img
                    src={resolveImageUrl(client.image)}
                    alt={client.title || 'Client'}
                    className="h-14 w-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
                  />
                ) : (
                  <div className="h-14 w-full flex items-center justify-center bg-indigo-50 rounded-xl">
                    <span className="text-xs font-bold text-indigo-400 text-center px-2 leading-tight">
                      {client.title}
                    </span>
                  </div>
                )}
                {client.title && client.image && (
                  <p className="mt-3 text-xs text-center text-gray-500 font-medium line-clamp-2">{client.title}</p>
                )}
              </a>
            ))}
          </div>
        </>
      )}
    </PublicPageLayout>
  );
};
