import { Resource } from '@/types';
import Card from './Card';
import Button from './Button';
import Badge from './Badge';

interface ResourceCardProps {
  resource: Resource;
}

export default function ResourceCard({ resource }: ResourceCardProps) {
  const getKindIcon = () => {
    switch (resource.kind) {
      case 'video':
        return '🎥';
      case 'podcast':
        return '🎧';
      case 'doc':
        return '📄';
      default:
        return '📄';
    }
  };

  const getKindColor = () => {
    switch (resource.kind) {
      case 'video':
        return 'success';
      case 'podcast':
        return 'warning';
      case 'doc':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getKindIcon()}</span>
          <Badge variant={getKindColor() as 'default' | 'success' | 'warning' | 'error'}>
            {resource.kind.charAt(0).toUpperCase() + resource.kind.slice(1)}
          </Badge>
        </div>
        <span className="text-sm text-gray-500">{resource.provider}</span>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {resource.title}
      </h3>
      
      <p className="text-gray-700 mb-4">{resource.description}</p>
      
      <Button
        href={resource.url}
        variant="primary"
        size="sm"
        className="w-full"
      >
        Open {resource.kind === 'video' ? 'Video' : resource.kind === 'podcast' ? 'Podcast' : 'Document'}
      </Button>
    </Card>
  );
}
