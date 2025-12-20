import { getProviderIcon, getProviderName, ResourceProvider } from '@/lib/resources';
import Card from './Card';
import Button from './Button';
import Badge from './Badge';

interface ResourceCardProps {
  resource: {
    id: string;
    title: string;
    description?: string;
    url: string;
    provider?: ResourceProvider | string;
    cover_image_url?: string;
    thumbnail_url?: string;
    category?: {
      id: string;
      name: string;
    };
  };
}

export default function ResourceCard({ resource }: ResourceCardProps) {
  const imageUrl = resource.cover_image_url || resource.thumbnail_url;
  const provider = (resource.provider || 'generic') as ResourceProvider;
  const providerIcon = getProviderIcon(provider);
  const providerName = getProviderName(provider);

  const handleClick = (e: React.MouseEvent) => {
    // Don't open if clicking on the button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    window.open(resource.url, '_blank', 'noopener,noreferrer');
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(resource.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden" onClick={handleClick}>
      {/* Image/Thumbnail */}
      <div className="relative w-full aspect-video bg-gray-200 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={resource.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to placeholder on error
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              if (target.parentElement) {
                target.parentElement.innerHTML = `
                  <div class="w-full h-full flex items-center justify-center bg-gray-100">
                    <span class="text-4xl">${providerIcon}</span>
                  </div>
                `;
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <span className="text-4xl">{providerIcon}</span>
          </div>
        )}
        {/* Provider badge overlay */}
        <div className="absolute top-2 right-2">
          <Badge variant="default" className="bg-black/70 text-white text-xs">
            {providerName}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category badge */}
        {resource.category && (
          <div className="mb-2">
            <Badge variant="default" className="text-xs">
              {resource.category.name}
            </Badge>
          </div>
        )}

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {resource.title}
        </h3>
        
        {/* Description */}
        {resource.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {resource.description}
          </p>
        )}
        
        {/* Open button */}
        <Button
          onClick={handleButtonClick}
          variant="primary"
          size="sm"
          className="w-full"
        >
          Open Resource
        </Button>
      </div>
    </Card>
  );
}
