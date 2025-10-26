import Card from '../Card';

interface SlackPost {
  id: string;
  channel: string;
  author: string;
  body: string;
  dateISO: string;
}

interface SlackFeedProps {
  posts: SlackPost[];
  pinChannels?: string[];
}

export default function SlackFeed({ posts, pinChannels = [] }: SlackFeedProps) {
  const sorted = [...posts].sort((a, b) => {
    const aPinned = pinChannels.includes(a.channel);
    const bPinned = pinChannels.includes(b.channel);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    // Within same pin group, sort by date desc
    return new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime();
  });

  const items = sorted.slice(0, 5);

  if (items.length === 0) {
    return (
      <Card>
        <p className="text-gray-600">No Slack updates yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((post) => (
        <Card key={post.id} className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-blue-700 font-medium">#{post.channel}</p>
              <p className="text-sm text-gray-500">{post.author}</p>
              <p className="text-gray-800 whitespace-pre-wrap">{post.body}</p>
            </div>
            <span className="text-xs text-gray-500">
              {new Date(post.dateISO).toLocaleDateString()}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}


