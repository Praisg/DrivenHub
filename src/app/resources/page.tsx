import { getResources } from '@/lib/data';
import { ResourceCard } from '@/components';

export default function ResourcesPage() {
  const resources = getResources();
  
  // Group resources by type
  const videos = resources.filter(r => r.kind === 'video');
  const podcasts = resources.filter(r => r.kind === 'podcast');
  const docs = resources.filter(r => r.kind === 'doc');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Resources</h1>
      </div>

      {/* Intro */}
      <div className="mb-8">
        <p className="text-lg text-gray-600">
          Recordings (Vimeo), Podcasts (Libsyn), and handouts—just click and go.
        </p>
      </div>

      {/* Videos Section */}
      {videos.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">🎥</span>
            Video Recordings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </div>
      )}

      {/* Podcasts Section */}
      {podcasts.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">🎧</span>
            Podcast Episodes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {podcasts.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </div>
      )}

      {/* Documents Section */}
      {docs.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">📄</span>
            Documents & Downloads
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {docs.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {resources.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No resources available</h3>
          <p className="text-gray-600">Check back soon for new content!</p>
        </div>
      )}
    </div>
  );
}
