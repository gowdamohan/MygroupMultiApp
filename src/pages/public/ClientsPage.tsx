import React, { useState } from 'react';
import { PublicPageLayout } from './PublicPageLayout';
import { usePublicFooterPage } from '../../hooks/usePublicFooterPage';
import { resolveImageUrl } from '../home/utils';

const ClientLogoCard: React.FC<{
  client: { id: number; title?: string; image?: string; url?: string };
}> = ({ client }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = client.image && !imgFailed;

  const inner = (
    <>
      {showImage ? (
        <img
          src={resolveImageUrl(client.image)}
          alt={client.title || 'Client'}
          className="client-logo-tile-img h-14 w-full"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className="client-logo-tile-fallback h-14 w-full">
          {client.title || 'Client'}
        </div>
      )}
      {client.title && showImage && (
        <p className="mt-3 text-xs text-center text-slate-400 font-medium line-clamp-2">
          {client.title}
        </p>
      )}
    </>
  );

  const tileClass =
    'flex flex-col items-center justify-center p-4 rounded-2xl client-logo-tile w-full min-h-[7.5rem]';

  if (client.url) {
    return (
      <a
        href={client.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`${tileClass} hover:shadow-md transition-all duration-300 hover:-translate-y-0.5`}
      >
        {inner}
      </a>
    );
  }

  return <div className={tileClass}>{inner}</div>;
};

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
        <p className="text-center text-slate-400 py-16">No clients listed yet.</p>
      ) : (
        <>
          <p className="text-center text-slate-400 text-sm mb-8">
            {data.length} client{data.length !== 1 ? 's' : ''} trust us
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {data.map((client) => (
              <ClientLogoCard key={client.id} client={client} />
            ))}
          </div>
        </>
      )}
    </PublicPageLayout>
  );
};
