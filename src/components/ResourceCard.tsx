import { getProviderIcon, getProviderName, ResourceProvider } from '@/lib/resources';
import Card from './Card';
import Badge from './Badge';

interface ResourceCardProps {
  resource: {
    id: string;
    title: string;
    description?: string;
    url: string;
    provider?: ResourceProvider | string;
    thumbnail_url?: string;
  };
}

export default function ResourceCard({ resource }: ResourceCardProps) {
  const imageUrl = resource.thumbnail_url;
  const provider = (resource.provider || 'generic') as ResourceProvider;
  const providerIcon = getProviderIcon(provider);
  const providerName = getProviderName(provider);

  const handleClick = () => {
    window.open(resource.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card 
      className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-0 bg-white shadow-md rounded-2xl" 
      onClick={handleClick}
    >
      {/* Image/Thumbnail */}
      <div className="relative w-full aspect-video bg-gray-100 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={resource.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              if (target.parentElement) {
                target.parentElement.classList.add('flex', 'items-center', 'justify-center');
                target.parentElement.innerHTML = `
                  <div class="text-4xl opacity-40">${providerIcon}</div>
                `;
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl opacity-40">{providerIcon}</span>
          </div>
        )}
        {/* Provider badge overlay */}
        <div className="absolute top-3 right-3">
          <Badge className="bg-white/90 backdrop-blur-sm text-gray-800 border-0 shadow-sm text-[10px] uppercase tracking-wider font-bold px-2 py-0.5">
            {providerName}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
          {resource.title}
        </h3>
        
        {resource.description ? (
          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed h-10">
            {resource.description}
          </p>
        ) : (
          <div className="h-10"></div>
        )}
        
        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center text-blue-600 text-xs font-bold uppercase tracking-widest">
          View Resource
          <svg className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>
      </div>
    </Card>
  );
}
